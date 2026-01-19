import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * WaterCoastlineShader
 * A lightweight, mobile-friendly ShaderMaterial that recreates the visual feel of the Shadertoy reference
 * without copying code. Implements: multi-layer FBM noise, UV warping, shoreline foam, Fresnel edge, gradients, ripples.
 */
export type WaterCoastlineProps = {
  color?: THREE.ColorRepresentation;
  deepColor?: THREE.ColorRepresentation;
  shallowColor?: THREE.ColorRepresentation;
  foamColor?: THREE.ColorRepresentation;
  speed?: number;
  waveHeight?: number;
  distortionStrength?: number;
  foamIntensity?: number;
  shorelineBlend?: number; // width of foam band near shoreline in world units
  backgroundMode?: boolean; // if true, tone down foam/highlights
  transparent?: boolean;
};

const DEFAULT_PROPS: Required<Omit<WaterCoastlineProps, 'transparent'>> = {
  color: '#4aa0d8',
  deepColor: '#0b1b2c',
  shallowColor: '#2d6ea4',
  foamColor: '#e8f7ff',
  speed: 1.0,
  waveHeight: 0.12,
  distortionStrength: 0.3,
  foamIntensity: 0.8,
  shorelineBlend: 2.5,
  backgroundMode: false,
};

type UniformBundle = {
  uTime: { value: number };
  uResolution: { value: THREE.Vector2 };
  uBaseColor: { value: THREE.Color };
  uDeepColor: { value: THREE.Color };
  uShallowColor: { value: THREE.Color };
  uFoamColor: { value: THREE.Color };
  uSpeed: { value: number };
  uWaveHeight: { value: number };
  uDistortion: { value: number };
  uFoamIntensity: { value: number };
  uShorelineBlend: { value: number };
  uBackgroundMode: { value: number };
};

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorld = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uBaseColor;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform float uSpeed;
  uniform float uWaveHeight;
  uniform float uDistortion;
  uniform float uFoamIntensity;
  uniform float uShorelineBlend;
  uniform float uBackgroundMode;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 78.233);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.55;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      sum += amp * noise(p * freq);
      freq *= 2.07;
      amp *= 0.55;
    }
    return sum;
  }

  void main() {
    vec2 uv = vUv * 3.0;
    float t = uTime * uSpeed;
    vec2 flowDir = vec2(0.17, 0.11);

    vec2 warped = uv;
    warped += uDistortion * vec2(fbm(uv * 0.7 + t * 0.15), fbm(uv * 0.8 - t * 0.2));
    warped += flowDir * t * 0.25;

    float height1 = fbm(warped * 1.2 + t * 0.3);
    float height2 = fbm(warped * 2.4 - t * 0.45);
    float height3 = fbm(warped * 0.6 + t * 0.12);
    float waveHeight = (height1 * 0.5 + height2 * 0.35 + height3 * 0.15);

    float ripple = sin((uv.x + uv.y) * 6.0 + t * 2.5) * 0.02;
    float wave = waveHeight * uWaveHeight + ripple;

    float depthMask = smoothstep(0.0, 1.0, waveHeight);
    vec3 waterColor = mix(uShallowColor, uDeepColor, depthMask);
    waterColor = mix(waterColor, uBaseColor, 0.35);

    vec3 N = normalize(vec3(0.0, 1.0, 0.0));
    vec3 V = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    float shoreDist = clamp(vWorld.y / max(uShorelineBlend, 0.0001), -2.0, 2.0);
    float foamBand = smoothstep(1.0, 0.0, abs(shoreDist));
    float foamNoise = fbm(uv * 4.0 + t * 0.6);
    float foam = foamBand * (0.6 + 0.4 * foamNoise);
    foam *= uFoamIntensity;
    foam *= mix(1.0, 0.4, uBackgroundMode);

    vec3 lightDir = normalize(vec3(0.3, 0.9, 0.2));
    float spec = pow(max(dot(reflect(-lightDir, N), V), 0.0), 32.0) * 0.25;

    vec3 color = waterColor;
    color += fresnel * 0.25 * waterColor;
    color += spec;
    color = mix(color, uFoamColor, foam);

    vec2 screenUV = gl_FragCoord.xy / uResolution.xy;
    float vignette = smoothstep(0.0, 0.2, screenUV.x) * smoothstep(1.0, 0.8, screenUV.x) *
                     smoothstep(0.0, 0.2, screenUV.y) * smoothstep(1.0, 0.8, screenUV.y);
    color *= mix(1.0, 0.92, vignette);

    gl_FragColor = vec4(color, 1.0 - (0.3 * uBackgroundMode));
  }
`;

function buildUniforms(props: WaterCoastlineProps): UniformBundle {
  const merged = { ...DEFAULT_PROPS, ...props };
  return {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uBaseColor: { value: new THREE.Color(merged.color) },
    uDeepColor: { value: new THREE.Color(merged.deepColor) },
    uShallowColor: { value: new THREE.Color(merged.shallowColor) },
    uFoamColor: { value: new THREE.Color(merged.foamColor) },
    uSpeed: { value: merged.speed },
    uWaveHeight: { value: merged.waveHeight },
    uDistortion: { value: merged.distortionStrength },
    uFoamIntensity: { value: merged.foamIntensity },
    uShorelineBlend: { value: merged.shorelineBlend },
    uBackgroundMode: { value: merged.backgroundMode ? 1 : 0 },
  };
}

export function WaterCoastlineShader({
  color = DEFAULT_PROPS.color,
  deepColor = DEFAULT_PROPS.deepColor,
  shallowColor = DEFAULT_PROPS.shallowColor,
  foamColor = DEFAULT_PROPS.foamColor,
  speed = DEFAULT_PROPS.speed,
  waveHeight = DEFAULT_PROPS.waveHeight,
  distortionStrength = DEFAULT_PROPS.distortionStrength,
  foamIntensity = DEFAULT_PROPS.foamIntensity,
  shorelineBlend = DEFAULT_PROPS.shorelineBlend,
  backgroundMode = DEFAULT_PROPS.backgroundMode,
  transparent = true,
}: WaterCoastlineProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTime = useMemo(() => performance.now() / 1000, []);

  const uniforms = useMemo(
    () =>
      buildUniforms({
        color,
        deepColor,
        shallowColor,
        foamColor,
        speed,
        waveHeight,
        distortionStrength,
        foamIntensity,
        shorelineBlend,
        backgroundMode,
      }),
    [backgroundMode, color, deepColor, distortionStrength, foamColor, foamIntensity, shallowColor, shorelineBlend, speed, waveHeight]
  );

  useFrame(({ clock, size }) => {
    if (!materialRef.current) return;
    uniforms.uTime.value = clock.getElapsedTime() - startTime;
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <shaderMaterial
      ref={materialRef}
      attach="material"
      uniforms={uniforms}
      vertexShader={VERTEX_SHADER}
      fragmentShader={FRAGMENT_SHADER}
      transparent={transparent}
    />
  );
}

// -------------------- Loader helper for Vib3r3D --------------------
// Lightweight helper to load a world GLTF (Blender-exported) and add a water plane sized to the world.
// Usage: await attachWaterForWorld(scene, '/Assets/world.glb', { size: 200 })
export type WaterAttachOptions = {
  size: number;
  elevation?: number;
  shorelineBlend?: number;
  shaderProps?: Partial<WaterCoastlineProps>;
};

export function createWaterPlaneMesh({ size, elevation = 0, shorelineBlend = 2.5, shaderProps = {} }: WaterAttachOptions) {
  const uniforms = buildUniforms({ ...shaderProps, shorelineBlend });
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: shaderProps.transparent ?? true,
  });

  // Imperative ticking function for non-R3F usage
  material.userData.tick = (elapsed: number, width = 1, height = 1) => {
    uniforms.uTime.value = elapsed;
    uniforms.uResolution.value.set(width, height);
  };

  const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = elevation;
  mesh.name = 'WaterPlane';
  return mesh;
}

export async function attachWaterForWorld(
  scene: THREE.Scene,
  gltfPath: string,
  options: WaterAttachOptions,
  gltfLoader: GLTFLoader = new GLTFLoader()
): Promise<THREE.Mesh> {
  await gltfLoader.loadAsync(gltfPath);
  const mesh = createWaterPlaneMesh(options);
  scene.add(mesh);
  return mesh;
}
