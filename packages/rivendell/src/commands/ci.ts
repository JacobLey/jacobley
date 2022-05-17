import type { CommandModule } from 'yargs';
import { compileCi } from '../lib/compile-ci.js';
import { validateConfigFile } from './lib/index.js';

export const ci: CommandModule<{
    cwd: string;
    configFile: string | undefined;
    templateDirectory: string | undefined;
}, {
    clean: boolean;
    cwd: string;
    configFile: string | undefined;
    templateDirectory: string | undefined;
}> = {
    command: 'ci',
    describe: 'Assert CI config files are up to date',
    builder: yargs => yargs.options({
        clean: {
            describe: 'Remove existing files',
            type: 'boolean',
            default: false,
        },
    }).strict(),
    handler: async options => {

        validateConfigFile(options.configFile);

        const changed = await compileCi({
            ...options,
            dryRun: true,
        });

        if (changed.length > 0) {
            process.exitCode = 1;
            console.error('Files are not built');
        }
    },
};
