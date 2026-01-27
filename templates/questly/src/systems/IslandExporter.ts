/**
 * IslandExporter - Merge and export island terrain + assets as optimized GLB mesh
 * Based on proven CollisionMerger pattern from quests4friends
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const loader = new GLTFLoader();

export interface PlacedAsset {
  id: string;
  type: string;
  modelPath: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
  variant?: number;
}

export interface IslandData {
  terrain: THREE.BufferGeometry;
  trees: PlacedAsset[];
  grass: PlacedAsset[];
  rocks: PlacedAsset[];
  bushes: PlacedAsset[];
}

export interface ExportResult {
  visualBlob: Blob; // Full mesh with all assets
  collisionBlob: Blob; // Terrain + trees + rocks only
  stats: {
    terrainFaces: number;
    treesCount: number;
    rocksCount: number;
    grassCount: number;
    bushesCount: number;
    totalVertices: number;
  };
}

/**
 * Normalize geometry for merging - remove indices, keep only position
 */
function normalizeGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  let normalized = geo.clone();
  if (normalized.index) {
    normalized = normalized.toNonIndexed();
  }
  // Keep position only for collisions
  Object.keys(normalized.attributes).forEach((attr) => {
    if (attr !== 'position') {
      normalized.deleteAttribute(attr);
    }
  });
  return normalized;
}

/**
 * Load GLTF asset and extract all mesh geometries with transforms applied
 */
async function loadAssetGeometries(
  asset: PlacedAsset,
  applyTransform: boolean = true
): Promise<THREE.BufferGeometry[]> {
  return new Promise((resolve, reject) => {
    loader.load(
      asset.modelPath,
      (gltf) => {
        try {
          const geometries: THREE.BufferGeometry[] = [];
          const group = new THREE.Group();
          
          if (applyTransform) {
            group.position.set(...asset.position);
            group.rotation.setFromQuaternion(
              new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), asset.rotation)
            );
          }
          
          const cloned = gltf.scene.clone();
          cloned.scale.setScalar(asset.scale);
          group.add(cloned);
          group.updateMatrixWorld(true);

          group.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              const g = (child.geometry as THREE.BufferGeometry).clone();
              if (applyTransform) {
                g.applyMatrix4(child.matrixWorld);
              }
              geometries.push(g);
            }
          });

          resolve(geometries);
        } catch (e) {
          console.error('[IslandExporter] Failed to process asset', asset.type, e);
          reject(e);
        }
      },
      undefined,
      (err) => {
        console.error('[IslandExporter] Failed to load asset', asset.modelPath, err);
        reject(err);
      }
    );
  });
}

/**
 * Export island as two optimized GLB files:
 * 1. Visual mesh (terrain + all assets)
 * 2. Collision mesh (terrain + trees + rocks)
 */
export async function exportIsland(data: IslandData): Promise<ExportResult> {
  console.log('[IslandExporter] Starting export...');
  
  const visualGeometries: THREE.BufferGeometry[] = [];
  const collisionGeometries: THREE.BufferGeometry[] = [];
  
  // Add terrain to both
  visualGeometries.push(data.terrain.clone());
  collisionGeometries.push(normalizeGeometry(data.terrain));
  
  // Load and add trees (both visual and collision)
  console.log('[IslandExporter] Loading trees...');
  for (const tree of data.trees) {
    try {
      const geoms = await loadAssetGeometries(tree, true);
      visualGeometries.push(...geoms);
      collisionGeometries.push(...geoms.map(g => normalizeGeometry(g)));
    } catch (e) {
      console.warn('[IslandExporter] Skipping tree', tree.id, e);
    }
  }
  
  // Load and add rocks (both visual and collision)
  console.log('[IslandExporter] Loading rocks...');
  for (const rock of data.rocks) {
    try {
      const geoms = await loadAssetGeometries(rock, true);
      visualGeometries.push(...geoms);
      collisionGeometries.push(...geoms.map(g => normalizeGeometry(g)));
    } catch (e) {
      console.warn('[IslandExporter] Skipping rock', rock.id, e);
    }
  }
  
  // Load and add grass (visual only)
  console.log('[IslandExporter] Loading grass...');
  for (const grass of data.grass) {
    try {
      const geoms = await loadAssetGeometries(grass, true);
      visualGeometries.push(...geoms);
    } catch (e) {
      console.warn('[IslandExporter] Skipping grass', grass.id, e);
    }
  }
  
  // Load and add bushes (visual only)
  console.log('[IslandExporter] Loading bushes...');
  for (const bush of data.bushes) {
    try {
      const geoms = await loadAssetGeometries(bush, true);
      visualGeometries.push(...geoms);
    } catch (e) {
      console.warn('[IslandExporter] Skipping bush', bush.id, e);
    }
  }
  
  // Merge all geometries
  console.log('[IslandExporter] Merging geometries...');
  const mergedVisual = BufferGeometryUtils.mergeGeometries(visualGeometries, false);
  const mergedCollision = BufferGeometryUtils.mergeGeometries(collisionGeometries, false);
  
  if (!mergedVisual || !mergedCollision) {
    throw new Error('Failed to merge geometries');
  }
  
  // Export visual mesh
  console.log('[IslandExporter] Exporting visual mesh...');
  const visualMesh = new THREE.Mesh(
    mergedVisual,
    new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      vertexColors: true,
      flatShading: true
    })
  );
  visualMesh.castShadow = true;
  visualMesh.receiveShadow = true;
  
  const visualScene = new THREE.Scene();
  visualScene.add(visualMesh);
  
  const visualBlob = await exportToGLB(visualScene);
  
  // Export collision mesh
  console.log('[IslandExporter] Exporting collision mesh...');
  const collisionMesh = new THREE.Mesh(
    mergedCollision,
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  
  const collisionScene = new THREE.Scene();
  collisionScene.add(collisionMesh);
  
  const collisionBlob = await exportToGLB(collisionScene);
  
  const stats = {
    terrainFaces: data.terrain.attributes.position.count / 3,
    treesCount: data.trees.length,
    rocksCount: data.rocks.length,
    grassCount: data.grass.length,
    bushesCount: data.bushes.length,
    totalVertices: mergedVisual.attributes.position.count
  };
  
  console.log('[IslandExporter] Export complete!', stats);
  
  return { visualBlob, collisionBlob, stats };
}

/**
 * Export THREE.Scene to GLB blob
 */
function exportToGLB(scene: THREE.Scene): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
        resolve(blob);
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
