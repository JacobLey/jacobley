import { EventEmitter } from 'node:events';

export declare const events: unique symbol;

interface IEmitter {
    [events]: Record<string | symbol, unknown[]>;
}

type EventList<
    Emitter extends IEmitter
> = Exclude<keyof Emitter[typeof events], number>;

type Listener <
    Emitter extends IEmitter,
    EventName extends EventList<Emitter>
> = (...args: Emitter[typeof events][EventName]) => void;

/**
 * Type-only wrapper around EventEmitter to provide static typing to events
 * rather than the dreaded `any[]`.
 *
 * Class is _declared_ so does not actually exist. Raw `EventEmitter` is
 * exported, unchanged but re-typed.
 *
 * Declare events via `events` symbol (also type-only) in format `{ eventName: [args] }`
 *
 * @example
 * import { type events, StaticEmitter } from 'static-emitter';
 *
 * class MyEmitter extends StaticEmitter {
 *     declare public [events]: {
 *         foo: [boolean, number[]];
 *         bar: [string];
 *     }
 * }
 *
 * const myEmitter = new MyEmitter();
 * myEmitter.on('foo', (bool, nums) => {
 *     console.log(bool); // typed as boolean!
 *     console.log(nums); // typed as number!
 * });
 * myEmitter.emit('foo', true, [123]); // success!
 *
 * myEmitter.emit('bar', { wrong: null }); // Typescript error!
 */
export declare class IStaticEmitter extends EventEmitter implements IEmitter {

    /**
     * Child classes _should_ declare types using this property.
     */
    declare public [events]: Record<string | symbol, unknown[]>;

    declare public on: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;
    declare public addListener: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;
    declare public prependListener: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;
    declare public once: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;
    declare public prependOnceListener: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;

    declare public removeListener: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;
    declare public off: <K extends EventList<this>>(
        eventName: K,
        listener: Listener<this, K>
    ) => this;

    declare public removeAllListeners: (event?: EventList<this>) => this;

    declare public listeners: <K extends EventList<this>>(
        event: K
    ) => Listener<this, K>[];

    declare public rawListeners: <
        K extends EventList<this>,
        L extends Listener<this, K> = Listener<this, K>
    >(
        event: K
    ) => (L & { listener?: L })[];

    declare public emit: <K extends EventList<this>>(
        event: K,
        ...args: this[typeof events][K]
    ) => boolean;

    declare public listenerCount: (
        event: EventList<this>
    ) => number;

    declare public eventNames: () => EventList<this>[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const StaticEmitter = EventEmitter as typeof IStaticEmitter;
