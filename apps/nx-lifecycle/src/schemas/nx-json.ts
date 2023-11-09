import { objectSchema, type SchemaType } from 'juniper';
import { ajv } from './lib/ajv.js';
import { allTargetsSchema, type AllTargets } from './target.js';

const nxJsonSchema = objectSchema({
    properties: {
        targetDefaults: allTargetsSchema,
    },
    additionalProperties: true,
});

export type NxJson = SchemaType<typeof nxJsonSchema>;
export interface NxJsonWithTargets extends NxJson {
    targetDefaults: AllTargets;
}

export const isNxJson = ajv.compile<NxJson>(nxJsonSchema.toJSON());
