import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { loadConfig } from '../lib/config.js';
import { combineHashes, hashFile } from '../lib/file-hash.js';
import { listPackageFiles } from '../lib/list-files.js';
import { getPackageData, validateConfigFile } from './lib/index.js';

export const hash: CommandModule<{
    cwd: string;
    configFile: string | undefined;
}, {
    cwd: string;
    configFile: string | undefined;
    packageName: string;
    list: boolean;
    only: 'dev' | 'prod' | undefined;
}> = {
    command: 'hash <package-name>',
    describe: 'Deterministic hash based on package content and dependencies',
    builder: yargs => yargs.positional('packageName', {
        alias: 'package-name',
        description: 'Package to hash',
        type: 'string',
        demandOption: true,
    }).options({
        list: {
            description: 'Report hash per-file',
            type: 'boolean',
            default: false,
        },
        only: {
            description: 'Restrict to prod/dev files',
            choices: ['prod', 'dev'] as const,
        },
    }).strict(),
    handler: async options => {

        validateConfigFile(options.configFile);
        const cwd = await parseCwd(options.cwd);

        const config = await loadConfig({
            cwd,
            configFile: options.configFile,
        });

        const packageFiles = await listPackageFiles({
            cwd,
            config,
        });

        const files = getPackageData(options.packageName, packageFiles);

        const relevantFiles = files[`${options.only ?? 'all'}Files`];
        const hashes = await Promise.all(relevantFiles.map(
            async file => hashFile(file)
        ));

        if (options.list) {
            for (const hashData of hashes) {
                console.info(`${hashData.hash} ${hashData.path}`);
            }
        } else {
            console.info(combineHashes(hashes));
        }
    },
};
