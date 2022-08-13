import { inputToEncoding } from '../lib/input-to-encoding.js';
import { defaultEncoding, type Methods } from '../lib/types.js';

export const decode: Methods['decode'] = input => {
    const { encoding, text } = inputToEncoding(input);
    if (encoding === 'raw') {
        return text;
    }
    const normalized = encoding === 'hex' && text.length % 2 ? `0${text}` : text;
    return Buffer.from(normalized, encoding);
};

export const encode: Methods['encode'] = (
    buffer,
    encoding = defaultEncoding
) => Buffer.from(decode(buffer)).toString(encoding);
