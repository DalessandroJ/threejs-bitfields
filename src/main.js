import * as THREE from 'three';
import { createRenderer, createScene } from './core/sceneSetup.js';
import { addLights } from './core/lights.js';
import { createCamera } from './core/camera.js';
import { loadPalettes, pickPalette } from './utils/paletteLoader.js';
import { pickTwoDistinct } from './utils/colors.js';
import { buildShadowResources } from './core/shadow.js';
import { buildVoxelWorld } from './voxel/world.js';

//Load resources, build scene, enter render loop. shrimple as that

async function init() {
    // palettes
    const master = await loadPalettes();
    const { filled, transparent, palette } = pickPalette(master);
    const { bg: bgColor, ground: groundColor } = pickTwoDistinct(palette);

    // renderer / scene / camera
    const renderer = createRenderer(bgColor);
    const scene = await createScene(groundColor, renderer);
    addLights(scene);
    const sun = scene.userData.sun;
    const { cam, controls } = createCamera(renderer.domElement);

    // shadow resources (depthTex + lightMatrix)
    const { depthTex, lightMatrix } =
        buildShadowResources(renderer, scene, sun);

    // voxel world (returns the mesh so we can poke uniforms)
    const mesh = buildVoxelWorld({
        filled, transparent, palette,
        renderer, scene, camera: cam,
        depthTex, lightMatrix
    });

    console.log(`${transparent} Transparent | ${filled} Colors | ${filled + transparent} Total States`);

    // optional post FX
    // const composer = setupPostProcessing(renderer, scene, cam);

    // render loop
    (function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // update camera-dependent uniforms if GPU path
        if ('uniforms' in mesh.material) {
            mesh.material.uniforms.uInvProj.value
                .copy(cam.projectionMatrix).invert();
            mesh.material.uniforms.uViewInv.value
                .copy(cam.matrixWorld);
        }

        renderer.render(scene, cam);
        // composer && composer.render();
    })();
}

init();
