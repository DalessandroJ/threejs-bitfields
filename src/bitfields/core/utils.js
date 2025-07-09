// src/core/utils.js
import { STATES_RANGE, TRANSPARENT_FACTOR, PALETTE_JSON } from '../config.js';

// simple random helpers
export function randomInt(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
    if (min > max) [min, max] = [max, min];
    return Math.random() * (max - min) + min;
}

// palette stuff
// load all palettes from masterPalettes.json file
export async function loadPalettes() {
    const resp = await fetch(PALETTE_JSON);
    return await resp.json();
}

export function pickPalette(masterPalettes) {
    const [min, max] = STATES_RANGE;
    const filled = randomInt(min, max);
    const transparent = randomInt(
        Math.floor(filled * TRANSPARENT_FACTOR[0]),
        Math.floor(filled * TRANSPARENT_FACTOR[1])
    );

    // get all palettes with this many colors
    const list = masterPalettes[filled] || [];
    // and pick the palette randomly from that list
    const chosen = list[randomInt(0, list.length - 1)];
    console.log(`Palette: ${chosen.name}`);

    // make sure each color string in the palette starts with '#'
    const palette = chosen.colors.map(c => (c.startsWith('#') ? c : `#${c}`));

    return {
        filled,
        transparent,
        palette: palette,        // color array
        paletteName: chosen.name // the name of the palette
    };

}

// pick two different colors from the palette
export function pickTwoDistinct(palette) {
    const bg = palette[randomInt(0, palette.length - 1)];
    let ground;
    do {
        ground = palette[randomInt(0, palette.length - 1)];
    } while (ground === bg);
    return { bg, ground };
}