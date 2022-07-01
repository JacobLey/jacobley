import { createRequire } from 'node:module';
import Path from 'node:path';
import { globby } from 'globby';
import type { PackageMeta } from './types.js';

const require = createRequire(import.meta.url);

export const globPackages = async ({
    rootPath,
    dirGlobs,
}: {
    rootPath: string;
    dirGlobs: string | string[];
}): Promise<PackageMeta[]> => {

    const globs = Array.isArray(dirGlobs) ? dirGlobs : [dirGlobs];

    const packagePaths = await globby(
        globs.map(
            dirGlob => Path.join(dirGlob, 'package.json').replaceAll('\\', '/')
        ),
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
