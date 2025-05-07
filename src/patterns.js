// src/patterns.js

import { randomInt, randomFloat } from './utils.js';
import { OPS3 } from './bitwise3.js';
import { GRID_DIM } from './config.js';

const C = GRID_DIM / 2;

// ———————————————————————————————————————————————————————————
// 1) Base spatial patterns (each factory takes only `op`)
// ———————————————————————————————————————————————————————————
const BasePatterns = {
    sumDiff: (op) => (x, y, z) => op(x + y + z, y + z - x, z + x - y),
    sumMinus: (op) => (x, y, z) => op(x + y - z, y + z - x, z + x - y),
    invSumMinus: (op) => (x, y, z) => op(x - y + z, y - z + x, z - x + y),
    diagonal: (op) => (x, y, z) => op(x + y, y + z, z + x),
    xorMajOr: (op) => (x, y, z) => op(
        x ^ y ^ z,
        (x & y) | (y & z) | (x & z),
        x | y | z
    ),
    xorOrMaj: (op) => (x, y, z) => op(
        x ^ y ^ z,
        x | y | z,
        (x & y) | (y & z) | (x & z)
    ),
    majXorOr: (op) => (x, y, z) => op(
        (x & y) | (y & z) | (x & z),
        x ^ y ^ z,
        x | y | z
    ),
    majOrXor: (op) => (x, y, z) => op(
        (x & y) | (y & z) | (x & z),
        x | y | z,
        x ^ y ^ z
    ),
    orXorMaj: (op) => (x, y, z) => op(
        x | y | z,
        x ^ y ^ z,
        (x & y) | (y & z) | (x & z)
    ),
    orMajXor: (op) => (x, y, z) => op(
        x | y | z,
        (x & y) | (y & z) | (x & z),
        x ^ y ^ z
    ),
    euclidOffset: (op) => (x, y, z) => {
        const d = Math.floor(Math.hypot(x - C, y - C, z - C));
        return op(d, x - y, y - z);
    },
    zBands: (op, w = randomInt(1, 32)) => (x, y, z) => {
        const b = Math.floor(z / w);
        return op(x + b, y + b, z - b);
    },
    spiral: (op) => (x, y, z) => {
        const t = Math.floor(Math.sqrt(x * x + y * y + z * z));
        return op(x + t, y + t, z + t);
    },
    manhattan: (op) => (x, y, z) => {
        const m = Math.abs(x - C)
            + Math.abs(y - C)
            + Math.abs(z - C);
        return op(m, x - y, y - z);
    },
    chebyshev: (op) => (x, y, z) => {
        const d = Math.max(
            Math.abs(x - C),
            Math.abs(y - C),
            Math.abs(z - C)
        );
        return op(d, x - y, y - z);
    },
    minkowski: (op, p = randomFloat(1, 5)) => (x, y, z) => {
        const m = Math.pow(
            Math.pow(Math.abs(x - C), p) +
            Math.pow(Math.abs(y - C), p) +
            Math.pow(Math.abs(z - C), p),
            1 / p
        );
        return op(Math.floor(m), x - y, y - z);
    }
};

// turn BasePatterns into an array of [name, factory]
const PATTERN_ENTRIES = Object.entries(BasePatterns);

// all six axis permutations
const AXIS_PERMS = [
    [0, 1, 2], [0, 2, 1],
    [1, 0, 2], [1, 2, 0],
    [2, 0, 1], [2, 1, 0]
];

// helper to grab random element
function choice(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

// ———————————————————————————————————————————————————————————
// pick one raw pattern: base + bit-op + perm
// ———————————————————————————————————————————————————————————
function pickRawPattern() {
    const [, factory] = choice(PATTERN_ENTRIES);
    const op = choice(OPS3);
    const raw0 = factory(op);         // defaults handle w & p
    const perm = choice(AXIS_PERMS);

    // inline permute
    return (x, y, z) => {
        const a = [x, y, z];
        return raw0(a[perm[0]], a[perm[1]], a[perm[2]]);
    };
}

// ———————————————————————————————————————————————————————————
// Export: offsets + mod wrapper
// ———————————————————————————————————————————————————————————
export function createPatternFn(offsets, totalStates) {
    const raw = pickRawPattern();
    const [ox, oy, oz] = offsets;

    return (x, y, z) => {
        let v = raw(x + ox, y + oy, z + oz) % totalStates;
        return v < 0 ? v + totalStates : v;
    };
}
