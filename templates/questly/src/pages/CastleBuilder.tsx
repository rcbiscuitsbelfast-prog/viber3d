import React, { Suspense, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, useGLTF } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { oceanVertexShader, oceanFragmentShader } from '@/shaders/OceanShaders';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import SidebarMenu from '../components/SidebarMenu';
import { InstancedGrass } from '../components/InstancedGrass';
import { Menu, Eraser, Save, Download } from 'lucide-react';
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
    id: 'medieval_houses',
    name: 'Medieval Houses',
    description: 'Low-poly medieval house models (FBX - requires conversion)',
    basePath: '/Assets/free-medieval-houses-3d-low-poly-pack/fbx/House_Full_ordinar/',
    assets: [
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `house_${i + 1}`,
        name: `House ${i + 1}`,
        type: 'house',
        modelPath: `House_${String(i + 1).padStart(2, '0')}_full.fbx`,
        icon: '🏠',
        defaultScale: 1.0,
        bounds: { width: 3, depth: 3, height: 4 },
      })),
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

// Circular Terrain Component
function CircularTerrain({ radius, getTerrainHeight, terrainMeshRef }: { radius: number; getTerrainHeight: (x: number, z: number) => number; terrainMeshRef: React.RefObject<THREE.Mesh> }) {
  const segments = 64;
  const geometry = useMemo(() => {
    const geom = new THREE.RingGeometry(0, radius, segments);
    const positions = geom.attributes.position;
    const vertices = positions.count;
    
    for (let i = 0; i < vertices; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = getTerrainHeight(x, z);
      positions.setY(i, y);
    }
    
    geom.computeVertexNormals();
    return geom;
  }, [radius, getTerrainHeight]);
  
  useEffect(() => {
    if (terrainMeshRef.current) {
      terrainMeshRef.current.userData.isTerrain = true;
    }
  }, [terrainMeshRef]);
  
  return (
    <mesh ref={terrainMeshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#4a7c59" />
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
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

// Terrain height function - flat circular island
function getTerrainHeight(x: number, z: number): number {
  const distance = Math.sqrt(x * x + z * z);
  if (distance > 30) return -2; // Water level
  return 0; // Flat terrain
}

// Generate grass positions for circular terrain
function generateGrassPositions(radius: number, count: number): Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> {
  const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.9; // Keep grass within terrain
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = getTerrainHeight(x, z);
    
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
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh>(null);
  
  const selectedPack = BUILDING_ASSET_PACKS.find(p => p.id === selectedPackId);
  const availableAssets = selectedPack?.assets || [];
  
  // Generate grass positions
  const grassPositions = useMemo(() => generateGrassPositions(terrainRadius, 500), [terrainRadius]);
  
  const handlePlaceAsset = useCallback((asset: CastleAsset) => {
    setCastleAssets(prev => [...prev, asset]);
    setSelectedAssetType(null); // Deselect after placing
  }, []);
  
  const handleDeleteAsset = useCallback((id: string) => {
    setCastleAssets(prev => prev.filter(a => a.id !== id));
    setSelectedAsset(null);
  }, []);
  
  const handleEraseAsset = useCallback((id: string) => {
    handleDeleteAsset(id);
  }, [handleDeleteAsset]);
  
  const handleSaveBuild = useCallback(() => {
    const name = prompt('Enter build name:');
    if (name) {
      saveCastleBuild(name, {
        name,
        assets: castleAssets,
        terrainRadius,
      });
      alert(`Build "${name}" saved!`);
    }
  }, [castleAssets, terrainRadius]);
  
  const handleLoadBuild = useCallback(() => {
    const builds = getSavedCastleBuilds();
    const buildNames = Object.keys(builds);
    if (buildNames.length === 0) {
      alert('No saved builds found!');
      return;
    }
    const name = prompt(`Enter build name to load:\nAvailable: ${buildNames.join(', ')}`);
    if (name && builds[name]) {
      const build = builds[name];
      setCastleAssets(build.assets);
      if (build.terrainRadius) setTerrainRadius(build.terrainRadius);
      alert(`Build "${name}" loaded!`);
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
      
      {/* Sidebar */}
      {sidebarOpen && (
        <div className={`fixed left-0 top-14 bottom-0 w-64 bg-slate-800 border-r border-slate-700 z-20 overflow-y-auto ${leftPanelMinimized ? 'hidden' : ''}`}>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Castle Builder</h2>
              <button
                onClick={() => setLeftPanelMinimized(!leftPanelMinimized)}
                className="text-slate-400 hover:text-white"
              >
                {leftPanelMinimized ? '▶' : '▼'}
              </button>
            </div>
            
            {!leftPanelMinimized && (
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
                
                <div className="pt-2 border-t border-slate-700">
                  <button
                    onClick={() => {
                      setEraseMode(!eraseMode);
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
            )}
          </div>
        </div>
      )}
      
      {/* Canvas */}
      <div className="flex-1 mt-14">
        <Canvas camera={{ position: [50, 40, 50], fov: 60 }} shadows>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="sunset" />
          
          <OrbitControls enablePan enableZoom enableRotate />
          
          <CircularTerrain radius={terrainRadius} getTerrainHeight={getTerrainHeight} terrainMeshRef={terrainMeshRef} />
          
          {/* Instanced Grass */}
          <InstancedGrass grass={grassPositions} castShadow receiveShadow={false} />
          
          <DynamicOcean radius={terrainRadius * 1.5} />
          
          {/* Ground click handler for placing/erasing assets */}
          <GroundClickHandler
            selectedAssetType={selectedAssetType}
            selectedPackId={selectedPackId}
            eraseMode={eraseMode}
            eraseBrushSize={eraseBrushSize}
            castleAssets={castleAssets}
            onPlaceAsset={handlePlaceAsset}
            onEraseAsset={handleEraseAsset}
            getTerrainHeight={getTerrainHeight}
            terrainMeshRef={terrainMeshRef}
          />
          
          {/* Render placed assets */}
          {castleAssets.map(asset => {
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
                  onSelect={() => setSelectedAsset(asset.id)}
                />
              </Suspense>
            );
          })}
        </Canvas>
      </div>
    </div>
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
}) {
  const { camera, raycaster, pointer, scene } = useThree();
  
  useEffect(() => {
    if (!selectedAssetType && !eraseMode) return;
    
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
        
        if (eraseMode) {
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
        } else if (selectedAssetType) {
          // Place new asset
          const terrainY = getTerrainHeight(point.x, point.z);
          
          // Snap to grid
          const snappedX = Math.round(point.x * 2) / 2;
          const snappedZ = Math.round(point.z * 2) / 2;
          
          const pack = BUILDING_ASSET_PACKS.find(p => p.id === selectedPackId);
          const assetDef = pack?.assets.find(a => a.type === selectedAssetType);
          if (!assetDef) return;
          
          const newAsset: CastleAsset = {
            id: `asset-${Date.now()}-${Math.random()}`,
            type: selectedAssetType,
            packId: selectedPackId,
            position: [snappedX, terrainY, snappedZ],
            rotation: 0,
            scale: assetDef.defaultScale || 6.0,
          };
          
          onPlaceAsset(newAsset);
        }
      }
    };
    
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [selectedAssetType, selectedPackId, eraseMode, eraseBrushSize, castleAssets, camera, raycaster, pointer, scene, onPlaceAsset, onEraseAsset, getTerrainHeight, terrainMeshRef]);
  
  return null;
}

// Asset model component with selection highlighting
function CastleAssetModel({ asset, modelPath, isSelected, onSelect }: { asset: CastleAsset; modelPath: string; isSelected?: boolean; onSelect?: () => void }) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);
  
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
  
  return (
    <group
      ref={groupRef}
      position={asset.position}
      rotation={[0, asset.rotation, 0]}
      scale={asset.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <primitive object={scene.clone()} />
      {isSelected && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 1, 32]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
