import { deepEqual } from 'fast-equals';
import { type Configurations, type NxJson, type NxJsonWithTargets, type ProjectJson, type ProjectJsonWithTargets, type Target, DependsOn, AllTargets, isEmpty, isTargetWithDependsOnOnly } from '#schemas';
import { NOOP_EXECUTOR } from './constants.js';
import type { NormalizedOptions } from './normalizer.js';

type ProcessorOptions = Pick<NormalizedOptions, 'stages'>;

type LifecycleTarget = {
    name: string;
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
type LifecycleTargetWithHooks = Extract<LifecycleTarget, { previousHook: string }>;

type LifecycleTargets = Map<string, LifecycleTarget>;
type RegisteredTargets = Map<string, LifecycleTargetWithHooks | null>;

const calculateTargets = ({ stages }: ProcessorOptions): LifecycleTargets => {

    const lifecycleTargets: LifecycleTargets = new Map();

    for (const [stageName, stage] of Object.entries(stages)) {
        const prefixHook = `${stageName}:_`;
        lifecycleTargets.set(prefixHook, {
            name: prefixHook,
            kind: 'anchor',
            dependsOn: stage.dependsOn ?? [],
        });

        let previousHook = prefixHook;

        const hooks = stage.hooks ?? [];

        for (const hook of hooks) {
            const hookName = `${stageName}:${hook}`;
            lifecycleTargets.set(hookName, {
                name: hookName,
                kind: 'hook',
                dependsOn: [previousHook],
                previousHook,
            });
            previousHook = hookName;
        }
        lifecycleTargets.set(stageName, {
            name: stageName,
            kind: 'base',
            dependsOn: [previousHook],
            previousHook,
            hasHooks: hooks.length > 0,
        });
    }

    return lifecycleTargets;
};

const calculateTargetsToRemove = ({ lifecycleTargets, nxJson } : {
   lifecycleTargets: LifecycleTargets;
   nxJson: NxJson;
}): Set<string> => {

    const targetsToRemove = new Set<string>();

    for (const [targetName, target] of Object.entries(lifecycleTargets)) {
        if (target.kind !== 'base') {
            targetsToRemove.add(targetName);
        }
    }

    for (const [targetName, target] of Object.entries(nxJson.targetDefaults ?? {})) {
        if (
            !lifecycleTargets.has(targetName) &&
            '__lifecycle' in (target.configurations ?? {})
        ) {
            targetsToRemove.add(targetName);
        }
    }

    return targetsToRemove;
};

const removeDependencyTargets = ({ target, lifecycleTargets, targetsToRemove}: {
    target: Target;
    lifecycleTargets: LifecycleTargets;
    targetsToRemove: Set<String>;
}): DependsOn => {
    if (target.dependsOn) {
        return target.dependsOn.filter(
            dependency => {
                const target = typeof dependency === 'string' ?
                    dependency :
                    dependency.target;

                const normalized = target.replace(/^\^/, '');
                return !targetsToRemove.has(normalized) && !lifecycleTargets.has(normalized);
            }
        );
    }
    return [];
};

const getRegisteredTargets = ({ targets, lifecycleTargets }: {
    targets: AllTargets;
    lifecycleTargets: LifecycleTargets;
}): RegisteredTargets => {
    const registeredTargets: RegisteredTargets = new Map();

    for (const [targetName, { configurations = {} }] of Object.entries(targets)) {
        if ('lifecycle' in configurations) {
            if (configurations.lifecycle.hook) {
                const hook = lifecycleTargets.get(configurations.lifecycle.hook);
                if (hook) {
                    if (hook.kind === 'anchor') {
                        throw new Error(`Target ${targetName} cannot be part of anchor hook ${hook.name}`);
                    } else if (hook.kind === 'base' && hook.hasHooks) {
                        throw new Error(`Target ${targetName} must use hook of ${hook.name}:HOOK_NAME`);
                    }
                    registeredTargets.set(targetName, hook);
                } else {
                    throw new Error(`Lifecycle hook not found: ${configurations.lifecycle.hook}`);
                }
            } else {
                registeredTargets.set(targetName, null);
            }
        }
    }

    return registeredTargets;
};

const processTargets = ({
    isProjectJson,
    targets,
    lifecycleTargets,
    nxRegisteredTargets,
    targetsToRemove,
}: {
    isProjectJson: boolean;
    targets: AllTargets;
    lifecycleTargets: LifecycleTargets;
    nxRegisteredTargets: RegisteredTargets;
    targetsToRemove: Set<string>;
}): AllTargets => {

    const isNxJson = !isProjectJson;

    const processedTargets = { ...targets };
    const registeredTargets = new Map([
        ...nxRegisteredTargets,
        ...getRegisteredTargets({ targets, lifecycleTargets }),
    ]);

    const lifecycles: AllTargets = {};
    for (const [targetName, target] of lifecycleTargets.entries()) {
        lifecycles[targetName] = isProjectJson ? {
            dependsOn: [...target.dependsOn],
        } : {
            executor: NOOP_EXECUTOR,
            dependsOn: [...target.dependsOn],
            configurations: {
                __lifecycle: {},
            },
        };
    }

    for (const [targetName, originalTarget] of Object.entries(processedTargets)) {
        if ('__lifecycle' in (originalTarget.configurations ?? {})) {
            // Clean up all existing lifecycle hooks.
            // Some may be stale, others will be added back
            delete processedTargets[targetName];
        } else if (lifecycleTargets.has(targetName)) {
            // If this hook was _not_ cleaned up previous conditional, but was flagged
            // as a hook in the config:
            // If nx.json and only `dependsOn`, it is probably a deduped version so clean it up now.
            // Otherwise there is probably overlap between the hooks managed by this library and normal targets.
            // No correct path forward, so error.
            if (isProjectJson && isTargetWithDependsOnOnly(originalTarget)) {
                delete processedTargets[targetName];
            } else {
                throw new Error(`Overlap between target and lifecycle detected: ${targetName}`);
            }
        } else if (targetsToRemove.has(targetName)) {
            // Only really relevant in project.json, if there are hooks that were stale
            // (but didn't have `__lifecycle` because it is deduped)
            // clean those up now.
            delete processedTargets[targetName];
        } else {
            const target = { ...originalTarget };
            // Everything beyond here should be more "normal" targets
            const dependsOn = removeDependencyTargets({ target, lifecycleTargets, targetsToRemove });
            const configurations = target.configurations ?
                { ...target.configurations as Exclude<Configurations, { __lifecycle: {} }> } :
                {};
            if (registeredTargets.has(targetName)) {
                const hook = registeredTargets.get(targetName);
                if (hook) {
                    dependsOn.push(hook.previousHook);
                    lifecycles[hook.name]!.dependsOn!.push(targetName);
                    if (isProjectJson) {
                        configurations.lifecycle = { hook: hook.name };
                    }
                } else {
                    configurations.lifecycle = { hook: null };
                }
            }

            target.dependsOn = dependsOn;
            target.configurations = configurations;

            if (isNxJson) {

                if (dependsOn.length === 0 && !originalTarget.dependsOn) {
                    delete target.dependsOn;
                }
                if (isEmpty(configurations) && !originalTarget.configurations) {
                    delete target.configurations;
                }
            }

            processedTargets[targetName] = target;
        }
    }

    if (isNxJson) {
        for (const targetName of lifecycleTargets.keys()) {
            const target = lifecycles[targetName]!;
            if (target.dependsOn!.length === 0) {
                delete target.dependsOn;
            }
        }
    }

    return {
        ...processedTargets,
        ...lifecycles,
    };
};

const processNxJson = ({
    nxJson,
    lifecycleTargets,
    targetsToRemove,
}: {
    nxJson: NxJson;
    lifecycleTargets: Map<string, LifecycleTarget>;
    targetsToRemove: Set<string>;
}): NxJsonWithTargets => {

    const targets = nxJson.targetDefaults ?? {};

    return {
        ...nxJson,
        targetDefaults: processTargets({
            isProjectJson: false,
            targets,
            lifecycleTargets,
            nxRegisteredTargets: new Map(),
            targetsToRemove,
        }),
    }
};

const getHook = (configurations: Configurations): string | null =>
    (configurations as Exclude<Configurations, { __lifecycle: {} }>).lifecycle?.hook ?? null;

const stripOriginalConfigurations = (configurations: Configurations): Configurations => {
    if ('lifecycle' in configurations) {
        // Lifecycle was already declared, so maintain it
        return configurations;
    }

    // Otherwise lifecycle can be removed, and will be inherited
    const processedConfigurations = { ...configurations as Exclude<Configurations, { __lifecycle: {} }> };
    delete processedConfigurations.lifecycle;
    return processedConfigurations;
};

const mergeProjectConfigurationsFromNx = ({
    configurations,
    nxConfigurations,
    originalConfigurations
}: {
    configurations: Configurations;
    nxConfigurations: Configurations | null;
    originalConfigurations: Configurations | null;
}): Configurations | null => {
    const hook = getHook(configurations);

    if (nxConfigurations) {
        // Original configuration exists, so need to ensure it is properly inherited
        const nxHook = getHook(nxConfigurations);

        if (hook === nxHook) {
            // Registered hook is the same

            if (originalConfigurations) {
                // An original configuration existed, so defaults were not being inherited
                return stripOriginalConfigurations(originalConfigurations);
            }

            // Else never existed and doesn't need to for sake of lifecycle
            return null;
        }

        if (originalConfigurations) {
            // Don't need to do any inheriting, and keeps the lifecycle
            return stripOriginalConfigurations(originalConfigurations);
        }

        // Merge nx configuration with lifecycle
        return {
            ...nxConfigurations,
            ...configurations,
        };
    }

    if (hook) {
        // There is a hook to declare, and it was attached to config
        return configurations;
    }

    if (originalConfigurations) {
        // There is a config, but a meaningless null hook
        return stripOriginalConfigurations(originalConfigurations);
    }

    // No lifecycle to provide, so don't force a configurations object into settings
    return null;
};

const isNxAcceptableReplacementForDependsOn = ({
    dependsOn,
    nxDependsOn,
}: {
    dependsOn: DependsOn;
    nxDependsOn: DependsOn;
}): boolean => {
    // TODO more
    return deepEqual(dependsOn, nxDependsOn);
}

const mergeProjectDependsOnFromNx = ({
    dependsOn,
    nxDependsOn,
    originalDependsOn,
}: {
    dependsOn: DependsOn;
    nxDependsOn: DependsOn | null;
    originalDependsOn: DependsOn | null;
}): DependsOn | null => {

    if (nxDependsOn) {

        if (originalDependsOn) {
            return dependsOn;
        }

        if (isNxAcceptableReplacementForDependsOn({ dependsOn, nxDependsOn })) {
            return null;
        }

        return dependsOn;
    }

    if (originalDependsOn) {
        return dependsOn;
    }

    if (dependsOn.length > 0) {
        return dependsOn;
    }

    return null;
};

const dedupeProjectJsonFromNx = ({ lifecycleTargets, nxJson, projectJson, originalProjectJson }: {
    lifecycleTargets: LifecycleTargets;
    nxJson: NxJsonWithTargets;
    projectJson: ProjectJsonWithTargets;
    originalProjectJson: ProjectJson;
}): ProjectJsonWithTargets => {

    const targets: AllTargets = {};

    for (const [targetName, target] of Object.entries(projectJson.targets)) {
        let processedTarget: Target;
        const nxTarget = nxJson.targetDefaults[targetName] ?? {};
        const nxConfigurations = nxTarget.configurations ?? null;
        const nxDependsOn = nxTarget.dependsOn ?? null;

        if (lifecycleTargets.has(targetName)) {
            processedTarget = {};
            const dependsOn = target.dependsOn!;

            if (nxDependsOn) {
                if (!isNxAcceptableReplacementForDependsOn({ dependsOn, nxDependsOn })) {
                    processedTarget.dependsOn = dependsOn;
                }
            } else if (dependsOn.length > 0) {
                processedTarget.dependsOn = dependsOn;
            }

        } else {

            const originalTarget = originalProjectJson.targets?.[targetName] ?? {};
            processedTarget = { ...target };

            const mergedDependsOn = mergeProjectDependsOnFromNx({
                dependsOn: target.dependsOn!,
                nxDependsOn,
                originalDependsOn: originalTarget.dependsOn ?? null,
            });
            if (mergedDependsOn) {
                processedTarget.dependsOn = mergedDependsOn;
            } else {
                delete processedTarget.dependsOn;
            }

            const mergedConfigurations = mergeProjectConfigurationsFromNx({
                configurations: target.configurations!,
                nxConfigurations,
                originalConfigurations: originalTarget.configurations ?? null,
            });
            if (mergedConfigurations) {
                processedTarget.configurations = mergedConfigurations;
            } else {
                delete processedTarget.configurations;
            }
        }

        targets[targetName] = processedTarget;
    }

    return {
        ...projectJson,
        targets,
    };
};

const processProjectJson = ({
    nxJson,
    nxRegisteredTargets,
    projectJson,
    lifecycleTargets,
    targetsToRemove,
}: {
    nxJson: NxJsonWithTargets;
    nxRegisteredTargets: RegisteredTargets;
    projectJson: ProjectJson;
    lifecycleTargets: Map<string, LifecycleTarget>;
    targetsToRemove: Set<string>;
}): ProjectJson => {

    const targets = projectJson.targets ?? {};

    const processedTargets = processTargets({
        isProjectJson: true,
        targets,
        lifecycleTargets,
        nxRegisteredTargets,
        targetsToRemove,
    });

    if (
        !('targets' in projectJson) &&
        isEmpty(processedTargets)
    ) {
        return projectJson;
    }

    return dedupeProjectJsonFromNx({
        lifecycleTargets,
        nxJson,
        projectJson: {
            ...projectJson,
            targets: processedTargets,
        },
        originalProjectJson: projectJson,
    });
};

export const processNxAndProjectJsons = ({
    nxJson,
    projectJsons,
    options,
}: {
    nxJson: NxJson;
    projectJsons: ProjectJson[];
    options: ProcessorOptions;
}): {
    processedNxJson: NxJson;
    processedProjectJsons: ProjectJson[];
} => {

    const lifecycleTargets = calculateTargets(options);
    const targetsToRemove = calculateTargetsToRemove({
        lifecycleTargets,
        nxJson,
    });

    const processedNxJson = processNxJson({
        nxJson,
        lifecycleTargets,
        targetsToRemove,
    });

    const nxRegisteredTargets = getRegisteredTargets({
        targets: processedNxJson.targetDefaults,
        lifecycleTargets,
    });
    const processedProjectJsons = projectJsons.map(projectJson => processProjectJson({
        nxJson: processedNxJson,
        projectJson,
        lifecycleTargets,
        targetsToRemove,
        nxRegisteredTargets,
    }));

    const response: ReturnType<typeof processNxAndProjectJsons> = {
        processedNxJson,
        processedProjectJsons,
    };

    if (
        !('targetDefaults' in nxJson) &&
        isEmpty(processedNxJson.targetDefaults)
    ) {
        delete response.processedNxJson.targetDefaults;
    }

    return response;
};
