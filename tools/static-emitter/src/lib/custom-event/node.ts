import { TypedEvent } from '#typed-event';

/**
 * Node does not currently support native `CustomEvent` so this is a strongly typed polyfill.
 *
 * In future if NodeJS supports, this can be replaced by native implementation.
 */
export default class CustomEvent<E extends string, T = null> extends TypedEvent<E> {
    readonly #detail: T;

    /**
     * @deprecated
     *
     * DOES NOT EXIST IN THIS CUSTOM IMPLEMENTATION.
     *
     * Declared only for purpose of conforming to existing CustomEvent interface.
     */
    declare public initCustomEvent: (
        type: string,
        bubbles?: boolean,
        cancelable?: boolean,
        detail?: unknown
    ) => void;

    /**
     * Create custom event.
     *
     * @param {string} type - event name
     * @param {object} options - event options, required with `detail` for any type other than `null`
     */
    public constructor(
        type: E,
        ...options: T extends null ? [
            CustomEventInit<T>,
        ] | [] : [CustomEventInit<T> & { detail: T }]
    ) {
        const [option] = options;
        super(type, option);
        this.#detail = (option?.detail ?? null) as T;
    }

    /**
     * Get "data" from event.
     *
     * @returns {*} detail
     */
    public get detail(): T {
        return this.#detail;
    }
}
