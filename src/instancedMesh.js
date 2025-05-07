// src/instancedMesh.js
import * as THREE from 'three';
import { GRID_DIM, CELL_SIZE } from './config.js';

export function createInstancedMesh(instances, geometry, material) {
  // 1) Turn on vertexColors + instancing in the stock shader
  material.vertexColors = true;
  material.defines         = material.defines || {};
  material.defines.USE_INSTANCING       = '';
  material.defines.USE_INSTANCING_COLOR = '';

  // 2) Patch in instanceColor → vColor (your one-liner)
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <color_vertex>',
      `#include <color_vertex>
       vColor = instanceColor;`
    );
  };
  material.needsUpdate = true;

  // 3) Build the InstancedMesh
  const count = instances.length;
  const mesh  = new THREE.InstancedMesh(geometry, material, count);
  mesh.castShadow    = true;
  mesh.receiveShadow = true;
  
  // 4) Create & attach static instanceColor buffer
  const colorAttr = new THREE.InstancedBufferAttribute(
    new Float32Array(count * 3),
    3
  );
  // **static** hint:
  colorAttr.setUsage(THREE.StaticDrawUsage);
  mesh.instanceColor = colorAttr;

  // 5) Now grab the raw arrays (instanceMatrix is automatically created)
  const matArr = mesh.instanceMatrix.array;   // count * 16 floats
  const colArr = mesh.instanceColor.array;    // count *  3 floats

  // 6) One pass: write all matrices + colors
  const tmp = new THREE.Object3D();
  const col = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const { x, y, z, color: hex } = instances[i];

    // 6a) matrix
    tmp.position.set(
      (x - GRID_DIM/2) * CELL_SIZE,
      (y - GRID_DIM/2) * CELL_SIZE,
      (z - GRID_DIM/2) * CELL_SIZE
    );
    tmp.updateMatrix();
    tmp.matrix.toArray(matArr, i * 16);

    // 6b) color
    col.set(hex).toArray(colArr, i * 3);
  }

  // 7) Flag for ONE upload to GPU
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate  = true;

  return mesh;
}
