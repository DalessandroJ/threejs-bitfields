// src/app.js
import * as THREE from 'three';

import { createRenderer } from './core/renderer.js';
import { createScene } from './core/scene.js';
import { addLights } from './core/lights.js';
import { createCamera } from './core/camera.js';
import {
    loadPalettes,
    pickPalette,
    pickTwoDistinct
} from './core/utils.js';

import { buildVoxelWorld } from './bitfield/world.js';
import { GRID_DIMS, CELL_SIZE } from './config.js';

export default class App {
    constructor({ debug = true, container = document.body } = {}) {
        this.debug = debug;        // dev helpers on/off
        this.container = container;    // where to inject the canvas
    }

    /* -------------------------------------------------------------- */
    async start() {
        /* A. palette --------------------------------------------------- */
        const master = await loadPalettes();
        this._masterPalettes = master;
        const { filled, transparent, palette, paletteName } = pickPalette(master);
        const { bg: bgColor, ground: groundColor } = pickTwoDistinct(palette);

        /* B. renderer / scene / camera -------------------------------- */
        this.renderer = createRenderer(bgColor);
        this.container.appendChild(this.renderer.domElement);

        this.scene = await createScene(groundColor, this.renderer);
        addLights(this.scene, this.renderer);

        const { cam, controls } = createCamera(this.renderer.domElement);
        this.camera = cam;
        this.controls = controls;

        /* baked shadow from lights.js -------------------------------- */
        const { shadowDepth, lightMatrix } = this.scene.userData;

        /* C. voxel world ---------------------------------------------- */
        const { mesh, patternFn, instanceCount } = buildVoxelWorld({
            filled, transparent, palette,
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera,
            depthTex: shadowDepth,
            lightMatrix
        });

        this.mesh = mesh;
        this._patternFn = patternFn;
        this._instanceCnt = instanceCount;
        this._filled = filled;
        this._transparent = transparent;
        this._paletteName = paletteName;
        this._paletteColors = palette;

        console.log(
            `${transparent} Transparent | ${filled} Colors | ${filled + transparent} Total States`
        );

        /* D. “O” hot-key for CSV export ------------------------------- */
        if (this.debug) {
            window.addEventListener('keydown', e => {
                if (e.key === 'o' || e.key === 'O') this.exportCSV();
            });
        }

        /* E. resize handler ------------------------------------------- */
        window.addEventListener('resize', () => this.onResize());
        this.onResize();                                    // call once

        /* F. render loop ---------------------------------------------- */
        this.renderer.setAnimationLoop(() => this.render());
    }

    /* -------------------------------------------------------------- */
    render() {
        this.controls.update();

        // update camera matrices for GPU shader
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

        if (this.mesh.material.uniforms?.uResolution) {
            this.mesh.material.uniforms.uResolution.value.set(w, h);
        }
    }

    /* ===== PUBLIC ENGINE API ====================================== */

    /** Adjust grid dimensions and rebuild world */
    setGridDims(newDims) {
        Object.assign(GRID_DIMS, newDims);

        // ---- update ground plane ----
        const g = this.scene.userData.ground;
        if (g) {
            // scale geometry in X/Z
            const newSize = Math.max(GRID_DIMS.x, GRID_DIMS.z) * CELL_SIZE * 3;
            g.geometry.dispose();
            g.geometry = new THREE.PlaneGeometry(newSize, newSize);

            // move to new bottom
            g.position.y = -(GRID_DIMS.y * CELL_SIZE) / 2;
        }
        // -----------------------------

        this.rebuildWorld();
        this.onResize();
    }

    /** Pick an entirely new palette & pattern, keep current grid dims */
    async regenerate() {
        // 1) pick a new palette
        const { filled, transparent, palette, paletteName } =
            pickPalette(this._masterPalettes);

        this._filled = filled;
        this._transparent = transparent;
        this._paletteColors = palette;
        this._paletteName = paletteName;

        // choose new bg + ground colors
        const { bg: bgColor, ground: groundColor } = pickTwoDistinct(palette);

        // 2) update renderer clear color
        this.renderer.setClearColor(bgColor);

        // 3) update ground plane colour (and ensure it’s still at correct height)
        const ground = this.scene.userData.ground;
        if (ground) {
            ground.material.color.set(groundColor);
            ground.position.y = -(GRID_DIMS.y * CELL_SIZE) / 2;
        }

        // 4) rebuild the voxel mesh with new palette & pattern
        this.rebuildWorld();
    }


    /** Download CSV for current pattern */
    exportCSV() {
        this.exportGridCSV({
            paletteName: this._paletteName,
            colors: this._paletteColors,
            transparent: this._transparent,
            filled: this._filled,
            total: this._filled + this._transparent,
            patternFn: this._patternFn
        });
    }


    /** Stats object for React UI */
    getStats() {
        return {
            paletteName: this._paletteName,
            filled: this._filled,
            transparent: this._transparent,
            totalStates: this._filled + this._transparent,
            instanceCnt: this._instanceCnt ?? 0
        };
    }



    /* ===== INTERNAL ============================================== */

    /** Dispose old mesh and build a fresh voxel world */
    rebuildWorld() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        const { mesh, patternFn, instanceCount } = buildVoxelWorld({
            filled: this._filled,
            transparent: this._transparent,
            palette: this._paletteColors,
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera,
            depthTex: this.scene.userData.shadowDepth,
            lightMatrix: this.scene.userData.lightMatrix
        });

        this.mesh = mesh;
        this._patternFn = patternFn;
        this._instanceCnt = instanceCount;
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

        const blob = new Blob([header.concat(rows).join('\n')],
            { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
            `${paletteName}_${GRID_DIMS.x}x${GRID_DIMS.y}x${GRID_DIMS.z}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
