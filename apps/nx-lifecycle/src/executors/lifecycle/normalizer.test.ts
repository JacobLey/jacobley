import { expect } from 'chai';
import { suite, test } from 'mocha';
import * as Normalizer from './normalizer.js';

suite('Normalizer', () => {

    suite('normalizeOptions', () => {

        test('Use provided options', () => {

            expect(Normalizer.normalizeOptions(
                {
                    check: false,
                    dryRun: true,
                    stages: {
                        myStage: {},
                    },
                    targets: {
                        myTarget: 'myStage',
                    },
                },
                {
                    root: '/path/to/workspace',
                    projectsConfigurations: {
                        version: 123,
                        projects: {
                            foo: {
                                root: 'path/to/foo',
                            },
                            bar: {
                                root: 'path/to/bar',
                            },
                        },
                    },
                },
                { isCI: true }
            )).to.deep.equal({
                check: false,
                dryRun: true,
                nxJsonPath: '/path/to/workspace/nx.json',
                packageJsonPaths: [
                    '/path/to/workspace/path/to/foo/project.json',
                    '/path/to/workspace/path/to/bar/project.json',
                ],
                stages: {
                    myStage: {},
                },
                targets: {
                    myTarget: 'myStage',
                },
            });
        });

        test('Use defaults', () => {

            expect(Normalizer.normalizeOptions(
                {},
                {
                    root: '/path/to/workspace',
                    projectsConfigurations: {
                        version: 123,
                        projects: {
                            foo: {
                                root: 'path/to/foo',
                            },
                            bar: {
                                root: 'path/to/bar',
                            },
                        },
                    },
                },
                { isCI: true }
            )).to.deep.equal({
                check: true,
                dryRun: false,
                nxJsonPath: '/path/to/workspace/nx.json',
                packageJsonPaths: [
                    '/path/to/workspace/path/to/foo/project.json',
                    '/path/to/workspace/path/to/bar/project.json',
                ],
                stages: {},
                targets: {},
            });
        });
    });
});
