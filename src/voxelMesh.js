// src/voxelMesh.js
import { USE_GPU_VOXEL_MESH, GRID_DIM, CELL_SIZE } from './config.js';
import { createInstancedMesh } from './instancedMesh.js';
import { createGPUVoxelMesh } from './gpuVoxelMesh.js';

/**
 * Chooses GPU or CPU path based on config.
 * @returns THREE.Mesh
 */
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
        // Pass the real palette and grid dimensions
        const mesh = createGPUVoxelMesh({
            instances,
            palette,
            gridDim: GRID_DIM,       // your X & Z size
            dimY: GRID_DIM * 2,      // your Y size
            cellSize: CELL_SIZE,
            renderer,
            scene,
            camera,
            shadowMap,
            lightMatrix
        });
        if (mesh) return mesh;
        console.warn('Falling back to CPU instancing');
    }
    return createInstancedMesh(instances, geometry, material);
}
