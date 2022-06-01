import DefaultAjv from 'ajv/dist/2020.js';
import { expect } from 'chai';
import { defaultImport } from 'default-import';
import { expectTypeOf } from 'expect-type';
import type { Context } from 'mocha';
import { type SchemaType, type StringSchema, stringSchema } from '../../../index.js';

const Ajv = defaultImport(DefaultAjv);

interface StringSchemaTest extends Context {
    schema: StringSchema<string>;
}

export const StringSchemaSpec = {

    keywords: {

        options: {

            success() {

                const schema = stringSchema({
                    minLength: 4,
                    maxLength: 10,
                    pattern: 'un?esca$-ed^',
                    format: 'date-time',
                    contentEncoding: 'base64',
                    contentMediaType: 'image/png',
                }).toJSON();

                expect(schema).to.deep.equal({
                    type: 'string',
                    minLength: 4,
                    maxLength: 10,
                    pattern: 'un?esca$-ed^',
                    format: 'date-time',
                    contentEncoding: 'base64',
                    contentMediaType: 'image/png',
                });
                expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<string>();
            },

            'Multiple patterns'() {
                const schema = stringSchema({
                    pattern: ['a', 'b'],
                }).toJSON();

                expect(schema).to.deep.equal({
                    type: 'string',
                    pattern: 'a',
                    allOf: [{ pattern: 'b' }],
                });
            },
        },

        methods() {
            const schema = stringSchema()
                .minLength(4)
                .maxLength(10)
                .pattern('cd')
                .format('date-time')
                .contentEncoding('base64')
                .contentMediaType('image/png')
                .startsWith('a')
                .endsWith('f')
                .contains('$c')
                .contains('d^')
                .default('ad^$cf')
                .toJSON();

            expect(schema).to.deep.equal({
                type: 'string',
                minLength: 4,
                maxLength: 10,
                pattern: 'cd',
                format: 'date-time',
                contentEncoding: 'base64',
                contentMediaType: 'image/png',
                default: 'ad^$cf',
                allOf: [
                    {
                        pattern: '^a',
                    },
                    {
                        pattern: 'f$',
                    },
                    {
                        pattern: '\\$c',
                    },
                    {
                        pattern: 'd\\^',
                    },
                ],
            });

            const validator = new Ajv({
                formats: {
                    'date-time': true,
                },
            }).compile(schema);
            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<
                `${string}$c${string}` & `${string}d^${string}` & `${string}f` & `a${string}`
            >();
            expect(validator('ab$cd^ef')).to.equal(true);
        },

        'Unset options'() {

            const schema = stringSchema({
                minLength: 4,
                maxLength: 10,
                format: 'date-time',
                contentEncoding: 'base64',
                contentMediaType: 'image/png',
            })
                .minLength(0)
                .maxLength(Number.POSITIVE_INFINITY)
                .format(null)
                .contentEncoding(null)
                .contentMediaType(null)
                .toJSON();

            expect(schema).to.deep.equal({
                type: 'string',
            });
        },
    },

    if: {

        'Then and else': {

            'success'() {

                const schema = stringSchema().pattern('1').pattern('2').if(
                    stringSchema().startsWith('a').nullable(),
                    {
                        then: stringSchema().endsWith('c'),
                        else: stringSchema().contains('b').nullable(),
                    }
                );

                const json = schema.toJSON();

                expect(json).to.deep.equal({
                    type: 'string',
                    pattern: '1',
                    allOf: [
                        {
                            pattern: '2',
                            if: {
                                pattern: '^a',
                            },
                            then: {
                                pattern: 'c$',
                            },
                            else: {
                                pattern: 'b',
                            },
                        },
                    ],
                });

                const validator = new Ajv({ strict: true }).compile(json);
                expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<
                    `${string}b${string}` |
                        (`${string}b${string}` & `${string}c` & `a${string}`) |
                        (`${string}c` & `a${string}`)
                >();
                expect(validator('12b34')).to.equal(true);
                expect(validator('a12c')).to.equal(true);
                expect(validator('a1b2c')).to.equal(true);
                expect(validator('12c')).to.equal(false);
                expect(validator('a12')).to.equal(false);
            },

            'Open API 3.0'() {

                const schema = stringSchema().pattern('1').pattern('2').if(
                    stringSchema().startsWith('a').nullable(),
                    {
                        then: stringSchema().endsWith('c'),
                        else: stringSchema().contains('b').nullable(),
                    }
                );

                const json = schema.toJSON({ openApi30: true });

                expect(json).to.deep.equal({
                    type: 'string',
                    pattern: '1',
                    allOf: [
                        {
                            pattern: '2',
                            anyOf: [
                                {
                                    pattern: '^a',
                                },
                                {
                                    pattern: 'b',
                                },
                            ],
                        },
                    ],
                    anyOf: [
                        {
                            not: {
                                pattern: '^a',
                            },
                        },
                        {
                            pattern: 'c$',
                        },
                    ],
                });

                const validator = new Ajv({ strict: true }).compile(json);
                expect(validator('12b34')).to.equal(true);
                expect(validator('a12c')).to.equal(true);
                expect(validator('a1b2c')).to.equal(true);
                expect(validator('12c')).to.equal(false);
                expect(validator('a12')).to.equal(false);
            },
        },

        'Only then': {

            before(this: StringSchemaTest) {
                const schema = stringSchema().contains('b').if(
                    stringSchema().startsWith('a'),
                    {
                        then: stringSchema().nullable().endsWith('c'),
                    }
                );

                expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<
                    `${string}b${string}` | (`${string}b${string}` & `${string}c` & `a${string}`)
                >();

                this.schema = schema;
            },

            success(this: StringSchemaTest) {

                const json = this.schema.toJSON();

                expect(json).to.deep.equal({
                    type: 'string',
                    pattern: 'b',
                    allOf: [
                        {
                            if: {
                                pattern: '^a',
                            },
                            then: {
                                pattern: 'c$',
                            },
                        },
                    ],
                });

                const validator = new Ajv({ strict: true }).compile(json);
                expect(validator('abc')).to.equal(true);
                expect(validator('b')).to.equal(true);
                expect(validator('ab')).to.equal(false);
            },

            'Open API 3.0'(this: StringSchemaTest) {
                const json = this.schema.toJSON({ openApi30: true });

                expect(json).to.deep.equal({
                    type: 'string',
                    pattern: 'b',
                    anyOf: [
                        {
                            not: {
                                pattern: '^a',
                            },
                        },
                        {
                            pattern: 'c$',
                        },
                    ],
                });

                const validator = new Ajv({ strict: true }).compile(json);
                expect(validator('abc')).to.equal(true);
                expect(validator('b')).to.equal(true);
                expect(validator('ab')).to.equal(false);
            },
        },

        'Only else': {

            before(this: StringSchemaTest) {
                const schema = stringSchema().contains('b').if(
                    stringSchema().startsWith('a'),
                    {
                        else: stringSchema().endsWith('c'),
                    }
                );

                expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<
                    `${string}b${string}` & (`${string}c` | `a${string}`)
                >();

                this.schema = schema;
            },

            success(this: StringSchemaTest) {

                const json = this.schema.toJSON();

                expect(json).to.deep.equal({
                    type: 'string',
                    pattern: 'b',
                    if: {
                        pattern: '^a',
                    },
                    else: {
                        pattern: 'c$',
                    },
                });

                const validator = new Ajv({ strict: true }).compile(json);
                expect(validator('ab')).to.equal(true);
                expect(validator('bc')).to.equal(true);
                expect(validator('abc')).to.equal(true);
                expect(validator('b')).to.equal(false);
            },

            'Open API 3.0'(this: StringSchemaTest) {
                const json = this.schema.toJSON({ openApi30: true });

                expect(json).to.deep.equal({
                    type: 'string',
                    pattern: 'b',
                    anyOf: [
                        {
                            pattern: '^a',
                        },
                        {
                            pattern: 'c$',
                        },
                    ],
                });

                const validator = new Ajv({ strict: true }).compile(json);
                expect(validator('ab')).to.equal(true);
                expect(validator('bc')).to.equal(true);
                expect(validator('abc')).to.equal(true);
                expect(validator('b')).to.equal(false);
            },
        },
    },

    ref: {

        'Applies defaults'() {

            expect(
                stringSchema()
                    .maxLength(10)
                    .minLength(5)
                    .ref('/path/to/ref')
                    .maxLength(Number.POSITIVE_INFINITY)
                    .minLength(0)
                    .toJSON()
            ).to.deep.equal({
                $ref: '/path/to/ref',
                maxLength: 1e308,
                minLength: 0,
            });
        },
    },

    composite: {

        allOf() {

            const schema = stringSchema().contains('a')
                .nullable()
                .allOf(
                    stringSchema().startsWith('b').nullable()
                );

            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<`${string}a${string}` & `b${string}` | null>();

            expect(schema.toJSON()).to.deep.equal({
                type: ['string', 'null'],
                pattern: 'a',
                allOf: [
                    {
                        pattern: '^b',
                    },
                ],
            });

            const notNullableSchema = schema.allOf(
                stringSchema().endsWith('c')
            );

            expectTypeOf<SchemaType<typeof notNullableSchema>>().toEqualTypeOf<
                `${string}a${string}` & `${string}c` & `b${string}`
            >();

            expect(notNullableSchema.toJSON()).to.deep.equal({
                type: 'string',
                pattern: 'a',
                allOf: [
                    {
                        pattern: '^b',
                    },
                    {
                        pattern: 'c$',
                    },
                ],
            });
        },

        anyOf() {

            const schema = stringSchema().contains('a')
                .anyOf([
                    stringSchema().startsWith('b'),
                    stringSchema().nullable().startsWith('c'),
                ])
                .nullable();

            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<
                (`${string}a${string}` & (`b${string}` | `c${string}`)) | null
            >();

            expect(schema.toJSON()).to.deep.equal({
                type: ['string', 'null'],
                pattern: 'a',
                anyOf: [
                    {
                        type: 'string',
                        pattern: '^b',
                    },
                    {
                        pattern: '^c',
                    },
                ],
            });
            expect(schema.toJSON({ openApi30: true })).to.deep.equal({
                type: 'string',
                nullable: true,
                pattern: 'a',
                anyOf: [
                    {
                        type: 'string',
                        pattern: '^b',
                    },
                    {
                        pattern: '^c',
                    },
                ],
            });

            const notNullableSchema = schema.anyOf([stringSchema().endsWith('d')]);
            expectTypeOf<SchemaType<typeof notNullableSchema>>().toEqualTypeOf<
                `${string}a${string}` & `${string}d` & (`b${string}` | `c${string}`)
            >();

            expect(notNullableSchema.toJSON()).to.deep.equal({
                type: 'string',
                pattern: 'a',
                anyOf: [
                    { pattern: '^b' },
                    { pattern: '^c' },
                ],
                allOf: [
                    {
                        anyOf: [{ pattern: 'd$' }],
                    },
                ],
            });

            const neverSchema = notNullableSchema.anyOf([]);

            expectTypeOf<SchemaType<typeof neverSchema>>().toEqualTypeOf<never>();

            expect(neverSchema.toJSON({ openApi30: true })).to.deep.equal({
                type: 'string',
                pattern: 'a',
                anyOf: [
                    { pattern: '^b' },
                    { pattern: '^c' },
                ],
                allOf: [
                    {
                        anyOf: [{ pattern: 'd$' }],
                    },
                    { anyOf: [] },
                ],
            });

            const neverSchema2 = stringSchema().nullable().anyOf([]);
            expectTypeOf<SchemaType<typeof neverSchema2>>().toEqualTypeOf<never>();
        },

        oneOf() {

            const schema = stringSchema().contains('a')
                .oneOf([
                    stringSchema().startsWith('b'),
                    stringSchema().nullable().startsWith('c'),
                ])
                .nullable();

            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<
                (`${string}a${string}` & (`b${string}` | `c${string}`)) | null
            >();

            expect(schema.toJSON()).to.deep.equal({
                type: ['string', 'null'],
                pattern: 'a',
                oneOf: [
                    {
                        type: 'string',
                        pattern: '^b',
                    },
                    {
                        pattern: '^c',
                    },
                ],
            });

            const notNullableSchema = schema.oneOf([stringSchema().endsWith('d')]);
            expectTypeOf<SchemaType<typeof notNullableSchema>>().toEqualTypeOf<
                `${string}a${string}` & `${string}d` & (`b${string}` | `c${string}`)
            >();

            expect(notNullableSchema.toJSON()).to.deep.equal({
                type: 'string',
                pattern: 'a',
                oneOf: [
                    { pattern: '^b' },
                    { pattern: '^c' },
                ],
                allOf: [
                    {
                        oneOf: [{ pattern: 'd$' }],
                    },
                ],
            });

            const neverSchema = notNullableSchema.oneOf([]);
            expectTypeOf<SchemaType<typeof neverSchema>>().toEqualTypeOf<never>();

            expect(neverSchema.toJSON()).to.deep.equal({
                type: 'string',
                pattern: 'a',
                oneOf: [
                    { pattern: '^b' },
                    { pattern: '^c' },
                ],
                allOf: [
                    {
                        oneOf: [{ pattern: 'd$' }],
                    },
                    { oneOf: [] },
                ],
            });

            const neverSchema2 = stringSchema().nullable().oneOf([]);
            expectTypeOf<SchemaType<typeof neverSchema2>>().toEqualTypeOf<never>();

            const notReallyNullableSchema = schema.oneOf([
                stringSchema().endsWith('d').nullable(),
                stringSchema().endsWith('e').nullable(),
            ]);
            expectTypeOf<SchemaType<typeof notReallyNullableSchema>>().toEqualTypeOf<
                `${string}a${string}` &
                (`${string}d` | `${string}e`) &
                (`b${string}` | `c${string}`) |
                null
            >();

            expect(notReallyNullableSchema.toJSON()).to.deep.equal({
                type: 'string',
                pattern: 'a',
                oneOf: [
                    { pattern: '^b' },
                    { pattern: '^c' },
                ],
                allOf: [
                    {
                        oneOf: [
                            { pattern: 'd$' },
                            { pattern: 'e$' },
                        ],
                    },
                ],
            });
        },
    },
};
