import type { readFile, writeFile } from 'node:fs/promises';
import type { ExecutorContext } from '@nx/devkit';
import type { isCI } from 'ci-info';

export type SimpleExecutorContext = Pick<ExecutorContext, 'projectsConfigurations' | 'root'>;

export interface LifecycleDI {
    isCI: typeof isCI;
    readFile: typeof readFile;
    writeFile: typeof writeFile;
}
