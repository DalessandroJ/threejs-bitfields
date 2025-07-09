// src/voxel/world.js
import * as THREE from 'three';
import { GRID_DIMS, CELL_SIZE } from '../config.js';
import { createPatternFn } from './patterns.js';
import { createVoxelMesh } from './mesh/factory.js';

/* helper – generate voxel instances */
function voxelsFromPattern(dimX, dimY, dimZ, patternFn, transparent, palette) {
  const list = [];
  for (let x = 0; x < dimX; x++)
    for (let y = 0; y < dimY; y++)
      for (let z = 0; z < dimZ; z++) {
        const state = patternFn(x, y, z);
        if (state < transparent) continue;
        const idx = Math.max(0, Math.min(state - transparent, palette.length - 1));
        list.push({ x, y, z, color: palette[idx] });
      }
  return list;
}

export function buildVoxelWorld({
  filled, transparent, palette,
  renderer, scene, camera,
  depthTex, lightMatrix
}) {
  /* random offsets */
  const offsets = [
    Math.random() * GRID_DIMS.x * GRID_DIMS.z,
    Math.random() * GRID_DIMS.x * GRID_DIMS.z,
    Math.random() * GRID_DIMS.x * GRID_DIMS.z
  ];

  const patternFn = createPatternFn(offsets, filled + transparent);

  const instances = voxelsFromPattern(
    GRID_DIMS.x,
    GRID_DIMS.y,
    GRID_DIMS.z,
    patternFn,
    transparent,
    palette
  );

  console.log(`Total instances: ${instances.length.toLocaleString()}`);

  const mesh = createVoxelMesh(
    instances,
    new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
    new THREE.MeshStandardMaterial({ vertexColors: true }),
    renderer,
    scene,
    palette,
    camera,
    depthTex,
    lightMatrix
  );

  scene.add(mesh);
  return { mesh, patternFn, instanceCount: instances.length };
}