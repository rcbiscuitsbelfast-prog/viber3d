/**
 * CollisionMerger — unified collision/mesh merging.
 * Merges all world geometry (blocks + assets) into a single mesh before save.
 * Prevents runtime crashes from asset overload. See MASTER_PLAN.md.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { log, warn, error } from '../../utils/logger';
import type { BlockData, PlacedAssetData, MergeWorldInput, MergeWorldResult } from './types';

const loader = new GLTFLoader();

function normalizeForMerge(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  let normalized = geo.clone();
  if (normalized.index) {
    normalized = normalized.toNonIndexed();
  }
  Object.keys(normalized.attributes).forEach((attr) => {
    if (attr !== 'position') {
      normalized.deleteAttribute(attr);
    }
  });
  return normalized;
}

/**
 * Add block geometries (box colliders) to the list.
 */
function addBlockGeometries(blocks: BlockData[], out: THREE.BufferGeometry[]): void {
  for (const block of blocks) {
    const [bx, by, bz] = block.position;
    const geometry = new THREE.BoxGeometry(block.scale, block.scale, block.scale);
    const mesh = new THREE.Mesh(geometry);
    mesh.position.set(bx, by, bz);
    mesh.rotation.setFromQuaternion(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), block.rotation)
    );
    mesh.updateMatrixWorld();
    const geom = geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    out.push(geom);
  }
  log('[CollisionMerger] Block geometries:', blocks.length);
}

/**
 * Load asset, extract meshes with world transform, push geometries.
 * Returns names of assets that failed to load.
 */
async function addAssetGeometries(
  assets: PlacedAssetData[],
  out: THREE.BufferGeometry[]
): Promise<string[]> {
  const failed: string[] = [];

  await Promise.all(
    assets.map((asset) =>
      new Promise<void>((resolve) => {
        loader.load(
          asset.asset.path,
          (gltf) => {
            try {
              const assetGroup = new THREE.Group();
              assetGroup.position.set(...asset.position);
              assetGroup.rotation.setFromQuaternion(
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), asset.rotation)
              );
              const cloned = gltf.scene.clone();
              const finalScale = asset.scale * (asset.asset.defaultScale ?? 1);
              cloned.scale.setScalar(finalScale);
              assetGroup.add(cloned);
              assetGroup.updateMatrixWorld(true);

              assetGroup.traverse((child) => {
                if (child instanceof THREE.Mesh && child.geometry) {
                  const g = (child.geometry as THREE.BufferGeometry).clone();
                  g.applyMatrix4(child.matrixWorld);
                  out.push(g);
                }
              });
            } catch (e) {
              warn('[CollisionMerger] Failed to process asset', asset.asset.name, e);
              failed.push(asset.asset.name);
            }
            resolve();
          },
          undefined,
          (err) => {
            error('[CollisionMerger] Failed to load asset', asset.asset.name, err);
            failed.push(asset.asset.name);
            resolve();
          }
        );
      })
    )
  );

  log('[CollisionMerger] Asset geometries added:', out.length, 'failed:', failed.length);
  return failed;
}

/**
 * Check if two blocks are touching (connected).
 */
function areBlocksConnected(b1: BlockData, b2: BlockData, threshold: number = 0.1): boolean {
  const [x1, y1, z1] = b1.position;
  const [x2, y2, z2] = b2.position;
  const half1 = b1.scale / 2;
  const half2 = b2.scale / 2;
  
  // Check if blocks overlap or are adjacent in X/Z (horizontal connection)
  const dx = Math.abs(x1 - x2);
  const dz = Math.abs(z1 - z2);
  const maxX = half1 + half2 + threshold;
  const maxZ = half1 + half2 + threshold;
  
  // Check vertical overlap (same Y level or adjacent)
  const dy = Math.abs(y1 - y2);
  const maxY = half1 + half2 + threshold;
  
  return dx <= maxX && dz <= maxZ && dy <= maxY;
}

/**
 * Find connected groups of blocks using union-find.
 */
function findConnectedGroups(blocks: BlockData[]): BlockData[][] {
  const groups: BlockData[][] = [];
  const assigned = new Set<number>();
  
  for (let i = 0; i < blocks.length; i++) {
    if (assigned.has(i)) continue;
    
    const group: BlockData[] = [blocks[i]];
    assigned.add(i);
    const queue = [i];
    
    while (queue.length > 0) {
      const currentIdx = queue.shift()!;
      const current = blocks[currentIdx];
      
      for (let j = 0; j < blocks.length; j++) {
        if (assigned.has(j)) continue;
        if (areBlocksConnected(current, blocks[j])) {
          group.push(blocks[j]);
          assigned.add(j);
          queue.push(j);
        }
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * Assign assets to the nearest block group.
 */
function assignAssetsToGroups(
  assets: PlacedAssetData[],
  blockGroups: BlockData[][]
): PlacedAssetData[][] {
  const assetGroups: PlacedAssetData[][] = blockGroups.map(() => []);
  
  for (const asset of assets) {
    let closestGroupIdx = 0;
    let minDist = Infinity;
    
    for (let i = 0; i < blockGroups.length; i++) {
      for (const block of blockGroups[i]) {
        const [ax, , az] = asset.position;
        const [bx, , bz] = block.position;
        const dist = Math.sqrt((ax - bx) ** 2 + (az - bz) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closestGroupIdx = i;
        }
      }
    }
    
    assetGroups[closestGroupIdx].push(asset);
  }
  
  return assetGroups;
}

/**
 * Merge all blocks + assets into one or more BufferGeometries (one per connected group).
 * If blocks aren't connected, saves multiple meshes to keep collisions intact.
 */
export async function mergeWorldCollision(input: MergeWorldInput): Promise<MergeWorldResult> {
  // Find connected block groups
  const blockGroups = findConnectedGroups(input.blocks);
  log('[CollisionMerger] Found', blockGroups.length, 'connected block groups');
  
  // Assign assets to nearest block group
  const assetGroups = assignAssetsToGroups(input.assets, blockGroups);
  
  // Merge each group separately
  const mergedGeometries: THREE.BufferGeometry[] = [];
  let totalVertexCount = 0;
  const allFailedAssets: string[] = [];
  
  for (let i = 0; i < blockGroups.length; i++) {
    const blockGroup = blockGroups[i];
    const assetGroup = assetGroups[i];
    const groupGeometries: THREE.BufferGeometry[] = [];
    
    // Add blocks for this group
    addBlockGeometries(blockGroup, groupGeometries);
    
    // Add assets for this group
    const failed = await addAssetGeometries(assetGroup, groupGeometries);
    allFailedAssets.push(...failed);
    
    if (groupGeometries.length === 0) {
      warn('[CollisionMerger] Group', i, 'has no geometries, skipping');
      continue;
    }
    
    // Merge this group
    const normalized = groupGeometries.map(normalizeForMerge);
    const merged = BufferGeometryUtils.mergeGeometries(normalized, false);
    if (!merged) {
      warn('[CollisionMerger] Failed to merge group', i);
      continue;
    }
    
    mergedGeometries.push(merged);
    totalVertexCount += merged.attributes.position?.count ?? 0;
  }
  
  if (mergedGeometries.length === 0) {
    throw new Error('CollisionMerger: No geometries to merge (blocks + assets).');
  }
  
  // If only one group, return single geometry (backward compatible)
  // Otherwise, we'll need to update the return type to handle multiple meshes
  const primaryGeometry = mergedGeometries[0];
  
  log('[CollisionMerger] Merged', mergedGeometries.length, 'group(s):', {
    vertices: totalVertexCount,
    blocks: input.blocks.length,
    assets: input.assets.length,
    failedAssets: allFailedAssets.length,
  });

  return {
    mergedGeometry: primaryGeometry,
    vertexCount: totalVertexCount,
    blockCount: input.blocks.length,
    assetCount: input.assets.length,
    failedAssets: allFailedAssets,
    // Store additional geometries for multi-mesh support
    additionalGeometries: mergedGeometries.slice(1),
  };
}
