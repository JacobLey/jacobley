'use strict';

const nodeOptions = [];

// eslint-disable-next-line n/no-process-env
const nycCwd = process.env.NYC_CWD;

if (nycCwd) {
    const packageName = nycCwd.split('/').pop();
    nodeOptions.push(`conditions=nyc-${packageName}`);
}

module.exports = {
    'node-option': nodeOptions,
    'recursive': true,
};
