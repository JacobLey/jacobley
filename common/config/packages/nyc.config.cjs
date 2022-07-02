'use strict';

module.exports = {
    'check-coverage': true,

    'lines': 100,
    'statements': 100,
    'functions': 100,
    'branches': 100,

    'reporter': ['text-summary', 'html'],

    'watermarks': {
        lines: [100, 95],
        functions: [100, 95],
        branches: [100, 95],
        statements: [100, 95],
    },

    'exclude': [
        // During CI.
        'dist/tests/**',
        'nyc/**',
        // During local.
        'src/tests/**',
        'node_modules/**',
    ],
    'cacheDir': '.nyc-cache',
};
