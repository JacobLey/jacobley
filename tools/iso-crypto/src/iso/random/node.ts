import { randomBytes as randomBytesCb } from 'node:crypto';
import { promisify } from 'node:util';
import type { Methods } from '../lib/types.js';

/**
 * Generate a random array of bytes with provided length.
 *
 * Wrapper around `crypto.randomBytes` on NodeJS, and `crypto.getRandomValues` on Browser.
 *
 * Returns Promise of Uint8Array for consistency (Browser does not have `Buffer` and NodeJS requires async).
 *
 * @param {number} size - number of bytes to generate
 * @returns {Promise<Uint8Array>} random bytes
 */
export const randomBytes: Methods['randomBytes'] = promisify(randomBytesCb);
