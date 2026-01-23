/**
 * Collision system — unified merge-on-save.
 * See MASTER_PLAN.md and CollisionMerger.ts.
 */

export { mergeWorldCollision } from './CollisionMerger';
export { exportWorldCollision, loadCollisionMesh } from './CollisionService';
export type { ExportWorldInput } from './CollisionService';
export type {
  BlockData,
  PlacedAssetData,
  AssetInfo,
  MergeWorldInput,
  MergeWorldResult,
  WorldExportPayload,
} from './types';
