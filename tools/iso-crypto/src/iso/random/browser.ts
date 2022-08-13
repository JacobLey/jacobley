import crypto from '#crypto';
import type { Methods } from '../lib/types.js';

export const randomBytes: Methods['randomBytes'] = async size => crypto.getRandomValues(new Uint8Array(size));
