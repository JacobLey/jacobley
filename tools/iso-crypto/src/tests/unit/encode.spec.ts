import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import * as Encode from '../../encode.js';

export const EncodeSpec = {

    decodeObject: {

        success() {

            const myData = {
                foo: 'abcdef',
                bar: '012345',
            };
            const decoded = Encode.decodeObject(myData, 'hex');
            expect(decoded).to.deep.equal({
                foo: Buffer.from('abcdef', 'hex'),
                bar: Buffer.from('012345', 'hex'),
            });
            expectTypeOf(decoded).toEqualTypeOf<{
                foo: Uint8Array;
                bar: Uint8Array;
            }>();
        },

        'Default utf8'() {

            const myData: Record<string, string> = {
                foo: '<foo>',
                bar: '<bar>',
            };
            const decoded = Encode.decodeObject(myData);
            expect(decoded).to.deep.equal({
                foo: Buffer.from('<foo>'),
                bar: Buffer.from('<bar>'),
            });
            expectTypeOf(decoded).toEqualTypeOf<Record<string, Uint8Array>>();
        },
    },

    encodeObject: {

        success() {

            const myData = {
                foo: Buffer.from('abcdef', 'hex'),
                bar: Buffer.from('012345', 'hex'),
            };
            const encoded = Encode.encodeObject(myData, 'hex');
            expect(encoded).to.deep.equal({
                foo: 'abcdef',
                bar: '012345',
            });
            expectTypeOf(encoded).toEqualTypeOf<{
                foo: string;
                bar: string;
            }>();
        },

        'Default utf8'() {

            const myData: Record<string, Uint8Array> = {
                foo: Buffer.from('<foo>'),
                bar: Buffer.from('<bar>'),
            };
            const encoded = Encode.encodeObject(myData);
            expect(encoded).to.deep.equal({
                foo: '<foo>',
                bar: '<bar>',
            });
            expectTypeOf(encoded).toEqualTypeOf<Record<string, string>>();
        },
    },
};
