import { join } from 'node:path';
import type { LifecycleOptions } from './schema.js';
import type { LifecycleDI, SimpleExecutorContext } from './types.js';

export interface NormalizedOptions {
    check: boolean;
    dryRun: boolean;
    nxJsonPath: string;
    packageJsonPaths: { name: string; path: string }[];
    stages: NonNullable<LifecycleOptions['stages']>;
    targets: NonNullable<LifecycleOptions['targets']>;
}

export const normalizeOptions = (
    options: LifecycleOptions,
    context: SimpleExecutorContext,
    { isCI }: Pick<LifecycleDI, 'isCI'>
): NormalizedOptions => ({
    check: options.check ?? isCI,
    dryRun: options.dryRun ?? false,
    nxJsonPath: join(context.root, 'nx.json'),
    packageJsonPaths: Object.values(context.projectsConfigurations!.projects).map(
        (projectConfig) => ({
            name: projectConfig.name!,
            path: join(context.root, projectConfig.root, 'project.json'),
        })
    ),
    stages: options.stages ?? {},
    targets: options.targets ?? {},
});
