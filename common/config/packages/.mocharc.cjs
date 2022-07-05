'use strict';

const nodeOptions = ['conditions=patchable'];

// eslint-disable-next-line node/no-process-env
const nycCwd = process.env.NYC_CWD;

if (nycCwd) {
    const packageName = nycCwd.split('/').pop();
    nodeOptions.push(`conditions=nyc-${packageName}`);
}

module.exports = {
    'node-option': nodeOptions,
    'recursive': true,
    'ui': 'exports',
};
