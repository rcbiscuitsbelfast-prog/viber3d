// Volumetric Fog Component - FIXED for persistence and stability
// Enhanced with debugging, texture lifecycle management, and state validation

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Volumetric Fog Component - FIXED for persistence and stability
export function VolumetricFog({
  timeOfDay,
  fogHeight,
  bubbleScale,
  bubbleDensity,
  bubbleSpeed,
  terrainSize,
  terrainRadius,
  isSquareTerrain,
  innerFogRadius,
  innerFogHeight,
  innerBubbleScale,
  innerBubbleDensity,
  innerBubbleSpeed
}: {
  timeOfDay: number;
  fogHeight: number;
  bubbleScale: number;
  bubbleDensity: number;
  bubbleSpeed: number;
  terrainSize: number;
  terrainRadius: number;
  isSquareTerrain: boolean;
  innerFogRadius: number;
  innerFogHeight: number;
  innerBubbleScale: number;
  innerBubbleDensity: number;
  innerBubbleSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const lastRenderTimeRef = useRef<number>(Date.now());
  const debugLogIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clamp values for stability
  const safeScale = Math.max(0.1, Math.min(bubbleScale, 2));
  const safeDensity = Math.max(0.1, Math.min(bubbleDensity, 3));
  const safeSpeed = Math.max(0, Math.min(bubbleSpeed, 1));

  const safeInnerScale = Math.max(0.1, Math.min(innerBubbleScale, 2));
  conMemoize fog bounds
  const fogBounds = useMemo(() => {
    if (isSquareTerrain) {
      const halfSize = terrainSize / 2;
      return {
        minX: -halfSize,
        maxX: halfSize,
        minZ: -halfSize,
        maxZ: halfSize,
      };
    } else {
      const islandRadius = terrainRadius || 30;
      return {
        minX: -islandRadius * 1.05,
        maxX: islandRadius * 1.05,
        minZ: -islandRadius * 1.05,
        maxZ: islandRadius * 1.05,
      };
    }
  }, [isSquareTerrain, terrainSize, terrainRadius]);

  // FIX: Ensure texture persistence - store in ref, don't recreate
  const cloudTexture = useMemo(() => {
    console.log('[VolumetricFog] Creating cloud texture at', new Date().toLocaleTimeString());
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // White base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    
    // Radial gradient clouds
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
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 3);
    
    // FIX: Mark texture as needing update if source canvas changes
    texture.needsUpdate = true;
    
    // Store reference to prevent garbage collection
    textureRef.current = texture;
    .CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 3);
    return texture;
  }, []);

  // FIX: Add debug logging every 10 seconds to track fog state
  useEffect(() => {
    debugLogIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - lastRenderTimeRef.current) / 1000;
      
      console.log('[VolumetricFog Debug]', {
        elapsedSeconds: elapsedSeconds.toFixed(1),
        textureValid: textureRef.current !== null && textureRef.current.source.data !== null,
        groupVisible: groupRef.current?.visible,
        innerGroupVisible: innerGroupRef.current?.visible,
        safeSpeed,
        safeInnerSpeed,
     Get fog color based on time of day
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

  // Bubble counts
  const innerCount = Math.floor(20 * safeDensity);
  const outerCount = Math.floor(40 * safeDensity);
  const squareSize = terrainSize;
  const innerSquareSize = Math.max(10, Math.min(squareSize - 10, innerFogRadius * 2));

  // Helper: Position bubbles along square perimeter
  const getSquarePerimeterPosition = (index: number, total: number, size: number, variation: number = 0) => {
    const perimeter = size * 4;
    const position = (index / total) * perimeter + variation;
    const edge = Math.floor(position / size) % 4;
    const edgePos = (position % size) - size / 2;

    switch(edge) {
      case 0: return { x: edgePos, z: size / 2 };
      case 1: return { x: size / 2, z: size / 2 - (position - size) };
      case 2: return { x: size / 2 - (position - size * 2), z: -size / 2 };
      case 3: return { x: -size / 2, z: -size / 2 + (position - size * 3) };
    
    if (innerGroupRef.current && safeInnerSpeed > 0) {
      const rotationDelta = clampedDelta * 0.0012 * safeInnerSpeed;
      innerGroupRef.current.rotation.y -= rotationDelta;
    }
  });

  // Smooth fog color transition from day to night
  const getFogColor = (time: number) => {
    if (time >= 0.25 && time <= 0.75) {
      if (Outer fog ring */}
      {Array.from({ length: innerCount + outerCount }).map((_, i) => {
        const totalBubbles = innerCount + outerCount;
        const pos = getSquarePerimeterPosition(i, totalBubbles, squareSize, Math.sin(i * 2.3) * 2);
        const y = fogHeight + (Math.sin(i * 3.7) * 3 * safeScale) + 1;
        const bubbleSize = (15 + Math.sin(i * 5.1) * 10) * safeScale;

        return (
          <mesh key={`fog-${i}`} position={[pos.x, y, pos.z]} renderOrder={1000}>
            <sphereGeometry args={[bubbleSize, 12, 12]} />
            <meshBasicMaterial
              map={cloudTexture}
              color={fogColor}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
              depthTest={tru
  // ALWAYS use square perimeter fog for both templates
  // Position fog at land-water transition (actual world-space dimensions)
  const squareSize = terrainSize; // Use terrainSize for both (200 for island, 400 for forest)
  const innerSquareSize = Math.max(10, Math.min(squareSize - 10, innerFogRadius * 2));

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

      {/* Inner fog ring - adjustable radius */}
      <group ref={innerGroupRef}>
        {innerSquareSize > 10 && Array.from({ length: Math.floor(16 * safeInnerDensity) }).map((_, i) => {
          const totalBubbles = Math.floor(16 * safeInnerDensity);
          const pos = get*/}
      <group ref={innerGroupRef}>
        {innerSquareSize > 10 && Array.from({ length: Math.floor(16 * safeInnerDensity) }).map((_, i) => {
          const totalBubbles = Math.floor(16 * safeInnerDensity);
          const pos = getSquarePerimeterPosition(i, totalBubbles, innerSquareSize, Math.sin(i * 2.1) * 1.2);
          const y = innerFogHeight + (Math.sin(i * 2.9) * 2 * safeInnerScale) - 0.5;
          const bubbleSize = (10 + Math.sin(i * 4.1) * 6) * safeInnerScale;

          return (
            <mesh key={`fog-inner-${i}`} position={[pos.x, y, pos.z]} renderOrder={999}>
              <sphereGeometry args={[bubbleSize, 12, 12]} />
              <meshBasicMaterial
                map={cloudTexture}
                color={fogColor}
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
                depthWrite={false}
                depthTest={tru
      </group>
    </group>
  );
}
