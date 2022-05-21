export default {
    dependencies: [
        {
            include: '*',
            paths: [
                'package.json',
                'cli.js',
                'src/**',
                'tsconfig.json',
            ],
            ignorePaths: 'src/tests/**',
        },
        {
            include: '*',
            dev: true,
            paths: [
                '*.cjs',
                'src/tests/**',
            ],
        },
        {
            include: '*',
            root: true,
            paths: 'tsconfig.build.json',
        },
        {
            include: '*',
            root: true,
            dev: true,
            paths: [
                '.eslintignore',
                './root/jacobley/.eslintrc.cjs',
                'tsconfig.eslint.json',
            ],
        },
    ],
};
