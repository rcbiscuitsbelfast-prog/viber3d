import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { assetRegistry } from '../../systems/assets/AssetRegistry';
import { cameraOcclusionManager } from '../../systems/camera/CameraOcclusionManager';
import { Quest } from '../../types/quest.types';

interface QuestEnvironmentProps {
  templateWorld: Quest['templateWorld'];
  seed: number;
}

interface PlacedAsset {
  id: string;
  assetId: string;
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  scale: THREE.Vector3;
  model?: THREE.Group | THREE.Object3D;
}

export function QuestEnvironment({ templateWorld, seed }: QuestEnvironmentProps) {
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
  const [, setIsLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    generateEnvironment();
  }, [templateWorld, seed]);

  useEffect(() => {
    // Register all placed assets as occludable
    placedAssets.forEach((asset) => {
      if (asset.model) {
        cameraOcclusionManager.registerObject(asset.id, asset.model);
      }
    });

    return () => {
      // Cleanup: unregister when component unmounts or assets change
      placedAssets.forEach((asset) => {
        cameraOcclusionManager.unregisterObject(asset.id);
      });
    };
  }, [placedAssets]);

  async function generateEnvironment() {
    setIsLoading(true);

    const assets: PlacedAsset[] = [];
    const random = seededRandom(seed);

    // Get environment assets based on template world
    const treeAssets = assetRegistry.getAssetsByTags(['tree']);
    const rockAssets = assetRegistry.getAssetsByTags(['rock']);

    // Define placement area
    const placementRadius = 40;

    // Generate positions for trees
    const treeCount = templateWorld === 'forest' ? 30 : 15;
    for (let i = 0; i < treeCount; i++) {
      const angle = random() * Math.PI * 2;
      const distance = random() * placementRadius;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Pick random tree asset
      const treeAsset = treeAssets[Math.floor(random() * treeAssets.length)];
      
      if (treeAsset) {
        assets.push({
          id: `tree-${i}`,
          assetId: treeAsset.id,
          position: new THREE.Vector3(x, 0, z),
          rotation: new THREE.Vector3(0, random() * Math.PI * 2, 0),
          scale: new THREE.Vector3(1, 1, 1),
        });
      }
    }

    // Generate positions for rocks
    const rockCount = 20;
    for (let i = 0; i < rockCount; i++) {
      const angle = random() * Math.PI * 2;
      const distance = random() * placementRadius;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Pick random rock asset
      const rockAsset = rockAssets[Math.floor(random() * rockAssets.length)];
      
      if (rockAsset) {
        const scale = 0.5 + random() * 0.5;
        assets.push({
          id: `rock-${i}`,
          assetId: rockAsset.id,
          position: new THREE.Vector3(x, 0, z),
          rotation: new THREE.Vector3(0, random() * Math.PI * 2, 0),
          scale: new THREE.Vector3(scale, scale, scale),
        });
      }
    }

    // Load all models
    const loadedAssets = await Promise.all(
      assets.map(async (asset) => {
        try {
          const model = await assetRegistry.loadModel(asset.assetId);
          return { ...asset, model };
        } catch (error) {
          console.warn(`Failed to load asset ${asset.assetId}:`, error);
          return asset;
        }
      })
    );

    setPlacedAssets(loadedAssets);
    setIsLoading(false);
  }

  return (
    <group ref={groupRef}>
      {placedAssets.map((asset) => (
        asset.model ? (
          <primitive
            key={asset.id}
            object={asset.model}
            position={asset.position.toArray()}
            rotation={asset.rotation.toArray()}
            scale={asset.scale.toArray()}
            castShadow
            receiveShadow
            userData={{ occludable: true, assetId: asset.id }}
          />
        ) : null
      ))}
    </group>
  );
}

// Seeded random number generator for consistent environments
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}
