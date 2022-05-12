#!/usr/bin/env node

import Path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultImport } from 'default-import';
import { EntryScript, type EntryScriptOptions } from 'entry-script';
import { patch } from 'named-patch';
import { readPackageUp } from 'read-pkg-up';
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
 * Barrelify CLI. Run `npx barrelify --help` for options.
 *
 * Uses `yargs` package for command line parsing and logic flow.
 */
export default class BarrelCli extends EntryScript {

    #argv: string[];

    /**
     * Create CLI given args.
     *
     * @param {object} options - options
     */
    public constructor(options: EntryScriptOptions & {
        argv: string[];
    }) {
        super(options);
        this.#argv = hideBin(options.argv);
    }

    /**
     * Pass process.argv to cli.
     *
     * @returns {Promise<BarrelCli>} cli
     */
    public static override async create(): Promise<BarrelCli> {
        return new BarrelCli({ argv: process.argv });
    }

    /**
     * Entry point to CLI script.
     *
     * Sets high level Yargs settings. Command/options logic is implemented in individual command modules.
     */
    public override async start(): Promise<void> {

        const pkg = await readPackageUp({
            cwd: Path.dirname(fileURLToPath(import.meta.url)),
        });

        const yarg = (yargs() as unknown as Argv)
            .scriptName('barrelify')
            .option({
                cwd: {
                    type: 'string',
                    default: '.',
                    describe: 'Current working directory',
                },
                ignore: {
                    describe: 'Glob to ignore',
                    type: 'array',
                    string: true,
                },
            })
            .help()
            .version(pkg!.packageJson.version);

        for (const command of Object.values(Commands)) {

            const typedCommand: typeof command extends CommandModule<infer T, any> ?
                (typeof yarg extends Argv<T> ? CommandModule<T, any> : never) :
                never = command;

            yarg.command(typedCommand);
        }

        await yarg.parseAsync(this.#argv, {}, yargsOutput);
    }
}
