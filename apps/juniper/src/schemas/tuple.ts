import type { AbstractSchema, ConditionalResult, SchemaGenerics } from '../lib/schema.js';
import type { ConditionalNullable, IsNever, Schema, SchemaType, ToBaseType } from '../lib/types.js';
import {
    type ArrayParams,
    ArraySchema,
    type ArrayType,
    prefixItemsSym,
} from './array.js';

interface TupleParams<
    T,
    P extends any[],
    C extends P[number],
    M,
    N extends boolean
> extends Omit<ArrayParams<T, P, C, M, N>, 'items' | 'maxItems' | 'minItems'> {}

/**
 * Schema for defining strict `Tuple` types.
 *
 * "Strict" is [defined by AJV](https://ajv.js.org/options.html#stricttuples)
 * and refers to a Tuple with no extra items and a fixed length.
 *
 * Convenience wrapper around ArraySchema.
 *
 * __Tuples are not supported in OpenAPI 3.0__
 *
 * If generating a schema for OpenApi 3.0, the result will just be an array
 * where any item can be in any location.
 */
export class TupleSchema<
    T = never,
    P extends any[] = [],
    // Contains
    C extends P[number] = never,
    // Merged
    M = unknown,
    // Nullable
    N extends boolean = false
> extends ArraySchema<T, P, C, M, N> {

    /**
     * Always `false`
     */
    declare public items: never;

    /**
     * Controlled by `prefixItems` size.
     */
    declare public maxItems: never;
    declare public minItems: never;

    declare public allOf: <
        S extends TupleSchema<any, any[], any, unknown, boolean>
    >(schema: S) => TupleSchema<
        T, P, C,
        M & NonNullable<SchemaType<S>>,
        null extends SchemaType<S> ? N : boolean
    >;

    declare public anyOf: <
        S extends TupleSchema<any, any[], any, unknown, boolean>
    >(schemas: S[]) => TupleSchema<
        T, P, C,
        M & NonNullable<SchemaType<S>>,
        null extends SchemaType<S> ? N : boolean
    >;

    declare public if: <
        IfT,
        IfP extends any[],
        IfC extends IfP[number] | IfT,
        IfM,
        IfN extends boolean,
        Then extends Schema<unknown[] | null> = TupleSchema,
        Else extends Schema<unknown[] | null> = TupleSchema
    >(
        schema: ArraySchema<IfT, IfP, IfC, IfM, IfN>,
        conditionals: ConditionalResult<
            Then,
            Else
        >
    ) => TupleSchema<
        T, P, C,
        M & (
            NonNullable<SchemaType<Else>> |
            (ArrayType<IfT, IfP, IfM, false> & NonNullable<SchemaType<Then>>)
        ),
        ConditionalNullable<
            N,
            IfN,
            null extends SchemaType<Then> ? true : boolean,
            null extends SchemaType<Else> ? true : boolean
        >
    >;

    declare public not: <
        NotN extends boolean
    >(
        schema: ArraySchema<any, any[], any, unknown, NotN>
    ) => NotN extends true ? TupleSchema<T, P, C, unknown, boolean> : this;

    declare public nullable: () => TupleSchema<T, P, C, M, boolean extends N ? boolean : true>;

    declare public oneOf: <
        S extends TupleSchema<any, any[], any, unknown, boolean>
    >(schemas: S[]) => TupleSchema<
        T, P, C,
        M & NonNullable<SchemaType<S>>,
        null extends SchemaType<S> ? N : boolean
    >;

    /**
     * @override
     */
    declare public contains: <C2 extends ToBaseType<P[number]>>(
        items: AbstractSchema<SchemaGenerics<C2>>,
        invalid: IsNever<C> extends true ? void : never
    ) => TupleSchema<T, P, C2, M, N>;

    /**
     * @override
     */
    declare public prefixItem: <NewP>(
        schema: AbstractSchema<SchemaGenerics<NewP>>
    ) => TupleSchema<T, [...P, NewP], C, M, N>;

    /**
     * @override
     */
    declare public prependPrefixItem: <NewP>(
        schema: AbstractSchema<SchemaGenerics<NewP>>
    ) => TupleSchema<T, [NewP, ...P], C, M, N>;

    /**
     * @override
     */
    public constructor(
        options: TupleParams<T, P, C, M, N> = {}
    ) {
        const prefixItemsSize = options[prefixItemsSym]?.length ?? 0;
        super({
            ...options,
            items: ArraySchema.falseItems,
            maxItems: prefixItemsSize,
            minItems: prefixItemsSize,
        });
    }

    /**
     * Create a new instance of TupleSchema.
     *
     * @param {void} [this] - this
     * @param {object} [options] - options or schema
     * @param {boolean} [options.uniqueItems] - each item is unique
     * @param {number} [options.minContains] - minimum instances of contained schema (inclusive)
     * @param {number} [options.maxContains] - maximum instances of contained schema (inclusive)
     * @param {string} [options.title] - Add title to schema
     * @param {string} [options.description] - Add description to schema
     * @param {boolean} [options.deprecated] - flag schema as deprecated
     * @param {boolean} [options.readOnly] - value should not be modified
     * @param {boolean} [options.writeOnly] - value should be hidden
     * @returns {TupleSchema} tuple schema
     */
    public static override create(
        this: void,
        options?: TupleParams<never, [], never, unknown, false>
    ): TupleSchema {
        return new TupleSchema(options);
    }
}
