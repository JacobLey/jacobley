import type { PopulateFileParams } from 'load-populate-files';
import populateFilesOptionsSchema from './executors/update-ts-references/schema.js';

export default [
    {
        filePath: './src/executors/update-ts-references/schema.json',
        content: populateFilesOptionsSchema,
    },
] satisfies PopulateFileParams[];
