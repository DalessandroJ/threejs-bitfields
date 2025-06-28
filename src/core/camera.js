// src/camera.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GRID_DIM } from '../config.js';

export function createCamera(rendererDom) {
    const cam = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
    cam.position.set(GRID_DIM * 1.5, GRID_DIM * 0.1, GRID_DIM * 1.5);

    const controls = new OrbitControls(cam, rendererDom);
    controls.target.set(0, GRID_DIM * 0.1, 0);

    //for smooth camera motion
    controls.enableDamping = true;
    controls.dampingFactor = 0.08; // < 0.2


    controls.update();

    return { cam, controls };
}
