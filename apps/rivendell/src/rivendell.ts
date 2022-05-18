import { getHashes } from './commands/lib/get-hashes.js';
import { combineHashes } from './lib/file-hash.js';

export const hash = async (packageName: string, options?: {
    cwd?: string;
    configFile?: string | undefined;
    only?: 'dev' | 'prod' | undefined;
}): Promise<string> => {

    const hashes = await getHashes({
        ...options,
        packageName,
    });

    return combineHashes(hashes);
};
