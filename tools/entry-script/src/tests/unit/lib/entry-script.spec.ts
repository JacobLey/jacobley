import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import type { Context } from 'mocha';
import Sinon from 'sinon';
import * as ExportedEntryScript from '../../../index.js';
import * as EntryScript from '../../../lib/entry-script.js';
import EntryScriptMock from '../../data/entry-script-mock.js';

interface EntryScriptTest extends Context {
    entryScript: EntryScriptMock;
}

export const EntryScriptSpec = {

    afterEach() {
        Sinon.restore();
    },

    type() {
        expect(ExportedEntryScript).to.deep.equal({
            [Symbol.toStringTag]: 'Module',
            EntryScript: EntryScript.EntryScript,
            runtimeError: EntryScript.runtimeError,
        });
    },

    create: {

        async success(): Promise<void> {
            expect(await EntryScript.EntryScript.create()).to.be.an.instanceOf(EntryScript.EntryScript);
        },
    },

    runAsMain: {

        async beforeEach(this: EntryScriptTest) {
            this.entryScript = await EntryScriptMock.create();
            Sinon.stub(EntryScriptMock, 'create').callsFake(async () => this.entryScript);
        },

        async success(this: Readonly<EntryScriptTest>) {

            const startSpy = Sinon.spy(this.entryScript, 'start');
            const finishSpy = Sinon.spy(this.entryScript, 'finish');

            await EntryScript.runAsMain(
                Path.resolve(
                    Path.dirname(fileURLToPath(import.meta.url)),
                    '../../data/entry-script-mock.js'
                )
            );

            expect(startSpy.callCount).to.equal(1);
            expect(startSpy.calledBefore(finishSpy)).to.equal(true);
            expect(finishSpy.callCount).to.equal(1);
        },

        failure: {

            async 'No URL exists'() {
                await EntryScript.runAsMain();
            },

            async 'URL is not js file'() {
                await EntryScript.runAsMain('/does/not/exist');
            },

            async 'Different entry point'() {
                await EntryScript.runAsMain(process.argv[1]);
            },

            async 'Entry module is not EntryScript'() {
                await EntryScript.runAsMain(import.meta.url);
            },

            async 'Emits runtime error'(this: Readonly<EntryScriptTest>) {

                const error = new Error('<ERROR>');

                Sinon.stub(this.entryScript, 'start').callsFake(() => {
                    throw error;
                });
                const finishSpy = Sinon.stub(this.entryScript, 'finish');
                const listenerStub = Sinon.fake((err: unknown, event: CustomEvent<unknown>) => [err, event]);

                this.entryScript.on(EntryScript.runtimeError, listenerStub);

                let caughtError: unknown;
                try {
                    await EntryScript.runAsMain(
                        Path.resolve(
                            Path.dirname(fileURLToPath(import.meta.url)),
                            '../../data/entry-script-mock.js'
                        )
                    );
                } catch (err) {
                    caughtError = err;
                }

                expect(caughtError).to.eq(error);
                expect(finishSpy.callCount).to.equal(1);
                expect(listenerStub.callCount).to.equal(1);
                expect(listenerStub.getCall(0).args[0]).to.eq(error);
            },
        },
    },
};
