import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { loadConfig } from '../lib/config.js';
import { listPackageDependencies } from '../lib/list-files.js';
import { calculateDependencies, getFileHashCache, getPackageData, validateConfigFile } from './lib/index.js';

export const dependencies: CommandModule<{
    cwd: string;
    configFile: string | undefined;
}, {
    cwd: string;
    configFile: string | undefined;
    packageName: string;
    baseRef: string | undefined;
    headRef: string;
    only: 'dev' | 'prod' | undefined;
}> = {
    command: 'dependencies <package-name> [base-ref] [head-ref]',
    describe: 'List dependencies + metadata of package',
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
    }).option('only', {
        description: 'Restrict to prod/dev files',
        choices: ['prod', 'dev'] as const,
    }).strict(),
    handler: async options => {

        validateConfigFile(options.configFile);
        const cwd = await parseCwd(options.cwd);

        const config = await loadConfig({
            cwd,
            configFile: options.configFile,
        });

        const packageDependencies = await listPackageDependencies({
            cwd,
            config,
            baseRef: options.baseRef,
            headRef: options.headRef,
        });

        const dependenciesData = getPackageData(options.packageName, packageDependencies);
        const only = options.only ?? 'all';

        const output = await calculateDependencies({
            dependenciesData,
            fileHashCache: getFileHashCache(),
            only,
            baseRef: options.baseRef,
        });

        console.info(JSON.stringify(output, null, 2));
    },
};
