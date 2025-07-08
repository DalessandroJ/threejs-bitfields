// src/core/postProcessing.js
// this is unused for now

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { GRID_DIM } from '../config.js';

/**
 * Initializes EffectComposer with:
 *  • RenderPass (base scene)
 *  • UnrealBloomPass (bloom/glow)
 *  • BokehPass (depth-of-field)
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene}         scene
 * @param {THREE.Camera}        camera
 * @returns {EffectComposer}
 */
export function setupPostProcessing(renderer, scene, camera) {
    // 1) composer
    const composer = new EffectComposer(renderer);

    // 2) render the scene first
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // // 3) bloom: threshold, strength, radius
    // const bloomPass = new UnrealBloomPass(
    //     new THREE.Vector2(window.innerWidth, window.innerHeight),
    //     0.2,  // strength
    //     0.2,  // radius
    //     0.99  // threshold
    // );
    //composer.addPass(bloomPass);

    // 4) depth-of-field (bokeh) settings
    const bokehPass = new BokehPass(scene, camera, {
        focus: GRID_DIM,    // focal distance
        aperture: .00005,  // smaller = deeper DOF, larger = blurrier
        maxblur: .01    // max blur strength
    });
    composer.addPass(bokehPass);

    // 5) handle resizing
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        composer.setSize(w, h);
        bloomPass.setSize(w, h);
    });

    return composer;
}
