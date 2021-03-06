// This module provides the basic ECC functionality of transforming a private key into a public key.

// _Ideally_ built-in modules implement most of the crypto logic for us. However in the case of
// browser-side JS, the SubtleCrypto module is incapable of importing private keys directly and
// internally computing the public key.

// Note: this is performed on key generation, and is also validated on private key + public key input 🙄.

// As such that step of calculation must be performed manually.
// All other ECC crypto math is performed by built in libraries and not handled here.

// Given the single use case of this library, combined with built-in validations, this module only
// implements the bare minimum logic. Validating inputs or handling special cases like Infinity are ignored.

interface Point {
    readonly x: bigint;
    readonly y: bigint;
}

/**
 * Curve specification.
 *
 * Defines a curve using equation `y^2 ≡ (x^3 + a*x + b) % p`.
 *
 * Values like `n` and `b` are ignored as they are not required for this specific use cases.
 */
interface Curve {
    /**
     * Prime. `p` in equation.
     */
    readonly p: bigint;
    /**
     * `a` in equation.
     */
    readonly a: bigint;
    /**
     * Base Point, lies on curve. Public Key given a Private Key of 1.
     */
    readonly g: Point;
}

/**
 * Curve as described on [page 14]{@link https://www.secg.org/sec2-v2.pdf}
 */
export const p256 = {
    p: 0xFFFFFFFF_00000001_00000000_00000000_00000000_FFFFFFFF_FFFFFFFF_FFFFFFFFn,
    a: 0xFFFFFFFF_00000001_00000000_00000000_00000000_FFFFFFFF_FFFFFFFF_FFFFFFFCn,
    g: {
        x: 0x6B17D1F2_E12C4247_F8BCE6E5_63A440F2_77037D81_2DEB33A0_F4A13945_D898C296n,
        y: 0x4FE342E2_FE1A7F9B_8EE7EB4A_7C0F9E16_2BCE3357_6B315ECE_CBB64068_37BF51F5n,
    },
} as const;

/**
 * Linear Diophantine equations.
 *
 * @see {@link https://mathworld.wolfram.com/DiophantineEquation.html}
 *
 * ax + by = c.
 * Special case of c = 1.
 * Solve for base case of x0 and y0.
 *
 * [Validate Solutions]{@link https://planetcalc.com/3303/}
 *
 * @param {bigint} a - constant a
 * @param {bigint} b - constant b
 * @returns {object} base solution
 */
const euclidian = (a: bigint, b: bigint): Point => {

    const pairs: { a: bigint; b: bigint }[] = [];
    let oldA = a;
    let oldB = b;
    let mod = a % b;
    while (mod > 1n) {
        pairs.push({ a: oldA, b: oldB });
        mod = oldB % oldA;
        oldB = oldA;
        oldA = mod;
    }

    let x = 1n;
    let y = 0n;
    let pair = pairs.pop();
    while (pair) {
        y = x;
        x = (1n - pair.b * y) / pair.a;
        pair = pairs.pop();
    }

    return { x, y };
};

/**
 * Calculate modular inverse.
 *
 * @see {@link https://en.wikipedia.org/wiki/Modular_multiplicative_inverse}
 *
 * [Validate Solutions]{@link https://planetcalc.com/3311/}
 *
 * @param {bigint} a - value
 * @param {bigint} mod - modulus
 * @returns {bigint} modular inverse of `a`
 */
const modularInverse = (a: bigint, mod: bigint): bigint => {
    const inverse = euclidian(a < 0n ? a + mod : a, mod).x;
    if (inverse < 0n) {
        return inverse + mod;
    }
    return inverse;
};

/**
 * Calculate positive modulus.
 *
 * @example
 * positiveMod(7n, 10n) === 7n;
 * positiveMod(-7n, 10n) === 3n;
 *
 * @param {bigint} x - value
 * @param {bigint} mod - modulus
 * @returns {bigint} positive remainder
 */
const positiveMod = (x: bigint, mod: bigint): bigint => {
    const result = x % mod;
    if (result < 0n) {
        return result + mod;
    }
    return result;
};

/**
 * Add two points on the curve.
 *
 * @see {@link https://medium.com/asecuritysite-when-bob-met-alice/adding-points-in-elliptic-curve-cryptography-a1f0a1bce638}
 *
 * Note conditions like Infinity are ignored/improperly handled, but that is acceptable for expected use case.
 *
 * @param {Point} p - first point
 * @param {Point} q - second point
 * @param {Curve} curve - curve specification
 * @returns {Point} result point
 */
const addPoints = (p: Point, q: Point, curve: Curve): Point => {
    const { rise, run } = p.x === q.x ? {
        rise: 3n * p.x * p.x + curve.a,
        run: 2n * p.y,
    } : {
        rise: q.y - p.y,
        run: q.x - p.x,
    };
    const slope = rise * modularInverse(run, curve.p) % curve.p;

    const x = positiveMod(slope * slope - q.x - p.x, curve.p);
    return {
        x,
        y: positiveMod(slope * p.x - slope * x - p.y, curve.p),
    };
};

/**
 * Derives coordinates of ECC public key given private key (random number) and curve.
 * Implements Double-and-add method.
 *
 * @see {@link https://en.wikipedia.org/wiki/Elliptic_curve_point_multiplication}
 *
 * @param {bigint} privateKey - random number in curve range
 * @param {Curve} curve - Curve specification
 * @returns {Point} public key point
 */
export const derivePublicKey = (privateKey: bigint, curve: Curve): Point => {

    const bits = [...privateKey.toString(2)].reverse();

    let doublePoint: Point | null = null;
    let sum: Point | null = null;

    for (const bit of bits) {
        doublePoint = doublePoint ? addPoints(doublePoint, doublePoint, curve) : curve.g;
        if (bit === '1') {
            sum = sum ? addPoints(sum, doublePoint, curve) : doublePoint;
        }
    }
    return sum!;
};
