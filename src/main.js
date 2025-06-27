// src/main.js
import * as THREE from 'three';
import { createRenderer, createScene } from './sceneSetup.js';
import { addLights } from './lights.js';
import { createCamera } from './camera.js';
import { loadPalettes, pickPalette } from './paletteLoader.js';
import { createPatternFn } from './patterns.js';
import { generateInstances } from './gridGenerator.js';
import { GRID_DIM, CELL_SIZE } from './config.js';
import { randomInt, cullHiddenVoxels } from './utils.js';
import { setupPostProcessing } from './postProcessing.js';
import { createVoxelMesh } from './voxelMesh.js';

async function init() {
    // 1) load palette & pick states
    const master = await loadPalettes();
    const { filled, transparent, palette } = pickPalette(master);

    // 2) background & ground colors
    const bgColor = palette[randomInt(0, palette.length - 1)];
    const groundColor = palette[randomInt(0, palette.length - 1)];

    // 3) renderer & scene
    const renderer = createRenderer(bgColor);
    const scene = await createScene(groundColor, renderer);
    addLights(scene);
    // 1) After addLights(scene):
    const sun = scene.userData.sun;

    // 2) Create a depth‐only render target
    const SHADOW_MAP_SIZE = 2048;
    const depthTex = new THREE.DepthTexture();
    depthTex.type = THREE.UnsignedShortType;
    depthTex.format = THREE.DepthFormat;
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.magFilter = THREE.NearestFilter;
    // enable hardware depth‐comparison
    depthTex.compareMode = THREE.CompareRefToTexture;

    const shadowRT = new THREE.WebGLRenderTarget(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    shadowRT.depthTexture = depthTex;
    shadowRT.texture.minFilter = THREE.NearestFilter;
    shadowRT.texture.magFilter = THREE.NearestFilter;

    // 3) Render the scene into it from the light’s POV
    renderer.setRenderTarget(shadowRT);
    renderer.clear();
    renderer.render(scene, sun.shadow.camera);
    renderer.setRenderTarget(null);

    // 4) Build the light’s shadow‐matrix
    const lightMatrix = new THREE.Matrix4()
        .multiplyMatrices(
            sun.shadow.camera.projectionMatrix,
            sun.shadow.camera.matrixWorldInverse
        );

    // 4) camera + controls
    const { cam, controls } = createCamera(renderer.domElement);

    // 5) pattern function
    const offsets = [
        Math.random() * GRID_DIM * GRID_DIM,
        Math.random() * GRID_DIM * GRID_DIM,
        Math.random() * GRID_DIM * GRID_DIM
    ];
    const patternFn = createPatternFn(offsets, filled + transparent);

    // 6) generate & cull instances
    const instances = generateInstances(GRID_DIM * 2, GRID_DIM, patternFn, transparent, palette);
    //const visible = cullHiddenVoxels(instances);

    console.log(
        `Total instances: ${instances.length.toLocaleString()} | ` //+
        //`Surface voxels: ${visible.length.toLocaleString()} → ` +
        //`culled ${(instances.length - visible.length).toLocaleString()}`
    );

    // 7) high‐level mesh creation (CPU or GPU)
    const mesh = createVoxelMesh(
        instances,
        new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
        new THREE.MeshStandardMaterial({ vertexColors: true }),
        renderer,
        scene,
        palette,
        cam,
        depthTex,      // depthTexture
        lightMatrix           // 4×4 matrix
    );
    scene.add(mesh);

    // 8) post‐processing (optional)
    // const composer = setupPostProcessing(renderer, scene, cam);

    // 9) render loop
    (function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // update uniforms each frame:
        mesh.material.uniforms.uInvProj.value.copy(cam.projectionMatrix).invert();
        mesh.material.uniforms.uViewInv.value.copy(cam.matrixWorld);


        renderer.render(scene, cam);
        // composer && composer.render();
    })();

    console.log(`${transparent} Transparent | ${filled} Colors | ${filled + transparent} Total States`);
    console.log(palette);
}

init();
