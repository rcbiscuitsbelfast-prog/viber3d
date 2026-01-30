// Volumetric Fog Component (Donut-shaped cloud ring)
// SAVED FOR FUTURE USE - Was working well at normal speed
// To re-enable: Import this component and uncomment the usage in TestWorld.tsx

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// NOTE: This component was saved from TestWorld.tsx
// It was working well at normal speed but had issues with bubbleSpeed = 0
// The AnimatedBubble component has been fixed to properly stop when bubbleSpeed === 0

// Animated Bubble Component
function AnimatedBubble({ 
  baseAngle, 
  radius, 
  baseY, 
  scale, 
  speed, 
  verticalSpeed, 
  cloudTexture, 
  fogColor, 
  opacity,
  bubbleSpeed,
  scaleFactor
}: { 
  baseAngle: number; 
  radius: number; 
  baseY: number; 
  scale: number; 
  speed: number; 
  verticalSpeed: number; 
  cloudTexture: THREE.Texture; 
  fogColor: string; 
  opacity: number;
  bubbleSpeed: number;
  scaleFactor: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(baseAngle);
  const yPosRef = useRef(baseY);
  const verticalPhaseRef = useRef(0); // Phase accumulator for smooth vertical oscillation
  // Clamp radius to scaleFactor * [165, 240]
  const minRadius = 165 * scaleFactor;
  const maxRadius = 240 * scaleFactor;
  const clampedRadius = Math.max(minRadius, Math.min(maxRadius, radius));
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (bubbleSpeed === 0) return;
    const clampedDelta = Math.min(Math.max(delta, 0), 0.1);
    const angleDelta = speed * clampedDelta * bubbleSpeed;
    angleRef.current += angleDelta;
    verticalPhaseRef.current += clampedDelta * 0.01 * bubbleSpeed;
    yPosRef.current = baseY + verticalSpeed * Math.sin(verticalPhaseRef.current) * 0.5 * scaleFactor;
    const x = Math.cos(angleRef.current) * clampedRadius;
    const z = Math.sin(angleRef.current) * clampedRadius;
    const y = yPosRef.current;
    meshRef.current.position.set(x, y, z);
  });
  return (
    <mesh ref={meshRef} renderOrder={1000}>
      <sphereGeometry args={[scale, 16, 16]} />
      <meshBasicMaterial
        map={cloudTexture}
        color={fogColor}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Volumetric Fog Component (Donut-shaped cloud ring)
export function VolumetricFog({ timeOfDay, fogHeight, bubbleScale, bubbleDensity, bubbleSpeed }: { timeOfDay: number; fogHeight: number; bubbleScale: number; bubbleDensity: number; bubbleSpeed: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Clamp and remap slider values for stability
  const safeScale = Math.max(0.1, Math.min(bubbleScale, 2)); // 0.1x to 2x
  const safeDensity = Math.max(0.1, Math.min(bubbleDensity, 3)); // 0.1x to 3x
  const safeSpeed = Math.max(0, Math.min(bubbleSpeed, 1)); // 0 (stopped) to 1 (max)

  // Torus size and thickness scale with safeScale
  const torusRadius = 190 * safeScale;
  const torusTube = 25 * safeScale;
  const torusOuterRadius = 220 * safeScale;
  const torusOuterTube = 20 * safeScale;
  const torusVerticalScale = 0.08 * safeScale;

  // Create noisy cloud texture
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 120 + 60;
      const opacity = Math.random() * 0.4;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 3);
    return texture;
  }, []);

  // Very slow rotation animation for rolling fog effect - use delta time
  useFrame((state, delta) => {
    if (groupRef.current) {
      if (safeSpeed === 0) return;
      const clampedDelta = Math.min(Math.max(delta, 0), 0.1);
      const rotationDelta = clampedDelta * 0.001 * safeSpeed;
      groupRef.current.rotation.y += rotationDelta;
    }
  });

  // Smooth fog color transition from day to night
  const getFogColor = (time: number) => {
    if (time >= 0.25 && time <= 0.75) {
      if (time < 0.35) {
        const t = (time - 0.25) / 0.1;
        return `rgb(${Math.floor(58 + (229-58)*t)}, ${Math.floor(69 + (240-69)*t)}, ${Math.floor(80 + (247-80)*t)})`;
      } else if (time > 0.65) {
        const t = (time - 0.65) / 0.1;
        return `rgb(${Math.floor(229 - (229-58)*t)}, ${Math.floor(240 - (240-69)*t)}, ${Math.floor(247 - (247-80)*t)})`;
      }
      return '#e5f0f7';
    }
    return '#3a4550';
  };
  const fogColor = getFogColor(timeOfDay);

  // Bubble counts and sizes scale with safeDensity and safeScale
  const innerCount = Math.floor(20 * safeDensity);
  const outerCount = Math.floor(40 * safeDensity);
  const detailCount = Math.floor(20 * safeDensity);

  return (
    <group ref={groupRef}>
      {/* Main torus */}
      <mesh position={[0, fogHeight, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, torusVerticalScale]}>
        <torusGeometry args={[torusRadius, torusTube, 24, 48]} />
        <meshBasicMaterial
          map={cloudTexture}
          color={fogColor}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outer torus */}
      <mesh position={[0, fogHeight, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, torusVerticalScale]}>
        <torusGeometry args={[torusOuterRadius, torusOuterTube, 20, 40]} />
        <meshBasicMaterial
          map={cloudTexture}
          color={fogColor}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Inner bubbles */}
      {Array.from({ length: innerCount }).map((_, i) => {
        const totalCount = innerCount;
        const baseAngle = (i / totalCount) * Math.PI * 2;
        const radiusVariation = (170 + (Math.sin(i * 2.5) * 25)) * safeScale;
        const baseY = fogHeight + (Math.random() * 6 * safeScale);
        const scale = (20 + Math.random() * 25) * safeScale;
        return (
          <AnimatedBubble
            key={`inner-${i}`}
            baseAngle={baseAngle}
            radius={radiusVariation}
            baseY={baseY}
            scale={scale}
            speed={(0.0001 + Math.random() * 0.00005) * (0.5 + safeSpeed)}
            verticalSpeed={0.05 * safeScale}
            cloudTexture={cloudTexture}
            fogColor={fogColor}
            opacity={0.5}
            bubbleSpeed={safeSpeed}
            scaleFactor={safeScale}
          />
        );
      })}
      {/* Outer bubbles */}
      {Array.from({ length: outerCount }).map((_, i) => {
        const totalCount = outerCount;
        const baseAngle = (i / totalCount) * Math.PI * 2;
        const radiusVariation = (210 + (Math.sin(i * 1.8) * 35) + Math.random() * 20) * safeScale;
        const baseY = fogHeight + (Math.random() * 8 * safeScale);
        const scale = (25 + Math.random() * 40) * safeScale;
        return (
          <AnimatedBubble
            key={`outer-${i}`}
            baseAngle={baseAngle}
            radius={radiusVariation}
            baseY={baseY}
            scale={scale}
            speed={(0.00008 + Math.random() * 0.00004) * (0.5 + safeSpeed)}
            verticalSpeed={0.05 * safeScale}
            cloudTexture={cloudTexture}
            fogColor={fogColor}
            opacity={0.6}
            bubbleSpeed={safeSpeed}
            scaleFactor={safeScale}
          />
        );
      })}
      {/* Detail bubbles */}
      {Array.from({ length: detailCount }).map((_, i) => {
        const baseAngle = Math.random() * Math.PI * 2;
        const radius = (180 + Math.random() * 60) * safeScale;
        const baseY = fogHeight + (Math.random() * 5 * safeScale);
        const scale = (12 + Math.random() * 18) * safeScale;
        return (
          <AnimatedBubble
            key={`detail-${i}`}
            baseAngle={baseAngle}
            radius={radius}
            baseY={baseY}
            scale={scale}
            speed={(0.00012 + Math.random() * 0.00008) * (0.5 + safeSpeed)}
            verticalSpeed={0.05 * safeScale}
            cloudTexture={cloudTexture}
            fogColor={fogColor}
            opacity={0.5}
            bubbleSpeed={safeSpeed}
            scaleFactor={safeScale}
          />
        );
      })}
    </group>
  );
}
