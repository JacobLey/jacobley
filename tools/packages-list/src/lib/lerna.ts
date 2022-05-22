import { homedir } from 'node:os';
import Path from 'node:path';
import { type Directory, findImport } from 'find-import';
import { patch } from 'named-patch';
import { globPackages } from './lib/glob-packages.js';
import type { PackageMeta } from './lib/types.js';
import { npmYarn } from './npm-yarn.js';

export const lerna = async (
    options: { cwd?: Directory }
): Promise<PackageMeta[] | null> => {

    const lernaJson = await patch(findImport)<{
        packages?: string | string[];
        useWorkspaces?: boolean;
    }>('lerna.json', {
        ...options,
        direction: 'down',
        startAt: homedir(),
    });

    if (!lernaJson) {
        return null;
    }

    if (lernaJson.content.useWorkspaces) {
        return npmYarn(options);
    }

    return globPackages({
        rootPath: Path.dirname(lernaJson.filePath),
        dirGlobs: lernaJson.content.packages ?? 'packages/*',
    });
};
