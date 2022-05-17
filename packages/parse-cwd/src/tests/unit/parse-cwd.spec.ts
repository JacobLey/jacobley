import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import * as ParseCwd from '../../parse-cwd.js';

export const ParseCwdSpec = {

    parseCwd: {

        async 'Defaults to process.cwd()'() {

            const cwd = await ParseCwd.parseCwd();
            expect(cwd).to.equal(process.cwd());
        },

        async 'Resolves relative to process.cwd()'() {

            const cwd = await ParseCwd.parseCwd(Path.relative(
                process.cwd(),
                Path.dirname(fileURLToPath(import.meta.url))
            ));
            expect(cwd).to.equal(
                Path.dirname(fileURLToPath(import.meta.url))
            );
        },

        'Allows file path': {

            async 'As string'() {

                const cwd = await ParseCwd.parseCwd(import.meta.url);
                expect(cwd).to.equal(
                    Path.dirname(fileURLToPath(import.meta.url))
                );
            },

            async 'As URL'() {

                const cwd = await ParseCwd.parseCwd(new URL(import.meta.url));
                expect(cwd).to.equal(
                    Path.dirname(fileURLToPath(import.meta.url))
                );
            },
        },

        'Allows options': {

            async 'As string'() {

                const cwd = await ParseCwd.parseCwd({
                    cwd: import.meta.url,
                });
                expect(cwd).to.equal(
                    Path.dirname(fileURLToPath(import.meta.url))
                );
            },

            async 'As URL'() {

                const cwd = await ParseCwd.parseCwd({
                    cwd: new URL(import.meta.url),
                });
                expect(cwd).to.equal(
                    Path.dirname(fileURLToPath(import.meta.url))
                );
            },

            async 'As Empty'() {

                const cwd = await ParseCwd.parseCwd({});
                expect(cwd).to.equal(process.cwd());
            },
        },

        async 'Allows null'() {
            const cwd = await ParseCwd.parseCwd(null);
            expect(cwd).to.equal(process.cwd());
        },

        async 'Throws on non-found'() {

            let error: unknown;
            try {
                await ParseCwd.parseCwd('/not/found');
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an('error').with.property('message', 'Directory not found');
        },
    },
};
