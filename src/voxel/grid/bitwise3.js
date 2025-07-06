// src/bitwise3.js

// ———————————————————————————————————————————————————————————
// 3-INPUT BITWISE ROUTINES (Ternary Boolean Ops)
// ———————————————————————————————————————————————————————————

// === Threshold & Counting ===

/** 1 only if all three inputs are 1 */
export function allTrue3(a, b, c) {
  return a & b & c;
}

/** 1 if one or more inputs are 1 */
export function anyTrue3(a, b, c) {
  return a | b | c;
}

/** 1 if at least two inputs are 1 */
export function majority3(a, b, c) {
  return (a & b) | (b & c) | (a & c);
}

/** 1 if zero or one inputs are 1 */
export function minority3(a, b, c) {
  return ~((a & b) | (b & c) | (a & c));
}

/** 1 if exactly one input is 1 */
export function exactlyOne3(a, b, c) {
  const sum = a ^ b ^ c;
  const allOnes = a & b & c;
  return sum & ~allOnes;
}

/** 1 if exactly two inputs are 1 */
export function exactlyTwo3(a, b, c) {
  const maj = majority3(a, b, c);
  const sum = a ^ b ^ c;
  return maj & ~sum;
}


// === Parity ===

/** 1 if an odd number of inputs are 1 */
export function parity3(a, b, c) {
  return a ^ b ^ c;
}

/** 1 if an even number of inputs are 1 */
export function xnor3(a, b, c) {
  return ~(a ^ b ^ c);
}

/** 1 if an odd number of PAIRS (a,b),(b,c),(a,c) are both 1 .. might be the same as exactlyTwo3
// export function oddPair3(a, b, c) {
//   return (a & b) ^ (b & c) ^ (a & c);
// }


// === Multiplexer / Selection ===

/** if a=1 → b else → c */
export function muxA(a, b, c) {
  return (a & b) | (~a & c);
}
/** if b=1 → a else → c */
export function muxB(a, b, c) {
  return (b & a) | (~b & c);
}
/** if c=1 → a else → b */
export function muxC(a, b, c) {
  return (c & a) | (~c & b);
}

/** inverse of mux: if a=1 → c else → b */
export function inverseMuxA(a, b, c) {
  return (a & c) | (~a & b);
}
export function inverseMuxB(a, b, c) {
  return (b & c) | (~b & a);
}
export function inverseMuxC(a, b, c) {
  return (c & b) | (~c & a);
}

/** if a=1 → ~b else → c */
export function conditionalInvertA(a, b, c) {
  return (a & ~b) | (~a & c);
}
export function conditionalInvertB(a, b, c) {
  return (b & ~a) | (~b & c);
}
export function conditionalInvertC(a, b, c) {
  return (c & ~a) | (~c & b);
}

/**
 * rotate select:
 * – if a=1 return c
 * – else if b=1 return a
 * – else return b
 */
export function rotateSelectA(a, b, c) {
  return a ? c : (b ? a : b);
}
/** permuted control: b?→c else c?→b else a */
export function rotateSelectB(a, b, c) {
  return b ? a : (c ? b : c);
}
/** permuted control: c?→b else a?→c else a */
export function rotateSelectC(a, b, c) {
  return c ? b : (a ? c : a);
}


// === Conditional Logic ===

/** if a=1 return b^c else 0 */
export function conditionalXorA(a, b, c) {
  return a & (b ^ c);
}
export function conditionalXorB(a, b, c) {
  return b & (a ^ c);
}
export function conditionalXorC(a, b, c) {
  return c & (a ^ b);
}


/** if a=1 return b|c else 0 */
export function conditionalOrA(a, b, c) {
  return a & (b | c);
}
export function conditionalOrB(a, b, c) {
  return b & (a | c);
}
export function conditionalOrC(a, b, c) {
  return c & (a | b);
}


// === Fundamental Gates ===

/** 1 unless all three inputs are 1 */
export function nand3(a, b, c) {
  return ~(a & b & c);
}
/** 1 if all three inputs are 0 */
export function nor3(a, b, c) {
  return ~(a | b | c);
}


// === Pairwise Operations ===

/** (a^b) or, if both zero, pass c */
export function pairwiseXorA(a, b, c) {
  return (a ^ b) | (~a & ~b & c);
}
export function pairwiseXorB(a, b, c) {
  return (b ^ c) | (~b & ~c & a);
}
export function pairwiseXorC(a, b, c) {
  return (c ^ a) | (~c & ~a & b);
}

// === Experimental / Creative Gates =========================================

/** 1 if one or two inputs are 1 (excludes 000 and 111) */
export function someButNotAll3(a, b, c) {
  return (a | b | c) & ~(a & b & c);
}

/** 1 if all three inputs are identical (000 or 111) */
export function unanimous3(a, b, c) {
  return (a & b & c) | (~a & ~b & ~c);
}

/** Chained implication: (¬a → b) ∧ (¬b → c) */
export function chainImplication3(a, b, c) {
  return (~a | b) & (~b | c);
}

/** Monotone non-increasing:  a ≥ b ≥ c  in Boolean order */
export function monotoneDec3(a, b, c) {
  return ~((~a & b) | (~b & c));
}

/** Equality detectors */
export const equalAB3 = (a, b, c) => ~(a ^ b);
export const equalBC3 = (a, b, c) => ~(b ^ c);
export const equalCA3 = (a, b, c) => ~(c ^ a);

/** 1 if the bits strictly alternate (010 or 101) */
export const alternation3 = (a, b, c) => (a ^ b) & (b ^ c);

/** Weighted parity:  a ⊕ (b ∧ c) */
export const weightedParity3 = (a, b, c) => a ^ (b & c);

/** Hybrid gate: (a ∧ b) ⊕ c */
export const andXorC3 = (a, b, c) => (a & b) ^ c;

/** Difference-vs-OR:  a ⊕ (b ∨ c) */
export const diffToOr3 = (a, b, c) => a ^ (b | c);

/** (¬a → b) ∧ c   — “implies-then-gate” */
export const impliesThenC3 = (a, b, c) => ((~a | b) & c);


// ———————————————————————————————————————————————————————————
// Export the array of everything you want to randomly pick
// ———————————————————————————————————————————————————————————

export const OPS3 = [
  // thresholds
  allTrue3, anyTrue3, majority3, minority3, exactlyOne3, exactlyTwo3,
  // parity
  parity3, xnor3,
  // mux families
  muxA, muxB, muxC,
  inverseMuxA, inverseMuxB, inverseMuxC,
  conditionalInvertA, conditionalInvertB, conditionalInvertC,
  rotateSelectA, rotateSelectB, rotateSelectC,
  // conditional logic
  conditionalXorA, conditionalXorB, conditionalXorC,
  conditionalOrA, conditionalOrB, conditionalOrC,
  // gates
  nand3, nor3,
  // pairwise
  pairwiseXorA, pairwiseXorB, pairwiseXorC,
  //experimental
  someButNotAll3, unanimous3, chainImplication3, 
  monotoneDec3, equalAB3, equalBC3, equalCA3, 
  alternation3, weightedParity3, andXorC3, diffToOr3, impliesThenC3
];
