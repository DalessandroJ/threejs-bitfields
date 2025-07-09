// src/voxel/mesh/gpu.js
import * as THREE from 'three';
import vertSrc from '../../shaders/voxelRaymarch.vert.glsl.js';
import fragSrc from '../../shaders/voxelRaymarch.frag.glsl.js';


export function createGPUVoxelMesh({
  instances,
  palette,
  gridDims,
  dimY,
  cellSize,
  renderer,
  scene,
  camera
}) {
  if (!renderer.capabilities.isWebGL2) return null;

  /*─────────────────────────────────────────────────────────
   1. Flatten voxel data → two Uint8 volumes
  ─────────────────────────────────────────────────────────*/
  const W = gridDims.x;
  const H = gridDims.y;
  const D = gridDims.z;

  const N = W * H * D;

  const occArr = new Uint8Array(N);
  const idArr = new Uint8Array(N);
  const hex2idx = Object.fromEntries(palette.map((h, i) => [h, i]));

  for (const { x, y, z, color } of instances) {
    const idx = x + y * W + z * W * H;
    occArr[idx] = 1;
    idArr[idx] = hex2idx[color] ?? 0;
  }

  const occTex = new THREE.Data3DTexture(occArr, W, H, D);
  occTex.format = THREE.RedIntegerFormat;
  occTex.type = THREE.UnsignedByteType;
  occTex.minFilter = occTex.magFilter = THREE.NearestFilter;
  occTex.unpackAlignment = 1;
  occTex.needsUpdate = true;

  const idTex = new THREE.Data3DTexture(idArr, W, H, D);
  idTex.format = THREE.RedIntegerFormat;
  idTex.type = THREE.UnsignedByteType;
  idTex.minFilter = idTex.magFilter = THREE.NearestFilter;
  idTex.unpackAlignment = 1;
  idTex.needsUpdate = true;

  /*─────────────────────────────────────────────────────────
   2. Volume bounds + palette colors
  ─────────────────────────────────────────────────────────*/
  const volMin = new THREE.Vector3(
    -(W / 2) * cellSize,
    -(H / 2) * cellSize,
    -(D / 2) * cellSize
  );
  const volMax = volMin.clone().add(new THREE.Vector3(W, H, D).multiplyScalar(cellSize));
  /* ---- palette as fixed-size Float32Array ------------------- */
  const MAX_PALETTE = 64;                          // keep in sync with shader
  const paletteBuf = new Float32Array(MAX_PALETTE * 3);

  palette.forEach((hex, i) => {
    const c = new THREE.Color(hex);
    paletteBuf[i * 3 + 0] = c.r;
    paletteBuf[i * 3 + 1] = c.g;
    paletteBuf[i * 3 + 2] = c.b;
  });
  // zeroes in the remaining slots == black “unused” colors

  /*─────────────────────────────────────────────────────────
   3. Full-screen triangle geometry
  ─────────────────────────────────────────────────────────*/
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position',
    new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));

  /*─────────────────────────────────────────────────────────
   4. Ray-march material
  ─────────────────────────────────────────────────────────*/
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    uniforms: {
      uOccTex: { value: occTex },
      uIdTex: { value: idTex },
      uPalette: { value: paletteBuf },
      uPaletteLen: { value: palette.length },
      uCamPos: { value: camera.position },
      uInvProj: { value: new THREE.Matrix4() },
      uViewInv: { value: new THREE.Matrix4() },
      uVolMin: { value: volMin },
      uVolMax: { value: volMax },
      uVolumeDim: { value: new THREE.Vector3(W, H, D) },
      uResolution: {
        value: new THREE.Vector2(
          renderer.domElement.width,
          renderer.domElement.height
        )
      },
      uCellSize: { value: cellSize },
      uStepSize: { value: 0.125 },
      uMaxSteps: { value: 4096 },
      uLightDir: { value: new THREE.Vector3(0.35, -1, 0.45).normalize() },
      uAmbientTerm: { value: 0.2 },
      uDiffuseTerm: { value: 0.8 }
    },
    vertexShader: vertSrc,
    fragmentShader: fragSrc
  });

  return new THREE.Mesh(tri, mat);
}
