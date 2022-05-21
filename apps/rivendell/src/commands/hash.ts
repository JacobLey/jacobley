import type { PackageManager } from 'dependency-order';
import type { CommandModule } from 'yargs';
import { combineHashes } from '../lib/file-hash.js';
import { getHashes } from './lib/index.js';

export const hash: CommandModule<{
    cwd: string;
    configFile: string | undefined;
    manager: PackageManager | undefined;
}, {
    cwd: string;
    configFile: string | undefined;
    packageName: string;
    list: boolean;
    manager: PackageManager | undefined;
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

        const hashes = await getHashes(options);

        if (options.list) {
            for (const hashData of hashes) {
                console.info(`${hashData.hash} ${hashData.path}`);
            }
        } else {
            console.info(combineHashes(hashes));
        }
    },
};
