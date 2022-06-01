import { randomBytes } from 'node:crypto';
import Chai from 'chai';
import { expectTypeOf } from 'expect-type';
import type { Context } from 'mocha';
import { getPatched, patchKey } from 'named-patch';
import Sinon from 'sinon';
import crypto from '#crypto';
import * as BrowserEncryption from '../../browser.js';
import * as NodeEncryption from '../../node.js';
import * as EncryptionKeys from '../data/encryption-keys.js';

interface EncryptionTest extends Context {
    encryption: typeof BrowserEncryption | typeof NodeEncryption;
    targetEncryption: typeof BrowserEncryption | typeof NodeEncryption;
    getRandomValuesStub: Sinon.SinonStub;
    randomBytesStub: Sinon.SinonStub;
}

export const EncryptionSpec = {

    afterEach() {
        Sinon.restore();
    },

    beforeEach(this: EncryptionTest) {

        this.getRandomValuesStub = Sinon.stub(crypto, 'getRandomValues');
        this.getRandomValuesStub.callsFake((arr: Uint8Array): Uint8Array => {
            for (let i = 0; i < arr.length; ++i) {
                arr[i] = i;
            }
            return arr;
        });

        const randomBytesStub = Sinon.stub(getPatched(randomBytes), patchKey);
        randomBytesStub.callsFake(
            (length, cb) => {
                const buf = Buffer.alloc(length);
                for (let i = 0; i < length; ++i) {
                    buf[i] = i;
                }
                setImmediate(() => {
                    cb(null, buf);
                });
            }
        );
        this.randomBytesStub = randomBytesStub;
    },

    type() {
        expectTypeOf(NodeEncryption).toEqualTypeOf<typeof BrowserEncryption>();
    },

    encrypt: {

        browser: {

            beforeEach(this: EncryptionTest) {
                this.encryption = BrowserEncryption;
            },

            async success(this: EncryptionTest) {

                Chai.expect(await this.encryption.encrypt({
                    data: 'This is some plaintext data I want to encrypt',
                    secret: 'This is super secret do not tell anyone',
                })).to.deep.equal({
                    encrypted: 'H3HY0CjOmRsxYwuDq38agsRVEZoOIZtn6zDVw_vPjZ4RjUR7IijlOk009vDO',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                });
            },

            async noHash(this: EncryptionTest) {

                Chai.expect(await this.encryption.encrypt({
                    data: 'This is some plaintext data I want to encrypt',
                    secret: '_Wz28SObLRnxLxGyDYBxhubSY5d0xLVQwszZMLTmO6o',
                }, { noHash: true })).to.deep.equal({
                    encrypted: 'OAhSZ-5tyGNkA9aBvvuqTl9SpO2uh5MVxBBVD_QxxJSD7V6_EYyqlFyxFRGt',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                });
            },

            async inputEncoding(this: EncryptionTest) {

                Chai.expect(await this.encryption.encrypt({
                    data: 'VGhpcyBpcyBzb21lIHBsYWludGV4dCBkYXRhIEkgd2FudCB0byBlbmNyeXB0',
                    secret: 'This is super secret do not tell anyone',
                }, { inputEncoding: 'base64url' })).to.deep.equal({
                    encrypted: 'H3HY0CjOmRsxYwuDq38agsRVEZoOIZtn6zDVw_vPjZ4RjUR7IijlOk009vDO',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                });
            },
        },

        server: {

            beforeEach(this: EncryptionTest) {
                this.encryption = NodeEncryption;
            },

            async success(this: EncryptionTest) {
                return EncryptionSpec.encrypt.browser.success.call(this);
            },

            async noHash(this: EncryptionTest) {
                return EncryptionSpec.encrypt.browser.noHash.call(this);
            },

            async inputEncoding(this: EncryptionTest) {
                return EncryptionSpec.encrypt.browser.inputEncoding.call(this);
            },
        },
    },

    decrypt: {

        browser: {

            beforeEach(this: EncryptionTest) {
                this.encryption = BrowserEncryption;
            },

            async success(this: EncryptionTest) {

                Chai.expect(await this.encryption.decrypt({
                    encrypted: 'H3HY0CjOmRsxYwuDq38agsRVEZoOIZtn6zDVw_vPjZ4RjUR7IijlOk009vDO',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                    secret: 'This is super secret do not tell anyone',
                })).to.equal('This is some plaintext data I want to encrypt');
            },

            async noHash(this: EncryptionTest) {

                Chai.expect(await this.encryption.decrypt({
                    encrypted: 'OAhSZ-5tyGNkA9aBvvuqTl9SpO2uh5MVxBBVD_QxxJSD7V6_EYyqlFyxFRGt',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                    secret: '_Wz28SObLRnxLxGyDYBxhubSY5d0xLVQwszZMLTmO6o',
                }, { noHash: true })).to.equal('This is some plaintext data I want to encrypt');
            },

            async outputEncoding(this: EncryptionTest) {

                Chai.expect(await this.encryption.decrypt({
                    encrypted: 'H3HY0CjOmRsxYwuDq38agsRVEZoOIZtn6zDVw_vPjZ4RjUR7IijlOk009vDO',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                    secret: 'This is super secret do not tell anyone',
                }, { outputEncoding: 'base64url' })).to.equal(
                    'VGhpcyBpcyBzb21lIHBsYWludGV4dCBkYXRhIEkgd2FudCB0byBlbmNyeXB0'
                );
            },
        },

        server: {

            beforeEach(this: EncryptionTest) {
                this.encryption = NodeEncryption;
            },

            async success(this: EncryptionTest) {
                return EncryptionSpec.decrypt.browser.success.call(this);
            },

            async noHash(this: EncryptionTest) {
                return EncryptionSpec.decrypt.browser.noHash.call(this);
            },

            async outputEncoding(this: EncryptionTest) {
                return EncryptionSpec.decrypt.browser.outputEncoding.call(this);
            },
        },
    },

    generateEccPrivateKey: {

        browser: {

            beforeEach(this: EncryptionTest) {
                this.encryption = BrowserEncryption;
            },

            async success(this: EncryptionTest) {
                Chai.expect(
                    await this.encryption.generateEccPrivateKey()
                ).to.match(/^[A-Za-z\d\-_]{43}$/u);
            },
        },

        server: {

            beforeEach(this: EncryptionTest) {
                this.encryption = NodeEncryption;
            },

            async success(this: EncryptionTest) {
                return EncryptionSpec.generateEccPrivateKey.browser.success.call(this);
            },
        },
    },

    generateEccPublicKey: {

        browser: {

            beforeEach(this: EncryptionTest) {
                this.encryption = BrowserEncryption;
            },

            async success(this: EncryptionTest) {
                Chai.expect(this.encryption.generateEccPublicKey(
                    await this.encryption.generateEccPrivateKey()
                )).to.match(/^[A-Za-z\d\-_]{44}$/u);

                Chai.expect(
                    this.encryption.generateEccPublicKey(EncryptionKeys.eccPrivateKey1)
                ).to.equal(EncryptionKeys.eccPublicKey1);
            },
        },

        server: {

            beforeEach(this: EncryptionTest) {
                this.encryption = NodeEncryption;
            },

            async success(this: EncryptionTest) {
                return EncryptionSpec.generateEccPublicKey.browser.success.call(this);
            },
        },
    },

    eccEncrypt: {

        browser: {

            beforeEach(this: EncryptionTest) {
                this.encryption = BrowserEncryption;
            },

            async success(this: EncryptionTest) {

                const data = 'I am sending a secret message';

                const [
                    encrypted1,
                    encrypted2,
                ] = await Promise.all([
                    this.encryption.eccEncrypt({
                        data,
                        privateKey: EncryptionKeys.eccPrivateKey1,
                        publicKey: EncryptionKeys.eccPublicKey2,
                    }),
                    this.encryption.eccEncrypt({
                        data,
                        privateKey: EncryptionKeys.eccPrivateKey2,
                        publicKey: EncryptionKeys.eccPublicKey1,
                    }),
                ]);
                Chai.expect(encrypted1).to.deep.equal({
                    encrypted: 'SFuAq5i5G9yoOTTiC9izb3Q6qYdYvTtgURFNWlg',
                    iv: 'AAECAwQFBgcICQoLDA0ODw',
                    publicKey: EncryptionKeys.eccPublicKey1,
                });
                const trimPublic = ({ publicKey, ...x }: typeof encrypted1): Omit<typeof encrypted1, 'publicKey'> => x;
                Chai.expect(trimPublic(encrypted1)).to.deep.equal(trimPublic(encrypted2));
            },
        },

        server: {

            beforeEach(this: EncryptionTest) {
                this.encryption = NodeEncryption;
            },

            async success(this: EncryptionTest) {
                return EncryptionSpec.eccEncrypt.browser.success.call(this);
            },
        },
    },

    eccDecrypt: {

        browser: {

            beforeEach(this: EncryptionTest) {
                this.encryption = BrowserEncryption;
            },

            async success(this: EncryptionTest) {

                const encrypted = 'SFuAq5i5G9yoOTTiC9izb3Q6qYdYvTtgURFNWlg';
                const iv = 'AAECAwQFBgcICQoLDA0ODw';

                const [
                    decrypted1,
                    decrypted2,
                ] = await Promise.all([
                    this.encryption.eccDecrypt({
                        encrypted,
                        iv,
                        privateKey: EncryptionKeys.eccPrivateKey1,
                        publicKey: EncryptionKeys.eccPublicKey2,
                    }),
                    this.encryption.eccDecrypt({
                        encrypted,
                        iv,
                        privateKey: EncryptionKeys.eccPrivateKey2,
                        publicKey: EncryptionKeys.eccPublicKey1,
                    }),
                ]);
                Chai.expect(decrypted1).to.equal(decrypted2);
                Chai.expect(decrypted1).to.equal('I am sending a secret message');
            },
        },

        server: {

            beforeEach(this: EncryptionTest) {
                this.encryption = NodeEncryption;
            },

            async success(this: EncryptionTest) {
                return EncryptionSpec.eccDecrypt.browser.success.call(this);
            },
        },
    },

    lifecycle: {

        beforeEach(this: EncryptionTest) {
            this.getRandomValuesStub.restore();
            this.randomBytesStub.restore();
        },

        'secret': {

            'From browser': {

                beforeEach(this: EncryptionTest) {
                    this.encryption = BrowserEncryption;
                },

                'To browser': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = BrowserEncryption;
                    },

                    async success(this: EncryptionTest) {

                        const data = 'Help me, Obi-Wan Kenobi. You\'re my only hope.';
                        const secretBuf = randomBytes(100);
                        const secret = secretBuf.toString();
                        const encrypted = await this.encryption.encrypt({
                            data,
                            secret,
                        });
                        const decrypted = await this.targetEncryption.decrypt({
                            ...encrypted,
                            secret,
                        });
                        Chai.expect(decrypted).to.equal(data);
                    },
                },

                'To server': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = NodeEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle.secret['From browser']['To browser'].success.call(this);
                    },
                },
            },

            'From server': {

                beforeEach(this: EncryptionTest) {
                    this.encryption = NodeEncryption;
                },

                'To browser': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = BrowserEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle.secret['From browser']['To browser'].success.call(this);
                    },
                },

                'To server': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = NodeEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle.secret['From browser']['To browser'].success.call(this);
                    },
                },
            },
        },

        'ecc': {

            'From browser': {

                beforeEach(this: EncryptionTest) {
                    this.encryption = BrowserEncryption;
                },

                'To browser': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = BrowserEncryption;
                    },

                    async success(this: EncryptionTest) {

                        this.timeout(4000);

                        const data = 'O, Draconian devil! Oh, lame saint!';

                        const [privateKey1, privateKey2] = await Promise.all([
                            this.encryption.generateEccPrivateKey(),
                            this.encryption.generateEccPrivateKey(),
                        ]);

                        const publicKey1 = this.encryption.generateEccPublicKey(privateKey1);
                        const publicKey2 = this.encryption.generateEccPublicKey(privateKey2);

                        const encrypted = await this.encryption.eccEncrypt({
                            data,
                            privateKey: privateKey1,
                            publicKey: publicKey2,
                        });
                        const decrypted = await this.targetEncryption.eccDecrypt({
                            ...encrypted,
                            privateKey: privateKey2,
                            publicKey: publicKey1,
                        });
                        Chai.expect(decrypted).to.equal(data);
                    },
                },

                'To server': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = NodeEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle.ecc['From browser']['To browser'].success.call(this);
                    },
                },
            },

            'From server': {

                beforeEach(this: EncryptionTest) {
                    this.encryption = NodeEncryption;
                },

                'To browser': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = BrowserEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle.ecc['From browser']['To browser'].success.call(this);
                    },
                },

                'To server': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = NodeEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle.ecc['From browser']['To browser'].success.call(this);
                    },
                },
            },
        },

        'Multi encryption': {

            'From browser': {

                beforeEach(this: EncryptionTest) {
                    this.encryption = BrowserEncryption;
                },

                'To browser': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = BrowserEncryption;
                    },

                    async success(this: EncryptionTest) {

                        const data = 'This value is unknown to the second stage.';
                        const firstSecret = randomBytes(100).toString();
                        const secondSecret = randomBytes(100).toString();
                        const thirdSecret = randomBytes(100).toString();

                        const firstEncryption = await this.encryption.encrypt({
                            data,
                            secret: firstSecret,
                        });

                        const secondEncryption = await this.targetEncryption.encrypt({
                            data: firstEncryption.encrypted,
                            secret: secondSecret,
                        }, { inputEncoding: 'base64url' });

                        const firstDecryption = await this.encryption.decrypt({
                            encrypted: secondEncryption.encrypted,
                            iv: firstEncryption.iv,
                            secret: firstSecret,
                        }, { outputEncoding: 'base64url' });

                        const thirdEncryption = await this.encryption.encrypt({
                            data: firstDecryption,
                            secret: thirdSecret,
                        }, { inputEncoding: 'base64url' });

                        const secondDecryption = await this.targetEncryption.decrypt({
                            encrypted: thirdEncryption.encrypted,
                            iv: secondEncryption.iv,
                            secret: secondSecret,
                        }, { outputEncoding: 'base64url' });

                        const thirdDecryption = await this.encryption.decrypt({
                            encrypted: secondDecryption,
                            iv: thirdEncryption.iv,
                            secret: thirdSecret,
                        });

                        Chai.expect(thirdDecryption).to.equal(data);
                    },
                },

                'To server': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = NodeEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle['Multi encryption']['From browser']['To browser']
                            .success.call(this);
                    },
                },
            },

            'From server': {

                beforeEach(this: EncryptionTest) {
                    this.encryption = NodeEncryption;
                },

                'To browser': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = BrowserEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle['Multi encryption']['From browser']['To browser']
                            .success.call(this);
                    },
                },

                'To server': {

                    beforeEach(this: EncryptionTest) {
                        this.targetEncryption = NodeEncryption;
                    },

                    async success(this: EncryptionTest) {
                        return EncryptionSpec.lifecycle['Multi encryption']['From browser']['To browser']
                            .success.call(this);
                    },
                },
            },
        },
    },
};
