// src/utils/paletteLoader.js
import { randomInt } from './utils.js';
import { STATES_RANGE, TRANSPARENT_FACTOR, PALETTE_JSON } from '../config.js';

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
    const palette = chosen.colors.map(c =>
        c.startsWith('#') ? c : `#${c}`
    );

    return { filled, transparent, palette };
}
