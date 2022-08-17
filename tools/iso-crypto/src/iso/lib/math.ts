// This module provides the basic ECC functionality of transforming a private key into a public key.

// _Ideally_ built-in modules implement most of the crypto logic for us. However in the case of
// browser-side JS, the SubtleCrypto module is incapable of importing private keys directly and
// internally computing the public key.

// Note: this is performed on key generation, and is also validated on private key + public key input 🙄.

// As such that step of calculation must be performed manually.
// All other ECC crypto math is performed by built in libraries and not handled here.

// Given the single use case of this library, combined with built-in validations, this module only
// implements the bare minimum logic. Validating inputs or handling special cases like Infinity are ignored.

export interface Point {
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
     * `b` in equation
     */
    readonly b: bigint;
    /**
     * Base Point, lies on curve. Public Key given a Private Key of 1.
     */
    readonly g: Point;
}

/**
 * Curves as described by {@link https://www.secg.org/sec2-v2.pdf}
 */
export const curves = {
    p256: {
        p: (2n ** 224n) * (2n ** 32n - 1n) + 2n ** 192n + 2n ** 96n - 1n,
        a: 0xFFFFFFFF_00000001_00000000_00000000_00000000_FFFFFFFF_FFFFFFFF_FFFFFFFCn,
        b: 0x5AC635D8_AA3A93E7_B3EBBD55_769886BC_651D06B0_CC53B0F6_3BCE3C3E_27D2604Bn,
        g: {
            x: 0x6B17D1F2_E12C4247_F8BCE6E5_63A440F2_77037D81_2DEB33A0_F4A13945_D898C296n,
            y: 0x4FE342E2_FE1A7F9B_8EE7EB4A_7C0F9E16_2BCE3357_6B315ECE_CBB64068_37BF51F5n,
        },
    },
    p384: {
        p: 2n ** 384n - 2n ** 128n - 2n ** 96n + 2n ** 32n - 1n,
        // eslint-disable-next-line max-len
        a: 0xFFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFE_FFFFFFFF_00000000_00000000_FFFFFFFCn,
        // eslint-disable-next-line max-len
        b: 0xB3312FA7_E23EE7E4_988E056B_E3F82D19_181D9C6E_FE814112_0314088F_5013875A_C656398D_8A2ED19D_2A85C8ED_D3EC2AEFn,
        g: {
            // eslint-disable-next-line max-len
            x: 0xAA87CA22_BE8B0537_8EB1C71E_F320AD74_6E1D3B62_8BA79B98_59F741E0_82542A38_5502F25D_BF55296C_3A545E38_72760AB7n,
            // eslint-disable-next-line max-len
            y: 0x3617DE4A_96262C6F_5D9E98BF_9292DC29_F8F41DBD_289A147C_E9DA3113_B5F0B8C0_0A60B1CE_1D7E819D_7A431D7C_90EA0E5Fn,
        },
    },
    p521: {
        p: 2n ** 521n - 1n,
        // eslint-disable-next-line max-len
        a: 0x1FF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFF_FFFFFFFCn,
        // eslint-disable-next-line max-len
        b: 0x51_953EB961_8E1C9A1F_929A21A0_B68540EE_A2DA725B_99B315F3_B8B48991_8EF109E1_56193951_EC7E937B_1652C0BD_3BB1BF07_3573DF88_3D2C34F1_EF451FD4_6B503F00n,
        g: {
            // eslint-disable-next-line max-len
            x: 0xC6_858E06B7_0404E9CD_9E3ECB66_2395B442_9C648139_053FB521_F828AF60_6B4D3DBA_A14B5E77_EFE75928_FE1DC127_A2FFA8DE_3348B3C1_856A429B_F97E7E31_C2E5BD66n,
            // eslint-disable-next-line max-len
            y: 0x118_39296A78_9A3BC004_5C8A5FB4_2C7D1BD9_98F54449_579B4468_17AFBD17_273E662C_97EE7299_5EF42640_C550B901_3FAD0761_353C7086_A272C240_88BE9476_9FD16650n,
        },
    },
};

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

/**
 * Perform exponent math for BigInt.
 *
 * power(x, y, p) == (x ^ y) % p
 *
 * Exponents are supported natively, but in cases of _large_ exponents, it is not possible.
 * (Either very slow, or hits max BigInt).
 *
 * @param {bigint} x - x in equation. "Base x"
 * @param {bigint} y - y in equation. "Power y"
 * @param {bigint} p - p in equation. Prime modulus.
 * @returns {bigint} result of (x ^ y) % p
 */
const power = (x: bigint, y: bigint, p: bigint): bigint => {
    let res = 1n;
    let x2 = x;
    const bits = [...y.toString(2)].reverse();

    for (const bit of bits) {
        if (bit === '1') {
            res = (res * x2) % p;
        }
        x2 = (x2 * x2) % p;
    }
    return res;
};

/**
 * Tonelli–Shanks algorithm.
 *
 * @see {@link https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm}
 *
 * y^2 = n % p
 * Solves for y.
 *
 * Implementation translated from [python](https://github.com/fabiomainardi/Tonelli-Shanks/blob/master/tonelli_shanks.py).
 *
 * @param {bigint} n - "quadratic residue" mod p
 * @param {bigint} p - prime modulus
 * @returns {bigint} y
 */
const modSqrt = (n: bigint, p: bigint): bigint => {

    let s = 1n;

    while ((p - 1n) % (2n ** s) === 0n) {
        ++s;
    }
    --s;

    const q = (p - 1n) / (2n ** s);

    let z = 1n;
    let res = power(z, (p - 1n) / 2n, p);

    while (res !== p - 1n) {
        ++z;
        res = power(z, (p - 1n) / 2n, p);
    }

    let c = power(z, q, p);
    let r = power(n, (q + 1n) / 2n, p);
    let t = power(n, q, p);
    let m = s;

    while (t !== 1n) {
        let i = 1n;
        let t2 = (t * t) % p;
        while (t2 !== 1n) {
            t2 = (t2 * t2) % p;
            ++i;
        }
        const b = power(c, power(2n, m - i - 1n, p), p);
        r = (r * b) % p;
        c = (b * b) % p;
        t = (t * c) % p;
        m = i;
    }

    return r;
};

export const deriveYCoordinate = (x: bigint, odd: boolean, curve: Curve): bigint => {

    const y = modSqrt(x ** 3n + curve.a * x + curve.b, curve.p);
    // eslint-disable-next-line no-bitwise
    const isOdd = !!(y & 1n);

    return isOdd === odd ? y : curve.p - y;
};
