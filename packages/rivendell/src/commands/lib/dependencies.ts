import { combineHashes } from '../../lib/file-hash.js';
import { type listPackageDependencies } from '../../lib/list-files.js';
import { type FileHashCache, getCachedHash } from './cached-hash.js';

export const calculateDependencies = async ({
    dependenciesData,
    fileHashCache,
    only,
    baseRef,
}: {
    dependenciesData: Awaited<ReturnType<typeof listPackageDependencies>>[string];
    fileHashCache: FileHashCache;
    only: 'all' | 'dev' | 'prod';
    baseRef: string | undefined;
}): Promise<Record<string, {
    version: string;
    dev: boolean;
    hash: string;
    changed: boolean;
}>> => {

    const output: Record<string, {
        version: string;
        dev: boolean;
        hash: string;
        changed: boolean;
    }> = {};

    for (const [dependency, dependencyData] of Object.entries(dependenciesData)) {
        if (
            (only === 'dev' && !dependencyData.dev) ||
            (only === 'prod' && dependencyData.dev)
        ) {
            continue;
        }

        const relevantFiles = dependencyData.files[`${only}Files`];
        const combinedHash = combineHashes(await Promise.all(
            relevantFiles.map(
                async file => getCachedHash(file, fileHashCache)
            )
        ));

        output[dependency] = {
            version: dependencyData.packageMeta.packageJson.version,
            dev: dependencyData.dev,
            changed: baseRef ?
                dependencyData.changed[`${only}Files`].length > 0 :
                true,
            hash: combinedHash,
        };
    }

    return output;
};
