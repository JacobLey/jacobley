import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { listPackages } from 'packages-list';
import { hash } from 'rivendell';
import type { CommandModule } from 'yargs';

const execAsync = promisify(exec);

export const getHashVersion: CommandModule<
    unknown,
    {
        project: string;
    }
> = {
    command: 'get-hash-version [project]',
    describe: 'Lookup github sha that pairs with package hash',
    builder: (yargs) =>
        yargs
            .positional('project', {
                description: 'Package to lookup',
                type: 'string',
                demandOption: true,
            })
            .strict(),
    handler: async (options) => {
        const { project } = options;

        const [packageHash, allPackages] = await Promise.all([
            hash(project, { manager: 'rush', only: 'prod' }),
            listPackages({ manager: 'rush' }),
        ]);

        const { version } = allPackages.find(
            (packageMeta) => packageMeta.name === project
        )!.packageJson;

        // Get git sha for given package hash
        const { stdout: sha } = await execAsync(
            `npm view ${project}@v${version}-dev.${packageHash} gitsha`
        );

        console.info(
            [
                `git tag ${project}@v${version} ${sha.trim()}`,
                `git push origin ${project}@v${version}`,
            ].join(' && ')
        );
    },
};
