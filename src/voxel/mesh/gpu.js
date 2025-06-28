// src/gpu.js
import * as THREE from 'three';

export function createGPUVoxelMesh({
  instances,
  palette,
  gridDim,
  dimY,
  cellSize,
  renderer,
  scene,
  camera,
  shadowMap,    // THREE.DepthTexture
  lightMatrix   // THREE.Matrix4
}) {
  if (!renderer.capabilities.isWebGL2) return null;

  const W = gridDim, H = dimY, D = gridDim;
  const N = W * H * D;

  // 1) Build flat occupancy & color-ID arrays
  const occArr = new Uint8Array(N);
  const idArr  = new Uint8Array(N);
  const hexToIndex = Object.fromEntries(palette.map((h,i) => [h,i]));
  for (let v of instances) {
    const idx = v.x + v.y*W + v.z*W*H;
    occArr[idx] = 1;
    idArr[idx]  = hexToIndex[v.color] || 0;
  }

  // 2) Upload to Data3DTextures
  const occTex = new THREE.Data3DTexture(occArr, W, H, D);
  occTex.format          = THREE.RedIntegerFormat;
  occTex.type            = THREE.UnsignedByteType;
  occTex.minFilter       = occTex.magFilter = THREE.NearestFilter;
  occTex.unpackAlignment = 1;
  occTex.needsUpdate     = true;

  const idTex = new THREE.Data3DTexture(idArr, W, H, D);
  idTex.format          = THREE.RedIntegerFormat;
  idTex.type            = THREE.UnsignedByteType;
  idTex.minFilter       = idTex.magFilter = THREE.NearestFilter;
  idTex.unpackAlignment = 1;
  idTex.needsUpdate     = true;

  // 3) Compute world‐space bounds
  const volMin = new THREE.Vector3(
    - (gridDim/2) * cellSize,
    - (dimY   /2) * cellSize,
    - (gridDim/2) * cellSize
  );
  const volMax = volMin.clone().add(
    new THREE.Vector3(W, H, D).multiplyScalar(cellSize)
  );

  // 4) Full-screen triangle
  const triGeo = new THREE.BufferGeometry();
  triGeo.setAttribute('position',
    new THREE.BufferAttribute(new Float32Array([-1,-1,0, 3,-1,0, -1,3,0]), 3)
  );

  // 5) Palette → THREE.Color[]
  const paletteColors = palette.map(h => new THREE.Color(h));

  // 6) Ray-march material
  const rayMarchMat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      uOccTex:      { value: occTex },
      uIdTex:       { value: idTex },
      uPalette:     { value: paletteColors },
      uCamPos:      { value: camera.position },
      uInvProj:     { value: new THREE.Matrix4() },
      uViewInv:     { value: new THREE.Matrix4() },
      uVolMin:      { value: volMin },
      uVolMax:      { value: volMax },
      uVolumeDim:   { value: new THREE.Vector3(W, H, D) },
      uCellSize:    { value: cellSize },
      uStepSize:    { value: 0.125 },
      uMaxSteps:    { value: 4096 },
      uLightDir:    { value: new THREE.Vector3(0.5,-1,0.7).normalize() },
      uAmbientTerm: { value: 0.33 },
      uDiffuseTerm: { value: 0.8 },
      uShadowMap:   { value: shadowMap },
      uLightMatrix: { value: lightMatrix },
      uShadowBias:  { value: 0.005 }
    },
    depthTest:  false,
    depthWrite: false,
    transparent: true,
    vertexShader: `
precision highp float;
in vec3 position;
void main(){
  gl_Position = vec4(position,1.0);
}`,

    fragmentShader: `
precision highp float;
precision highp usampler3D;

uniform usampler3D uOccTex;
uniform usampler3D uIdTex;
uniform vec3        uPalette[${paletteColors.length}];
uniform vec3        uCamPos;
uniform mat4        uInvProj;
uniform mat4        uViewInv;
uniform vec3        uVolMin;
uniform vec3        uVolMax;
uniform vec3        uVolumeDim;
uniform float       uCellSize;
uniform float       uStepSize;
uniform int         uMaxSteps;
uniform vec3        uLightDir;
uniform float       uAmbientTerm;
uniform float       uDiffuseTerm;
uniform sampler2D   uShadowMap;
uniform mat4        uLightMatrix;
uniform float       uShadowBias;

out vec4 fragColor;

// helpers
float minf(float a,float b){return a<b?a:b;}
float maxf(float a,float b){return a>b?a:b;}

void main(){
  // 1) Reconstruct ray
  vec2 uv = (gl_FragCoord.xy / vec2(${renderer.domElement.width}.0, ${renderer.domElement.height}.0)) * 2.0 - 1.0;
  vec4 ndc = vec4(uv,-1.0,1.0);
  vec4 vp  = uInvProj * ndc; vp /= vp.w;
  vec3 rd  = normalize((uViewInv * vec4(vp.xyz,0.0)).xyz);
  vec3 ro  = uCamPos;

  // 2) Ray-AABB intersect
  vec3 invD = 1.0/rd;
  vec3 t0s  = (uVolMin - ro)*invD;
  vec3 t1s  = (uVolMax - ro)*invD;
  vec3 tmin = min(t0s,t1s);
  vec3 tmax = max(t0s,t1s);
  float tNear = maxf(maxf(tmin.x,tmin.y),tmin.z);
  float tFar  = minf(minf(tmax.x,tmax.y),tmax.z);
  if(tFar < maxf(tNear,0.0)) discard;

  // 3) March
  float t = maxf(tNear,0.0);
  for(int i=0; i<uMaxSteps; ++i){
    if(t>tFar) break;
    vec3 p = ro + rd*t;
    vec3 local = (p - uVolMin) / uCellSize;
    ivec3 vox = ivec3(floor(local));
    uint occ = texelFetch(uOccTex, vox, 0).r;
    if(occ==1u){
      // 4) Hit → color, normal, lighting, shadow
      uint cid = texelFetch(uIdTex, vox, 0).r;
      vec3 base = uPalette[int(cid)];

      // normal via gradient
      float x0 = float(texelFetch(uOccTex, vox-ivec3(1,0,0),0).r);
      float x1 = float(texelFetch(uOccTex, vox+ivec3(1,0,0),0).r);
      float y0 = float(texelFetch(uOccTex, vox-ivec3(0,1,0),0).r);
      float y1 = float(texelFetch(uOccTex, vox+ivec3(0,1,0),0).r);
      float z0 = float(texelFetch(uOccTex, vox-ivec3(0,0,1),0).r);
      float z1 = float(texelFetch(uOccTex, vox+ivec3(0,0,1),0).r);
      vec3 normal = normalize(vec3(x1-x0, y1-y0, z1-z0));

      // lambertian
      float diff = max(dot(normal, normalize(uLightDir)), 0.0);

      // shadow lookup
      vec4 smP = uLightMatrix * vec4(p,1.0);
      vec3 proj = smP.xyz/smP.w*0.5 + 0.5;
      float dMap = texture(uShadowMap, proj.xy).r;
      float visibility = (proj.z - uShadowBias > dMap) ? 0.2 : 1.0;

      vec3 color = base * (uAmbientTerm + uDiffuseTerm * diff * visibility);
      fragColor = vec4(color,1.0);
      return;
    }
    t += uStepSize;
  }

  // miss → discard
  discard;
}`
  });

  return new THREE.Mesh(triGeo, rayMarchMat);
}
