import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExecutorContext } from '@nx/devkit';
import { isCI } from 'ci-info';
import { isNxJson, isProjectJson, type NxJson, type ProjectJson, type Target, DependsOn } from '#schemas';
import { NOOP_EXECUTOR } from './constants.js';
import type { LifecycleOptions } from './schema.js';

interface NormalizedOptions {
    check: boolean;
    dryRun: boolean;
    nxJsonPath: string;
    packageJsonPaths: string[];
    stages: NonNullable<LifecycleOptions['stages']>;
}

const normalizeOptions = (
    options: LifecycleOptions,
    context: ExecutorContext
): NormalizedOptions => ({
    check: options.check ?? isCI,
    dryRun: options.dryRun ?? false,
    nxJsonPath: join(context.root, 'nx.json'),
    packageJsonPaths: Object.values(context.projectsConfigurations!.projects).map(
        (projectConfig) => join(context.root, projectConfig.root, 'project.json')
    ),
    stages: options.stages ?? {},
});

interface LoadedJsonConfig<T> {
    path: string;
    rawData: string;
    data: T;
};
const loadJsonConfigs = async ({
    nxJsonPath,
    packageJsonPaths,
}: NormalizedOptions): Promise<{
    nxJson: LoadedJsonConfig<NxJson>;
    projectJsons: LoadedJsonConfig<ProjectJson>[];
}> => {

    const [
        rawNxJson,
        ...rawProjectJsons
    ] = await Promise.all([
        readFile(nxJsonPath, 'utf8'),
        ...packageJsonPaths.map(async path => ({
            path,
            rawData: await readFile(path, 'utf8'),
        })),
    ]);

    const parsedNxJson = JSON.parse(rawNxJson);
    if (!isNxJson(parsedNxJson)) {
        throw new Error(`Failed to parse nx.json: ${JSON.stringify(isNxJson.errors!, null, 2)}`);
    }

    return {
        nxJson: {
            path: nxJsonPath,
            rawData: rawNxJson,
            data: parsedNxJson,
        },
        projectJsons: rawProjectJsons.map(({ path, rawData }) => {

            const data = JSON.parse(rawData);

            if (!isProjectJson(data)) {
                throw new Error(`Failed to parse ${path}: ${isProjectJson.errors!}`);
            }

            return {
                path,
                rawData,
                data,
            };
        }),
    };
};

type LifecycleTarget = {
    dependsOn: DependsOn;
} & (
    {
        kind: 'anchor';
    } | (
        {
            previousHook: string;
        } & (
            {
                kind: 'hook';
            } | {
                kind: 'base';
                hasHooks: boolean;
            }
        )
    )
);

const calculateTargets = ({ stages }: NormalizedOptions): Map<string, LifecycleTarget> => {

    const lifecycleTargets = new Map<string, LifecycleTarget>();

    for (const [stageName, stage] of Object.entries(stages)) {
        const prefixHook = `${stageName}:_`;
        lifecycleTargets.set(prefixHook, {
            kind: 'anchor',
            dependsOn: stage.dependsOn ?? [],
        });

        let previousHook = prefixHook;

        const hooks = stage.hooks ?? [];

        for (const hook of hooks) {
            const hookName = `${stageName}:${hook}`;
            lifecycleTargets.set(hookName, {
                kind: 'hook',
                dependsOn: [previousHook],
                previousHook,
            });
            previousHook = hookName;
        }
        lifecycleTargets.set(stageName, {
            kind: 'base',
            dependsOn: [previousHook],
            previousHook,
            hasHooks: hooks.length > 0,
        });
    }

    return lifecycleTargets;
};

const removeDependencyTargets = (
    target: { dependsOn?: DependsOn },
    targetsToRemove: Set<String>
): boolean => {
    if (target.dependsOn) {
        let didFilter = false;
        target.dependsOn = target.dependsOn.filter(
            dependency => {
                const target = typeof dependency === 'string' ?
                    dependency :
                    dependency.target;

                const willExclude = targetsToRemove.has(
                    target.replace(/^\^/, '')
                );
                didFilter ||= willExclude;
                return !willExclude;
            }
        );
        return didFilter;
    }
    return false;
};

const processNxJson = ({
    nxJson,
    lifecycleTargets,
}: {
    nxJson: NxJson;
    lifecycleTargets: Map<string, LifecycleTarget>;
}): {
    processedNxJson: NxJson,
    registeredTargets: Map<string, Target>,
    targetsToRemove: Set<string>;
} => {

    const processedNxJson = {
        ...nxJson,
        targetDefaults: {
            ...nxJson.targetDefaults,
        },
    };
    // non-lifecycle targets declared in nx.json
    const registeredTargets = new Map<string, Target>();
    // potentially "stale" lifecycle targets, as well as any non-base targets
    const targetsToRemove = new Set<string>();

    for (const [targetName, target] of Object.entries(processedNxJson.targetDefaults)) {
        const declaredLifecycleTarget = lifecycleTargets.get(targetName);
        if ('__lifecycle' in (target.configurations ?? {})) {
            delete processedNxJson.targetDefaults[targetName];
            if (declaredLifecycleTarget?.kind !== 'base') {
                targetsToRemove.add(targetName);
            }
        } else if (declaredLifecycleTarget) {
            throw new Error(`Overlap between target and lifecycle detected: ${targetName}`);
        } else {
            registeredTargets.set(targetName, target);
            if (target.dependsOn) {
                target.dependsOn = [...target.dependsOn];
            }
        }
    }

    for (const [targetName, target] of lifecycleTargets.entries()) {
        processedNxJson.targetDefaults[targetName] = {
            executor: NOOP_EXECUTOR,
            dependsOn: [...target.dependsOn],
            configurations: {
                __lifecycle: {},
            },
        };
        if (target.kind !== 'base') {
            targetsToRemove.add(targetName);
        }
    }

    for (const [targetName, target] of registeredTargets.entries()) {
        const didFilter = removeDependencyTargets(target, targetsToRemove);
        const configurations = target.configurations ?? {};
        if ('lifecycle' in configurations) {
            const { hook } = configurations.lifecycle;
            const lifecycleTarget = lifecycleTargets.get(hook);
            if (!lifecycleTarget) {
                throw new Error(`Lifecycle hook not found: ${hook}`);
            } else if (lifecycleTarget.kind === 'anchor') {
                throw new Error(`Target ${targetName} cannot be part of anchor hook ${hook}`);
            } else if (lifecycleTarget.kind === 'base' && lifecycleTarget.hasHooks) {
                throw new Error(`Target ${targetName} must use hook of ${hook}:HOOK_NAME`);
            }
            target.dependsOn ??= [];
            target.dependsOn.push(lifecycleTarget.previousHook);
            processedNxJson.targetDefaults[hook]!.dependsOn!.push(targetName);
        }
        if (didFilter && target.dependsOn?.length === 0) {
            delete target.dependsOn;
        }
    }

    for (const targetName of lifecycleTargets.keys()) {
        const target = processedNxJson.targetDefaults[targetName]!;
        if (target.dependsOn?.length === 0) {
            delete target.dependsOn;
        }
    }

    return {
        processedNxJson,
        registeredTargets,
        targetsToRemove,
    };
};

const processProjectJson = ({
    nxJson,
    projectJson,
    lifecycleTargets,
    registeredTargets,
    targetsToRemove,
}: {
    nxJson: NxJson;
    projectJson: ProjectJson;
    lifecycleTargets: Map<string, LifecycleTarget>;
    registeredTargets: Map<string, Target>,
    targetsToRemove: Set<string>;
}): ProjectJson => {

    const targets = projectJson.targets ?? {};
    const processedProjectJson = {
        ...projectJson,
        targets: { ...targets },
    };

    for (const [targetName, target] of Object.entries(targets)) {
        if (lifecycleTargets.has(targetName)) {
            delete processedProjectJson.targets[targetName];
        } else if (registeredTargets.has(targetName) {
            if ('lifecycle' in target.configurations ?? {}) {
                
            }
        }
    }

    for (const targetName of lifecycleTargets.keys()) {
        processedProjectJson.targets[targetName] = {};
    }

    return processedProjectJson;
};

export default async (
    options: LifecycleOptions,
    context: ExecutorContext
): Promise<{ success: boolean }> => {

    const normalized = normalizeOptions(options, context);

    try {
        const { nxJson, projectJsons } = await loadJsonConfigs(normalized);

        const lifecycleTargets = calculateTargets(normalized);

        const {
            processedNxJson,
            registeredTargets,
            targetsToRemove,
        } = processNxJson({
            nxJson: nxJson.data,
            lifecycleTargets,
        });

        const processedProjectJsons = projectJsons.map(
            ({ data: projectJson, ...rest }) => {
                return {
                    ...rest,
                    data: processProjectJson({
                        nxJson: processedNxJson,
                        projectJson,
                        lifecycleTargets,
                        registeredTargets,
                        targetsToRemove,
                    }),
                };
            }
        );

        console.log(JSON.stringify(processedNxJson, null, 2));

        return { success: false };

    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error('Unknown Error', error);
        }
        return { success: false };
    }
};
