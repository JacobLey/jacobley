import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import type { GitFile } from './git.js';

export const hashFile = async (file: GitFile): Promise<{
    path: string;
    hash: string;
}> => {

    const sha256 = createHash('sha256');
    sha256.update(`${file.relativePath}\n`, 'utf8');
    sha256.update(`${file.mode}\n`, 'utf8');
    const readStream = createReadStream(file.fullPath);
    readStream.pipe(sha256);
    await finished(readStream);
    return {
        path: file.fullPath,
        hash: sha256.digest('hex'),
    };
};

export const combineHashes = (fileHashes: {
    path: string;
    hash: string;
}[]): string => {

    const sha256 = createHash('sha256');

    for (const file of fileHashes) {
        sha256.update(`${file.path}\n`, 'utf8');
        sha256.update(`${file.hash}\n`, 'utf8');
    }

    return sha256.digest('hex');
};
