import { type events, StaticEmitter } from '../../static-emitter.js';

export const eventSymbol = Symbol('eventSymbol');

/**
 * @override
 */
export class CustomEmitter extends StaticEmitter {

    declare public [events]: {
        foo: [boolean, number[]];
        bar: [string];
        [eventSymbol]: { data: number }[] | [Set<number>];
    };
}
