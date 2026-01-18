import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Group } from 'three';
import { WorldComposer } from '../../systems/world/WorldComposer';
import { TileRegistry } from '../../systems/world/TileRegistry';
import { TileLoader } from '../../systems/world/TileLoader';
import { TileCollisionManager } from '../../systems/world/TileCollisionManager';
import { WorldGrid } from '../../types/tile.types';

export interface TiledWorldRendererProps {
  worldGrid: string[][]; // 2D array of tile IDs
  worldSeed?: number;
  playerPosition?: [number, number, number];
  enableStreaming?: boolean;
  loadRadius?: number;
  debug?: boolean;
}

/**
 * TiledWorldRenderer - React/Three.js component for rendering tiled worlds
 * Handles initialization, streaming, and rendering of tile-based world
 */
export function TiledWorldRenderer({
  worldGrid,
  worldSeed = 1337,
  playerPosition = [0, 0, 0],
  enableStreaming = true,
  loadRadius = 2,
  debug = false
}: TiledWorldRendererProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const worldComposerRef = useRef<WorldComposer | null>(null);
  const collisionManagerRef = useRef<TileCollisionManager | null>(null);
  const tileGroupRef = useRef<Group>(null);
  const lastPlayerTileRef = useRef<[number, number]>([0, 0]);

  // Initialize world systems
  useEffect(() => {
    const initializeWorld = async () => {
      try {
        console.log('[TiledWorldRenderer] Initializing world systems...');
        
        // Initialize tile systems in order
        TileRegistry.initialize();
        TileLoader.initialize();
        
        // Create world composer
        const worldComposer = new WorldComposer(worldSeed);
        worldComposer.setStreamingEnabled(enableStreaming);
        if (loadRadius) {
          // Note: Load radius is handled by WorldComposer constructor parameter
        }
        
        // Load world grid
        await worldComposer.loadWorldGrid(worldGrid);
        
        // Initialize collision manager
        const collisionManager = new TileCollisionManager(debug);
        
        // Store refs
        worldComposerRef.current = worldComposer;
        collisionManagerRef.current = collisionManager;
        
        // Load initial tiles around origin (0, 0)
        await worldComposer.updatePlayerPosition(playerPosition[0], playerPosition[2]);
        
        // Update collision manager with initial colliders
        const activeColliders = worldComposer.getActiveColliders();
        collisionManager.updateActiveColliders(activeColliders);
        
        console.log('[TiledWorldRenderer] World systems initialized successfully');
        setIsInitialized(true);
        
      } catch (err) {
        console.error('[TiledWorldRenderer] Failed to initialize world:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    initializeWorld();
    
    // Cleanup on unmount
    return () => {
      console.log('[TiledWorldRenderer] Cleaning up world systems...');
      worldComposerRef.current?.dispose();
      collisionManagerRef.current = null;
    };
  }, [worldGrid, worldSeed, enableStreaming, loadRadius, debug]);

  // Update collision manger and stream tiles based on player position
  useEffect(() => {
    const updateWorld = async () => {
      const worldComposer = worldComposerRef.current;
      const collisionManager = collisionManagerRef.current;
      
      if (!worldComposer || !isInitialized) return;
      
      const [x, y, z] = playerPosition;
      const gridX = Math.floor(x / 10); // Assuming 10x10 tiles
      const gridY = Math.floor(z / 10);
      
      // Check if player moved to a different tile
      const [lastX, lastY] = lastPlayerTileRef.current;
      if (gridX !== lastX || gridY !== lastY || !enableStreaming) {
        lastPlayerTileRef.current = [gridX, gridY];
        
        // Stream tiles
        await worldComposer.updatePlayerPosition(x, z);
        
        // Update collision manager
        const activeColliders = worldComposer.getActiveColliders();
        collisionManager?.updateActiveColliders(activeColliders);
        
        if (debug) {
          console.log(`[TiledWorldRenderer] Updated at tile [${gridX}, ${gridY}], colliders: ${activeColliders.length}`);
        }
      }
    };
    
    updateWorld();
  }, [playerPosition, isInitialized, enableStreaming, debug]);

  // Update Three.js scene every frame
  useFrame(() => {
    if (!isInitialized || !worldComposerRef.current || !tileGroupRef.current) return;
    
    // Update tile groups in the scene
    const worldComposer = worldComposerRef.current;
    const tileGroups = worldComposer.getTileGroups();
    
    // Synchronize tile groups with scene
    const sceneGroup = tileGroupRef.current;
    
    // Remove groups that are no longer active
    for (let i = sceneGroup.children.length - 1; i >= 0; i--) {
      const child = sceneGroup.children[i];
      const isActive = tileGroups.some(group => group.name === child.name);
      
      if (!isActive && child.name.startsWith('tile_')) {
        sceneGroup.remove(child);
        if (debug) {
          console.log(`[TiledWorldRenderer] Removed tile: ${child.name}`);
        }
      }
    }
    
    // Add new active groups
    for (const group of tileGroups) {
      const existing = sceneGroup.getObjectByName(group.name);
      if (!existing) {
        sceneGroup.add(group.clone());
        if (debug) {
          console.log(`[TiledWorldRenderer] Added tile: ${group.name}`);
        }
      }
    }
  });

  if (error) {
    return (
      <group>
        {/* Error indicator - red plane */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <planeGeometry args={[9, 9]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }

  if (!isInitialized) {
    return (
      <group>
        {/* Loading indicator - animated ring */}
        <mesh position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[4, 5, 32]} />
          <meshStandardMaterial color="yellow" wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={tileGroupRef} name="tiled-world">
      {/* Debug helpers */}
      {debug && (
        <group name="debug-helpers">
          {/* Grid boundaries */}
          <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial 
              color="green" 
              transparent 
              opacity={0.1} 
              wireframe 
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Hook to get collision manager for player movement
export function useTileCollisionManager() {
  const collisionManager = useRef<TileCollisionManager | null>(null);
  
  useEffect(() => {
    // Create a global collision manager instance
    collisionManager.current = new TileCollisionManager(false);
    
    return () => {
      collisionManager.current = null;
    };
  }, []);
  
  return collisionManager.current;
}