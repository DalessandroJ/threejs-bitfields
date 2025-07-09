export default /* glsl */`
precision highp float;
precision highp usampler3D;

#define MAX_PALETTE 64

uniform usampler3D uOccTex;
uniform usampler3D uIdTex;
uniform vec3       uPalette[MAX_PALETTE];
uniform int        uPaletteLen;

uniform vec3       uCamPos;
uniform mat4       uInvProj;
uniform mat4       uViewInv;
uniform vec3       uVolMin;
uniform vec3       uVolMax;
uniform vec3       uVolumeDim;
uniform vec2       uResolution;
uniform float      uCellSize;
uniform float      uStepSize;
uniform int        uMaxSteps;
uniform vec3       uLightDir;
uniform float      uAmbientTerm;
uniform float      uDiffuseTerm;

out vec4 fragColor;

float sOcc(ivec3 v){
  return texelFetch(uOccTex, v, 0).r == 1u ? 1.0 : -1.0;
}

float maxf(float a,float b){return a>b?a:b;}
float minf(float a,float b){return a<b?a:b;}

void main(){
  /* --- reconstruct ray in world space -------------------------------- */
  vec2 uv  = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
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
  if (tFar < maxf(tNear, 0.0)) discard;

  /* --- march ---------------------------------------------------------- */
  float t = maxf(tNear, 0.0);
  for (int i = 0; i < uMaxSteps; ++i) {
    if (t > tFar) break;

    vec3  p     = ro + rd * t;
    vec3  local = (p - uVolMin) / uCellSize;
    ivec3 vox   = ivec3(floor(local));
    uint  occ   = texelFetch(uOccTex, vox, 0).r;

    if (occ == 1u) {
      /* --------- six-tap unsigned gradient --------------------------- */
      float x0 = float(texelFetch(uOccTex, vox - ivec3(1,0,0), 0).r);
      float x1 = float(texelFetch(uOccTex, vox + ivec3(1,0,0), 0).r);
      float y0 = float(texelFetch(uOccTex, vox - ivec3(0,1,0), 0).r);
      float y1 = float(texelFetch(uOccTex, vox + ivec3(0,1,0), 0).r);
      float z0 = float(texelFetch(uOccTex, vox - ivec3(0,0,1), 0).r);
      float z1 = float(texelFetch(uOccTex, vox + ivec3(0,0,1), 0).r);

      vec3 normal = normalize(vec3(x1 - x0, y1 - y0, z1 - z0));

      /* --------- Lambert diffuse ------------------------------------- */
      float diff = max(dot(normal, normalize(uLightDir)), 0.0);

      /* --------- colour ---------------------------------------------- */
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
