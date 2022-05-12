import { createRequire } from 'node:module';
import Path from 'node:path';
import { globby } from 'globby';
import { patch } from 'named-patch';
import { type PackageJson, rootPackageJson } from 'root-package-json';

const require = createRequire(import.meta.url);

export interface PackageMeta {
    directory: string;
    name: string;
    packageJson: PackageJson;
}

export const listPackages = async (
    options?: Parameters<typeof rootPackageJson>[0]
): Promise<PackageMeta[]> => {

    const rootPackage = await patch(rootPackageJson)(options);

    if (!rootPackage) {
        return [];
    }

    const workspaces = rootPackage.packageJson.workspaces as string[] | undefined;

    if (!Array.isArray(workspaces)) {
        return [];
    }

    const rootPath = Path.dirname(rootPackage.filePath);

    const packages = await globby(
        workspaces.map((workspace: string) => Path.join(workspace, 'package.json')),
        { cwd: rootPath }
    );

    return packages.map(relPackagePath => {

        const packageJsonPath = Path.join(rootPath, relPackagePath);
        // eslint-disable-next-line import/no-dynamic-require
        const packageJson = require(packageJsonPath) as PackageJson;

        return {
            directory: Path.join(packageJsonPath, '..'),
            packageJson,
            name: packageJson.name as string,
        };
    });
};
