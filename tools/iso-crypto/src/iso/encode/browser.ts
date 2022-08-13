import { atob, btoa } from '#base64';
import { inputToEncoding } from '../lib/input-to-encoding.js';
import { defaultEncoding } from '../lib/types.js';
import type * as Encode from './types.js';

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
const fromBase64 = (str: string): Uint8Array => Uint8Array.from(
    [...atob(base64standard(str))].map(x => x.codePointAt(0)!)
);

const toHex = (buf: Uint8Array): string => [...buf].map(x => x.toString(16).padStart(2, '0')).join('');
const fromHex = (str: string): Uint8Array => {
    const length = str.length % 2 ? str.length + 1 : str.length;
    return new Uint8Array(
        (
            str.padStart(length, '0').match(/.{2}/gu) ?? []
        ).map(byte => Number.parseInt(byte, 16))
    );
};

export const decode: typeof Encode['decode'] = input => {

    const { encoding, text } = inputToEncoding(input);

    if (encoding === 'raw') {
        return text;
    }
    if (encoding === 'utf8') {
        return encoder.encode(text);
    }
    if (encoding === 'hex') {
        return fromHex(text);
    }

    return fromBase64(text);
};

export const encode: typeof Encode['encode'] = (
    input,
    encoding = defaultEncoding
) => {

    const buffer = decode(input);

    if (encoding === 'utf8') {
        return decoder.decode(buffer);
    }
    if (encoding === 'hex') {
        return toHex(buffer);
    }

    const url = toBase64(buffer);
    if (encoding === 'base64') {
        return base64standard(url);
    }

    return url;
};
