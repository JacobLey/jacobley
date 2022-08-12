import * as SyncEncrypt from '#sync-encrypt';
import { syncEncrypt } from './iso/sync-encrypt/encrypt.js';

export const {
    encrypt,
    decrypt,
} = syncEncrypt(SyncEncrypt);
