// src/core/renderer.js
import * as THREE from 'three';

/**
 * Builds and configures WebGLRenderer.
 * @param {string|number} backgroundColor
 * @returns {THREE.WebGLRenderer}
 */
export function createRenderer(backgroundColor = '#202020') {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(new THREE.Color(backgroundColor));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    document.body.appendChild(renderer.domElement);
    return renderer;
}
