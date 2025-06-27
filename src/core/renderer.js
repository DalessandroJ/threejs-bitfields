// core/renderer.js
import * as THREE from 'three';

export function createRenderer(bg = '#202020') {
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setClearColor(bg);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(r.domElement);

    return r;
}
