import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useTheme } from '../contexts/ThemeContext';

const TILE_SIZE = 10; // 10x10 unit tile

interface PlacedAsset {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

// Asset paths - using Stylized Nature MegaKit
const ASSET_BASE_PATH = '/Assets/Stylized Nature MegaKit[Standard]/glTF';

const ASSET_PATHS: Record<string, string> = {
  // Trees
  tree_1: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/tree_1/Tree_1_A_Color1.gltf',
  tree_2: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/tree_2/Tree_2_A_Color1.gltf',
  tree_3: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/tree_3/Tree_3_A_Color1.gltf',
  tree_4: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/tree_4/Tree_4_A_Color1.gltf',
  // Rocks
  rock_1: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/rock_1/Rock_1_A_Color1.gltf',
  rock_2: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/rock_2/Rock_2_A_Color1.gltf',
  rock_3: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/rock_3/Rock_3_A_Color1.gltf',
};

// Grass types from Stylized Nature MegaKit
const GRASS_TYPES = [
  'Grass_Common_Short',
  'Grass_Common_Tall',
  'Grass_Wide_Short',
  'Grass_Wide_Tall',
  'Grass_Wispy_Short',
  'Grass_Wispy_Tall',
  'Grass_Wheat',
  'Plant_1',
  'Plant_2',
  'Plant_3',
  'Plant_4',
  'Plant_5',
  'Plant_6',
  'Plant_7',
  'Clover_1',
  'Clover_2',
];

// Flower types from Stylized Nature MegaKit
const FLOWER_TYPES = [
  'Flower_1_Single',
  'Flower_1_Group',
  'Flower_2_Single',
  'Flower_2_Group',
  'Flower_3_Single',
  'Flower_3_Group',
  'Flower_4_Single',
  'Flower_4_Group',
  'Flower_6',
  'Flower_6_2',
  'Flower_7_Single',
  'Flower_7_Group',
  'Petal_1',
  'Petal_2',
  'Petal_3',
  'Petal_4',
  'Petal_5',
  'Petal_6',
];

// Placed Asset Component (for trees and rocks)
function PlacedAssetComponent({ asset, onDelete }: { asset: PlacedAsset; onDelete: () => void }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const path = ASSET_PATHS[asset.type];
    if (!path) {
      console.warn(`Unknown asset type: ${asset.type}`);
      return;
    }

    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene.clone();
        model.position.set(0, 0, 0); // Position is set on the group
        model.rotation.y = asset.rotation;
        model.scale.setScalar(asset.scale);
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        setScene(model);
      },
      undefined,
      (error) => {
        console.error(`Failed to load ${asset.type}:`, error);
      }
    );
  }, [asset.type, asset.rotation, asset.scale]);

  if (!scene) {
    // Show placeholder while loading
    return (
      <mesh position={asset.position}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    );
  }

  return (
    <group 
      ref={groupRef}
      position={asset.position}
      onClick={(e) => { 
        e.stopPropagation(); 
        console.log('Asset clicked, deleting:', asset.id);
        onDelete(); 
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

// Grass Component
function GrassComponent({ position, rotation, type }: { position: [number, number, number]; rotation: number; type: string }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `${ASSET_BASE_PATH}/${type}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(0.8 + Math.random() * 0.4); // Random scale variation
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Ensure they render
          }
        });
        setScene(cloned);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load grass: ${type}`, error);
      }
    );
  }, [type]);

  if (!scene) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// Flower Component
function FlowerComponent({ position, rotation, type }: { position: [number, number, number]; rotation: number; type: string }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `${ASSET_BASE_PATH}/${type}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(0.6 + Math.random() * 0.3); // Random scale variation
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Ensure they render
          }
        });
        setScene(cloned);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load flower: ${type}`, error);
      }
    );
  }, [type]);

  if (!scene) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// Ground Tile Component
function GroundTile({ size, type }: { size: number; type: 'grass' | 'water' }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (type === 'grass') {
      const loader = new THREE.TextureLoader();
      loader.load(
        '/Assets/Stylized Nature MegaKit[Standard]/glTF/Grass.png',
        (loadedTexture) => {
          loadedTexture.wrapS = THREE.RepeatWrapping;
          loadedTexture.wrapT = THREE.RepeatWrapping;
          loadedTexture.repeat.set(2, 2);
          setTexture(loadedTexture);
        },
        undefined,
        () => setTexture(null)
      );
    }
  }, [type]);

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        map={texture}
        color={type === 'grass' ? '#3d6b2d' : '#1e90ff'}
        transparent={type === 'water'}
        opacity={type === 'water' ? 0.8 : 1}
      />
    </mesh>
  );
}

// Grid Helper
function TileGrid({ size }: { size: number }) {
  const divisions = 10;
  return (
    <gridHelper args={[size, divisions, '#666666', '#999999']} position={[0, 0.01, 0]} />
  );
}

// Scene with export functionality
function TileScene({ 
  groundType, 
  placedAssets, 
  onPlaceAsset, 
  onDeleteAsset,
  sceneRef,
  selectedAsset,
  setSelectedAsset
}: { 
  groundType: 'grass' | 'water';
  placedAssets: PlacedAsset[];
  onPlaceAsset: (type: string, position: [number, number, number], rotation: number, scale: number) => void;
  onDeleteAsset: (id: string) => void;
  sceneRef: React.MutableRefObject<THREE.Group | null>;
  selectedAsset: string | null;
  setSelectedAsset: (asset: string | null) => void;
}) {
  const { raycaster, camera, scene } = useThree();

  // Generate automatic grass and flowers for every tile (only on grass tiles)
  const autoGrass = useMemo(() => {
    if (groundType !== 'grass') return [];
    
    const result: Array<{ position: [number, number, number]; rotation: number; type: string }> = [];
    const numGrass = 20; // Number of grass patches per tile
    
    for (let i = 0; i < numGrass; i++) {
      const halfTile = TILE_SIZE / 2;
      const x = (Math.random() - 0.5) * TILE_SIZE * 0.9;
      const z = (Math.random() - 0.5) * TILE_SIZE * 0.9;
      
      const type = GRASS_TYPES[Math.floor(Math.random() * GRASS_TYPES.length)];
      result.push({
        position: [x, 0.01, z], // Slightly above ground
        rotation: Math.random() * Math.PI * 2,
        type
      });
    }
    
    return result;
  }, [groundType]);

  // Generate automatic flowers for every tile (only on grass tiles)
  const autoFlowers = useMemo(() => {
    if (groundType !== 'grass') return [];
    
    const result: Array<{ position: [number, number, number]; rotation: number; type: string }> = [];
    const numFlowers = 8; // Number of flowers per tile
    
    for (let i = 0; i < numFlowers; i++) {
      const halfTile = TILE_SIZE / 2;
      const x = (Math.random() - 0.5) * TILE_SIZE * 0.9;
      const z = (Math.random() - 0.5) * TILE_SIZE * 0.9;
      
      const type = FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)];
      result.push({
        position: [x, 0.01, z], // Slightly above ground
        rotation: Math.random() * Math.PI * 2,
        type
      });
    }
    
    return result;
  }, [groundType]);

  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    if (!selectedAsset) {
      console.log('No asset selected');
      return;
    }
    
    // Get intersection point from event (React Three Fiber provides event.point)
    const point = event.point || (event.intersections && event.intersections[0]?.point);
    if (!point) {
      console.log('No intersection point found in event:', event);
      return;
    }
    
    console.log('Click at point:', point, 'Selected asset:', selectedAsset);
    
    // Clamp to tile bounds (-5 to +5 for 10x10 tile)
    const halfTile = TILE_SIZE / 2;
    const gridX = Math.max(-halfTile, Math.min(halfTile, Math.round(point.x)));
    const gridZ = Math.max(-halfTile, Math.min(halfTile, Math.round(point.z)));
    
    // Random rotation and scale (like MinimalDemo)
    const rotation = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    
    onPlaceAsset(selectedAsset, [gridX, 0, gridZ], rotation, scale);
  }, [selectedAsset, onPlaceAsset]);


  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      
      <group ref={sceneRef}>
        <GroundTile size={TILE_SIZE} type={groundType} />
        <TileGrid size={TILE_SIZE} />
        
        {/* Automatic grass patches (only on grass tiles) */}
        {autoGrass.map((grass, i) => (
          <GrassComponent key={`auto-grass-${i}`} position={grass.position} rotation={grass.rotation} type={grass.type} />
        ))}
        
        {/* Automatic flowers (only on grass tiles) */}
        {autoFlowers.map((flower, i) => (
          <FlowerComponent key={`auto-flower-${i}`} position={flower.position} rotation={flower.rotation} type={flower.type} />
        ))}
        
        {/* Manually placed assets (trees, rocks) */}
        {placedAssets.map(asset => (
          <PlacedAssetComponent 
            key={asset.id} 
            asset={asset} 
            onDelete={() => onDeleteAsset(asset.id)}
          />
        ))}
      </group>

      {/* Clickable ground plane - positioned slightly above ground to catch clicks */}
      <mesh 
        rotation-x={-Math.PI / 2} 
        position={[0, 0.1, 0]}
        onClick={handleClick}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (selectedAsset) {
            handleClick(e);
          }
        }}
        visible={false}
      >
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

export function TileBuilderPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [tileName, setTileName] = useState('');
  const [groundType, setGroundType] = useState<'grass' | 'water'>('grass');
  const [placedAssets, setPlacedAssets] = useState<PlacedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Group>(null);

  const handlePlaceAsset = useCallback((type: string, position: [number, number, number], rotation: number, scale: number) => {
    const id = `asset-${Date.now()}-${Math.random()}`;
    setPlacedAssets(prev => [...prev, { id, type, position, rotation, scale }]);
  }, []);

  const handleDeleteAsset = useCallback((id: string) => {
    setPlacedAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);


  const handleExportGLTF = useCallback(() => {
    if (!sceneRef.current || !tileName.trim()) {
      alert('Please enter a tile name before exporting');
      return;
    }

    const exporter = new GLTFExporter();
    const sceneToExport = sceneRef.current.clone();

    // Export as GLTF 2.0
    exporter.parse(
      sceneToExport,
      (gltf) => {
        try {
          // Convert to JSON string if needed
          const output = typeof gltf === 'string' ? gltf : JSON.stringify(gltf, null, 2);
          
          // Download file
          const blob = new Blob([output], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${tileName.replace(/\s+/g, '_')}.gltf`;
          link.click();
          URL.revokeObjectURL(url);

          // Also save to localStorage for use in World Builder
          const tileData = {
            id: `custom_${tileName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
            name: tileName,
            groundType,
            assets: placedAssets,
            gltfData: output,
            createdAt: new Date().toISOString(),
          };
          
          const savedTiles = JSON.parse(localStorage.getItem('custom-tiles') || '[]');
          // Remove old version if exists
          const filtered = savedTiles.filter((t: any) => t.name !== tileName);
          filtered.push(tileData);
          localStorage.setItem('custom-tiles', JSON.stringify(filtered));
          
          alert(`Tile "${tileName}" exported and saved! You can now use it in World Builder.`);
        } catch (error) {
          console.error('Error processing export:', error);
          alert('Failed to process exported tile. Check console for details.');
        }
      },
      (error) => {
        console.error('Export failed:', error);
        alert('Failed to export tile. Check console for details.');
      },
      { 
        binary: false, 
        trs: false, 
        onlyVisible: true, 
        truncateDrawRange: true, 
        embedImages: true
      }
    );
  }, [tileName, groundType, placedAssets]);

  const handleClear = useCallback(() => {
    if (confirm('Clear all assets?')) {
      setPlacedAssets([]);
    }
  }, []);

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Header */}
      <header className={`${cardBg} border-b ${borderColor} sticky top-0 z-40 shadow-md`}>
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">Tile Builder</h1>
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={tileName}
              onChange={(e) => setTileName(e.target.value)}
              placeholder="Enter tile name..."
              className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              onClick={handleExportGLTF}
              disabled={!tileName.trim() || placedAssets.length === 0}
              className={`px-4 py-2 ${!tileName.trim() || placedAssets.length === 0 ? 'bg-gray-500 cursor-not-allowed' : theme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors`}
            >
              Export GLTF
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
        {/* Sidebar - Asset Palette */}
        <aside className={`${cardBg} ${borderColor} border rounded-lg p-4 lg:w-64 h-fit lg:sticky lg:top-20`}>
          <h2 className="text-xl font-bold mb-4">Assets</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Ground Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGroundType('grass')}
                className={`flex-1 px-3 py-2 rounded ${groundType === 'grass' ? theme === 'dark' ? 'bg-green-700' : 'bg-green-500' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} text-white rounded-lg transition-colors`}
              >
                Grass
              </button>
              <button
                onClick={() => setGroundType('water')}
                className={`flex-1 px-3 py-2 rounded ${groundType === 'water' ? theme === 'dark' ? 'bg-blue-700' : 'bg-blue-500' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} text-white rounded-lg transition-colors`}
              >
                Water
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-2">Trees & Rocks</h3>
            {Object.keys(ASSET_PATHS).map(assetKey => (
              <button
                key={assetKey}
                onClick={() => setSelectedAsset(assetKey)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedAsset === assetKey
                    ? theme === 'dark'
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-blue-500 bg-blue-100'
                    : `${borderColor} hover:border-blue-400`
                }`}
              >
                <div className="font-semibold capitalize">{assetKey.replace(/_/g, ' ')}</div>
                <div className="text-xs opacity-70 mt-1">Random size & rotation</div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-green-500/20 rounded-lg">
            <div className="text-sm font-semibold mb-1">Auto-generated</div>
            <div className="text-xs opacity-70">
              Grass and flowers automatically placed on grass tiles
            </div>
          </div>
          
          <div className="mt-4 text-sm opacity-70">
            <p>Selected: {selectedAsset ? selectedAsset.replace(/_/g, ' ') : 'None'}</p>
            <p className="mt-2">Click on the tile to place trees/rocks</p>
            <p className="mt-2">Click placed assets to delete</p>
            <p className="text-xs mt-2">Trees/Rocks placed: {placedAssets.length}</p>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1">
          <div className={`${cardBg} ${borderColor} border rounded-lg p-4`} style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
            <Canvas shadows camera={{ position: [6, 6, 6], fov: 65 }}>
              <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={65} />
              <TileScene
                groundType={groundType}
                placedAssets={placedAssets}
                onPlaceAsset={handlePlaceAsset}
                onDeleteAsset={handleDeleteAsset}
                sceneRef={sceneRef}
                selectedAsset={selectedAsset}
                setSelectedAsset={setSelectedAsset}
              />
              <OrbitControls
                makeDefault
                minDistance={3}
                maxDistance={20}
                target={[0, 0, 0]}
              />
            </Canvas>
          </div>
        </main>
      </div>
    </div>
  );
}
