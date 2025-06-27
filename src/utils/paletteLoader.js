// src/paletteLoader.js
import { randomInt } from './utils.js';
import {
    STATES_RANGE,
    TRANSPARENT_FACTOR,
    PALETTE_JSON
} from '../config.js';

export async function loadPalettes() {
    const resp = await fetch(PALETTE_JSON);
    return await resp.json();
}

export function pickPalette(masterPalettes) {
    const [min, max] = STATES_RANGE;
    const filled = randomInt(min, max);
    const transparent = Math.floor(
        Math.random() * (filled * (TRANSPARENT_FACTOR[1] - TRANSPARENT_FACTOR[0])) +
        filled * TRANSPARENT_FACTOR[0]
    );

    const list = masterPalettes[filled] || [];
    const chosen = list.length
        ? list[randomInt(0, list.length - 1)]
        : { colors: [] };

    console.log(`Palette: ${chosen.name}`);

    // **normalize** each entry to start with '#'
    const palette = chosen.colors.map(c =>
        c.startsWith('#') ? c : `#${c}`
    );

    return { filled, transparent, palette };
}
