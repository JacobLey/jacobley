import { createHash } from 'node:crypto';
import { encode } from '#encode';
import { defaultHash, type HashAlgorithm, type Methods } from '../lib/types.js';

const hashAlgorithm = ({
    algorithm,
    size,
}: HashAlgorithm): string => {
    if (algorithm === 'SHA1') {
        return 'SHA1';
    }
    return `sha${size}`;
};

export const hash: Methods['hash'] = async (
    input,
    algorithm = defaultHash
) => {

    const encoded = encode(input);

    if (algorithm === 'raw') {
        return encoded;
    }

    return createHash(hashAlgorithm(algorithm))
        .update(encoded)
        .digest();
};
