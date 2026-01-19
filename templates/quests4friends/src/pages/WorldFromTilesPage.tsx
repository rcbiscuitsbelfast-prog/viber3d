import { useEffect, useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type WorldCell = {
  tileId: string | null;
  rotation: 0 | 1 | 2 | 3; // 0, 90, 180, 270 degrees
};

type SavedTileMeta = {
  name: string;
  key: string;
};

const INITIAL_GRID_WIDTH = 3;  // Start with 3 x 5 grid
const INITIAL_GRID_HEIGHT = 5;

const BLANK_TILE_ID = '__blank_grass__';

function buildInitialGrid(width: number, height: number): WorldCell[][] {
  // Initialize all cells with blank grass tiles
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ tileId: BLANK_TILE_ID, rotation: 0 }))
  );
}

// ==================== Asset Rendering Components ====================

function PlacedAsset({ assetType, position, rotation = 0, scale = 1.0, variant }: { 
  assetType: string; 
  position: [number, number, number]; 
  rotation?: number; 
  scale?: number;
  variant?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [assetScene, setAssetScene] = useState<THREE.Group | null>(null);

  const treeVariants = [
    'Tree_1_A_Color1', 'Tree_1_B_Color1', 'Tree_1_C_Color1',
    'Tree_2_A_Color1', 'Tree_2_B_Color1', 'Tree_2_C_Color1', 'Tree_2_D_Color1', 'Tree_2_E_Color1',
    'Tree_3_A_Color1', 'Tree_3_B_Color1', 'Tree_3_C_Color1',
    'Tree_4_A_Color1', 'Tree_4_B_Color1', 'Tree_4_C_Color1',
    'Tree_Bare_1_A_Color1', 'Tree_Bare_1_B_Color1', 'Tree_Bare_1_C_Color1',
    'Tree_Bare_2_A_Color1', 'Tree_Bare_2_B_Color1', 'Tree_Bare_2_C_Color1',
  ];

  const rockVariants = [
    'Rock_1_A_Color1', 'Rock_1_B_Color1', 'Rock_1_C_Color1', 'Rock_1_D_Color1', 'Rock_1_E_Color1',
    'Rock_1_F_Color1', 'Rock_1_G_Color1', 'Rock_1_H_Color1', 'Rock_1_I_Color1', 'Rock_1_J_Color1',
    'Rock_1_K_Color1', 'Rock_1_L_Color1', 'Rock_1_M_Color1', 'Rock_1_N_Color1', 'Rock_1_O_Color1',
    'Rock_1_P_Color1', 'Rock_1_Q_Color1',
    'Rock_2_A_Color1', 'Rock_2_B_Color1', 'Rock_2_C_Color1', 'Rock_2_D_Color1', 'Rock_2_E_Color1',
    'Rock_2_F_Color1', 'Rock_2_G_Color1', 'Rock_2_H_Color1',
    'Rock_3_A_Color1', 'Rock_3_B_Color1', 'Rock_3_C_Color1', 'Rock_3_D_Color1', 'Rock_3_E_Color1',
    'Rock_3_F_Color1', 'Rock_3_G_Color1', 'Rock_3_H_Color1', 'Rock_3_I_Color1', 'Rock_3_J_Color1',
    'Rock_3_K_Color1', 'Rock_3_L_Color1', 'Rock_3_M_Color1', 'Rock_3_N_Color1', 'Rock_3_O_Color1',
    'Rock_3_P_Color1', 'Rock_3_Q_Color1', 'Rock_3_R_Color1',
  ];

  const variantName = useMemo(() => {
    if (variant) return variant;
    if (assetType === 'tree') {
      return treeVariants[Math.floor(Math.random() * treeVariants.length)];
    } else if (assetType === 'rock') {
      return rockVariants[Math.floor(Math.random() * rockVariants.length)];
    }
    return null;
  }, [assetType, variant]);

  useEffect(() => {
    if (!variantName) return;

    const loader = new GLTFLoader();
    const assetPath = `/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/${variantName}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(scale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setAssetScene(cloned);
      },
      undefined,
      (error) => console.warn(`[PlacedAsset] Failed to load ${variantName}:`, error)
    );
  }, [variantName, scale]);

  if (!assetScene) {
    const placeholderColor = assetType === 'tree' ? '#2d5016' : '#666666';
    return (
      <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
        <mesh>
          <boxGeometry args={[1, assetType === 'rock' ? 0.5 : 2, 1]} />
          <meshStandardMaterial color={placeholderColor} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={assetScene} />
    </group>
  );
}

function GrassPatch({ position, rotation, type, scale = 1.0 }: { 
  position: [number, number, number]; 
  rotation: number; 
  type: string; 
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [grassScene, setGrassScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${type}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(scale ?? 1.5);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });
        setGrassScene(cloned);
      },
      undefined,
      (error) => console.error(`[GrassPatch] Failed to load: ${type}`, error)
    );
  }, [type, scale]);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {grassScene ? (
        <primitive object={grassScene} />
      ) : (
        <mesh>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#3d6b2d" />
        </mesh>
      )}
    </group>
  );
}

function SmallRock({ position, rotation, variant, scale = 1.0 }: { 
  position: [number, number, number]; 
  rotation: number; 
  variant: string; 
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [rockScene, setRockScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${variant}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(scale || 1.2);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });
        setRockScene(cloned);
      },
      undefined,
      (error) => console.error(`[SmallRock] Failed to load: ${variant}`, error)
    );
  }, [variant, scale]);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {rockScene ? (
        <primitive object={rockScene} />
      ) : (
        <mesh>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      )}
    </group>
  );
}

function Flower({ position, rotation, type, scale = 1.0 }: { 
  position: [number, number, number]; 
  rotation: number; 
  type: string; 
  scale?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [flowerScene, setFlowerScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${type}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(scale ?? 0.2);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });
        setFlowerScene(cloned);
      },
      undefined,
      (error) => console.error(`[Flower] Failed to load: ${type}`, error)
    );
  }, [type, scale]);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {flowerScene ? (
        <primitive object={flowerScene} />
      ) : (
        <mesh>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#ff69b4" />
        </mesh>
      )}
    </group>
  );
}

// ==================== Base Grass Instanced (for blank tiles) ====================

type GrassInstance = {
  position: [number, number, number];
  rotationY: number;
  scale: number;
};

function BaseGrassInstanced({ 
  instances, 
  cellWorldX, 
  cellWorldZ 
}: { 
  instances: GrassInstance[];
  cellWorldX: number;
  cellWorldZ: number;
}) {
  const [meshData, setMeshData] = useState<{ geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] } | null>(null);
  const instRef = useRef<THREE.InstancedMesh | null>(null);
  const baseGrassVariant = 'Grass_Common_Short';

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${baseGrassVariant}.gltf`;
    loader.load(
      assetPath,
      (gltf) => {
        let found: THREE.Mesh | null = null;
        gltf.scene.traverse((o) => {
          if (!found && o instanceof THREE.Mesh) {
            found = o;
          }
        });
        if (!found) return;
        const mesh = found as THREE.Mesh;
        if (!mesh.geometry || !mesh.material) return;
        setMeshData({ geometry: mesh.geometry.clone(), material: mesh.material });
      },
      undefined,
      (err) => console.error('[BaseGrassInstanced] load failed', err)
    );
  }, []);

  useEffect(() => {
    if (!instRef.current || !meshData) return;
    const dummy = new THREE.Object3D();
    instances.forEach((it, i) => {
      // Positions are relative to cell center (parent group handles cell positioning)
      dummy.position.set(
        cellWorldX + it.position[0],
        it.position[1],
        cellWorldZ + it.position[2]
      );
      dummy.rotation.set(0, it.rotationY, 0);
      dummy.scale.setScalar(it.scale);
      dummy.updateMatrix();
      instRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instRef.current.instanceMatrix.needsUpdate = true;
  }, [instances, meshData, cellWorldX, cellWorldZ]);

  if (!meshData) return null;
  return (
    <instancedMesh
      ref={instRef}
      args={[meshData.geometry, meshData.material as any, instances.length]}
      castShadow
      receiveShadow
    />
  );
}

// ==================== Tile Renderer ====================

function TileRenderer({ 
  tileId
}: { 
  tileId: string | null; 
  cellX: number; 
  cellY: number;
  gridWidth: number;
  gridHeight: number;
}) {
  const [tileData, setTileData] = useState<any>(null);
  const [tileGltf, setTileGltf] = useState<THREE.Group | null>(null);
  const grassTypes = ['Grass_Common_Short', 'Grass_Common_Tall', 'Grass_Wispy_Short', 'Grass_Wispy_Tall'];
  const pebbleTypes = ['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Round_4', 'Pebble_Round_5'];
  const flowerLargeTypes = ['Flower_3_Single', 'Flower_4_Single'];

  // Generate base grass for blank tiles (same as MinimalDemo and TileCreation)
  const generateBaseGrass = (): GrassInstance[] => {
    const result: GrassInstance[] = [];
    const count = 1400; // Same density across all pages
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10; // -5 to +5 range (10x10 tile)
      const z = (Math.random() - 0.5) * 10;
      const scale = 0.12 + Math.random() * 0.10; // Same scale range
      result.push({
        position: [x, 0.01, z],
        rotationY: Math.random() * Math.PI * 2,
        scale,
      });
    }
    return result;
  };

  const baseGrassInstances = useMemo(() => generateBaseGrass(), []);

  useEffect(() => {
    if (!tileId || tileId === BLANK_TILE_ID) {
      setTileData(null);
      setTileGltf(null);
      return;
    }

    // Prefer merged GLB tile (single mesh) for performance
    const glbData = localStorage.getItem(`tile_glb_${tileId}`);
    if (glbData) {
      try {
        const loader = new GLTFLoader();
        const base64Data = glbData.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        loader.load(
          url,
          (gltf) => {
            const cloned = gltf.scene.clone();
            cloned.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            setTileGltf(cloned);
            URL.revokeObjectURL(url);
          },
          undefined,
          (err) => {
            console.error('Error loading tile GLB:', err);
            URL.revokeObjectURL(url);
            setTileGltf(null);
          }
        );
      } catch (e) {
        console.error('Error processing tile GLB:', e);
        setTileGltf(null);
      }
    } else {
      // Legacy fallback: JSON assets (skip if it's actually GLB data)
      const stored = localStorage.getItem(`tile_${tileId}`);
      if (stored && !stored.startsWith('data:')) {
        try {
          const parsed = JSON.parse(stored);
          setTileData(parsed);
        } catch (error) {
          console.error('Error loading tile:', error);
        }
      }
    }
  }, [tileId]);

  // Render base grass for blank tiles
  // Note: Assets are rendered relative to the group position (which is already at cell center)
  // So we use positions directly from the tile data (which are in -5 to +5 range)
  if (tileId === BLANK_TILE_ID) {
    return <BaseGrassInstanced instances={baseGrassInstances} cellWorldX={0} cellWorldZ={0} />;
  }

  // New path: merged single-mesh tile GLB
  if (tileGltf) {
    return (
      <group>
        {/* Base grass for custom tiles too (kept consistent) */}
        <BaseGrassInstanced instances={baseGrassInstances} cellWorldX={0} cellWorldZ={0} />
        <primitive object={tileGltf} />
      </group>
    );
  }

  if (!tileData || !tileData.assets) return null;

  return (
    <group>
      {/* Base grass for custom tiles too */}
      <BaseGrassInstanced instances={baseGrassInstances} cellWorldX={0} cellWorldZ={0} />
      {tileData.assets.map((asset: any) => {
        // Tile assets are positioned in -5 to +5 range (10x10 tile)
        // The parent group is already positioned at the cell center, so use positions directly
        const worldPos: [number, number, number] = [
          asset.position[0], // Direct use: -5..5 relative to cell center
          asset.position[1],
          asset.position[2],
        ];

        if (asset.type === 'grass') {
          const type = asset.variant || grassTypes[Math.floor(Math.random() * grassTypes.length)];
          return (
            <GrassPatch
              key={asset.id}
              position={worldPos}
              rotation={asset.rotation}
              type={type}
              scale={asset.scale || 1.5}
            />
          );
        } else if (asset.type === 'pebble') {
          const variant = asset.variant || pebbleTypes[Math.floor(Math.random() * pebbleTypes.length)];
          return (
            <SmallRock
              key={asset.id}
              position={worldPos}
              rotation={asset.rotation}
              variant={variant}
              scale={asset.scale || 1.2}
            />
          );
        } else if (asset.type === 'flower') {
          const type = asset.variant || flowerLargeTypes[Math.floor(Math.random() * flowerLargeTypes.length)];
          return (
            <Flower
              key={asset.id}
              position={worldPos}
              rotation={asset.rotation}
              type={type}
              scale={asset.scale || 0.2}
            />
          );
        } else {
          return (
            <PlacedAsset
              key={asset.id}
              assetType={asset.type}
              position={worldPos}
              rotation={asset.rotation}
              scale={asset.scale}
              variant={asset.variant}
            />
          );
        }
      })}
    </group>
  );
}

function TileCellMesh({
  cell,
  x,
  y,
  gridWidth,
  gridHeight,
  isSelected,
  onClick,
  onExpand,
}: {
  cell: WorldCell;
  x: number;
  y: number;
  gridWidth: number;
  gridHeight: number;
  isSelected: boolean;
  onClick: (e: any) => void;
  onExpand?: (direction: 'north' | 'south' | 'east' | 'west') => void;
}) {
  const size = 10.0; // Each cell is 10x10 units
  // Position at cell center
  const worldX = (x - (gridWidth - 1) / 2) * size;
  const worldZ = (y - (gridHeight - 1) / 2) * size;
  
  // Check if this is an edge tile
  const isNorthEdge = y === 0;
  const isSouthEdge = y === gridHeight - 1;
  const isEastEdge = x === gridWidth - 1;
  const isWestEdge = x === 0;

  const isBlankGrass = cell.tileId === BLANK_TILE_ID;
  const hasCustomTile = cell.tileId && cell.tileId !== BLANK_TILE_ID;

  // Green for grass, slightly different green for custom tiles
  const baseColor = isBlankGrass
    ? '#3d6b2d'
    : hasCustomTile
    ? '#4a7c3a'
    : '#333333';

  const rotationY = cell.rotation * (Math.PI / 2);

  return (
    <group position={[worldX, 0, worldZ]} rotation={[0, rotationY, 0]}>
      {/* Ground plane - the actual tile (UI/placement surface only; do NOT export) */}
      <mesh
        name="cell_ground"
        userData={{ skipExport: true }}
        receiveShadow 
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[size, 0.05, size]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>
      {/* Grid lines - visible borders on edges */}
      <lineSegments
        name="cell_grid_lines"
        userData={{ skipExport: true }}
        position={[0, 0.026, 0]}
      >
        <edgesGeometry args={[new THREE.BoxGeometry(size, 0.05, size)]} />
        <lineBasicMaterial color={isSelected ? '#ffffff' : '#888888'} linewidth={2} />
      </lineSegments>
      {/* Selection highlight - subtle glow */}
      {isSelected && (
        <mesh name="cell_selection_ring" userData={{ skipExport: true }} position={[0, 0.03, 0]}>
          <ringGeometry args={[size * 0.45, size * 0.5, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Render tile assets */}
      {cell.tileId && (
        <TileRenderer tileId={cell.tileId} cellX={x} cellY={y} gridWidth={gridWidth} gridHeight={gridHeight} />
      )}
      {/* Expand arrows at edges */}
      {isNorthEdge && onExpand && (
        <mesh
          name="cell_expand_arrow"
          userData={{ skipExport: true }}
          position={[0, 0.1, -size/2 - 0.5]}
          onClick={(e) => { e.stopPropagation(); onExpand('north'); }}
        >
          <coneGeometry args={[0.3, 0.8, 8]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}
      {isSouthEdge && onExpand && (
        <mesh
          name="cell_expand_arrow"
          userData={{ skipExport: true }}
          position={[0, 0.1, size/2 + 0.5]}
          rotation={[0, Math.PI, 0]}
          onClick={(e) => { e.stopPropagation(); onExpand('south'); }}
        >
          <coneGeometry args={[0.3, 0.8, 8]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}
      {isEastEdge && onExpand && (
        <mesh
          name="cell_expand_arrow"
          userData={{ skipExport: true }}
          position={[size/2 + 0.5, 0.1, 0]}
          rotation={[0, -Math.PI/2, 0]}
          onClick={(e) => { e.stopPropagation(); onExpand('east'); }}
        >
          <coneGeometry args={[0.3, 0.8, 8]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}
      {isWestEdge && onExpand && (
        <mesh
          name="cell_expand_arrow"
          userData={{ skipExport: true }}
          position={[-size/2 - 0.5, 0.1, 0]}
          rotation={[0, Math.PI/2, 0]}
          onClick={(e) => { e.stopPropagation(); onExpand('west'); }}
        >
          <coneGeometry args={[0.3, 0.8, 8]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}
    </group>
  );
}

export function WorldFromTilesPage() {
  const navigate = useNavigate();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const exportRootRef = useRef<THREE.Group | null>(null);
  const [gridWidth, setGridWidth] = useState(INITIAL_GRID_WIDTH);
  const [gridHeight, setGridHeight] = useState(INITIAL_GRID_HEIGHT);
  const [grid, setGrid] = useState<WorldCell[][]>(() => buildInitialGrid(INITIAL_GRID_WIDTH, INITIAL_GRID_HEIGHT));
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedTileKey, setSelectedTileKey] = useState<string | null>(null);
  const [zoomDistance, setZoomDistance] = useState(50);
  const [interactionMode, setInteractionMode] = useState<'select' | 'rotate' | 'drag'>('select');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [worldName, setWorldName] = useState('');
  // No manual export state; world save always stores merged GLB.

  const savedTiles: SavedTileMeta[] = useMemo(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('tile_'));
    const list: SavedTileMeta[] = keys.map((key) => ({
      key,
      name: key.replace(/^tile_/, ''),
    }));
    // Add the built-in blank grass tile
    return [{ key: BLANK_TILE_ID, name: 'Blank Grass Tile' }, ...list];
  }, []);

  const handleTileSelect = (tileKey: string) => {
    if (!selectedCell) {
      alert('Please select a grid square first');
      return;
    }
    
    setSelectedTileKey(tileKey);
    
    // Apply the tile to the selected cell
    setGrid((prev) => {
      const next = prev.map((row) => row.slice());
      const cell = next[selectedCell.y][selectedCell.x];
      cell.tileId = tileKey === BLANK_TILE_ID ? BLANK_TILE_ID : tileKey.replace(/^tile_/, '');
      return next;
    });
  };

  const handleRotateSelected = (x?: number, y?: number) => {
    const targetX = x !== undefined ? x : selectedCell?.x;
    const targetY = y !== undefined ? y : selectedCell?.y;
    
    if (targetX === undefined || targetY === undefined) {
      return; // Silently return if no valid target
    }
    
    setGrid((prev) => {
      const next = prev.map((row) => row.slice());
      if (next[targetY] && next[targetY][targetX]) {
        const cell = next[targetY][targetX];
        // Rotate any tile (including blank grass tiles)
        if (cell.tileId) {
          // Rotate the tile by 90 degrees (0 -> 1 -> 2 -> 3 -> 0)
          cell.rotation = (((cell.rotation + 1) % 4) as 0 | 1 | 2 | 3);
        }
      }
      return next;
    });
  };

  const handleExpandGrid = (direction: 'north' | 'south' | 'east' | 'west') => {
    setGrid((prev) => {
      let newWidth = gridWidth;
      let newHeight = gridHeight;
      const newGrid = prev.map(row => [...row]);

      if (direction === 'north') {
        // Add row at top
        newGrid.unshift(Array.from({ length: gridWidth }, () => ({ tileId: BLANK_TILE_ID, rotation: 0 })));
        newHeight++;
      } else if (direction === 'south') {
        // Add row at bottom
        newGrid.push(Array.from({ length: gridWidth }, () => ({ tileId: BLANK_TILE_ID, rotation: 0 })));
        newHeight++;
      } else if (direction === 'east') {
        // Add column at right
        newGrid.forEach(row => row.push({ tileId: BLANK_TILE_ID, rotation: 0 }));
        newWidth++;
      } else if (direction === 'west') {
        // Add column at left
        newGrid.forEach(row => row.unshift({ tileId: BLANK_TILE_ID, rotation: 0 }));
        newWidth++;
      }

      setGridWidth(newWidth);
      setGridHeight(newHeight);
      return newGrid;
    });
  };

  const handleSaveWorld = async () => {
    if (!worldName.trim()) {
      alert('Please enter a world name');
      return;
    }

    const worldData = {
      grid,
      gridWidth,
      gridHeight,
      createdAt: new Date().toISOString(),
      version: '1.0',
    };

    try {
      console.log('[World Save] Starting save process...');
      
      // Save to localStorage for now (can be changed to API call later)
      localStorage.setItem(`world_${worldName}`, JSON.stringify(worldData));
      console.log('[World Save] JSON metadata saved');
      
      // Automatically export as merged GLB mesh for performance
      if (exportRootRef.current) {
        console.log('[World Save] Starting GLB export...');
        await exportAndStoreGLB(worldName.trim());
        console.log('[World Save] GLB export completed');
      } else {
        console.warn('[World Save] No export root found, skipping GLB export');
      }
      
      setShowSaveDialog(false);
      setWorldName('');
      alert(`World "${worldName}" saved successfully! GLB mesh exported automatically.`);
    } catch (error) {
      console.error('[World Save] Error saving world:', error);
      alert(`Error saving world: ${error instanceof Error ? error.message : String(error)}\n\nCheck console for details.`);
    }
  };

  // Helper function to store large GLB files in IndexedDB
  const storeInIndexedDB = (name: string, blob: Blob, resolve: () => void, reject: (error: Error) => void) => {
    const dbName = 'viber3d_worlds';
    const storeName = 'glb_files';
    const key = `world_glb_${name}`;
    
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => {
      console.error('[World Export] IndexedDB open failed:', request.error);
      reject(new Error(`IndexedDB failed: ${request.error?.message || 'Unknown error'}`));
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const putRequest = store.put(blob, key);
      
      putRequest.onsuccess = () => {
        // Mark that it's in IndexedDB
        localStorage.setItem(`world_glb_${name}_storage`, 'indexeddb');
        console.log(`[World Export] GLB stored in IndexedDB (${Math.round(blob.size / 1024)}KB)`);
        resolve();
      };
      
      putRequest.onerror = () => {
        console.error('[World Export] IndexedDB put failed:', putRequest.error);
        reject(new Error(`IndexedDB storage failed: ${putRequest.error?.message || 'Unknown error'}`));
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  };

  const exportAndStoreGLB = async (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!exportRootRef.current) {
        reject(new Error('No export root - make sure the world is rendered'));
        return;
      }
      
      // Wait a frame to ensure all async GLB loads are complete
      requestAnimationFrame(() => {
        // Wait one more frame to be safe
        requestAnimationFrame(() => {
          try {
            exportAndStoreGLBInternal(name, resolve, reject);
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
      });
    });
  };

  const exportAndStoreGLBInternal = (name: string, resolve: () => void, reject: (error: Error) => void) => {
    if (!exportRootRef.current) {
      reject(new Error('No export root'));
      return;
    }

      // Collect all meshes from the export root, but skip ground/base planes (we add our own ground in MinimalDemo)
      const allMeshes: THREE.Mesh[] = [];
      const skippedMeshes: string[] = [];
      
      exportRootRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const n = (child.name || '').toLowerCase();
          const skip = (child as any).userData?.skipExport;
          
          if (skip) {
            skippedMeshes.push(`skipExport flag: ${child.name || 'unnamed'}`);
            return;
          }
          
          // Skip any UI/placement surfaces - we always generate ground separately
          if (n.includes('ground') || n.includes('base') || n.includes('cell_')) {
            skippedMeshes.push(`name filter: ${child.name || 'unnamed'}`);
            return;
          }
          
          allMeshes.push(child);
        }
      });

      console.log(`[World Export] Found ${allMeshes.length} meshes to export`);
      if (skippedMeshes.length > 0) {
        console.log(`[World Export] Skipped ${skippedMeshes.length} meshes:`, skippedMeshes.slice(0, 10));
      }

      if (allMeshes.length === 0) {
        const errorMsg = `No meshes found to export. Total children traversed: ${exportRootRef.current.children.length}. Skipped: ${skippedMeshes.length}`;
        console.error(`[World Export] ${errorMsg}`);
        reject(new Error(errorMsg));
        return;
      }

      // Normalize and merge geometries (same approach as TileCreation)
      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];
      
      allMeshes.forEach((mesh) => {
        if (!mesh.geometry) return;
        
        // Create normalized geometry (only position, normal, uv - no color/morphs)
        const geom = new THREE.BufferGeometry();
        const srcGeom = mesh.geometry;
        
        // Copy position
        if (srcGeom.attributes.position) {
          geom.setAttribute('position', srcGeom.attributes.position.clone());
        }
        // Copy normal if exists
        if (srcGeom.attributes.normal) {
          geom.setAttribute('normal', srcGeom.attributes.normal.clone());
        }
        // Copy uv if exists
        if (srcGeom.attributes.uv) {
          geom.setAttribute('uv', srcGeom.attributes.uv.clone());
        }
        // Copy index if exists
        if (srcGeom.index) {
          geom.setIndex(srcGeom.index.clone());
        }
        
        // Explicitly clear morph attributes
        geom.morphAttributes = {};
        
        // Apply mesh transform
        geom.applyMatrix4(mesh.matrixWorld);
        geometries.push(geom);
        
        // Collect material (preserve textures)
        if (mesh.material) {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          // Clone material to avoid sharing issues
          const clonedMat = mat.clone();
          materials.push(clonedMat);
        } else {
          // Add a default material if mesh has no material
          materials.push(new THREE.MeshStandardMaterial({ color: 0xffffff }));
        }
      });

      if (geometries.length === 0) {
        reject(new Error('No geometries to merge'));
        return;
      }

      console.log(`[World Export] Merging ${geometries.length} geometries with ${materials.length} materials`);

      // Merge into ONE mesh but keep multiple materials via geometry groups
      // This preserves textures across different tiles/assets.
      let mergedGeometry: THREE.BufferGeometry;
      let mergedMesh: THREE.Mesh;
      
      try {
        mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
        
        // Ensure materials array matches groups count
        const groupsCount = mergedGeometry.groups.length;
        const finalMaterials = groupsCount > 0 && materials.length >= groupsCount
          ? materials.slice(0, groupsCount)
          : materials.length > 0
          ? materials
          : [new THREE.MeshStandardMaterial({ color: 0xffffff })];
        
        console.log(`[World Export] Created merged geometry with ${groupsCount} groups, using ${finalMaterials.length} materials`);
        
        mergedMesh = new THREE.Mesh(
          mergedGeometry,
          finalMaterials.length > 1 ? finalMaterials : finalMaterials[0]
        );
      } catch (mergeError) {
        console.error('[World Export] Merge failed, trying without groups:', mergeError);
        // Fallback: merge without groups (single material)
        mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
        // Use first material or default
        const fallbackMaterial = materials.length > 0 ? materials[0] : new THREE.MeshStandardMaterial({ color: 0xffffff });
        mergedMesh = new THREE.Mesh(mergedGeometry, fallbackMaterial);
      }

      // Create a scene with the merged mesh
      const exportScene = new THREE.Scene();
      exportScene.add(mergedMesh);

      // Export as GLB
      console.log('[World Export] Starting GLTF export...');
      const exporter = new GLTFExporter();
      
      // Use setTimeout to avoid blocking the main thread and prevent WebGL context loss
      setTimeout(() => {
        exporter.parse(
          exportScene,
          (result) => {
            try {
              console.log('[World Export] GLTF export completed, storing GLB...');
              const output = result as ArrayBuffer;
              const blob = new Blob([output], { type: 'model/gltf-binary' });
              const sizeMB = blob.size / (1024 * 1024);
              
              console.log(`[World Export] GLB size: ${sizeMB.toFixed(2)}MB`);
              
              // Try localStorage first (for small files < 5MB)
              if (blob.size < 5 * 1024 * 1024) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  try {
                    const base64 = reader.result as string;
                    localStorage.setItem(`world_glb_${name}`, base64);
                    // Mark that it's in localStorage (not IndexedDB)
                    localStorage.setItem(`world_glb_${name}_storage`, 'localStorage');
                    console.log(`[World Export] GLB stored in localStorage (${Math.round(base64.length / 1024)}KB)`);
                    resolve();
                  } catch (storageError) {
                    // If localStorage fails, try IndexedDB
                    console.warn('[World Export] localStorage failed, trying IndexedDB:', storageError);
                    storeInIndexedDB(name, blob, resolve, reject);
                  }
                };
                reader.onerror = () => {
                  console.error('[World Export] FileReader error, trying IndexedDB');
                  storeInIndexedDB(name, blob, resolve, reject);
                };
                reader.readAsDataURL(blob);
              } else {
                // Large file - use IndexedDB directly
                console.log('[World Export] Large file detected, using IndexedDB');
                storeInIndexedDB(name, blob, resolve, reject);
              }
            } catch (processError) {
              console.error('[World Export] Error processing GLB result:', processError);
              reject(new Error(`Failed to process GLB: ${processError instanceof Error ? processError.message : String(processError)}`));
            }
          },
          (error) => {
            console.error('[World Export] GLTF export error:', error);
            reject(new Error(`GLTF export failed: ${error instanceof Error ? error.message : String(error)}`));
          },
          { 
            binary: true,
            includeCustomExtensions: true,
            // Ensure textures are embedded
            embedImages: true
          }
        );
      }, 100); // Small delay to prevent WebGL context loss
  };

  // No manual export button; Save World always stores a merged single-mesh GLB in localStorage.

  const handleCellClick = (x: number, y: number) => {
    if (interactionMode === 'select') {
      setSelectedCell({ x, y });
    } else if (interactionMode === 'rotate') {
      // In rotate mode, clicking a cell selects it first, then rotates it
      if (selectedCell?.x === x && selectedCell?.y === y) {
        // If already selected, rotate it
        handleRotateSelected(x, y);
      } else {
        // Otherwise, just select it
        setSelectedCell({ x, y });
      }
    }
  };

  // Keep camera distance in sync with the zoom slider
  useEffect(() => {
    if (!cameraRef.current) return;
    const distance = zoomDistance;
    const angle = Math.PI / 4; // 45 degrees
    cameraRef.current.position.set(
      distance * Math.cos(angle),
      distance * Math.sin(angle),
      distance * Math.cos(angle)
    );
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current?.update?.();
  }, [zoomDistance]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        ← Back
      </button>

      {/* Top Toolbar */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '10px',
        background: 'rgba(0,0,0,0.85)',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #555',
      }}>
        <button
          onClick={() => setInteractionMode('select')}
          style={{
            padding: '8px 15px',
            background: interactionMode === 'select' ? '#4a9eff' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          title="Select tiles"
        >
          👆 Select
        </button>
        <button
          onClick={() => {
            if (selectedCell) {
              handleRotateSelected();
            } else {
              setInteractionMode('rotate');
            }
          }}
          style={{
            padding: '8px 15px',
            background: interactionMode === 'rotate' ? '#4a9eff' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          title={selectedCell ? "Rotate selected tile" : "Switch to rotate mode"}
        >
          🔄 Rotate
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          style={{
            padding: '8px 15px',
            background: '#3d6b2d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          title="Save world"
        >
          💾 Save World
        </button>
        {/* No manual export button; Save World stores merged GLB automatically */}
      </div>

      {/* Zoom slider */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.75)',
        border: '1px solid #555',
        borderRadius: '8px',
        padding: '8px 10px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '11px',
        minWidth: '220px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>Zoom</span>
          <span>{zoomDistance.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min="30"
          max="200"
          step="5"
          value={zoomDistance}
          onChange={(e) => setZoomDistance(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#222',
            padding: '30px',
            borderRadius: '10px',
            color: 'white',
            minWidth: '300px',
          }}>
            <h2 style={{ marginTop: 0 }}>Save World</h2>
            <input
              type="text"
              value={worldName}
              onChange={(e) => setWorldName(e.target.value)}
              placeholder="Enter world name"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                fontSize: '16px',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '5px',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveWorld();
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setWorldName('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorld}
                style={{
                  padding: '10px 20px',
                  background: '#3d6b2d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar with tile list */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.85)',
          padding: '15px',
          borderRadius: '5px',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          width: '220px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Tiles</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#aaa' }}>
          1) Click a grid square<br />
          2) Click a tile name
        </p>
        {selectedCell && (
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#4a9eff' }}>
            Selected: ({selectedCell.x}, {selectedCell.y})
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {savedTiles.length === 0 && (
            <div style={{ fontSize: '11px', color: '#aaa' }}>No saved tiles found.</div>
          )}
          {savedTiles.map((tile) => (
            <button
              key={tile.key}
              onClick={(e) => {
                e.stopPropagation();
                handleTileSelect(tile.key === BLANK_TILE_ID ? BLANK_TILE_ID : tile.key);
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                textAlign: 'left',
                background:
                  selectedTileKey === tile.key || (tile.key === BLANK_TILE_ID && selectedTileKey === BLANK_TILE_ID)
                    ? '#4a9eff'
                    : '#444',
                border:
                  selectedTileKey === tile.key || (tile.key === BLANK_TILE_ID && selectedTileKey === BLANK_TILE_ID)
                    ? '2px solid #fff'
                    : '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {tile.name}
            </button>
          ))}
        </div>
      </div>

      <Canvas
        shadows
        camera={{ position: [50, 50, 50], near: 0.1, far: 1000 }}
        style={{ background: '#101018' }}
      >
        <PerspectiveCamera ref={cameraRef} makeDefault position={[50, 50, 50]} fov={50} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={30}
          maxDistance={200}
          target={[0, 0, 0]} // Center the camera on the grid center
        />

        <ambientLight intensity={0.8} />
        <directionalLight
          position={[15, 20, 10]}
          intensity={1.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Export root - everything inside gets exported as one GLB */}
        <group ref={exportRootRef}>
          {/* grid of tiles */}
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <TileCellMesh
                key={`${x}-${y}`}
                cell={cell}
                x={x}
                y={y}
                gridWidth={gridWidth}
                gridHeight={gridHeight}
                isSelected={selectedCell?.x === x && selectedCell?.y === y}
                onClick={() => handleCellClick(x, y)}
                onExpand={handleExpandGrid}
              />
            ))
          )}
        </group>
      </Canvas>
    </div>
  );
}

export default WorldFromTilesPage;

