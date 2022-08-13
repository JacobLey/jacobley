import crypto from '#crypto';
import { decode } from '#encode';
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

    const decoded = decode(secret);

    if (algorithm === 'raw') {
        return decoded;
    }

    const buffer = await crypto.subtle.digest(
        hashAlgorithm(algorithm),
        decoded
    );
    return new Uint8Array(buffer);
};
