import { homedir } from 'node:os';
import { type Directory, findImport } from 'find-import';

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

    const found = await findImport<PackageJson>('package.json', {
        ...options,
        direction: 'down',
        startAt: homedir(),
    });

    if (found) {
        return {
            filePath: found.filePath,
            packageJson: found.content,
        };
    }
    return null;
};
