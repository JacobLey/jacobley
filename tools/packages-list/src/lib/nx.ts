import { homedir } from 'node:os';
import Path from 'node:path';
import { type Directory, findImport } from 'find-import';
import { patch } from 'named-patch';
import { globPackages } from './lib/glob-packages.js';
import type { PackageMeta } from './lib/types.js';

export const nx = async (
    options: { cwd?: Directory }
): Promise<PackageMeta[] | null> => {

    // https://nx.dev/configuration/projectjson#workspace-json
    const workspaceJson = await patch(findImport)<{
        projects?: Record<string, string>;
    }>('workspace.json', {
        ...options,
        direction: 'down',
        startAt: homedir(),
    });

    if (!workspaceJson || !workspaceJson.content.projects) {
        return null;
    }

    return globPackages({
        rootPath: Path.dirname(workspaceJson.filePath),
        dirGlobs: Object.keys(workspaceJson.content.projects),
    });
};
