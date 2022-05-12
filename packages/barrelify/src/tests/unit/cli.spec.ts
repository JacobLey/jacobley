import Path from 'node:path';
import { expect } from 'chai';
import { patchKey } from 'named-patch';
import Sinon from 'sinon';
import BarrelCli, { yargsOutput } from '../../cli.js';
import { barrelFiles } from '../../lib/barrel.js';

interface CliTest extends Mocha.Context {
    outputStub: Sinon.SinonStub<Parameters<typeof yargsOutput>, unknown>;
}

export const CliSpec = {

    beforeEach(this: CliTest) {
        this.outputStub = Sinon.stub(yargsOutput, patchKey);
    },

    afterEach() {
        Sinon.restore();
    },

    create: {

        async success() {

            const barrel = await BarrelCli.create();

            expect(barrel).to.be.an.instanceOf(BarrelCli);
        },
    },

    commands: {

        default: {

            async success() {

                const buildStub = Sinon.stub(barrelFiles, patchKey).callsFake(async params => {
                    expect(params).to.deep.equal({
                        cwd: process.cwd(),
                        dryRun: true,
                        ignore: ['foo'],
                        logger: console,
                    });
                    return [];
                });

                await new BarrelCli({
                    argv: ['node', 'barrelify', '--dry-run', '--ignore', 'foo'],
                }).start();

                expect(buildStub.callCount).to.equal(1);
            },

            async failure(this: Readonly<CliTest>) {

                const buildSpy = Sinon.spy(barrelFiles, patchKey);
                this.outputStub.callsFake((err, argv, log) => {
                    expect(err).to.have.property('message', 'Unknown arguments: unknown, option');
                    expect(log.startsWith('barrelify')).to.equal(true);
                    expect(log.endsWith('Unknown arguments: unknown, option')).to.equal(true);
                });

                await new BarrelCli({
                    argv: ['node', 'barrelify', '--unknown', '--option'],
                }).start();

                expect(buildSpy.callCount).to.equal(0);
                expect(this.outputStub.callCount).to.equal(1);
            },
        },

        ci: {

            async success() {

                const buildStub = Sinon.stub(barrelFiles, patchKey).callsFake(async params => {
                    expect(params).to.deep.equal({
                        cwd: Path.resolve('..'),
                        dryRun: true,
                        ignore: undefined,
                    });
                    return [];
                });

                await new BarrelCli({
                    argv: ['node', 'barrelify', 'ci', '--cwd', '..'],
                }).start();

                expect(buildStub.callCount).to.equal(1);
                expect(process.exitCode).to.equal(undefined);
            },

            async failure() {

                const errorStub = Sinon.stub(console, 'error').callsFake(msg => {
                    expect(msg).to.equal('Files are not built');
                });

                Sinon.stub(barrelFiles, patchKey).returns(Promise.resolve(['<file-path>']));

                await new BarrelCli({
                    argv: ['node', 'barrelify', 'ci'],
                }).start();

                expect(process.exitCode).to.equal(1);
                delete process.exitCode;

                expect(errorStub.callCount).to.equal(1);
            },
        },
    },

    yargsOutput: {

        'Pipes to console.log'(this: Readonly<CliTest>) {

            const logStub = Sinon.stub(console, 'log').callsFake((...args) => {
                expect(args).to.deep.equal(['<log-data>']);
            });

            this.outputStub.wrappedMethod(null, {}, '<log-data>');

            expect(logStub.callCount).to.equal(1);
        },

        'Ignores empty text'(this: Readonly<CliTest>) {

            const logSpy = Sinon.spy(console, 'log');

            this.outputStub.wrappedMethod(null, {}, '');

            expect(logSpy.callCount).to.equal(0);
        },
    },
};
