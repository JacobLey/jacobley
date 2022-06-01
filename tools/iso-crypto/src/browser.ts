import { atob, btoa } from '#base64';
import crypto from '#crypto';
import { derivePublicKey, p256 } from './lib/math.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Convert a base64-encoded string to base64url.
 * Idempotent.
 *
 * @param {string} text - base64 text
 * @returns {string} base64url text
 */
const base64url = (text: string): string => text.replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');

/**
 * Convert a base64url-encoded string to base64.
 * Idempotent.
 *
 * @param {string} text - base64url text
 * @returns {string} base64 text
 */
const base64standard = (text: string): string => `${
     text.replaceAll('-', '+').replaceAll('_', '/')
 }${'='.repeat((4 - text.length % 4) % 4)}`;

const toBase64 = (buf: ArrayBuffer | number[] | Uint8Array): string => base64url(
    btoa(String.fromCodePoint(...new Uint8Array(buf)))
);
const toHex = (buf: Uint8Array): string => [...buf].map(x => x.toString(16).padStart(2, '0')).join('');
const fromBase64 = (str: string): Uint8Array => Uint8Array.from(
    [...atob(base64standard(str))].map(x => x.codePointAt(0)!)
);
const fromHex = (str: string, bytes: number): Uint8Array => new Uint8Array(
    str.padStart(bytes * 2, '0').match(/.{2}/gu)!.map(byte => Number.parseInt(byte, 16))
);

const sha256 = async (secret: string): Promise<ArrayBuffer> => crypto.subtle.digest('SHA-256', encoder.encode(secret));

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

    const iv = crypto.getRandomValues(new Uint8Array(16));

    const secretBuf = noHash ? fromBase64(secret) : await sha256(secret);

    const key = await crypto.subtle.importKey(
        'raw',
        secretBuf,
        { name: 'AES-CTR' },
        false,
        ['encrypt']
    );

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-CTR',
            counter: iv,
            length: 128,
        },
        key,
        inputEncoding === 'utf8' ? encoder.encode(data) : fromBase64(data)
    ) as ArrayBuffer;

    return {
        encrypted: toBase64(encryptedBuffer),
        iv: toBase64(iv),
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

    const secretBuf = noHash ? fromBase64(secret) : await sha256(secret);

    const key = await crypto.subtle.importKey(
        'raw',
        secretBuf,
        { name: 'AES-CTR' },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CTR',
            counter: fromBase64(iv),
            length: 128,
        },
        key,
        fromBase64(encrypted)
    ) as ArrayBuffer;

    return outputEncoding === 'utf8' ? decoder.decode(decryptedBuffer) : toBase64(decryptedBuffer);
};

export const generateEccPrivateKey = async (): Promise<string> => {
    const ecdh = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        []
    );
    const key = await crypto.subtle.exportKey('jwk', ecdh.privateKey);
    return key.d!;
};

const deriveP256PublicKey = (privateKey: string): { x: string; y: string } => {
    const { x, y } = derivePublicKey(
        BigInt(`0x${toHex(fromBase64(privateKey))}`),
        p256
    );
    return {
        x: toBase64(fromHex(x.toString(16), 32)),
        y: toBase64(fromHex(y.toString(16), 32)),
    };
};

export const generateEccPublicKey = (privateKey: string): string => {

    const { x, y } = derivePublicKey(
        BigInt(`0x${toHex(fromBase64(privateKey))}`),
        p256
    );

    return toBase64(fromHex(
        // eslint-disable-next-line no-bitwise
        (2n + (y & 1n)).toString(4) + x.toString(16).padStart(64, '0'),
        33
    ));
};

const eccSecret = async ({ privateKey, publicKey }: {
    publicKey: string;
    privateKey: string;
}): Promise<{
    secret: string;
    privateEc: CryptoKey;
}> => {

    const [
        privateEc,
        publicEc,
    ] = await Promise.all([
        crypto.subtle.importKey(
            'jwk',
            {
                crv: 'P-256',
                kty: 'EC',
                d: privateKey,
                ...deriveP256PublicKey(privateKey),
            },
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true,
            ['deriveKey']
        ),
        crypto.subtle.importKey(
            'raw',
            fromBase64(publicKey),
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true,
            []
        ),
    ]);

    const derivedSecret = await crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: publicEc,
        },
        privateEc,
        {
            name: 'HMAC',
            hash: 'SHA-256',
            length: 256,
        },
        true,
        []
    );
    const shared = await crypto.subtle.exportKey('raw', derivedSecret);

    return {
        secret: toBase64(shared),
        privateEc,
    };
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

    const secretKey = await eccSecret({ privateKey, publicKey });

    const [
        encrypted,
        jwk,
    ] = await Promise.all([
        encrypt({
            data,
            secret: secretKey.secret,
        }, { noHash: true }),
        crypto.subtle.exportKey('jwk', secretKey.privateEc),
    ]);

    // eslint-disable-next-line no-bitwise
    const odd = fromBase64(jwk.y!).reverse()[0]! & 1;

    return {
        ...encrypted,
        publicKey: toBase64(fromHex(
            (2 + odd).toString(4) + toHex(fromBase64(jwk.x!)),
            33
        )),
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

    const { secret } = await eccSecret({ privateKey, publicKey });

    return decrypt({
        encrypted,
        iv,
        secret,
    }, { noHash: true });
};
