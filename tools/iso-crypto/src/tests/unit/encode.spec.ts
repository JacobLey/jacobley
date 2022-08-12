import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import * as Encode from '../../encode.js';

export const EncodeSpec = {

    encodeObject: {

        success() {

            const myData = {
                foo: 'abcdef',
                bar: '012345',
            };
            const encoded = Encode.encodeObject(myData, 'hex');
            expect(encoded).to.deep.equal({
                foo: Buffer.from('abcdef', 'hex'),
                bar: Buffer.from('012345', 'hex'),
            });
            expectTypeOf(encoded).toEqualTypeOf<{
                foo: Uint8Array;
                bar: Uint8Array;
            }>();
        },

        'Default utf8'() {

            const myData: Record<string, string> = {
                foo: '<foo>',
                bar: '<bar>',
            };
            const encoded = Encode.encodeObject(myData);
            expect(encoded).to.deep.equal({
                foo: Buffer.from('<foo>'),
                bar: Buffer.from('<bar>'),
            });
            expectTypeOf(encoded).toEqualTypeOf<Record<string, Uint8Array>>();
        },
    },

    decodeObject: {

        success() {

            const myData = {
                foo: Buffer.from('abcdef', 'hex'),
                bar: Buffer.from('012345', 'hex'),
            };
            const decoded = Encode.decodeObject(myData, 'hex');
            expect(decoded).to.deep.equal({
                foo: 'abcdef',
                bar: '012345',
            });
            expectTypeOf(decoded).toEqualTypeOf<{
                foo: string;
                bar: string;
            }>();
        },

        'Default utf8'() {

            const myData: Record<string, Uint8Array> = {
                foo: Buffer.from('<foo>'),
                bar: Buffer.from('<bar>'),
            };
            const decoded = Encode.decodeObject(myData);
            expect(decoded).to.deep.equal({
                foo: '<foo>',
                bar: '<bar>',
            });
            expectTypeOf(decoded).toEqualTypeOf<Record<string, string>>();
        },
    },
};
