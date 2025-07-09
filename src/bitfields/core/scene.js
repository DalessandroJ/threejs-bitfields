// src/core/scene.js
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';
import { GRID_DIMS, CELL_SIZE } from '../config.js';

export async function createScene(groundColor = '#333333', renderer) {
  const scene = new THREE.Scene();

  /* HDRI */
  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const hdr = await new RGBELoader()
    .setDataType(THREE.HalfFloatType)
    .loadAsync('assets/hdr/puresky.hdr');

  scene.background  = null;
  scene.environment = pmrem.fromEquirectangular(hdr).texture;
  hdr.dispose(); pmrem.dispose();

  /* ground */
  const span  = Math.max(GRID_DIMS.x, GRID_DIMS.z);
  const plane = new THREE.PlaneGeometry(span * CELL_SIZE * 3, span * CELL_SIZE * 3);
  const mat   = new THREE.MeshStandardMaterial({ color: new THREE.Color(groundColor) });
  const mesh  = new THREE.Mesh(plane, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = (-GRID_DIMS.y * CELL_SIZE) / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  scene.userData.ground = mesh;
  return scene;
}
