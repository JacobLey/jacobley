import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import * as Noop from '../../noop.js';

export const NoopSpec = {

    'Returns input unchanged'() {

        const original = <
            A extends string,
            B = [123]
        >(a: A, b: B[]): { a: [A]; b: B[]; c: boolean } => ({ a: [a], b, c: true });
        const patched = Noop.patch(original);
        expect(patched).to.equal(patched);
        expectTypeOf(original).toEqualTypeOf(patched);
    },
};
