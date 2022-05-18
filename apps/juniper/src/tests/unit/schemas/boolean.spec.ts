import DefaultAjv from 'ajv/dist/2020.js';
import { expect } from 'chai';
import { defaultImport } from 'default-import';
import { expectTypeOf } from 'expect-type';
import { booleanSchema, type SchemaType } from '../../../index.js';

const Ajv = defaultImport(DefaultAjv);

export const BooleanSchemaSpec = {

    'nullable': {

        success() {

            const schema = booleanSchema().nullable().toJSON();

            expect(schema).to.deep.equal({
                type: ['boolean', 'null'],
            });
            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<boolean | null>();
            const validator = new Ajv({ strict: true }).compile(schema);
            expect(validator(true)).to.equal(true);
            expect(validator(null)).to.equal(true);
        },
    },

    'toJSON': {

        success() {

            const schema = booleanSchema().toJSON();

            expect(schema).to.deep.equal({
                type: 'boolean',
            });
            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<boolean>();
            const validator = new Ajv({ strict: true }).compile(schema);
            expect(validator(true)).to.equal(true);
            expect(validator(null)).to.equal(false);
        },
    },

    'Invalid types': {

        'Blocked methods'() {

            const schema = booleanSchema();

            expectTypeOf<typeof schema['allOf']>().toBeNever();
            expectTypeOf<typeof schema['anyOf']>().toBeNever();
            expectTypeOf<typeof schema['if']>().toBeNever();
            expectTypeOf<typeof schema['not']>().toBeNever();
            expectTypeOf<typeof schema['oneOf']>().toBeNever();
        },
    },
};
