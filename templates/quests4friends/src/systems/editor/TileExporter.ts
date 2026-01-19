import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { TileDraft, TileExportData, PlaceableAsset } from '../../types/editor.types';
import { getAssetById } from './AssetPalette';

/**
 * Tile Exporter System - Handles saving, loading, and exporting tiles
 * 
 * This system provides functionality to:
 * - Save tiles to local storage
 * - Export tiles as GLB 3D models
 * - Export tiles as JSON configuration
 * - Load tiles from storage
 */

export class TileExporter {
  private static loader = new GLTFLoader();
  private static exporter = new GLTFExporter();

  /**
   * Save tile draft to local storage
   */
  static saveToLocal(tileDraft: TileDraft): void {
    try {
      const storageKey = `tile_${tileDraft.id}`;
      const tileData = {
        ...tileDraft,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(tileData));
      console.log(`[TileExporter] ✓ Tile "${tileDraft.name}" saved to local storage`);
    } catch (error) {
      console.error('[TileExporter] Failed to save tile to local storage:', error);
      throw new Error(`Failed to save tile: ${error}`);
    }
  }

  /**
   * Load tile draft from local storage
   */
  static loadFromLocal(tileId: string): TileDraft | null {
    try {
      const storageKey = `tile_${tileId}`;
      const tileData = localStorage.getItem(storageKey);
      
      if (!tileData) {
        console.log(`[TileExporter] No tile found with ID: ${tileId}`);
        return null;
      }

      const parsed = JSON.parse(tileData);
      // Convert date strings back to Date objects
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.updatedAt = new Date(parsed.updatedAt);
      
      console.log(`[TileExporter] ✓ Tile "${parsed.name}" loaded from local storage`);
      return parsed;
    } catch (error) {
      console.error('[TileExporter] Failed to load tile from local storage:', error);
      return null;
    }
  }

  /**
   * List all saved tiles in local storage
   */
  static listSavedTiles(): Array<{ id: string; name: string; savedAt: string }> {
    const tiles: Array<{ id: string; name: string; savedAt: string }> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('tile_')) {
          const tileId = key.replace('tile_', '');
          const tileData = localStorage.getItem(key);
          
          if (tileData) {
            const parsed = JSON.parse(tileData);
            tiles.push({
              id: tileId,
              name: parsed.name,
              savedAt: parsed.savedAt || 'Unknown'
            });
          }
        }
      }
    } catch (error) {
      console.error('[TileExporter] Failed to list saved tiles:', error);
    }

    return tiles.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  /**
   * Delete tile from local storage
   */
  static deleteFromLocal(tileId: string): boolean {
    try {
      const storageKey = `tile_${tileId}`;
      localStorage.removeItem(storageKey);
      console.log(`[TileExporter] ✓ Tile "${tileId}" deleted from local storage`);
      return true;
    } catch (error) {
      console.error('[TileExporter] Failed to delete tile from local storage:', error);
      return false;
    }
  }

  /**
   * Export tile as GLB 3D model
   * Merges all asset geometries into a single mesh
   */
  static async exportAsGLB(
    tileDraft: TileDraft, 
    assetPalette: PlaceableAsset[] = []
  ): Promise<Blob> {
    try {
      console.log(`[TileExporter] Starting GLB export for tile "${tileDraft.name}"`);
      
      // Create a scene to hold all the meshes
      const scene = new THREE.Scene();
      scene.name = `Tile_${tileDraft.name}`;

      // Load and place each asset
      const loadPromises = tileDraft.assets.map(async (placement) => {
        const asset = getAssetById(placement.assetId) || 
                     assetPalette.find(a => a.id === placement.assetId);
        
        if (!asset || !asset.modelPath) {
          console.warn(`[TileExporter] Asset not found or has no model: ${placement.assetId}`);
          return;
        }

        try {
          // Load the GLTF model
          const gltf = await new Promise<any>((resolve, reject) => {
            this.loader.load(
              asset.modelPath,
              (data) => resolve(data),
              undefined,
              (error) => reject(error)
            );
          });

          // Clone the scene
          const clonedScene = gltf.scene.clone(true);
          
          // Apply transforms
          clonedScene.position.set(...placement.position);
          clonedScene.rotation.set(...placement.rotation);
          clonedScene.scale.set(...placement.scale);

          // Ensure meshes cast and receive shadows
          clonedScene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          scene.add(clonedScene);
        } catch (error) {
          console.warn(`[TileExporter] Failed to load asset ${placement.assetId}:`, error);
        }
      });

      // Wait for all assets to load
      await Promise.all(loadPromises);

      // Create a ground plane for the tile (10x10)
      const groundGeometry = new THREE.PlaneGeometry(10, 10);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: tileDraft.baseTexture === 'grass' ? '#4a7c59' : 
               tileDraft.baseTexture === 'dirt' ? '#8b4513' :
               tileDraft.baseTexture === 'rock' ? '#696969' :
               tileDraft.baseTexture === 'water' ? '#1e90ff' : '#4a7c59',
        transparent: true,
        opacity: 0.8
      });
      const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.receiveShadow = true;
      scene.add(groundMesh);

      // Export as GLB
      const glbBlob = await new Promise<Blob>((resolve, reject) => {
        this.exporter.parse(
          scene,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(new Blob([result], { type: 'model/gltf-binary' }));
            } else {
              resolve(new Blob([JSON.stringify(result)], { type: 'application/json' }));
            }
          },
          (error) => reject(error),
          { binary: true, embedImages: true }
        );
      });

      console.log(`[TileExporter] ✓ GLB export completed for "${tileDraft.name}"`);
      return glbBlob;
    } catch (error) {
      console.error('[TileExporter] GLB export failed:', error);
      throw new Error(`GLB export failed: ${error}`);
    }
  }

  /**
   * Export tile as JSON configuration
   */
  static exportAsJSON(tileDraft: TileDraft): TileExportData {
    return {
      name: tileDraft.name,
      assets: tileDraft.assets,
      metadata: {
        size: tileDraft.size,
        exportedAt: new Date(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Download tile as JSON file
   */
  static downloadAsJSON(tileDraft: TileDraft): void {
    try {
      const exportData = this.exportAsJSON(tileDraft);
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `tile_${tileDraft.name.replace(/\s+/g, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[TileExporter] ✓ JSON export downloaded for "${tileDraft.name}"`);
    } catch (error) {
      console.error('[TileExporter] JSON export failed:', error);
      throw error;
    }
  }

  /**
   * Download tile as GLB file
   */
  static async downloadAsGLB(tileDraft: TileDraft, assetPalette: PlaceableAsset[] = []): Promise<void> {
    try {
      const glbBlob = await this.exportAsGLB(tileDraft, assetPalette);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(glbBlob);
      link.download = `tile_${tileDraft.name.replace(/\s+/g, '_').toLowerCase()}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[TileExporter] ✓ GLB export downloaded for "${tileDraft.name}"`);
    } catch (error) {
      console.error('[TileExporter] GLB download failed:', error);
      throw error;
    }
  }

  /**
   * Import tile from JSON file
   */
  static async importFromJSON(file: File): Promise<TileExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          
          // Validate the imported data
          if (!jsonData.name || !jsonData.assets || !jsonData.metadata) {
            throw new Error('Invalid tile format: missing required fields');
          }
          
          console.log(`[TileExporter] ✓ Tile "${jsonData.name}" imported from JSON`);
          resolve(jsonData);
        } catch (error) {
          console.error('[TileExporter] JSON import failed:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Generate unique tile ID
   */
  static generateTileId(): string {
    return `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate tile draft
   */
  static validateTileDraft(tileDraft: TileDraft): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!tileDraft.name || tileDraft.name.trim() === '') {
      errors.push('Tile name is required');
    }
    
    if (tileDraft.size !== 10) {
      errors.push('Tile size must be 10x10');
    }
    
    // Validate assets
    tileDraft.assets.forEach((asset, index) => {
      if (!asset.id) {
        errors.push(`Asset ${index}: Missing placement ID`);
      }
      if (!asset.assetId) {
        errors.push(`Asset ${index}: Missing asset ID`);
      }
      if (!asset.position || asset.position.length !== 3) {
        errors.push(`Asset ${index}: Invalid position`);
      }
      if (!asset.rotation || asset.rotation.length !== 3) {
        errors.push(`Asset ${index}: Invalid rotation`);
      }
      if (!asset.scale || asset.scale.length !== 3) {
        errors.push(`Asset ${index}: Invalid scale`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}