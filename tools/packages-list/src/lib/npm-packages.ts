import { createRequire } from 'node:module';
import Path from 'node:path';
import { globby } from 'globby';
import { patch } from 'named-patch';
import { rootPackageJson } from 'root-package-json';
import type { PackageMeta } from './types.js';

const require = createRequire(import.meta.url);

export const npmPackages = async (
    options?: Parameters<typeof rootPackageJson>[0]
): Promise<PackageMeta[] | null> => {

    const rootPackage = await patch(rootPackageJson)(options);

    if (!rootPackage) {
        return null;
    }

    const workspaces = rootPackage.packageJson.workspaces as string[] | undefined;

    if (!Array.isArray(workspaces)) {
        return null;
    }

    const rootPath = Path.dirname(rootPackage.filePath);

    const packagePaths = await globby(
        workspaces.map((workspace: string) => Path.join(workspace, 'package.json')),
        { cwd: rootPath }
    );

    return packagePaths.map(packagePath => {

        const packageJsonPath = Path.join(rootPath, packagePath);

        // eslint-disable-next-line import/no-dynamic-require
        const packageJson = require(packageJsonPath) as PackageMeta['packageJson'];

        return {
            directory: Path.dirname(packageJsonPath),
            packageJson,
            name: packageJson.name,
        };
    });
};
