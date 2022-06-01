import {
    createCipheriv,
    createDecipheriv,
    createECDH,
    createHash,
    randomBytes,
} from 'node:crypto';
import { promisify } from 'node:util';
import { patch } from 'named-patch';

const randomBytesAsync = promisify(patch(randomBytes));

const sha256 = (
    secret: string,
    encoding: 'base64url' | 'utf8' = 'utf8'
): Buffer => createHash('sha256').update(secret, encoding).digest();

export const encrypt = async ({
    data,
    secret,
}: {
    data: string;
    secret: string;
}, {
    noHash = false,
    inputEncoding = 'utf8',
}: {
    noHash?: boolean;
    inputEncoding?: 'base64url' | 'utf8';
} = {}): Promise<{
    encrypted: string;
    iv: string;
}> => {

    const iv = await randomBytesAsync(16);

    const cipher = createCipheriv(
        'aes-256-ctr',
        noHash ? Buffer.from(secret, 'base64url') : sha256(secret),
        iv
    );

    return {
        encrypted: cipher.update(data, inputEncoding, 'base64url') + cipher.final('base64url'),
        iv: iv.toString('base64url'),
    } as const;
};
export const decrypt = async ({
    encrypted,
    iv,
    secret,
}: {
    encrypted: string;
    iv: string;
    secret: string;
}, {
    noHash = false,
    outputEncoding = 'utf8',
}: {
    noHash?: boolean;
    outputEncoding?: 'base64url' | 'utf8';
} = {}): Promise<string> => {

    const decipher = createDecipheriv(
        'aes-256-ctr',
        noHash ? Buffer.from(secret, 'base64url') : sha256(secret),
        Buffer.from(iv, 'base64url')
    );

    return decipher.update(encrypted, 'base64url', outputEncoding) + decipher.final(outputEncoding);
};

export const generateEccPrivateKey = async (): Promise<string> => {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    return ecdh.getPrivateKey('base64url').padStart(43, 'A');
};
export const generateEccPublicKey = (privateKey: string): string => {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(privateKey, 'base64url');
    return ecdh.getPublicKey('base64url', 'compressed');
};

export const eccEncrypt = async ({
    data,
    publicKey,
    privateKey,
}: {
    data: string;
    publicKey: string;
    privateKey: string;
}): Promise<{
    encrypted: string;
    iv: string;
    publicKey: string;
}> => {

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(privateKey, 'base64url');

    const encrypted = await encrypt({
        data,
        secret: ecdh.computeSecret(publicKey, 'base64url', 'base64url'),
    }, { noHash: true });

    return {
        ...encrypted,
        publicKey: ecdh.getPublicKey('base64url', 'compressed'),
    };
};
export const eccDecrypt = async ({
    encrypted,
    iv,
    publicKey,
    privateKey,
}: {
    encrypted: string;
    iv: string;
    publicKey: string;
    privateKey: string;
}): Promise<string> => {

    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(privateKey, 'base64url');

    return decrypt({
        encrypted,
        iv,
        secret: ecdh.computeSecret(publicKey, 'base64url', 'base64url'),
    }, { noHash: true });
};
