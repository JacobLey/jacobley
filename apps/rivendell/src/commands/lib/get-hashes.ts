import { parseCwd } from 'parse-cwd';
import { loadConfig } from '../../lib/config.js';
import { hashFile } from '../../lib/file-hash.js';
import { listPackageFiles } from '../../lib/list-files.js';
import { getPackageData } from './get-package-data.js';
import { validateConfigFile } from './validate-config-path.js';

export const getHashes = async (options: {
    cwd?: string;
    configFile?: string | undefined;
    packageName: string;
    only?: 'dev' | 'prod' | undefined;
}): Promise<{ path: string; hash: string }[]> => {

    validateConfigFile(options.configFile);
    const cwd = await parseCwd(options.cwd);

    const config = await loadConfig({
        cwd,
        configFile: options.configFile,
    });

    const packageFiles = await listPackageFiles({
        cwd,
        config,
    });

    const files = getPackageData(options.packageName, packageFiles);

    const relevantFiles = files[`${options.only ?? 'all'}Files`];
    return Promise.all(relevantFiles.map(
        async file => hashFile(file)
    ));
};
