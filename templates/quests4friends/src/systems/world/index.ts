/**
 * Tile System Exports
 * Centralized exports for all tile-based world systems
 */

// Type definitions
export * from '../../types/tile.types';

// Core systems
export { TileRegistry } from './TileRegistry';
export { TileGenerator } from './TileGenerator';
export { TileLoader } from './TileLoader';
export { WorldComposer } from './WorldComposer';
export { TileCollisionManager } from './TileCollisionManager';

// React components
export { TiledWorldRenderer } from '../../components/game/TiledWorldRenderer';

// Utilities
export { SeededRandom } from '../../utils/SeededRandom';

// Main setup function for convenience
export function setupTileSystem() {
  // Initialize all tile systems in correct order
  const { TileRegistry } = require('./TileRegistry');
  const { TileLoader } = require('./TileLoader');
  
  TileRegistry.initialize();
  TileLoader.initialize();
  
  console.log('[Tile System] All systems initialized');
}