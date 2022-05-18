import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import { type events, StaticEmitter } from '../../static-emitter.js';
import { CustomEmitter, eventSymbol } from '../data/custom-emitter.js';

export const StaticEmitterSpec = {

    success: {

        'Exports EventEmitter'() {
            expect(StaticEmitter).to.eq(EventEmitter);
        },

        'Extend existing'() {

            /**
             * @override
             */
            class ExtendEmitter extends CustomEmitter {
                declare public [events]: CustomEmitter[typeof events] & {
                    bing: [null];
                };
            }

            const extendEmitter = new ExtendEmitter();
            extendEmitter.on('foo', (bool, nums) => {
                expectTypeOf(bool).toEqualTypeOf<boolean>();
                expectTypeOf(nums).toEqualTypeOf<number[]>();
            });
            extendEmitter.on('bing', nil => {
                expectTypeOf(nil).toBeNull();
            });
        },

        'Add listeners'() {

            const customEmitter = new CustomEmitter();
            customEmitter.on('foo', (bool, nums) => {
                expectTypeOf(bool).toEqualTypeOf<boolean>();
                expectTypeOf(nums).toEqualTypeOf<number[]>();
            });
            customEmitter.addListener('bar', str => {
                expectTypeOf(str).toEqualTypeOf<string>();
            });
            customEmitter.prependListener(eventSymbol, (...data) => {
                expectTypeOf(data).toEqualTypeOf<{
                    data: number;
                }[] | [Set<number>]>();
            });

            customEmitter.once('foo', (bool, nums) => {
                expectTypeOf(bool).toEqualTypeOf<boolean>();
                expectTypeOf(nums).toEqualTypeOf<number[]>();
            });
            customEmitter.prependOnceListener('bar', str => {
                expectTypeOf(str).toEqualTypeOf<string>();
            });
        },

        'Emit events'() {

            const customEmitter = new CustomEmitter();
            customEmitter.emit('foo', true, [123]);
        },

        'Remove listeners'() {

            const customEmitter = new CustomEmitter();

            customEmitter.removeListener('foo', (bool, nums) => {
                expectTypeOf(bool).toEqualTypeOf<boolean>();
                expectTypeOf(nums).toEqualTypeOf<number[]>();
            });
            customEmitter.removeAllListeners('bar');
            customEmitter.removeAllListeners();
        },

        'List listeners'() {

            const customEmitter = new CustomEmitter();

            expectTypeOf(
                customEmitter.listeners('foo')
            ).toEqualTypeOf<
                ((bool: boolean, nums: number[]) => void)[]
            >();

            expectTypeOf(
                customEmitter.rawListeners('bar')
            ).toEqualTypeOf<
                ({ listener?: (str: string) => void } & ((str: string) => void))[]
            >();

            expectTypeOf(
                customEmitter.listenerCount(eventSymbol)
            ).toEqualTypeOf<number>();

            expectTypeOf(
                customEmitter.eventNames()
            ).toEqualTypeOf<
                ('bar' | 'foo' | typeof eventSymbol)[]
            >();
        },
    },

    failure: {

        'Improper event declarations'() {

            /**
             * @override
             */
            class BadEmitter extends StaticEmitter {
                // @ts-expect-error
                declare public [events]: {
                    foo: 123;
                };
            }
            const badEmitter = new BadEmitter();
            // @ts-expect-error
            badEmitter.on('foo', data => {
                expectTypeOf(data).toBeUnknown();
            });
        },

        'Improper extension'() {

            /**
             * @override
             */
            class BadExtend extends CustomEmitter {
                // @ts-expect-error
                declare public [events]: {
                    bing: [null];
                };
            }
            const badExtend = new BadExtend();
            // @ts-expect-error
            badExtend.on('foo', data => {
                expectTypeOf(data).toBeNull();
            });
        },

        'Invalid listeners'() {
            const customEmitter = new CustomEmitter();
            const invalidListener = (event: { myData: number }): void => {
                // Noop
                expectTypeOf(event);
            };

            customEmitter.on(
                'foo',
                // @ts-expect-error
                invalidListener
            );
            customEmitter.addListener(
                'bar',
                // @ts-expect-error
                invalidListener
            );
            customEmitter.prependListener(
                eventSymbol,
                // @ts-expect-error
                invalidListener
            );

            customEmitter.once(
                'foo',
                // @ts-expect-error
                invalidListener
            );
            customEmitter.prependOnceListener(
                'bar',
                // @ts-expect-error
                invalidListener
            );
        },

        'Invalid events'() {
            const customEmitter = new CustomEmitter();

            // @ts-expect-error
            customEmitter.emit('foo', true);
        },

        'Invalid removal'() {

            const customEmitter = new CustomEmitter();
            const invalidListener = (event: { myData: number }): void => {
                // Noop
                expectTypeOf(event);
            };

            customEmitter.removeListener(
                'foo',
                // @ts-expect-error
                invalidListener
            );
            customEmitter.removeAllListeners(
                // @ts-expect-error
                Symbol('invalid')
            );
        },

        'Invalid lists'() {

            const customEmitter = new CustomEmitter();

            customEmitter.listeners(
                // @ts-expect-error
                'invalid'
            );
            customEmitter.rawListeners(
                // @ts-expect-error
                Symbol('invalid')
            );

            customEmitter.listenerCount(
                // @ts-expect-error
                'foobar'
            );
        },
    },
};
