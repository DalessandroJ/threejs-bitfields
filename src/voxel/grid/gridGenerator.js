// src/gridGenerator.js
export function generateInstances(dimY, gridDim, patternFn, transparent, palette) {
    const list = [];
    for (let x = 0; x < gridDim; x++) for (let y = 0; y < dimY; y++) for (let z = 0; z < gridDim; z++) {
        const state = patternFn(x, y, z);
        if (state < transparent) continue;
        const idx = Math.min(Math.max(state - transparent, 0), palette.length - 1);
        list.push({ x, y, z, color: palette[idx] });
    }
    return list;
}
