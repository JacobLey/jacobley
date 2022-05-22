import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import * as FindImport from '../../find-import.js';

const dataDir = Path.join(
    fileURLToPath(import.meta.url),
    '../../data'
);
const originalDataDir = Path.join(
    dataDir,
    '../../../src/tests/data'
);

const [rootJs, subJs] = await Promise.all([
    import(Path.join(dataDir, 'root.js')),
    import(Path.join(dataDir, 'sub/sub.cjs')),
]) as [unknown, unknown];

export const FindImportJsonSpec = {

    findImport: {

        async 'Finds first module'() {

            const found = await FindImport.findImport('root.js', {
                cwd: dataDir,
            });

            expect(found).to.deep.equal({
                filePath: Path.join(dataDir, 'root.js'),
                content: rootJs,
            });
            expectTypeOf(found).toEqualTypeOf<{
                filePath: string;
                content: unknown;
            } | null>();
        },

        'Provide multiple file names': {

            async up() {

                const found = await FindImport.findImport(['root.js', 'sub.cjs'], {
                    cwd: Path.join(dataDir, 'sub'),
                });

                expect(found).to.deep.equal({
                    filePath: Path.join(dataDir, 'sub/sub.cjs'),
                    content: subJs,
                });
            },

            async down() {

                const found = await FindImport.findImport(['root.js', 'sub.cjs'], {
                    cwd: Path.join(dataDir, 'sub'),
                    direction: 'down',
                });

                expect(found).to.deep.equal({
                    filePath: Path.join(dataDir, 'root.js'),
                    content: rootJs,
                });
            },

            async startAt() {

                const found = await FindImport.findImport(['root.js', 'sub.cjs'], {
                    cwd: Path.join(dataDir, 'sub'),
                    startAt: Path.join(dataDir, 'sub'),
                    direction: 'down',
                });

                expect(found).to.deep.equal({
                    filePath: Path.join(dataDir, 'sub/sub.cjs'),
                    content: subJs,
                });
            },

            async directory() {

                const found = await FindImport.findImport(
                    [
                        Path.join('sub', 'sub.cjs'),
                        'root.js',
                    ],
                    {
                        cwd: Path.join(dataDir, 'sub'),
                        direction: 'down',
                    }
                );

                expect(found).to.deep.equal({
                    filePath: Path.join(dataDir, 'sub/sub.cjs'),
                    content: subJs,
                });
            },
        },

        async 'Load json'() {

            const found = await FindImport.findImport<{ kind: string }>(
                ['root.json', 'sub.json'],
                { cwd: Path.join(originalDataDir, 'sub') }
            );

            expect(found).to.deep.equal({
                filePath: Path.join(originalDataDir, 'root.json'),
                content: {
                    kind: 'root-json',
                },
            });
            expectTypeOf(found).toEqualTypeOf<{
                filePath: string;
                content: { kind: string };
            } | null>();
        },

        async 'Not found'() {

            const notFound = await FindImport.findImport('does-not-exist.mjs');

            expect(notFound).to.equal(null);
        },
    },
};
