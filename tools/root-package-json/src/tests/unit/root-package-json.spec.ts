import { readFile } from 'node:fs/promises';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import * as RootPackageJson from '../../root-package-json.js';

const rootPath = Path.join(
    fileURLToPath(import.meta.url),
    '../../../../package.json'
);
const rawRoot = await readFile(rootPath, 'utf8');
const root: unknown = JSON.parse(rawRoot);

export const RootPackageJsonSpec = {

    rootPackageJson: {

        async 'Finds root package.json'() {

            const rootPackage = await RootPackageJson.rootPackageJson();

            expect(rootPackage).to.deep.equal({
                filePath: rootPath,
                packageJson: root,
            });

            const cachedPackage = await RootPackageJson.rootPackageJson();
            expect(cachedPackage!.packageJson).to.eq(rootPackage!.packageJson);
        },

        async 'Optionally provide path'() {

            const rootPackage = await RootPackageJson.rootPackageJson({
                cwd: import.meta.url,
            });

            expect(rootPackage).to.deep.equal({
                filePath: rootPath,
                packageJson: root,
            });
        },

        async 'No package.json'() {

            const rootPackage = await RootPackageJson.rootPackageJson({
                cwd: '/',
            });

            expect(rootPackage).to.equal(null);
        },
    },
};
