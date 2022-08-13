import * as SymEncrypt from '#sym-encrypt';
import { symEncrypt } from './iso/sym-encrypt/encrypt.js';

export type { Encryption } from './iso/lib/types.js';

export const {
    encrypt,
    decrypt,
} = symEncrypt(SymEncrypt);
