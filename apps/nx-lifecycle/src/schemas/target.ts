import { objectSchema, type SchemaType, stringSchema } from 'juniper';
import { ajv } from './lib/ajv.js';
import { configurationsSchema } from './configurations.js';
import { dependsOnSchema } from './depend-on.js';

const targetSchemaWithDependsOnOnly = objectSchema({
    properties: {
        dependsOn: dependsOnSchema,
    },
    additionalProperties: false,
});
export type TargetWithDependsOnOnly = SchemaType<typeof targetSchemaWithDependsOnOnly>;
export const isTargetWithDependsOnOnly = ajv.compile<TargetWithDependsOnOnly>(targetSchemaWithDependsOnOnly.toJSON());

const targetSchema = targetSchemaWithDependsOnOnly.properties({
    executor: stringSchema(),
    configurations: configurationsSchema,
}).additionalProperties(true);

export type Target = SchemaType<typeof targetSchema>;

export const allTargetsSchema = objectSchema({
    additionalProperties: targetSchema,
});

export type AllTargets = SchemaType<typeof allTargetsSchema>;
