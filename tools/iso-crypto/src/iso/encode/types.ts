import type { Encoding, InputText } from '../lib/types.js';

/**
 * Decodes the incoming text to a Uint8Array.
 *
 * Encoding of text is inferred as UTF8 if not otherwise specified.
 *
 * @param {InputText} input - text to decode
 * @returns {Uint8Array} decoded
 */
export declare const decode: (input: InputText) => Uint8Array;

/**
 * Encodes the incoming content as text.
 *
 * @param {InputText} input - content to encoded
 * @param {Encoding} [encoding] - encoding to use, defaults to UTF8
 * @returns {string} encoded
 */
export declare const encode: (
    input: InputText,
    encoding?: Encoding | undefined
) => string;
