import Chai from 'chai';
import { expectTypeOf } from 'expect-type';
import * as DefaultImport from '../../default-import.js';
import cjs from '../data/cjs.cjs';
import esm from '../data/esm.js';
import namedCjs from '../data/named-cjs.cjs';
import * as noDefault from '../data/no-default.js';
import rootCjs from '../data/root-cjs.cjs';

const [
    dynamicCjs,
    dynamicEsm,
    dynamicNamedCjs,
    dynamicNoDefault,
    dynamicRootCjs,
] = await Promise.all([
    import('../data/cjs.cjs'),
    import('../data/esm.js'),
    import('../data/named-cjs.cjs'),
    import('../data/no-default.js'),
    import('../data/root-cjs.cjs'),
]);

export const DefaultImportSpec = {

    defaultImport: {

        'Returns default': {

            'ESM export'() {
                Chai.expect(DefaultImport.defaultImport(esm)).to.eq(esm);
                Chai.expect(DefaultImport.defaultImport(esm)).to.eq(DefaultImport.defaultImport(dynamicEsm));
                expectTypeOf(DefaultImport.defaultImport(esm)).toEqualTypeOf<{ esm: boolean }>();

                Chai.expect(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(esm))
                ).to.eq(DefaultImport.defaultImport(esm));
                expectTypeOf(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(esm))
                ).toEqualTypeOf<{ esm: boolean }>();

                Chai.expect(DefaultImport.defaultImport(esm)).to.deep.equal({ esm: true });
            },

            'Only default export'() {
                Chai.expect(DefaultImport.defaultImport(Chai)).to.eq(Chai);
                expectTypeOf(DefaultImport.defaultImport(Chai)).toEqualTypeOf<typeof Chai>();

                Chai.expect(DefaultImport.defaultImport(cjs)).to.equal(cjs.default);
                expectTypeOf(DefaultImport.defaultImport(cjs)).toEqualTypeOf<{ cjs: boolean }>();

                Chai.expect(DefaultImport.defaultImport(cjs)).to.eq(DefaultImport.defaultImport(dynamicCjs));
                Chai.expect(DefaultImport.defaultImport(cjs)).to.eq(DefaultImport.defaultImport(dynamicCjs.default));

                expectTypeOf(DefaultImport.defaultImport(dynamicCjs)).toEqualTypeOf<{ cjs: boolean }>();
                expectTypeOf(DefaultImport.defaultImport(dynamicCjs.default)).toEqualTypeOf<{ cjs: boolean }>();

                Chai.expect(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(cjs))
                ).to.eq(DefaultImport.defaultImport(cjs));
                expectTypeOf(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(cjs))
                ).toEqualTypeOf<{ cjs: boolean }>();

                Chai.expect(DefaultImport.defaultImport(cjs)).to.deep.equal({ cjs: true });
            },
        },

        'Returns raw': {

            'Export is single object'() {
                Chai.expect(DefaultImport.defaultImport(rootCjs)).to.equal(rootCjs);
                expectTypeOf(DefaultImport.defaultImport(rootCjs)).toEqualTypeOf<{ rootCjs: boolean }>();

                Chai.expect(DefaultImport.defaultImport(rootCjs)).to.eq(DefaultImport.defaultImport(dynamicRootCjs));
                expectTypeOf(DefaultImport.defaultImport(dynamicRootCjs)).toEqualTypeOf<{ rootCjs: boolean }>();
                expectTypeOf(DefaultImport.defaultImport(dynamicRootCjs.default)).toEqualTypeOf<{ rootCjs: boolean }>();

                Chai.expect(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(rootCjs))
                ).to.eq(DefaultImport.defaultImport(rootCjs));
                expectTypeOf(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(rootCjs))
                ).toEqualTypeOf<{ rootCjs: boolean }>();

                Chai.expect(DefaultImport.defaultImport(rootCjs)).to.deep.equal({ rootCjs: true });
            },

            'No default is found'() {
                Chai.expect(DefaultImport.defaultImport(noDefault)).to.equal(noDefault);
                expectTypeOf(DefaultImport.defaultImport(noDefault)).toEqualTypeOf<{ readonly noDefault: true }>();

                Chai.expect(
                    DefaultImport.defaultImport(noDefault)
                ).to.eq(DefaultImport.defaultImport(dynamicNoDefault));
                expectTypeOf(DefaultImport.defaultImport(dynamicNoDefault)).toEqualTypeOf<{ readonly noDefault: true }>();

                Chai.expect(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(noDefault))
                ).to.eq(DefaultImport.defaultImport(noDefault));
                expectTypeOf(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(noDefault))
                ).toEqualTypeOf<{ readonly noDefault: true }>();

                Chai.expect(DefaultImport.defaultImport(noDefault)).to.deep.equal(
                    Object.create(null, {
                        noDefault: {
                            value: true,
                            enumerable: true,
                        },
                        [Symbol.toStringTag]: {
                            value: 'Module',
                            enumerable: false,
                        },
                    })
                );

                Chai.expect(DefaultImport.defaultImport(namedCjs)).to.equal(namedCjs);
                expectTypeOf(DefaultImport.defaultImport(namedCjs)).toEqualTypeOf<{ readonly named: '<named>' }>();

                Chai.expect(
                    DefaultImport.defaultImport(namedCjs)
                ).to.eq(DefaultImport.defaultImport(dynamicNamedCjs));
                expectTypeOf(DefaultImport.defaultImport(dynamicNamedCjs)).toEqualTypeOf<{ readonly named: '<named>' }>();

                Chai.expect(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(namedCjs))
                ).to.eq(DefaultImport.defaultImport(namedCjs));
                expectTypeOf(
                    DefaultImport.defaultImport(DefaultImport.defaultImport(namedCjs))
                ).toEqualTypeOf<{ readonly named: '<named>' }>();

                Chai.expect(DefaultImport.defaultImport(namedCjs)).to.deep.equal({ named: '<named>' });
            },
        },

        'Handles literals'() {
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            Chai.expect(DefaultImport.defaultImport(undefined)).to.equal(undefined);
            Chai.expect(DefaultImport.defaultImport(null)).to.equal(null);
            Chai.expect(DefaultImport.defaultImport(0)).to.equal(0);
            Chai.expect(DefaultImport.defaultImport(123)).to.equal(123);
            Chai.expect(DefaultImport.defaultImport('<abc>')).to.equal('<abc>');
            Chai.expect(DefaultImport.defaultImport(true)).to.equal(true);
            Chai.expect(DefaultImport.defaultImport(false)).to.equal(false);
            Chai.expect(DefaultImport.defaultImport([])).to.deep.equal([]);
            Chai.expect(DefaultImport.defaultImport({})).to.deep.equal({});
        },
    },
};
