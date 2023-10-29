import { objectSchema, type SchemaType } from 'juniper';
import { ajv } from './lib/ajv.js';
import { allTargetsSchema } from './target.js';

const nxJsonSchema = objectSchema({
    properties: {
        targetDefaults: allTargetsSchema,
    },
});

export type NxJson = SchemaType<typeof nxJsonSchema>;

export const isNxJson = ajv.compile<NxJson>(nxJsonSchema.toJSON());
