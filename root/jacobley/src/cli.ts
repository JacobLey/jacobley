import { defaultImport } from 'default-import';
import { EntryScript } from 'entry-script';
import { patch } from 'named-patch';
import yargsDefault, { type Argv, type CommandModule } from 'yargs';
// eslint-disable-next-line node/file-extension-in-import
import { hideBin } from 'yargs/helpers';
import * as Commands from './commands/index.js';

const yargs = defaultImport(yargsDefault) as Argv;

export const yargsOutput = patch((e: unknown, argv: unknown, log: string): void => {
    if (log) {
        // eslint-disable-next-line no-console
        console.log(log);
    }
});

/**
 * CLI for internal scripts. Run `./cli.mjs --help` for options.
 *
 * Uses `yargs` package for command line parsing and logic flow.
 */
export default class InternalCli extends EntryScript {

    #argv: string[];

    /**
     * Create CLI given args.
     *
     * @param {object} params - params
     * @param {object} params.argv - args from CLI process
     */
    public constructor(params: {
        argv: string[];
    }) {
        super();
        this.#argv = hideBin(params.argv);
    }

    /**
     * Pass process.argv to cli.
     *
     * @returns {Promise<InternalCli>} cli
     */
    public static override async create(): Promise<InternalCli> {
        return new InternalCli({ argv: process.argv });
    }

    /**
     * Entry point to CLI script.
     *
     * Sets high level Yargs settings. Command/options logic is implemented in individual command modules.
     */
    public override async start(): Promise<void> {

        const yarg = (yargs() as unknown as Argv)
            .scriptName('root')
            .help()
            .strict()
            .alias('help', 'info')
            .version('0');

        yarg.wrap(Math.min(120, yarg.terminalWidth()));

        for (const command of Object.values(Commands)) {

            const typedCommand: typeof command extends CommandModule<infer T, any> ?
                (typeof yarg extends Argv<T> ? CommandModule<T, any> : never) :
                never = command;

            yarg.command(typedCommand);
        }

        await yarg.parseAsync(this.#argv, {}, yargsOutput);
    }
}
