import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import { CustomEvent } from '../../custom-event.js';
import { events } from '../../events.js';
import { TypedEventTarget } from '../../typed-event-target.js';
import { ExtendTarget } from '../data/extend-event-target.js';
import { ServerEvent } from '../data/server-event.js';

export const TypedEventTargetSpec = {

    success: {

        'Unchanged EventTarget'() {
            expect(TypedEventTarget).to.eq(TypedEventTarget);
        },

        'Declare event types': {

            'Generic parameter'() {

                const extendTarget = new ExtendTarget();
                extendTarget.addEventListener('foo', event => {
                    expectTypeOf(event).toEqualTypeOf<CustomEvent<'foo', 123>>();
                });
                extendTarget.addEventListener('foo', {
                    handleEvent: event => {
                        expectTypeOf(event).toEqualTypeOf<CustomEvent<'foo', 123>>();
                    },
                });
                extendTarget.addEventListener('bar', event => {
                    expectTypeOf(event).toEqualTypeOf<ServerEvent<'bar'>>();
                });

                extendTarget.dispatchEvent(new CustomEvent('foo', { detail: 123 }));
                extendTarget.dispatchEvent(new ServerEvent('bar', '<server-data>'));
                // @ts-expect-error
                extendTarget.dispatchEvent(new CustomEvent('foo', { detail: 456 }));

                // eslint-disable-next-line unicorn/no-invalid-remove-event-listener
                extendTarget.removeEventListener('foo', event => {
                    expectTypeOf(event).toEqualTypeOf<CustomEvent<'foo', 123>>();
                });
                extendTarget.removeEventListener('bar', {
                    handleEvent: event => {
                        expectTypeOf(event).toEqualTypeOf<ServerEvent<'bar'>>();
                    },
                });
            },

            'Explicit event declaration'() {

                /**
                 * @override
                 */
                class ExtendTargetDeclare extends TypedEventTarget {
                    declare public [events]: {
                        foo: 123;
                        bar: ServerEvent<'bar'>;
                    };
                }

                expectTypeOf(ExtendTargetDeclare).toEqualTypeOf(ExtendTarget);
            },

            'Both generics and event param'() {

                /**
                 * @override
                 */
                class ExtendTargetCombo extends TypedEventTarget<{
                    foo: 123;
                }> {
                    declare public [events]: TypedEventTarget<{
                        foo: 123;
                    }>[typeof events] & {
                        bar: ServerEvent<'bar'>;
                    };
                }

                expectTypeOf(ExtendTargetCombo).toEqualTypeOf(ExtendTarget);
            },
        },
    },
};
