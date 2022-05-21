import Path from 'node:path';
import {
    dependencyOrder,
    dependencyOrderByPackage,
    type PackageDependency,
    type PackageManager,
    type PackageMeta,
} from 'dependency-order';
import type { Config } from './config.js';
import { gitDiffFiles, type GitFile, gitTrackedFiles } from './git.js';

const packageFileFilter = ({ packageMeta, gitFiles, config }: {
    packageMeta: PackageMeta;
    gitFiles: GitFile[];
    config: Config;
}): {
    prod: GitFile[];
    dev: GitFile[];
} => {

    const prod = new Set<GitFile>();
    const dev = new Set<GitFile>();

    for (const dependency of config.dependencies) {

        if (dependency.includePackage(packageMeta.name)) {
            for (const file of gitFiles) {
                const path = dependency.root ?
                    file.relativePath :
                    Path.relative(
                        packageMeta.directory,
                        file.fullPath
                    );
                if (dependency.includePath(path)) {
                    (dependency.dev ? dev : prod).add(file);
                }
            }
        }
    }

    for (const file of prod) {
        dev.delete(file);
    }
    return {
        prod: [...prod],
        dev: [...dev],
    };
};

interface PackageFiles {
    packageMeta: PackageMeta;
    allFiles: GitFile[];
    prodFiles: GitFile[];
    devFiles: GitFile[];
}

const sortFiles = (a: GitFile, b: GitFile): number => a.relativePath.localeCompare(b.relativePath);

const chunkFiles = (params: {
    config: Config;
    cwd: string;
    gitFiles: GitFile[];
    dependencies: PackageDependency[];
}): Record<string, PackageFiles> => {

    const dependenciesByPackage = dependencyOrderByPackage(params.dependencies);

    const packageFilesMap: Record<string, ReturnType<typeof packageFileFilter>> = {};
    for (const dependency of params.dependencies) {
        packageFilesMap[dependency.packageName] = packageFileFilter({
            packageMeta: dependency.packageMeta,
            gitFiles: params.gitFiles,
            config: params.config,
        });
    }

    const packageFiles: Record<string, PackageFiles> = {};

    for (const dependency of params.dependencies) {

        const prodFilesList = [...packageFilesMap[dependency.packageName]!.prod];
        const devFilesList = [...packageFilesMap[dependency.packageName]!.dev];

        const allDependencies = [
            ...dependenciesByPackage[dependency.packageName]!.dependencies,
            ...dependenciesByPackage[dependency.packageName]!.devDependencies,
        ];
        for (const subDependency of allDependencies) {
            prodFilesList.push(
                ...packageFilesMap[subDependency]!.prod
            );
        }

        const prodFilesSet = new Set(prodFilesList);
        const devFilesSet = new Set(devFilesList);

        for (const prodFile of prodFilesSet) {
            devFilesSet.delete(prodFile);
        }

        packageFiles[dependency.packageName] = {
            packageMeta: dependency.packageMeta,
            allFiles: [...prodFilesSet, ...devFilesSet].sort(sortFiles),
            prodFiles: [...prodFilesSet].sort(sortFiles),
            devFiles: [...devFilesSet].sort(sortFiles),
        };
    }

    return packageFiles;
};

export const listPackageFiles = async (params: {
    config: Config;
    cwd: string;
    manager: PackageManager | undefined;
}): Promise<Record<string, PackageFiles>> => {

    const [gitFiles, dependencies] = await Promise.all([
        gitTrackedFiles(params),
        dependencyOrder(params),
    ]);

    return chunkFiles({
        config: params.config,
        cwd: params.cwd,
        gitFiles,
        dependencies,
    });
};

export const listChangedPackageFiles = async (params: {
    config: Config;
    cwd: string;
    packageName: string;
    baseRef: string;
    headRef: string;
    manager: PackageManager | undefined;
}): Promise<Record<string, PackageFiles>> => {

    const [gitFiles, dependencies] = await Promise.all([
        gitDiffFiles(params),
        dependencyOrder(params),
    ]);

    return chunkFiles({
        config: params.config,
        cwd: params.cwd,
        gitFiles,
        dependencies,
    });
};

export const listPackageDependencies = async (params: {
    config: Config;
    cwd: string;
    baseRef: string | undefined;
    headRef: string;
}): Promise<Record<
    string,
    Record<string, {
        packageMeta: PackageMeta;
        dev: boolean;
        files: PackageFiles;
        changed: PackageFiles;
    }>
>> => {

    const [trackedFiles, diffFiles, dependencies] = await Promise.all([
        gitTrackedFiles(params),
        params.baseRef ? gitDiffFiles({ ...params, baseRef: params.baseRef }) : [],
        dependencyOrder(params),
    ]);

    const trackedPackages = chunkFiles({
        config: params.config,
        cwd: params.cwd,
        gitFiles: trackedFiles,
        dependencies,
    });
    const diffPackages = chunkFiles({
        config: params.config,
        cwd: params.cwd,
        gitFiles: diffFiles,
        dependencies,
    });

    const result: Awaited<ReturnType<typeof listPackageDependencies>> = {};
    const dependenciesByPackage = dependencyOrderByPackage(dependencies);

    for (const dependency of dependencies) {

        const dependencyMeta: typeof result[string] = {};

        for (const subDependency of dependency.dependencies) {
            dependencyMeta[subDependency] = {
                packageMeta: dependenciesByPackage[subDependency]!.packageMeta,
                dev: false,
                files: trackedPackages[subDependency]!,
                changed: diffPackages[subDependency]!,
            };
        }
        result[dependency.packageName] = dependencyMeta;
    }

    return result;
};
