import Path from 'node:path';
import DefaultAjv from 'ajv/dist/2020.js';
import { defaultImport } from 'default-import';
import { findImport } from 'find-import';
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
    configPath: string | null;
    root: string;
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

const findAndLoadConfigs = async ({
    configFile,
    cwd,
    root,
}: {
    configFile: string | undefined;
    cwd: string;
    root: string;
}): Promise<{
    filePath: string | null;
    config: ConfigSchema;
}> => {

    const rawConfig = configFile ?
        await findImport<ConfigSchema>(configFile, {
            cwd,
            startAt: root,
        }) :
        await findImport<ConfigSchema>(
            [
                'rivendell.js',
                'rivendell.cjs',
                'rivendell.mjs',
                'rivendell.json',
            ],
            {
                cwd: root,
                startAt: root,
            }
        );

    if (rawConfig && validator(rawConfig.content)) {
        return {
            filePath: rawConfig.filePath,
            config: rawConfig.content,
        };
    }
    return {
        filePath: null,
        config: {},
    };
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

    if (params.configFile && !/\.(?:json|[cm]?js)$/u.test(params.configFile)) {
        throw new Error(`Unsupported file type: ${params.configFile}`);
    }

    const root = await gitRoot(params);
    const { config, filePath } = await findAndLoadConfigs({
        ...params,
        root,
    });

    return {
        configPath: filePath,
        root,
        templateDirectory: Path.resolve(
            filePath ? Path.dirname(filePath) : root,
            config.templateDirectory ?? './rivendell'
        ),
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
