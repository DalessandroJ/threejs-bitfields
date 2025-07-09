// src/config.js
export const GRID_DIMS = { x: 512, y: 96, z: 512 }; //big flat square
//export const GRID_DIMS = { x: 128, y: 256, z: 128 };  //standard 1x2x1 tower
//export const GRID_DIMS = { x: 61, y: 137, z: 501 };  //random
export const CELL_SIZE = 1;
export const STATES_RANGE = [16, 32];
export const TRANSPARENT_FACTOR = [0.51, 5]; // multiplier for transparent states
export const PALETTE_JSON = './masterPalettes.json';
export const USE_POST_FX = true;
export const USE_GPU_VOXEL_MESH = true;