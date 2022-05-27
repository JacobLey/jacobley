import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import Path from 'node:path';
import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { ciDirectories, loadConfig } from '../lib/index.js';

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
    describe: 'Create config file and template directory',
    handler: async options => {

        const cwd = await parseCwd(options.cwd);

        const config = await loadConfig({
            configFile: options.configFile,
            cwd,
        });

        if (config.configPath) {
            console.info({
                configPath: config.configPath,
            }, 'Config already exists, skipping creation');
        } else {
            const configPath = options.configFile ?
                Path.join(cwd, options.configFile) :
                Path.resolve(config.root, 'rivendell.json');
            await fs.writeFile(
                configPath,
                (
                    configPath.endsWith('.json') ?
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

        const templatePath = options.templateDirectory ?
            Path.resolve(cwd, options.templateDirectory) :
            config.templateDirectory;
        const templateExists = existsSync(templatePath);

        if (templateExists) {
            console.info({
                templatePath,
            }, 'Template directory already exists, skipping creation');
        } else {
            await fs.mkdir(templatePath, { recursive: true });

            for (const { ci, template } of ciDirectories) {
                const ciPath = Path.join(config.root, ci);
                const ciExists = existsSync(ciPath);
                if (ciExists) {
                    await fs.cp(
                        ciPath,
                        Path.join(templatePath, template),
                        { recursive: true }
                    );
                }
            }
        }
    },
};
