// src/utils/colors.js
import { randomInt } from './utils.js';

export function pickTwoDistinct(palette) {
  const bg = palette[randomInt(0, palette.length - 1)];
  let ground;
  do { ground = palette[randomInt(0, palette.length - 1)]; }
  while (ground === bg);
  return { bg, ground };
}
