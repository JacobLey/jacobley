import { createRequire } from 'node:module';
import Path from 'node:path';
import { type Directory, parseCwd } from 'parse-cwd';

const require = createRequire(import.meta.url);

export interface PackageJson {
    name: string;
    version: string;
    private?: boolean;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    workspaces?: string[];
}

/**
 * Load the top-most package.json.
 *
 * Useful when called from `node_modules` or a monorepo package
 * and the `root` package.json is not readily available.
 *
 * @param {object} [options] - options
 * @param {string|URL} [options.cwd] - directory to begin search. See `parse-cwd`
 * @returns {object|null} filePath + packageJson pair if found, null if none found
 */
export const rootPackageJson = async (options?: { cwd?: Directory }): Promise<{
    filePath: string;
    packageJson: PackageJson;
} | null> => {

    let directory = await parseCwd(options);
    let parentDirectory = Path.dirname(directory);

    const allFiles = [directory];

    while (directory !== parentDirectory) {
        allFiles.push(parentDirectory);

        directory = parentDirectory;
        parentDirectory = Path.dirname(directory);
    }

    // In future could parallel `import` json (once experimental warnings disabled)
    for (const basePath of allFiles.reverse()) {
        try {
            const filePath = Path.join(basePath, 'package.json');
            // eslint-disable-next-line import/no-dynamic-require
            const packageJson = require(filePath) as PackageJson;
            return {
                filePath,
                packageJson,
            };
        } catch {}
    }
    return null;
};
