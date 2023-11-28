import { isNxJson, isProjectJson, type NxJson, type ProjectJson } from '#schemas';
import { normalizeOptions, type NormalizedOptions } from './normalizer.js';
import { processNxAndProjectJsons } from './processor.js';
import type { LifecycleDI, SimpleExecutorContext } from './types.js';

import type { LifecycleOptions } from './schema.js';

interface LoadedJsonConfig<T> {
    name: string;
    path: string;
    data: T;
};
const loadJsonConfigs = async (
    {
        nxJsonPath,
        packageJsonPaths,
    }: NormalizedOptions,
    {
        readFile
    }: Pick<LifecycleDI, 'readFile'>
): Promise<{
    nxJson: LoadedJsonConfig<NxJson>;
    projectJsons: LoadedJsonConfig<ProjectJson>[];
}> => {

    const [
        rawNxJson,
        ...rawProjectJsons
    ] = await Promise.all([
        readFile(nxJsonPath, 'utf8'),
        ...packageJsonPaths.map(async ({ name, path }) => ({
            name,
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
            name: 'nx.json',
            path: nxJsonPath,
            data: parsedNxJson,
        },
        projectJsons: rawProjectJsons.map(({ name, path, rawData }) => {

            const data = JSON.parse(rawData);

            if (!isProjectJson(data)) {
                throw new Error(`Failed to parse ${path}: ${isProjectJson.errors!}`);
            }

            return {
                name,
                path,
                data,
            };
        }),
    };
};

interface ProcessedJsonConfig<T> extends LoadedJsonConfig<T> {
    processed: T;
};
const saveJsonConfigs = async ({ jsons, options }: {
    jsons: ProcessedJsonConfig<unknown>[];
    options: NormalizedOptions;
}, { writeFile }: Pick<LifecycleDI, 'writeFile'>): Promise<void> => {

};

export const lifecycle = async (
    options: LifecycleOptions,
    context: SimpleExecutorContext,
    {
        isCI,
        readFile,
        writeFile,
    }: LifecycleDI
): Promise<{ success: boolean }> => {

    const normalized = normalizeOptions(options, context, { isCI });

    const { nxJson, projectJsons } = await loadJsonConfigs(normalized, { readFile });

    const {
        processedNxJson,
        processedProjectJsons,
    } = processNxAndProjectJsons({
        nxJson: nxJson.data,
        projectJsons: projectJsons.map(({ data }) => data),
        options: normalized,
    });

    await saveJsonConfigs({
        jsons: [
            {
                ...nxJson,
                processed: processedNxJson,
            },
            ...projectJsons.map((projectJson, i) => ({
                ...projectJson,
                processed: processedProjectJsons[i]!,
            })),
        ],
        options: normalized,
    }, { writeFile });

    return { success: true };
};
