// src/voxel/mesh/createVoxelMesh.js

import { createGPUVoxelMesh } from './gpu.js';
import { createInstancedMesh } from './instanced.js';
import { USE_GPU_VOXEL_MESH, GRID_DIMS, CELL_SIZE } from '../../config.js';


export function createVoxelMesh(
    instances,
    geometry,
    material,
    renderer,
    scene,
    palette,
    camera,
    shadowMap,
    lightMatrix
) {
    if (USE_GPU_VOXEL_MESH) {
        const mesh = createGPUVoxelMesh({
            instances,
            palette,
            gridDims: GRID_DIMS,
            cellSize: CELL_SIZE,
            renderer,
            scene,
            camera,
            shadowMap,
            lightMatrix
        });
        if (mesh) return mesh;
        console.warn('GPU path unavailable, falling back to CPU instancing');
    }
    return createInstancedMesh(instances, geometry, material);
}
