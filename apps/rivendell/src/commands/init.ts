import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import Path from 'node:path';
import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { gitRoot } from '../lib/git.js';
import { validateConfigFile } from './lib/validate-config-path.js';

export const init: CommandModule<{
    cwd: string;
    configFile: string | undefined;
    templateDirectory: string | undefined;
}, {
    cwd: string;
    configFile: string | undefined;
    templateDirectory: string | undefined;
}> = {
    command: 'init',
    describe: 'Write index.ts barrel files',
    handler: async options => {

        const cwd = await parseCwd(options.cwd);

        let configFile: string;

        if (validateConfigFile(options.configFile)) {
            configFile = options.configFile;
        } else {
            const root = await gitRoot({ cwd });
            configFile = Path.relative(
                cwd,
                Path.join(root, '../rivendell.json')
            );
        }

        const configPath = Path.join(cwd, configFile);
        const templatePath = Path.resolve(cwd, options.templateDirectory ?? 'rivendell');

        const configExists = existsSync(configPath);
        const templateExists = existsSync(templatePath);

        if (configExists) {
            console.info({
                configPath,
            }, 'Config already exists, skipping creation');
        } else {
            await fs.writeFile(
                configPath,
                (
                    configFile.endsWith('.json') ?
                        [
                            '{',
                            '  "dependencies": [',
                            '    "include": ["*"],',
                            '    "paths": ["package.json"]',
                            '  ]',
                            '}',
                        ] :
                        [
                            'export default {',
                            '  dependencies: [',
                            '    include: [\'*\'],',
                            '    paths: [\'package.json\'],',
                            '  ],',
                            '};',
                        ]
                ).join('\n'),
                'utf8'
            );
        }

        if (templateExists) {
            console.info('Template directory already exists, skipping creation');
        } else {
            await fs.mkdir(templatePath, { recursive: true });

            const baseDir = await gitRoot({ cwd });
            const githubPath = Path.join(baseDir, '.github');
            const githubExists = existsSync(githubPath);
            if (githubExists) {
                await fs.cp(
                    githubPath,
                    Path.join(templatePath, '.github'),
                    { recursive: true }
                );
            }
        }
    },
};
