import Path from 'node:path';
import { patch } from 'named-patch';
import type { Directory } from 'parse-cwd';
import { rootPackageJson } from 'root-package-json';
import { globPackages } from './lib/glob-packages.js';
import type { PackageMeta } from './lib/types.js';

export const npmYarn = async (
    options: { cwd?: Directory }
): Promise<PackageMeta[] | null> => {

    const rootPackage = await patch(rootPackageJson)(options);

    if (!rootPackage) {
        return null;
    }

    const { workspaces } = rootPackage.packageJson;

    if (!workspaces) {
        return null;
    }

    return globPackages({
        rootPath: Path.dirname(rootPackage.filePath),
        dirGlobs: workspaces,
    });
};
