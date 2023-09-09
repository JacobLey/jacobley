import { writeFile } from 'node:fs/promises';
import Path from 'node:path';
import { dependencyOrder, dependencyOrderByPackage } from 'dependency-order';
import { hash } from 'rivendell';
import type { CommandModule } from 'yargs';

export const setDevVersion: CommandModule<
    unknown,
    {
        project: string;
    }
> = {
    command: 'set-dev-version [project]',
    describe: 'Suffix package versions with `-dev.HASH`',
    builder: (yargs) =>
        yargs
            .positional('project', {
                description: 'Package (+ dependencies) to set versions',
                type: 'string',
                demandOption: true,
            })
            .strict(),
    handler: async (options) => {
        const dependencies = await dependencyOrder({ manager: 'rush' });
        const dependencyMap = dependencyOrderByPackage(dependencies);

        const project = dependencyMap[options.project]!;

        const allPackages = [
            project.packageMeta,
            ...project.dependencies.map(
                (dependencyName) => dependencyMap[dependencyName]!.packageMeta
            ),
            ...project.devDependencies.map(
                (devDependencyName) =>
                    dependencyMap[devDependencyName]!.packageMeta
            ),
        ];

        // Delay writes until all reads are done, just to be safe
        const todoWrites: (() => Promise<void>)[] = [];

        for (const packageMeta of allPackages) {
            const packageHash = await hash(packageMeta.name, { only: 'prod' });
            const packageJsonClone = { ...packageMeta.packageJson };
            packageJsonClone.version = `${packageJsonClone.version}-dev.${packageHash}`;

            todoWrites.push(async () =>
                writeFile(
                    Path.join(packageMeta.directory, 'package.json'),
                    JSON.stringify(packageJsonClone, null, 2),
                    'utf8'
                )
            );
        }

        await Promise.all(todoWrites.map(async (todo) => todo()));
    },
};
