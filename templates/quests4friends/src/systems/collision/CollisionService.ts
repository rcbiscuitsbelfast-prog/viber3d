/**
 * CollisionService — merge, export, and persist collision meshes.
 * Use before save / "next" to avoid asset-overload crashes. See MASTER_PLAN.md.
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as LZString from 'lz-string';
import { mergeWorldCollision } from './CollisionMerger';
import { log, error } from '../../utils/logger';
import type { BlockData, PlacedAssetData, WorldExportPayload } from './types';

const COLLISION_KEY = 'quest_collisions_merged';
const COLLISION_KEY_PREFIX = 'quest_collisions_merged_group_';
const LEVEL_METADATA_KEY = 'level_metadata';
const PLACED_ASSETS_KEY = 'placed_assets_data';
const PLACED_BLOCKS_KEY = 'placed_blocks_data';
const PLAYER_SPAWN_KEY = 'player_spawn';

export interface ExportWorldInput {
  blocks: BlockData[];
  assets: PlacedAssetData[];
  playerSpawn?: { x: number; y: number; z: number };
}

/**
 * Merge blocks + assets, export to GLB, compress, and save to localStorage.
 * Returns the full payload for navigation / Kenny Demo consumption.
 */
export async function exportWorldCollision(input: ExportWorldInput): Promise<WorldExportPayload> {
  const result = await mergeWorldCollision({ blocks: input.blocks, assets: input.assets });

  // Export primary collision mesh
  const primaryMesh = new THREE.Mesh(
    result.mergedGeometry,
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  const primaryScene = new THREE.Scene();
  primaryScene.add(primaryMesh);

  const compressed = await new Promise<string>((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      primaryScene,
      (glbResult) => {
        const blob = new Blob([glbResult as ArrayBuffer], { type: 'model/gltf-binary' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string) ?? '';
          const compressed = LZString.compressToBase64(base64);
          resolve(compressed);
        };
        reader.onerror = () => reject(new Error('Failed to encode collision mesh'));
        reader.readAsDataURL(blob);
      },
      (err) => reject(err),
      { binary: true, includeCustomExtensions: true, embedImages: true }
    );
  });

  // Export additional collision meshes for disconnected groups
  const additionalCompressed: string[] = [];
  if (result.additionalGeometries && result.additionalGeometries.length > 0) {
    for (let i = 0; i < result.additionalGeometries.length; i++) {
      const geom = result.additionalGeometries[i];
      const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x808080 }));
      const scene = new THREE.Scene();
      scene.add(mesh);
      
      const groupCompressed = await new Promise<string>((resolve, reject) => {
        const exporter = new GLTFExporter();
        exporter.parse(
          scene,
          (glbResult) => {
            const blob = new Blob([glbResult as ArrayBuffer], { type: 'model/gltf-binary' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string) ?? '';
              const compressed = LZString.compressToBase64(base64);
              resolve(compressed);
            };
            reader.onerror = () => reject(new Error('Failed to encode additional collision mesh'));
            reader.readAsDataURL(blob);
          },
          (err) => reject(err),
          { binary: true, includeCustomExtensions: true, embedImages: true }
        );
      });
      
      additionalCompressed.push(groupCompressed);
      localStorage.setItem(`${COLLISION_KEY_PREFIX}${i}`, groupCompressed);
    }
  }

  const levelMetadata = {
    blockCount: input.blocks.length,
    assetCount: input.assets.length,
    createdAt: new Date().toISOString(),
    groupCount: 1 + (result.additionalGeometries?.length ?? 0),
  };

  const placedAssetsData = input.assets.map((a) => ({
    id: a.id,
    assetName: a.asset.name,
    assetPath: a.asset.path,
    position: a.position,
    rotation: a.rotation,
    scale: a.scale,
    defaultScale: a.asset.defaultScale,
  }));

  const placedBlocksData = input.blocks.map((b) => ({
    id: b.id,
    blockType: b.blockType,
    position: b.position,
    rotation: b.rotation,
    scale: b.scale,
  }));

  localStorage.setItem(COLLISION_KEY, compressed);
  localStorage.setItem(LEVEL_METADATA_KEY, JSON.stringify(levelMetadata));
  localStorage.setItem(PLACED_ASSETS_KEY, JSON.stringify(placedAssetsData));
  localStorage.setItem(PLACED_BLOCKS_KEY, JSON.stringify(placedBlocksData));
  localStorage.setItem(
    PLAYER_SPAWN_KEY,
    JSON.stringify(input.playerSpawn ?? { x: 0, y: 0, z: 0 })
  );

  log('[CollisionService] Exported:', {
    collisionKey: COLLISION_KEY,
    additionalGroups: result.additionalGeometries?.length ?? 0,
    vertexCount: result.vertexCount,
    blockCount: input.blocks.length,
    assetCount: input.assets.length,
    failedAssets: result.failedAssets,
  });

  return {
    collisionKey: COLLISION_KEY,
    collisionCompressed: compressed,
    levelMetadata,
    placedAssetsData,
    placedBlocksData,
  };
}

/**
 * Load compressed collision mesh from localStorage and parse to GLTF scene.
 * Returns the scene's root (THREE.Group) or null if missing/invalid.
 */
export async function loadCollisionMesh(key: string = COLLISION_KEY): Promise<THREE.Group | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();

  try {
    const decompressed = LZString.decompressFromBase64(raw) ?? raw;
    const base64 = decompressed.includes(',') ? decompressed.split(',')[1] : decompressed;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return await new Promise<THREE.Group | null>((resolve) => {
      loader.parse(
        bytes.buffer,
        '',
        (gltf) => resolve(gltf.scene),
        (e) => {
          error('[CollisionService] Failed to parse collision mesh', e);
          resolve(null);
        }
      );
    });
  } catch (e) {
    error('[CollisionService] Error loading collision mesh', e);
    return null;
  }
}
