import type { PackageJson } from 'root-package-json';

export interface PackageMeta {
    directory: string;
    name: string;
    packageJson: PackageJson;
}
