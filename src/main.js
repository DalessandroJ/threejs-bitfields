// src/main.js

import * as THREE from 'three';
import { createRenderer, createScene } from './core/sceneSetup.js';
import { addLights } from './core/lights.js';
import { createCamera } from './core/camera.js';
import { loadPalettes, pickPalette } from './utils/paletteLoader.js';
import { pickTwoDistinct } from './utils/colors.js';
import { buildShadowResources } from './core/shadow.js';
import { buildVoxelWorld } from './voxel/world.js';
import { GRID_DIM } from './config.js';           // <─ NEW

/* ───────────────────────── CSV helpers ─────────────────────────── */

function exportGridCSV({ name, colors, transparent, filled, total,
    gridDim, dimY, patternFn }) {
    const header = [
        `palette_name,${name}`,
        `palette_colors,${colors.join(',')}`,
        `transparent,${transparent}`,
        `filled,${filled}`,
        `total_states,${total}`,
        '',
        'x,y,z,state'
    ];


    /* rows – X major, then Y, then Z – skip transparent, write palette index */
    const rows = [];

    for (let x = 0; x < gridDim; ++x)
        for (let y = 0; y < dimY; ++y)
            for (let z = 0; z < gridDim; ++z) {
                const s = patternFn(x, y, z);
                if (s < transparent) continue;          // skip transparent voxels

                const paletteIdx = s - transparent;     // 0 … (filled-1)
                rows.push(`${x},${y},${z},${paletteIdx}`);
            }

    const blob = new Blob([header.concat(rows).join('\n')],
        { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_${gridDim}x${dimY}x${gridDim}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function enableCsvExport(meta) {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'o' || e.key === 'O') {
            exportGridCSV(meta);
            console.log('CSV exported');
        }
    });
}

/* ───────────────────────── main ────────────────────────────────── */

async function init() {

    /* A. palette & colours ---------------------------------------- */
    const master = await loadPalettes();
    const { filled, transparent, palette } = pickPalette(master);
    const { bg: bgColor, ground: groundColor } = pickTwoDistinct(palette);

    /* B. renderer / scene / camera -------------------------------- */
    const renderer = createRenderer(bgColor);
    const scene = await createScene(groundColor, renderer);
    addLights(scene);
    const sun = scene.userData.sun;
    const { cam, controls } = createCamera(renderer.domElement);

    /* C. shadow map resources ------------------------------------- */
    const { depthTex, lightMatrix } =
        buildShadowResources(renderer, scene, sun);

    /* D. build voxel world  (← must return { mesh, patternFn }) --- */
    const { mesh, patternFn } = buildVoxelWorld({
        filled, transparent, palette,
        renderer, scene, camera: cam,
        depthTex, lightMatrix
    });

    /* E. hot-key: “O” → CSV download ------------------------------ */
    enableCsvExport({
        name: palette.name ?? 'palette',
        colors: palette,
        transparent,
        filled,
        total: filled + transparent,
        gridDim: GRID_DIM,
        dimY: GRID_DIM * 2,
        patternFn
    });

    console.log(`${transparent} Transparent | ${filled} Colors | ${filled + transparent} Total States`);

    /* F. render loop ---------------------------------------------- */
    (function animate() {
        requestAnimationFrame(animate);
        controls.update();

        if ('uniforms' in mesh.material) {
            mesh.material.uniforms.uInvProj.value
                .copy(cam.projectionMatrix).invert();
            mesh.material.uniforms.uViewInv.value
                .copy(cam.matrixWorld);
        }
        renderer.render(scene, cam);
    })();
}

init();
