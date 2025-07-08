// src/core/lights.js
import * as THREE from 'three';
import { GRID_DIM, CELL_SIZE } from '../config.js';

export function addLights(scene) {
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const sun = new THREE.DirectionalLight(0xffffff, 8);
    sun.position.set(GRID_DIM * 0.5, GRID_DIM * 2, GRID_DIM * 1.5);
    sun.castShadow = true;

    const d = GRID_DIM * CELL_SIZE * 2;
    Object.assign(sun.shadow.camera, {
        left: -d,
        right: d,
        top: d,
        bottom: -d,
        near: 0.5,
        far: GRID_DIM * CELL_SIZE * 5
    });
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.updateProjectionMatrix();

    sun.shadow.autoUpdate = false;
    sun.shadow.needsUpdate = true; //but do it once

    scene.add(sun);
    scene.userData.sun = sun;
}
