import type fs from 'node:fs/promises';
import type { ExecutorContext } from '@nx/devkit';
import { isNxJson, isProjectJson, type NxJson, type ProjectJson } from '#schemas';
import { normalizeOptions, type NormalizedOptions } from './normalizer.js';
import { processNxAndProjectJsons } from './processor.js';

import type { LifecycleOptions } from './schema.js';

interface LoadedJsonConfig<T> {
    path: string;
    rawData: string;
    data: T;
};
const loadJsonConfigs = async (
    {
        nxJsonPath,
        packageJsonPaths,
    }: NormalizedOptions,
    {
        readFile
    }: Pick<typeof fs, 'readFile'>
): Promise<{
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

export const lifecycle = async (
    options: LifecycleOptions,
    context: ExecutorContext,
    {
        readFile,
        // writeFile,
    }: Pick<typeof fs, 'readFile' | 'writeFile'>
): Promise<{ success: boolean }> => {

    const normalized = normalizeOptions(options, context);

    const { nxJson, projectJsons } = await loadJsonConfigs(normalized, { readFile });

    const {
        processedNxJson,
        processedProjectJsons,
    } = processNxAndProjectJsons({
        nxJson: nxJson.data,
        projectJsons: projectJsons.map(({ data }) => data),
        options: normalized,
    });

    console.log(JSON.stringify(processedNxJson, null, 2));
    console.log(JSON.stringify(processedProjectJsons, null, 2));

    return { success: false };
};
