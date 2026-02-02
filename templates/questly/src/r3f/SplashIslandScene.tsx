// Splash Island Scene - Static pre-generated island for splash screen background
// This generates a beautiful 3D island matching the terrain builder's island template defaults.
// The island uses deterministic seeded random generation for consistent appearance on every load.
// Asset counts, terrain parameters, and water color match the builder for visual consistency.
// Note: This is purely visual - no physics, collisions, or dynamic generation for fast loading.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { generateSimplexTerrain, sampleTerrainHeight } from '@/utils/simplexTerrain';
import { InstancedForest } from '@/components/InstancedForest';
import { InstancedGrass } from '@/components/InstancedGrass';
import { InstancedRocks } from '@/components/InstancedRocks';
import { InstancedBushes } from '@/components/InstancedBushes';
import { VolumetricFog } from '@/components/VolumetricFog';

interface SplashIslandSceneProps {
  enableControls?: boolean;
  fogEnabled?: boolean;
  fogHeight?: number;
  bubbleScale?: number;
  bubbleDensity?: number;
  bubbleSpeed?: number;
  innerFogRadius?: number;
  innerFogHeight?: number;
  innerBubbleScale?: number;
  innerBubbleDensity?: number;
  innerBubbleSpeed?: number;
}

export function SplashIslandScene({ 
  enableControls = true,
  fogEnabled = true,
  fogHeight = 5.0,
  bubbleScale = 1.0,
  bubbleDensity = 1.0,
  bubbleSpeed = 0.2,
  innerFogRadius = 30.0,
  innerFogHeight = 4.0,
  innerBubbleScale = 0.9,
  innerBubbleDensity = 1.0,
  innerBubbleSpeed = 0.15
}: SplashIslandSceneProps) {
  const islandRef = useRef<THREE.Group>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Match World Builder island template defaults
  const roughness = 26;
  const islandSize = 44;
  const terrainDetail = 64;
  const seed = 0;
  const heightScale = 55;
  const waterLevel = 0.9;
  const noiseType: 'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent' = 'standard';
  const isSquareTerrain = false;

  const treeAmount = 3500;
  const treeSize = 100;
  const grassSize = 100;
  const terrainGrassCoverage = 100;
  const rockAmount = 400;
  const rockSize = 100;
  const bushAmount = 600;
  const bushSize = 100;
  const treeHeightOffset = 0;
  const grassHeightOffset = 0;
  const rockHeightOffset = 0;
  const bushHeightOffset = 0;
  const slopeAdjustmentIntensity = 3.5;

  const terrainScale = isSquareTerrain ? islandSize * 2 : 200;
  const islandScale = 0.08;

  const terrainData = useMemo(() => {
    return generateSimplexTerrain({
      size: terrainDetail,
      scale: terrainScale,
      seed,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      islandRadius: islandSize,
      heightScale,
      roughness,
      isSquareTerrain,
      noiseType,
    });
  }, [roughness, islandSize, terrainDetail, seed, heightScale, isSquareTerrain, noiseType, terrainScale]);

  const terrainGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(terrainScale, terrainScale, terrainDetail, terrainDetail);
    const { heights, colors } = terrainData;
    const positions = geom.attributes.position.array as Float32Array;

    for (let i = 0; i < heights.length; i++) {
      positions[i * 3 + 2] = heights[i];
    }

    const colorArray = new Float32Array(colors.length * 3);
    for (let i = 0; i < colors.length; i++) {
      colorArray[i * 3] = colors[i].r;
      colorArray[i * 3 + 1] = colors[i].g;
      colorArray[i * 3 + 2] = colors[i].b;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geom.computeVertexNormals();
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [terrainData, terrainDetail, terrainScale]);

  // Auto-rotate until user interacts
  useFrame((_, delta) => {
    if (islandRef.current && autoRotate) {
      islandRef.current.rotation.y += delta * 0.05;
    }
  });

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Only stop auto-rotate if clicking on the canvas (island), not on overlays
      const target = e.target as HTMLElement;
      // Check if the target is a canvas element or inside the R3FCanvas container
      if (target.tagName === 'CANVAS' || (target.closest('.r3f-canvas'))) {
        setAutoRotate(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const makeSeededRandom = (seedOffset: number) => {
    let seedRandom = seed + seedOffset;
    return () => {
      seedRandom = (seedRandom * 9301 + 49297) % 233280;
      return seedRandom / 233280;
    };
  };

  const seededRandomTrees = useMemo(() => makeSeededRandom(0), [seed]);
  const seededRandomGrass = useMemo(() => makeSeededRandom(1000), [seed]);
  const seededRandomRocks = useMemo(() => makeSeededRandom(2000), [seed]);
  const seededRandomBushes = useMemo(() => makeSeededRandom(3000), [seed]);

  const getTerrainHeight = (x: number, z: number) => {
    return sampleTerrainHeight(terrainData, x, z, terrainScale);
  };

  const getSlopeBasedAdjustment = (worldX: number, worldZ: number) => {
    const sampleDist = 0.5;
    const heightN = getTerrainHeight(worldX, worldZ + sampleDist);
    const heightS = getTerrainHeight(worldX, worldZ - sampleDist);
    const heightE = getTerrainHeight(worldX + sampleDist, worldZ);
    const heightW = getTerrainHeight(worldX - sampleDist, worldZ);

    const slopeX = Math.abs(heightE - heightW) / (sampleDist * 2);
    const slopeZ = Math.abs(heightN - heightS) / (sampleDist * 2);
    const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);

    const baseOffset = -0.2;
    const slopeOffset = -slope * slopeAdjustmentIntensity;
    return baseOffset + slopeOffset;
  };

  const getTreeSlopeAdjustment = (worldX: number, worldZ: number) => {
    const sampleDist = 0.5;
    const heightN = getTerrainHeight(worldX, worldZ + sampleDist);
    const heightS = getTerrainHeight(worldX, worldZ - sampleDist);
    const heightE = getTerrainHeight(worldX + sampleDist, worldZ);
    const heightW = getTerrainHeight(worldX - sampleDist, worldZ);

    const slopeX = Math.abs(heightE - heightW) / (sampleDist * 2);
    const slopeZ = Math.abs(heightN - heightS) / (sampleDist * 2);
    const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);

    const baseOffset = -0.05;
    const slopeOffset = -slope * slopeAdjustmentIntensity * 0.25;
    return baseOffset + slopeOffset;
  };

  const trees = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; treeType: 'pine' | 'broad' | 'bushy' }> = [];
    const attempts = treeAmount;
    const sizeMultiplier = treeSize / 100;

    for (let i = 0; i < attempts; i++) {
      const x = (seededRandomTrees() - 0.5) * terrainScale * 0.6;
      const z = (seededRandomTrees() - 0.5) * terrainScale * 0.6;
      const height = getTerrainHeight(x, z);

      if (height < 1.0) {
        continue;
      }

      let shouldSpawn = false;
      let treeType: 'pine' | 'broad' | 'bushy' = 'pine';

      if (height >= 50) {
        shouldSpawn = seededRandomTrees() < 0.8;
        treeType = seededRandomTrees() < 0.8 ? 'pine' : (seededRandomTrees() < 0.5 ? 'broad' : 'bushy');
      } else if (height >= 30 && height < 50) {
        const rand = seededRandomTrees();
        if (rand < 0.6) {
          shouldSpawn = true;
          treeType = seededRandomTrees() < 0.6 ? 'pine' : (seededRandomTrees() < 0.5 ? 'broad' : 'bushy');
        }
      } else if (height >= 15 && height < 30) {
        const rand = seededRandomTrees();
        if (rand < 0.7) {
          shouldSpawn = true;
          treeType = seededRandomTrees() < 0.5 ? 'pine' : (seededRandomTrees() < 0.5 ? 'broad' : 'bushy');
        }
      } else if (height >= 10 && height < 15) {
        shouldSpawn = seededRandomTrees() < 0.9;
        treeType = 'pine';
      } else if (height >= 6 && height < 10) {
        const rand = seededRandomTrees();
        if (rand < 0.4) {
          shouldSpawn = true;
          treeType = 'pine';
        } else if (rand < 0.7) {
          shouldSpawn = true;
          treeType = seededRandomTrees() < 0.5 ? 'broad' : 'bushy';
        }
      } else if (height >= 3 && height < 6) {
        if (seededRandomTrees() < 0.4) {
          shouldSpawn = true;
          treeType = seededRandomTrees() < 0.5 ? 'broad' : 'bushy';
        }
      } else if (height >= 1.0 && height < 3) {
        if (seededRandomTrees() < 0.2) {
          shouldSpawn = true;
          treeType = seededRandomTrees() < 0.5 ? 'broad' : 'bushy';
        }
      }

      if (shouldSpawn) {
        const rotation = seededRandomTrees() * Math.PI * 2;
        const sizeVariation = 0.8 + (seededRandomTrees() * 0.4);
        const treeScale = sizeMultiplier * sizeVariation;
        const finalY = height + treeHeightOffset + getTreeSlopeAdjustment(x, z);

        positions.push({
          pos: [x, finalY, z],
          rotation,
          scale: treeScale,
          treeType,
        });
      }
    }

    return positions;
  }, [seededRandomTrees, terrainScale, treeAmount, treeSize, treeHeightOffset, slopeAdjustmentIntensity]);

  const grass = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> = [];
    const gridSpacing = 5.0;
    const gridSize = Math.floor(terrainScale * 0.95 / gridSpacing);
    const MAX_GRASS_INSTANCES = 8000;
    const sizeMultiplier = grassSize / 100;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        if (positions.length >= MAX_GRASS_INSTANCES) {
          return positions;
        }

        const gridOffsetX = (seededRandomGrass() - 0.5) * gridSpacing * 0.6;
        const gridOffsetZ = (seededRandomGrass() - 0.5) * gridSpacing * 0.6;
        const baseX = (gx / gridSize - 0.5) * terrainScale * 0.95;
        const baseZ = (gz / gridSize - 0.5) * terrainScale * 0.95;
        const x = baseX + gridOffsetX;
        const z = baseZ + gridOffsetZ;

        const height = getTerrainHeight(x, z);
        if (height < 1.0) {
          continue;
        }

        const isSandArea = height >= 0.5 && height < 1.0;
        const builderBaseCoverage = 0.576;
        const baseCoverage = isSandArea ? 0.08 : builderBaseCoverage;
        const coverage = isSandArea
          ? Math.min(0.10, baseCoverage * (terrainGrassCoverage / 100))
          : Math.min(1.0, baseCoverage * (terrainGrassCoverage / 100));

        if (seededRandomGrass() < coverage) {
          const rotation = seededRandomGrass() * Math.PI * 2;
          const scaleVariation = 0.6 + (seededRandomGrass() * 0.8);
          const grassScale = scaleVariation * sizeMultiplier;
          const positionJitter = (seededRandomGrass() - 0.5) * 0.3;
          const jitteredX = x + positionJitter;
          const jitteredZ = z + (seededRandomGrass() - 0.5) * 0.3;
          const finalY = height + grassHeightOffset;
          const variant = Math.floor(seededRandomGrass() * 4);

          positions.push({
            pos: [jitteredX, finalY, jitteredZ],
            rotation,
            scale: grassScale,
            variant,
          });
        }
      }
    }

    return positions;
  }, [seededRandomGrass, terrainScale, grassSize, terrainGrassCoverage, grassHeightOffset]);

  const rocks = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; variant: number }> = [];
    const attempts = rockAmount;
    const sizeMultiplier = rockSize / 100;

    for (let i = 0; i < attempts; i++) {
      const x = (seededRandomRocks() - 0.5) * terrainScale * 0.6;
      const z = (seededRandomRocks() - 0.5) * terrainScale * 0.6;
      const height = getTerrainHeight(x, z);

      if (height < 0) {
        continue;
      }

      const sampleDist = 1;
      const heightRight = getTerrainHeight(x + sampleDist, z);
      const heightLeft = getTerrainHeight(x - sampleDist, z);
      const heightFront = getTerrainHeight(x, z + sampleDist);
      const heightBack = getTerrainHeight(x, z - sampleDist);

      const slopeX = Math.abs(heightRight - heightLeft) / (sampleDist * 2);
      const slopeZ = Math.abs(heightFront - heightBack) / (sampleDist * 2);
      const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);

      const slopeMultiplier = Math.max(0.1, 1 - (slope * 0.9));

      let spawnChance = 0;
      if (height >= 0.5 && height < 3) {
        spawnChance = 0.3 * slopeMultiplier;
      } else if (height >= 3 && height < 15) {
        spawnChance = (height > 8 ? 0.4 : 0.2) * slopeMultiplier;
      }

      if (spawnChance > 0 && seededRandomRocks() < spawnChance) {
        const rotation = seededRandomRocks() * Math.PI * 2;
        const sizeVariation = 0.6 + (seededRandomRocks() * 1.0);
        const rockScale = sizeMultiplier * sizeVariation;
        const variant = Math.floor(seededRandomRocks() * 18);
        const slopeAdjustment = getSlopeBasedAdjustment(x, z);
        const finalY = height + slopeAdjustment + rockHeightOffset;

        positions.push({
          pos: [x, finalY, z],
          rotation,
          scale: rockScale,
          variant,
        });
      }
    }

    return positions;
  }, [seededRandomRocks, terrainScale, rockAmount, rockSize, rockHeightOffset, slopeAdjustmentIntensity]);

  const bushes = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; variant: number }> = [];
    const attempts = bushAmount;
    const sizeMultiplier = bushSize / 100;

    for (let i = 0; i < attempts; i++) {
      const x = (seededRandomBushes() - 0.5) * terrainScale * 0.6;
      const z = (seededRandomBushes() - 0.5) * terrainScale * 0.6;
      const height = getTerrainHeight(x, z);

      if (height < 0) {
        continue;
      }

      if (height >= 3 && height < 8) {
        if (seededRandomBushes() < 0.3) {
          const rotation = seededRandomBushes() * Math.PI * 2;
          const sizeVariation = 0.8 + (seededRandomBushes() * 0.5);
          const bushScale = sizeMultiplier * sizeVariation;
          const variant = Math.floor(seededRandomBushes() * 8);
          const slopeAdjustment = getSlopeBasedAdjustment(x, z);
          const finalY = height + slopeAdjustment + bushHeightOffset;

          positions.push({
            pos: [x, finalY, z],
            rotation,
            scale: bushScale,
            variant,
          });
        }
      }
    }

    return positions;
  }, [seededRandomBushes, terrainScale, bushAmount, bushSize, bushHeightOffset, slopeAdjustmentIntensity]);

  return (
    <>
      {/* Camera controls */}
      {enableControls && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          rotateSpeed={0.5}
          dampingFactor={0.05}
          enableDamping={true}
          target={[0, 0, 0]}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={['#87CEEB', '#68A47A', 0.5]} />

      {/* Island group - centered at origin, positioned lower */}
      <group ref={islandRef} position={[0, -4.5, 0]} scale={[islandScale, islandScale, islandScale]}>
        {/* Terrain mesh using builder defaults */}
        <mesh geometry={terrainGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            vertexColors
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Instanced assets matching builder defaults */}
        <InstancedForest trees={trees} castShadow receiveShadow={false} />
        <InstancedGrass grass={grass} castShadow receiveShadow={false} />
        <InstancedRocks rocks={rocks} castShadow receiveShadow={false} />
        <InstancedBushes bushes={bushes} castShadow receiveShadow={false} />
      </group>

      {/* Ocean plane - matches terrain builder water color - extended to cover full screen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.5 + waterLevel * islandScale, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial
          color="#1A4D80"
          transparent={false}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>

      {/* Simple sky sphere */}
      <mesh>
        <sphereGeometry args={[400, 32, 32]} />
        <meshBasicMaterial
          color="#87CEEB"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Volumetric Fog - Bubble fog effect around island */}
      {fogEnabled && (
        <VolumetricFog
          timeOfDay={0.5}
          fogHeight={fogHeight}
          bubbleScale={bubbleScale}
          bubbleDensity={bubbleDensity}
          bubbleSpeed={bubbleSpeed}
          terrainSize={200}
          terrainRadius={islandSize}
          isSquareTerrain={false}
          innerFogRadius={innerFogRadius}
          innerFogHeight={innerFogHeight}
          innerBubbleScale={innerBubbleScale}
          innerBubbleDensity={innerBubbleDensity}
          innerBubbleSpeed={innerBubbleSpeed}
        />
      )}
    </>
  );
}
