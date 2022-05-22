import Path from 'node:path';
import type * as RushLib from '@microsoft/rush-lib';
import { patch } from 'named-patch';
import { type Directory, parseCwd } from 'parse-cwd';
import which from 'which';
import type { PackageMeta } from './lib/types.js';

export const rush = async (options?: {
    cwd: Directory;
}): Promise<PackageMeta[] | null> => {

    let rushLocation: string;
    try {
        rushLocation = await patch(which)('rush');
    } catch {
        return null;
    }

    const rushLibLocations = [
        // Rush is installed globally (local)
        '../../lib/node_modules/@microsoft/rush/node_modules/@microsoft/rush-lib/lib/index.js',
        // Rush is installed in CI via install-run-rush
        '../../@microsoft/rush-lib/lib/index.js',
    ];

    const [
        cwd,
        rushLibs,
    ] = await Promise.all([
        parseCwd(options),
        Promise.all(rushLibLocations.map(
            async rushLibLocation => import(Path.join(rushLocation, rushLibLocation)) as Promise<typeof RushLib>
        ).map(async prom => prom.catch(() => null))),
    ]);

    const rushLib = rushLibs.find(Boolean);

    if (rushLib) {

        const { projects } = rushLib.RushConfiguration.loadFromDefaultLocation({
            startingFolder: cwd,
        });

        return projects.map(project => ({
            directory: project.projectFolder,
            name: project.packageName,
            packageJson: project.packageJson,
        }));
    }
    return null;
};
