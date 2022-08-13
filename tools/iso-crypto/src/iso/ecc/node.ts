import { createECDH, type ECDH, type ECDHKeyFormat } from 'node:crypto';
import { decode } from '#encode';
import { decrypt, encrypt } from '#encrypt';
import { padBytes } from '../lib/bytes-length.js';
import { defaultEncryption } from '../lib/types.js';
import type * as Ecc from './types.js';

const getCompressedPublicKey = (ecdh: ECDH): Buffer => (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/61667
    ecdh.getPublicKey as (encoding?: null, format?: ECDHKeyFormat) => Buffer
)(null, 'compressed');

export const generateEccPrivateKey: typeof Ecc['generateEccPrivateKey'] = async (): Promise<Uint8Array> => {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    return padBytes(ecdh.getPrivateKey(), 32);
};
export const generateEccPublicKey: typeof Ecc['generateEccPublicKey'] = privateKey => {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(decode(privateKey));
    return getCompressedPublicKey(ecdh);
};

export const eccEncrypt: typeof Ecc['eccEncrypt'] = async ({
    data,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(decode(privateKey));

    const encrypted = await encrypt({
        data,
        secret: ecdh.computeSecret(decode(publicKey)),
    }, { encryption, hash: 'raw' });

    return {
        ...encrypted,
        publicKey: getCompressedPublicKey(ecdh),
    };
};
export const eccDecrypt: typeof Ecc['eccDecrypt'] = async ({
    encrypted,
    iv,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(decode(privateKey));

    return decrypt({
        encrypted,
        iv,
        secret: ecdh.computeSecret(decode(publicKey)),
    }, { encryption, hash: 'raw' });
};
