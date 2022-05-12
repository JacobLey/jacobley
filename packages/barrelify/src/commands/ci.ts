import { parseCwd } from 'parse-cwd';
import type { CommandModule } from 'yargs';
import { barrelFiles } from '../lib/barrel.js';

export const ci: CommandModule<{
    cwd: string;
    ignore: string[] | undefined;
}, {
    cwd: string;
    ignore: string[] | undefined;
}> = {
    command: 'ci',
    describe: 'Assert that barrel files are written correctly',
    handler: async options => {

        const cwd = await parseCwd(options.cwd);

        const changed = await barrelFiles({
            cwd,
            dryRun: true,
            ignore: options.ignore,
        });

        if (changed.length > 0) {
            process.exitCode = 1;
            console.error('Files are not built');
        }
    },
};
