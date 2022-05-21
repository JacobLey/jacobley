'use strict';

// https://github.com/eslint/eslint/issues/3458
// eslint-disable-next-line import/no-unassigned-import
require('@rushstack/eslint-patch/modern-module-resolution');

const Path = require('node:path');
const ImportPlugin = require('eslint-plugin-import');
const JsDocPlugin = require('eslint-plugin-jsdoc');
const NodePlugin = require('eslint-plugin-node');
const SonarPlugin = require('eslint-plugin-sonarjs');
const rushJson = require('../../common/scripts/rush-json.cjs');

const nonDeprecatedRules = (name, plugin) => {
    const rules = {};
    for (const [ruleName, rule] of Object.entries(plugin.rules)) {
        if (rule.meta?.deprecated !== true) {
            rules[`${name}/${ruleName}`] = 'error';
        }
    }
    return rules;
};

// https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
const baseNamingConvention = [
    {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
        filter: {
            regex: '^Ajv$',
            match: false,
        },
    },
    {
        selector: 'enum',
        format: ['PascalCase'],
    },
    {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
    },
    {
        selector: 'property',
        modifiers: ['public'],
        format: null,
    },
    {
        selector: 'typeProperty',
        modifiers: ['public'],
        format: ['camelCase', 'snake_case'],
    },
    {
        selector: 'typeProperty',
        modifiers: ['public'],
        format: ['PascalCase'],
    },
    {
        selector: 'property',
        modifiers: ['static', 'readonly'],
        format: ['camelCase'],
    },
    {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
    },
    {
        selector: 'class',
        format: ['PascalCase'],
    },
    {
        selector: 'interface',
        format: ['PascalCase'],
    },
    {
        selector: 'typeAlias',
        format: ['PascalCase'],
    },
    {
        selector: 'typeParameter',
        format: ['PascalCase'],
    },
];

module.exports = {

    extends: [
        'eslint:all',
        'plugin:@typescript-eslint/all',
        'plugin:unicorn/all',
    ],

    root: true,

    env: {
        es2022: true,
        node: true,
    },

    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'import',
        'jsdoc',
        'node',
        'sonarjs',
        'unicorn',
    ],

    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: Path.resolve(__dirname, '../../tsconfig.eslint.json'),
        extraFileExtensions: ['.cts', '.cjs', '.mts', '.mjs'],
    },

    rules: {
        'accessor-pairs': 'off',
        'array-bracket-newline': [
            'error',
            {
                multiline: true,
            },
        ],
        'array-element-newline': ['error', 'consistent'],
        'arrow-body-style': ['error', 'as-needed'],
        'arrow-parens': ['error', 'as-needed'],
        'camelcase': 'off',
        'capitalized-comments': [
            'error',
            'always',
            {
                ignoreConsecutiveComments: true,
                ignoreInlineComments: true,
                ignorePattern: '\\w+:',
            },
        ],
        'class-methods-use-this': 'off',
        'complexity': 'off',
        'consistent-this': ['error', 'self'],
        'dot-location': ['error', 'property'],
        'function-call-argument-newline': ['error', 'consistent'],
        'func-names': ['error', 'never'],
        'function-paren-newline': ['error', 'multiline-arguments'],
        'func-style': [
            'error',
            'expression',
            { allowArrowFunctions: true },
        ],
        'generator-star-spacing': [
            'error',
            {
                before: false,
                after: true,
            },
        ],
        'id-blacklist': 'off',
        'id-length': 'off',
        'id-match': 'off',
        'jsx-quotes': ['error', 'prefer-single'],
        'key-spacing': [
            'error',
            {
                afterColon: true,
                beforeColon: false,
                mode: 'strict',
            },
        ],
        'line-comment-position': 'off',
        'lines-around-comment': 'off',
        'max-classes-per-file': 'off',
        'max-depth': 'off',
        'max-len': ['error', { code: 120, ignoreUrls: true }],
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        'max-params': 'off',
        'max-statements': 'off',
        'max-statements-per-line': ['error', { max: 1 }],
        'multiline-comment-style': ['error', 'separate-lines'],
        'multiline-ternary': 'off',
        'new-cap': ['error', { capIsNew: false }],
        'newline-per-chained-call': 'off',
        'no-await-in-loop': 'off',
        'no-constant-condition': ['error', { checkLoops: false }],
        'no-continue': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-implicit-coercion': ['error', { allow: ['!!'] }],
        'no-inline-comments': 'off',
        'no-mixed-operators': [
            'error',
            {
                groups: [['&&', '||']],
                allowSamePrecedence: true,
            },
        ],
        'no-multiple-empty-lines': [
            'error',
            {
                max: 1,
                maxEOF: 0,
                maxBOF: 0,
            },
        ],
        'no-plusplus': 'off',
        'no-restricted-imports': 'off',
        'no-restricted-modules': 'off',
        'no-restricted-properties': 'off',
        'no-restricted-syntax': [
            'error',
            {
                selector: 'TSEnumDeclaration:not([const=true])',
                message: 'Don\'t declare non-const enums',
            },
            {
                selector: 'LabeledStatement',
                message: 'Labels are a form of GOTO; using them makes code ' +
                    'confusing and hard to maintain and understand.',
            },
        ],
        'no-ternary': 'off',
        'no-undefined': 'off',
        'no-underscore-dangle': 'off',
        'no-void': ['error', { allowAsStatement: true }],
        'no-warning-comments': 'off',
        'object-curly-newline': [
            'error',
            {
                multiline: true,
                consistent: true,
            },
        ],
        'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
        'one-var': ['error', 'never'],
        'one-var-declaration-per-line': ['error', 'always'],
        'operator-linebreak': ['error', 'after'],
        'padded-blocks': 'off',
        'prefer-const': [
            'error',
            {
                destructuring: 'all',
                ignoreReadBeforeAssign: true,
            },
        ],
        'prefer-destructuring': 'off',
        'quote-props': ['error', 'consistent-as-needed'],
        'semi-spacing': [
            'error',
            {
                before: false,
                after: true,
            },
        ],
        'sort-imports': [
            'error',
            {
                ignoreCase: true,
                ignoreDeclarationSort: true,
            },
        ],
        'sort-keys': 'off',
        'spaced-comment': [
            'error',
            'always',
            {
                exceptions: ['*'],
                markers: ['!'],
            },
        ],
        'vars-on-top': 'off',
        'wrap-regex': 'off',

        // Typescript
        '@typescript-eslint/ban-ts-comment': [
            'error', {
                'ts-expect-error': true,
                'ts-ignore': true,
                'ts-nocheck': true,
                'ts-check': true,
            },
        ],
        '@typescript-eslint/consistent-type-assertions': [
            'error',
            {
                assertionStyle: 'as',
                objectLiteralTypeAssertions: 'allow-as-parameter',
            },
        ],
        '@typescript-eslint/explicit-function-return-type': [
            'error', {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
                allowHigherOrderFunctions: true,
            },
        ],
        '@typescript-eslint/explicit-module-boundary-types': [
            'error', {
                allowDirectConstAssertionInArrowFunctions: true,
                allowHigherOrderFunctions: true,
                allowTypedFunctionExpressions: true,
                shouldTrackReferences: false,
            },
        ],
        '@typescript-eslint/lines-between-class-members': 'off',
        '@typescript-eslint/member-ordering': [
            'error', {
                default: [
                    'signature',
                    'static-field',
                    'instance-field',
                    'field',
                    'constructor',
                    'public-method',
                    'method',
                ],
            },
        ],
        '@typescript-eslint/naming-convention': [
            'error',
            ...baseNamingConvention,
        ],
        '@typescript-eslint/no-dynamic-delete': 'off',
        '@typescript-eslint/no-empty-interface': [
            'error',
            { allowSingleExtends: true },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extraneous-class': [
            'error', {
                allowStaticOnly: true,
            },
        ],
        '@typescript-eslint/no-implicit-any-catch': 'off',
        '@typescript-eslint/no-invalid-void-type': 'off',
        '@typescript-eslint/no-misused-promises': [
            'error', {
                checksVoidReturn: false,
                checksConditionals: true,
            },
        ],
        '@typescript-eslint/no-namespace': [
            'error', {
                allowDeclarations: false,
                allowDefinitionFiles: false,
            },
        ],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-type-alias': [
            'error',
            {
                allowAliases: 'always',
                allowCallbacks: 'always',
                allowConditionalTypes: 'always',
                allowGenerics: 'always',
                allowLiterals: 'in-unions-and-intersections',
                allowMappedTypes: 'always',
            },
        ],
        '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
        '@typescript-eslint/prefer-nullish-coalescing': [
            'error', {
                ignoreConditionalTests: true,
                ignoreMixedLogicalExpressions: false,
            },
        ],
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/prefer-reduce-type-parameter': 'off',
        '@typescript-eslint/restrict-plus-operands': [
            'error',
            { checkCompoundAssignments: true },
        ],
        '@typescript-eslint/restrict-template-expressions': [
            'error', {
                allowNumber: true,
                allowBoolean: true,
                allowAny: false,
                allowNullish: false,
            },
        ],
        '@typescript-eslint/sort-type-union-intersection-members': [
            'error',
            {
                checkIntersections: true,
                checkUnions: true,
                groupOrder: [
                    'literal',
                    'keyword',
                    'named',
                    'operator',
                    'import',
                    'object',
                    'tuple',
                    'function',
                    'conditional',
                    'intersection',
                    'union',
                    'nullish',
                ],
            },
        ],
        '@typescript-eslint/strict-boolean-expressions': [
            'error', {
                allowString: true,
                allowNumber: true,
                allowNullableObject: true,
                allowNullableBoolean: true,
                allowNullableString: true,
                allowNullableNumber: true,
                allowAny: true,
            },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        '@typescript-eslint/triple-slash-reference': [
            'error', {
                path: 'never',
                types: 'never',
                lib: 'never',
            },
        ],
        '@typescript-eslint/type-annotation-spacing': [
            'error', {
                before: false,
                after: true,
                overrides: {
                    arrow: {
                        before: true,
                        after: true,
                    },
                },
            },
        ],
        '@typescript-eslint/typedef': 'off',

        // Typescript Override
        '@typescript-eslint/comma-dangle': [
            'error',
            {
                arrays: 'always-multiline',
                enums: 'always',
                exports: 'always-multiline',
                functions: 'never',
                generics: 'never',
                imports: 'always-multiline',
                objects: 'always-multiline',
                tuples: 'always-multiline',
            },
        ],
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                // note: https://astexplorer.net/ is great for figuring these out
                ignoredNodes: [
                    'TemplateLiteral > ArrowFunctionExpression > BlockStatement',
                    ':matches(TemplateLiteral, TSIntersectionType, TSTypeParameterInstantiation, TSUnionType) > *',
                    'TSIntersectionType',
                    'TSUnionType',
                    'TSTypeParameterInstantiation',
                ],
                SwitchCase: 1,
            },
        ],
        '@typescript-eslint/init-declarations': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-extra-parens': [
            'error',
            'all',
            {
                enforceForArrowConditionals: false,
                ignoreJSX: 'multi-line',
                nestedBinaryExpressions: false,
            },
        ],
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/no-unused-expressions': [
            'error',
            {
                allowShortCircuit: true,
                allowTernary: true,
            },
        ],
        '@typescript-eslint/no-unused-vars': [
            'error',
            { ignoreRestSiblings: true },
        ],
        '@typescript-eslint/no-use-before-define': [
            'error', {
                enums: false,
                functions: false,
                typedefs: false,
            },
        ],
        '@typescript-eslint/object-curly-spacing': ['error', 'always'],
        '@typescript-eslint/quotes': ['error', 'single'],
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/space-before-function-paren': [
            'error',
            {
                anonymous: 'never',
                asyncArrow: 'always',
                named: 'never',
            },
        ],

        // Import
        ...nonDeprecatedRules('import', ImportPlugin),
        'import/dynamic-import-chunkname': 'off',
        'import/exports-last': 'off',
        'import/extensions': ['error', 'always', { ignorePackages: true }],
        'import/first': ['error', 'absolute-first'],
        'import/group-exports': 'off',
        'import/max-dependencies': 'off',
        'import/newline-after-import': ['error', { count: 1 }],
        'import/no-anonymous-default-export': 'off',
        'import/no-commonjs': 'off',
        'import/no-default-export': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/no-internal-modules': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-export': 'off',
        'import/no-namespace': 'off',
        'import/no-nodejs-modules': 'off',
        'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
        'import/no-unresolved': 'off',
        'import/no-unused-modules': 'off',
        'import/no-useless-path-segments': ['error', { commonjs: true }],
        'import/order': [
            'error',
            {
                'alphabetize': { caseInsensitive: true, order: 'asc' },
                'groups': [
                    'builtin',
                    'external',
                    'internal',
                    'index',
                    'parent',
                    'sibling',
                    ['object', 'unknown'],
                ],
                'newlines-between': 'never',
                'warnOnUnassignedImports': true,
            },
        ],
        'import/prefer-default-export': 'off',

        // JS Doc
        ...nonDeprecatedRules('jsdoc', JsDocPlugin),
        'jsdoc/check-examples': 'off',
        'jsdoc/check-indentation': [
            'error',
            {
                excludeTags: ['example', 'param', 'returns'],
            },
        ],
        'jsdoc/match-name': 'off',
        'jsdoc/no-defaults': 'off',
        'jsdoc/no-missing-syntax': 'off',
        'jsdoc/no-multi-asterisks': [
            'error',
            {
                preventAtEnd: true,
                preventAtMiddleLines: true,
            },
        ],
        'jsdoc/no-restricted-syntax': 'off',
        'jsdoc/no-types': 'off',
        'jsdoc/no-undefined-types': 'off',
        'jsdoc/require-description-complete-sentence': 'off',
        'jsdoc/require-description': [
            'error',
            { descriptionStyle: 'body' },
        ],
        'jsdoc/require-example': 'off',
        'jsdoc/require-file-overview': 'off',
        'jsdoc/require-jsdoc': [
            'error',
            {
                require: {
                    ArrowFunctionExpression: false,
                    ClassDeclaration: true,
                    ClassExpression: true,
                    FunctionDeclaration: true,
                    FunctionExpression: false,
                    MethodDefinition: true,
                },
                contexts: [
                    'ExportDefaultDeclaration > ArrowFunctionExpression',
                    'ExportNamedDeclaration > ArrowFunctionExpression',
                    'ExportDefaultDeclaration > FunctionExpression',
                    'ExportNamedDeclaration > FunctionExpression',
                ],
            },
        ],
        'jsdoc/sort-tags': 'off',
        'jsdoc/tag-lines': [
            'error',
            'never',
            {
                count: 1,
                noEndLines: true,
                tags: {
                    example: { lines: 'always' },
                    see: { lines: 'always' },
                },
            },
        ],

        // Node
        ...nonDeprecatedRules('node', NodePlugin),
        'node/no-unsupported-features/es-syntax': [
            'error',
            {
                version: rushJson.nodeSupportedVersionRange,
                ignores: ['dynamicImport', 'modules'],
            },
        ],
        'node/callback-return': ['error', ['callback', 'cb', 'next', 'done']],
        'node/no-missing-import': 'off', // Fails to detect .ts extension
        'node/no-missing-require': 'off', // Same
        'node/no-sync': ['error', { allowAtRootLevel: true }],
        'node/no-unpublished-import': 'off',
        'node/no-unpublished-require': 'off',

        // SonarJS
        ...nonDeprecatedRules('sonarjs', SonarPlugin),
        'sonarjs/cognitive-complexity': 'off',
        'sonarjs/elseif-without-else': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'sonarjs/no-identical-functions': 'off',
        'sonarjs/no-small-switch': 'off',

        // Unicorn
        'unicorn/catch-error-name': ['error', { ignore: [/^error$/u], name: 'err' }],
        'unicorn/import-index': ['error', { ignoreImports: true }],
        'unicorn/no-keyword-prefix': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-export-from': ['error', { ignoreUsedVariables: true }],
        'unicorn/prefer-ternary': ['error', 'only-single-line'],
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/template-indent': [
            'error',
            { indent: 4 },
        ],
        'unicorn/text-encoding-identifier-case': 'off',
    },

    overrides: [
        {
            files: ['**/*.cjs'],
            parserOptions: {
                sourceType: 'script',
            },
            env: {
                commonjs: true,
            },
            rules: {
                'import/no-unused-modules': 'off',
            },
        },
        {
            files: ['**/*.cjs', '**/*.mjs'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/explicit-member-accessibility': 'off',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
                '@typescript-eslint/naming-convention': 'off',
                '@typescript-eslint/no-require-imports': 'off',
                '@typescript-eslint/no-unnecessary-condition': 'off',
                '@typescript-eslint/no-unsafe-argument': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                '@typescript-eslint/no-unsafe-return': 'off',
                '@typescript-eslint/no-var-requires': 'off',
                '@typescript-eslint/restrict-template-expressions': 'off',
            },
        },
        {
            files: [
                'apps/*/src/tests/**',
                'tools/*/src/tests/**',
            ],
            settings: {
                jsdoc: {
                    overrideReplacesDocs: true,
                },
            },
            rules: {
                'prefer-arrow-callback': 'off',
                'prefer-promise-reject-errors': 'off',
                'jsdoc/require-jsdoc': [
                    'error', {
                        require: {
                            ClassDeclaration: true,
                        },
                    },
                ],
                'node/handle-callback-err': 'off',
                '@typescript-eslint/ban-ts-comment': [
                    'error', {
                        'ts-expect-error': false,
                        'ts-ignore': true,
                        'ts-nocheck': true,
                        'ts-check': true,
                    },
                ],
                '@typescript-eslint/consistent-type-assertions': [
                    'error',
                    { assertionStyle: 'as' },
                ],
                '@typescript-eslint/member-ordering': 'off',
                '@typescript-eslint/naming-convention': [
                    'error',
                    ...baseNamingConvention,
                    {
                        selector: 'method',
                        modifiers: ['public'],
                        format: null,
                    },
                    {
                        selector: 'variable',
                        modifiers: ['const', 'exported'],
                        format: ['PascalCase'],
                        filter: {
                            regex: '^\\w+Spec$',
                            match: true,
                        },
                    },
                ],
                '@typescript-eslint/no-throw-literal': 'off',
                '@typescript-eslint/prefer-readonly-parameter-types': 'off',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
                'unicorn/consistent-function-scoping': 'off',
                'unicorn/no-useless-undefined': 'off',
                'unicorn/no-thenable': 'off',
            },
        },
        {
            files: [
                'common/scripts/*',
                'apps/*/cli.mjs',
                'root/*/cli.mjs',
            ],
            rules: {
                'node/shebang': 'off',
            },
        },
        {
            files: [
                'common/scripts/*',
                'apps/*/src/commands/*.ts',
                'root/*/src/commands/*.ts',
            ],
            rules: {
                'no-console': [
                    'error',
                    { allow: ['info', 'error'] },
                ],
            },
        },
    ],
};
