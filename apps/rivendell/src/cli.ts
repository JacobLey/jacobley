import { defaultImport } from 'default-import';
import { EntryScript } from 'entry-script';
import { patch } from 'named-patch';
import yargsDefault, { type Argv, type CommandModule } from 'yargs';
// eslint-disable-next-line n/file-extension-in-import
import { hideBin } from 'yargs/helpers';
import * as Commands from './commands/index.js';
import { packageJson } from './lib/package-json.js';

const yargs = defaultImport(yargsDefault) as Argv;

export const yargsOutput = patch((e: unknown, argv: unknown, log: string): void => {
    if (log) {
        // eslint-disable-next-line no-console
        console.log(log);
    }
});

/**
 * Rivendell CLI. Run `npx rivendell --help` for options.
 *
 * Uses `yargs` package for command line parsing and logic flow.
 */
export default class RivendellCli extends EntryScript {

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
     * @returns {Promise<RivendellCli>} cli
     */
    public static override async create(): Promise<RivendellCli> {
        return new RivendellCli({ argv: process.argv });
    }

    /**
     * Entry point to CLI script.
     *
     * Sets high level Yargs settings. Command/options logic is implemented in individual command modules.
     */
    public override async start(): Promise<void> {

        const yarg = (yargs() as unknown as Argv)
            .scriptName('rivendell')
            .option({
                configFile: {
                    alias: 'config-file',
                    describe: 'Path to config file',
                    type: 'string',
                },
                templateDirectory: {
                    alias: 'template-directory',
                    describe: 'Path to template directory',
                    type: 'string',
                },
                cwd: {
                    type: 'string',
                    default: '.',
                    describe: 'Current working directory',
                },
                manager: {
                    describe: 'Package manager to use find packages',
                    choices: ['lerna', 'npm', 'nx', 'rush', 'yarn'] as const,
                },
            })
            .strict()
            .help()
            .alias('help', 'info')
            .version(packageJson.version);

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
