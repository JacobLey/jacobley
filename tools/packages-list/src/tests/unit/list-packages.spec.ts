import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { patch, patchKey } from 'named-patch';
import { rootPackageJson } from 'root-package-json';
import Sinon from 'sinon';
import which from 'which';
import * as ListPackages from '../../packages-list.js';

const rootDir = Path.join(
    fileURLToPath(import.meta.url),
    '../../../../../..'
);
const packageDir = Path.join(
    fileURLToPath(import.meta.url),
    '../../../..'
);

const assertPackages = (packages: ListPackages.PackageMeta[]): void => {

    // Finds self
    expect(packages.some(
        packageMeta => packageMeta.directory === packageDir &&
            packageMeta.name === 'packages-list' &&
            packageMeta.packageJson.name === 'packages-list'
    )).to.equal(true);

    // Finds sibling package
    expect(packages.some(
        packageMeta => packageMeta.directory === Path.join(packageDir, '../root-package-json') &&
            packageMeta.name === 'root-package-json' &&
            packageMeta.packageJson.name === 'root-package-json'
    )).to.equal(true);

    // Finds other directory
    expect(packages.some(
        packageMeta => packageMeta.directory === Path.join(rootDir, 'apps/rivendell') &&
            packageMeta.name === 'rivendell' &&
            packageMeta.packageJson.name === 'rivendell'
    )).to.equal(true);
};

export const ListPackagesSpec = {

    afterEach() {
        Sinon.restore();
    },

    listPackages: {

        'Npm and Yarn': {

            async success() {

                Sinon.stub(patch(rootPackageJson), patchKey).callsFake(async () => ({
                    filePath: Path.join(rootDir, 'package.json'),
                    packageJson: {
                        name: 'root',
                        version: '1.2.3',
                        workspaces: [
                            'apps/*',
                            'tools/*',
                        ],
                    },
                }));

                const packages = await ListPackages.listPackages();

                assertPackages(packages);
            },

            'Not found': {

                async 'No root package.json'() {

                    let error: unknown;
                    try {
                        await ListPackages.listPackages({
                            cwd: '/',
                            manager: 'npm',
                        });
                    } catch (err) {
                        error = err;
                    }

                    expect(error).to.be.an('error').with.property('message', 'Unable to find packages');
                },

                async 'No workspaces'() {

                    let error: unknown;
                    try {
                        await ListPackages.listPackages({
                            manager: 'yarn',
                        });
                    } catch (err) {
                        error = err;
                    }

                    expect(error).to.be.an('error').with.property('message', 'Unable to find packages');
                },
            },
        },

        'Rush': {

            async success() {

                const packages = await ListPackages.listPackages();

                assertPackages(packages);
            },

            async 'Not found'() {

                Sinon.stub(patch(which), patchKey).rejects(null);

                let error: unknown;
                try {
                    await ListPackages.listPackages({
                        manager: 'rush',
                    });
                } catch (err) {
                    error = err;
                }

                expect(error).to.be.an('error').with.property('message', 'Unable to find packages');
            },

            async 'Not resolved'() {

                Sinon.stub(patch(which), patchKey).resolves('/does/not/exist');

                let error: unknown;
                try {
                    await ListPackages.listPackages({
                        manager: 'rush',
                    });
                } catch (err) {
                    error = err;
                }

                expect(error).to.be.an('error').with.property('message', 'Unable to find packages');
            },
        },
    },
};
