import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import type { Context } from 'mocha';
import type * as Encode from '../../../encode.js';
import * as IsoCrypto from '../../../index.js';
import * as BrowserEncode from '../../../iso/encode/browser.js';
import * as NodeEncode from '../../../iso/encode/node.js';

interface EncodeTest extends Context {
    encode: Pick<typeof Encode, 'decode' | 'encode'>;
}

export const EncodeSpec = {

    types() {
        expectTypeOf(BrowserEncode).toEqualTypeOf(NodeEncode);
        expectTypeOf(IsoCrypto).toMatchTypeOf(NodeEncode);
    },

    encode: {

        browser: {

            beforeEach(this: EncodeTest) {
                this.encode = BrowserEncode;
            },

            base64(this: EncodeTest) {
                for (const encoding of ['base64', 'base64url'] as const) {
                    for (const { input, output } of [
                        {
                            input: 'q8Ej',
                            output: [171, 193, 35],
                        },
                        {
                            input: 'q8E=',
                            output: [171, 193],
                        },
                        {
                            input: 'q8E',
                            output: [171, 193],
                        },
                        {
                            input: 'AAASAAA=',
                            output: [0, 0, 18, 0, 0],
                        },
                        {
                            input: 'AAASAAA',
                            output: [0, 0, 18, 0, 0],
                        },
                        {
                            input: '_-Q',
                            output: [255, 228],
                        },
                        {
                            input: '/+Q=',
                            output: [255, 228],
                        },
                        {
                            input: '-_-_--__',
                            output: [251, 255, 191, 251, 239, 255],
                        },
                        {
                            input: '+/+/++//',
                            output: [251, 255, 191, 251, 239, 255],
                        },
                        {
                            input: '-_-_-_Q=======',
                            output: [251, 255, 191, 251, 244],
                        },
                        {
                            input: '+/+/+/Q=======',
                            output: [251, 255, 191, 251, 244],
                        },
                        {
                            input: '',
                            output: [],
                        },
                    ]) {
                        const buf = this.encode.encode({
                            text: input,
                            encoding,
                        });
                        expect(buf).to.be.an.instanceOf(Uint8Array);
                        expect([...buf]).to.deep.equal(output);
                    }
                }
            },

            hex(this: EncodeTest) {
                for (const { input, output } of [
                    {
                        input: 'abc123',
                        output: [171, 193, 35],
                    },
                    {
                        input: '123',
                        output: [1, 35],
                    },
                    {
                        input: '0123',
                        output: [1, 35],
                    },
                    {
                        input: '0000120000',
                        output: [0, 0, 18, 0, 0],
                    },
                    {
                        input: '',
                        output: [],
                    },
                ]) {
                    expect([
                        ...this.encode.encode({
                            text: input,
                            encoding: 'hex',
                        }),
                    ]).to.deep.equal(output);
                }
            },

            utf8(this: EncodeTest) {
                for (const { input, output } of [
                    {
                        input: 'abc123',
                        output: [97, 98, 99, 49, 50, 51],
                    },
                    {
                        input: '',
                        output: [],
                    },
                    {
                        input: '\u0000\u00012\u3456',
                        output: [0, 1, 50, 227, 145, 150],
                    },
                ]) {
                    const withDefault = this.encode.encode(input);
                    expect([...withDefault]).to.deep.equal(output);
                    expect(withDefault).to.deep.equal(this.encode.encode({
                        text: input,
                        encoding: 'utf8',
                    }));
                }
            },

            raw(this: EncodeTest) {
                for (const arr of [
                    [1, 2, 3, 4],
                    [97, 98, 99, 49, 50, 51],
                    [0, 0, 0],
                    [],
                ]) {
                    const buf = Buffer.from(arr);
                    expect(this.encode.encode(buf)).to.eq(buf);
                    expect(this.encode.encode({ text: buf, encoding: 'raw' })).to.eq(buf);
                }
            },
        },

        node: {

            beforeEach(this: EncodeTest) {
                this.encode = NodeEncode;
            },

            base64(this: EncodeTest) {
                EncodeSpec.encode.browser.base64.call(this);
            },

            hex(this: EncodeTest) {
                EncodeSpec.encode.browser.hex.call(this);
            },

            utf8(this: EncodeTest) {
                EncodeSpec.encode.browser.utf8.call(this);
            },
        },
    },

    decode: {

        browser: {

            beforeEach(this: EncodeTest) {
                this.encode = BrowserEncode;
            },

            base64(this: EncodeTest) {
                for (const { input, output } of [
                    {
                        input: [171, 193, 35],
                        output: 'q8Ej',
                    },
                    {
                        input: [171, 193],
                        output: 'q8E=',
                    },
                    {
                        input: [0, 0, 18, 0, 0],
                        output: 'AAASAAA=',
                    },
                    {
                        input: [251, 244],
                        output: '+/Q=',
                    },
                    {
                        input: [255, 228],
                        output: '/+Q=',
                    },
                    {
                        input: [251, 255, 191, 251, 239, 255],
                        output: '+/+/++//',
                    },
                    {
                        input: [251, 255, 191, 251, 244],
                        output: '+/+/+/Q=',
                    },
                    {
                        input: [],
                        output: '',
                    },
                ]) {
                    expect(
                        this.encode.decode(Buffer.from(input), 'base64')
                    ).to.equal(output);
                }
            },

            base64url(this: EncodeTest) {
                for (const { input, output } of [
                    {
                        input: [171, 193, 35],
                        output: 'q8Ej',
                    },
                    {
                        input: [171, 193],
                        output: 'q8E',
                    },
                    {
                        input: [0, 0, 18, 0, 0],
                        output: 'AAASAAA',
                    },
                    {
                        input: [251, 244],
                        output: '-_Q',
                    },
                    {
                        input: [255, 228],
                        output: '_-Q',
                    },
                    {
                        input: [251, 255, 191, 251, 239, 255],
                        output: '-_-_--__',
                    },
                    {
                        input: [251, 255, 191, 251, 244],
                        output: '-_-_-_Q',
                    },
                    {
                        input: [],
                        output: '',
                    },
                ]) {
                    expect(
                        this.encode.decode(Buffer.from(input), 'base64url')
                    ).to.equal(output);
                }
            },

            hex(this: EncodeTest) {
                for (const { input, output } of [
                    {
                        input: [171, 193, 35],
                        output: 'abc123',
                    },
                    {
                        input: [1, 35],
                        output: '0123',
                    },
                    {
                        input: [0, 0, 18, 0, 0],
                        output: '0000120000',
                    },
                    {
                        input: [],
                        output: '',
                    },
                ]) {
                    expect(
                        this.encode.decode(Buffer.from(input), 'hex')
                    ).to.equal(output);
                }
            },

            utf8(this: EncodeTest) {
                for (const { input, output } of [
                    {
                        input: [97, 98, 99, 49, 50, 51],
                        output: 'abc123',
                    },
                    {
                        input: [],
                        output: '',
                    },
                    {
                        input: [0, 1, 50, 227, 145, 150],
                        output: '\u0000\u00012\u3456',
                    },
                ]) {
                    const bufInput = Buffer.from(input);
                    const withDefault = this.encode.decode(bufInput);
                    expect(withDefault).to.equal(output);
                    expect(withDefault).to.equal(this.encode.decode(bufInput, 'utf8'));
                }
            },
        },

        node: {

            beforeEach(this: EncodeTest) {
                this.encode = NodeEncode;
            },

            base64(this: EncodeTest) {
                EncodeSpec.decode.browser.base64.call(this);
            },

            base64url(this: EncodeTest) {
                EncodeSpec.decode.browser.base64url.call(this);
            },

            hex(this: EncodeTest) {
                EncodeSpec.decode.browser.hex.call(this);
            },

            utf8(this: EncodeTest) {
                EncodeSpec.decode.browser.utf8.call(this);
            },
        },
    },
};
