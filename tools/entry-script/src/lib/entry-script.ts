import { defaultImport } from 'default-import';
import { type events, StaticEmitter } from 'static-emitter';

export interface EntryScriptOptions extends NonNullable<ConstructorParameters<typeof StaticEmitter>[0]> {}

export const runtimeError = Symbol('runtimeError');

/**
 * Base class for all entry script executable files.
 * Extend this class and export the result as "default"
 * to run automatically, when that file is NodeJS' entry point.
 *
 * Extends StaticEmitter to emit error events.
 */
export class EntryScript extends StaticEmitter {

    declare public [events]: {
        [runtimeError]: [unknown];
    };

    /**
     * Creates an instance of EntryScript's child class.
     *
     * Extendable to provide any "setup" (loading config, initializing connections).
     *
     * @param {EntryScript} this - child class of EntryScript
     * @returns {EntryScript} Instance of EntryScript.
     */
    public static async create<I extends typeof EntryScript>(this: I): Promise<I['prototype']> {
        return new this();
    }

    /**
     * Method called at the "start" of execution (after setup).
     *
     * Extendable to provide any custom logic.
     */
    public async start(): Promise<void> {}

    /**
     * Method called at the "end" of execution (after start).
     *
     * Will be called even if `start` throws an error.
     *
     * Extendable to provide any custom logic.
     */
    public async finish(): Promise<void> {}
}

/**
 * Method to load entry point module, and execute it if
 * it is a child class of EntryScript.
 *
 * The check happens locally (see call below) but is exported for testing purposes.
 * Should not be called elsewhere.
 *
 * @private
 * @param {string} url - NodeJS process entry point.
 */
export const runAsMain = async (url?: string): Promise<void> => {
    if (url) {
        const rawEntryScript = await import(url).catch(() => {}) as typeof EntryScript;
        const entryScript = defaultImport(rawEntryScript);

        if (Object.prototype.isPrototypeOf.call(EntryScript, entryScript)) {
            const app = await entryScript.create();
            try {
                await app.start();
            } catch (err) {
                app.emit(runtimeError, err);
                throw err;
            } finally {
                await app.finish();
            }
        }
    }
};

void runAsMain(process.argv[1]);
