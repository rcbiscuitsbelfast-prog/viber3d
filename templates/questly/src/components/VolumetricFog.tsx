// Volumetric Fog Component (Donut-shaped cloud ring)
// SAVED FOR FUTURE USE - Was working well at normal speed
// To re-enable: Import this component and uncomment the usage in TestWorld.tsx

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// NOTE: This component was saved from TestWorld.tsx
// It was working well at normal speed but had issues with bubbleSpeed = 0
// The AnimatedBubble component has been fixed to properly stop when bubbleSpeed === 0

// Animated Bubble Component - Fixed scale to prevent flickering
// Supports both circular (donut) and square fog patterns
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
  scaleFactor,
  isSquareFog = false,
  initialX = 0,
  initialZ = 0
}: { 
  baseAngle: number; 
  radius: number; 
  baseY: number; 
  scale: number; // Fixed scale - no animation
  speed: number; 
  verticalSpeed: number; 
  cloudTexture: THREE.Texture; 
  fogColor: string; 
  opacity: number;
  bubbleSpeed: number;
  scaleFactor: number;
  isSquareFog?: boolean; // If true, move along square edge instead of circle
  initialX?: number; // Initial X position for square fog
  initialZ?: number; // Initial Z position for square fog
}) {
  // Calculate position once - completely static, no updates, no recalculation
  // Use useRef to store position and only calculate once on mount
  const positionRef = useRef<[number, number, number] | null>(null);
  
  if (positionRef.current === null) {
    // Calculate position only once on first render
    if (isSquareFog) {
      positionRef.current = [initialX, baseY, initialZ];
    } else {
      const x = Math.cos(baseAngle) * radius;
      const z = Math.sin(baseAngle) * radius;
      positionRef.current = [x, baseY, z];
    }
  }
  
  // Always use the same position - never recalculate
  const position = positionRef.current || [0, baseY, 0];
  
  // No useFrame, no useEffect, no useMemo - fog is completely static
  
  return (
    <mesh position={position} renderOrder={1000} scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        map={cloudTexture}
        color={fogColor}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        emissive={fogColor}
        emissiveIntensity={0.2}
        roughness={0.9}
        metalness={0.0}
        flatShading={false}
      />
    </mesh>
  );
}

// Volumetric Fog Component (Donut-shaped cloud ring or square for square terrain)
export function VolumetricFog({ 
  timeOfDay, 
  fogHeight, 
  bubbleScale, 
  bubbleDensity, 
  bubbleSpeed,
  terrainRadius,
  isSquareTerrain = false,
  terrainSize = 200 // For square terrain - size of terrain in world units
}: { 
  timeOfDay: number; 
  fogHeight: number; 
  bubbleScale: number; 
  bubbleDensity: number; 
  bubbleSpeed: number;
  terrainRadius?: number; // Island radius - fog will be just beyond edges
  isSquareTerrain?: boolean; // If true, create square fog instead of donut
  terrainSize?: number; // Size of square terrain for fog positioning
}) {
  const groupRef = useRef<THREE.Group>(null);

  // CRITICAL FIX: Store random values in useRef so they never change
  // This prevents bubbles from moving when dependencies change
  const randomValuesRef = useRef<Map<string, number>>(new Map());

  // Helper to get or create random value for a given key
  const getRandomValue = (key: string, generator: () => number): number => {
    if (!randomValuesRef.current.has(key)) {
      randomValuesRef.current.set(key, generator());
    }
    return randomValuesRef.current.get(key)!;
  };

  // Clamp and remap slider values for stability
  const safeScale = Math.max(0.1, Math.min(bubbleScale, 2)); // 0.1x to 2x
  const safeDensity = Math.max(0.1, Math.min(bubbleDensity, 3)); // 0.1x to 3x
  const safeSpeed = Math.max(0, Math.min(bubbleSpeed, 1)); // 0 (stopped) to 1 (max)

  // Fog positioning - different for square vs circular terrain
  // Position fog directly at world edge, not far out
  let fogBounds: { minX: number; maxX: number; minZ: number; maxZ: number; };
  
  if (isSquareTerrain) {
    // Square fog: position bubbles directly at square edges
    // Terrain spans from -terrainSize/2 to +terrainSize/2, fog at the edge
    const terrainHalfSize = terrainSize / 2;
    fogBounds = {
      minX: -terrainHalfSize,
      maxX: terrainHalfSize,
      minZ: -terrainHalfSize,
      maxZ: terrainHalfSize,
    };
  } else {
    // Circular fog: donut shape around island - position at island edge
    const islandRadius = terrainRadius || 30; // Island radius
    // Fog donut positioned at island edge, not far out
    fogBounds = {
      minX: -islandRadius * 1.2,
      maxX: islandRadius * 1.2,
      minZ: -islandRadius * 1.2,
      maxZ: islandRadius * 1.2,
    };
  }
  
  // For circular terrain: torus geometry (donut shape) - positioned well outside island
  const islandRadius = terrainRadius || 30;
  // Position donut well outside the island - center should be far beyond island edge
  const fogMargin = 50; // Large fixed distance beyond island edge (not scaled)
  const torusRadius = islandRadius + fogMargin; // Donut center well outside island edge
  const torusTube = 15 * safeScale; // Thickness of donut tube
  const torusOuterRadius = islandRadius + fogMargin + (torusTube * 1.5); // Outer donut further out
  const torusOuterTube = 12 * safeScale;
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

  // Fog is completely static - no rotation or movement

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

  // Memoize bubble properties to prevent flickering from random values changing
  // For square terrain: position bubbles around square edges
  // For circular terrain: position bubbles around donut ring
  const innerBubbles = useMemo(() => {
    return Array.from({ length: innerCount }).map((_, i) => {
      if (isSquareTerrain) {
        // Square fog: distribute bubbles along square perimeter
        const perimeter = (fogBounds.maxX - fogBounds.minX + fogBounds.maxZ - fogBounds.minZ) * 2;
        const position = (i / innerCount) * perimeter;
        let x: number, z: number;
        
        // Determine which edge of the square
        const sideLength = fogBounds.maxX - fogBounds.minX;
        if (position < sideLength) {
          // Top edge
          x = fogBounds.minX + position;
          z = fogBounds.maxZ;
        } else if (position < sideLength * 2) {
          // Right edge
          x = fogBounds.maxX;
          z = fogBounds.maxZ - (position - sideLength);
        } else if (position < sideLength * 3) {
          // Bottom edge
          x = fogBounds.maxX - (position - sideLength * 2);
          z = fogBounds.minZ;
        } else {
          // Left edge
          x = fogBounds.minX;
          z = fogBounds.minZ + (position - sideLength * 3);
        }
        
        // Position directly on edge with slight variation
        const edgeOffset = (getRandomValue(`inner-edge-${i}`, () => Math.random() - 0.5) * 5 * safeScale); // Small variation
        const angle = Math.atan2(z, x);
        x += Math.cos(angle) * edgeOffset;
        z += Math.sin(angle) * edgeOffset;
        
        const baseAngle = Math.atan2(z, x);
        const radiusVariation = Math.sqrt(x * x + z * z);
        const baseY = fogHeight + (getRandomValue(`inner-baseY-${i}`, () => Math.random() * 6) * safeScale);
        const scale = (20 + getRandomValue(`inner-scale-${i}`, () => Math.random() * 25)) * safeScale;
        const speed = 0; // No movement
        return { baseAngle, radiusVariation, baseY, scale, speed, initialX: x, initialZ: z };
      } else {
        // Circular fog: donut shape
        const totalCount = innerCount;
        const baseAngle = (i / totalCount) * Math.PI * 2;
        const radiusVariation = torusRadius + (Math.sin(i * 2.5) * torusTube * 0.4);
        const baseY = fogHeight + (getRandomValue(`inner-circ-baseY-${i}`, () => Math.random() * 6) * safeScale);
        const scale = (20 + getRandomValue(`inner-circ-scale-${i}`, () => Math.random() * 25)) * safeScale;
        const speed = 0; // No movement
        return { baseAngle, radiusVariation, baseY, scale, speed, initialX: 0, initialZ: 0 };
      }
    });
  }, [innerCount, torusRadius, torusTube, fogHeight, safeScale, isSquareTerrain, fogBounds]);

  const outerBubbles = useMemo(() => {
    return Array.from({ length: outerCount }).map((_, i) => {
      if (isSquareTerrain) {
        // Square fog: outer layer further out
        const outerMargin = 40 * safeScale;
        const outerBounds = {
          minX: fogBounds.minX - outerMargin,
          maxX: fogBounds.maxX + outerMargin,
          minZ: fogBounds.minZ - outerMargin,
          maxZ: fogBounds.maxZ + outerMargin,
        };
        const perimeter = (outerBounds.maxX - outerBounds.minX + outerBounds.maxZ - outerBounds.minZ) * 2;
        const position = (i / outerCount) * perimeter;
        let x: number, z: number;
        
        const sideLength = outerBounds.maxX - outerBounds.minX;
        if (position < sideLength) {
          x = outerBounds.minX + position;
          z = outerBounds.maxZ;
        } else if (position < sideLength * 2) {
          x = outerBounds.maxX;
          z = outerBounds.maxZ - (position - sideLength);
        } else if (position < sideLength * 3) {
          x = outerBounds.maxX - (position - sideLength * 2);
          z = outerBounds.minZ;
        } else {
          x = outerBounds.minX;
          z = outerBounds.minZ + (position - sideLength * 3);
        }
        
        const edgeOffset = (getRandomValue(`outer-edge-${i}`, () => Math.random() - 0.5) * 25 * safeScale);
        const angle = Math.atan2(z, x);
        x += Math.cos(angle) * edgeOffset;
        z += Math.sin(angle) * edgeOffset;
        
        const baseAngle = Math.atan2(z, x);
        const radiusVariation = Math.sqrt(x * x + z * z);
        const baseY = fogHeight + (getRandomValue(`outer-baseY-${i}`, () => Math.random() * 8) * safeScale);
        const scale = (25 + getRandomValue(`outer-scale-${i}`, () => Math.random() * 40)) * safeScale;
        const speed = 0; // No movement
        return { baseAngle, radiusVariation, baseY, scale, speed, initialX: x, initialZ: z };
      } else {
        // Circular fog: outer donut
        const totalCount = outerCount;
        const baseAngle = (i / totalCount) * Math.PI * 2;
        const radiusVariation = torusOuterRadius + (Math.sin(i * 1.8) * torusOuterTube * 0.4);
        const baseY = fogHeight + (getRandomValue(`outer-circ-baseY-${i}`, () => Math.random() * 8) * safeScale);
        const scale = (25 + getRandomValue(`outer-circ-scale-${i}`, () => Math.random() * 40)) * safeScale;
        const speed = 0; // No movement
        return { baseAngle, radiusVariation, baseY, scale, speed, initialX: 0, initialZ: 0 };
      }
    });
  }, [outerCount, torusOuterRadius, torusOuterTube, fogHeight, safeScale, isSquareTerrain, fogBounds]);

  const detailBubbles = useMemo(() => {
    return Array.from({ length: detailCount }).map((_, i) => {
      if (isSquareTerrain) {
        // Square fog: random positions around square edges
        const side = Math.floor(getRandomValue(`detail-side-${i}`, () => Math.random() * 4));
        let x: number, z: number;
        const margin = 30 * safeScale;
        
        if (side === 0) {
          // Top edge
          x = fogBounds.minX + getRandomValue(`detail-x-${i}`, () => Math.random()) * (fogBounds.maxX - fogBounds.minX);
          z = fogBounds.maxZ + getRandomValue(`detail-z-top-${i}`, () => Math.random()) * margin;
        } else if (side === 1) {
          // Right edge
          x = fogBounds.maxX + getRandomValue(`detail-x-right-${i}`, () => Math.random()) * margin;
          z = fogBounds.minZ + getRandomValue(`detail-z-right-${i}`, () => Math.random()) * (fogBounds.maxZ - fogBounds.minZ);
        } else if (side === 2) {
          // Bottom edge
          x = fogBounds.minX + getRandomValue(`detail-x-bottom-${i}`, () => Math.random()) * (fogBounds.maxX - fogBounds.minX);
          z = fogBounds.minZ - getRandomValue(`detail-z-bottom-${i}`, () => Math.random()) * margin;
        } else {
          // Left edge
          x = fogBounds.minX - getRandomValue(`detail-x-left-${i}`, () => Math.random()) * margin;
          z = fogBounds.minZ + getRandomValue(`detail-z-left-${i}`, () => Math.random()) * (fogBounds.maxZ - fogBounds.minZ);
        }
        
        const baseAngle = Math.atan2(z, x);
        const radius = Math.sqrt(x * x + z * z);
        const baseY = fogHeight + (getRandomValue(`detail-baseY-${i}`, () => Math.random() * 5) * safeScale);
        const scale = (12 + getRandomValue(`detail-scale-${i}`, () => Math.random() * 18)) * safeScale;
        const speed = 0; // No movement
        return { baseAngle, radius, baseY, scale, speed, initialX: x, initialZ: z };
      } else {
        // Circular fog: between inner and outer rings
        const baseAngle = getRandomValue(`detail-circ-angle-${i}`, () => Math.random() * Math.PI * 2);
        const minRadius = torusRadius - torusTube;
        const maxRadius = torusOuterRadius + torusOuterTube;
        const radius = minRadius + getRandomValue(`detail-circ-radius-${i}`, () => Math.random()) * (maxRadius - minRadius);
        const baseY = fogHeight + (getRandomValue(`detail-circ-baseY-${i}`, () => Math.random() * 5) * safeScale);
        const scale = (12 + getRandomValue(`detail-circ-scale-${i}`, () => Math.random() * 18)) * safeScale;
        const speed = 0; // No movement
        return { baseAngle, radius, baseY, scale, speed, initialX: 0, initialZ: 0 };
      }
    });
  }, [detailCount, torusRadius, torusTube, torusOuterRadius, torusOuterTube, fogHeight, safeScale, isSquareTerrain, fogBounds]);

  // Rotation refs for donut positioning (not used for animation - fog is static)
  const innerTorusRef = useRef<THREE.Mesh>(null);
  const outerTorusRef = useRef<THREE.Mesh>(null);
  
  // No rotation animation - fog is completely static
  
  return (
    <group ref={groupRef}>
      {/* Ambient and directional light for fog bubbles to receive subtle shading */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      
      {/* Torus meshes hidden - only used for positioning reference, bubbles provide the visual fog */}
      <mesh ref={innerTorusRef} position={[0, fogHeight, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, torusVerticalScale]} visible={false}>
        <torusGeometry args={[torusRadius, torusTube, 24, 48]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={outerTorusRef} position={[0, fogHeight, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, torusVerticalScale]} visible={false}>
        <torusGeometry args={[torusOuterRadius, torusOuterTube, 20, 40]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Inner bubbles - fixed scales to prevent flickering */}
      {innerBubbles.map((bubble, i) => (
        <AnimatedBubble
          key={`inner-${i}`}
          baseAngle={bubble.baseAngle}
          radius={bubble.radiusVariation}
          baseY={bubble.baseY}
          scale={bubble.scale}
          speed={bubble.speed}
          verticalSpeed={0.15 * safeScale}
          cloudTexture={cloudTexture}
          fogColor={fogColor}
          opacity={0.5}
          bubbleSpeed={safeSpeed}
          scaleFactor={safeScale}
          isSquareFog={isSquareTerrain}
          initialX={bubble.initialX || 0}
          initialZ={bubble.initialZ || 0}
        />
      ))}
      {/* Outer bubbles - fixed scales to prevent flickering */}
      {outerBubbles.map((bubble, i) => (
        <AnimatedBubble
          key={`outer-${i}`}
          baseAngle={bubble.baseAngle}
          radius={bubble.radiusVariation}
          baseY={bubble.baseY}
          scale={bubble.scale}
          speed={bubble.speed}
          verticalSpeed={0.15 * safeScale}
          cloudTexture={cloudTexture}
          fogColor={fogColor}
          opacity={0.6}
          bubbleSpeed={safeSpeed}
          scaleFactor={safeScale}
          isSquareFog={isSquareTerrain}
          initialX={bubble.initialX || 0}
          initialZ={bubble.initialZ || 0}
        />
      ))}
      {/* Detail bubbles - fixed scales to prevent flickering */}
      {detailBubbles.map((bubble, i) => (
        <AnimatedBubble
          key={`detail-${i}`}
          baseAngle={bubble.baseAngle}
          radius={bubble.radius}
          baseY={bubble.baseY}
          scale={bubble.scale}
          speed={bubble.speed}
          verticalSpeed={0.15 * safeScale}
          cloudTexture={cloudTexture}
          fogColor={fogColor}
          opacity={0.5}
          bubbleSpeed={safeSpeed}
          scaleFactor={safeScale}
          isSquareFog={isSquareTerrain}
          initialX={bubble.initialX || 0}
          initialZ={bubble.initialZ || 0}
        />
      ))}
    </group>
  );
}
