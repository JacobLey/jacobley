#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';

const [
    packageName,
    version,
] = process.argv.slice(2);

let exists = false;

try {
    const child = spawn('npm', ['view', `${packageName}@${version}`]);
    const readable = Readable.from(child.stdout.setEncoding('utf8'));

    const data = await readable.toArray();

    exists = data.length > 0;
} catch {}

console.info(exists);
