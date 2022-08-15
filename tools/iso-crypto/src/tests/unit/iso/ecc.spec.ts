import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import type { Context } from 'mocha';
import type * as Ecc from '#ecc';
import * as IsoCrypto from '../../../index.js';
import * as BrowserEcc from '../../../iso/ecc/browser.js';
import * as NodeEcc from '../../../iso/ecc/node.js';

interface EccTest extends Context {
    source: typeof Ecc;
    target: typeof Ecc;
}

export const EccSpec = {

    types() {
        expectTypeOf(BrowserEcc).toEqualTypeOf(NodeEcc);
        expectTypeOf(IsoCrypto).toMatchTypeOf(NodeEcc);
    },

    'From Browser': {

        beforeEach(this: EccTest) {
            this.source = BrowserEcc;
        },

        'To Browser': {

            beforeEach(this: EccTest) {
                this.target = BrowserEcc;
            },

            async success(this: EccTest) {

                for (const encryption of [
                    null,
                    undefined,
                    {
                        cipher: 'AES',
                        size: 128,
                        mode: 'CBC',
                    },
                    {
                        cipher: 'AES',
                        size: 256,
                        mode: 'CBC',
                    },
                    {
                        cipher: 'AES',
                        size: 192,
                        mode: 'CTR',
                    },
                ] as const) {

                    const options = encryption === null ? undefined : { encryption };

                    const [sourcePrivateKey, targetPrivateKey] = await Promise.all([
                        this.source.generateEccPrivateKey(),
                        this.target.generateEccPrivateKey(),
                    ]);

                    const data = 'This is my super secret message I am sending to my friend. No peeking!';

                    const encrypted = await this.source.eccEncrypt({
                        data,
                        privateKey: sourcePrivateKey,
                        publicKey: this.target.generateEccPublicKey(targetPrivateKey),
                    }, options);

                    const decrypted = await this.target.eccDecrypt({
                        ...encrypted,
                        privateKey: targetPrivateKey,
                    }, options);

                    expect(IsoCrypto.encode(decrypted)).to.equal(data);
                }
            },
        },

        'To Node': {

            beforeEach(this: EccTest) {
                this.target = NodeEcc;
            },

            async success(this: EccTest) {
                return EccSpec['From Browser']['To Browser'].success.call(this);
            },
        },

        async eccDecrypt(this: EccTest) {

            for (const { output, encrypted, iv, privateKey, publicKey, encryption } of [
                {
                    output: 'Hello I have been trying to reach you about your car\'s extended warranty',
                    encrypted: '2997df9daa3345056517eaa24b635c58caf7317f4ba1517ed50043477cd28def2b2de1f006c392c1fda' +
                        '98f177c95d0cebed5c1e8bd56a57510e4782e6711f1762f5f3feda15080a1',
                    iv: '128e4cea8d498b5651323ff5f3e8d2d8',
                    publicKey: '02575ccf97b1c75a042b727c943bb06656267fbd3ab802cae990693d69df9f31fd',
                    privateKey: '77fbbd22556c898c57784f33d50f41e741c2dbc696694f35f891d9a6465cb923',
                },
                {
                    output: 'Erised stra ehru oyt ube cafru oyt on wohsi',
                    encryption: {
                        cipher: 'AES',
                        size: 128,
                        mode: 'CBC',
                    },
                    encrypted: '3f84fdf2775293ccbc3b280430ea05fb1a9bf53841b34f111' +
                        '28c9f75c9d9a202409e353742a0849d3c551f23caf0b997',
                    iv: '8f070f27ff06c8536b3253ad9fe8776f',
                    publicKey: '02f5cb1d664694b4f78c0ca1b6a2709e1a26633ba329ca22f89a125eb4c2a5cc90',
                    privateKey: '1c3b0a30fdf86f95e3017f31678833a8ca78dae76a5ce26b21fb4a7803e42747',
                },
                {
                    output: 'I open at the close',
                    encryption: {
                        cipher: 'AES',
                        size: 192,
                        mode: 'CTR',
                    },
                    encrypted: '37a6c48aa574cdacc66c56acff55cb6daf37ff',
                    iv: '134c165fc8dee41da14205c334dd674b',
                    publicKey: '03251e03a670b6fd5d2ed1ebc62af51dc8c1ea08da070f56028b5c58b0f423f3b1',
                    privateKey: 'f8fef5c526645145405c3537737ec4a103bed357a836e4fe010f442a34ec52ae',
                },
            ] as const) {

                for (const compressed of [true, false]) {

                    const decrypted = await this.source.eccDecrypt({
                        ...IsoCrypto.decodeObject({
                            encrypted,
                            iv,
                            privateKey,
                        }, 'hex'),
                        publicKey: compressed ?
                            { text: publicKey, encoding: 'hex' } :
                            IsoCrypto.decompressEccPublicKey({ text: publicKey, encoding: 'hex' }),
                    }, { encryption });
                    expect(IsoCrypto.encode(decrypted)).to.equal(output);
                }
            }
        },

        compression(this: EccTest) {

            for (const { privateKey, compressedPublicKey, decompressedPublicKey } of [
                {
                    privateKey: '6b86a3d180945159e8411b6ccd36050deda274452fa6349b3447df91a867d954',
                    compressedPublicKey: '02b23df7dcbfb6e250065a44a721aa273c49d006121a351bedbf3bdcb02c4e2995',
                    decompressedPublicKey: '04b23df7dcbfb6e250065a44a721aa273c49d006121a351bedbf3bdcb02c4e2995' +
                        'a32a6539d683575ed084be3251eca7bfc6e97b640a5de3ddab36536ae2d34868',
                },
                {
                    privateKey: 'b2ddf1f3b903800c757afff4e32c0d760437732a509fbc9d280d5bc8b09f98a2',
                    compressedPublicKey: '02bb83fa7e732c35e90a495f54168b2aada58355d294367e0e2c254595eb67a394',
                    decompressedPublicKey: '04bb83fa7e732c35e90a495f54168b2aada58355d294367e0e2c254595eb67a394' +
                        '739670b47dd2f4a6ee14820ef3e6972a7c1af5a1facda1c1882e5f1b9e96e74a',
                },
                {
                    privateKey: 'ca0000feee709ad7ea6dff241403252bcde6180a3d1731d30d0b2aa5652a2ffa',
                    compressedPublicKey: '036cc84e22a80c706f40180c06863f6c5cf59d3ae642cce63573b413b126bc769b',
                    decompressedPublicKey: '046cc84e22a80c706f40180c06863f6c5cf59d3ae642cce63573b413b126bc769b' +
                        'fb9fb8bac6df6e6793a85092e01dcc3f699b845255539add0222afec65c2b3fb',
                },
            ] as const) {

                const publicKey = this.source.generateEccPublicKey({
                    text: privateKey,
                    encoding: 'hex',
                });

                expect(IsoCrypto.encode(publicKey, 'hex')).to.equal(compressedPublicKey);
                expect(
                    IsoCrypto.compressEccPublicKey(publicKey)
                ).to.deep.equal(publicKey);

                const decompressed = IsoCrypto.decompressEccPublicKey(publicKey);
                expect(IsoCrypto.encode(decompressed, 'hex')).to.equal(decompressedPublicKey);
                expect(
                    IsoCrypto.decompressEccPublicKey(decompressed)
                ).to.deep.equal(decompressed);

                expect(
                    IsoCrypto.compressEccPublicKey(decompressed)
                ).to.deep.equal(publicKey);
            }
        },
    },

    'From Node': {

        beforeEach(this: EccTest) {
            this.source = NodeEcc;
        },

        'To Browser': {

            beforeEach(this: EccTest) {
                this.target = BrowserEcc;
            },

            async success(this: EccTest) {
                return EccSpec['From Browser']['To Browser'].success.call(this);
            },
        },

        'To Node': {

            beforeEach(this: EccTest) {
                this.target = NodeEcc;
            },

            async success(this: EccTest) {
                return EccSpec['From Browser']['To Browser'].success.call(this);
            },
        },

        async eccDecrypt(this: EccTest) {
            return EccSpec['From Browser'].eccDecrypt.call(this);
        },

        async compression(this: EccTest) {
            EccSpec['From Browser'].compression.call(this);
        },
    },
};
