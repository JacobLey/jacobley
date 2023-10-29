import { objectSchema, type SchemaType, stringSchema } from 'juniper';
import { dependsOnSchema } from './depend-on.js';

const targetSchema = objectSchema({
    properties: {
        dependsOn: dependsOnSchema,
        executor: stringSchema(),
        configurations: objectSchema().oneOf([
            objectSchema({
                properties: {
                    lifecycle: objectSchema({
                        properties: {
                            hook: stringSchema(),
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
        ]),
    },
});

export type Target = SchemaType<typeof targetSchema>;

export const allTargetsSchema = objectSchema({
    additionalProperties: targetSchema,
});

export type AllTargets = SchemaType<typeof allTargetsSchema>;
