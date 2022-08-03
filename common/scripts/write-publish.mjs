#!/usr/bin/env node

import { constants, promises as fs } from 'node:fs';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import rushJson from './rush-json.cjs';

const configsDir = Path.join(fileURLToPath(import.meta.url), '../../config/publish');
const { projects } = rushJson;

const configNames = await fs.readdir(configsDir);

let unknownError = false;

await Promise.all(configNames.map(async configName => {
    await Promise.all(projects.map(async project => {
        try {
            await fs.copyFile(
                Path.join(configsDir, configName),
                Path.join(
                    fileURLToPath(import.meta.url),
                    '../../..',
                    project.projectFolder,
                    configName
                ),
                constants.COPYFILE_EXCL
            );
        } catch (err) {
            unknownError = err;
        }
    }));
}));

if (unknownError) {
    process.exitCode = 1;
    console.error(unknownError);
}
