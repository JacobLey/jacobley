import { writeFile } from 'node:fs/promises';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { defaultImport } from 'default-import';
import { patch, patchKey } from 'named-patch';
import Sinon from 'sinon';
import { barrelify } from '../../barrelify.js';
import defaultDedent from '../re-export/dedent.cjs';

const dedent = defaultImport(defaultDedent);

const testDir = Path.join(
    fileURLToPath(import.meta.url),
    '../../../../src/tests/data'
);

export const BarrelifySpec = {

    afterEach() {
        Sinon.restore();
    },

    barrelify: {

        async 'Noop for pre-barreled files'() {

            const written = await barrelify({
                cwd: testDir,
                ignore: ['./wrong/*'],
            });
            expect(written).to.deep.equal([]);
        },

        async 'Detects out-of-sync files'() {

            const written = await barrelify({
                cwd: testDir,
                dryRun: true,
            });

            const wrongIndex = Path.join(testDir, 'wrong/index.ts');

            expect(written).to.deep.equal([wrongIndex]);
        },

        async 'All options are optional'() {

            const writeStub = Sinon.stub(patch(writeFile), patchKey).callsFake(
                async (path, content, encoding) => {
                    expect(path).to.equal(Path.join(testDir, 'wrong/index.ts'));
                    expect(content).to.equal(dedent`
                        // AUTO-BARREL

                        export * from './wrong.js';\n
                    `);
                    expect(encoding).to.equal('utf8');
                }
            );

            await barrelify();

            expect(writeStub.callCount).to.equal(1);
        },
    },
};
