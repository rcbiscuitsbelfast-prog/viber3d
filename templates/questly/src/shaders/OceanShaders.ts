// Ocean and Skybox Shaders based on Three.js-Ocean-Scene
// https://github.com/Nugget8/Three.js-Ocean-Scene

export const oceanVertexShader = /*glsl*/`
  uniform float time;
  uniform float waveStrength;
  uniform float waveSpeed;
  uniform float rippleScale;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  // Noise function for waves
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    vUv = uv;
    
    // Animate waves in vertex shader
    vec3 pos = position;
    float speed = time * waveSpeed * 0.5;
    
    // Apply ripple scale to UV for controlling ripple frequency
    vec2 scaledUV = uv * rippleScale;
    
    // Multiple wave layers with varying frequencies - higher frequency for visible ripples
    float wave1 = noise(scaledUV * 0.5 + vec2(speed * 0.8, speed * 0.6)) * 2.0 - 1.0;
    float wave2 = noise(scaledUV * 1.2 - vec2(speed * 0.5, speed * 0.9)) * 2.0 - 1.0;
    float wave3 = noise(scaledUV * 3.0 + vec2(speed * 1.2, speed * 0.3)) * 2.0 - 1.0;
    float wave4 = noise(scaledUV * 6.0 + vec2(speed * 0.6, speed * 1.1)) * 2.0 - 1.0;
    
    // Combine waves - significantly increased amplitude for visible ocean movement
    float displacement = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.2 + wave4 * 0.1) * waveStrength * 15.0;
    // PlaneGeometry creates vertices in XY plane (z=0). After rotation [-PI/2, 0, 0]:
    // The plane lies flat on XZ plane in world space
    // Local Y → World Z, Local Z → World -Y
    // To displace upward (world +Y), we need to make local Z negative: pos.z -= displacement
    pos.z -= displacement;
    
    // Calculate normals for ripple visibility
    float d = 0.1;
    float h1 = (noise((scaledUV + vec2(d, 0.0)) * 0.5 + vec2(speed * 0.8, speed * 0.6)) * 2.0 - 1.0) * 0.4
             + (noise((scaledUV + vec2(d, 0.0)) * 1.2 - vec2(speed * 0.5, speed * 0.9)) * 2.0 - 1.0) * 0.3;
    float h2 = (noise((scaledUV + vec2(0.0, d)) * 0.5 + vec2(speed * 0.8, speed * 0.6)) * 2.0 - 1.0) * 0.4
             + (noise((scaledUV + vec2(0.0, d)) * 1.2 - vec2(speed * 0.5, speed * 0.9)) * 2.0 - 1.0) * 0.3;
    
    // Calculate tangent and bitangent for normal calculation (plane rotated, so adjust accordingly)
    vec3 tangent = normalize(vec3(1.0, (h1 - wave1 * 0.6 - wave2 * 0.3) * waveStrength * 15.0, 0.0));
    vec3 bitangent = normalize(vec3(0.0, (h2 - wave1 * 0.6 - wave2 * 0.3) * waveStrength * 15.0, 1.0));
    vec3 calculatedNormal = normalize(cross(bitangent, tangent));
    
    vNormal = normalize(normalMatrix * calculatedNormal);
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const oceanFragmentShader = /*glsl*/`
  uniform float time;
  uniform vec3 sunDirection;
  uniform vec3 waterColor;
  uniform float waveStrength;
  uniform float waveSpeed;
  uniform float specularStrength;
  uniform float transparency;
  uniform float rippleScale;
  
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  // Simple noise function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  vec3 getNormal() {
    // Use rippleScale for controlling ripple frequency on surface
    float scale = 5.0 * waveStrength * rippleScale;
    float speed = time * waveSpeed * 0.1;
    
    // Add more ripple layers for better detail
    vec2 uv1 = vUv * scale + vec2(speed, 0.0);
    vec2 uv2 = vUv * scale * 0.7 + vec2(0.0, speed * 0.8);
    vec2 uv3 = vUv * scale * 2.5 + vec2(speed * 0.5, speed * 0.5);
    
    float n1 = noise(uv1);
    float n2 = noise(uv2);
    float n3 = noise(uv3);
    
    vec3 normal = vNormal;
    normal.x += (n1 - 0.5) * 0.5 + (n3 - 0.5) * 0.2;
    normal.z += (n2 - 0.5) * 0.5 + (n3 - 0.5) * 0.2;
    
    return normalize(normal);
  }
  
  void main() {
    vec3 normal = getNormal();
    
    // Fresnel effect
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    
    // Specular reflection
    vec3 halfDir = normalize(sunDirection + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 100.0) * specularStrength;
    
    // Water color with depth
    vec3 waterShallow = waterColor * 1.5;
    vec3 waterDeep = waterColor * 0.3;
    vec3 finalColor = mix(waterDeep, waterShallow, fresnel);
    
    // Add specular highlights
    finalColor += vec3(1.0) * specular;
    
    // Output with transparency
    gl_FragColor = vec4(finalColor, transparency);
  }
`;

export const skyboxVertexShader = /*glsl*/`
  varying vec3 vWorldPosition;
  varying vec3 vDirection;
  
  void main() {
    vWorldPosition = position;
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const skyboxFragmentShader = /*glsl*/`
  uniform float time;
  uniform vec3 sunDirection;
  uniform float sunIntensity;
  uniform vec3 skyColorDay;
  uniform vec3 skyColorHorizon;
  uniform vec3 skyColorNight;
  uniform float timeOfDay; // 0-1, where 0.5 is noon
  
  varying vec3 vDirection;
  
  const float PI = 3.14159265359;
  
  void main() {
    vec3 dir = normalize(vDirection);
    
    // Sky gradient based on height
    float heightFactor = max(dir.y, 0.0);
    float horizonFactor = pow(1.0 - heightFactor, 2.0);
    
    // Time of day blending
    float dayNightBlend = smoothstep(0.2, 0.35, timeOfDay) * (1.0 - smoothstep(0.65, 0.8, timeOfDay));
    
    // Base sky color
    vec3 daySky = mix(skyColorHorizon, skyColorDay, heightFactor);
    vec3 nightSky = mix(skyColorNight * 0.8, skyColorNight, heightFactor);
    vec3 skyColor = mix(nightSky, daySky, dayNightBlend);
    
    // Sunset/sunrise colors
    float sunsetFactor = max(
      smoothstep(0.15, 0.25, timeOfDay) * (1.0 - smoothstep(0.25, 0.35, timeOfDay)),
      smoothstep(0.65, 0.75, timeOfDay) * (1.0 - smoothstep(0.75, 0.85, timeOfDay))
    );
    vec3 sunsetColor = vec3(1.0, 0.6, 0.3);
    skyColor = mix(skyColor, sunsetColor, horizonFactor * sunsetFactor);
    
    // Sun
    float sunDot = max(dot(dir, sunDirection), 0.0);
    float sun = pow(sunDot, 2000.0) * 5.0 * sunIntensity;
    vec3 sunGlow = vec3(1.0, 0.95, 0.9) * sun;
    
    // Sun halo
    float halo = pow(sunDot, 100.0) * 0.3 * sunIntensity;
    sunGlow += vec3(1.0, 0.8, 0.6) * halo;
    
    // Stars (simple)
    float stars = 0.0;
    if (dayNightBlend < 0.3) {
      vec3 starDir = dir * 100.0;
      float starNoise = fract(sin(dot(floor(starDir.xy), vec2(12.9898, 78.233))) * 43758.5453);
      stars = step(0.998, starNoise) * (1.0 - dayNightBlend * 3.0) * step(0.1, dir.y);
    }
    
    vec3 finalColor = skyColor + sunGlow + vec3(stars);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
