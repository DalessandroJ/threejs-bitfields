// src/sceneSetup.js
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';
import { GRID_DIM, CELL_SIZE } from './config.js';

export function createRenderer(backgroundColor = '#202020') {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(backgroundColor));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    document.body.appendChild(renderer.domElement);
    return renderer;
}

export async function createScene(groundColor = '#333333', renderer) {
    const scene = new THREE.Scene();

    // — Load and bake HDRI into a PMREM environment map —
    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const hdrEquirect = await new RGBELoader()
        .setDataType(THREE.HalfFloatType)          // or HalfFloatType for .hdr files
        .loadAsync('assets/hdr/puresky.hdr'); 

    const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
    //scene.environment = envMap;  // PBR reflections
    scene.background = null;     // <— this makes it clear to renderer.clearColor

    hdrEquirect.dispose();
    pmremGenerator.dispose();

    // — Ground plane —
    const planeSize = GRID_DIM * CELL_SIZE * 4;
    const geo = new THREE.PlaneGeometry(planeSize, planeSize);
    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(groundColor)
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -(GRID_DIM / 2 + 0.5) * CELL_SIZE;
    mesh.receiveShadow = true;
    scene.add(mesh);

    return scene;
}
