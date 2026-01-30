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

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    if (bubbleSpeed === 0) return;
    const clampedDelta = Math.min(Math.max(delta, 0), 0.1);
    const angleDelta = speed * clampedDelta * bubbleSpeed;
    angleRef.current += angleDelta;
    verticalPhaseRef.current += clampedDelta * 0.01 * bubbleSpeed;
    yPosRef.current = baseY + verticalSpeed * Math.sin(verticalPhaseRef.current) * 0.5 * scaleFactor;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
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
export function VolumetricFog({
  timeOfDay,
  fogHeight,
  bubbleScale,
  bubbleDensity,
  bubbleSpeed,
  terrainSize,
  terrainRadius,
  isSquareTerrain
}: {
  timeOfDay: number;
  fogHeight: number;
  bubbleScale: number;
  bubbleDensity: number;
  bubbleSpeed: number;
  terrainSize: number;
  terrainRadius: number;
  isSquareTerrain: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Clamp and remap slider values for stability
  const safeScale = Math.max(0.1, Math.min(bubbleScale, 2)); // 0.1x to 2x
  const safeDensity = Math.max(0.1, Math.min(bubbleDensity, 3)); // 0.1x to 3x
  const safeSpeed = Math.max(0, Math.min(bubbleSpeed, 1)); // 0 (stopped) to 1 (max)

  // For circular terrain: torus geometry (donut shape) - positioned at island edge
  const islandRadius = terrainRadius || 30;
  // Position fog directly at world edge
  const fogMargin = 5; // Small margin to sit right at edge
  const torusRadius = islandRadius + fogMargin; // Donut at island edge
  const torusTube = 15 * safeScale; // Thickness of donut tube
  const torusOuterRadius = islandRadius + fogMargin + (torusTube * 1.5); // Outer donut slightly further out
  const torusOuterTube = 12 * safeScale;
  const torusVerticalScale = 0.08 * safeScale;

  // Fog positioning - different for square vs circular terrain
  // Memoize fogBounds to prevent recalculation on every render (prevents fog moving/disappearing)
  const fogBounds = useMemo(() => {
    if (isSquareTerrain) {
      // Square fog: position bubbles directly at square edges
      // Terrain scale is dynamic: islandSize * 2
      const halfSize = terrainSize / 2;
      return {
        minX: -halfSize,
        maxX: halfSize,
        minZ: -halfSize,
        maxZ: halfSize,
      };
    } else {
      // Circular fog: donut shape around island - position directly at island edge
      const islandRadius = terrainRadius || 30; // Island radius
      // Fog positioned right at island edge (matching small fogMargin of 5)
      return {
        minX: -islandRadius * 1.05,
        maxX: islandRadius * 1.05,
        minZ: -islandRadius * 1.05,
        maxZ: islandRadius * 1.05,
      };
    }
  }, [isSquareTerrain, terrainSize, terrainRadius]);

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

  // ALWAYS use square perimeter fog for both templates
  // Position fog at land-water transition (actual world-space dimensions)
  const squareSize = terrainSize; // Use terrainSize for both (200 for island, 400 for forest)

  // Helper to position bubbles along square perimeter
  const getSquarePerimeterPosition = (index: number, total: number, size: number, variation: number = 0) => {
    const perimeter = size * 4;
    const position = (index / total) * perimeter + variation;
    const edge = Math.floor(position / size) % 4;
    const edgePos = (position % size) - size / 2;

    switch(edge) {
      case 0: return { x: edgePos, z: size / 2 }; // Top edge
      case 1: return { x: size / 2, z: size / 2 - (position - size) }; // Right edge
      case 2: return { x: size / 2 - (position - size * 2), z: -size / 2 }; // Bottom edge
      case 3: return { x: -size / 2, z: -size / 2 + (position - size * 3) }; // Left edge
      default: return { x: 0, z: 0 };
    }
  };

  return (
    <group ref={groupRef}>
      {/* No torus meshes - square perimeter fog only */}
      {/* Static square perimeter fog bubbles */}
      {Array.from({ length: innerCount + outerCount }).map((_, i) => {
        const totalBubbles = innerCount + outerCount;
        const pos = getSquarePerimeterPosition(i, totalBubbles, squareSize, Math.sin(i * 2.3) * 2);
        const y = fogHeight + (Math.sin(i * 3.7) * 3 * safeScale) + 1;
        const bubbleSize = (15 + Math.sin(i * 5.1) * 10) * safeScale;

        return (
          <mesh key={`fog-${i}`} position={[pos.x, y, pos.z]} renderOrder={10}>
            <sphereGeometry args={[bubbleSize, 12, 12]} />
            <meshBasicMaterial
              map={cloudTexture}
              color={fogColor}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
