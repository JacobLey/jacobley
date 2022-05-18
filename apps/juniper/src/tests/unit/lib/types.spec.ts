import { expectTypeOf } from 'expect-type';
import {
    type JsonSchema,
    numberSchema,
    type Schema,
    type SchemaType,
} from '../../../index.js';
import type { ConditionalNullable, ToBaseType } from '../../../lib/types.js';

// These tests will only fail at compile time (if at all).
export const TypesSpec = {

    SchemaType() {
        expectTypeOf<SchemaType<Schema<'a' | 1>>>().toEqualTypeOf<'a' | 1>();

        expectTypeOf<SchemaType<JsonSchema<boolean>>>().toEqualTypeOf<boolean>();

        const schema = numberSchema();
        expectTypeOf(schema).toMatchTypeOf<Schema<number>>();
        expectTypeOf(schema.toJSON()).toEqualTypeOf<JsonSchema<number>>();
    },

    ConditionalNullable: {

        'Output is nullable': {

            'If + Then are nullable'() {
                expectTypeOf<ConditionalNullable<true, true, true, true>>().toEqualTypeOf<true>();
                expectTypeOf<ConditionalNullable<true, true, true, false>>().toEqualTypeOf<true>();
                expectTypeOf<ConditionalNullable<true, true, true, boolean>>().toEqualTypeOf<true>();
            },

            'Else is nullable'() {
                expectTypeOf<ConditionalNullable<true, false, false, true>>().toEqualTypeOf<true>();
                expectTypeOf<ConditionalNullable<true, false, boolean, true>>().toEqualTypeOf<true>();
                expectTypeOf<ConditionalNullable<true, boolean, false, true>>().toEqualTypeOf<true>();
                expectTypeOf<ConditionalNullable<true, boolean, boolean, true>>().toEqualTypeOf<true>();
                expectTypeOf<ConditionalNullable<true, false, true, true>>().toEqualTypeOf<true>();
            },
        },

        'Output is not yet nullable': {

            'If + Then are nullable'() {
                expectTypeOf<ConditionalNullable<false, true, true, true>>().toEqualTypeOf<false>();
                expectTypeOf<ConditionalNullable<false, true, true, false>>().toEqualTypeOf<false>();
                expectTypeOf<ConditionalNullable<false, true, true, boolean>>().toEqualTypeOf<false>();
            },

            'Else is nullable'() {
                expectTypeOf<ConditionalNullable<false, false, false, true>>().toEqualTypeOf<false>();
                expectTypeOf<ConditionalNullable<false, false, boolean, true>>().toEqualTypeOf<false>();
                expectTypeOf<ConditionalNullable<false, boolean, false, true>>().toEqualTypeOf<false>();
                expectTypeOf<ConditionalNullable<false, boolean, boolean, true>>().toEqualTypeOf<false>();
                expectTypeOf<ConditionalNullable<false, false, true, true>>().toEqualTypeOf<false>();
            },
        },

        'Output is non-nullable': {

            'Base is nullable': {

                'If + Else is non-nullable'() {
                    expectTypeOf<ConditionalNullable<true, false, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, false, true, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, boolean, true, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, boolean, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, false, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, boolean, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, boolean, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, false, boolean>>().toEqualTypeOf<boolean>();
                },

                'If is nullable + Then is non-nullable'() {
                    expectTypeOf<ConditionalNullable<true, true, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, false, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, boolean, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, false, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<true, true, boolean, boolean>>().toEqualTypeOf<boolean>();
                },
            },

            'Base is not yet nullable': {

                'If + Else is non-nullable'() {
                    expectTypeOf<ConditionalNullable<false, false, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, false, true, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, boolean, true, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, boolean, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, false, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, boolean, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, boolean, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, false, boolean>>().toEqualTypeOf<boolean>();
                },

                'If is nullable + Then is non-nullable'() {
                    expectTypeOf<ConditionalNullable<false, true, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, false, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, boolean, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, false, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<false, true, boolean, boolean>>().toEqualTypeOf<boolean>();
                },
            },

            'Base is never nullable': {

                'If + Then are nullable'() {
                    expectTypeOf<ConditionalNullable<boolean, true, true, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, true, boolean>>().toEqualTypeOf<boolean>();
                },

                'Else is nullable'() {
                    expectTypeOf<ConditionalNullable<boolean, false, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, false, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, boolean, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, boolean, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, false, true, true>>().toEqualTypeOf<boolean>();
                },

                'If + Else is non-nullable'() {
                    expectTypeOf<ConditionalNullable<boolean, false, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, false, true, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, boolean, true, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, boolean, true, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, false, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, boolean, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, boolean, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, false, boolean>>().toEqualTypeOf<boolean>();
                },

                'If is nullable + Then is non-nullable'() {
                    expectTypeOf<ConditionalNullable<boolean, true, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, false, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, boolean, true>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, false, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, boolean, false>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, false, boolean>>().toEqualTypeOf<boolean>();
                    expectTypeOf<ConditionalNullable<boolean, true, boolean, boolean>>().toEqualTypeOf<boolean>();
                },
            },
        },
    },

    ToBaseType: {

        literals() {
            expectTypeOf<ToBaseType<never>>().toEqualTypeOf<never>();
            expectTypeOf<ToBaseType<'a' & 1>>().toEqualTypeOf<never>();
            expectTypeOf<ToBaseType<boolean>>().toEqualTypeOf<boolean>();
            expectTypeOf<ToBaseType<true>>().toEqualTypeOf<boolean>();
            expectTypeOf<ToBaseType<number>>().toEqualTypeOf<number>();
            expectTypeOf<ToBaseType<123>>().toEqualTypeOf<number>();
            expectTypeOf<ToBaseType<string>>().toEqualTypeOf<string>();
            expectTypeOf<ToBaseType<'abc'>>().toEqualTypeOf<string>();
            expectTypeOf<ToBaseType<string[]>>().toEqualTypeOf<string[]>();
            expectTypeOf<ToBaseType<[1, 'a']>>().toEqualTypeOf<(number | string)[]>();
            expectTypeOf<ToBaseType<Record<string, unknown>>>().toEqualTypeOf<Record<string, unknown>>();
            expectTypeOf<ToBaseType<{ foo?: 'bar' }>>().toEqualTypeOf<Record<string, unknown>>();
        },

        unions() {
            expectTypeOf<ToBaseType<'abc' | 123 | true>>().toEqualTypeOf<boolean | number | string>();
            const arr = [12, null, {}] as const;
            expectTypeOf<ToBaseType<typeof arr>>().toEqualTypeOf<(number | Record<string, unknown> | null)[]>();
            expectTypeOf<ToBaseType<[{ a: 1 }, Record<string, never>]>>().toEqualTypeOf<Record<string, unknown>[]>();
        },
    },
};
