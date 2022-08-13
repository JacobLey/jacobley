import {
    createCipheriv,
    createDecipheriv,
} from 'node:crypto';
import { randomBytes } from '#random';
import { fixBytes } from '../lib/bytes-length.js';
import { encryptionMeta } from '../lib/size-meta.js';
import { type Encryption, type Methods } from '../lib/types.js';

const encryptionToCipher = (
    encryption: Encryption
): string => `${encryption.cipher}-${encryption.size}-${encryption.mode}`;

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

    const cipher = createCipheriv(
        encryptionToCipher(encryption),
        fixBytes(secret, sizes.secret),
        iv
    );

    return {
        encrypted: Buffer.concat([cipher.update(data), cipher.final()]),
        iv,
    } as const;
};
export const hashedDecrypt: Methods['hashedDecrypt'] = async (
    encrypted,
    iv,
    secret,
    encryption
) => {

    const sizes = encryptionMeta(encryption);

    const decipher = createDecipheriv(
        encryptionToCipher(encryption),
        fixBytes(secret, sizes.secret),
        iv
    );

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
