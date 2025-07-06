// src/voxel/mesh/gpu.js
import * as THREE from 'three';

export function createGPUVoxelMesh({
  instances,
  palette,
  gridDim,
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
  const W = gridDim, H = dimY, D = gridDim;
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
    -(gridDim / 2) * cellSize,
    -(dimY / 2) * cellSize,
    -(gridDim / 2) * cellSize
  );
  const volMax = volMin.clone().add(new THREE.Vector3(W, H, D).multiplyScalar(cellSize));
  const paletteRGB = palette.map(h => new THREE.Color(h));

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
      uPalette: { value: paletteRGB },
      uCamPos: { value: camera.position },
      uInvProj: { value: new THREE.Matrix4() },
      uViewInv: { value: new THREE.Matrix4() },
      uVolMin: { value: volMin },
      uVolMax: { value: volMax },
      uVolumeDim: { value: new THREE.Vector3(W, H, D) },
      uCellSize: { value: cellSize },
      uStepSize: { value: 0.125 },
      uMaxSteps: { value: 4096 },
      uLightDir: { value: new THREE.Vector3(0.35, -1, 0.45).normalize() },
      uAmbientTerm: { value: 0.2 },
      uDiffuseTerm: { value: 0.8 }
    },

    vertexShader: /* glsl */`
in vec3 position;
void main(){ gl_Position = vec4(position,1.0); }`,

    fragmentShader: /* glsl */`
precision highp float;
precision highp usampler3D;

uniform usampler3D uOccTex;
uniform usampler3D uIdTex;
uniform vec3       uPalette[${paletteRGB.length}];
uniform vec3       uCamPos;
uniform mat4       uInvProj;
uniform mat4       uViewInv;
uniform vec3       uVolMin;
uniform vec3       uVolMax;
uniform vec3       uVolumeDim;
uniform float      uCellSize;
uniform float      uStepSize;
uniform int        uMaxSteps;
uniform vec3       uLightDir;
uniform float      uAmbientTerm;
uniform float      uDiffuseTerm;

out vec4 fragColor;

// signed occupancy (+1 solid, -1 empty)
float sOcc(ivec3 v){
  return texelFetch(uOccTex, v, 0).r == 1u ? 1.0 : -1.0;
}

float maxf(float a,float b){return a>b?a:b;}
float minf(float a,float b){return a<b?a:b;}

void main(){
  /* --- reconstruct ray in world space -------------------------------- */
  vec2 uv  = (gl_FragCoord.xy / vec2(${renderer.domElement.width}.0,
                                     ${renderer.domElement.height}.0)) * 2.0 - 1.0;
  vec4 ndc = vec4(uv, -1.0, 1.0);
  vec4 vp  = uInvProj * ndc;        vp /= vp.w;
  vec3 rd  = normalize((uViewInv * vec4(vp.xyz, 0.0)).xyz);
  vec3 ro  = uCamPos;

  /* --- ray-AABB clip -------------------------------------------------- */
  vec3 invD = 1.0 / rd;
  vec3 t0s  = (uVolMin - ro) * invD;
  vec3 t1s  = (uVolMax - ro) * invD;
  vec3 tmin = min(t0s, t1s);
  vec3 tmax = max(t0s, t1s);
  float tNear = maxf(maxf(tmin.x, tmin.y), tmin.z);
  float tFar  = minf(minf(tmax.x, tmax.y), tmax.z);
  if(tFar < maxf(tNear, 0.0)) discard;

  /* --- march ---------------------------------------------------------- */
  float t = maxf(tNear, 0.0);
  for(int i=0;i<uMaxSteps;++i){
    if(t > tFar) break;

    vec3 p      = ro + rd * t;
    vec3 local  = (p - uVolMin) / uCellSize;
    ivec3 vox   = ivec3(floor(local));
    uint  occ   = texelFetch(uOccTex, vox, 0).r;

    if(occ == 1u){
    /* --------- six-tap unsigned gradient normal ----------------------- */
    float x0 = float(texelFetch(uOccTex, vox - ivec3(1,0,0), 0).r);
    float x1 = float(texelFetch(uOccTex, vox + ivec3(1,0,0), 0).r);
    float y0 = float(texelFetch(uOccTex, vox - ivec3(0,1,0), 0).r);
    float y1 = float(texelFetch(uOccTex, vox + ivec3(0,1,0), 0).r);
    float z0 = float(texelFetch(uOccTex, vox - ivec3(0,0,1), 0).r);
    float z1 = float(texelFetch(uOccTex, vox + ivec3(0,0,1), 0).r);

    vec3 normal = normalize(vec3(x1 - x0, y1 - y0, z1 - z0));

    /* --------- Lambert diffuse --------------------------------------- */
    float diff = max(dot(normal, normalize(uLightDir)), 0.0);

    /* --------- colour (gamma-corrected, no self-shadow yet) ----------- */
    uint cid   = texelFetch(uIdTex, vox, 0).r;
    vec3 base  = uPalette[int(cid)] * 1.05;
    vec3 color = base * (uAmbientTerm + uDiffuseTerm * diff);
    color      = pow(color, vec3(1.0 / 2.2));

    fragColor = vec4(color, 1.0);
    return;
    }
    t += uStepSize;
  }

  discard;
}`
  });

  return new THREE.Mesh(tri, mat);
}
