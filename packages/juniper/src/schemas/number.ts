import {
    AbstractSchema,
    type ConditionalResult,
    type SchemaGenerics,
    type SchemaParams,
    type SerializationParams,
} from '../lib/schema.js';
import type { AbstractClean, ConditionalNullable, JsonSchema, Nullable, SchemaType } from '../lib/types.js';
import { mergeAllOf } from '../lib/utils.js';

interface LimitWithExclusive {
    value: number;
    exclusive: boolean;
}

interface NumberParams<
    T extends number,
    N extends boolean
> extends SchemaParams<Nullable<T, N>> {
    type?: 'integer' | 'number';
    multipleOf?: number | number[];
    maximum?: number | LimitWithExclusive;
    minimum?: number | LimitWithExclusive;
}
interface NumberGenerics<
    T extends number,
    N extends boolean
> extends SchemaGenerics<Nullable<T, N>> {
    params: NumberParams<T, N>;
}

type StripNumber<T extends number> = AbstractClean<number, T>;

/**
 * Greatest Common Denominator.
 *
 * @example
 * gcd(20, 35) === 5
 *
 * @param {number} x - first value
 * @param {number} y - second value
 * @returns {number} Greatest Common Denominator of x and y
 */
const gcd = (x: number, y: number): number => {
    let a = x;
    let b = y;
    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
};
/**
 * Least Common Multiple.
 *
 * @example
 * lcm(6, 8) === 24
 *
 * @param {number} x - first value
 * @param {number} y - second value
 * @returns {number} Least Common Multiple of x and y
 */
const lcm = (x: number, y: number): number => (x * y) / gcd(x, y);

const numToExclusive = (
    value: number | LimitWithExclusive
): LimitWithExclusive => (typeof value === 'number' ? { value, exclusive: false } : value);

/**
 * Schema for defining numeric types.
 *
 * Defaults to `type=number` (any valid number) but can be overwritten to `type=integer` (no fraction).
 *
 * Some `pattern` assertions are built in to help typescript, but most
 * likely end typescript result will just be `string`.
 *
 * Supports multiple `multipleOf`s.
 */
export class NumberSchema<
    T extends number,
    // Nullable
    N extends boolean = false
> extends AbstractSchema<NumberGenerics<T, N>> {

    declare protected readonly schemaType;

    readonly #maximum: LimitWithExclusive;
    readonly #minimum: LimitWithExclusive;
    readonly #multipleOfs: number[];

    declare public allOf: <
        S extends NumberSchema<number, boolean>
    >(schema: S) => NumberSchema<
        NonNullable<SchemaType<S>> & T,
        null extends SchemaType<S> ? N : boolean
    >;

    declare public anyOf: <
        S extends NumberSchema<number, boolean>
    >(schemas: S[]) => NumberSchema<
        NonNullable<SchemaType<S>> & T,
        null extends SchemaType<S> ? N : boolean
    >;

    declare public if: <
        IfT extends number,
        IfN extends boolean,
        ThenT extends number,
        ElseT extends number,
        ThenN extends boolean = true,
        ElseN extends boolean = true
    >(
        schema: NumberSchema<IfT, IfN>,
        conditionals: ConditionalResult<
            NumberSchema<ThenT, ThenN>,
            NumberSchema<ElseT, ElseN>
        >
    ) => NumberSchema<
        StripNumber<T & (ElseT | IfT & ThenT)>,
        ConditionalNullable<N, IfN, ThenN, ElseN>
    >;

    declare public not: <
        NotN extends boolean
    >(schema: NumberSchema<number, NotN>) => NotN extends true ? NumberSchema<T, boolean> : this;

    declare public nullable: () => NumberSchema<T, boolean extends N ? boolean : true>;

    declare public oneOf: <
        S extends NumberSchema<number, boolean>
    >(schemas: S[]) => NumberSchema<
        NonNullable<SchemaType<S>> & T,
        null extends SchemaType<S> ? N : boolean
    >;

    /**
     * @override
     */
    public constructor(options: NumberParams<T, N> = {}) {
        super(options);
        this.schemaType = options.type ?? 'number';
        this.#maximum = numToExclusive(options.maximum ?? Number.POSITIVE_INFINITY);
        this.#minimum = numToExclusive(options.minimum ?? Number.NEGATIVE_INFINITY);
        this.#multipleOfs = [options.multipleOf ?? []].flat();
    }

    /**
     * Create a new instance of NumberSchema.
     *
     * @param {void} [this] - this
     * @param {object} [options] - options
     * @param {number|object} [options.minimum] - minimum value of number, defaults to inclusive.
     * @param {number|object} [options.maximum] - maximum value of number, defaults to inclusive.
     * @param {number|number[]} [options.multipleOf] - factors of number.
     * @param {string} [options.title] - Add title to schema
     * @param {string} [options.description] - Add description to schema
     * @param {boolean} [options.deprecated] - flag schema as deprecated
     * @param {boolean} [options.readOnly] - value should not be modified
     * @param {boolean} [options.writeOnly] - value should be hidden
     * @returns {NumberSchema} number schema
     */
    public static override create<T2 extends number>(this: void, options?: NumberParams<T2, false>): NumberSchema<T2> {
        return new NumberSchema(options);
    }

    /**
     * Set the `type` of the number.
     *
     * Does not alter typings.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.1.1}
     *
     * @param {string} type - `integer` or `number`
     * @returns {StringSchema} schema
     */
    public type(type: 'integer' | 'number'): this {
        return this.clone({ type });
    }

    /**
     * Set the `multipleOf` of the number.
     *
     * Does not alter typings.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.2.1}
     *
     * @param {number} multipleOf - multiple of
     * @returns {StringSchema} schema
     */
    public multipleOf(multipleOf: number): this {
        return this.clone({
            multipleOf: [...this.#multipleOfs, multipleOf],
        });
    }

    /**
     * Set the `maximum` of the number.
     * Optionally provide `exclusive` (default=false).
     * Set to `Infinity` to effectively clear restriction.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.2.2}
     *
     * @param {number} maximum - maximum
     * @returns {StringSchema} schema
     */
    public maximum(maximum: number | LimitWithExclusive): this {
        return this.clone({
            maximum: numToExclusive(maximum),
        });
    }

    /**
     * Set the `exclusiveMaximum` of the number.
     * Convenience method around `maximum` with `exclusive=true`.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.2.3}
     *
     * @param {number} exclusiveMaximum - exclusive maximum
     * @returns {StringSchema} schema
     */
    public exclusiveMaximum(exclusiveMaximum: number): this {
        return this.maximum({ value: exclusiveMaximum, exclusive: true });
    }

    /**
     * Set the `minimum` of the number.
     * Optionally provide `exclusive` (default=false).
     * Set to `-Infinity` to effectively clear restriction.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.2.4}
     *
     * @param {number} minimum - minimum
     * @returns {StringSchema} schema
     */
    public minimum(minimum: number | LimitWithExclusive): this {
        return this.clone({
            minimum: numToExclusive(minimum),
        });
    }

    /**
     * Set the `exclusiveMinimum` of the number.
     * Convenience method around `minimum` with `exclusive=true`.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.2.5}
     *
     * @param {number} exclusiveMinimum - exclusive minimum
     * @returns {StringSchema} schema
     */
    public exclusiveMinimum(exclusiveMinimum: number): this {
        return this.minimum({ value: exclusiveMinimum, exclusive: true });
    }

    /**
     * @override
     */
    protected override getCloneParams(): Required<NumberParams<T, N>> {
        return {
            ...super.getCloneParams(),
            maximum: this.#maximum,
            minimum: this.#minimum,
            multipleOf: [...this.#multipleOfs],
            type: this.schemaType,
        };
    }

    /**
     * @override
     */
    protected static override getDefaultValues(params: SerializationParams): Record<string, unknown> {
        const superParams = super.getDefaultValues(params);
        if (params.openApi30) {
            return {
                ...superParams,
                minimum: -Number.MAX_VALUE,
                exclusiveMinimum: false,
                maximum: Number.MAX_VALUE,
                exclusiveMaximum: false,
            };
        }
        return {
            ...superParams,
            minimum: -Number.MAX_VALUE,
            exclusiveMinimum: -Number.MAX_VALUE,
            maximum: Number.MAX_VALUE,
            exclusiveMaximum: Number.MAX_VALUE,
        };
    }

    /**
     * @override
     */
    protected override toSchema(params: SerializationParams): JsonSchema<SchemaType<this>> {
        const base = super.toSchema(params);

        if (this.#minimum.value > Number.NEGATIVE_INFINITY) {
            if (this.#minimum.exclusive) {
                if (params.openApi30) {
                    base.minimum = this.#minimum.value;
                    base.exclusiveMinimum = true;
                } else {
                    base.exclusiveMinimum = this.#minimum.value;
                }
            } else {
                base.minimum = this.#minimum.value;
            }
        }

        if (this.#maximum.value < Number.POSITIVE_INFINITY) {
            if (this.#maximum.exclusive) {
                if (params.openApi30) {
                    base.maximum = this.#maximum.value;
                    base.exclusiveMaximum = true;
                } else {
                    base.exclusiveMaximum = this.#maximum.value;
                }
            } else {
                base.maximum = this.#maximum.value;
            }
        }

        const integerMultiples = this.#multipleOfs.filter(x => Number.isInteger(x));
        const floatMultiples = this.#multipleOfs.filter(x => !Number.isInteger(x));

        if (integerMultiples.length > 0) {
            // eslint-disable-next-line unicorn/no-array-reduce
            base.multipleOf = integerMultiples.reduce((acc, val) => lcm(acc, val));
            mergeAllOf(base, floatMultiples.map(multipleOf => ({ multipleOf })));
        } else if (floatMultiples.length > 0) {
            base.multipleOf = floatMultiples[0];
            mergeAllOf(base, floatMultiples.slice(1).map(multipleOf => ({ multipleOf })));
        }

        return base;
    }
}
