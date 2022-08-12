import crypto from '#crypto';
import { encode } from '#encode';
import { defaultHash, type HashAlgorithm, type Methods } from '../lib/types.js';

const hashAlgorithm = ({
    algorithm,
    size,
}: HashAlgorithm): string => {
    if (algorithm === 'SHA1') {
        return 'SHA-1';
    }
    return `SHA-${size}`;
};

export const hash: Methods['hash'] = async (
    secret,
    algorithm = defaultHash
) => {

    const encoded = encode(secret);

    if (algorithm === 'raw') {
        return encoded;
    }

    const buffer = await crypto.subtle.digest(
        hashAlgorithm(algorithm),
        encoded
    );
    return new Uint8Array(buffer);
};
