import fs from 'node:fs/promises';
import Path from 'node:path';
import { dependencyOrder, type PackageManager } from 'dependency-order';
import { parseCwd } from 'parse-cwd';
import { loadConfig } from './config.js';
import { gitRoot } from './git.js';
import { processFile } from './process-yaml.js';

export const ciDirectories = [
    {
        kind: 'github',
        template: 'github-workflows',
        ci: '.github/workflows',
    },
] as const;

const deepListDirectories = async (dir: string): Promise<string[]> => {

    try {
        const files = await fs.readdir(dir, { withFileTypes: true });

        const allFiles = await Promise.all(files.map(async file => {
            const fileName = Path.join(dir, file.name);
            return file.isFile() ? fileName : deepListDirectories(fileName);
        }));
        return allFiles.flat();
    } catch {
        return [];
    }
};

export const compileCi = async (options: {
    clean: boolean;
    cwd: string;
    configFile: string | undefined;
    dryRun: boolean;
    manager: PackageManager | undefined;
    templateDirectory: string | undefined;
}): Promise<string[]> => {

    const cwd = await parseCwd(options.cwd);

    const [config, dependencies, root] = await Promise.all([
        loadConfig({
            cwd,
            configFile: options.configFile,
        }),
        dependencyOrder({ cwd, manager: options.manager }),
        gitRoot({ cwd }),
    ]);

    const templateDirectory = Path.resolve(cwd, options.templateDirectory ?? config.templateDirectory);

    const writtenFiles: string[] = [];
    for (const { ci, kind, template } of ciDirectories) {

        const ciDir = Path.join(root, ci);
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const toRelativeCi = (path: string): string => Path.relative(ciDir, path);
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const toFullCi = (path: string): string => Path.resolve(ciDir, path);

        const templateCiDir = Path.join(templateDirectory, template);
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const toRelativeTemplate = (path: string): string => Path.relative(templateCiDir, path);
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const toFullTemplate = (path: string): string => Path.resolve(templateCiDir, path);

        const [existingFiles, templateFiles] = await Promise.all([
            deepListDirectories(ciDir),
            deepListDirectories(templateCiDir),
        ]);

        const existingSet = new Set(existingFiles.map(f => toRelativeCi(f)));
        const templateSet = new Set(templateFiles.map(f => toRelativeTemplate(f)));

        if (options.clean) {
            for (const existing of existingSet) {
                if (!templateSet.has(existing)) {
                    writtenFiles.push(toFullCi(existing));
                    if (!options.dryRun) {
                        await fs.rm(toFullCi(existing));
                    }
                }
            }
        }

        for (const writeToWrite of templateSet) {
            const [processed, existing] = await Promise.all([
                processFile({
                    path: toFullTemplate(writeToWrite),
                    kind,
                    dependencies,
                    root,
                }),
                existingSet.has(writeToWrite) ? fs.readFile(toFullCi(writeToWrite), 'utf8') : null,
            ]);

            if (processed !== existing) {
                writtenFiles.push(toFullCi(writeToWrite));
                if (!options.dryRun) {
                    await fs.mkdir(Path.dirname(toFullCi(writeToWrite)), {
                        recursive: true,
                    });
                    await fs.writeFile(toFullCi(writeToWrite), processed);
                }
            }
        }
    }

    return writtenFiles;
};
