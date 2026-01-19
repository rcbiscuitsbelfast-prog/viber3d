import { TileDefinition, TileInstance, TileObjectConfig, PlacedTileObject, ColliderConfig } from '../../types/tile.types';
import { SeededRandom } from '../../utils/SeededRandom';
import { Vector3 } from 'three';

interface GridSlot {
  x: number;
  z: number;
  occupied: boolean;
}

/**
 * TileGenerator - Procedurally generates tile contents using seeded randomization
 * Ensures deterministic generation: same seed = same tile every time
 */
export class TileGenerator {
  
  /**
   * Generate a tile instance from a tile definition using seeded randomization
   * @param definition Tile template definition
   * @param gridX Grid X coordinate
   * @param gridY Grid Y coordinate  
   * @param worldSeed World seed for consistency
   * @returns Generated tile instance
   */
  static generateTile(
    definition: TileDefinition, 
    gridX: number, 
    gridY: number, 
    worldSeed: number
  ): TileInstance {
    // Create deterministic seed: gridX * 73856093 ^ gridY * 19349663 ^ worldSeed
    // Using prime numbers to reduce hash collisions
    const tileSeed = (gridX * 73856093) ^ (gridY * 19349663) ^ worldSeed;
    const rng = new SeededRandom(tileSeed);
    
    const objects: TileObjectConfig[] = [];
    const colliders: ColliderConfig[] = [];
    
    // Generate placement grid for even distribution
    const placementGrid = this.generatePlacementGrid(definition.size, 2); // 2 unit spacing
    const availableSlots = [...placementGrid];
    
    // Place trees
    if (definition.treeConfigs) {
      for (const config of definition.treeConfigs) {
        const count = rng.randomInt(config.minCount, config.maxCount);
        
        for (let i = 0; i < count && availableSlots.length > 0; i++) {
          const slotIndex = rng.randomInt(0, availableSlots.length - 1);
          const slot = availableSlots[slotIndex];
          availableSlots.splice(slotIndex, 1);
          
          // Add some random jitter to avoid perfect grid alignment
          const jitterX = rng.randomRange(-0.5, 0.5);
          const jitterZ = rng.randomRange(-0.5, 0.5);
          
          const scale = rng.randomRange(config.minScale, config.maxScale);
          const rotation = new Vector3(0, rng.randomRange(0, Math.PI * 2), 0);
          
          const worldPos = new Vector3(
            (gridX * definition.size) + slot.x + jitterX,
            0, // Ground level
            (gridY * definition.size) + slot.z + jitterZ
          );
          
          // Trees always have colliders (large objects)
          const treeColliderSize = new Vector3(1.5 * scale, 4 * scale, 1.5 * scale);
          objects.push({
            modelId: config.modelId,
            position: worldPos,
            rotation: rotation,
            scale: scale,
            collider: {
              type: 'box',
              size: treeColliderSize,
              offset: new Vector3(0, treeColliderSize.y * 0.5, 0),
              isTrigger: false
            }
          });
          
          // Add collider to tile's collider list
          colliders.push({
            type: 'box',
            size: treeColliderSize,
            offset: worldPos.clone().add(new Vector3(0, treeColliderSize.y * 0.5, 0)),
            isTrigger: false
          });
        }
      }
    }
    
    // Place rocks (with colliders)
    if (definition.rockConfigs) {
      // Use a separate grid for rocks to avoid overlap with trees
      const rockGrid = this.generatePlacementGrid(definition.size, 3); // 3 unit spacing
      const rockSlots = [...rockGrid];
      
      for (const config of definition.rockConfigs) {
        const count = rng.randomInt(config.minCount, config.maxCount);
        
        for (let i = 0; i < count && rockSlots.length > 0; i++) {
          const slotIndex = rng.randomInt(0, rockSlots.length - 1);
          const slot = rockSlots[slotIndex];
          rockSlots.splice(slotIndex, 1);
          
          const jitterX = rng.randomRange(-0.3, 0.3);
          const jitterZ = rng.randomRange(-0.3, 0.3);
          
          const scale = rng.randomRange(config.minScale, config.maxScale);
          const rotation = new Vector3(
            rng.randomRange(-0.2, 0.2), // Slight X tilt
            rng.randomRange(0, Math.PI * 2), // Full Y rotation
            rng.randomRange(-0.2, 0.2)  // Slight Z tilt
          );
          
          const worldPos = new Vector3(
            (gridX * definition.size) + slot.x + jitterX,
            0,
            (gridY * definition.size) + slot.z + jitterZ
          );
          
          // Only add colliders for large rocks (scale >= 1.0)
          // Small rocks (scale < 1.0) have NO collision, even if colliderSize is defined
          // rock_3 is always considered large, rock_1/rock_2 are large only if scale >= 1.0
          const isLargeRock = scale >= 1.0 || config.modelId === 'rock_3';
          const rockCollider = isLargeRock && config.colliderSize ? {
            type: 'box' as const,
            size: config.colliderSize.clone().multiplyScalar(scale),
            offset: new Vector3(0, config.colliderSize.y * scale * 0.5, 0),
            isTrigger: false
          } : undefined;
          
          objects.push({
            modelId: config.modelId,
            position: worldPos,
            rotation: rotation,
            scale: scale,
            collider: rockCollider
          });
          
          // Add collider to tile's collider list only if it's a large rock
          if (isLargeRock && config.colliderSize) {
            colliders.push({
              type: 'box',
              size: config.colliderSize.clone().multiplyScalar(scale),
              offset: worldPos.clone().add(new Vector3(0, config.colliderSize.y * scale * 0.5, 0)),
              isTrigger: false
            });
          }
        }
      }
    }
    
    // Place flowers (no colliders)
    if (definition.flowerConfigs) {
      // Use remaining tree slots or add new ones
      const flowerGrid = availableSlots.length > 5 ? availableSlots : 
                        this.generatePlacementGrid(definition.size, 1.5); // Dense placement
      const flowerSlots = [...flowerGrid];
      
      for (const config of definition.flowerConfigs) {
        const count = rng.randomInt(config.minCount, config.maxCount);
        
        for (let i = 0; i < count && flowerSlots.length > 0; i++) {
          const slotIndex = rng.randomInt(0, flowerSlots.length - 1);
          const slot = flowerSlots[slotIndex];
          flowerSlots.splice(slotIndex, 1);
          
          const jitterX = rng.randomRange(-0.2, 0.2);
          const jitterZ = rng.randomRange(-0.2, 0.2);
          
          const scale = rng.randomRange(config.minScale, config.maxScale);
          const rotation = new Vector3(0, rng.randomRange(0, Math.PI * 2), 0);
          
          const worldPos = new Vector3(
            (gridX * definition.size) + slot.x + jitterX,
            0,
            (gridY * definition.size) + slot.z + jitterZ
          );
          
          objects.push({
            modelId: config.modelId,
            position: worldPos,
            rotation: rotation,
            scale: scale
            // No colliders for flowers
          });
        }
      }
    }
    
    // Add tile-level colliders
    if (definition.colliderConfigs) {
      for (const colliderConfig of definition.colliderConfigs) {
        // Convert local tile coordinates to world coordinates
        const worldCollider: ColliderConfig = {
          ...colliderConfig,
          offset: new Vector3(
            (gridX * definition.size) + colliderConfig.offset.x,
            colliderConfig.offset.y,
            (gridY * definition.size) + colliderConfig.offset.z
          )
        };
        colliders.push(worldCollider);
      }
    }
    
    // Calculate world bounds
    const minX = gridX * definition.size;
    const maxX = (gridX + 1) * definition.size;
    const minZ = gridY * definition.size;
    const maxZ = (gridY + 1) * definition.size;
    
    return {
      id: `${definition.id}_${gridX}_${gridY}`,
      position: [gridX, gridY],
      tileId: definition.id,
      seed: tileSeed,
      objects,
      colliders,
      worldBounds: {
        min: new Vector3(minX, -1, minZ),
        max: new Vector3(maxX, 5, maxZ)
      }
    };
  }
  
  /**
   * Generate placement grid for even object distribution
   */
  private static generatePlacementGrid(tileSize: number, spacing: number): GridSlot[] {
    const slots: GridSlot[] = [];
    
    // Start 1 unit from edges to avoid boundary collision
    const start = 1;
    const end = tileSize - 1;
    
    for (let x = start; x < end; x += spacing) {
      for (let z = start; z < end; z += spacing) {
        slots.push({
          x,
          z,
          occupied: false
        });
      }
    }
    
    return slots;
  }
  
  /**
   * Convert TileObjectConfig to PlacedTileObject (adds derived data)
   */
  static finalizeObject(obj: TileObjectConfig): PlacedTileObject {
    return {
      id: `${obj.modelId}_${obj.position.x}_${obj.position.y}_${obj.position.z}`,
      type: this.getObjectType(obj.modelId),
      modelId: obj.modelId,
      position: obj.position,
      rotation: obj.rotation,
      scale: new Vector3(obj.scale, obj.scale, obj.scale),
      collider: obj.collider
    };
  }
  
  /**
   * Determine object type from model ID
   */
  private static getObjectType(modelId: string): 'tree' | 'rock' | 'flower' | 'ground' {
    if (modelId.startsWith('tree')) return 'tree';
    if (modelId.startsWith('rock')) return 'rock';
    if (modelId.includes('flower') || modelId.includes('plant')) return 'flower';
    return 'ground';
  }
}