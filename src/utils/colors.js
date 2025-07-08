// src/utils/colors.js
import { randomInt } from './utils.js';

// just don't pick the same color for bg and ground plane
export function pickTwoDistinct(palette) {
  const bg = palette[randomInt(0, palette.length - 1)];
  let ground;
  do { ground = palette[randomInt(0, palette.length - 1)]; }
  while (ground === bg);
  return { bg, ground };
}
