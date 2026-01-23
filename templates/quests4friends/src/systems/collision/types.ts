/**
 * Types for collision merging system.
 * See MASTER_PLAN.md: unified collision/mesh merging prevents asset-overload crashes.
 */

export interface BlockData {
  id: string;
  blockType: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export interface AssetInfo {
  name: string;
  path: string;
  defaultScale?: number;
  [key: string]: unknown;
}

export interface PlacedAssetData {
  id: string;
  asset: AssetInfo;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export interface MergeWorldInput {
  blocks: BlockData[];
  assets: PlacedAssetData[];
}

export interface MergeWorldResult {
  mergedGeometry: import('three').BufferGeometry;
  vertexCount: number;
  blockCount: number;
  assetCount: number;
  failedAssets: string[];
  // Additional geometries for disconnected groups (if blocks aren't all connected)
  additionalGeometries?: import('three').BufferGeometry[];
}

export interface WorldExportPayload {
  collisionKey: string;
  collisionCompressed: string;
  levelMetadata: {
    blockCount: number;
    assetCount: number;
    createdAt: string;
  };
  placedAssetsData: Array<{
    id: string;
    assetName: string;
    assetPath: string;
    position: [number, number, number];
    rotation: number;
    scale: number;
    defaultScale?: number;
  }>;
  placedBlocksData: Array<{
    id: string;
    blockType: string;
    position: [number, number, number];
    rotation: number;
    scale: number;
  }>;
}
