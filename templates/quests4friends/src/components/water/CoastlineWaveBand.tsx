import { useRef } from 'react';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { WaterCoastlineShader, WaterCoastlineProps } from './WaterCoastlineShader';

export type CoastlineWaveBandProps = Partial<WaterCoastlineProps> & {
  worldSize: number;
  bandWidth?: number; // width of the strip that dips into water
  tiltDegrees?: number; // tilt away from land
  amplitude?: number; // bobbing vertical amplitude
  speed?: number; // bobbing speed multiplier
};

/**
 * Renders four narrow, slightly tilted water strips around the world's edges.
 * Each strip bobs up/down and can boost foam intensity to simulate crashing.
 */
export function CoastlineWaveBand({
  worldSize,
  bandWidth = 2.0,
  tiltDegrees = 6,
  amplitude = 0.25,
  speed = 1.0,
  ...shaderProps
}: CoastlineWaveBandProps) {
  const northRef = useRef<THREE.Mesh>(null);
  const southRef = useRef<THREE.Mesh>(null);
  const eastRef = useRef<THREE.Mesh>(null);
  const westRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock, size }) => {
    const t = clock.getElapsedTime() * speed;
    const phase = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    const refs = [northRef, southRef, eastRef, westRef];
    refs.forEach((ref, i) => {
      const mesh = ref.current;
      if (!mesh) return;
      // Bobbing motion with slight per-edge phase shift
      const baseY = mesh.userData.baseY ?? mesh.position.y;
      mesh.userData.baseY = baseY;
      mesh.position.y = baseY + Math.sin(t + phase[i]) * amplitude;

      // Optional: boost foam intensity near peaks (access shader material uniforms)
      const mat = mesh.material as THREE.ShaderMaterial | undefined;
      const uniforms = mat?.uniforms as any;
      if (uniforms && uniforms.uFoamIntensity) {
        const peakBoost = 0.2 + 0.8 * Math.max(0, Math.sin(t + phase[i]));
        uniforms.uFoamIntensity.value = (shaderProps.foamIntensity ?? 0.9) * (0.8 + 0.2 * peakBoost);
        // Pass resolution for vignette stability when used outside full scene
        if (uniforms.uResolution) uniforms.uResolution.value.set(size.width, size.height);
        if (uniforms.uTime) uniforms.uTime.value = t;
      }
    });
  });

  const half = worldSize / 2;
  const tilt = THREE.MathUtils.degToRad(tiltDegrees);
  const foamProps: WaterCoastlineProps = {
    shorelineBlend: shaderProps.shorelineBlend ?? 2.0,
    foamIntensity: shaderProps.foamIntensity ?? 1.0,
    waveHeight: shaderProps.waveHeight ?? 0.12,
    distortionStrength: shaderProps.distortionStrength ?? 0.25,
    // Shader speed driven by material uniform tick above; leave default
    color: shaderProps.color ?? '#4aa0d8',
    deepColor: shaderProps.deepColor ?? '#0b1b2c',
    shallowColor: shaderProps.shallowColor ?? '#2d6ea4',
    foamColor: shaderProps.foamColor ?? '#e8f7ff',
    backgroundMode: false,
    transparent: true,
  };

  return (
    <>
      {/* North edge */}
      <Plane ref={northRef} args={[worldSize, bandWidth, 1, 1]} position={[0, -1.0, half + bandWidth * 0.5]} rotation={[-Math.PI / 2 + tilt, 0, 0]}>
        <WaterCoastlineShader {...foamProps} />
      </Plane>
      {/* South edge */}
      <Plane ref={southRef} args={[worldSize, bandWidth, 1, 1]} position={[0, -1.0, -(half + bandWidth * 0.5)]} rotation={[-Math.PI / 2 - tilt, Math.PI, 0]}>
        <WaterCoastlineShader {...foamProps} />
      </Plane>
      {/* East edge */}
      <Plane ref={eastRef} args={[worldSize, bandWidth, 1, 1]} position={[half + bandWidth * 0.5, -1.0, 0]} rotation={[-Math.PI / 2 + tilt, Math.PI / 2, 0]}>
        <WaterCoastlineShader {...foamProps} />
      </Plane>
      {/* West edge */}
      <Plane ref={westRef} args={[worldSize, bandWidth, 1, 1]} position={[-(half + bandWidth * 0.5), -1.0, 0]} rotation={[-Math.PI / 2 - tilt, -Math.PI / 2, 0]}>
        <WaterCoastlineShader {...foamProps} />
      </Plane>
    </>
  );
}
