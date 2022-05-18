import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import Sinon from 'sinon';
import * as Patch from '../../patch.js';

export const NamedPatchSpec = {

    afterEach() {
        Sinon.restore();
    },

    patch: {

        'With sync'() {

            const syncMethod = <
                A extends string,
                B = [123]
            >(a: A, b: B[]): { a: [A]; b: B[]; c: boolean } => ({ a: [a], b, c: true });

            const patched = Patch.patch(syncMethod);
            expect(patched[Patch.patchKey]).to.eq(syncMethod);

            // Cached
            expect(Patch.patch(syncMethod)).to.eq(patched);
            // Idempotent
            expect(Patch.patch(patched)).to.eq(patched);
            // Consistent length
            expect(patched.length).to.equal(2);

            const rawResult = patched('abc', [null]);
            expect(rawResult).to.deep.equal({ a: ['abc'], b: [null], c: true });
            expectTypeOf(rawResult).toEqualTypeOf<{
                a: ['abc'];
                b: null[];
                c: boolean;
            }>();

            const patchedResponse = {
                a: ['<value>'] as [string],
                b: [[]],
                c: false,
            };
            Sinon.stub(patched, Patch.patchKey).callsFake(() => patchedResponse);

            expect(patched('abc', [null])).to.eq(patchedResponse);
            expectTypeOf(patched<'abc', null>('abc', [null])).toEqualTypeOf<{
                a: ['abc'];
                b: null[];
                c: boolean;
            }>();
        },

        async 'With async'() {

            const asyncMethod = Patch.patch(async (a: number): Promise<number> => a * 2);

            expect(await asyncMethod(2)).to.equal(4);

            Sinon.stub(asyncMethod, Patch.patchKey).callsFake(async () => -5);

            expect(await asyncMethod(2)).to.equal(-5);
        },

        'With this'() {

            let counter = 0;

            const context = {
                increment: () => counter++,
                decrement: () => counter--,
            };

            const contextMethod = Patch.patch(function(this: typeof context): void {
                this.increment();
            });

            contextMethod.call(context);
            expect(counter).to.equal(1);

            const container = {
                contextMethod,
                ...context,
            };
            container.contextMethod();
            expect(counter).to.equal(2);

            Sinon.stub(contextMethod, Patch.patchKey).callsFake(
                function(this: typeof context) {
                    this.decrement();
                }
            );

            container.contextMethod();
            expect(counter).to.equal(1);
        },
    },

    getPatched: {

        success() {

            const method = (): void => {};
            const patched = Patch.patch(method);

            expect(Patch.getPatched(method)).to.eq(patched);
        },

        failure: {

            'Never patched'() {
                expect(
                    () => Patch.getPatched(() => {})
                ).to.throw(Error, 'Method is un-patched');
            },

            'Already patched'() {
                expect(
                    () => Patch.getPatched(Patch.patch(() => {}))
                ).to.throw(Error, 'Method is already patched');
            },
        },
    },
};
