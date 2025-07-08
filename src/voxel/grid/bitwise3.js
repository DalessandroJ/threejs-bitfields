// src/voxel/grid/bitwise3.js
// ──────────────────────────────────────────────────────────────
// gate3(mask, a, b, c)
//
// mask is an int 0-255 that encodes one of the 256 possible 3-input Boolean truth-tables
// a, b, c are 32-bit integers.  The Boolean function is applied bit-wise in parallel to all 32 bit-lanes.
// Returns a 32-bit integer whose bits are the per-lane results.

export function gate3(mask, a, b, c) {
  a >>>= 0;  b >>>= 0;  c >>>= 0;          // force unsigned

  const t0 = ~a & ~b & ~c;                 // pattern 000
  const t1 = ~a & ~b &  c;                 // pattern 001
  const t2 = ~a &  b & ~c;                 // pattern 010
  const t3 = ~a &  b &  c;                 // pattern 011
  const t4 =  a & ~b & ~c;                 // pattern 100
  const t5 =  a & ~b &  c;                 // pattern 101
  const t6 =  a &  b & ~c;                 // pattern 110
  const t7 =  a &  b &  c;                 // pattern 111

  let out = 0;
  if (mask & 0b00000001) out |= t0;
  if (mask & 0b00000010) out |= t1;
  if (mask & 0b00000100) out |= t2;
  if (mask & 0b00001000) out |= t3;
  if (mask & 0b00010000) out |= t4;
  if (mask & 0b00100000) out |= t5;
  if (mask & 0b01000000) out |= t6;
  if (mask & 0b10000000) out |= t7;

  return out >>> 0;                        // keep as unsigned 32-bit
}
