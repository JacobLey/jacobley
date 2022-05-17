import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { barrelFiles } from '../lib/barrel.js';

export const barrel: CommandModule<{
    cwd: string;
    ignore: string[] | undefined;
}, {
    cwd: string;
    dryRun: boolean;
    ignore: string[] | undefined;
}> = {
    command: '$0',
    describe: 'Write index.ts barrel files',
    builder: yargs => yargs.option('dryRun', {
        alias: 'dry-run',
        describe: 'Do not write files',
        type: 'boolean',
        default: false,
    }).strict(),
    handler: async options => {

        const cwd = await parseCwd(options.cwd);

        await barrelFiles({
            cwd,
            dryRun: options.dryRun,
            ignore: options.ignore,
            logger: console,
        });
    },
};
