import crypto from '#crypto';
import { randomBytes } from '#random';
import { fixBytes } from '../lib/bytes-length.js';
import { encryptionMeta } from '../lib/size-meta.js';
import { type Encryption, type Methods } from '../lib/types.js';

const encryptionToAlgorithm = (
    encryption: Encryption
): crypto.AesDerivedKeyParams => ({
    name: `${encryption.cipher}-${encryption.mode}`,
    length: encryption.size / 2,
});

export const hashedEncrypt: Methods['hashedEncrypt'] = async (
    data,
    secretPromise,
    encryption
) => {

    const sizes = encryptionMeta(encryption);
    const [iv, secret] = await Promise.all([
        randomBytes(sizes.iv),
        secretPromise,
    ]);
    const algorithm = encryptionToAlgorithm(encryption);

    const key = await crypto.subtle.importKey(
        'raw',
        fixBytes(secret, sizes.secret),
        algorithm.name,
        false,
        ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
        {
            ...algorithm,
            counter: iv,
            iv,
        },
        key,
        data
    );

    return {
        encrypted: new Uint8Array(encrypted),
        iv,
    };
};
export const hashedDecrypt: Methods['hashedDecrypt'] = async (
    encrypted,
    iv,
    secret,
    encryption
) => {

    const sizes = encryptionMeta(encryption);
    const algorithm = encryptionToAlgorithm(encryption);

    const key = await crypto.subtle.importKey(
        'raw',
        fixBytes(secret, sizes.secret),
        algorithm.name,
        false,
        ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            ...algorithm,
            counter: iv,
            iv,
        },
        key,
        encrypted
    );

    return new Uint8Array(decrypted);
};
