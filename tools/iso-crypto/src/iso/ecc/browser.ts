import crypto from '#crypto';
import { decode, encode } from '#encode';
import { hashedDecrypt, hashedEncrypt } from '#sym-encrypt';
import { padBytes } from '../lib/bytes-length.js';
import { derivePublicKey, p256, type Point } from '../lib/math.js';
import { defaultEncryption, type InputText, type Methods } from '../lib/types.js';

export const generateEccPrivateKey: Methods['generateEccPrivateKey'] = async () => {
    const ecdh = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveKey']
    );
    const key = await crypto.subtle.exportKey('jwk', ecdh.privateKey);
    return encode({ text: key.d!, encoding: 'base64url' });
};

const deriveP256PublicKey = (privateKey: InputText): Point => {

    const hex = decode(encode(privateKey), 'hex');

    return derivePublicKey(
        BigInt(`0x${hex}`),
        p256
    );
};
const deriveP256PublicKeyBase64 = (privateKey: InputText): { x: string; y: string } => {
    const { x, y } = deriveP256PublicKey(privateKey);
    return {
        x: decode(padBytes(encode({ text: x.toString(16), encoding: 'hex' }), 32), 'base64url'),
        y: decode(padBytes(encode({ text: y.toString(16), encoding: 'hex' }), 32), 'base64url'),
    };
};

export const generateEccPublicKey: Methods['generateEccPublicKey'] = privateKey => {

    const { x, y } = deriveP256PublicKey(privateKey);

    // eslint-disable-next-line no-bitwise
    const hex = (2n + (y & 1n)).toString(4) + x.toString(16).padStart(64, '0');
    return padBytes(encode({ text: hex, encoding: 'hex' }), 33);
};

const eccSecret = async ({ privateKey, publicKey }: {
    publicKey: InputText;
    privateKey: InputText;
}): Promise<{
    secret: Uint8Array;
    privateEc: CryptoKey;
}> => {

    const bufferPrivateKey = encode(privateKey);

    const [
        privateEc,
        publicEc,
    ] = await Promise.all([
        crypto.subtle.importKey(
            'jwk',
            {
                crv: 'P-256',
                kty: 'EC',
                d: decode(bufferPrivateKey, 'base64url'),
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
            encode(publicKey),
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

export const eccEncrypt: Methods['eccEncrypt'] = async ({
    data,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const secretKey = await eccSecret({ privateKey, publicKey });

    const [
        encrypted,
        jwk,
    ] = await Promise.all([
        hashedEncrypt(
            encode(data),
            secretKey.secret,
            encryption
        ),
        crypto.subtle.exportKey('jwk', secretKey.privateEc),
    ]);

    // eslint-disable-next-line no-bitwise
    const odd = encode({ text: jwk.y!, encoding: 'base64url' }).reverse()[0]! & 1;

    const hexPublic = decode(encode({ text: jwk.x!, encoding: 'base64url' }), 'hex');

    return {
        ...encrypted,
        publicKey: padBytes(
            encode({
                text: (2 + odd).toString(4) + hexPublic,
                encoding: 'hex',
            }),
            33
        ),
    };
};
export const eccDecrypt: Methods['eccDecrypt'] = async ({
    encrypted,
    iv,
    publicKey,
    privateKey,
}, { encryption = defaultEncryption } = {}) => {

    const { secret } = await eccSecret({ privateKey, publicKey });

    return hashedDecrypt(
        encode(encrypted),
        encode(iv),
        secret,
        encryption
    );
};