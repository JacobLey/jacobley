'use strict';

const { readFileSync } = require('node:fs');
const Path = require('node:path');

const rawRushJson = readFileSync(
    Path.join(
        __dirname,
        '../../rush.json'
    ),
    'utf8'
);

module.exports = JSON.parse(
    rawRushJson
        // Remove single-line comments
        .replaceAll(/^\s*\/\/[^\n]*/ugm, '')
        // Remove multi-line comments
        .replaceAll(/\/\*[\s\S]*?\*\//ug, '')
);
