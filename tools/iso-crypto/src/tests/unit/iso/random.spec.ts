import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import type { Context } from 'mocha';
import * as IsoCrypto from '../../../index.js';
import * as BrowserRandom from '../../../iso/random/browser.js';
import * as NodeRandom from '../../../iso/random/node.js';

interface RandomTest extends Context {
    random: typeof BrowserRandom;
}

export const EncodeSpec = {

    types() {
        expectTypeOf(BrowserRandom).toEqualTypeOf(NodeRandom);
        expectTypeOf(IsoCrypto).toMatchTypeOf(NodeRandom);
    },

    randomBytes: {

        browser: {

            beforeEach(this: RandomTest) {
                this.random = BrowserRandom;
            },

            async success(this: RandomTest) {

                for (const size of [0, 1, 10, 32, 100, 1234]) {
                    const random = await this.random.randomBytes(size);
                    expect(random.length).to.equal(size);
                    expect(random).to.be.an.instanceOf(Uint8Array);
                }
            },
        },

        node: {

            beforeEach(this: RandomTest) {
                this.random = NodeRandom;
            },

            async success(this: RandomTest) {
                return EncodeSpec.randomBytes.browser.success.call(this);
            },
        },
    },
};
