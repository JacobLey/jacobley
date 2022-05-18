import { patch } from 'named-patch';
import { listPackages, type PackageManager, type PackageMeta } from 'packages-list';

// Re-export for convenience
export type { PackageManager, PackageMeta };

interface PackagesDict {
    [key: string]: {
        packageMeta: PackageMeta;
        dependenciesMap: PackagesDict;
        dependenciesSet: Set<string>;
        devDependenciesMap: PackagesDict;
        devDependenciesSet: Set<string>;
        stage: number;
    };
}

export interface PackageDependency {
    packageMeta: PackageMeta;
    packageName: string;
    stage: number;
    dependencies: string[];
    devDependencies: string[];
}

/**
 * List all packages in dependency order.
 *
 * Packages that occur later in results have dependencies on earlier results.
 *
 * Each package explicitly declares each package it is internally dependent on, defined via
 * `package.json`'s `dependencies`, `devDependencies`, and `optionalDependencies` (interpreted as `dependencies`).
 * These values are computed deeply, so A depends on B depends on C -> A depends on B + C.
 *
 * A dependent packages `devDependencies` will not impact `dependencies, but not vice versa.
 * e.g. A depends on B dev-depends on C -> A depends on B. A dev-depends on B depends on C -> A dev-depends on B + C.
 *
 * Note `peerDependencies` is omitted from this list,
 * as it is assumed that any usage is "inherited" by a parent package.
 * It is recommended `peerDependent` packages are also used in `devDependencies` if
 * it should explicitly impact dependency order.
 *
 * Outputted `devDependencies` and `dependencies` will have no overlap.
 *
 * For simplicity, dependency order is defined as a `stage` (0-based).
 * A packages `stage` is equal to `MAX(allDependencies.stage) + 1`.
 *
 * The results are in order of increasing `stage`, with parallel packages in alphabetical order.
 *
 * @param {object} options - see `rootPackageJson` options
 * @returns {Promise<object[]>} results in dependency order
 * @throws if circular dependency detected
 */
export const dependencyOrder = async (options?: Parameters<typeof listPackages>[0]): Promise<PackageDependency[]> => {

    const allPackages = await patch(listPackages)(options);

    // Initialize package map
    const packageMap: PackagesDict = {};
    for (const packageMeta of allPackages) {
        packageMap[packageMeta.name] = {
            packageMeta,
            dependenciesMap: {},
            dependenciesSet: new Set(),
            devDependenciesMap: {},
            devDependenciesSet: new Set(),
            stage: 0,
        };
    }

    // Populate each entry with dependencies
    for (const packageMeta of allPackages) {

        const {
            dependencies,
            devDependencies,
            optionalDependencies,
        } = packageMeta.packageJson as {
            dependencies: Record<string, string> | undefined;
            devDependencies: Record<string, string> | undefined;
            optionalDependencies: Record<string, string> | undefined;
        };
        for (const dependency of [...Object.keys(dependencies ?? {}), ...Object.keys(optionalDependencies ?? {})]) {
            const monorepoPackage = packageMap[dependency];
            if (monorepoPackage) {
                packageMap[packageMeta.name]!.dependenciesMap[dependency] = monorepoPackage;
            }
        }
        for (const dependency of Object.keys(devDependencies ?? {})) {
            const monorepoPackage = packageMap[dependency];
            if (monorepoPackage) {
                packageMap[packageMeta.name]!.devDependenciesMap[dependency] = monorepoPackage;
            }
        }
    }

    // Compute dependency order
    const computed = new Set<string>();
    const currentPackages = new Set<string>();

    const computePackage = (packageName: string): void => {
        const packageData = packageMap[packageName]!;
        if (computed.has(packageName)) {
            return;
        }

        if (currentPackages.has(packageName)) {
            throw new Error('Circular dependency detected!');
        }
        currentPackages.add(packageName);

        let stage = 0;
        for (const dependency of Object.keys(packageData.dependenciesMap)) {
            packageData.dependenciesSet.add(dependency);
            computePackage(dependency);
            const dependencyData = packageMap[dependency]!;
            stage = Math.max(stage, dependencyData.stage + 1);
            for (const internalDependency of dependencyData.dependenciesSet.keys()) {
                packageData.dependenciesSet.add(internalDependency);
            }
        }
        for (const dependency of Object.keys(packageData.devDependenciesMap)) {
            packageData.devDependenciesSet.add(dependency);
            computePackage(dependency);
            const dependencyData = packageMap[dependency]!;
            stage = Math.max(stage, dependencyData.stage + 1);
            for (const internalDependency of dependencyData.dependenciesSet.keys()) {
                packageData.devDependenciesSet.add(internalDependency);
            }
        }

        for (const dependency of packageData.dependenciesSet) {
            packageData.devDependenciesSet.delete(dependency);
        }

        computed.add(packageName);
        packageData.stage = stage;
    };

    for (const packageMeta of allPackages) {
        computePackage(packageMeta.name);
        currentPackages.clear();
    }

    // Map and sort packages
    const sortPackage = (packageName1: string, packageName2: string): number => {
        const packageMeta1 = packageMap[packageName1]!;
        const packageMeta2 = packageMap[packageName2]!;
        if (packageMeta1.stage === packageMeta2.stage) {
            return packageName1.localeCompare(packageName2);
        }
        return packageMeta1.stage - packageMeta2.stage;
    };

    return Object.entries(packageMap).map(([packageName, packageMeta]) => ({
        packageMeta: packageMeta.packageMeta,
        packageName,
        stage: packageMeta.stage,
        dependencies: [...packageMeta.dependenciesSet].sort(sortPackage),
        devDependencies: [...packageMeta.devDependenciesSet].sort(sortPackage),
    })).sort((a, b) => sortPackage(a.packageName, b.packageName));
};

/**
 * Convenience method for grouping dependencies by stage.
 *
 * @param {object[]} dependencies - result of `dependencyOrder`
 * @returns {object[][]} array of dependency arrays, grouped in parent array indexed by stage
 */
export const dependencyOrderByStage = (dependencies: PackageDependency[]): PackageDependency[][] => {

    const byStage: PackageDependency[][] = [];
    for (const dependency of dependencies) {
        const stage = byStage[dependency.stage] ?? [];
        stage.push(dependency);
        byStage[dependency.stage] = stage;
    }
    return byStage;
};

/**
 * Convenience method for grouping dependencies by package name.
 *
 * @param {object[]} dependencies - result of `dependencyOrder`
 * @returns {object[][]} array of dependency arrays.
 */
export const dependencyOrderByPackage = (dependencies: PackageDependency[]): Record<string, PackageDependency> => {

    const byPackageName: Record<string, PackageDependency> = {};
    for (const dependency of dependencies) {
        byPackageName[dependency.packageName] = dependency;
    }
    return byPackageName;
};
