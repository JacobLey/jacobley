import { objectSchema, type SchemaType } from 'juniper';
import { ajv } from './lib/ajv.js';
import { allTargetsSchema } from './target.js';

const projectJsonSchema = objectSchema({
    properties: {
        targets: allTargetsSchema,
    },
});

export type ProjectJson = SchemaType<typeof projectJsonSchema>;

export const isProjectJson = ajv.compile<ProjectJson>(projectJsonSchema.toJSON());
