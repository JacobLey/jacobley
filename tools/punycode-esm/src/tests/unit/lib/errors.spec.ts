import { expect } from 'chai';
import * as Errors from '../../../lib/errors.js';

export const ErrorsSpec = {

    checkOverflow: {

        success: {

            'Less than'() {
                Errors.checkOverflow(1, 2);
            },

            'Less than (gte)'() {
                Errors.checkOverflow(1, 2, { gte: true });
            },

            'Equal to'() {
                Errors.checkOverflow(1, 1);
            },
        },

        failure: {

            'Greater than'() {
                expect(() => {
                    Errors.checkOverflow(2, 1);
                }).to.throw(RangeError);
            },

            'Greater than (gte)'() {
                expect(() => {
                    Errors.checkOverflow(2, 1, { gte: true });
                }).to.throw('Overflow: input needs wider integers to process');
            },

            'Equal to'() {
                expect(() => {
                    Errors.checkOverflow(1, 1, { gte: true, error: 'invalid-input' });
                }).to.throw('Invalid input');
            },
        },
    },
};
