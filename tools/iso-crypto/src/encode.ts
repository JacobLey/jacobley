import { decode, encode } from '#encode';
import { defaultEncoding, type Encoding } from './iso/lib/types.js';

export { decode, encode, type Encoding };

type Replace<From, To, T extends Record<string, From>> = {
    [k in keyof T]: To;
};
type Encoded<T extends Record<string, string>> = Replace<string, Uint8Array, T>;
type Decoded<T extends Record<string, Uint8Array>> = Replace<Uint8Array, string, T>;

export const encodeObject = <T extends Record<string, string>>(
    obj: T,
    encoding: Encoding = defaultEncoding
): Encoded<T> => {

    const result: Partial<Encoded<T>> = {};
    for (const [key, text] of Object.entries(obj)) {
        result[key as keyof T] = encode({ text, encoding });
    }
    return result as Encoded<T>;
};

export const decodeObject = <T extends Record<string, Uint8Array>>(
    obj: T,
    encoding?: Encoding
): Decoded<T> => {

    const result: Partial<Decoded<T>> = {};
    for (const [key, arr] of Object.entries(obj)) {
        result[key as keyof T] = decode(arr, encoding);
    }
    return result as Decoded<T>;
};
