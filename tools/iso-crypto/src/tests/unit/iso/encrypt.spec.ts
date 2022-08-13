import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import type { Context } from 'mocha';
import * as Encrypt from '../../../encrypt.js';
import * as IsoCrypto from '../../../index.js';
import * as BrowserSymEncrypt from '../../../iso/sym-encrypt/browser.js';
import { symEncrypt } from '../../../iso/sym-encrypt/encrypt.js';
import * as NodeSymEncrypt from '../../../iso/sym-encrypt/node.js';

interface EncryptTest extends Context {
    source: typeof Encrypt;
    target: typeof Encrypt;
}

export const EncryptSpec = {

    types() {
        expectTypeOf(BrowserSymEncrypt).toEqualTypeOf(NodeSymEncrypt);
        expectTypeOf(IsoCrypto).toMatchTypeOf(Encrypt);
    },

    'From Browser': {

        beforeEach(this: EncryptTest) {
            this.source = symEncrypt(BrowserSymEncrypt);
        },

        'To Browser': {

            beforeEach(this: EncryptTest) {
                this.target = symEncrypt(BrowserSymEncrypt);
            },

            async success(this: EncryptTest) {

                for (const encryption of [
                    {
                        cipher: 'AES',
                        size: 128,
                        mode: 'CBC',
                    },
                    {
                        cipher: 'AES',
                        size: 192,
                        mode: 'CBC',
                    },
                    {
                        cipher: 'AES',
                        size: 256,
                        mode: 'CBC',
                    },
                    {
                        cipher: 'AES',
                        size: 128,
                        mode: 'CTR',
                    },
                    {
                        cipher: 'AES',
                        size: 192,
                        mode: 'CTR',
                    },
                    {
                        cipher: 'AES',
                        size: 256,
                        mode: 'CTR',
                    },
                    undefined,
                    null,
                ] as const) {

                    const data = 'This is my super secret data to encrypt';
                    const secret = 'This is my super duper secret key';

                    const options = encryption === null ? undefined : { encryption };

                    const encrypted = await this.source.encrypt({
                        data,
                        secret,
                    }, options);

                    const decrypted = await this.target.decrypt({
                        ...encrypted,
                        secret,
                    }, options);

                    expect(IsoCrypto.encode(decrypted)).to.equal(data);
                }
            },
        },

        'To Node': {

            beforeEach(this: EncryptTest) {
                this.target = symEncrypt(NodeSymEncrypt);
            },

            async success(this: EncryptTest) {
                return EncryptSpec['From Browser']['To Browser'].success.call(this);
            },
        },

        async decrypt(this: EncryptTest) {

            for (const { encryption, hash, iv, secret, encrypted, output } of [
                {
                    output: 'Leonardo Da Vinci, The Mona Lisa',
                    secret: 'O, Draconian devil! Oh, lame saint!',
                    encryption: { cipher: 'AES', size: 192, mode: 'CTR' },
                    hash: { algorithm: 'SHA2', size: 384 },
                    encrypted: '5525b239904a6ab41d7b1f041da96f8be655650179c8d953f52a301e3905ee9f',
                    iv: '5b69237c4128b17c53387bf07b3d073f',
                },
                {
                    output: 'Madonna on the Rocks',
                    secret: 'So Dark the Con of Man',
                    encryption: { cipher: 'AES', size: 256, mode: 'CBC' },
                    hash: { algorithm: 'SHA1', size: 160 },
                    encrypted: '2bc1108106011c5fbe0015dfc6737c14e3b33038856b07a1f0490eb64e8fbbae',
                    iv: '5fe63b2f7cca6145497d00cc368cca2b',
                },
                {
                    output: 'The legend writ, the stain affected. The key in Silence undetected. ' +
                        'Fifty-five in iron pen, Mr. Matlack can\'t offend.',
                    secret: 'The secret lies with Charlotte',
                    encryption: { cipher: 'AES', size: 128, mode: 'CTR' },
                    hash: { algorithm: 'SHA2', size: 512 },
                    encrypted: '9fce8e343c0842255d438661923dbc90996927ab4b8ed4902aa79e6a241fa664eda327166fe0a65fb1f4a' +
                        'fcd75d0e9798f7ad6a0872b13870984d20669cc034cf06654502cae4ed82a1692069fbe82a00a2eb098bd609fbf8' +
                        'd3e61baf86ffa738ff2adc78e2bd39ab4f0cd97bfe14646a5dfbe767b',
                    iv: 'a7ad6006cd4984e685a6238eccad5502',
                },
                {
                    output: 'Heere at the Wall.',
                    secret: 'The vision to see the treasured past comes as the timely shadow crosses ' +
                        'in front of the house of Pass and Stow.',
                    encryption: { cipher: 'AES', size: 192, mode: 'CBC' },
                    hash: 'raw',
                    encrypted: 'cca33059a64e376493d855321b352616466d23c726fff6be7cd9cd6dec4a9dd2',
                    iv: '2be4b60e9b83352a31ca278a4eae5e42',
                },
            ] as const) {

                const decrypted = await this.source.decrypt({
                    encrypted: { text: encrypted, encoding: 'hex' },
                    iv: { text: iv, encoding: 'hex' },
                    secret,
                }, { encryption, hash });
                expect(IsoCrypto.encode(decrypted)).to.equal(output);
            }
        },
    },

    'From Node': {

        beforeEach(this: EncryptTest) {
            this.source = symEncrypt(NodeSymEncrypt);
        },

        'To Browser': {

            beforeEach(this: EncryptTest) {
                this.target = symEncrypt(BrowserSymEncrypt);
            },

            async success(this: EncryptTest) {
                return EncryptSpec['From Browser']['To Browser'].success.call(this);
            },
        },

        'To Node': {

            beforeEach(this: EncryptTest) {
                this.target = symEncrypt(NodeSymEncrypt);
            },

            async success(this: EncryptTest) {
                return EncryptSpec['From Browser']['To Browser'].success.call(this);
            },
        },

        async decrypt(this: EncryptTest) {
            return EncryptSpec['From Browser'].decrypt.call(this);
        },
    },
};
