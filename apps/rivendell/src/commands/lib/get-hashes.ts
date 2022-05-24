import type { PackageManager } from 'dependency-order';
import { parseCwd } from 'parse-cwd';
import { type HashedFile, hashFile, listPackageFiles, loadConfig } from '../../lib/index.js';
import { getPackageData } from './get-package-data.js';

export const getHashes = async (options: {
    cwd?: string;
    configFile?: string | undefined;
    manager?: PackageManager | undefined;
    packageName: string;
    only?: 'dev' | 'prod' | undefined;
}): Promise<HashedFile[]> => {

    const cwd = await parseCwd(options.cwd);

    const config = await loadConfig({
        cwd,
        configFile: options.configFile,
    });

    const packageFiles = await listPackageFiles({
        cwd,
        config,
        manager: options.manager,
    });

    const files = getPackageData(options.packageName, packageFiles);

    const relevantFiles = files[`${options.only ?? 'all'}Files`];
    return Promise.all(relevantFiles.map(
        async file => hashFile(file)
    ));
};
