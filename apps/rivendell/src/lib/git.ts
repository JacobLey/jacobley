import { spawn } from 'node:child_process';
import Path from 'node:path';
import { Readable } from 'node:stream';

const spawnToText = async (
    cmd: string,
    args: string[],
    options: { cwd: string | undefined }
): Promise<string> => {

    const child = spawn(cmd, args, options);
    const readable = Readable.from(child.stdout.setEncoding('utf8'));

    const data = await (readable as unknown as { toArray: () => Promise<string[]> }).toArray();

    // Strip newline
    return data.join('').slice(0, -1);
};

export const gitRoot = async ({ cwd }: {
    cwd: string | undefined;
}): Promise<string> => spawnToText(
    'git',
    ['rev-parse', '--show-toplevel'],
    { cwd }
);

export interface GitFile {
    relativePath: string;
    fullPath: string;
    mode: string;
}

export const gitTrackedFiles = async ({
    cwd,
}: {
    cwd: string;
}): Promise<GitFile[]> => {

    const [files, root] = await Promise.all([
        spawnToText(
            'git',
            ['ls-tree', '-rz', '--full-tree', '--format="%(objectmode)|%(path)"', 'HEAD'],
            { cwd }
        ),
        gitRoot({ cwd }),
    ]);

    return files.split('\u0000').map(line => {
        const [mode, ...splitPath] = line.slice(1, -1).split('|');

        let path = splitPath.join('|');
        if (path.startsWith('"') && path.endsWith('"')) {
            path = JSON.parse(path) as string;
        }

        return {
            mode: mode!,
            relativePath: path,
            fullPath: Path.join(root, path),
        };
    });
};

export const gitDiffFiles = async ({
    cwd,
    baseRef,
    headRef,
}: {
    cwd: string;
    baseRef: string;
    headRef: string;
}): Promise<GitFile[]> => {

    const [
        files,
        root,
    ] = await Promise.all([
        spawnToText(
            'git',
            ['diff', '--raw', '-z', `${baseRef}..${headRef}`],
            { cwd }
        ),
        gitRoot({ cwd }),
    ]);

    if (!files) {
        return [];
    }

    const gitFiles: {
        relativePath: string;
        mode: string;
    }[] = [];

    const split = files.split('\u0000');

    const modeRegExp = /^:(?<oldMode>\d{6}) (?<newMod>\d{6}).+ (?<kind>\w+)$/u;
    for (let i = 0; i < split.length; ++i) {
        const modes = split[i]!;
        const {
            oldMode,
            newMode,
            kind,
        } = modeRegExp.exec(modes)!.groups! as {
            oldMode: string;
            newMode: string;
            kind: string;
        };

        const firstPath = split[++i]!;

        if (kind === 'A') {
            gitFiles.push({
                mode: newMode,
                relativePath: firstPath,
            });
            continue;
        }
        if (kind === 'D') {
            gitFiles.push({
                mode: oldMode,
                relativePath: firstPath,
            });
            continue;
        }

        gitFiles.push({
            mode: oldMode,
            relativePath: firstPath,
        });

        if (kind.startsWith('R')) {
            const secondPath = split[++i]!;
            gitFiles.push({
                mode: newMode,
                relativePath: secondPath,
            });
        } else {
            gitFiles.push({
                mode: newMode,
                relativePath: firstPath,
            });
        }
    }

    return gitFiles.map(gf => ({
        ...gf,
        fullPath: Path.join(root, gf.relativePath),
    }));
};
