'use strict';

const nycConfig = require('./nyc.config.cjs');

module.exports = {
    ...nycConfig,
    extensions: ['js', 'cjs', '.mjs'],
    exclude: ['**/*.ts', 'node_modules/**'],
    delete: true,
};
