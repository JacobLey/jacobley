#!/usr/bin/env node

import { exec } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// [node, remove-hash.mjs, package-name@vx.x.x, github_sha]
const [packageVersion, sha] = process.argv.slice(2);

// Parse package + version
const { packageName, version } = /^(?<packageName>.+)@v(?<version>\d+\.\d+\.\d+)$/u.exec(packageVersion).groups;

// Get URL for tarball based on version + git hash
const { stdout: tarball } = await execAsync(`npm view ${packageName}@${version}-dev.${sha} dist.tarball`);

// Download and extract tarball
await execAsync(`curl -o package.tgz ${tarball}`);
await execAsync('tar -xf package.tgz');

// Remove `-dev.X` suffixes from versions
const packageJsonPath = 'package/package.json';
const rawPackageJson = await readFile(packageJsonPath, 'utf8');
await writeFile(
    packageJsonPath,
    rawPackageJson.replaceAll(/-dev\.\w+/gu, ''),
    'utf8'
);

// Check if this is the "latest" version
const { stdout: later } = await execAsync(`npm view '${packageName}@>${version}' version`);

// Publish
const tag = later ? 'ignore' : 'latest';
await execAsync(`npm publish ./package --tag=${tag}`);

if (later) {
    await execAsync(`npm dist-tag rm ${packageName} ignore`);
}
