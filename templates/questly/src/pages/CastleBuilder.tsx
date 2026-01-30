import React, { Suspense, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, useGLTF, Edges } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { oceanVertexShader, oceanFragmentShader } from '@/shaders/OceanShaders';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import SidebarMenu from '../components/SidebarMenu';
import { InstancedGrass } from '../components/InstancedGrass';
import { Menu, Eraser, Save, Download, PenTool } from 'lucide-react';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { cloneGltf } from '../utils/cloneGltf';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Patch three.js with three-mesh-bvh for accelerated raycasting
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Asset Pack Configuration
export interface BuildingAssetPack {
  id: string;
  name: string;
  description: string;
  basePath: string;
  assets: BuildingAsset[];
}

export interface BuildingAsset {
  id: string;
  name: string;
  type: string;
  modelPath: string;
  icon: string;
  defaultScale?: number;
  bounds?: { width: number; depth: number; height: number };
}

// Define available building asset packs
export const BUILDING_ASSET_PACKS: BuildingAssetPack[] = [
  {
    id: 'kaykit_castle',
    name: 'KayKit Castle',
    description: 'Medieval castle and fortification pieces',
    basePath: '/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/',
    assets: [
      {
        id: 'castle',
        name: 'Castle',
        type: 'castle',
        modelPath: 'blue/building_castle_blue.gltf',
        icon: '🏰',
        defaultScale: 8.0,
        bounds: { width: 2.8, depth: 2.8, height: 6 },
      },
      {
        id: 'tower_a',
        name: 'Tower A',
        type: 'tower_a',
        modelPath: 'blue/building_tower_A_blue.gltf',
        icon: '🗼',
        defaultScale: 6.0,
        bounds: { width: 1.4, depth: 1.4, height: 5 },
      },
      {
        id: 'tower_b',
        name: 'Tower B',
        type: 'tower_b',
        modelPath: 'blue/building_tower_B_blue.gltf',
        icon: '🗼',
        defaultScale: 6.0,
        bounds: { width: 1.4, depth: 1.4, height: 5 },
      },
      {
        id: 'tower_base',
        name: 'Tower Base',
        type: 'tower_base',
        modelPath: 'blue/building_tower_base_blue.gltf',
        icon: '🔲',
        defaultScale: 6.0,
        bounds: { width: 1.4, depth: 1.4, height: 1 },
      },
      {
        id: 'wall_straight',
        name: 'Wall',
        type: 'wall_straight',
        modelPath: 'neutral/wall_straight.gltf',
        icon: '🧱',
        defaultScale: 6.0,
        bounds: { width: 0.35, depth: 2.1, height: 2 },
      },
      {
        id: 'wall_corner',
        name: 'Corner',
        type: 'wall_corner',
        modelPath: 'neutral/wall_corner_A_outside.gltf',
        icon: '📐',
        defaultScale: 6.0,
        bounds: { width: 1.4, depth: 1.4, height: 2 },
      },
      {
        id: 'wall_gate',
        name: 'Gate',
        type: 'wall_gate',
        modelPath: 'neutral/wall_straight_gate.gltf',
        icon: '🚪',
        defaultScale: 6.0,
        bounds: { width: 0.35, depth: 2.1, height: 3 },
      },
    ],
  },
  {
    id: 'medieval_village',
    name: 'Medieval Village',
    description: 'Medieval village buildings, structures, and props',
    basePath: '/Assets/Medieval_Village_Pack/',
    assets: [
      // Buildings
      {
        id: 'bell_tower',
        name: 'Bell Tower',
        type: 'bell_tower',
        modelPath: 'Bell Tower.glb',
        icon: '🔔',
        defaultScale: 5.0,
        bounds: { width: 2, depth: 2, height: 4 },
      },
      {
        id: 'blacksmith',
        name: 'Blacksmith',
        type: 'blacksmith',
        modelPath: 'Blacksmith.glb',
        icon: '🔨',
        defaultScale: 5.0,
        bounds: { width: 3, depth: 3, height: 3 },
      },
      {
        id: 'fantasy_barracks',
        name: 'Barracks',
        type: 'fantasy_barracks',
        modelPath: 'Fantasy Barracks.glb',
        icon: '🏛️',
        defaultScale: 5.0,
        bounds: { width: 4, depth: 4, height: 3 },
      },
      {
        id: 'fantasy_house',
        name: 'Fantasy House',
        type: 'fantasy_house',
        modelPath: 'Fantasy House.glb',
        icon: '🏠',
        defaultScale: 5.0,
        bounds: { width: 3, depth: 3, height: 3 },
      },
      {
        id: 'fantasy_inn',
        name: 'Fantasy Inn',
        type: 'fantasy_inn',
        modelPath: 'Fantasy Inn.glb',
        icon: '🍺',
        defaultScale: 5.0,
        bounds: { width: 4, depth: 4, height: 3 },
      },
      {
        id: 'fantasy_sawmill',
        name: 'Sawmill',
        type: 'fantasy_sawmill',
        modelPath: 'Fantasy Sawmill.glb',
        icon: '🪵',
        defaultScale: 5.0,
        bounds: { width: 3, depth: 3, height: 3 },
      },
      {
        id: 'fantasy_stable',
        name: 'Stable',
        type: 'fantasy_stable',
        modelPath: 'Fantasy Stable.glb',
        icon: '🐴',
        defaultScale: 5.0,
        bounds: { width: 3, depth: 3, height: 2.5 },
      },
      {
        id: 'mill',
        name: 'Mill',
        type: 'mill',
        modelPath: 'Mill.glb',
        icon: '⚙️',
        defaultScale: 5.0,
        bounds: { width: 3, depth: 3, height: 4 },
      },
      // Structures
      {
        id: 'door_round',
        name: 'Round Door',
        type: 'door_round',
        modelPath: 'Door Round.glb',
        icon: '🚪',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 0.2, height: 2 },
      },
      {
        id: 'door_straight',
        name: 'Straight Door',
        type: 'door_straight',
        modelPath: 'Door Straight.glb',
        icon: '🚪',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 0.2, height: 2 },
      },
      {
        id: 'fence',
        name: 'Fence',
        type: 'fence',
        modelPath: 'Fence.glb',
        icon: '🪵',
        defaultScale: 5.0,
        bounds: { width: 2, depth: 0.2, height: 1 },
      },
      {
        id: 'gazebo',
        name: 'Gazebo',
        type: 'gazebo',
        modelPath: 'Gazebo.glb',
        icon: '🏛️',
        defaultScale: 5.0,
        bounds: { width: 2, depth: 2, height: 2.5 },
      },
      {
        id: 'market_stand',
        name: 'Market Stand',
        type: 'market_stand',
        modelPath: 'Market Stand.glb',
        icon: '🏪',
        defaultScale: 5.0,
        bounds: { width: 1.5, depth: 1.5, height: 2 },
      },
      {
        id: 'path_straight',
        name: 'Path',
        type: 'path_straight',
        modelPath: 'Path Straight.glb',
        icon: '🛤️',
        defaultScale: 5.0,
        bounds: { width: 2, depth: 0.1, height: 0.1 },
      },
      {
        id: 'round_window',
        name: 'Round Window',
        type: 'round_window',
        modelPath: 'Round Window.glb',
        icon: '🪟',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 0.2, height: 1 },
      },
      {
        id: 'stairs',
        name: 'Stairs',
        type: 'stairs',
        modelPath: 'Stairs.glb',
        icon: '📶',
        defaultScale: 5.0,
        bounds: { width: 1.5, depth: 1, height: 1 },
      },
      {
        id: 'well',
        name: 'Well',
        type: 'well',
        modelPath: 'Well.glb',
        icon: '🪣',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 1, height: 1.5 },
      },
      {
        id: 'window',
        name: 'Window',
        type: 'window',
        modelPath: 'Window.glb',
        icon: '🪟',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 0.2, height: 1 },
      },
      // Props
      {
        id: 'bag',
        name: 'Bag',
        type: 'bag',
        modelPath: 'Bag.glb',
        icon: '🎒',
        defaultScale: 5.0,
        bounds: { width: 0.3, depth: 0.3, height: 0.4 },
      },
      {
        id: 'bag_open',
        name: 'Bag Open',
        type: 'bag_open',
        modelPath: 'Bag Open.glb',
        icon: '🎒',
        defaultScale: 5.0,
        bounds: { width: 0.3, depth: 0.3, height: 0.4 },
      },
      {
        id: 'bags',
        name: 'Bags',
        type: 'bags',
        modelPath: 'Bags.glb',
        icon: '🎒',
        defaultScale: 5.0,
        bounds: { width: 0.5, depth: 0.5, height: 0.5 },
      },
      {
        id: 'barrel',
        name: 'Barrel',
        type: 'barrel',
        modelPath: 'Barrel.glb',
        icon: '🪣',
        defaultScale: 5.0,
        bounds: { width: 0.6, depth: 0.6, height: 0.8 },
      },
      {
        id: 'bell',
        name: 'Bell',
        type: 'bell',
        modelPath: 'Bell.glb',
        icon: '🔔',
        defaultScale: 5.0,
        bounds: { width: 0.4, depth: 0.4, height: 0.6 },
      },
      {
        id: 'bench',
        name: 'Bench',
        type: 'bench',
        modelPath: 'Bench.glb',
        icon: '🪑',
        defaultScale: 5.0,
        bounds: { width: 1.5, depth: 0.5, height: 0.5 },
      },
      {
        id: 'bonfire',
        name: 'Bonfire',
        type: 'bonfire',
        modelPath: 'Bonfire.glb',
        icon: '🔥',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 1, height: 1 },
      },
      {
        id: 'cart',
        name: 'Cart',
        type: 'cart',
        modelPath: 'Cart.glb',
        icon: '🛒',
        defaultScale: 5.0,
        bounds: { width: 1.5, depth: 1, height: 0.8 },
      },
      {
        id: 'cauldron',
        name: 'Cauldron',
        type: 'cauldron',
        modelPath: 'Cauldron.glb',
        icon: '🍲',
        defaultScale: 5.0,
        bounds: { width: 0.8, depth: 0.8, height: 0.8 },
      },
      {
        id: 'crate',
        name: 'Crate',
        type: 'crate',
        modelPath: 'Crate.glb',
        icon: '📦',
        defaultScale: 5.0,
        bounds: { width: 0.6, depth: 0.6, height: 0.6 },
      },
      {
        id: 'hay',
        name: 'Hay',
        type: 'hay',
        modelPath: 'Hay.glb',
        icon: '🌾',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 1, height: 0.8 },
      },
      {
        id: 'package',
        name: 'Package',
        type: 'package',
        modelPath: 'Package.glb',
        icon: '📦',
        defaultScale: 5.0,
        bounds: { width: 0.5, depth: 0.5, height: 0.5 },
      },
      {
        id: 'rocks',
        name: 'Rocks',
        type: 'rocks',
        modelPath: 'Rocks.glb',
        icon: '🪨',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 1, height: 0.5 },
      },
      {
        id: 'sawmill_saw',
        name: 'Sawmill Saw',
        type: 'sawmill_saw',
        modelPath: 'Sawmill Saw.glb',
        icon: '🪚',
        defaultScale: 5.0,
        bounds: { width: 1, depth: 0.2, height: 1 },
      },
      // Effects
      {
        id: 'smoke',
        name: 'Smoke',
        type: 'smoke',
        modelPath: 'Smoke.glb',
        icon: '💨',
        defaultScale: 5.0,
        bounds: { width: 0.5, depth: 0.5, height: 1 },
      },
    ],
  },
];

// Castle asset types
export interface CastleAsset {
  id: string;
  type: string;
  packId: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export interface SavedCastleBuild {
  name: string;
  assets: CastleAsset[];
  terrainRadius?: number;
}

// Utility functions for saving/loading builds
export function getSavedCastleBuilds(): Record<string, SavedCastleBuild> {
  try {
    const saved = localStorage.getItem('castleBuilds');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveCastleBuild(name: string, build: SavedCastleBuild): void {
  const builds = getSavedCastleBuilds();
  builds[name] = build;
  localStorage.setItem('castleBuilds', JSON.stringify(builds));
}

export function loadCastleBuild(name: string): SavedCastleBuild | null {
  const builds = getSavedCastleBuilds();
  return builds[name] || null;
}

// Circular Terrain Component - Matches TestWorld building area style
function CircularTerrain({ radius, getTerrainHeight, terrainMeshRef }: { radius: number; getTerrainHeight: (x: number, z: number) => number; terrainMeshRef: React.RefObject<THREE.Mesh> }) {
  // Use same approach as TestWorld building area - circleGeometry with rotation
  useEffect(() => {
    if (terrainMeshRef.current) {
      terrainMeshRef.current.userData.isTerrain = true;
      terrainMeshRef.current.updateMatrix();
    }
  }, [terrainMeshRef]);
  
  return (
    <mesh 
      ref={terrainMeshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow
    >
      <circleGeometry args={[radius, 32]} />
      <meshStandardMaterial 
        color="#4a7c59" 
        roughness={0.9}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Dynamic Ocean Component (simplified)
function DynamicOcean({ radius }: { radius: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });
  
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    waveStrength: { value: 0.5 },
    waveSpeed: { value: 1.0 },
    transparency: { value: 0.7 },
    rippleScale: { value: 1.0 },
    waterColor: { value: new THREE.Color(0.1, 0.3, 0.5) },
    sunDirection: { value: new THREE.Vector3(0, 1, 0) },
  }), []);
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <ringGeometry args={[radius, radius * 2, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Terrain height function - flat circular island (exported for use in components)
// Accepts terrainRadius parameter to match the actual terrain size
export function getTerrainHeight(x: number, z: number, terrainRadius: number = 30): number {
  const distance = Math.sqrt(x * x + z * z);
  if (distance > terrainRadius) return -2; // Water level
  return 0; // Flat terrain
}

// Helper function to check if a position is under a path
function isUnderPath(x: number, z: number, pathAssets: CastleAsset[], pathRadius: number = 1.5): boolean {
  for (const asset of pathAssets) {
    if (asset.packId !== 'pebbles') continue;
    
    // Check merged path tiles
    if (asset.userData?.isMergedPath && asset.userData?.mergedTiles) {
      const mergedTiles: CastleAsset[] = asset.userData.mergedTiles;
      for (const tile of mergedTiles) {
        const distance = Math.sqrt(
          Math.pow(tile.position[0] - x, 2) + 
          Math.pow(tile.position[2] - z, 2)
        );
        
        // Check if grass is within path radius (accounting for asset scale)
        const effectiveRadius = pathRadius * (tile.scale || 1.0);
        if (distance < effectiveRadius) {
          return true;
        }
      }
    } else {
      // Single path tile
      const distance = Math.sqrt(
        Math.pow(asset.position[0] - x, 2) + 
        Math.pow(asset.position[2] - z, 2)
      );
      
      // Check if grass is within path radius (accounting for asset scale)
      const effectiveRadius = pathRadius * (asset.scale || 1.0);
      if (distance < effectiveRadius) {
        return true;
      }
    }
  }
  return false;
}

// Generate grass positions for circular terrain, excluding paths
function generateGrassPositions(
  radius: number, 
  count: number, 
  getTerrainHeightFn: (x: number, z: number) => number,
  pathAssets: CastleAsset[] = []
): Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> {
  const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> = [];
  let attempts = 0;
  const maxAttempts = count * 3; // Allow more attempts to find valid positions
  
  while (positions.length < count && attempts < maxAttempts) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.9; // Keep grass within terrain
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    // Skip if under a path
    if (isUnderPath(x, z, pathAssets)) {
      continue;
    }
    
    const y = getTerrainHeightFn(x, z);
    
    positions.push({
      pos: [x, y, z],
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.4,
      variant: Math.floor(Math.random() * 4),
    });
  }
  
  return positions;
}

export default function CastleBuilder() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Open by default
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string>('kaykit_castle');
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);
  const [castleAssets, setCastleAssets] = useState<CastleAsset[]>([]);
  const [terrainRadius, setTerrainRadius] = useState(30);
  const [eraseMode, setEraseMode] = useState(false);
  const [eraseBrushSize, setEraseBrushSize] = useState(3);
  const [assetScaleMultiplier, setAssetScaleMultiplier] = useState(0.9); // Scale multiplier for medieval village assets
  const [drawPathMode, setDrawPathMode] = useState(false);
  const [pathBrushSize, setPathBrushSize] = useState(2);
  const [pathPoints, setPathPoints] = useState<Array<[number, number, number]>>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);
  const [pathPreviewTiles, setPathPreviewTiles] = useState<CastleAsset[]>([]); // Preview tiles for path drawing
  const [pathPlacedTiles, setPathPlacedTiles] = useState<CastleAsset[]>([]); // Tiles placed during drawing
  const [lastPlacedTilePos, setLastPlacedTilePos] = useState<[number, number, number] | null>(null); // Last placed tile position
  const [pathPreviewPos, setPathPreviewPos] = useState<[number, number, number] | null>(null); // Preview position for path tile
  // Undo/Redo state
  const [history, setHistory] = useState<CastleAsset[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDraggingAsset, setIsDraggingAsset] = useState(false);
  const [isRotatingAsset, setIsRotatingAsset] = useState(false);
  const [activeRotationRingId, setActiveRotationRingId] = useState<string | null>(null);
  const [lastPlacedAssetId, setLastPlacedAssetId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<[number, number, number] | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveBuildName, setSaveBuildName] = useState('');
  const [timeOfDay, setTimeOfDay] = useState(0.5); // 0-1, where 0.5 is noon
  const [sunIntensity, setSunIntensity] = useState(1.0);
  const [toolsSidebarOpen, setToolsSidebarOpen] = useState(false);
  const terrainMeshRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  
  const selectedPack = BUILDING_ASSET_PACKS.find(p => p.id === selectedPackId);
  const availableAssets = selectedPack?.assets || [];
  
  // Terrain height function for this component
  const getTerrainHeightLocal = useCallback((x: number, z: number) => {
    return getTerrainHeight(x, z, terrainRadius);
  }, [terrainRadius]);
  
  // Determine which rock path variant to use based on brush size
  const getPathAssetType = useCallback((brushSize: number): string => {
    if (brushSize <= 1.5) {
      return 'RockPath_Square_Small_1';
    } else if (brushSize <= 2.5) {
      return 'RockPath_Square_Small_2';
    } else if (brushSize <= 3.5) {
      return 'RockPath_Square_Thin';
    } else {
      return 'RockPath_Square_Wide';
    }
  }, []);
  
  const currentPathAssetType = getPathAssetType(pathBrushSize);
  
  // Generate grass positions, excluding paths
  const pathAssets = useMemo(() => castleAssets.filter(asset => asset.packId === 'pebbles'), [castleAssets]);
  const grassPositions = useMemo(() => 
    generateGrassPositions(terrainRadius, 500, getTerrainHeightLocal, pathAssets), 
    [terrainRadius, getTerrainHeightLocal, pathAssets]
  );
  
  // Arrow key movement for last placed asset
  useEffect(() => {
    if (!lastPlacedAssetId) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const asset = castleAssets.find(a => a.id === lastPlacedAssetId);
      if (!asset) return;
      
      const moveSpeed = 0.5; // Grid snap size
      let newX = asset.position[0];
      let newZ = asset.position[2];
      
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        newZ -= moveSpeed;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        newZ += moveSpeed;
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        newX -= moveSpeed;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        newX += moveSpeed;
      } else {
        return;
      }
      
      e.preventDefault();
      
      // Snap to grid
      const snappedX = Math.round(newX * 2) / 2;
      const snappedZ = Math.round(newZ * 2) / 2;
      const terrainY = getTerrainHeightLocal(snappedX, snappedZ);
      
      setCastleAssets(prev => prev.map(a => 
        a.id === lastPlacedAssetId 
          ? { ...a, position: [snappedX, terrainY, snappedZ] }
          : a
      ));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastPlacedAssetId, castleAssets, getTerrainHeightLocal]);
  
  // Helper function to add to history for undo/redo - must be defined before use
  const addToHistory = useCallback((newAssets: CastleAsset[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newAssets);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);
  
  const handlePlaceAsset = useCallback((asset: CastleAsset) => {
    setCastleAssets(prev => {
      const newAssets = [...prev, asset];
      addToHistory(newAssets);
      return newAssets;
    });
    setSelectedAssetType(null); // Deselect after placing
    setLastPlacedAssetId(asset.id); // Track last placed asset for arrow key movement
  }, [addToHistory]);
  
  const handleDeleteAsset = useCallback((id: string) => {
    setCastleAssets(prev => {
      const newAssets = prev.filter(a => a.id !== id);
      addToHistory(newAssets);
      return newAssets;
    });
    setSelectedAsset(null);
  }, [addToHistory]);
  
  const handleEraseAsset = useCallback((id: string) => {
    handleDeleteAsset(id);
  }, [handleDeleteAsset]);

  // Helper function to generate tiles between two points (used for preview and final placement)
  const generateTilesBetweenPoints = useCallback((
    start: [number, number, number],
    end: [number, number, number],
    pathBrushSize: number,
    getTerrainHeightLocal: (x: number, z: number) => number,
    isPreview: boolean = false
  ): CastleAsset[] => {
    // Determine which rock path variant to use based on brush size
    let assetType = 'RockPath_Square_Small_1';
    let useGrid = false;
    
    if (pathBrushSize <= 1.5) {
      assetType = 'RockPath_Square_Small_1';
      useGrid = false;
    } else if (pathBrushSize <= 2.5) {
      assetType = 'RockPath_Square_Small_2';
      useGrid = true; // 4x4 grid
    } else if (pathBrushSize <= 3.5) {
      assetType = 'RockPath_Square_Thin';
      useGrid = false;
    } else {
      assetType = 'RockPath_Square_Wide';
      useGrid = false;
    }
    
    // Calculate tile size - reduce spacing to eliminate gaps
    let tileWidth = pathBrushSize;
    // Tighter spacing for edge-to-edge connection (0.75 = 75% of tile width)
    const spacing = tileWidth * 0.75;
    
    const tiles: CastleAsset[] = [];
    const distance = Math.sqrt(
      Math.pow(end[0] - start[0], 2) + 
      Math.pow(end[2] - start[2], 2)
    );
    
    if (distance < 0.1) return tiles; // Too close, skip
    // Calculate direction for rotation - consistent for entire segment
    const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
    
    // Calculate number of tiles needed to cover the distance
    const numTiles = Math.max(1, Math.ceil(distance / spacing));
    
    // Place tiles along the path with exact spacing
    for (let j = 0; j < numTiles; j++) {
      // Calculate position along path using exact spacing
      const t = (j * spacing) / distance;
      const clampedT = Math.min(t, 1.0);
      
      const x = start[0] + (end[0] - start[0]) * clampedT;
      const z = start[2] + (end[2] - start[2]) * clampedT;
      const y = getTerrainHeightLocal(x, z);
      
      if (useGrid && pathBrushSize <= 2.5) {
        const gridSize = 4;
        const gridSpacing = pathBrushSize / gridSize;
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const gridX = (col - (gridSize - 1) / 2) * gridSpacing;
            const gridZ = (row - (gridSize - 1) / 2) * gridSpacing;
            
            const rotatedX = x + gridX * Math.cos(angle) - gridZ * Math.sin(angle);
            const rotatedZ = z + gridX * Math.sin(angle) + gridZ * Math.cos(angle);
            const gridY = getTerrainHeightLocal(rotatedX, rotatedZ);
            
            tiles.push({
              id: `${isPreview ? 'preview' : 'final'}-${j}-${row}-${col}-${Math.random()}`,
              type: assetType,
              packId: 'pebbles',
              position: [rotatedX, gridY, rotatedZ],
              rotation: angle,
              scale: 1.0,
            });
          }
        }
      } else {
        tiles.push({
          id: `${isPreview ? 'preview' : 'final'}-${j}-${Math.random()}`,
          type: assetType,
          packId: 'pebbles',
          position: [x, y, z],
          rotation: angle,
          scale: 1.0,
        });
      }
    }
    
    // Always place a tile at the end point to ensure connection
    const endY = getTerrainHeightLocal(end[0], end[2]);
    if (useGrid && pathBrushSize <= 2.5) {
      const gridSize = 4;
      const gridSpacing = pathBrushSize / gridSize;
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const gridX = (col - (gridSize - 1) / 2) * gridSpacing;
          const gridZ = (row - (gridSize - 1) / 2) * gridSpacing;
          
          const rotatedX = end[0] + gridX * Math.cos(angle) - gridZ * Math.sin(angle);
          const rotatedZ = end[2] + gridX * Math.sin(angle) + gridZ * Math.cos(angle);
          const gridY = getTerrainHeightLocal(rotatedX, rotatedZ);
          
          tiles.push({
            id: `${isPreview ? 'preview' : 'final'}-end-${row}-${col}-${Math.random()}`,
            type: assetType,
            packId: 'pebbles',
            position: [rotatedX, gridY, rotatedZ],
            rotation: angle,
            scale: 1.0,
          });
        }
      }
    } else {
      tiles.push({
        id: `${isPreview ? 'preview' : 'final'}-end-${Math.random()}`,
        type: assetType,
        packId: 'pebbles',
        position: [end[0], endY, end[2]],
        rotation: angle,
        scale: 1.0,
      });
    }
    
    return tiles;
  }, []);
  
  // Merge tiles into a single mesh
  const mergeTilesIntoMesh = useCallback((tiles: CastleAsset[]): CastleAsset => {
    // Create a single merged asset representing all tiles
    const mergedId = `path-merged-${Date.now()}`;
    return {
      id: mergedId,
      type: 'RockPath_Square_Small_1', // Use first tile type as base
      packId: 'pebbles',
      position: tiles.length > 0 ? tiles[0].position : [0, 0, 0],
      rotation: 0,
      scale: 1.0,
      userData: {
        isMergedPath: true,
        mergedTiles: tiles, // Store original tiles for rendering
      },
    };
  }, []);

  // Place pebbles along the drawn path - merge into single mesh
  const placePebblesOnPath = useCallback(() => {
    if (pathPlacedTiles.length === 0) return;
    
    // Merge all placed tiles into a single mesh asset
    const mergedAsset = mergeTilesIntoMesh(pathPlacedTiles);
    
    // Add merged asset
    setCastleAssets(prev => {
      const newAssets = [...prev, mergedAsset];
      addToHistory(newAssets);
      return newAssets;
    });
    
    // Reset path drawing state
    setPathPoints([]);
    setIsDrawingPath(false);
    setDrawPathMode(false);
    setPathPreviewTiles([]);
    setPathPlacedTiles([]);
    setLastPlacedTilePos(null);
  }, [pathPlacedTiles, mergeTilesIntoMesh, addToHistory]);
  
  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCastleAssets(history[newIndex]);
    }
  }, [historyIndex, history]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCastleAssets(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleSaveBuild = useCallback(() => {
    setShowSaveModal(true);
  }, []);
  
  const handleConfirmSave = useCallback(() => {
    if (saveBuildName.trim()) {
      saveCastleBuild(saveBuildName.trim(), {
        name: saveBuildName.trim(),
        assets: castleAssets,
        terrainRadius,
      });
      setSaveBuildName('');
      setShowSaveModal(false);
    }
  }, [saveBuildName, castleAssets, terrainRadius]);
  
  const handleLoadBuild = useCallback(() => {
    setShowLoadModal(true);
  }, []);
  
  const handleSelectBuild = useCallback((buildName: string) => {
    const builds = getSavedCastleBuilds();
    const build = builds[buildName];
    if (build) {
      setCastleAssets(build.assets);
      if (build.terrainRadius) setTerrainRadius(build.terrainRadius);
      setShowLoadModal(false);
    }
  }, []);
  
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 p-2 bg-slate-900/90 backdrop-blur border-b-2 border-slate-700 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold">Castle Builder</h1>
        </div>
        <button
          onClick={() => navigate('/menu')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold"
        >
          Back to Menu
        </button>
      </div>
      
      {/* Left Sidebar - Assets */}
      {sidebarOpen && (
        <div className={`fixed left-0 top-14 bottom-0 bg-slate-800 border-r border-slate-700 z-20 overflow-y-auto transition-all ${leftPanelMinimized ? 'w-12' : 'w-64'}`}>
          {leftPanelMinimized ? (
            <div className="p-2 flex flex-col items-center">
              <button
                onClick={() => setLeftPanelMinimized(false)}
                className="text-slate-400 hover:text-white p-2"
                title="Expand sidebar"
              >
                ◀
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Castle Builder</h2>
                <button
                  onClick={() => setLeftPanelMinimized(true)}
                  className="text-slate-400 hover:text-white"
                  title="Minimize sidebar"
                >
                  ▼
                </button>
              </div>
              
              <>
                <div>
                  <label className="text-sm font-bold mb-2 block">Asset Pack</label>
                  <select
                    value={selectedPackId}
                    onChange={(e) => {
                      setSelectedPackId(e.target.value);
                      setSelectedAssetType(null); // Clear selection when switching packs
                    }}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                  >
                    {BUILDING_ASSET_PACKS.map(pack => (
                      <option key={pack.id} value={pack.id}>{pack.name}</option>
                    ))}
                  </select>
                  {selectedPack && (
                    <p className="text-xs text-slate-400 mt-1">{selectedPack.description}</p>
                  )}
                </div>
                
                {selectedPackId === 'medieval_village' && (
                  <div className="mb-3 p-3 bg-slate-800 rounded border border-slate-600">
                    <label className="text-xs text-slate-300 font-bold block mb-2">
                      Pack Scale: {assetScaleMultiplier.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={assetScaleMultiplier}
                      onChange={(e) => setAssetScaleMultiplier(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0.5x</span>
                      <span>5.0x</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Scales all assets in this pack</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-bold mb-2">Assets</h3>
                  <div className="space-y-1">
                    {availableAssets.map(asset => (
                      <button
                        key={asset.id}
                        onClick={() => {
                          setSelectedAssetType(eraseMode ? null : asset.type);
                          setEraseMode(false);
                        }}
                        className={`w-full p-2 rounded text-left text-sm ${selectedAssetType === asset.type ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                      >
                        <span className="mr-2">{asset.icon}</span>
                        {asset.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-700 space-y-2">
                  <button
                    onClick={() => {
                      setDrawPathMode(!drawPathMode);
                      setEraseMode(false);
                      setSelectedAssetType(null);
                      if (!drawPathMode) {
                        setPathPoints([]);
                        setIsDrawingPath(false);
                      }
                    }}
                    className={`w-full p-2 rounded font-bold text-sm ${drawPathMode ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    <PenTool size={16} className="inline mr-2" />
                    {drawPathMode ? 'Draw Path ON' : 'Draw Path'}
                  </button>
                  {drawPathMode && (
                    <div className="mt-2 p-2 bg-slate-800 rounded">
                      <label className="text-xs text-slate-300 block mb-1">
                        Path Brush Size: {pathBrushSize.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={pathBrushSize}
                        onChange={(e) => setPathBrushSize(Number(e.target.value))}
                        className="w-full"
                      />
                      {pathPlacedTiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <button
                            onClick={placePebblesOnPath}
                            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold"
                          >
                            ✓ Confirm Path ({pathPlacedTiles.length} tiles)
                          </button>
                          <button
                            onClick={() => {
                              setPathPoints([]);
                              setIsDrawingPath(false);
                              setPathPlacedTiles([]);
                              setLastPlacedTilePos(null);
                              setPathPreviewPos(null);
                            }}
                            className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs font-bold"
                          >
                            ✗ Clear Path
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setEraseMode(!eraseMode);
                      setDrawPathMode(false);
                      setSelectedAssetType(null);
                    }}
                    className={`w-full p-2 rounded font-bold text-sm ${eraseMode ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    <Eraser size={16} className="inline mr-2" />
                    {eraseMode ? 'Erase Mode ON' : 'Erase Mode'}
                  </button>
                  {eraseMode && (
                    <div className="mt-2">
                      <label className="text-xs text-slate-400 block mb-1">
                        Brush Size: {eraseBrushSize}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={eraseBrushSize}
                        onChange={(e) => setEraseBrushSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t border-slate-700">
                  <label className="text-sm font-bold mb-2 block">Build Area</label>
                  <label className="text-xs text-slate-400 block mb-1">
                    Terrain Radius: {terrainRadius}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={terrainRadius}
                    onChange={(e) => setTerrainRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="pt-2 border-t border-slate-700 space-y-2">
                  <button
                    onClick={handleSaveBuild}
                    className="w-full p-2 bg-green-600 hover:bg-green-700 rounded font-bold text-sm"
                  >
                    <Save size={16} className="inline mr-2" />
                    Save Build
                  </button>
                  <button
                    onClick={handleLoadBuild}
                    className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-sm"
                  >
                    <Download size={16} className="inline mr-2" />
                    Load Build
                  </button>
                </div>
                
                {/* Save Build Modal */}
                {showSaveModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
                    <div className="bg-slate-800 border-2 border-slate-600 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Save Build</h3>
                        <button
                          onClick={() => {
                            setShowSaveModal(false);
                            setSaveBuildName('');
                          }}
                          className="text-slate-400 hover:text-white text-xl"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Build Name</label>
                          <input
                            type="text"
                            value={saveBuildName}
                            onChange={(e) => setSaveBuildName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmSave();
                              if (e.key === 'Escape') {
                                setShowSaveModal(false);
                                setSaveBuildName('');
                              }
                            }}
                            placeholder="Enter build name..."
                            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmSave}
                            disabled={!saveBuildName.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowSaveModal(false);
                              setSaveBuildName('');
                            }}
                            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Load Build Modal */}
                {showLoadModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLoadModal(false)}>
                    <div className="bg-slate-800 border-2 border-slate-600 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Load Saved Build</h3>
                        <button
                          onClick={() => setShowLoadModal(false)}
                          className="text-slate-400 hover:text-white text-xl"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.keys(getSavedCastleBuilds()).length === 0 ? (
                          <p className="text-slate-400 text-sm">No saved builds found.</p>
                        ) : (
                          Object.keys(getSavedCastleBuilds()).map((buildName) => {
                            const build = getSavedCastleBuilds()[buildName];
                            return (
                              <button
                                key={buildName}
                                onClick={() => handleSelectBuild(buildName)}
                                className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded text-left transition-colors"
                              >
                                <div className="font-bold text-white">{buildName}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {build.assets?.length || 0} assets
                                  {build.terrainRadius && ` • Radius: ${build.terrainRadius}`}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedAsset && (
                  <div className="pt-2 border-t border-slate-700">
                    <h4 className="text-sm font-bold mb-2">Selected Asset</h4>
                    <button
                      onClick={() => handleDeleteAsset(selectedAsset)}
                      className="w-full p-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </>
            </div>
          )}
        </div>
      )}
      
      {/* Right Sidebar - Tools */}
      {toolsSidebarOpen && (
        <div className="fixed right-0 top-14 bottom-0 w-64 bg-slate-800 border-l border-slate-700 z-20 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Tools</h2>
              <button
                onClick={() => setToolsSidebarOpen(false)}
                className="text-slate-400 hover:text-white"
                title="Close tools"
              >
                ×
              </button>
            </div>
            
            {/* Time of Day */}
            <div className="pt-2 border-t border-slate-700">
              <label className="text-sm font-bold mb-2 block">Time of Day</label>
              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">
                  Time: <span className="text-white">{(timeOfDay * 24).toFixed(1)}h</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {timeOfDay < 0.25 ? 'Night' : timeOfDay < 0.35 ? 'Sunrise' : timeOfDay < 0.65 ? 'Day' : timeOfDay < 0.75 ? 'Sunset' : 'Night'}
                </p>
              </div>
            </div>
            
            {/* Sun Intensity */}
            <div className="pt-2 border-t border-slate-700">
              <label className="text-sm font-bold mb-2 block">Sun Intensity</label>
              <div className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">
                  Intensity: <span className="text-white">{sunIntensity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={sunIntensity}
                  onChange={(e) => setSunIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tools button - show when tools sidebar is closed */}
      {!toolsSidebarOpen && (
        <button
          onClick={() => setToolsSidebarOpen(true)}
          className="fixed right-4 top-20 z-30 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 shadow-lg"
          title="Open Tools"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
      
      {/* Canvas */}
      <div className="flex-1 mt-14">
        <Canvas camera={{ position: [50, 40, 50], fov: 60 }} shadows>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[
              Math.cos((timeOfDay - 0.25) * Math.PI * 2) * 100,
              Math.sin((timeOfDay - 0.25) * Math.PI * 2) * 100,
              25
            ]}
            intensity={timeOfDay >= 0.25 && timeOfDay <= 0.75
              ? sunIntensity * 1.0 // Day - stable full intensity
              : sunIntensity * 0.3 // Night - stable dim intensity
            }
            color={timeOfDay < 0.2 || timeOfDay > 0.8 ? '#ff9944' : '#ffffff'}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
          />
          <Sky sunPosition={[
            Math.cos((timeOfDay - 0.25) * Math.PI * 2) * 100,
            Math.sin((timeOfDay - 0.25) * Math.PI * 2) * 100,
            20
          ]} />
          <Environment preset="sunset" />
          
          <OrbitControls
            ref={controlsRef}
            enablePan={!isDraggingAsset && !isRotatingAsset}
            enableZoom={!isDraggingAsset && !isRotatingAsset}
            enableRotate={!isDraggingAsset && !isRotatingAsset}
            touches={{
              ONE: 0, // One finger rotates
              TWO: 1, // Two fingers pan/zoom
            }}
            mouseButtons={{
              LEFT: 0, // Left mouse button rotates
              MIDDLE: 1, // Middle mouse button pans
              RIGHT: 2, // Right mouse button zooms
            }}
          />
          
          {/* Terrain - render first */}
          <CircularTerrain radius={terrainRadius} getTerrainHeight={getTerrainHeightLocal} terrainMeshRef={terrainMeshRef} />
          
          {/* Instanced Grass */}
          <InstancedGrass grass={grassPositions} castShadow receiveShadow={false} />
          
          {/* Ocean removed - floating island, no water */}
          
          {/* Volumetric Fog removed per user request */}

          {/* Erase brush indicator */}
          {eraseMode && (
            <EraseIndicator
              eraseBrushSize={eraseBrushSize}
              getTerrainHeight={getTerrainHeightLocal}
            />
          )}
          
          {/* Ground click handler for placing/erasing assets */}
          <GroundClickHandler
            selectedAssetType={selectedAssetType}
            selectedPackId={selectedPackId}
            eraseMode={eraseMode}
            eraseBrushSize={eraseBrushSize}
            castleAssets={castleAssets}
            onPlaceAsset={handlePlaceAsset}
            onEraseAsset={handleEraseAsset}
            getTerrainHeight={getTerrainHeightLocal}
            terrainMeshRef={terrainMeshRef}
            assetScaleMultiplier={assetScaleMultiplier}
            setPreviewPosition={setPreviewPosition}
            drawPathMode={drawPathMode}
            pathBrushSize={pathBrushSize}
            pathPoints={pathPoints}
            setPathPoints={setPathPoints}
            setIsDrawingPath={setIsDrawingPath}
            generateTilesBetweenPoints={generateTilesBetweenPoints}
            getTerrainHeightLocal={getTerrainHeightLocal}
            setPathPreviewTiles={setPathPreviewTiles}
            pathPreviewPos={pathPreviewPos}
            setPathPreviewPos={setPathPreviewPos}
            currentPathAssetType={currentPathAssetType}
            pathPlacedTiles={pathPlacedTiles}
            setPathPlacedTiles={setPathPlacedTiles}
            setLastPlacedTilePos={setLastPlacedTilePos}
            isDrawingPath={isDrawingPath}
            lastPlacedTilePos={lastPlacedTilePos}
          />
          
          {/* Ghost preview of selected asset */}
          {selectedAssetType && previewPosition && !eraseMode && (
            <Suspense fallback={null}>
              <GhostCastleAsset
                assetType={selectedAssetType}
                packId={selectedPackId}
                position={previewPosition}
                scaleMultiplier={assetScaleMultiplier}
              />
            </Suspense>
          )}
          
          {/* Player Character for Scale Reference - Optional, won't crash if model fails */}
          <Suspense fallback={null}>
            <PlayerCharacter position={[0, getTerrainHeightLocal(0, 0), 0]} />
          </Suspense>
          
          {/* Ghost preview of path tile - hide if hovering over existing tile */}
          {drawPathMode && pathPreviewPos && (() => {
            // Check if preview position is too close to any existing tile
            const isOverExistingTile = pathPlacedTiles.some(tile => {
              const distance = Math.sqrt(
                Math.pow(tile.position[0] - pathPreviewPos[0], 2) +
                Math.pow(tile.position[2] - pathPreviewPos[2], 2)
              );
              return distance < 0.5; // Same threshold as click detection
            });
            
            if (isOverExistingTile) return null;
            
            return (
              <Suspense fallback={null}>
                <PathTileGhost
                  assetType={currentPathAssetType}
                  position={pathPreviewPos}
                  rotation={lastPlacedTilePos ? Math.atan2(
                    pathPreviewPos[2] - lastPlacedTilePos[2],
                    pathPreviewPos[0] - lastPlacedTilePos[0]
                  ) : 0}
                />
              </Suspense>
            );
          })()}
          
          {/* Render placed tiles during drawing - use CastleAssetModel for selection/rotation */}
          {pathPlacedTiles.map(asset => {
            const modelPathMap: Record<string, string> = {
              'RockPath_Square_Small_1': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_1.gltf',
              'RockPath_Square_Small_2': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_2.gltf',
              'RockPath_Square_Thin': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Thin.gltf',
              'RockPath_Square_Wide': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Wide.gltf',
            };
            
            const modelPath = modelPathMap[asset.type] || modelPathMap['RockPath_Square_Small_1'];
            
            return (
              <Suspense key={asset.id} fallback={null}>
                <CastleAssetModel
                  asset={asset}
                  modelPath={modelPath}
                  isSelected={selectedAsset === asset.id}
                  isRotationActive={activeRotationRingId === asset.id}
                  isLastPlaced={lastPlacedAssetId === asset.id}
                  onSelect={() => {
                    setSelectedAsset(asset.id);
                    setActiveRotationRingId(asset.id);
                    setLastPlacedAssetId(asset.id);
                  }}
                  onDragStart={(pos) => {
                    setIsDraggingAsset(true);
                    setDragStartPos(pos);
                  }}
                  onDragEnd={() => {
                    setIsDraggingAsset(false);
                    setDragStartPos(null);
                  }}
                  onRotationStart={() => setIsRotatingAsset(true)}
                  onRotationEnd={() => setIsRotatingAsset(false)}
                  onUpdate={(updates) => {
                    // Update the tile in pathPlacedTiles
                    setPathPlacedTiles(prev => prev.map(a => 
                      a.id === asset.id ? { ...a, ...updates } : a
                    ));
                  }}
                  getTerrainHeight={getTerrainHeightLocal}
                />
              </Suspense>
            );
          })}
          
          {/* Render placed assets */}
          {castleAssets.map(asset => {
            // Handle pebble assets separately
            if (asset.packId === 'pebbles') {
              // Check if this is a merged path asset
              if (asset.userData?.isMergedPath && asset.userData?.mergedTiles) {
                // Render all tiles in the merged path
                const mergedTiles: CastleAsset[] = asset.userData.mergedTiles;
                return (
                  <group key={asset.id}>
                    {mergedTiles.map((tile, index) => {
                      const modelPathMap: Record<string, string> = {
                        'RockPath_Square_Small_1': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_1.gltf',
                        'RockPath_Square_Small_2': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_2.gltf',
                        'RockPath_Square_Thin': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Thin.gltf',
                        'RockPath_Square_Wide': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Wide.gltf',
                      };
                      
                      const modelPath = modelPathMap[tile.type] || modelPathMap['RockPath_Square_Small_1'];
                      
                      return (
                        <Suspense key={`${asset.id}-tile-${index}`} fallback={null}>
                          <PebbleModel asset={tile} modelPath={modelPath} />
                        </Suspense>
                      );
                    })}
                  </group>
                );
              }
              
              // Single pebble asset
              const modelPathMap: Record<string, string> = {
                'RockPath_Square_Small_1': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_1.gltf',
                'RockPath_Square_Small_2': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_2.gltf',
                'RockPath_Square_Thin': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Thin.gltf',
                'RockPath_Square_Wide': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Wide.gltf',
              };
              
              const modelPath = modelPathMap[asset.type] || modelPathMap['RockPath_Square_Small_1'];
              
              return (
                <Suspense key={asset.id} fallback={null}>
                  <group position={asset.position} rotation={[0, asset.rotation, 0]} scale={asset.scale}>
                    <PebbleModel asset={asset} modelPath={modelPath} />
                  </group>
                </Suspense>
              );
            }
            
            const pack = BUILDING_ASSET_PACKS.find(p => p.id === asset.packId);
            const assetDef = pack?.assets.find(a => a.type === asset.type);
            if (!assetDef) return null;
            
            const modelPath = `${pack.basePath}${assetDef.modelPath}`;
            return (
              <Suspense key={asset.id} fallback={null}>
                <CastleAssetModel
                  asset={asset}
                  modelPath={modelPath}
                  isSelected={selectedAsset === asset.id}
                  isRotationActive={activeRotationRingId === asset.id}
                  isLastPlaced={lastPlacedAssetId === asset.id}
                  onSelect={() => {
                    setSelectedAsset(asset.id);
                    setActiveRotationRingId(asset.id);
                    setLastPlacedAssetId(asset.id); // Make selected asset the last placed for arrow keys
                  }}
                  onDragStart={(pos) => {
                    setIsDraggingAsset(true);
                    setDragStartPos(pos);
                  }}
                  onDragEnd={() => {
                    setIsDraggingAsset(false);
                    setDragStartPos(null);
                  }}
                  onRotationStart={() => setIsRotatingAsset(true)}
                  onRotationEnd={() => setIsRotatingAsset(false)}
                  onUpdate={(updates) => {
                    setCastleAssets(prev => prev.map(a => 
                      a.id === asset.id ? { ...a, ...updates } : a
                    ));
                  }}
                  getTerrainHeight={getTerrainHeightLocal}
                />
              </Suspense>
            );
          })}
          
          {/* Deselect rotation ring when clicking empty space */}
          <mesh
            visible={false}
            onClick={() => {
              setActiveRotationRingId(null);
              setSelectedAsset(null);
            }}
          >
            <planeGeometry args={[1000, 1000]} />
          </mesh>
        </Canvas>
        
        {/* UI hint for arrow key movement - MUST be outside Canvas */}
        {lastPlacedAssetId && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white px-4 py-2 rounded text-sm z-50">
            Use Arrow Keys or WASD to move last placed asset
          </div>
        )}
      </div>
    </div>
  );
}

// Pebble Model Component - Simple rendering for path pebbles
function PebbleModel({
  asset,
  modelPath,
}: {
  asset: CastleAsset;
  modelPath: string;
}) {
  // Try to load GLTF model, fallback to geometry if it fails
  let scene: THREE.Object3D | null = null;
  try {
    const gltf = useGLTF(modelPath);
    scene = gltf?.scene || null;
  } catch (error) {
    // Silently fallback - models may not exist in GLTF format
    scene = null;
  }
  
  // Determine tile dimensions based on asset type
  let tileWidth = 1.0;
  let tileDepth = 1.0;
  let tileHeight = 0.1;
  
  if (asset.type === 'RockPath_Square_Thin') {
    tileWidth = 1.5;
    tileDepth = 0.4;
  } else if (asset.type === 'RockPath_Square_Wide') {
    tileWidth = 2.0;
    tileDepth = 0.6;
  } else {
    // Small_1 and Small_2
    tileWidth = 0.8;
    tileDepth = 0.8;
  }
  
  // Scale by asset scale
  tileWidth *= asset.scale;
  tileDepth *= asset.scale;
  tileHeight *= asset.scale;
  
  // Fallback: create path tile geometry if model fails to load
  if (!scene) {
    return (
      <mesh 
        position={asset.position} 
        rotation={[0, asset.rotation, 0]}
        scale={1.0}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[tileWidth, tileHeight, tileDepth]} />
        <meshStandardMaterial 
          color="#666666" 
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
    );
  }
  
  const clonedScene = useMemo(() => scene!.clone(), [scene]);
  return (
    <group 
      position={asset.position} 
      rotation={[0, asset.rotation, 0]}
      scale={asset.scale}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Ground click handler for placing/erasing assets
function GroundClickHandler({
  selectedAssetType,
  selectedPackId,
  eraseMode,
  eraseBrushSize,
  castleAssets,
  onPlaceAsset,
  onEraseAsset,
  getTerrainHeight,
  terrainMeshRef,
  setPreviewPosition,
  assetScaleMultiplier,
  drawPathMode,
  pathBrushSize,
  pathPoints,
  setPathPoints,
  setIsDrawingPath,
  generateTilesBetweenPoints,
  getTerrainHeightLocal,
  setPathPreviewTiles,
  pathPreviewPos,
  setPathPreviewPos,
  currentPathAssetType,
  pathPlacedTiles,
  setPathPlacedTiles,
  setLastPlacedTilePos,
  isDrawingPath,
  lastPlacedTilePos,
}: {
  selectedAssetType: string | null;
  selectedPackId: string;
  eraseMode: boolean;
  eraseBrushSize: number;
  castleAssets: CastleAsset[];
  onPlaceAsset: (asset: CastleAsset) => void;
  onEraseAsset: (id: string) => void;
  getTerrainHeight: (x: number, z: number) => number;
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  setPreviewPosition: (pos: [number, number, number] | null) => void;
  assetScaleMultiplier: number;
  drawPathMode: boolean;
  pathBrushSize: number;
  pathPoints: Array<[number, number, number]>;
  setPathPoints: React.Dispatch<React.SetStateAction<Array<[number, number, number]>>>;
  setIsDrawingPath: React.Dispatch<React.SetStateAction<boolean>>;
  generateTilesBetweenPoints: (
    start: [number, number, number],
    end: [number, number, number],
    pathBrushSize: number,
    getTerrainHeight: (x: number, z: number) => number,
    isPreview: boolean
  ) => CastleAsset[];
  getTerrainHeightLocal: (x: number, z: number) => number;
  setPathPreviewTiles: React.Dispatch<React.SetStateAction<CastleAsset[]>>;
  pathPreviewPos: [number, number, number] | null;
  setPathPreviewPos: React.Dispatch<React.SetStateAction<[number, number, number] | null>>;
  currentPathAssetType: string;
  pathPlacedTiles: CastleAsset[];
  setPathPlacedTiles: React.Dispatch<React.SetStateAction<CastleAsset[]>>;
  setLastPlacedTilePos: React.Dispatch<React.SetStateAction<[number, number, number] | null>>;
  isDrawingPath: boolean;
  lastPlacedTilePos: [number, number, number] | null;
}) {
  const { camera, raycaster, pointer, scene } = useThree();
  
  // Update preview position on mouse move
  useEffect(() => {
    if (!selectedAssetType || eraseMode) {
      setPreviewPosition(null);
      return;
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') {
        setPreviewPosition(null);
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(pointer, camera);
      
      const terrainMesh = terrainMeshRef.current || scene.children.find(
        (child) => child.type === 'Mesh' && child.userData?.isTerrain
      );
      
      if (!terrainMesh) {
        setPreviewPosition(null);
        return;
      }
      
      const intersects = raycaster.intersectObject(terrainMesh, false);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const terrainY = getTerrainHeight(point.x, point.z);
        const snappedX = Math.round(point.x * 2) / 2;
        const snappedZ = Math.round(point.z * 2) / 2;
        setPreviewPosition([snappedX, terrainY, snappedZ]);
      } else {
        setPreviewPosition(null);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [selectedAssetType, eraseMode, camera, raycaster, pointer, scene, getTerrainHeight, terrainMeshRef, setPreviewPosition]);
  
  // Update ghost preview position for path tiles (like regular asset placement)
  useEffect(() => {
    if (!drawPathMode) {
      setPathPreviewPos(null);
      return;
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') {
        setPathPreviewPos(null);
        return;
      }
      
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(pointer, camera);
      
      const terrainMesh = terrainMeshRef.current || scene.children.find(
        (child) => child.type === 'Mesh' && child.userData?.isTerrain
      );
      
      if (!terrainMesh) {
        setPathPreviewPos(null);
        return;
      }
      
      const intersects = raycaster.intersectObject(terrainMesh, false);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        // Snap to same grid as regular asset placement for consistency
        const snappedX = Math.round(point.x * 2) / 2;
        const snappedZ = Math.round(point.z * 2) / 2;
        const terrainY = getTerrainHeight(snappedX, snappedZ);
        setPathPreviewPos([snappedX, terrainY, snappedZ]);
      } else {
        setPathPreviewPos(null);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [drawPathMode, camera, raycaster, pointer, scene, getTerrainHeight, terrainMeshRef, setPathPreviewPos]);
  
  // Handle clicks for placing/erasing/path drawing
  useEffect(() => {
    if (!selectedAssetType && !eraseMode && !drawPathMode) return;
    
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('input')) {
        return;
      }
      
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') return;
      
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(pointer, camera);
      
      const terrainMesh = terrainMeshRef.current || scene.children.find(
        (child) => child.type === 'Mesh' && child.userData?.isTerrain
      );
      
      if (!terrainMesh) return;
      
      const intersects = raycaster.intersectObject(terrainMesh, false);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        if (drawPathMode) {
          // Check if we clicked on an existing path tile (select it instead of placing new one)
          let clickedOnTile = false;
          for (const tile of pathPlacedTiles) {
            const distance = Math.sqrt(
              Math.pow(tile.position[0] - point.x, 2) +
              Math.pow(tile.position[2] - point.z, 2)
            );
            // If click is within 0.5 units of a tile, select it
            if (distance < 0.5) {
              clickedOnTile = true;
              // Selection is handled by CastleAssetModel's onClick
              break;
            }
          }
          
          // Only place new tile if we didn't click on an existing one
          if (!clickedOnTile) {
            // Place a single path tile on click (like normal asset placement)
            // Use exact same calculation as ghost preview for alignment
            const snappedX = Math.round(point.x * 2) / 2;
            const snappedZ = Math.round(point.z * 2) / 2;
            const terrainY = getTerrainHeight(snappedX, snappedZ);
            const tilePos: [number, number, number] = [snappedX, terrainY, snappedZ];
            
            // Calculate rotation based on last placed tile (if exists)
            let rotation = 0;
            if (lastPlacedTilePos) {
              rotation = Math.atan2(
                tilePos[2] - lastPlacedTilePos[2],
                tilePos[0] - lastPlacedTilePos[0]
              );
            }
            
            const newTile: CastleAsset = {
              id: `path-tile-${Date.now()}-${Math.random()}`,
              type: currentPathAssetType,
              packId: 'pebbles',
              position: tilePos,
              rotation: rotation,
              scale: 1.0,
            };
            
            // Add tile to placed tiles
            setPathPlacedTiles(prev => [...prev, newTile]);
            setLastPlacedTilePos(tilePos);
            
            // Mark that we've started drawing
            if (!isDrawingPath) {
              setIsDrawingPath(true);
            }
          }
        } else if (eraseMode) {
          // Erase assets within brush radius
          const assetsToErase: string[] = [];
          for (const asset of castleAssets) {
            const distance = Math.sqrt(
              Math.pow(asset.position[0] - point.x, 2) +
              Math.pow(asset.position[2] - point.z, 2)
            );
            if (distance < eraseBrushSize) {
              assetsToErase.push(asset.id);
            }
          }
          assetsToErase.forEach(id => onEraseAsset(id));
        } else if (selectedAssetType && !drawPathMode) {
          // Place new asset
          // Snap to grid
          const snappedX = Math.round(point.x * 2) / 2;
          const snappedZ = Math.round(point.z * 2) / 2;
          const terrainY = getTerrainHeight(snappedX, snappedZ);
          
          const pack = BUILDING_ASSET_PACKS.find(p => p.id === selectedPackId);
          const assetDef = pack?.assets.find(a => a.type === selectedAssetType);
          if (!assetDef) return;
          
          // Apply scale multiplier for medieval village pack, otherwise use default scale
          const baseScale = assetDef.defaultScale || 6.0;
          const finalScale = selectedPackId === 'medieval_village' 
            ? baseScale * assetScaleMultiplier 
            : baseScale;
          
          const newAsset: CastleAsset = {
            id: `asset-${Date.now()}-${Math.random()}`,
            type: selectedAssetType,
            packId: selectedPackId,
            position: [snappedX, terrainY, snappedZ],
            rotation: 0,
            scale: finalScale,
          };
          
          onPlaceAsset(newAsset);
        }
      }
    };
    
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [selectedAssetType, selectedPackId, eraseMode, eraseBrushSize, drawPathMode, castleAssets, camera, raycaster, pointer, scene, onPlaceAsset, onEraseAsset, getTerrainHeight, terrainMeshRef, assetScaleMultiplier, currentPathAssetType, setPathPlacedTiles, setLastPlacedTilePos, lastPlacedTilePos, isDrawingPath, setIsDrawingPath]);
  
  return (
    <>
      {drawPathMode && pathPreviewPos && (
        <mesh position={[pathPreviewPos[0], pathPreviewPos[1] + 0.01, pathPreviewPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[pathBrushSize, pathBrushSize]} />
          <meshStandardMaterial 
            color="#808080" 
            transparent 
            opacity={0.5}
            emissive="#808080"
            emissiveIntensity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {drawPathMode && pathPoints.length > 0 && (
        <>
          {pathPoints.map((point, index) => (
            <mesh 
              key={`path-point-${index}`} 
              position={[point[0], point[1] + 0.01, point[2]]} 
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[pathBrushSize, pathBrushSize]} />
              <meshStandardMaterial 
                color="#808080" 
                transparent 
                opacity={0.6}
                emissive="#808080"
                emissiveIntensity={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          {pathPoints.length > 1 && pathPoints.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = pathPoints[index - 1];
            const distance = Math.sqrt(
              Math.pow(point[0] - prevPoint[0], 2) + 
              Math.pow(point[2] - prevPoint[2], 2)
            );
            const midPoint: [number, number, number] = [
              (point[0] + prevPoint[0]) / 2,
              (point[1] + prevPoint[1]) / 2 + 0.01,
              (point[2] + prevPoint[2]) / 2
            ];
            const angle = Math.atan2(point[2] - prevPoint[2], point[0] - prevPoint[0]);
            return (
              <mesh 
                key={`path-line-${index}`} 
                position={midPoint}
                rotation={[-Math.PI / 2, angle, 0]}
              >
                <planeGeometry args={[distance, pathBrushSize]} />
                <meshStandardMaterial 
                  color="#808080" 
                  transparent 
                  opacity={0.5}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          })}
        </>
      )}
    </>
  );
}

// Erase Brush Indicator - Visual orb showing erase area
function EraseIndicator({
  eraseBrushSize,
  getTerrainHeight,
}: {
  eraseBrushSize: number;
  getTerrainHeight: (x: number, z: number) => number;
}) {
  const { camera, raycaster, pointer, scene } = useThree();
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // Find terrain mesh
      const terrainMesh = scene.children.find(
        (child) => child.type === 'Mesh' && child.userData?.isTerrain
      ) || scene.children.find(
        (child) => child.name === 'terrain' || child.name === 'CircularTerrain'
      );

      if (!terrainMesh) {
        // Try intersecting with all meshes
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          const terrainY = getTerrainHeight(point.x, point.z);
          setHoverPosition([point.x, terrainY + eraseBrushSize / 2, point.z]);
        } else {
          setHoverPosition(null);
        }
        return;
      }

      const intersects = raycaster.intersectObject(terrainMesh, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const terrainY = getTerrainHeight(point.x, point.z);
        setHoverPosition([point.x, terrainY + eraseBrushSize / 2, point.z]);
      } else {
        setHoverPosition(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera, raycaster, pointer, scene, eraseBrushSize, getTerrainHeight]);

  if (!hoverPosition) return null;

  return (
    <mesh position={hoverPosition}>
      <sphereGeometry args={[eraseBrushSize, 16, 16]} />
      <meshStandardMaterial 
        color="#ff4444" 
        transparent 
        opacity={0.3}
        wireframe
        emissive="#ff0000"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Rotation Ring Component
function RotationRing({
  position,
  radius,
  onRotate,
  isRotating,
  onRotationStart,
  onRotationEnd,
}: {
  position: [number, number, number];
  radius: number;
  onRotate: (deltaAngle: number) => void;
  isRotating: boolean;
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
}) {
  const ringRef = useRef<THREE.Group>(null);
  const isRotatingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const { gl, camera } = useThree();
  const pointerRef = useRef(new THREE.Vector2());
  
  // Update pointer position on mouse move
  // Update pointer position on mouse/touch move - supports mobile
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      if (e instanceof TouchEvent && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }
      
      pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [gl]);
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation(); // Stop event from reaching asset drag handler
    e.preventDefault?.();
    isRotatingRef.current = true;
    onRotationStart?.();
    
    // Update pointer position for touch events
    if (e.touches && e.touches.length > 0) {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
    } else {
      // Update for mouse/pointer events
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    // Get pointer position in world space relative to ring center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointerRef.current, camera);
    
    // Project pointer onto horizontal plane at ring height
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);
    
    // Calculate angle from ring center to pointer position
    const dx = intersectPoint.x - position[0];
    const dz = intersectPoint.z - position[2];
    lastAngleRef.current = Math.atan2(dz, dx);
    
    // Support both pointer and touch events
    if (e.pointerId !== undefined) {
      gl.domElement.setPointerCapture(e.pointerId);
    } else if (e.touches) {
      e.preventDefault(); // Prevent scrolling on mobile
    }
  };
  
  useFrame(() => {
    if (isRotatingRef.current && ringRef.current) {
      // Get current pointer position in world space (works for both mouse and touch)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointerRef.current, camera);
      
      // Project pointer onto horizontal plane at ring height
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      // Calculate angle from ring center to pointer position
      const dx = intersectPoint.x - position[0];
      const dz = intersectPoint.z - position[2];
      const currentAngle = Math.atan2(dz, dx);
      
      // Calculate delta angle (handle wrap-around)
      let deltaAngle = currentAngle - lastAngleRef.current;
      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
      
      if (Math.abs(deltaAngle) > 0.001) {
        onRotate(deltaAngle);
        lastAngleRef.current = currentAngle;
      }
    }
  });
  
  useEffect(() => {
    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (isRotatingRef.current) {
        isRotatingRef.current = false;
        onRotationEnd?.();
        // Support both pointer and touch events
        if (e instanceof PointerEvent && e.pointerId !== undefined) {
          gl.domElement.releasePointerCapture(e.pointerId);
        }
      }
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [gl, onRotationEnd]);
  
  // Bright colors - green when rotating, cyan when selected
  const ringColor = isRotating ? '#00ff00' : '#00ffff';
  const arrowColor = isRotating ? '#00ff00' : '#00ffff';
  
  return (
    <group ref={ringRef} position={position}>
      {/* 3D Donut (Torus) - small thin donut, clickable on entire ring for mobile */}
      <mesh 
        rotation={[Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        userData={{ isRotationRing: true }}
      >
        <torusGeometry args={[radius, radius * 0.05, 8, 32]} />
        <meshStandardMaterial 
          color={ringColor} 
          transparent 
          opacity={isRotating ? 1.0 : 0.9} 
          side={THREE.DoubleSide}
          emissive={ringColor}
          emissiveIntensity={isRotating ? 1.2 : 0.8}
        />
      </mesh>
      {/* Directional arrows - pointing in four cardinal directions, smaller and closer */}
      {[
        { angle: 0, label: 'N' },           // North (positive Z)
        { angle: Math.PI / 2, label: 'E' }, // East (positive X)
        { angle: Math.PI, label: 'S' },     // South (negative Z)
        { angle: Math.PI * 1.5, label: 'W' } // West (negative X)
      ].map((dir, i) => {
        const x = Math.cos(dir.angle) * radius;
        const z = Math.sin(dir.angle) * radius;
        return (
          <group
            key={i}
            position={[x, 0, z]}
            rotation={[0, dir.angle + Math.PI / 2, 0]} // Rotate arrow to point outward
            onPointerDown={handlePointerDown}
            userData={{ isRotationRing: true }}
          >
            {/* Arrow cone pointing outward - smaller */}
            <mesh position={[0, 0, 0.2]}>
              <coneGeometry args={[0.15, 0.3, 6]} />
              <meshStandardMaterial 
                color={arrowColor} 
                transparent 
                opacity={isRotating ? 1.0 : 0.9}
                emissive={arrowColor}
                emissiveIntensity={isRotating ? 1.5 : 1.0}
              />
            </mesh>
            {/* Arrow shaft - smaller */}
            <mesh position={[0, 0, -0.1]}>
              <cylinderGeometry args={[0.05, 0.05, 0.2, 6]} />
              <meshStandardMaterial 
                color={arrowColor} 
                transparent 
                opacity={isRotating ? 1.0 : 0.9}
                emissive={arrowColor}
                emissiveIntensity={isRotating ? 1.5 : 1.0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Path Tile Ghost Component - Shows preview of path tile
function PathTileGhost({
  assetType,
  position,
  rotation = 0,
}: {
  assetType: string;
  position: [number, number, number];
  rotation?: number;
}) {
  const modelPathMap: Record<string, string> = {
    'RockPath_Square_Small_1': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_1.gltf',
    'RockPath_Square_Small_2': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Small_2.gltf',
    'RockPath_Square_Thin': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Thin.gltf',
    'RockPath_Square_Wide': '/Assets/Stylized Nature MegaKit[Standard]/glTF/RockPath_Square_Wide.gltf',
  };
  
  const modelPath = modelPathMap[assetType] || modelPathMap['RockPath_Square_Small_1'];
  
  try {
    const { scene } = useGLTF(modelPath);
    
    return (
      <group position={position} rotation={[0, rotation, 0]} scale={1.0}>
        <primitive
          object={scene.clone()}
          onBeforeRender={(renderer: any) => {
            scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.5;
                child.material.color.setHex(0x00ffff);
              }
            });
          }}
        />
      </group>
    );
  } catch (error) {
    // Fallback to simple box if model fails to load
    return (
      <mesh position={position} rotation={[0, rotation, 0]}>
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial 
          color="#00ffff" 
          transparent 
          opacity={0.5}
          emissive="#00ffff"
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  }
}

// Ghost preview component
function GhostCastleAsset({
  assetType,
  packId,
  position,
  scaleMultiplier = 1.0,
}: {
  assetType: string;
  packId: string;
  position: [number, number, number];
  scaleMultiplier?: number;
}) {
  const pack = BUILDING_ASSET_PACKS.find(p => p.id === packId);
  if (!pack) return null;
  
  const assetDef = pack.assets.find(a => a.type === assetType);
  if (!assetDef) return null;
  
  // Skip FBX files - useGLTF only supports GLTF/GLB
  if (assetDef.modelPath.toLowerCase().endsWith('.fbx')) {
    return null; // Don't render FBX files
  }
  
  const modelPath = `${pack.basePath}${assetDef.modelPath}`;
  
  try {
    const { scene } = useGLTF(modelPath);
    const baseScale = assetDef.defaultScale || 6.0;
    const finalScale = packId === 'medieval_village' 
      ? baseScale * scaleMultiplier 
      : baseScale;
    
    return (
      <group position={position} scale={finalScale}>
        <primitive
          object={scene.clone()}
          onBeforeRender={(renderer: any) => {
            scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.5;
                child.material.color.setHex(0x00ffff);
              }
            });
          }}
        />
      </group>
    );
  } catch (error) {
    console.warn(`[GhostCastleAsset] Failed to load: ${modelPath}`, error);
    return null;
  }
}

// Player Character Component - Optional, won't crash if model doesn't load
function PlayerCharacter({ position }: { position: [number, number, number] }) {
  // Use correct path - .glb file from TestWorld
  const gltf = useGLTF('/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb', true);
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  
  const [modelReady, setModelReady] = useState(false);
  
  useEffect(() => {
    if (groupRef.current && gltf && gltf.scene) {
      try {
        // cloneGltf expects the full GLTF object, not just the scene
        const clonedGltf = cloneGltf(gltf);
        if (clonedGltf && clonedGltf.scene) {
          modelRef.current = clonedGltf.scene;
          groupRef.current.add(clonedGltf.scene);
          
          // Scale to match TestWorld
          groupRef.current.scale.set(1, 1, 1);
          
          groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          setModelReady(true);
        }
      } catch (error) {
        console.warn('[PlayerCharacter] Failed to clone GLTF:', error);
      }
    }
  }, [gltf]);
  
  // Use animation hook - only when model is loaded
  const { playAnimation } = useCharacterAnimation({
    characterId: 'builder-player',
    assetId: 'knight',
    model: modelReady ? modelRef.current : null,
    defaultAnimation: 'idle',
  });
  
  useEffect(() => {
    if (modelReady && modelRef.current && playAnimation) {
      // Small delay to ensure animation system is ready
      const timer = setTimeout(() => {
        try {
          playAnimation('idle', { loop: true });
        } catch (error) {
          console.debug('[PlayerCharacter] Animation not ready yet');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [modelReady, playAnimation]);
  
  const characterHeightOffset = 0.9;
  
  return (
    <group ref={groupRef} position={[position[0], position[1] + characterHeightOffset, position[2]]}>
      {/* Character is added via useEffect */}
    </group>
  );
}

// Asset model component with rotation ring and drag-to-move
function CastleAssetModel({
  asset,
  modelPath,
  isSelected,
  isRotationActive,
  isLastPlaced,
  onSelect,
  onDragStart,
  onDragEnd,
  onRotationStart,
  onRotationEnd,
  onUpdate,
  getTerrainHeight,
}: {
  asset: CastleAsset;
  modelPath: string;
  isSelected?: boolean;
  isRotationActive?: boolean;
  isLastPlaced?: boolean;
  onSelect?: () => void;
  onDragStart?: (pos: [number, number, number]) => void;
  onDragEnd?: () => void;
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
  onUpdate?: (updates: Partial<CastleAsset>) => void;
  getTerrainHeight: (x: number, z: number) => number;
}) {
  // Skip FBX files - useGLTF only supports GLTF/GLB
  if (modelPath.toLowerCase().endsWith('.fbx')) {
    console.warn(`[CastleAssetModel] Skipping FBX file: ${modelPath} - requires conversion to GLTF/GLB`);
    return null;
  }
  
  let scene: THREE.Object3D | null = null;
  try {
    const gltf = useGLTF(modelPath);
    scene = gltf?.scene || null;
  } catch (error) {
    console.warn(`[CastleAssetModel] Failed to load: ${modelPath}`, error);
    return null;
  }
  
  if (!scene) return null;
  
  const groupRef = useRef<THREE.Group>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<THREE.Vector3 | null>(null);
  const hasMovedRef = useRef(false);
  const { gl, camera, raycaster, pointer } = useThree();
  const pointerRef = useRef(new THREE.Vector2());
  
  // Update pointer position for drag operations - supports touch
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      // Always update pointer position when dragging
      if (isDraggingRef.current) {
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        let clientX: number, clientY: number;
        
        if (e instanceof TouchEvent && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else if (e instanceof MouseEvent) {
          clientX = e.clientX;
          clientY = e.clientY;
        } else {
          return;
        }
        
        pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      }
    };
    
    // Always listen to pointer moves, not just when dragging starts
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [gl]);
  
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, []);
  
  // Calculate bounding box for rotation ring position - use unscaled scene
  // Since the ring is inside the group and the group has scale, we calculate in unscaled local space
  const [boundingBox, setBoundingBox] = useState<{ min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  
  useEffect(() => {
    if (!groupRef.current || !scene) return;
    
    // Update bounding box after geometry is loaded
    const timer = setTimeout(() => {
      if (groupRef.current && scene) {
        // Calculate bounding box from the scene WITHOUT scale
        // The group's scale will be applied automatically, so we want local-space coordinates
        const box = new THREE.Box3();
        box.setFromObject(scene); // Calculate from original scene, no scale
        
        setBoundingBox({ 
          min: box.min.clone(), 
          max: box.max.clone(), 
          size: box.getSize(new THREE.Vector3()), 
          center: box.getCenter(new THREE.Vector3()) 
        });
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [scene]);

  // Small, fixed-size ring radius - much smaller than before
  const ringRadius = useMemo(() => {
    if (!boundingBox) return 1.5;
    // Use a smaller multiplier and cap the maximum size
    const baseRadius = Math.max(boundingBox.size.x, boundingBox.size.z) * 0.5;
    return Math.min(2.5, Math.max(1.0, baseRadius)); // Clamp between 1.0 and 2.5
  }, [boundingBox]);
  
  // Position ring directly on top of the asset - use local space coordinates
  // Since RotationRing is rendered inside the group, we use local coordinates
  const ringPosition: [number, number, number] = useMemo(() => {
    if (!boundingBox) return [0, 0.5, 0]; // Local space position, fallback - much lower
    // max.y is the top of the asset in local space (after scale is applied)
    // But we want it right on top, so use max.y directly
    const topY = boundingBox.max.y;
    return [0, topY + 0.02, 0]; // Tiny offset above asset (in local space)
  }, [boundingBox]);
  
  const handleRotate = useCallback((deltaAngle: number) => {
    if (onUpdate) {
      onUpdate({ rotation: asset.rotation + deltaAngle });
    }
  }, [asset.rotation, onUpdate]);
  
  // Drag to move functionality - supports both mouse and touch
  const handlePointerDown = useCallback((e: any) => {
    // Don't start drag if clicking on rotation ring (it will stop propagation)
    if (e.detail === 2) return; // Ignore double clicks/taps
    
    // Check if clicking on rotation ring - if so, don't drag
    const target = e.target;
    if (target && target.userData && target.userData.isRotationRing) {
      return; // Let rotation ring handle it
    }
    
    // Start drag if not rotating (allow drag even if not selected - will select on click)
    if (!isRotationActive) {
      e.stopPropagation(); // Stop event from reaching other handlers
      hasMovedRef.current = false;
      isDraggingRef.current = true;
      dragStartRef.current = new THREE.Vector3(...asset.position);
      onDragStart?.(asset.position);
      
      // Select the asset when starting drag
      if (!isSelected) {
        onSelect?.();
      }
      
      // Update pointer position for touch events
      if (e.touches && e.touches.length > 0) {
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        pointerRef.current.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
        pointerRef.current.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
      } else {
        // Update for mouse events
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? 0;
        const clientY = e.clientY ?? 0;
        pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointerRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      }
      
      // Support both mouse and touch events
      if (e.pointerId !== undefined) {
        gl.domElement.setPointerCapture(e.pointerId);
      } else if (e.touches) {
        // Touch event fallback
        e.preventDefault();
      }
    }
  }, [isSelected, isRotationActive, asset.position, onDragStart, onSelect, gl]);
  
  useFrame(() => {
    if (isDraggingRef.current && groupRef.current && onUpdate) {
      // Use pointerRef for touch support
      const currentPointer = pointerRef.current;
      raycaster.setFromCamera(currentPointer, camera);
      
      // Raycast against XZ plane at asset height
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -asset.position[1]);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      if (intersectPoint) {
        // Check if we've moved enough to consider it a drag
        if (dragStartRef.current) {
          const moveDistance = intersectPoint.distanceTo(dragStartRef.current);
          if (moveDistance > 0.1) {
            hasMovedRef.current = true;
          }
        }
        
        // Snap to grid
        const snappedX = Math.round(intersectPoint.x * 2) / 2;
        const snappedZ = Math.round(intersectPoint.z * 2) / 2;
        const terrainY = getTerrainHeight(snappedX, snappedZ);
        
        onUpdate({ position: [snappedX, terrainY, snappedZ] });
      }
    }
  });
  
  useEffect(() => {
    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (isDraggingRef.current) {
        // If we didn't move, treat it as a click and select the asset
        if (!hasMovedRef.current) {
          onSelect?.();
        }
        
        isDraggingRef.current = false;
        dragStartRef.current = null;
        hasMovedRef.current = false;
        onDragEnd?.();
        
        if (e instanceof PointerEvent && e.pointerId !== undefined) {
          gl.domElement.releasePointerCapture(e.pointerId);
        } else {
          gl.domElement.releasePointerCapture(0);
        }
      }
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [onDragEnd, onSelect, gl]);
  
  return (
    <group
      ref={groupRef}
      position={asset.position}
      rotation={[0, asset.rotation, 0]}
      scale={asset.scale}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        // Only select if we're not dragging
        if (!isDraggingRef.current && !hasMovedRef.current) {
          e.stopPropagation();
          onSelect?.();
        }
      }}
    >
      <primitive object={scene.clone()} />
      {isSelected && (
        <>
          {/* Enhanced selection highlight - brighter and color changes when rotating */}
          {/* Ground ring */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.2, 64]} />
            <meshStandardMaterial 
              color={isRotationActive ? "#00ffff" : (isLastPlaced ? "#00aaff" : "#00ff00")} 
              transparent 
              opacity={isRotationActive ? 1.0 : 0.9} 
              side={THREE.DoubleSide}
              emissive={isRotationActive ? "#00ffff" : (isLastPlaced ? "#00aaff" : "#00ff00")}
              emissiveIntensity={isRotationActive ? 1.0 : 0.7}
            />
          </mesh>
          {/* Outer glow ring */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2, 1.5, 64]} />
            <meshStandardMaterial 
              color={isRotationActive ? "#00ffff" : (isLastPlaced ? "#00aaff" : "#00ff00")} 
              transparent 
              opacity={isRotationActive ? 0.6 : 0.4} 
              side={THREE.DoubleSide}
              emissive={isRotationActive ? "#00ffff" : (isLastPlaced ? "#00aaff" : "#00ff00")}
              emissiveIntensity={isRotationActive ? 0.8 : 0.4}
            />
          </mesh>
          {/* Bounding box outline - removed, was causing giant white cube */}
          {/* Rotation ring - always visible when selected */}
          <RotationRing
            position={ringPosition}
            radius={ringRadius}
            onRotate={handleRotate}
            isRotating={isRotationActive || false}
            onRotationStart={onRotationStart}
            onRotationEnd={onRotationEnd}
          />
        </>
      )}
    </group>
  );
}
