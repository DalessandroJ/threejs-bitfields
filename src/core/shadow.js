// src/core/shadow.js
import * as THREE from 'three';

/**
 * Builds a depth-only shadow render target from the sun’s POV
 * and returns both the depth texture and the 4×4 light matrix.
 */
export function buildShadowResources(renderer, scene, sun, size = 2048) {
    const depthTex = new THREE.DepthTexture(size, size, THREE.UnsignedShortType);
    depthTex.format = THREE.DepthFormat;
    depthTex.minFilter = depthTex.magFilter = THREE.NearestFilter;
    depthTex.compareMode = THREE.CompareRefToTexture; // enables sampler2DShadow

    const rt = new THREE.WebGLRenderTarget(size, size);
    rt.depthTexture = depthTex;
    rt.texture.minFilter = rt.texture.magFilter = THREE.NearestFilter;

    // render once
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, sun.shadow.camera);
    renderer.setRenderTarget(null);

    const lightMatrix = new THREE.Matrix4()
        .multiplyMatrices(sun.shadow.camera.projectionMatrix,
            sun.shadow.camera.matrixWorldInverse);

    return { depthTex, lightMatrix };
}
