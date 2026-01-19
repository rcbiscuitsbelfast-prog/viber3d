import { WorldDraft, WorldExportData } from '../../types/editor.types';

/**
 * World Exporter System - Handles saving, loading, and exporting worlds
 * 
 * This system provides functionality to:
 * - Save worlds to local storage
 * - Load worlds from storage
 * - Export worlds as JSON configuration
 * - Delete worlds from storage
 */

export class WorldExporter {
  private static STORAGE_PREFIX = 'world_';
  private static TEMPLATES_KEY = 'world_templates';

  /**
   * Save world draft to local storage
   */
  static saveToLocal(worldDraft: WorldDraft): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${worldDraft.id}`;
      const worldData = {
        ...worldDraft,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(worldData));
      
      // Also update the templates list
      this.updateTemplatesList(worldDraft);
      
      console.log(`[WorldExporter] ✓ World "${worldDraft.name}" saved to local storage`);
    } catch (error) {
      console.error('[WorldExporter] Failed to save world to local storage:', error);
      throw new Error(`Failed to save world: ${error}`);
    }
  }

  /**
   * Load world draft from local storage
   */
  static loadFromLocal(worldId: string): WorldDraft | null {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${worldId}`;
      const worldData = localStorage.getItem(storageKey);
      
      if (!worldData) {
        console.log(`[WorldExporter] No world found with ID: ${worldId}`);
        return null;
      }

      const parsed = JSON.parse(worldData);
      // Convert date strings back to Date objects
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.updatedAt = new Date(parsed.updatedAt);
      
      console.log(`[WorldExporter] ✓ World "${parsed.name}" loaded from local storage`);
      return parsed;
    } catch (error) {
      console.error('[WorldExporter] Failed to load world from local storage:', error);
      return null;
    }
  }

  /**
   * List all saved worlds in local storage
   */
  static listSavedWorlds(): Array<{ id: string; name: string; gridSize: number; savedAt: string }> {
    const worlds: Array<{ id: string; name: string; gridSize: number; savedAt: string }> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const worldId = key.replace(this.STORAGE_PREFIX, '');
          const worldData = localStorage.getItem(key);
          
          if (worldData) {
            const parsed = JSON.parse(worldData);
            worlds.push({
              id: worldId,
              name: parsed.name,
              gridSize: parsed.gridSize,
              savedAt: parsed.savedAt || 'Unknown'
            });
          }
        }
      }
    } catch (error) {
      console.error('[WorldExporter] Failed to list saved worlds:', error);
    }

    return worlds.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  /**
   * Delete world from local storage
   */
  static deleteFromLocal(worldId: string): boolean {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${worldId}`;
      localStorage.removeItem(storageKey);
      
      // Remove from templates list
      this.removeFromTemplatesList(worldId);
      
      console.log(`[WorldExporter] ✓ World "${worldId}" deleted from local storage`);
      return true;
    } catch (error) {
      console.error('[WorldExporter] Failed to delete world from local storage:', error);
      return false;
    }
  }

  /**
   * Export world as JSON configuration
   */
  static exportAsJSON(worldDraft: WorldDraft): WorldExportData {
    return {
      name: worldDraft.name,
      gridSize: worldDraft.gridSize,
      tiles: worldDraft.tiles,
      metadata: {
        exportedAt: new Date(),
        version: '1.0.0',
        tileSize: 10
      }
    };
  }

  /**
   * Download world as JSON file
   */
  static downloadAsJSON(worldDraft: WorldDraft): void {
    try {
      const exportData = this.exportAsJSON(worldDraft);
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `world_${worldDraft.name.replace(/\s+/g, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`[WorldExporter] ✓ JSON export downloaded for "${worldDraft.name}"`);
    } catch (error) {
      console.error('[WorldExporter] JSON export failed:', error);
      throw error;
    }
  }

  /**
   * Import world from JSON file
   */
  static async importFromJSON(file: File): Promise<WorldExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          
          // Validate the imported data
          if (!jsonData.name || !jsonData.gridSize || !jsonData.tiles || !jsonData.metadata) {
            throw new Error('Invalid world format: missing required fields');
          }
          
          // Validate grid dimensions
          if (!Array.isArray(jsonData.tiles) || jsonData.tiles.length !== jsonData.gridSize) {
            throw new Error('Invalid grid dimensions');
          }
          
          // Validate each row has correct size
          for (let i = 0; i < jsonData.tiles.length; i++) {
            if (!Array.isArray(jsonData.tiles[i]) || jsonData.tiles[i].length !== jsonData.gridSize) {
              throw new Error(`Invalid grid dimensions at row ${i}`);
            }
          }
          
          console.log(`[WorldExporter] ✓ World "${jsonData.name}" imported from JSON`);
          resolve(jsonData);
        } catch (error) {
          console.error('[WorldExporter] JSON import failed:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Create a new empty world draft
   */
  static createEmptyWorld(name: string, gridSize: number = 15): WorldDraft {
    if (gridSize <= 0 || gridSize > 50) {
      throw new Error('Grid size must be between 1 and 50');
    }

    const now = new Date();
    return {
      id: this.generateWorldId(),
      name: name.trim() || 'Untitled World',
      gridSize,
      tiles: Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)),
      createdAt: now,
      updatedAt: now,
      metadata: {
        tileSize: 10,
        description: ''
      }
    };
  }

  /**
   * Place a tile at the specified grid position
   */
  static placeTile(worldDraft: WorldDraft, gridX: number, gridY: number, tileId: string | null): WorldDraft {
    if (gridX < 0 || gridX >= worldDraft.gridSize || gridY < 0 || gridY >= worldDraft.gridSize) {
      throw new Error('Grid position out of bounds');
    }

    const updatedWorld = {
      ...worldDraft,
      tiles: worldDraft.tiles.map((row, y) => 
        row.map((tile, x) => 
          x === gridX && y === gridY ? tileId : tile
        )
      ),
      updatedAt: new Date()
    };

    return updatedWorld;
  }

  /**
   * Clear a tile at the specified grid position
   */
  static clearTile(worldDraft: WorldDraft, gridX: number, gridY: number): WorldDraft {
    return this.placeTile(worldDraft, gridX, gridY, null);
  }

  /**
   * Get tile at specified grid position
   */
  static getTileAt(worldDraft: WorldDraft, gridX: number, gridY: number): string | null {
    if (gridX < 0 || gridX >= worldDraft.gridSize || gridY < 0 || gridY >= worldDraft.gridSize) {
      return null;
    }
    return worldDraft.tiles[gridY][gridX];
  }

  /**
   * Count placed tiles in world
   */
  static countPlacedTiles(worldDraft: WorldDraft): number {
    let count = 0;
    for (let y = 0; y < worldDraft.gridSize; y++) {
      for (let x = 0; x < worldDraft.gridSize; x++) {
        if (worldDraft.tiles[y][x] !== null) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Get world statistics
   */
  static getWorldStats(worldDraft: WorldDraft): {
    totalTiles: number;
    placedTiles: number;
    emptyTiles: number;
    fillPercentage: number;
  } {
    const totalTiles = worldDraft.gridSize * worldDraft.gridSize;
    const placedTiles = this.countPlacedTiles(worldDraft);
    const emptyTiles = totalTiles - placedTiles;
    const fillPercentage = (placedTiles / totalTiles) * 100;

    return {
      totalTiles,
      placedTiles,
      emptyTiles,
      fillPercentage: Math.round(fillPercentage * 100) / 100
    };
  }

  /**
   * Duplicate a world
   */
  static duplicateWorld(worldDraft: WorldDraft, newName: string): WorldDraft {
    const now = new Date();
    return {
      ...worldDraft,
      id: this.generateWorldId(),
      name: newName,
      createdAt: now,
      updatedAt: now,
      tiles: worldDraft.tiles.map(row => [...row]) // Deep copy of the grid
    };
  }

  /**
   * Private methods
   */

  private static updateTemplatesList(worldDraft: WorldDraft): void {
    try {
      const templates = this.getTemplatesList();
      const existingIndex = templates.findIndex(t => t.id === worldDraft.id);
      
      const template = {
        id: worldDraft.id,
        name: worldDraft.name,
        gridSize: worldDraft.gridSize,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        templates[existingIndex] = template;
      } else {
        templates.push(template);
      }

      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('[WorldExporter] Failed to update templates list:', error);
    }
  }

  private static removeFromTemplatesList(worldId: string): void {
    try {
      const templates = this.getTemplatesList();
      const filtered = templates.filter(t => t.id !== worldId);
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[WorldExporter] Failed to remove from templates list:', error);
    }
  }

  private static getTemplatesList(): Array<{ id: string; name: string; gridSize: number; updatedAt: string }> {
    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[WorldExporter] Failed to get templates list:', error);
      return [];
    }
  }

  /**
   * Generate unique world ID
   */
  static generateWorldId(): string {
    return `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate world draft
   */
  static validateWorldDraft(worldDraft: WorldDraft): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!worldDraft.name || worldDraft.name.trim() === '') {
      errors.push('World name is required');
    }
    
    if (worldDraft.gridSize <= 0 || worldDraft.gridSize > 50) {
      errors.push('Grid size must be between 1 and 50');
    }
    
    // Validate grid dimensions
    if (!Array.isArray(worldDraft.tiles) || worldDraft.tiles.length !== worldDraft.gridSize) {
      errors.push('Tiles array must match grid size');
    }
    
    // Validate each row
    for (let i = 0; i < worldDraft.tiles.length; i++) {
      if (!Array.isArray(worldDraft.tiles[i]) || worldDraft.tiles[i].length !== worldDraft.gridSize) {
        errors.push(`Tiles row ${i} must have ${worldDraft.gridSize} columns`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}