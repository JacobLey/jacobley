import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'node:path';
import type { ExecutorContext } from '@nx/devkit';
import { isCI } from 'ci-info';
import json5 from 'json5';
import type { UpdateTsReferencesOptions } from './schema.js';

interface NormalizedOptions {
    packageRoot: string;
    tsConfig: string;
    check: boolean;
    dryRun: boolean;
    dependencies: string[];
}

const normalizeOptions = (options: UpdateTsReferencesOptions, context: ExecutorContext): NormalizedOptions => {

    const projectName = context.projectName!;
    const packageRoot = resolve(
        context.root,
        context.projectsConfigurations!.projects[projectName]!.root
    );

    return {
        check: options.check ?? isCI,
        dryRun: options.dryRun ?? false,
        packageRoot,
        tsConfig: resolve(
            packageRoot,
            'tsconfig.json'
        ),
        dependencies: context.projectGraph!.dependencies[projectName]!.filter(
            dependency => context.projectsConfigurations!.projects[dependency.target]
        ).map(
            dependency => resolve(
                context.root,
                context.projectsConfigurations!.projects[dependency.target]!.root,
                'tsconfig.json'
            )
        ),
    };
};

const safeReadFile = async (path: string): Promise<{
    path: string;
    rawData: string;
    json: { references?: { path: string }[] }
} | null> => {
    try {
        const rawData = await readFile(path, 'utf8');

        return {
            path,
            rawData,
            json: json5.parse(rawData),
        };
    } catch {
        return null;
    }
}

export default async (
    options: UpdateTsReferencesOptions,
    context: ExecutorContext
): Promise<{ success: boolean }> => {

    const normalized = normalizeOptions(options, context);

    const [
        packageTsConfig,
        ...dependencyTsConfigs
    ] = await Promise.all([
        safeReadFile(normalized.tsConfig),
        ...normalized.dependencies.map(path => safeReadFile(path))
    ]);

    if (!packageTsConfig) {
        console.error('tsconfig.json not found');
        return { success: false };
    }

    const foundDependencies = dependencyTsConfigs.filter((ts): ts is NonNullable<typeof ts> => !!ts);

    packageTsConfig.json.references = foundDependencies.sort(
        (a, b) => a.path.localeCompare(b.path)
    ).map(
        ({ path }) => ({
            path: resolve(normalized.packageRoot, path, '..'),
        })
    );

    const dataToWrite = json5.stringify(packageTsConfig.json, null, 2);

    if (dataToWrite === packageTsConfig.rawData) {
        return { success: true };
    }

    if (normalized.check) {
        console.log('tsconfig.json is out of date');
        return { success: false };
    }
    if (!normalized.dryRun) {
        await writeFile(normalized.tsConfig, dataToWrite, 'utf8');
    }

    return { success: true };
};
