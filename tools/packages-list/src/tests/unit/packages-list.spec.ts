import { homedir } from 'node:os';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { findImport } from 'find-import';
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

export const PackagesListSpec = {

    afterEach() {
        Sinon.restore();
    },

    listPackages: {

        'Lerna': {

            'success': {

                async 'Custom packages'() {

                    Sinon.stub(patch(findImport), patchKey).callsFake(async (...args) => {
                        expect(args).to.deep.equal([
                            'lerna.json',
                            {
                                cwd: undefined,
                                direction: 'down',
                                startAt: homedir(),
                            },
                        ]);
                        return {
                            filePath: Path.join(rootDir, 'lerna.json'),
                            content: {
                                packages: [
                                    'apps/*',
                                    'tools/*',
                                ],
                            },
                        };
                    });

                    const packages = await ListPackages.listPackages({ manager: 'lerna' });

                    assertPackages(packages);
                },

                async 'Default packages'() {

                    Sinon.stub(patch(findImport), patchKey).callsFake(async (...args) => {
                        expect(args).to.deep.equal([
                            'lerna.json',
                            {
                                cwd: packageDir,
                                direction: 'down',
                                startAt: homedir(),
                            },
                        ]);
                        return {
                            filePath: Path.join(rootDir, 'lerna.json'),
                            content: {},
                        };
                    });

                    const packages = await ListPackages.listPackages({
                        cwd: packageDir,
                        manager: 'lerna',
                    });

                    expect(packages).to.deep.equal([]);
                },

                async 'Use workspaces'() {

                    Sinon.stub(patch(findImport), patchKey).resolves({
                        filePath: Path.join(rootDir, 'lerna.json'),
                        content: {
                            useWorkspaces: true,
                        },
                    });
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

                    const packages = await ListPackages.listPackages({ manager: 'lerna' });

                    assertPackages(packages);
                },
            },

            'Not found': {

                async 'No lerna.json'() {

                    let error: unknown;
                    try {
                        await ListPackages.listPackages({ manager: 'lerna' });
                    } catch (err) {
                        error = err;
                    }

                    expect(error).to.be.an('error').with.property('message', 'Unable to find packages');
                },
            },
        },

        'Npm and Yarn': {

            async success() {

                Sinon.stub(patch(rootPackageJson), patchKey).callsFake(async (...args) => {
                    expect(args).to.deep.equal([{ cwd: undefined }]);
                    return {
                        filePath: Path.join(rootDir, 'package.json'),
                        packageJson: {
                            name: 'root',
                            version: '1.2.3',
                            workspaces: [
                                'apps/*',
                                'tools/*',
                            ],
                        },
                    };
                });

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

        'Nx': {

            async 'workspace.json'() {

                const existingPackages = await ListPackages.listPackages();

                const projects: Record<string, string> = {};
                for (const existingPackage of existingPackages) {
                    projects[Path.relative(rootDir, existingPackage.directory)] = existingPackage.name;
                }

                Sinon.stub(patch(findImport), patchKey).callsFake(async (...args) => {
                    expect(args).to.deep.equal([
                        'workspace.json',
                        {
                            cwd: undefined,
                            direction: 'down',
                            startAt: homedir(),
                        },
                    ]);
                    return {
                        filePath: Path.join(rootDir, 'workspace.json'),
                        content: { projects },
                    };
                });

                const packages = await ListPackages.listPackages({ manager: 'nx' });

                assertPackages(packages);
            },

            'Not found': {

                async 'No workspace.json'() {

                    let error: unknown;
                    try {
                        await ListPackages.listPackages({ manager: 'nx' });
                    } catch (err) {
                        error = err;
                    }

                    expect(error).to.be.an('error').with.property('message', 'Unable to find packages');
                },

                async 'No projects'() {

                    Sinon.stub(patch(findImport), patchKey).callsFake(async (...args) => {
                        expect(args).to.deep.equal([
                            'workspace.json',
                            {
                                cwd: packageDir,
                                direction: 'down',
                                startAt: homedir(),
                            },
                        ]);
                        return {
                            filePath: Path.join(rootDir, 'workspace.json'),
                            content: {},
                        };
                    });

                    let error: unknown;
                    try {
                        await ListPackages.listPackages({ manager: 'nx', cwd: packageDir });
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
