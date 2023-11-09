import { objectSchema, type SchemaType, stringSchema } from 'juniper';

export const configurationsSchema = objectSchema().oneOf([
    objectSchema({
        properties: {
            lifecycle: objectSchema({
                properties: {
                    hook: stringSchema().nullable(),
                },
                required: ['hook'],
                additionalProperties: false,
            }),
            __lifecycle: false,
        },
    }),
    objectSchema({
        properties: {
            __lifecycle: objectSchema({ additionalProperties: false }),
        },
        required: ['__lifecycle'],
        additionalProperties: false,
    }),
]);

export type Configurations = SchemaType<typeof configurationsSchema>;
