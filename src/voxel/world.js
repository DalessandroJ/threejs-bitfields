// src/voxel/world.js
import * as THREE from 'three';
import { GRID_DIM, CELL_SIZE } from '../config.js';
import { createPatternFn } from './grid/patterns.js';
import { generateInstances } from './grid/gridGenerator.js';
import { createVoxelMesh } from './mesh/index.js';

/**
 * Generates pattern, voxels and returns the populated mesh.
 */
export function buildVoxelWorld({
    filled, transparent, palette,
    renderer, scene, camera,
    depthTex, lightMatrix
}) {
    // random offsets per axis
    const offsets = Array.from({ length: 3 },
        () => Math.random() * GRID_DIM * GRID_DIM);

    const patternFn = createPatternFn(offsets, filled + transparent);

    const instances = generateInstances(
        GRID_DIM * 2, GRID_DIM,
        patternFn, transparent, palette
    );

    console.log(`Total instances: ${instances.length.toLocaleString()}`);

    const mesh = createVoxelMesh(
        instances,
        new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
        new THREE.MeshStandardMaterial({ vertexColors: true }),
        renderer, scene, palette, camera,
        depthTex, lightMatrix
    );

    scene.add(mesh);
    return mesh;
}
