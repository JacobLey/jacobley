#!/usr/bin/env node

import fs from 'node:fs/promises';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import rushJson from './rush-json.cjs';

const configsDir = Path.join(fileURLToPath(import.meta.url), '../../config/packages');
const { projects } = rushJson;

const configNames = await fs.readdir(configsDir);

let unknownError = false;
let noError = false;

await Promise.all(configNames.map(async configName => {
    await Promise.all(projects.map(async project => {
        try {
            const symlinkPath = Path.join(
                fileURLToPath(import.meta.url),
                '../../..',
                project.projectFolder,
                configName
            );
            await fs.symlink(
                Path.relative(
                    Path.dirname(symlinkPath),
                    Path.join(configsDir, configName)
                ),
                symlinkPath
            );
            noError = true;
        } catch (err) {
            if (err.code !== 'EEXIST') {
                unknownError = err;
            }
        }
    }));
}));

if (unknownError) {
    process.exitCode = 1;
    console.error(unknownError);
// eslint-disable-next-line node/no-process-env
} else if (process.env.CI && noError) {
    process.exitCode = 1;
    console.error('Symlink files not generated and checked into git');
}
