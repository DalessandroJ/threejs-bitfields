// src/core/lights.js
import * as THREE from 'three';
import { GRID_DIMS, CELL_SIZE } from '../config.js';

export function addLights(scene, renderer) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const span = Math.max(GRID_DIMS.x, GRID_DIMS.z);
  const sun  = new THREE.DirectionalLight(0xffffff, 8);
  sun.position.set(span * 0.5, GRID_DIMS.y * 2, span * 1.5);
  sun.castShadow = true;

  const d = span * CELL_SIZE * 2;
  Object.assign(sun.shadow.camera, {
    left: -d, right: d, top: d, bottom: -d,
    near: 0.5, far: span * CELL_SIZE * 5
  });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.autoUpdate = false;
  scene.add(sun);

  /* one-time shadow bake */
  const rt = new THREE.WebGLRenderTarget(2048, 2048);
  rt.depthTexture = new THREE.DepthTexture(2048, 2048, THREE.UnsignedShortType);
  rt.depthTexture.format = THREE.DepthFormat;
  rt.texture.minFilter = rt.texture.magFilter = THREE.NearestFilter;

  renderer.setRenderTarget(rt);
  renderer.clear();
  renderer.render(scene, sun.shadow.camera);
  renderer.setRenderTarget(null);

  const lightMatrix = new THREE.Matrix4()
    .multiplyMatrices(
      sun.shadow.camera.projectionMatrix,
      sun.shadow.camera.matrixWorldInverse
    );

  scene.userData.sun         = sun;
  scene.userData.shadowDepth = rt.depthTexture;
  scene.userData.lightMatrix = lightMatrix;

  return sun;
}
