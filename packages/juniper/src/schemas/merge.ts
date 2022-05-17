import {
    AbstractSchema,
    type ConditionalResult,
    type SchemaGenerics,
    type SchemaParams,
} from '../lib/schema.js';
import type { Schema, SchemaType } from '../lib/types.js';

/**
 * Schema for defining "merged" `anyOf` + `oneOf` sub-schemas.
 *
 * Useful when defining possibly overlapping schemas (as opposed to `oneOf` for a single type).
 *
 * Current typing is not able to detect duplicate/overlap types. Users must take caution
 * when merging types (e.g. multiple `nullable` schemas effectively makes `null` an invalid type).
 *
 * Similarly typescript types are not mutually exclusive.
 * e.g. `{ foo: 1, bar: 2 }` fulfills type `{ foo: number } | { bar: number }`;
 *
 * This schema without any conditions is effectively an `unknown` schema, allowing everything
 * to validate.
 */
export class MergeSchema<
    T
> extends AbstractSchema<SchemaGenerics<T>> {

    declare public allOf: <
        S extends Schema<unknown>
    >(schema: S) => MergeSchema<SchemaType<S> & T>;

    declare public anyOf: <
        S extends Schema<unknown>
    >(schemas: S[]) => MergeSchema<SchemaType<S> & T>;

    declare public if: <
        If extends AbstractSchema<SchemaGenerics<unknown>>,
        Then extends AbstractSchema<SchemaGenerics<unknown>>,
        Else extends AbstractSchema<SchemaGenerics<unknown>>
    >(
        schema: If,
        conditionals: ConditionalResult<Then, Else>
    ) => MergeSchema<
        T & (SchemaType<Else> | SchemaType<If> & SchemaType<Then>)
    >;

    declare public not: (schemas: Schema<unknown>) => this;

    /**
     * Not applicable.
     */
    declare public nullable: never;

    declare public oneOf: <
        S extends Schema<unknown>
    >(schemas: S[]) => MergeSchema<SchemaType<S> & T>;

    /**
     * Create a new instance of MergeSchema.
     *
     * @param {void} [this] - this
     * @param {object|object[]} [options] - schemas or options object
     * @param {string} [options.title] - Add title to schema
     * @param {string} [options.description] - Add description to schema
     * @param {boolean} [options.deprecated] - flag schema as deprecated
     * @param {boolean} [options.readOnly] - value should not be modified
     * @param {boolean} [options.writeOnly] - value should be hidden
     * @returns {ObjectSchema} object schema
     */
    public static override create(
        this: void,
        options?: SchemaParams<unknown>
    ): MergeSchema<unknown> {
        return new MergeSchema(options);
    }
}
