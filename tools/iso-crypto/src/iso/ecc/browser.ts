import crypto from '#crypto';
import { decode, encode } from '#encode';
import { decrypt, encrypt } from '#encrypt';
import { padBytes } from '../lib/bytes-length.js';
import { derivePublicKey, p256, type Point } from '../lib/math.js';
import { defaultEncryption, type InputText } from '../lib/types.js';
import { decompressEccPublicKey } from './compression.js';
import type * as Ecc from './types.js';

export const generateEccPrivateKey: typeof Ecc['generateEccPrivateKey'] = async () => {
    const ecdh = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveKey']
    );
    const key = await crypto.subtle.exportKey('jwk', ecdh.privateKey);
    return decode({ text: key.d!, encoding: 'base64url' });
};

const deriveP256PublicKey = (privateKey: InputText): Point => {

    const hex = encode(decode(privateKey), 'hex');

    return derivePublicKey(
        BigInt(`0x${hex}`),
        p256
    );
};
const deriveP256PublicKeyBase64 = (privateKey: InputText): { x: string; y: string } => {
    const { x, y } = deriveP256PublicKey(privateKey);
    return {
        x: encode(padBytes(decode({ text: x.toString(16), encoding: 'hex' }), 32), 'base64url'),
        y: encode(padBytes(decode({ text: y.toString(16), encoding: 'hex' }), 32), 'base64url'),
    };
};

export const generateEccPublicKey: typeof Ecc['generateEccPublicKey'] = privateKey => {

    const { x, y } = deriveP256PublicKey(privateKey);

    // eslint-disable-next-line no-bitwise
    const odd = 2n + (y & 1n);

    return new Uint8Array([
        Number(odd),
        ...padBytes(decode({ text: x.toString(16), encoding: 'hex' }), 32),
    ]);
};

const eccSecret = async ({ privateKey, publicKey }: {
    publicKey: InputText;
    privateKey: InputText;
}): Promise<{
    secret: Uint8Array;
    privateEc: CryptoKey;
}> => {

    const bufferPrivateKey = decode(privateKey);

    const [
        privateEc,
        publicEc,
    ] = await Promise.all([
        crypto.subtle.importKey(
            'jwk',
            {
                crv: 'P-256',
                kty: 'EC',
                d: encode(bufferPrivateKey, 'base64url'),
                ...deriveP256PublicKeyBase64(bufferPrivateKey),
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
            decompressEccPublicKey(publicKey),
            {
                name: 'ECDH',
                namedCurve: 'P-256',
            },
            true,
            ['deriveKey']
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
    const secret = await crypto.subtle.exportKey('raw', derivedSecret);

    return {
        secret: new Uint8Array(secret),
        privateEc,
    };
};

export const eccEncrypt: typeof Ecc['eccEncrypt'] = async ({
    data,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const secretKey = await eccSecret({ privateKey, publicKey });

    const [
        encrypted,
        jwk,
    ] = await Promise.all([
        encrypt({
            data,
            secret: secretKey.secret,
        }, { encryption, hash: 'raw' }),
        crypto.subtle.exportKey('jwk', secretKey.privateEc),
    ]);

    // eslint-disable-next-line no-bitwise
    const odd = decode({ text: jwk.y!, encoding: 'base64url' }).reverse()[0]! & 1;

    const publicX = decode({ text: jwk.x!, encoding: 'base64url' });

    return {
        ...encrypted,
        publicKey: new Uint8Array([
            2 + odd,
            ...padBytes(publicX, 32),
        ]),
    };
};
export const eccDecrypt: typeof Ecc['eccDecrypt'] = async ({
    encrypted,
    iv,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const { secret } = await eccSecret({ privateKey, publicKey });

    return decrypt({
        encrypted,
        iv,
        secret,
    }, { encryption, hash: 'raw' });
};
