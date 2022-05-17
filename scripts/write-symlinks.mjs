#!/usr/bin/env node

import fs from 'node:fs/promises';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';

const configsDir = Path.join(fileURLToPath(import.meta.url), '../../common/configs');
const packagesDir = Path.join(fileURLToPath(import.meta.url), '../../packages');

const [
    configNames,
    packageNames,
] = await Promise.all([
    fs.readdir(configsDir),
    fs.readdir(packagesDir),
]);

let unknownError = false;
let noError = false;

await Promise.all(configNames.map(async configName => {
    await Promise.all(packageNames.map(async packageName => {
        try {
            const symlinkPath = Path.join(packagesDir, packageName, configName);
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
