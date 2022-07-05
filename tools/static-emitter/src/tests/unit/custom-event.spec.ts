import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import { CustomEvent as TypedCustomEvent } from '../../custom-event.js';

export const CustomEventSpec = {

    success: {

        'Conforms to native CustomEvent types'() {

            const event: CustomEvent<123> = new TypedCustomEvent('abc', { detail: 123 });

            expectTypeOf(event).toEqualTypeOf<TypedCustomEvent<string, 123>>;
        },

        'Extends Event'() {
            expect(new TypedCustomEvent('abc')).to.be.an.instanceOf(Event);
        },

        'Requires type and detail'() {
            expectTypeOf<TypedCustomEvent<'abc', 123>>(new TypedCustomEvent('abc', { detail: 123 }));
        },

        'Only null detail is optional'() {

            const customEvent = new TypedCustomEvent('abc');
            expectTypeOf(customEvent).toEqualTypeOf<TypedCustomEvent<'abc'>>();
            expectTypeOf(customEvent.detail).toBeNull();

            expectTypeOf<TypedCustomEvent<'abc', 123>>(
                // @ts-expect-error
                new TypedCustomEvent('abc')
            );
        },

        'Detail is readonly'() {

            const customEvent = new TypedCustomEvent('abc', { detail: 123 });

            expect(() => {
                // @ts-expect-error
                customEvent.detail = 123;
            }).to.throw(TypeError);
        },
    },
};
