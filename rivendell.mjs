export default {
    dependencies: [
        {
            include: '*',
            paths: [
                'package.json',
                'README.md',
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
            paths: [
                'tsconfig.build.json',
                'common/config/publish/*',
            ],
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
