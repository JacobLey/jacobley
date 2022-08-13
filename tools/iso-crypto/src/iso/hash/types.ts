import type { Hash, InputText } from '../lib/types.js';

/**
 * Hash provided text with the given algorithm.
 *
 * @param {InputText} input - text to hash
 * @param {object} [algorithm] - hash algorithm to use, defaults to SHA256
 * @returns {Promise<Uint8Array>} hashed output
 */
export declare const hash: (
    input: InputText,
    algorithm?: Hash | undefined
) => Promise<Uint8Array>;
