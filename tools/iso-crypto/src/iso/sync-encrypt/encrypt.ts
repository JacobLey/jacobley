import { encode } from '#encode';
import { hash } from '#hash';
import type * as SyncEncrypt from '#sync-encrypt';
import { defaultEncryption, type Encryption, type Hash, type InputText } from '../lib/types.js';

interface Encrypt {
    encrypt: (
        params: {
            data: InputText;
            secret: InputText;
        },
        options?: {
            encryption?: Encryption | undefined;
            hash?: Hash | undefined;
        }
    ) => Promise<{
        encrypted: Uint8Array;
        iv: Uint8Array;
    }>;
    decrypt: (
        params: {
            encrypted: InputText;
            iv: InputText;
            secret: InputText;
        },
        options?: {
            encryption?: Encryption | undefined;
            hash?: Hash | undefined;
        }
    ) => Promise<Uint8Array>;
}

/**
 * Dependency injection of actual module to allow isomorphic testing.
 *
 * Browser version works in node, just generally more complicated and less performant.
 *
 * @param {object} mod - #sync-encrypt module
 * @returns {object} encrypt + decrypt methods using correct module for environment
 */
export const syncEncrypt = (mod: typeof SyncEncrypt): Encrypt => ({
    encrypt: async (
        {
            data,
            secret,
        },
        options = {}
    ) => mod.hashedEncrypt(
        encode(data),
        hash(secret, options.hash),
        options.encryption ?? defaultEncryption
    ),
    decrypt: async (
        {
            encrypted,
            iv,
            secret,
        },
        options = {}
    ) => mod.hashedDecrypt(
        encode(encrypted),
        encode(iv),
        await hash(secret, options.hash),
        options.encryption ?? defaultEncryption
    ),
});
