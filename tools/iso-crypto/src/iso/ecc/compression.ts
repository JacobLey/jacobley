import { decode, encode } from '#encode';
import { deriveYCoordinate, p256 } from '../lib/math.js';
import type { InputText } from '../lib/types.js';

/**
 * Compress an ECC Public Key.
 *
 * Idempotent, accepts an already compressed key and will return it unchanged.
 *
 * "Compressed" public keys are effectively ~50% the size of the original key.
 *
 * @param {InputText} publicKey - public key
 * @returns {Uin8Array} compressed public key
 */
export const compressEccPublicKey = (publicKey: InputText): Uint8Array => {
    const decoded = decode(publicKey);
    if (decoded.length <= 33) {
        return decoded;
    }
    const x = decoded.slice(1, 33);
    // eslint-disable-next-line no-bitwise
    const odd = decoded.slice(33).reverse()[0]! & 1;
    return new Uint8Array([
        2 + odd,
        ...x,
    ]);
};

/**
 * Decompress an ECC Public Key.
 *
 * Idempotent, accepts an already "uncompressed" key and will return it unchanged.
 *
 * @param {InputText} publicKey - public key
 * @returns {Uin8Array} uncompressed public key
 */
export const decompressEccPublicKey = (publicKey: InputText): Uint8Array => {
    const decoded = decode(publicKey);
    if (decoded.length > 33) {
        return decoded;
    }
    const x = decoded.slice(1, 33);
    // eslint-disable-next-line no-bitwise
    const odd = !!(decoded[0]! & 1);

    const y = deriveYCoordinate(
        BigInt(`0x${encode(x, 'hex')}`),
        odd,
        p256
    );

    return new Uint8Array([
        4,
        ...x,
        ...decode({ text: y.toString(16), encoding: 'hex' }),
    ]);
};
