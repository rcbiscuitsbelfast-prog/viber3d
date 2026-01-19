import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { TileRegistry } from '../systems/world/TileRegistry';
import { TileGenerator } from '../systems/world/TileGenerator';
import { TileLoader } from '../systems/world/TileLoader';
import { useTheme } from '../contexts/ThemeContext';
import { ScrollToTop } from '../components/ScrollToTop';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TileInstance } from '../types/tile.types';

// Grid dimensions: 100 units wide x 100 units tall
// Tile size: 10x10 units
// Grid layout: 10 tiles wide x 10 tiles tall
const GRID_WIDTH = 10; // tiles wide
const GRID_HEIGHT = 10; // tiles tall
const TILE_SIZE = 10;

interface PlacedTile {
  x: number;
  y: number;
  tileId: string;
  rotation: number;
}

// ==================== Tile Object Renderer ====================
function TileObjectRenderer({ object, worldOffset }: { object: any; worldOffset: [number, number] }) {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    let modelPath = TileRegistry.getModelPath(object.modelId);
    
    // Fix asset paths - use correct base path
    if (!modelPath.includes('/Assets/')) {
      // Try KayKit Forest Nature Pack path
      const basePath = '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf';
      if (object.modelId.startsWith('tree_')) {
        const variant = object.modelId.replace('tree_', '');
        const treeNames: Record<string, string> = {
          '1': 'Tree_1_A_Color1',
          '2': 'Tree_2_A_Color1',
          '3': 'Tree_3_A_Color1',
          '4': 'Tree_4_A_Color1',
          'bare_1': 'Tree_Bare_1_A_Color1',
          'bare_2': 'Tree_Bare_2_A_Color1'
        };
        const name = treeNames[variant] || 'Tree_1_A_Color1';
        modelPath = `${basePath}/${name}.gltf`;
      } else if (object.modelId.startsWith('rock_')) {
        const variant = object.modelId.replace('rock_', '');
        const name = `Rock_${variant}_A_Color1`;
        modelPath = `${basePath}/${name}.gltf`;
      }
    }
    
    loader.load(
      modelPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(object.scale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setModel(cloned);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load ${object.modelId} from ${modelPath}:`, error);
      }
    );
  }, [object.modelId, object.scale]);

  if (!model) return null;

  const worldX = object.position.x + (worldOffset[0] * TILE_SIZE);
  const worldZ = object.position.z + (worldOffset[1] * TILE_SIZE);

  return (
    <group 
      ref={groupRef}
      position={[worldX, object.position.y, worldZ]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
    >
      <primitive object={model} />
    </group>
  );
}

// ==================== Placed Tile Renderer ====================
function PlacedTileRenderer({ tile, gridX, gridY }: { tile: PlacedTile; gridX: number; gridY: number }) {
  const [tileInstance, setTileInstance] = useState<TileInstance | null>(null);
  const [loadedObjects, setLoadedObjects] = useState<any[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loadTile = async () => {
      try {
        // Check if it's a custom tile
        if (tile.tileId.startsWith('custom_')) {
          const customTilesJson = localStorage.getItem('custom-tiles');
          const customTiles: any[] = customTilesJson ? JSON.parse(customTilesJson) : [];
          const customTile = customTiles.find(t => (t.id || `custom_${t.name.replace(/\s+/g, '_').toLowerCase()}`) === tile.tileId);
          
          if (customTile && customTile.gltfData) {
            // Load custom tile from GLTF data
            try {
              const loader = new GLTFLoader();
              const gltfData = typeof customTile.gltfData === 'string' ? JSON.parse(customTile.gltfData) : customTile.gltfData;
              
              // Parse GLTF and create a group
              // For now, create a simple group - full GLTF parsing needs more work
              const group = new THREE.Group();
              
              // Create ground plane based on ground type
              const groundGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
              const groundMaterial = new THREE.MeshStandardMaterial({
                color: customTile.groundType === 'water' ? '#1e90ff' : '#3d6b2d',
                transparent: customTile.groundType === 'water',
                opacity: customTile.groundType === 'water' ? 0.8 : 1,
              });
              const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
              groundMesh.rotation.x = -Math.PI / 2;
              groundMesh.receiveShadow = true;
              group.add(groundMesh);
              
              setLoadedObjects([group]);
              // Create a minimal tile instance for custom tiles
              setTileInstance({ objects: [], colliders: [] } as TileInstance);
              return;
            } catch (e) {
              console.error('Failed to load custom tile GLTF:', e);
              return;
            }
          }
        }
        
        const definition = TileRegistry.getTileDefinition(tile.tileId);
        if (!definition) return;

        // Generate tile instance
        const instance = TileGenerator.generateTile(definition, gridX, gridY, 1337);
        setTileInstance(instance);

        // Load tile content
        TileLoader.initialize();
        const tileContent = await TileLoader.loadTile(tile.tileId, instance.objects.map(obj => ({
          id: `${gridX}-${gridY}-${obj.modelId}`,
          type: obj.modelId.startsWith('tree_') ? 'tree' : obj.modelId.startsWith('rock_') ? 'rock' : 'flower',
          modelId: obj.modelId,
          position: obj.position,
          rotation: obj.rotation,
          scale: new THREE.Vector3(obj.scale, obj.scale, obj.scale),
          collider: obj.collider
        })));

        setLoadedObjects(tileContent.objects.filter(o => o.isLoaded && o.mesh).map(o => o.mesh));
      } catch (error) {
        console.error('Failed to load placed tile:', error);
      }
    };

    loadTile();
  }, [tile.tileId, gridX, gridY]);

  // Calculate world position
  const worldX = (gridX * TILE_SIZE) - (GRID_WIDTH * TILE_SIZE) / 2 + TILE_SIZE / 2;
  const worldZ = (gridY * TILE_SIZE) - (GRID_HEIGHT * TILE_SIZE) / 2 + TILE_SIZE / 2;

  if (!tileInstance) {
    // Show ground plane while loading
    const definition = TileRegistry.getTileDefinition(tile.tileId);
    if (!definition) return null;
    
    const groundColor = definition.baseTexture === 'grass' ? '#4a5d3a' : 
                       definition.baseTexture === 'water' ? '#1e90ff' :
                       definition.baseTexture === 'rock' ? '#666666' : '#8b7355';

    return (
      <group position={[worldX, 0, worldZ]} rotation={[0, tile.rotation, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
          <meshStandardMaterial color={groundColor} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  const definition = TileRegistry.getTileDefinition(tile.tileId);
  if (!definition) return null;

  const groundColor = definition.baseTexture === 'grass' ? '#4a5d3a' : 
                     definition.baseTexture === 'water' ? '#1e90ff' :
                     definition.baseTexture === 'rock' ? '#666666' : '#8b7355';

  return (
    <group ref={groupRef} position={[worldX, 0, worldZ]} rotation={[0, tile.rotation, 0]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial color={groundColor} roughness={0.8} />
      </mesh>

      {/* Render tile objects */}
      {tileInstance.objects.map((obj, idx) => (
        <TileObjectRenderer 
          key={`${gridX}-${gridY}-${idx}`} 
          object={obj} 
          worldOffset={[gridX, gridY]}
        />
      ))}

      {/* Render loaded meshes */}
      {loadedObjects.map((mesh, idx) => {
        if (!mesh) return null;
        const obj = tileInstance.objects[idx];
        if (!obj) return null;
        
        return (
          <group key={`mesh-${idx}`}>
            <primitive object={mesh.clone()} />
          </group>
        );
      })}
    </group>
  );
}

// ==================== Grid Cell Component ====================
function GridCell({ 
  gridX, 
  gridY, 
  isPlaced, 
  onClick, 
  onRightClick,
  theme 
}: { 
  gridX: number; 
  gridY: number; 
  isPlaced: boolean;
  onClick: () => void;
  onRightClick: () => void;
  theme: 'light' | 'dark';
}) {
  const worldX = (gridX * TILE_SIZE) - (GRID_WIDTH * TILE_SIZE) / 2 + TILE_SIZE / 2;
  const worldZ = (gridY * TILE_SIZE) - (GRID_HEIGHT * TILE_SIZE) / 2 + TILE_SIZE / 2;
  
  const color = isPlaced 
    ? (theme === 'dark' ? '#22c55e' : '#10b981')
    : (theme === 'dark' ? '#374151' : '#e5e7eb');

  return (
    <mesh
      position={[worldX, 0.01, worldZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        onRightClick();
      }}
    >
      <planeGeometry args={[TILE_SIZE - 0.1, TILE_SIZE - 0.1]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={isPlaced ? 0.4 : 0.15}
        emissive={color}
        emissiveIntensity={isPlaced ? 0.3 : 0.1}
      />
    </mesh>
  );
}

// ==================== World Scene Component ====================
function WorldScene({ 
  placedTiles, 
  selectedTileId, 
  previewRotation,
  onTileClick,
  onTileRightClick,
  theme 
}: {
  placedTiles: Map<string, PlacedTile>;
  selectedTileId: string | null;
  previewRotation: number;
  onTileClick: (gridX: number, gridY: number) => void;
  onTileRightClick: (gridX: number, gridY: number) => void;
  theme: 'light' | 'dark';
}) {
  const { camera } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Set up isometric camera - adjusted for 10x10 grid (100x100 units)
  React.useEffect(() => {
    const angle = Math.PI * 0.25;
    const height = 80; // Lower height for smaller world
    const horizontalDistance = 100; // Closer for 10x10 grid

    camera.position.set(
      horizontalDistance * Math.sin(angle),
      height,
      horizontalDistance * Math.cos(angle)
    );
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const handleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
    const canvas = event.target as HTMLCanvasElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(gridPlane, intersection);

    const gridX = Math.floor((intersection.x + (GRID_WIDTH * TILE_SIZE) / 2) / TILE_SIZE);
    const gridY = Math.floor((intersection.z + (GRID_HEIGHT * TILE_SIZE) / 2) / TILE_SIZE);

    if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
      if (event.button === 2) {
        onTileRightClick(gridX, gridY);
      } else {
        onTileClick(gridX, gridY);
      }
    }
  }, [camera, onTileClick, onTileRightClick]);

  React.useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      canvas.removeEventListener('mousedown', handleClick);
    };
  }, [handleClick]);

  const gridColor = theme === 'dark' ? '#4a5568' : '#9ca3af';
  const sectionColor = theme === 'dark' ? '#1f2937' : '#6b7280';

  return (
    <>
      {/* Grid Helper - More visible */}
      <Grid
        args={[GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE]}
        cellSize={TILE_SIZE}
        cellColor={gridColor}
        sectionSize={TILE_SIZE * 5}
        sectionColor={sectionColor}
        fadeDistance={100}
        infiniteGrid={false}
      />

      {/* Grid Cells - Only show visible ones for performance */}
      {Array.from(placedTiles.keys()).map(key => {
        const [gridX, gridY] = key.split(',').map(Number);
        return (
          <GridCell
            key={key}
            gridX={gridX}
            gridY={gridY}
            isPlaced={true}
            onClick={() => onTileClick(gridX, gridY)}
            onRightClick={() => onTileRightClick(gridX, gridY)}
            theme={theme}
          />
        );
      })}

      {/* Placed Tiles */}
      {Array.from(placedTiles.entries()).map(([key, tile]) => {
        const [gridX, gridY] = key.split(',').map(Number);
        return (
          <PlacedTileRenderer
            key={key}
            tile={tile}
            gridX={gridX}
            gridY={gridY}
          />
        );
      })}
    </>
  );
}

// ==================== Tile Preview Component ====================
function TilePreview({ tileId, rotation }: { tileId: string | null; rotation: number }) {
  const [tileScene, setTileScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    if (!tileId) {
      setTileScene(null);
      return;
    }

    const loadTilePreview = async () => {
      try {
        const definition = TileRegistry.getTileDefinition(tileId);
        if (!definition) return;

        const tileInstance = TileGenerator.generateTile(definition, 0, 0, 1337);
        const tileGroup = new THREE.Group();
        
        // Add ground plane
        const groundGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        const groundColor = definition.baseTexture === 'grass' ? '#4a5d3a' : 
                           definition.baseTexture === 'water' ? '#1e90ff' :
                           definition.baseTexture === 'rock' ? '#666666' : '#8b7355';
        const groundMaterial = new THREE.MeshStandardMaterial({
          color: groundColor,
          roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        tileGroup.add(ground);

        // Load and add a few sample objects for preview
        const loader = new GLTFLoader();
        for (const obj of tileInstance.objects.slice(0, 3)) {
          try {
            const modelPath = TileRegistry.getModelPath(obj.modelId);
            const gltf = await new Promise<THREE.Group>((resolve, reject) => {
              loader.load(modelPath, (gltf) => resolve(gltf.scene), undefined, reject);
            });
            const cloned = gltf.clone();
            cloned.scale.setScalar(obj.scale);
            cloned.position.copy(obj.position);
            cloned.rotation.copy(obj.rotation);
            tileGroup.add(cloned);
          } catch (e) {
            // Skip failed models
          }
        }

        setTileScene(tileGroup);
      } catch (error) {
        console.error('Failed to load tile preview:', error);
      }
    };

    loadTilePreview();
  }, [tileId]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  if (!tileScene || !tileId) return null;

  return (
    <group ref={groupRef} position={[0, 0.01, 0]}>
      <primitive object={tileScene.clone()} />
    </group>
  );
}

// ==================== Main Component ====================
export function WorldCanvasBuilderPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [placedTiles, setPlacedTiles] = useState<Map<string, PlacedTile>>(new Map());
  const [previewRotation, setPreviewRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize tile registry FIRST before anything else
  const [tilesInitialized, setTilesInitialized] = useState(false);

  React.useEffect(() => {
    // Initialize registry synchronously before getting definitions
    TileRegistry.initialize();
    TileLoader.initialize();
    const tiles = TileRegistry.getAllDefinitions();
    console.log('[WorldCanvasBuilder] Initialized, found', tiles.length, 'tiles:', tiles.map(t => t.id));
    setTilesInitialized(true);
  }, []);

  // Load world from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('saved-world-grid');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.placedTiles) {
          const tiles = new Map<string, PlacedTile>();
          data.placedTiles.forEach((t: any) => {
            tiles.set(t.key, { x: t.x, y: t.y, tileId: t.tileId, rotation: t.rotation || 0 });
          });
          setPlacedTiles(tiles);
        }
      } catch (e) {
        console.error('Failed to load saved world:', e);
      }
    }
  }, []);

  // Get available tiles - including custom tiles from localStorage
  const availableTiles = useMemo(() => {
    if (!tilesInitialized) return [];
    const registryTiles = TileRegistry.getAllDefinitions();
    
    // Load custom tiles from localStorage
    const customTilesJson = localStorage.getItem('custom-tiles');
    const customTiles: any[] = customTilesJson ? JSON.parse(customTilesJson) : [];
    
    // Convert custom tiles to TileDefinition format (with custom flag)
    const customTileDefinitions = customTiles.map(tile => ({
      id: tile.id || `custom_${tile.name.replace(/\s+/g, '_').toLowerCase()}`,
      displayName: `[Custom] ${tile.name}`,
      description: `Custom tile (${tile.groundType || 'grass'})`,
      size: 10,
      baseTexture: tile.groundType || 'grass',
      isCustom: true,
      customData: tile,
    } as any));
    
    const allTiles = [...registryTiles, ...customTileDefinitions];
    console.log('[WorldCanvasBuilder] Available tiles:', allTiles.length, 'Registry:', registryTiles.length, 'Custom:', customTileDefinitions.length);
    return allTiles;
  }, [tilesInitialized]);

  const getTileKey = (x: number, y: number) => `${x},${y}`;

  const handleTileClick = useCallback((gridX: number, gridY: number) => {
    if (!selectedTileId) return;

    const key = getTileKey(gridX, gridY);
    setPlacedTiles(prev => {
      const newMap = new Map(prev);
      newMap.set(key, { 
        x: gridX, 
        y: gridY, 
        tileId: selectedTileId,
        rotation: previewRotation 
      });
      
      // Save to localStorage
      const toSave = Array.from(newMap.entries()).map(([k, t]) => ({ key: k, ...t }));
      localStorage.setItem('saved-world-grid', JSON.stringify({ placedTiles: toSave }));
      
      return newMap;
    });
  }, [selectedTileId, previewRotation]);

  const handleTileRightClick = useCallback((gridX: number, gridY: number) => {
    const key = getTileKey(gridX, gridY);
    setPlacedTiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      
      // Save to localStorage
      const toSave = Array.from(newMap.entries()).map(([k, t]) => ({ key: k, ...t }));
      localStorage.setItem('saved-world-grid', JSON.stringify({ placedTiles: toSave }));
      
      return newMap;
    });
  }, []);

  const rotatePreview = useCallback(() => {
    setPreviewRotation(prev => (prev + Math.PI / 2) % (Math.PI * 2));
  }, []);

  const handleSave = useCallback(() => {
    const grid: (string | null)[][] = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
    placedTiles.forEach(tile => {
      if (tile.y >= 0 && tile.y < GRID_HEIGHT && tile.x >= 0 && tile.x < GRID_WIDTH) {
        grid[tile.y][tile.x] = tile.tileId;
      }
    });

    const data = JSON.stringify({
      grid: grid.map(row => row.map(cell => cell || 'clearing')),
      placedTiles: Array.from(placedTiles.entries()).map(([key, tile]) => ({
        key,
        ...tile
      }))
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'world-grid.json';
    a.click();
    URL.revokeObjectURL(url);
    
    // Also save to localStorage
    localStorage.setItem('saved-world-grid', data);
  }, [placedTiles]);

  const handleLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.placedTiles) {
          const tiles = new Map<string, PlacedTile>();
          data.placedTiles.forEach((t: any) => {
            tiles.set(t.key, { x: t.x, y: t.y, tileId: t.tileId, rotation: t.rotation || 0 });
          });
          setPlacedTiles(tiles);
          localStorage.setItem('saved-world-grid', JSON.stringify(data));
        }
      } catch (err) {
        alert('Failed to load world file');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear all tiles?')) {
      setPlacedTiles(new Map());
      localStorage.removeItem('saved-world-grid');
    }
  }, []);

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40 shadow-md`}>
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">World Canvas Builder</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleLoad}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors`}
            >
              Load World
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors`}
            >
              Save Grid
            </button>
            <button
              onClick={handleClear}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg transition-colors`}
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className={`${cardBg} ${borderColor} border rounded-lg p-4 lg:w-80 h-fit lg:sticky lg:top-20`}>
          <h2 className="text-xl font-bold mb-4">Tile Palette</h2>
          <p className="text-sm mb-4 opacity-70">
            Click a tile to select, then click on the 3D grid to place it. Right-click to remove.
          </p>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-4">
            {!tilesInitialized ? (
              <div className="text-sm opacity-70 text-center py-4">Loading tiles...</div>
            ) : availableTiles.length === 0 ? (
              <div className="text-sm opacity-70 text-center py-4">No tiles available. Check console for errors.</div>
            ) : (
              availableTiles.map(tile => (
                <button
                  key={tile.id}
                  onClick={() => setSelectedTileId(tile.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedTileId === tile.id
                      ? theme === 'dark'
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-blue-500 bg-blue-100'
                      : `${borderColor} hover:border-blue-400`
                  }`}
                >
                  <div className="font-semibold">{tile.displayName}</div>
                  <div className="text-xs opacity-70 mt-1">{tile.description}</div>
                </button>
              ))
            )}
          </div>

          {selectedTileId && (
            <div className={`${cardBg} ${borderColor} border rounded-lg p-4 mt-4`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-sm font-semibold">Preview</div>
                  <div className="text-xs opacity-70">
                    {availableTiles.find(t => t.id === selectedTileId)?.displayName}
                  </div>
                </div>
                <button
                  onClick={rotatePreview}
                  className={`px-3 py-1 text-xs ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded transition-colors`}
                >
                  ↻ Rotate
                </button>
              </div>
              <div style={{ height: '200px', background: theme === 'dark' ? '#1f2937' : '#f3f4f6', borderRadius: '8px' }}>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[10, 10, 5]} intensity={0.8} />
                  <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
                  <TilePreview tileId={selectedTileId} rotation={previewRotation} />
                  <OrbitControls makeDefault minDistance={5} maxDistance={20} enablePan={false} />
                </Canvas>
              </div>
              <div className="text-xs mt-2 opacity-70">
                Rotation: {Math.round(previewRotation * 180 / Math.PI)}°
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1">
          <div className={`${cardBg} ${borderColor} border rounded-lg p-4`}>
            <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold">Isometric World View (10x10)</h2>
                <p className="text-sm opacity-70">
                  {GRID_WIDTH} x {GRID_HEIGHT} tiles ({GRID_WIDTH * TILE_SIZE} x {GRID_HEIGHT * TILE_SIZE} units)
                </p>
              </div>
              <div className="text-sm opacity-70">
                Placed: {placedTiles.size} / {GRID_WIDTH * GRID_HEIGHT}
              </div>
            </div>

            <div style={{ height: '70vh', background: theme === 'dark' ? '#111827' : '#f9fafb', borderRadius: '8px' }}>
              <Canvas shadows camera={{ position: [100, 80, 100], fov: 50 }}>
                <PerspectiveCamera makeDefault position={[100, 80, 100]} fov={50} />
                
                <ambientLight intensity={0.5} />
                <directionalLight 
                  position={[50, 100, 50]} 
                  intensity={0.8} 
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />

                <WorldScene
                  placedTiles={placedTiles}
                  selectedTileId={selectedTileId}
                  previewRotation={previewRotation}
                  onTileClick={handleTileClick}
                  onTileRightClick={handleTileRightClick}
                  theme={theme}
                />

                <OrbitControls
                  makeDefault
                  minDistance={50}
                  maxDistance={500}
                  maxPolarAngle={Math.PI / 2.1}
                />
              </Canvas>
            </div>
          </div>
        </main>
      </div>

      <ScrollToTop />
    </div>
  );
}
