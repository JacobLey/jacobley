import { hashFile } from '../../lib/file-hash.js';
import type { GitFile } from '../../lib/git.js';

export type FileHashCache = Record<string, Promise<Awaited<ReturnType<typeof hashFile>>>>;
export const getFileHashCache = (): FileHashCache => ({});

export const getCachedHash = async (
    file: GitFile,
    cache: FileHashCache
): ReturnType<typeof hashFile> => {
    cache[file.fullPath] ??= hashFile(file);
    return cache[file.fullPath]!;
};
