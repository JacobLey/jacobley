import type { CommandModule } from 'yargs';
import { compileCi } from '../lib/compile-ci.js';
import { validateConfigFile } from './lib/index.js';

export const compile: CommandModule<{
    cwd: string;
    configFile: string | undefined;
    templateDirectory: string | undefined;
}, {
    clean: boolean;
    cwd: string;
    configFile: string | undefined;
    dryRun: boolean;
    templateDirectory: string | undefined;
}> = {
    command: 'compile',
    describe: 'Process CI config files',
    builder: yargs => yargs.options({
        dryRun: {
            alias: 'dry-run',
            describe: 'Do not write files',
            type: 'boolean',
            default: false,
        },
        clean: {
            describe: 'Remove existing files',
            type: 'boolean',
            default: false,
        },
    }).strict(),
    handler: async options => {

        validateConfigFile(options.configFile);

        const changed = await compileCi(options);

        for (const change of changed) {
            console.info(change);
        }
    },
};
