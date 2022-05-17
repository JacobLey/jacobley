import { expect } from 'chai';
import { patch, patchKey } from 'named-patch';
import { listPackages } from 'packages-list';
import Sinon from 'sinon';
import * as DependencyOrder from '../../dependency-order.js';

export const DependencyOrderSpec = {

    afterEach() {
        Sinon.restore();
    },

    dependencyOrder: {

        async success() {

            const dependencies = await DependencyOrder.dependencyOrder();
            expect(dependencies[0]).to.deep.contain({
                stage: 0,
                dependencies: [],
                devDependencies: [],
            });

            const ownPackage = dependencies.find(
                dependency => dependency.packageName === 'dependency-order'
            )!;

            expect(ownPackage.dependencies.includes('named-patch')).to.equal(true);
            expect(ownPackage.devDependencies).to.deep.equal([]);

            const packageMap = DependencyOrder.dependencyOrderByPackage(dependencies);
            const stageMap = DependencyOrder.dependencyOrderByStage(dependencies);

            for (const [index, packageDependency] of dependencies.entries()) {
                expect(stageMap[packageDependency.stage]).to.include(packageDependency);
                const nextPackageDependency = dependencies[index + 1];
                if (nextPackageDependency) {
                    expect(packageDependency.stage).to.be.lessThanOrEqual(nextPackageDependency.stage);
                }
                for (const dependency of packageDependency.dependencies) {
                    expect(packageMap[dependency]!.stage).to.be.lessThan(packageDependency.stage);
                    expect(packageDependency.devDependencies).to.not.include(dependency);
                }
                for (const devDependency of packageDependency.devDependencies) {
                    expect(packageMap[devDependency]!.stage).to.be.lessThan(packageDependency.stage);
                    expect(packageDependency.dependencies).to.not.include(devDependency);
                }
            }
        },

        async 'Custom packages'() {

            const packageMeta = {
                a: {
                    directory: '/packages/a',
                    name: '<package-a>',
                    packageJson: {
                        version: '1.0.0',
                        devDependencies: {
                            '<package-b>': '<path>',
                            '<ignore>': '<version>',
                        },
                    },
                },
                b: {
                    directory: '/packages/b',
                    name: '<package-b>',
                    packageJson: {
                        version: '2.0.0',
                        devDependencies: {
                            '<package-c>': '<path>',
                        },
                    },
                },
                c: {
                    directory: '/packages/c',
                    name: '<package-c>',
                    packageJson: {
                        version: '3.0.0',
                        dependencies: {
                            '<package-d>': '<path>',
                        },
                    },
                },
                d: {
                    directory: '/packages/d',
                    name: '<package-d>',
                    packageJson: {
                        version: '4.0.0',
                        optionalDependencies: {},
                        peerDependencies: {
                            '<package-a>': '<ignored>',
                        },
                    },
                },
                e: {
                    directory: '/packages/e',
                    name: '<package-e>',
                    packageJson: {
                        version: '5.0.0',
                        dependencies: {
                            '<ignore>': '<version>',
                        },
                        optionalDependencies: {
                            '<ignore>': '<version>',
                        },
                    },
                },
            };

            Sinon.stub(patch(listPackages), patchKey).callsFake(async () => [
                packageMeta.a,
                packageMeta.b,
                packageMeta.c,
                packageMeta.d,
                packageMeta.e,
            ]);

            const dependencies = await DependencyOrder.dependencyOrder();
            expect(dependencies).to.deep.equal([
                {
                    packageName: '<package-d>',
                    packageMeta: packageMeta.d,
                    stage: 0,
                    dependencies: [],
                    devDependencies: [],
                },
                {
                    packageName: '<package-e>',
                    packageMeta: packageMeta.e,
                    stage: 0,
                    dependencies: [],
                    devDependencies: [],
                },
                {
                    packageName: '<package-c>',
                    packageMeta: packageMeta.c,
                    stage: 1,
                    dependencies: ['<package-d>'],
                    devDependencies: [],
                },
                {
                    packageName: '<package-b>',
                    packageMeta: packageMeta.b,
                    stage: 2,
                    dependencies: [],
                    devDependencies: ['<package-d>', '<package-c>'],
                },
                {
                    packageName: '<package-a>',
                    packageMeta: packageMeta.a,
                    stage: 3,
                    dependencies: [],
                    devDependencies: ['<package-b>'],
                },
            ]);
            expect(DependencyOrder.dependencyOrderByPackage(dependencies)).to.deep.equal({
                '<package-a>': {
                    packageName: '<package-a>',
                    packageMeta: packageMeta.a,
                    stage: 3,
                    dependencies: [],
                    devDependencies: ['<package-b>'],
                },
                '<package-b>': {
                    packageName: '<package-b>',
                    packageMeta: packageMeta.b,
                    stage: 2,
                    dependencies: [],
                    devDependencies: ['<package-d>', '<package-c>'],
                },
                '<package-c>': {
                    packageName: '<package-c>',
                    packageMeta: packageMeta.c,
                    stage: 1,
                    dependencies: ['<package-d>'],
                    devDependencies: [],
                },
                '<package-d>': {
                    packageName: '<package-d>',
                    packageMeta: packageMeta.d,
                    stage: 0,
                    dependencies: [],
                    devDependencies: [],
                },
                '<package-e>': {
                    packageName: '<package-e>',
                    packageMeta: packageMeta.e,
                    stage: 0,
                    dependencies: [],
                    devDependencies: [],
                },
            });
            expect(DependencyOrder.dependencyOrderByStage(dependencies)).to.deep.equal([
                [
                    {
                        packageName: '<package-d>',
                        packageMeta: packageMeta.d,
                        stage: 0,
                        dependencies: [],
                        devDependencies: [],
                    },
                    {
                        packageName: '<package-e>',
                        packageMeta: packageMeta.e,
                        stage: 0,
                        dependencies: [],
                        devDependencies: [],
                    },
                ],
                [
                    {
                        packageName: '<package-c>',
                        packageMeta: packageMeta.c,
                        stage: 1,
                        dependencies: ['<package-d>'],
                        devDependencies: [],
                    },
                ],
                [
                    {
                        packageName: '<package-b>',
                        packageMeta: packageMeta.b,
                        stage: 2,
                        dependencies: [],
                        devDependencies: ['<package-d>', '<package-c>'],
                    },
                ],
                [
                    {
                        packageName: '<package-a>',
                        packageMeta: packageMeta.a,
                        stage: 3,
                        dependencies: [],
                        devDependencies: ['<package-b>'],
                    },
                ],
            ]);
        },

        async 'Circular dependency'() {

            let error: unknown;
            Sinon.stub(patch(listPackages), patchKey).callsFake(async () => [
                {
                    directory: '/does/not/exist/b',
                    name: '<package-a>',
                    packageJson: {
                        version: '1.2.3',
                        devDependencies: {
                            '<package-b>': '<path>',
                        },
                    },
                },
                {
                    directory: '/does/not/exist/b',
                    name: '<package-b>',
                    packageJson: {
                        version: '3.2.1',
                        optionalDependencies: {
                            '<package-a>': '<path>',
                        },
                    },
                },
            ]);
            try {
                await DependencyOrder.dependencyOrder();
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an('error').with.property('message', 'Circular dependency detected!');
        },
    },
};
