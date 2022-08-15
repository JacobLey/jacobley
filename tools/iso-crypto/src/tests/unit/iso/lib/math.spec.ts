import { expect } from 'chai';
import * as MathLib from '../../../../iso/lib/math.js';

export const MathSpec = {

    deriveYCoordinate() {

        expect(
            MathLib.deriveYCoordinate(1n, false, {
                // Not a "real" curve, just getting test coverage
                a: 1n,
                b: 3n,
                p: 41n,
                g: {
                    x: 8n,
                    y: 24n,
                },
            })
        ).to.equal(28n);
    },
};
