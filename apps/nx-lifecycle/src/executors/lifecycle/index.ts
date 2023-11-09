import { readFile, writeFile } from 'node:fs/promises';
import type { ExecutorContext } from '@nx/devkit';
import type { LifecycleOptions } from './schema.js';
import { lifecycle } from './lifecycle.js';

export default async (
    options: LifecycleOptions,
    context: ExecutorContext
): Promise<{ success: boolean }> => {

    try {
        return await lifecycle(options, context, {
            readFile,
            writeFile,
        });
    }  catch (error) {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error('Unknown Error', error);
        }
        return { success: false };
    }
};
