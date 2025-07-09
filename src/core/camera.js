// src/core/camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GRID_DIMS, CELL_SIZE } from '../config.js';

export function createCamera(rendererDom) {
  const aspect = innerWidth / innerHeight;
  const cam = new THREE.PerspectiveCamera(75, aspect, 0.1, 1); // far set below

  // grid extents in world units
  const sizeX = GRID_DIMS.x * CELL_SIZE;
  const sizeY = GRID_DIMS.y * CELL_SIZE;
  const sizeZ = GRID_DIMS.z * CELL_SIZE;

  const radius = 0.5 * Math.sqrt(sizeX ** 2 + sizeY ** 2 + sizeZ ** 2);

  /* place camera on a pleasant diagonal */
  const k = 2;                              // distance = k · radius
  const dir = new THREE.Vector3(1, 0.6, 1).normalize();
  cam.position.copy(dir).multiplyScalar(k * radius);

  cam.near = 0.1;
  cam.far  = radius * 6;
  cam.updateProjectionMatrix();

  const controls = new OrbitControls(cam, rendererDom);
  controls.target.set(0, 0, 0);               // center of voxel grid
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.update();

  return { cam, controls };
}
