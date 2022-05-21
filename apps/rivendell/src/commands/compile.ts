import type { PackageManager } from 'dependency-order';
import type { CommandModule } from 'yargs';
import { compileCi } from '../lib/compile-ci.js';
import { validateConfigFile } from './lib/index.js';

export const compile: CommandModule<{
    cwd: string;
    configFile: string | undefined;
    templateDirectory: string | undefined;
}, {
    ci: boolean;
    clean: boolean;
    cwd: string;
    configFile: string | undefined;
    dryRun: boolean;
    manager: PackageManager | undefined;
    templateDirectory: string | undefined;
}> = {
    command: ['$0', 'compile'],
    describe: 'Process CI config files',
    builder: yargs => yargs.options({
        ci: {
            describe: 'Fail if files are not up to date. Implies --dry-run',
            type: 'boolean',
            default: false,
        },
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
        manager: {
            describe: 'Package manager to use find packages',
            choices: ['npm', 'rush', 'yarn'] as const,
        },
    }).strict(),
    handler: async options => {

        validateConfigFile(options.configFile);

        const changed = await compileCi({
            ...options,
            dryRun: options.ci || options.dryRun,
        });

        if (changed.length > 0) {
            if (options.ci) {
                process.exitCode = 1;
                console.error('Files are not built');
            } else {
                for (const change of changed) {
                    console.info(change);
                }
            }
        }
    },
};
