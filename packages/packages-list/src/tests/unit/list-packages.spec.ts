import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { patch, patchKey } from 'named-patch';
import { rootPackageJson } from 'root-package-json';
import Sinon from 'sinon';
import * as ListPackages from '../../packages-list.js';

export const ListPackagesSpec = {

    afterEach() {
        Sinon.restore();
    },

    ListPackages: {

        async success() {

            const packages = await ListPackages.listPackages();

            const packageDir = Path.join(
                fileURLToPath(import.meta.url),
                '../../../..'
            );
            expect(packages.some(
                packageMeta => packageMeta.directory === packageDir &&
                    packageMeta.name === 'packages-list' &&
                    packageMeta.packageJson.name === 'packages-list'
            )).to.equal(true);
            expect(packages.some(
                packageMeta => packageMeta.directory === Path.join(packageDir, '../root-package-json') &&
                    packageMeta.name === 'root-package-json' &&
                    packageMeta.packageJson.name === 'root-package-json'
            )).to.equal(true);
        },

        async 'No root package found'() {

            const packages = await ListPackages.listPackages({
                cwd: '/',
            });
            expect(packages).to.deep.equal([]);
        },

        async 'Not a monorepo'() {

            Sinon.stub(patch(rootPackageJson), patchKey).callsFake(async () => ({
                filePath: '/no/such/path',
                packageJson: { version: '1.2.3' },
            }));

            const packages = await ListPackages.listPackages();
            expect(packages).to.deep.equal([]);
        },

        async 'Workspaces not found'() {

            Sinon.stub(patch(rootPackageJson), patchKey).callsFake(async () => ({
                filePath: '/no/such/path',
                packageJson: {
                    version: '1.2.3',
                    workspaces: ['packages/packages-list/src'],
                },
            }));

            const packages = await ListPackages.listPackages();
            expect(packages).to.deep.equal([]);
        },
    },
};
