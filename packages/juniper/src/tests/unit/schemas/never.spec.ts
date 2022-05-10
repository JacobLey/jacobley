import AjvDefault from 'ajv/dist/2020.js';
import { expect } from 'chai';
import { defaultImport } from 'default-import';
import { expectTypeOf } from 'expect-type';
import { neverSchema, type SchemaType } from '../../../index.js';

const Ajv = defaultImport(AjvDefault);

export const NeverSchemaSpec = {

    'toJSON': {

        success() {

            const schema = neverSchema().toJSON();

            expect(schema).to.deep.equal({
                not: {},
            });
            const validator = new Ajv({ strict: true }).compile<SchemaType<typeof schema>>(schema);
            expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<never>();
            expect(validator(null)).to.equal(false);
        },
    },

    'Invalid types': {

        'Blocked methods'() {

            const schema = neverSchema();

            expectTypeOf<typeof schema['allOf']>().toBeNever();
            expectTypeOf<typeof schema['anyOf']>().toBeNever();
            expectTypeOf<typeof schema['if']>().toBeNever();
            expectTypeOf<typeof schema['not']>().toBeNever();
            expectTypeOf<typeof schema['nullable']>().toBeNever();
            expectTypeOf<typeof schema['oneOf']>().toBeNever();
        },
    },
};
