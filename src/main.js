// src/main.js
import * as THREE from 'three';
import { createRenderer, createScene } from './sceneSetup.js';
import { addLights } from './lights.js';
import { createCamera } from './camera.js';
import { loadPalettes, pickPalette } from './paletteLoader.js';
import { createPatternFn } from './patterns.js';
import { generateInstances } from './gridGenerator.js';
import { createInstancedMesh } from './instancedMesh.js';
import { GRID_DIM, CELL_SIZE } from './config.js';
import { randomInt, cullHiddenVoxels } from './utils.js';
import { setupPostProcessing } from './postProcessing.js';


//things to consider doing:
//chunking the instanced meshes so we can do frustum culling and occlusion culling
//neighbor checking each cell to not draw any that have all face neighbors present (you cant see that voxel anyway)
//greedy meshing while preserving colors


async function init() {
    const master = await loadPalettes();
    const { filled, transparent, palette } = pickPalette(master);

    //get two random colors from the palette
    const bgColor = palette[randomInt(0, palette.length - 1)];
    const groundColor = palette[randomInt(0, palette.length - 1)];
    //use them to set the background and ground colors
    const renderer = createRenderer(bgColor);
    const scene = await createScene(groundColor, renderer);
    addLights(scene);

    const { cam, controls } = createCamera(renderer.domElement);
    const offsets = [
        Math.random() * GRID_DIM * GRID_DIM,
        Math.random() * GRID_DIM * GRID_DIM,
        Math.random() * GRID_DIM * GRID_DIM
    ];
    const patternFn = createPatternFn(offsets, filled + transparent);

    const instances = generateInstances(GRID_DIM * 2, GRID_DIM, patternFn, transparent, palette);
    // cull fully‐buried voxels
    const visible = cullHiddenVoxels(instances);
    console.log(
        `Total instances: ${instances.length.toLocaleString()} | ` +
        `Rendered surface voxels: ${visible.length.toLocaleString()} → ` +
        `culled ${(instances.length - visible.length).toLocaleString()} hidden voxels`
    );
    scene.add(createInstancedMesh(visible,
        new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
        new THREE.MeshStandardMaterial({ vertexColors: true, envMapIntensity: 0.1 })
    ));

    // — post-processing —
    //const composer = setupPostProcessing(renderer, scene, cam);

    (function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, cam);
        //composer.render();
    })();

    console.log(`${transparent} Transparent | ${filled} Colors | ${filled + transparent} Total States`);
    console.log(palette);
}

init();
