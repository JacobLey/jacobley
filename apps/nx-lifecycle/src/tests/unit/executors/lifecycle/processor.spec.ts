import { expect } from 'chai';
import { suite, test } from 'mocha';
import { processNxAndProjectJsons } from '../../../../executors/lifecycle/processor.js';

/**
 * Ensure inputs are never modified
 */
const deepFreeze = <T>(obj: T): T => {
    if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
        for (const key in obj) {
            deepFreeze(obj[key]);
        }
    }
    return obj;
};

const idempotentAssertion = ({
    params,
    expected,
}: {
    params: Parameters<typeof processNxAndProjectJsons>[0];
    expected: ReturnType<typeof processNxAndProjectJsons>;
}) => {

    const result = processNxAndProjectJsons(deepFreeze(params));
    expect(result).to.deep.equal(expected, 'Result is expected');

    const idempotentResult = processNxAndProjectJsons(deepFreeze({
        options: params.options,
        nxJson: result.processedNxJson,
        projectJsons: result.processedProjectJsons,
    }));

    expect(idempotentResult).to.deep.equal(expected, 'Result is idempotent');

    // Assert serialization order as well
    const stringifiedExpected = JSON.stringify(expected, null, 2);
    expect(
        JSON.stringify(result, null, 2)
    ).to.deep.equal(stringifiedExpected, 'Result attributes are in order provided');

    expect(
        JSON.stringify(idempotentResult, null, 2)
    ).to.equal(stringifiedExpected, 'Idempotent result attributes are in order provided');
};

suite('processNxAndProjectJsons', () => {

    suite('standalone', () => {

        test('Adds dependencies for standalone stage', () => {

            idempotentAssertion({
                params: {
                    options: {
                        stages: {
                            standalone: {},
                        },
                    },
                    nxJson: {
                        foo: 'bar',
                        targetDefaults: {
                            unchanged: {},
                            alsoUnchanged: {
                                dependsOn: [],
                            },
                            withStage: {
                                configurations: {
                                    lifecycle: { hook: 'standalone' },
                                },
                            },
                        },
                    },
                    projectJsons: [
                        {
                            targets: {
                                withStage: {},
                            }
                        },
                        {
                            targets: {
                                withStage2: {},
                            }
                        },
                    ],
                },
                expected: {
                    processedNxJson: {

                    },
                    processedProjectJsons: [{

                    }],
                },
            });
        });
    });

    suite('Does not add or remove extra fields', () => {

        test('Does not add targets', () => {

            idempotentAssertion({
                params: {
                    options: {
                        stages: {},
                    },
                    nxJson: {
                        foo: 'bar',
                    },
                    projectJsons: [
                        {
                            name: '<name>',
                        }
                    ],
                },
                expected: {
                    processedNxJson: {
                        foo: 'bar',
                    },
                    processedProjectJsons: [
                        {
                            name: '<name>',
                        }
                    ],
                },
            });
        });

        test('Does not add dependsOn or configurations', () => {

            idempotentAssertion({
                params: {
                    options: {
                        stages: {},
                    },
                    nxJson: {
                        foo: 'bar',
                        targetDefaults: {
                            myTarget: {},
                        },
                    },
                    projectJsons: [
                        {
                            targets: {
                                otherTarget: {},
                            },
                        },
                    ],
                },
                expected: {
                    processedNxJson: {
                        foo: 'bar',
                        targetDefaults: {
                            myTarget: {},
                        },
                    },
                    processedProjectJsons: [
                        {
                            targets: {
                                otherTarget: {},
                            },
                        }
                    ],
                },
            });
        });

        test('Does not add targets', () => {

            idempotentAssertion({
                params: {
                    options: {
                        stages: {},
                    },
                    nxJson: {
                        foo: 'bar',
                    },
                    projectJsons: [
                        {
                            name: '<name>',
                        }
                    ],
                },
                expected: {
                    processedNxJson: {
                        foo: 'bar',
                    },
                    processedProjectJsons: [
                        {
                            name: '<name>',
                        }
                    ],
                },
            });
        });

        test('Does not remove targets', () => {

            idempotentAssertion({
                params: {
                    options: {
                        stages: {},
                    },
                    nxJson: {
                        foo: 'bar',
                        targetDefaults: {},
                    },
                    projectJsons: [
                        {
                            targets: {},
                        },
                    ],
                },
                expected: {
                    processedNxJson: {
                        foo: 'bar',
                        targetDefaults: {},
                    },
                    processedProjectJsons: [
                        {
                            targets: {},
                        }
                    ],
                },
            });
        });

        test('Does not remove dependsOn or configurations', () => {

            idempotentAssertion({
                params: {
                    options: {
                        stages: {
                            standalone: {},
                        },
                    },
                    nxJson: {
                        foo: 'bar',
                        targetDefaults: {
                            someTarget: {
                                dependsOn: ['standalone:_'],
                                configurations: {},
                            },
                            someExcludedTarget: {
                                configurations: {
                                    lifecycle: { hook: null },
                                },
                            },
                            withHook: {
                                dependsOn: [],
                                configurations: {
                                    lifecycle: { hook: 'standalone' },
                                },
                            },
                            withoutHook: {
                                dependsOn: ['standalone:_'],
                                configurations: {
                                    lifecycle: { hook: 'standalone' },
                                },
                            },
                        },
                    },
                    projectJsons: [
                        {
                            targets: {
                                someTarget: {
                                    dependsOn: [],
                                    configurations: {},
                                },
                                withHook: {},
                                withoutHook: {
                                    configurations: {
                                        lifecycle: { hook: null },
                                    },
                                    dependsOn: ['standalone:_'],
                                },
                            },
                        },
                    ],
                },
                expected: {
                    processedNxJson: {
                        foo: 'bar',
                        targetDefaults: {
                            someTarget: {
                                dependsOn: [],
                                configurations: {},
                            },
                            someExcludedTarget: {
                                configurations: {
                                    lifecycle: { hook: null },
                                },
                            },
                            withHook: {
                                dependsOn: ['standalone:_'],
                                configurations: {
                                    lifecycle: {
                                        hook: 'standalone'
                                    }
                                },
                            },
                            withoutHook: {
                                dependsOn: ['standalone:_'],
                                configurations: {
                                    lifecycle: {
                                        hook: 'standalone'
                                    }
                                },
                            },
                            'standalone:_': {
                                executor: 'nx:noop',
                                configurations: {
                                    __lifecycle: {}
                                },
                            },
                            standalone: {
                                executor: 'nx:noop',
                                dependsOn: [
                                    'standalone:_',
                                    'withHook',
                                    'withoutHook'
                                ],
                                configurations: {
                                    __lifecycle: {}
                                },
                            },
                        },
                    },
                    processedProjectJsons: [
                        {
                            targets: {
                                "someTarget": {
                                    dependsOn: [],
                                    configurations: {},
                                },
                                "withHook": {},
                                "withoutHook": {
                                    configurations: {
                                        lifecycle: { hook: null },
                                    },
                                    dependsOn: [],
                                },
                                "standalone:_": {},
                                "standalone": {
                                    dependsOn: [
                                        "standalone:_",
                                        'withHook'
                                    ],
                                },
                            },
                        }
                    ],
                },
            });
        });
    });
});
