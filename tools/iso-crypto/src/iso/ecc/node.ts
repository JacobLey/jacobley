import { createECDH, type ECDH, type ECDHKeyFormat } from 'node:crypto';
import { encode } from '#encode';
import { hashedDecrypt, hashedEncrypt } from '#sync-encrypt';
import { padBytes } from '../lib/bytes-length.js';
import { defaultEncryption, type Methods } from '../lib/types.js';

const getCompressedPublicKey = (ecdh: ECDH): Buffer => (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/61667
    ecdh.getPublicKey as (encoding?: null, format?: ECDHKeyFormat) => Buffer
)(null, 'compressed');

export const generateEccPrivateKey: Methods['generateEccPrivateKey'] = async (): Promise<Uint8Array> => {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    return padBytes(ecdh.getPrivateKey(), 32);
};
export const generateEccPublicKey: Methods['generateEccPublicKey'] = privateKey => {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(encode(privateKey));
    return getCompressedPublicKey(ecdh);
};

export const eccEncrypt: Methods['eccEncrypt'] = async ({
    data,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(encode(privateKey));

    const encrypted = await hashedEncrypt(
        encode(data),
        ecdh.computeSecret(encode(publicKey)),
        encryption
    );

    return {
        ...encrypted,
        publicKey: getCompressedPublicKey(ecdh),
    };
};
export const eccDecrypt: Methods['eccDecrypt'] = async ({
    encrypted,
    iv,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(encode(privateKey));

    return hashedDecrypt(
        encode(encrypted),
        encode(iv),
        ecdh.computeSecret(encode(publicKey)),
        encryption
    );
};
