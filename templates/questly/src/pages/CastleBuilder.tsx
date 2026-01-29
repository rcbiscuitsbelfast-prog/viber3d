import React, { Suspense, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, useGLTF } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { oceanVertexShader, oceanFragmentShader } from '@/shaders/OceanShaders';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import SidebarMenu from '../components/SidebarMenu';
import { InstancedGrass } from '../components/InstancedGrass';
import { VolumetricFog } from '../components/VolumetricFog';
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
  // Medieval houses pack disabled - FBX files require conversion to GLTF/GLB
  // Uncomment and convert FBX files to GLTF/GLB format before enabling
  /*
  {
    id: 'medieval_houses',
    name: 'Medieval Houses',
    description: 'Low-poly medieval house models (FBX - requires conversion)',
    basePath: '/Assets/free-medieval-houses-3d-low-poly-pack/fbx/House_Full_ordinar/',
    assets: [
      ...Array.from({ length: 20 }, (_, i) => ({
        id: `house_${i + 1}`,
        name: `House ${i + 1}`,
        type: `house_${i + 1}`, // Each house needs unique type
        modelPath: `House_${String(i + 1).padStart(2, '0')}_full.fbx`,
        icon: '🏠',
        defaultScale: 1.0,
        bounds: { width: 3, depth: 3, height: 4 },
      })),
    ],
  },
  */
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

// Generate grass positions for circular terrain
function generateGrassPositions(radius: number, count: number, getTerrainHeightFn: (x: number, z: number) => number): Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> {
  const positions: Array<{ pos: [number, number, number]; rotation: number; scale: number; variant?: number }> = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.9; // Keep grass within terrain
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
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
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);
  const [isDraggingAsset, setIsDraggingAsset] = useState(false);
  const [isRotatingAsset, setIsRotatingAsset] = useState(false);
  const [activeRotationRingId, setActiveRotationRingId] = useState<string | null>(null);
  const [lastPlacedAssetId, setLastPlacedAssetId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<[number, number, number] | null>(null);
  const [fogEnabled, setFogEnabled] = useState(true);
  const [fogHeight, setFogHeight] = useState(5);
  const [bubbleScale, setBubbleScale] = useState(0.5);
  const [bubbleDensity, setBubbleDensity] = useState(50);
  const [bubbleSpeed, setBubbleSpeed] = useState(10);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveBuildName, setSaveBuildName] = useState('');
  const terrainMeshRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  
  const selectedPack = BUILDING_ASSET_PACKS.find(p => p.id === selectedPackId);
  const availableAssets = selectedPack?.assets || [];
  
  // Terrain height function for this component
  const getTerrainHeightLocal = useCallback((x: number, z: number) => {
    return getTerrainHeight(x, z, terrainRadius);
  }, [terrainRadius]);
  
  // Generate grass positions
  const grassPositions = useMemo(() => generateGrassPositions(terrainRadius, 500, getTerrainHeightLocal), [terrainRadius, getTerrainHeightLocal]);
  
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
  
  const handlePlaceAsset = useCallback((asset: CastleAsset) => {
    setCastleAssets(prev => [...prev, asset]);
    setSelectedAssetType(null); // Deselect after placing
    setLastPlacedAssetId(asset.id); // Track last placed asset for arrow key movement
  }, []);
  
  const handleDeleteAsset = useCallback((id: string) => {
    setCastleAssets(prev => prev.filter(a => a.id !== id));
    setSelectedAsset(null);
  }, []);
  
  const handleEraseAsset = useCallback((id: string) => {
    handleDeleteAsset(id);
  }, [handleDeleteAsset]);
  
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
                
                <div className="pt-2 border-t border-slate-700">
                  <label className="text-sm font-bold mb-2 block">Fog</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={fogEnabled}
                        onChange={(e) => setFogEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>Enable Fog</span>
                    </label>
                    {fogEnabled && (
                      <>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Height: {fogHeight.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.5"
                            value={fogHeight}
                            onChange={(e) => setFogHeight(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Scale: {bubbleScale.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={bubbleScale}
                            onChange={(e) => setBubbleScale(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Density: {bubbleDensity}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={bubbleDensity}
                            onChange={(e) => setBubbleDensity(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            Speed: {bubbleSpeed}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={bubbleSpeed}
                            onChange={(e) => setBubbleSpeed(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
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
          
          <OrbitControls
            ref={controlsRef}
            enablePan={!isDraggingAsset && !isRotatingAsset}
            enableZoom={!isDraggingAsset && !isRotatingAsset}
            enableRotate={!isDraggingAsset && !isRotatingAsset}
          />
          
          {/* Terrain - render first */}
          <CircularTerrain radius={terrainRadius} getTerrainHeight={getTerrainHeightLocal} terrainMeshRef={terrainMeshRef} />
          
          {/* Instanced Grass */}
          <InstancedGrass grass={grassPositions} castShadow receiveShadow={false} />
          
          {/* Ocean - render after terrain so it doesn't cover it */}
          <DynamicOcean radius={terrainRadius * 1.5} />
          
          {/* Volumetric Fog - matches island size */}
          {fogEnabled && (
            <VolumetricFog
              timeOfDay={0.5}
              fogHeight={fogHeight}
              bubbleScale={bubbleScale}
              bubbleDensity={bubbleDensity}
              bubbleSpeed={bubbleSpeed}
              terrainRadius={terrainRadius}
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
            setPreviewPosition={setPreviewPosition}
          />
          
          {/* Ghost preview of selected asset */}
          {selectedAssetType && previewPosition && !eraseMode && (
            <Suspense fallback={null}>
              <GhostCastleAsset
                assetType={selectedAssetType}
                packId={selectedPackId}
                position={previewPosition}
              />
            </Suspense>
          )}
          
          {/* Player Character for Scale Reference - Optional, won't crash if model fails */}
          <Suspense fallback={null}>
            <PlayerCharacter position={[0, getTerrainHeightLocal(0, 0), 0]} />
          </Suspense>
          
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
          
          {/* UI hint for arrow key movement */}
          {lastPlacedAssetId && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 text-white px-4 py-2 rounded text-sm">
              Use Arrow Keys or WASD to move last placed asset
            </div>
          )}
          
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
  setPreviewPosition,
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
  
  // Handle clicks for placing/erasing
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
  const { gl, camera, pointer: pointerState } = useThree();
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.preventDefault && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    isRotatingRef.current = true;
    onRotationStart?.();
    
    // Calculate initial angle
    const toMouse = new THREE.Vector3(
      Math.cos(pointerState.x * Math.PI),
      0,
      Math.sin(pointerState.x * Math.PI)
    );
    lastAngleRef.current = Math.atan2(toMouse.z, toMouse.x);
    
    gl.domElement.setPointerCapture(e.pointerId);
  };
  
  useFrame(() => {
    if (isRotatingRef.current && ringRef.current) {
      const angle = Math.atan2(pointerState.y, pointerState.x);
      const deltaAngle = angle - lastAngleRef.current;
      
      if (Math.abs(deltaAngle) > 0.001) {
        onRotate(deltaAngle);
        lastAngleRef.current = angle;
      }
    }
  });
  
  useEffect(() => {
    const handlePointerUp = (e: PointerEvent) => {
      if (isRotatingRef.current) {
        isRotatingRef.current = false;
        onRotationEnd?.();
        gl.domElement.releasePointerCapture(e.pointerId);
      }
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [gl, onRotationEnd]);
  
  const ringColor = isRotating ? '#00ff00' : '#1a3a5f';
  const orbColor = isRotating ? '#00ff00' : '#1a3a5f';
  
  return (
    <group ref={ringRef} position={position}>
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.9, radius, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={isRotating ? 0.8 : 0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.7, radius * 0.85, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={isRotating ? 0.6 : 0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Handle points */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * radius * 0.85, 0, Math.sin(angle) * radius * 0.85]}
          onPointerDown={handlePointerDown}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={orbColor} transparent opacity={isRotating ? 0.9 : 0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Ghost preview component
function GhostCastleAsset({
  assetType,
  packId,
  position,
}: {
  assetType: string;
  packId: string;
  position: [number, number, number];
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
    const defaultScale = assetDef.defaultScale || 6.0;
    
    return (
      <group position={position} scale={defaultScale}>
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
  const { gl, camera, raycaster, pointer } = useThree();
  
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
  
  // Calculate bounding box for rotation ring position
  const boundingBox = useMemo(() => {
    if (!groupRef.current) return null;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    return { min: box.min, max: box.max, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
  }, [scene]);
  
  const ringRadius = 2.0; // Fixed small size
  const topSurfaceY = boundingBox ? boundingBox.max.y - boundingBox.center.y : 3.5;
  const ringPosition: [number, number, number] = [
    asset.position[0],
    asset.position[1] + topSurfaceY * asset.scale,
    asset.position[2],
  ];
  
  const handleRotate = useCallback((deltaAngle: number) => {
    if (onUpdate) {
      onUpdate({ rotation: asset.rotation + deltaAngle });
    }
  }, [asset.rotation, onUpdate]);
  
  // Drag to move functionality
  const handlePointerDown = useCallback((e: any) => {
    if (e.detail === 2) return; // Ignore double clicks
    e.stopPropagation();
    if (isSelected && !isRotationActive) {
      isDraggingRef.current = true;
      dragStartRef.current = new THREE.Vector3(...asset.position);
      onDragStart?.(asset.position);
      gl.domElement.setPointerCapture(e.pointerId);
    }
  }, [isSelected, isRotationActive, asset.position, onDragStart, gl]);
  
  useFrame(() => {
    if (isDraggingRef.current && groupRef.current && onUpdate) {
      raycaster.setFromCamera(pointer, camera);
      
      // Raycast against XZ plane at asset height
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -asset.position[1]);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      if (intersectPoint) {
        // Snap to grid
        const snappedX = Math.round(intersectPoint.x * 2) / 2;
        const snappedZ = Math.round(intersectPoint.z * 2) / 2;
        const terrainY = getTerrainHeight(snappedX, snappedZ);
        
        onUpdate({ position: [snappedX, terrainY, snappedZ] });
      }
    }
  });
  
  useEffect(() => {
    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragStartRef.current = null;
        onDragEnd?.();
        gl.domElement.releasePointerCapture(0);
      }
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [onDragEnd, gl]);
  
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
      onPointerDown={handlePointerDown}
    >
      <primitive object={scene.clone()} />
      {isSelected && (
        <>
          {/* Selection highlight - green for selected, blue for last placed */}
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 1, 32]} />
            <meshBasicMaterial 
              color={isLastPlaced ? "#00aaff" : "#00ff00"} 
              transparent 
              opacity={0.5} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          {/* Rotation ring */}
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
