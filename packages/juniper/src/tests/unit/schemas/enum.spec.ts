import AjvDefault from 'ajv/dist/2020.js';
import { expect } from 'chai';
import { defaultImport } from 'default-import';
import { expectTypeOf } from 'expect-type';
import { type EnumSchema, enumSchema, type SchemaType } from '../../../index.js';

const Ajv = defaultImport(AjvDefault);

interface EnumSchemaTest {
    schema: EnumSchema<unknown>;
}

export const EnumSchemaSpec = {

    'toJSON': {

        success() {

            const schema = enumSchema({
                enum: [1, 'a', [false]] as const,
            }).enum(5 as const).enums([null, 'z'] as const).toJSON();

            expect(schema).to.deep.equal({
                enum: [1, 'a', [false], 5, null, 'z'],
            });
            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<'a' | 'z' | 1 | 5 | readonly [false] | null>();
            const validator = new Ajv({ strict: true }).compile(schema);
            expect(validator([false])).to.equal(true);
            expect(validator(1)).to.equal(true);
            expect(validator('b')).to.equal(false);
        },

        'Single value': {

            before(this: EnumSchemaTest) {
                this.schema = enumSchema({ enum: [123] })
                    .enum(123)
                    .enums([123]);
            },

            const(this: EnumSchemaTest) {

                expect(this.schema.toJSON()).to.deep.equal({
                    const: 123,
                });

                const validator = new Ajv({ strict: true }).compile(this.schema.toJSON());
                expect(validator(123)).to.equal(true);
                expect(validator(124)).to.equal(false);
            },

            openApi30(this: EnumSchemaTest) {
                expect(this.schema.toJSON({ openApi30: true })).to.deep.equal({
                    enum: [123],
                });

                const validator = new Ajv({ strict: true }).compile(this.schema.toJSON({ openApi30: true }));
                expect(validator(123)).to.equal(true);
                expect(validator(124)).to.equal(false);
            },
        },
    },

    'Invalid types': {

        'Blocked methods'() {

            const schema = enumSchema();

            expectTypeOf<typeof schema['allOf']>().toBeNever();
            expectTypeOf<typeof schema['anyOf']>().toBeNever();
            expectTypeOf<typeof schema['if']>().toBeNever();
            expectTypeOf<typeof schema['not']>().toBeNever();
            expectTypeOf<typeof schema['nullable']>().toBeNever();
            expectTypeOf<typeof schema['oneOf']>().toBeNever();
        },
    },
};
