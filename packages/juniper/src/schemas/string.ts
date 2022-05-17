import escapeStringRegexp from 'escape-string-regexp';
import { maxInt } from '../lib/constants.js';
import {
    AbstractSchema,
    type ConditionalResult,
    type SchemaGenerics,
    type SchemaParams,
    type SerializationParams,
} from '../lib/schema.js';
import type { AbstractClean, ConditionalNullable, JsonSchema, Nullable, SchemaType } from '../lib/types.js';
import { mergeAllOf } from '../lib/utils.js';

interface StringParams<
    T extends string,
    N extends boolean
> extends SchemaParams<Nullable<T, N>> {
    /**
     * Content encoding.
     */
    contentEncoding?: string | null;
    contentMediaType?: string | null;
    format?: string | null;
    maxLength?: number;
    minLength?: number;
    pattern?: string | string[];
}

interface StringGenerics<
    T extends string,
    N extends boolean
> extends SchemaGenerics<Nullable<T, N>> {
    params: StringParams<T, N>;
}

type StripString<T extends string> = AbstractClean<string, T>;

/**
 * Schema for defining `string` types.
 *
 * Some `pattern` assertions are built in to help typescript, but most
 * likely end typescript result will just be `string`.
 *
 * Supports multiple `patterns`.
 */
export class StringSchema<
    T extends string,
    // Nullable
    N extends boolean = false
> extends AbstractSchema<StringGenerics<T, N>> {

    readonly #contentEncoding: string | null;
    readonly #contentMediaType: string | null;
    readonly #format: string | null;
    readonly #maxLength: number;
    readonly #minLength: number;
    readonly #patterns: string[] = [];

    protected override readonly schemaType = 'string';

    declare public allOf: <
        S extends StringSchema<string, boolean>
    >(schema: S) => StringSchema<
        NonNullable<SchemaType<S>> & T,
        null extends SchemaType<S> ? N : boolean
    >;

    declare public anyOf: <
        S extends StringSchema<string, boolean>
    >(schemas: S[]) => StringSchema<
        NonNullable<SchemaType<S>> & T,
        null extends SchemaType<S> ? N : boolean
    >;

    declare public if: <
        IfT extends string,
        IfN extends boolean,
        ThenT extends string,
        ElseT extends string,
        ThenN extends boolean = true,
        ElseN extends boolean = true
    >(
        schema: StringSchema<IfT, IfN>,
        conditionals: ConditionalResult<
            StringSchema<ThenT, ThenN>,
            StringSchema<ElseT, ElseN>
        >
    ) => StringSchema<
        StripString<T & (ElseT | IfT & ThenT)>,
        ConditionalNullable<N, IfN, ThenN, ElseN>
    >;

    declare public not: <
        NotN extends boolean
    >(schema: StringSchema<string, NotN>) => NotN extends true ? StringSchema<T, boolean> : this;

    declare public nullable: () => StringSchema<T, boolean extends N ? boolean : true>;

    declare public oneOf: <
        S extends StringSchema<string, boolean>
    >(schemas: S[]) => StringSchema<
        NonNullable<SchemaType<S>> & T,
        null extends SchemaType<S> ? N : boolean
    >;

    /**
     * @override
     */
    public constructor(options: StringParams<T, N> = {}) {
        super(options);
        this.#contentEncoding = options.contentEncoding ?? null;
        this.#contentMediaType = options.contentMediaType ?? null;
        this.#format = options.format ?? null;
        this.#maxLength = options.maxLength ?? Number.POSITIVE_INFINITY;
        this.#minLength = options.minLength ?? 0;
        this.#patterns = [options.pattern ?? []].flat();
    }

    /**
     * Create a new instance of StringSchema.
     *
     * @param {void} [this] - this
     * @param {object} [options] - options
     * @param {string|null} [options.contentEncoding] - content encoding
     * @param {string|null} [options.contentMediaType] - content media type
     * @param {string|null} [options.format] - format of string
     * @param {number} [options.minLength] - minimum length of string (inclusive)
     * @param {number} [options.maxLength] - maximum length of string (inclusive)
     * @param {string|string[]} [options.pattern] - RegExp patterns to describe string
     * @param {string} [options.title] - Add title to schema
     * @param {string} [options.description] - Add description to schema
     * @param {boolean} [options.deprecated] - flag schema as deprecated
     * @param {boolean} [options.readOnly] - value should not be modified
     * @param {boolean} [options.writeOnly] - value should be hidden
     * @returns {StringSchema} string schema
     */
    public static override create<T2 extends string>(this: void, options?: StringParams<T2, false>): StringSchema<T2> {
        return new StringSchema(options);
    }

    /**
     * Set the `format` of the string.
     * Set to `null` to effectively clear restriction.
     *
     * Usage and restrictions of `format` are implementation-specific. No enforcement is guaranteed
     * by default in JSON Schema.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.7}
     *
     * @param {string|null} format - format
     * @returns {StringSchema} schema
     */
    public format(format: string | null): this {
        return this.clone({ format });
    }

    /**
     * Set the `maxLength` of the string.
     * Set to `Infinity` to effectively clear restriction.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.3.1}
     *
     * @param {number} maxLength - max length
     * @returns {StringSchema} schema
     */
    public maxLength(maxLength: number): this {
        return this.clone({ maxLength });
    }

    /**
     * Set the `minLength` of the string.
     * Set to `0` to effectively clear restriction.
     *
     * Does not alter typings.
     * Overwrites existing restriction.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.3.2}
     *
     * @param {number} minLength - min length
     * @returns {StringSchema} schema
     */
    public minLength(minLength: number): this {
        return this.clone({ minLength });
    }

    /**
     * Add a `pattern` to the string.
     *
     * Optionally alters typings, which restrict outputted string type.
     * Use with caution, as there is no validation that pattern actually asserts type.
     *
     * @see {@link https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.6.3.3}
     *
     * @param {string} pattern - regular expression pattern
     * @returns {StringSchema} schema
     */
    public pattern<Constraint extends string>(pattern: string): StringSchema<StripString<Constraint & T>, N> {
        return this.clone({
            pattern: [...this.#patterns, pattern],
        }) as unknown as StringSchema<StripString<Constraint & T>, N>;
    }

    /**
     * Add a special case `pattern` that enforces a string occurs as the start.
     *
     * @param {string} start - string literal
     * @returns {StringSchema} schema
     */
    public startsWith<Start extends string>(start: Start): StringSchema<StripString<`${Start}${string}` & T>, N> {
        return this.pattern<`${Start}${string}`>(`^${escapeStringRegexp(start)}`);
    }

    /**
     * Add a special case `pattern` that enforces a string occurs as the end.
     *
     * @param {string} end - string literal
     * @returns {StringSchema} schema
     */
    public endsWith<End extends string>(end: End): StringSchema<StripString<`${string}${End}` & T>, N> {
        return this.pattern<`${string}${End}`>(`${escapeStringRegexp(end)}$`);
    }

    /**
     * Add a special case `pattern` that enforces a string occurs somewhere in the string.
     *
     * @param {string} contain - string literal
     * @returns {StringSchema} schema
     */
    public contains<
        Contain extends string
    >(contain: Contain): StringSchema<StripString<`${string}${Contain}${string}` & T>, N> {
        return this.pattern<`${string}${Contain}${string}`>(escapeStringRegexp(contain));
    }

    /**
     * Set `contentEncoding` of string.
     * Set to `null` to remove.
     *
     * Does not alter typings.
     * Overwrites existing encoding.
     *
     * @see {@link https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentencoding}
     *
     * @param {string|null} contentEncoding - content encoding
     * @returns {StringSchema} string schema
     */
    public contentEncoding(contentEncoding: string | null): this {
        return this.clone({
            contentEncoding,
        });
    }

    /**
     * Set `contentMediaType` of string.
     * Set to `null` to remove.
     *
     * Does not alter typings.
     * Overwrites existing encoding.
     *
     * @see {@link https://json-schema.org/understanding-json-schema/reference/non_json_data.html#contentmediatype}
     *
     * @param {string|null} contentMediaType - content media type
     * @returns {StringSchema} string schema
     */
    public contentMediaType(contentMediaType: string | null): this {
        return this.clone({
            contentMediaType,
        });
    }

    /**
     * @override
     */
    protected override getCloneParams(): Required<StringParams<T, N>> {
        return {
            ...super.getCloneParams(),
            contentEncoding: this.#contentEncoding,
            contentMediaType: this.#contentMediaType,
            format: this.#format,
            maxLength: this.#maxLength,
            minLength: this.#minLength,
            pattern: [...this.#patterns],
        };
    }

    /**
     * @override
     */
    protected static override getDefaultValues(params: SerializationParams): Record<string, unknown> {
        return {
            ...super.getDefaultValues(params),
            contentEncoding: null,
            contentMediaType: null,
            format: null,
            maxLength: maxInt,
            minLength: 0,
        };
    }

    /**
     * @override
     */
    protected override toSchema(params: SerializationParams): JsonSchema<SchemaType<this>> {
        const base = super.toSchema(params);

        if (this.#format) {
            base.format = this.#format;
        }
        if (this.#minLength > 0) {
            base.minLength = this.#minLength;
        }
        if (this.#maxLength < Number.POSITIVE_INFINITY) {
            base.maxLength = this.#maxLength;
        }
        if (this.#contentEncoding) {
            base.contentEncoding = this.#contentEncoding;
        }
        if (this.#contentMediaType) {
            base.contentMediaType = this.#contentMediaType;
        }
        const [pattern, ...patterns] = this.#patterns;
        if (pattern) {
            base.pattern = pattern;
            mergeAllOf(base, patterns.map(p => ({ pattern: p })));
        }

        return base;
    }
}
