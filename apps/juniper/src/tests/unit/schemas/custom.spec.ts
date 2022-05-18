import { expect } from 'chai';
import { expectTypeOf } from 'expect-type';
import { customSchema, type SchemaType } from '../../../index.js';
import type { AvailableProperties } from '../../types.js';

export const CustomSchemaSpec = {

    'Custom schema + type'() {

        const sym = Symbol('sym');

        const externalSchema = {
            notValidSchema: true,
            _randomVal: 123,
            [sym]: sym,
        };

        const schema = customSchema<'abc' | number>(externalSchema);

        expect(schema.toJSON()).to.deep.equal(externalSchema);
        expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<'abc' | number>();
    },

    'Default empty object'() {
        const schema = customSchema().toJSON();

        expect(schema).to.deep.equal({});
        expectTypeOf<SchemaType<typeof schema>>().toEqualTypeOf<unknown>();
    },

    'Invalid types': {

        'Blocked methods'() {

            const schema = customSchema();

            expectTypeOf<AvailableProperties<typeof schema>>().toEqualTypeOf<'cast' | 'toJSON'>();
        },
    },
};
