import { join } from 'node:path';
import type { ExecutorContext } from '@nx/devkit';
import { isCI } from 'ci-info';
import type { LifecycleOptions } from './schema.js';

export interface NormalizedOptions {
    check: boolean;
    dryRun: boolean;
    nxJsonPath: string;
    packageJsonPaths: string[];
    stages: NonNullable<LifecycleOptions['stages']>;
}

export const normalizeOptions = (
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
