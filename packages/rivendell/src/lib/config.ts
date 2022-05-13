import { createRequire } from 'node:module';
import Path from 'node:path';
import DefaultAjv from 'ajv/dist/2020.js';
import { defaultImport } from 'default-import';
import {
    arraySchema,
    booleanSchema,
    mergeSchema,
    objectSchema,
    type SchemaType,
    stringSchema,
} from 'juniper';
import minimatch from 'minimatch';
import { gitRoot } from './git.js';

const Ajv = defaultImport(DefaultAjv);

const stringOrArray = mergeSchema().oneOf([
    stringSchema(),
    arraySchema(stringSchema()),
]);

const configSchema = objectSchema({
    properties: {
        templateDirectory: stringSchema(),
        dependencies: arraySchema({
            items: objectSchema({
                properties: {
                    root: booleanSchema(),
                    dev: booleanSchema(),
                    include: stringOrArray,
                    exclude: stringOrArray,
                    paths: stringOrArray,
                    ignorePaths: stringOrArray,
                },
                required: ['include'],
            }),
        }),
    },
}).toJSON();

export interface ConfigSchema extends SchemaType<typeof configSchema> {}

const validator = new Ajv({ strict: true }).compile<ConfigSchema>(configSchema);

export interface Config {
    configPath: string;
    templateDirectory: string;
    dependencies: {
        root: boolean;
        dev: boolean;
        includePackage: minimatch.IMinimatch['match'];
        includePath: minimatch.IMinimatch['match'];
        patterns: {
            include: string[];
            exclude: string[];
            paths: string[];
            ignorePaths: string[];
        };
    }[];
}

const loadConfigFile = async (path: string): Promise<{
    config: ConfigSchema;
    path: string;
} | null> => {
    let rawConfig: unknown;
    if (path.endsWith('.json')) {
        try {
            rawConfig = createRequire(import.meta.url)(path);
        } catch {}
    } else {
        try {
            rawConfig = await import(path);
        } catch {}
    }
    rawConfig = defaultImport(rawConfig);
    if (validator(rawConfig)) {
        return { config: rawConfig, path };
    }
    return null;
};

const findAndLoadConfigs = async ({
    configFile,
    cwd,
    root,
}: {
    configFile: string | undefined;
    cwd: string;
    root: string;
}): Promise<{
    config: ConfigSchema;
    path: string;
}> => {
    let config: { config: ConfigSchema; path: string } | null | undefined;
    if (configFile) {
        config = await loadConfigFile(Path.resolve(cwd, configFile));
    } else {
        const configs = await Promise.all([
            'rivendell.js',
            'rivendell.cjs',
            'rivendell.mjs',
            'rivendell.json',
        ].map(
            async file => loadConfigFile(Path.resolve(root, file))
        ));
        config = configs.find(Boolean);
    }

    if (!config) {
        throw new Error('rivendell file not found');
    }

    return config;
};

const arrayify = (str: string | string[] = []): string[] => (Array.isArray(str) ? str : [str]);

const strArrayToMinimatch = (toMatch: string | string[] = []): minimatch.IMinimatch['match'] => {

    const arr = arrayify(toMatch);

    const miniMatches = arr.map(pattern => new minimatch.Minimatch(pattern));

    return name => miniMatches.some(m => m.match(name));
};

export const loadConfig = async (params: {
    configFile: string | undefined;
    cwd: string;
}): Promise<Config> => {

    const root = await gitRoot(params);
    const { config, path } = await findAndLoadConfigs({
        ...params,
        root,
    });

    return {
        templateDirectory: Path.resolve(root, config.templateDirectory ?? './rivendell'),
        configPath: path,
        dependencies: (config.dependencies ?? []).map(packageDependency => {

            const include = strArrayToMinimatch(packageDependency.include);
            const exclude = strArrayToMinimatch(packageDependency.exclude);
            const paths = strArrayToMinimatch(packageDependency.paths);
            const ignorePaths = strArrayToMinimatch(packageDependency.ignorePaths);

            return {
                root: packageDependency.root ?? false,
                dev: packageDependency.dev ?? false,
                includePackage: name => include(name) && !exclude(name),
                includePath: name => paths(name) && !ignorePaths(name),
                patterns: {
                    include: arrayify(packageDependency.include),
                    exclude: arrayify(packageDependency.include),
                    paths: arrayify(packageDependency.paths),
                    ignorePaths: arrayify(packageDependency.ignorePaths),
                },
            };
        }),
    };
};
