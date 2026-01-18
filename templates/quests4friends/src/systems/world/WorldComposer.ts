import { TileInstance, WorldGrid, PlayerPosition } from '../../types/tile.types';
import { TileRegistry } from './TileRegistry';
import { TileGenerator } from './TileGenerator';
import { TileLoader, TileContent } from './TileLoader';
import { Group } from 'three';

/**
 * WorldComposer - Manages tile grid, streaming, and active tile lifecycle
 * Coordinates between TileRegistry, TileGenerator, and TileLoader
 */
export class WorldComposer {
  private worldGrid: WorldGrid;
  private activeTiles: Map<string, TileInstance> = new Map();
  private loadedTileContents: Map<string, TileContent> = new Map();
  private tileGroups: Map<string, Group> = new Map();
  
  private loadRadius: number = 2; // Tiles to load around player
  private streamingEnabled: boolean = false;
  private currentPlayerTile: [number, number] = [0, 0];

  constructor(worldSeed: number = 1337) {
    this.worldGrid = {
      tiles: [],
      width: 0,
      height: 0,
      worldSeed,
      metadata: {
        tileSize: 10,
        loadedTileCount: 0,
        activeTileCount: 0
      }
    };
  }

  /**
   * Load a world grid definition
   * @param gridArray 2D array of tile IDs
   */
  async loadWorldGrid(gridArray: string[][]) {
    console.log('[WorldComposer] Loading world grid:', gridArray.length, 'x', gridArray[0]?.length || 0);
    
    this.worldGrid.width = gridArray.length;
    this.worldGrid.height = gridArray[0]?.length || 0;
    this.worldGrid.tiles = [];
    
    // Validate all tile IDs exist
    for (let y = 0; y < this.worldGrid.height; y++) {
      const row: any[] = [];
      this.worldGrid.tiles.push(row);
      
      for (let x = 0; x < this.worldGrid.width; x++) {
        const tileId = gridArray[x][y];
        const definition = TileRegistry.getTileDefinition(tileId);
        
        if (!definition) {
          throw new Error(`Unknown tile type: ${tileId}`);
        }
        
        // Generate tile instance
        const tileInstance = TileGenerator.generateTile(
          definition,
          x,
          y,
          this.worldGrid.worldSeed
        );
        
        row.push(tileInstance);
      }
    }
    
    console.log(`[WorldComposer] World grid loaded: ${this.worldGrid.width}x${this.worldGrid.height} tiles`);
  }

  /**
   * Get tiles within loading radius of player position
   * @param playerPos Current player position
   * @returns Array of tile instances within range
   */
  getActiveTiles(playerPos: PlayerPosition): TileInstance[] {
    const tiles: TileInstance[] = [];
    const startX = Math.max(0, playerPos.gridX - this.loadRadius);
    const endX = Math.min(this.worldGrid.width - 1, playerPos.gridX + this.loadRadius);
    const startY = Math.max(0, playerPos.gridY - this.loadRadius);
    const endY = Math.min(this.worldGrid.height - 1, playerPos.gridY + this.loadRadius);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const tile = this.worldGrid.tiles[x]?.[y];
        if (tile) {
          tiles.push(tile);
        }
      }
    }
    
    return tiles;
  }

  /**
   * Stream tiles based on player position - load new tiles, unload distant ones
   * @param playerPos Current player position
   */
  async streamTiles(playerPos: PlayerPosition) {
    const [prevGridX, prevGridY] = this.currentPlayerTile;
    const { gridX, gridY } = playerPos;
    
    // Only update if player moved to a different tile
    if (gridX === prevGridX && gridY === prevGridY && this.streamingEnabled) {
      return;
    }
    
    console.log(`[WorldComposer] Player moved to tile: ${gridX}, ${gridY}`);
    this.currentPlayerTile = [gridX, gridY];
    
    // Get tiles that should be active
    const targetTiles = this.getActiveTiles(playerPos);
    const targetTileIds = new Set(targetTiles.map(t => t.id));
    
    // Find tiles to unload (currently loaded but not in target)
    const tilesToUnload = Array.from(this.activeTiles.keys())
      .filter(id => !targetTileIds.has(id));
    
    // Unload distant tiles
    await this.unloadTiles(tilesToUnload);
    
    // Load new tiles
    const tilesToLoad = targetTiles.filter(t => !this.activeTiles.has(t.id));
    await this.loadTiles(tilesToLoad);
    
    this.worldGrid.metadata.activeTileCount = this.activeTiles.size;
    this.worldGrid.metadata.loadedTileCount = this.loadedTileContents.size;
    
    console.log(`[WorldComposer] Active tiles: ${this.activeTiles.size}, Loaded: ${this.loadedTileContents.size}`);
  }

  /**
   * Load multiple tiles
   */
  private async loadTiles(tiles: TileInstance[]) {
    console.log(`[WorldComposer] Loading ${tiles.length} tiles`);
    
    const loadPromises = tiles.map(async (tile) => {
      try {
        // Mark as active immediately
        this.activeTiles.set(tile.id, tile);
        
        // Load tile contents - convert TileObjectConfig to PlacedTileObject
        const placedObjects = tile.objects.map((obj, index) => ({
          id: `${tile.id}_obj_${index}`,
          type: 'ground' as const, // Default type
          modelId: obj.modelId,
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.position.clone().setScalar(obj.scale), // Convert number to Vector3
          collider: obj.collider
        }));
        const tileContent = await TileLoader.loadTile(tile.id, placedObjects);
        this.loadedTileContents.set(tile.id, tileContent);
        
        // Create tile group
        const group = new Group();
        group.name = `tile_${tile.id}`;
        
        // Add loaded meshes to group
        for (const loadedObj of tileContent.objects) {
          if (loadedObj.mesh) {
            // Position and orient the mesh
            const mesh = loadedObj.mesh;
            const { position, rotation, scale } = loadedObj.placedObject;
            
            mesh.position.copy(position);
            mesh.rotation.set(rotation.x, rotation.y, rotation.z);
            // scale can be Vector3 or number
            if (typeof scale === 'number') {
              mesh.scale.setScalar(scale);
            } else {
              mesh.scale.copy(scale);
            }
            
            group.add(mesh);
          }
        }
        
        this.tileGroups.set(tile.id, group);
        console.log(`[WorldComposer] Tile loaded: ${tile.id}`);
        
      } catch (error) {
        console.error(`[WorldComposer] Failed to load tile ${tile.id}:`, error);
        this.activeTiles.delete(tile.id);
      }
    });
    
    await Promise.all(loadPromises);
  }

  /**
   * Unload tiles and free resources
   */
  private async unloadTiles(tileIds: string[]) {
    console.log(`[WorldComposer] Unloading ${tileIds.length} tiles`);
    
    for (const tileId of tileIds) {
      // Remove from active tiles
      this.activeTiles.delete(tileId);
      
      // Remove loaded content
      const content = this.loadedTileContents.get(tileId);
      if (content) {
        // Dispose of meshes
        for (const obj of content.objects) {
          if (obj.mesh) {
            // Three.js will handle cleanup when removed from scene
            obj.mesh = null;
          }
        }
        this.loadedTileContents.delete(tileId);
      }
      
      // Remove tile group
      const group = this.tileGroups.get(tileId);
      if (group) {
        // Remove from parent if it has one
        group.clear();
        this.tileGroups.delete(tileId);
      }
      
      console.log(`[WorldComposer] Tile unloaded: ${tileId}`);
    }
  }

  /**
   * Get tile at specific grid coordinates
   */
  getTile(gridX: number, gridY: number): TileInstance | undefined {
    if (gridX < 0 || gridX >= this.worldGrid.width || 
        gridY < 0 || gridY >= this.worldGrid.height) {
      return undefined;
    }
    return this.worldGrid.tiles[gridX]?.[gridY];
  }

  /**
   * Get all active tiles
   */
  getActiveTileInstances(): TileInstance[] {
    return Array.from(this.activeTiles.values());
  }

  /**
   * Get tile groups for rendering
   */
  getTileGroups(): Group[] {
    return Array.from(this.tileGroups.values());
  }

  /**
   * Get all colliders from active tiles
   */
  getActiveColliders() {
    const colliders: any[] = [];
    
    for (const tile of this.activeTiles.values()) {
      colliders.push(...tile.colliders);
    }
    
    return colliders;
  }

  /**
   * Enable/disable tile streaming
   */
  setStreamingEnabled(enabled: boolean) {
    this.streamingEnabled = enabled;
    console.log(`[WorldComposer] Streaming ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current world grid metadata
   */
  getGridMetadata() {
    return {
      ...this.worldGrid.metadata,
      width: this.worldGrid.width,
      height: this.worldGrid.height,
      worldSeed: this.worldGrid.worldSeed
    };
  }

  /**
   * Update player position and trigger streaming if needed
   */
  async updatePlayerPosition(worldX: number, worldZ: number) {
    const gridX = Math.floor(worldX / this.worldGrid.metadata.tileSize);
    const gridY = Math.floor(worldZ / this.worldGrid.metadata.tileSize);
    
    const playerPos: PlayerPosition = {
      x: worldX,
      z: worldZ,
      gridX,
      gridY
    };
    
    await this.streamTiles(playerPos);
  }

  /**
   * Force reload all active tiles
   */
  async reloadActiveTiles() {
    console.log('[WorldComposer] Reloading all active tiles');
    
    const activeTileIds = Array.from(this.activeTiles.keys());
    await this.unloadTiles(activeTileIds);
    
    const [gridX, gridY] = this.currentPlayerTile;
    const playerPos: PlayerPosition = {
      x: gridX * this.worldGrid.metadata.tileSize,
      z: gridY * this.worldGrid.metadata.tileSize,
      gridX,
      gridY
    };
    
    await this.streamTiles(playerPos);
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    console.log('[WorldComposer] Disposing world composer');
    
    this.activeTiles.clear();
    this.loadedTileContents.clear();
    
    // Clear tile groups
    for (const group of this.tileGroups.values()) {
      group.clear();
    }
    this.tileGroups.clear();
  }
}