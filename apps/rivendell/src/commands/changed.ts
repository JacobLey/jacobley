import type { PackageManager } from 'dependency-order';
import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { loadConfig } from '../lib/config.js';
import { listChangedPackageFiles } from '../lib/list-files.js';
import { getPackageData } from './lib/index.js';

export const changed: CommandModule<{
    cwd: string;
    configFile: string | undefined;
    manager: PackageManager | undefined;
}, {
    cwd: string;
    configFile: string | undefined;
    packageName: string;
    baseRef: string | undefined;
    headRef: string;
    list: boolean;
    manager: PackageManager | undefined;
    only: 'dev' | 'prod' | undefined;
}> = {
    command: 'changed <package-name> [base-ref] [head-ref]',
    describe: 'Inspect if git history has changed for dependencies',
    builder: yargs => yargs.positional('packageName', {
        alias: 'package-name',
        description: 'Package to inspect',
        type: 'string',
        demandOption: true,
    }).positional('baseRef', {
        alias: 'base-ref',
        description: 'Git ref to compare as base. Will always reports true if omitted.',
        type: 'string',
    }).positional('headRef', {
        alias: 'head-ref',
        description: 'Git ref to compare as head.',
        type: 'string',
        default: 'HEAD',
    }).options({
        list: {
            description: 'Report diff per-file',
            type: 'boolean',
            default: false,
        },
        only: {
            description: 'Restrict to prod/dev files',
            choices: ['prod', 'dev'] as const,
        },
    }).strict(),
    handler: async options => {

        if (!options.baseRef) {
            console.info('true');
            return;
        }

        const cwd = await parseCwd(options.cwd);

        const config = await loadConfig({
            cwd,
            configFile: options.configFile,
        });

        const changedFiles = await listChangedPackageFiles({
            cwd,
            packageName: options.packageName,
            config,
            baseRef: options.baseRef,
            headRef: options.headRef,
            manager: options.manager,
        });
        const files = getPackageData(options.packageName, changedFiles);

        const relevantFiles = files[`${options.only ?? 'all'}Files`];

        if (options.list) {
            for (const filePath of new Set(relevantFiles.map(f => f.fullPath))) {
                console.info(filePath);
            }
        } else {
            console.info(relevantFiles.length > 0 ? 'true' : 'false');
        }
    },
};
