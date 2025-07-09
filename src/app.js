// src/app.js
import * as THREE from 'three';
import { createRenderer } from './core/renderer.js';
import { createScene } from './core/scene.js';
import { addLights } from './core/lights.js';
import { createCamera } from './core/camera.js';
import { loadPalettes, pickPalette, pickTwoDistinct } from './core/utils.js';
import { buildVoxelWorld } from './bitfield/world.js';
import { GRID_DIMS } from './config.js';

export default class App {
    constructor({ debug = true } = {}) {
        this.debug = debug;               // dev helpers on/off
    }

    async start() {
        /* A. palette --------------------------------------------------- */
        const master = await loadPalettes();
        const { filled, transparent, palette } = pickPalette(master);
        const { bg: bgColor, ground: groundColor } = pickTwoDistinct(palette);

        /* B. renderer / scene / camera -------------------------------- */
        this.renderer = createRenderer(bgColor);
        this.scene = await createScene(groundColor, this.renderer);
        addLights(this.scene, this.renderer);
        const { cam, controls } = createCamera(this.renderer.domElement);
        this.camera = cam;
        this.controls = controls;

        /* baked shadow from lights.js */
        const { shadowDepth, lightMatrix } = this.scene.userData;

        /* C. voxel world ---------------------------------------------- */
        const { mesh, patternFn } = buildVoxelWorld({
            filled, transparent, palette,
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera,
            depthTex: shadowDepth,
            lightMatrix
        });
        this.mesh = mesh;

        console.log(
            `${transparent} Transparent | ${filled} Colors | ${filled + transparent} Total States`
        );

        /* D. dev hot-key: export CSV ---------------------------------- */
        if (this.debug) {
            window.addEventListener('keydown', e => {
                if (e.key === 'o' || e.key === 'O') this.exportGridCSV({
                    paletteName: palette.name ?? 'palette',
                    colors: palette,
                    transparent,
                    filled,
                    total: filled + transparent,
                    patternFn
                });
            });
        }

        /* E. resize handler ------------------------------------------- */
        window.addEventListener('resize', () => this.onResize());
        this.onResize(); // call once

        /* F. render loop ---------------------------------------------- */
        this.renderer.setAnimationLoop(() => this.render());
    }

    /* -------------------------------------------------------------- */
    render() {
        this.controls.update();

        // update camera matrices for GPU voxel shader
        if ('uniforms' in this.mesh.material) {
            const uni = this.mesh.material.uniforms;
            uni.uInvProj.value.copy(this.camera.projectionMatrix).invert();
            uni.uViewInv.value.copy(this.camera.matrixWorld);
        }

        this.renderer.render(this.scene, this.camera);

    }

    /* -------------------------------------------------------------- */
    onResize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        // inform shader of new resolution
        if (this.mesh.material.uniforms.uResolution) {
            this.mesh.material.uniforms.uResolution.value.set(w, h);
        }

    }

    /* -------------------------------------------------------------- */
    exportGridCSV({ paletteName, colors,
        transparent, filled, total, patternFn }) {
        const header = [
            `palette_name,${paletteName}`,
            `palette_colors,${colors.join(',')}`,
            `transparent,${transparent}`,
            `filled,${filled}`,
            `total_states,${total}`,
            '',
            'x,y,z,state'
        ];

        const rows = [];

        for (let x = 0; x < GRID_DIMS.x; ++x)
            for (let y = 0; y < GRID_DIMS.y; ++y)
                for (let z = 0; z < GRID_DIMS.z; ++z) {
                    const s = patternFn(x, y, z);
                    if (s < transparent) continue;
                    rows.push(`${x},${y},${z},${s - transparent}`);
                }

        const blob = new Blob([header.concat(rows).join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paletteName}_${GRID_DIMS.x}x${GRID_DIMS.y}x${GRID_DIMS.z}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
