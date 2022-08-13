import type { Encryption, Hash, InputText } from '../lib/types.js';

/**
 * Encrypt the incoming content using the specified encryption and hashing algorithms.
 *
 * @param {object} params - params
 * @param {InputText} params.data - content to encrypt
 * @param {InputText} params.secret - secret key for encryption
 * @param {object} [options] - options
 * @param {object} [options.encryption] - encryption algorithm to use, defaults to `aes-256-ctr`
 * @param {object} [options.hash] - hash algorithm to use to fit secret to the required key size.
 *                                  Defaults to SHA256. Set to `'raw'` to avoid hashing.
 * @returns {Promise<object>} - encrypted text and accompanying initialization vector
 */
export declare const encrypt: (
    params: {
        data: InputText;
        secret: InputText;
    },
    options?: {
        encryption?: Encryption | undefined;
        hash?: Hash | undefined;
    }
) => Promise<{
    encrypted: Uint8Array;
    iv: Uint8Array;
}>;

/**
 * Decrypt the content using the specified encryption and hashing algorithms.
 *
 * Ensure that encryption + hashing algorithms used match those used when initially encrypting the data.
 *
 * @param {object} params - params
 * @param {InputText} params.encrypted - encrypted content, see output of `encrypt`
 * @param {InputText} params.iv - initialization vector used during encryption, see output of `encrypt`
 * @param {InputText} params.secret - secret key for encryption
 * @param {object} [options] - options
 * @param {object} [options.encryption] - encryption algorithm to use, defaults to `aes-256-ctr`
 * @param {object} [options.hash] - hash algorithm to use to fit secret to the required key size.
 *                                  Defaults to SHA256. Set to `'raw'` to avoid hashing.
 * @returns {Promise<object>} - encrypted text and accompanying initialization vector
 */
export declare const decrypt: (
    params: {
        encrypted: InputText;
        iv: InputText;
        secret: InputText;
    },
    options?: {
        encryption?: Encryption | undefined;
        hash?: Hash | undefined;
    }
) => Promise<Uint8Array>;
