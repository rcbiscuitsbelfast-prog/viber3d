import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ==================== Placed Asset Component ====================

interface PlacedAssetProps {
  assetType: string;
  position: [number, number, number];
  rotation?: number; // Y rotation in radians
  scale?: number;
}

function PlacedAsset({ assetType, position, rotation = 0, scale = 1.0 }: PlacedAssetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [assetScene, setAssetScene] = useState<THREE.Group | null>(null);

  // Tree variants
  const treeVariants = [
    'Tree_1_A_Color1', 'Tree_1_B_Color1', 'Tree_1_C_Color1',
    'Tree_2_A_Color1', 'Tree_2_B_Color1', 'Tree_2_C_Color1', 'Tree_2_D_Color1', 'Tree_2_E_Color1',
    'Tree_3_A_Color1', 'Tree_3_B_Color1', 'Tree_3_C_Color1',
    'Tree_4_A_Color1', 'Tree_4_B_Color1', 'Tree_4_C_Color1',
    'Tree_Bare_1_A_Color1', 'Tree_Bare_1_B_Color1', 'Tree_Bare_1_C_Color1',
    'Tree_Bare_2_A_Color1', 'Tree_Bare_2_B_Color1', 'Tree_Bare_2_C_Color1',
  ];

  // Rock variants
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

  // Select random variant once when component mounts (stable per instance)
  const variantName = useMemo(() => {
    if (assetType === 'tree') {
      return treeVariants[Math.floor(Math.random() * treeVariants.length)];
    } else if (assetType === 'rock') {
      return rockVariants[Math.floor(Math.random() * rockVariants.length)];
    }
    return null;
  }, [assetType]); // Only recalculate if assetType changes

  useEffect(() => {
    if (!variantName) {
      console.warn(`[PlacedAsset] Unknown asset type: ${assetType}`);
      return;
    }

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
            child.visible = true;
          }
        });
        setAssetScene(cloned);
      },
      undefined,
      (error) => console.warn(`[PlacedAsset] Failed to load ${variantName}:`, error)
    );
  }, [variantName, scale]);

  if (!assetScene) {
    // Placeholder colors by type
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

// ==================== Grass Patch Component ====================

function GrassPatch({ position, rotation, type, scale = 1.0 }: { position: [number, number, number]; rotation: number; type: string; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [grassScene, setGrassScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${type}.gltf`;
    console.log(`[GrassPatch] Loading: ${assetPath}`);

    loader.load(
      assetPath,
      (gltf) => {
        console.log(`[GrassPatch] Successfully loaded: ${type}`);
        const cloned = gltf.scene.clone();
        // Use provided scale or default to a visible size - make it bigger
        const finalScale = scale || 1.5;
        cloned.scale.setScalar(finalScale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Ensure visibility
          }
        });
        setGrassScene(cloned);
      },
      undefined,
      (error) => {
        console.error(`[GrassPatch] Failed to load grass: ${type}`, error, `Path: ${assetPath}`);
      }
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

// ==================== Small Rock Component ====================

function SmallRock({ position, rotation, variant, scale = 1.0 }: { position: [number, number, number]; rotation: number; variant: string; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rockScene, setRockScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${variant}.gltf`;
    console.log(`[SmallRock] Loading: ${assetPath}`);

    loader.load(
      assetPath,
      (gltf) => {
        console.log(`[SmallRock] Successfully loaded: ${variant}`);
        const cloned = gltf.scene.clone();
        // Use provided scale or default to a visible size - make it bigger
        const finalScale = scale || 1.2;
        cloned.scale.setScalar(finalScale);
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
      (error) => {
        console.error(`[SmallRock] Failed to load rock: ${variant}`, error, `Path: ${assetPath}`);
      }
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

// ==================== Flower Component ====================

function Flower({ position, rotation, type, scale = 1.0 }: { position: [number, number, number]; rotation: number; type: string; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [flowerScene, setFlowerScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${type}.gltf`;
    console.log(`[Flower] Loading: ${assetPath}`);

    loader.load(
      assetPath,
      (gltf) => {
        console.log(`[Flower] Successfully loaded: ${type}`);
        const cloned = gltf.scene.clone();
        // Use provided scale or default to a visible size - make it bigger
        const finalScale = scale || 1.5;
        cloned.scale.setScalar(finalScale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Ensure visibility
          }
        });
        setFlowerScene(cloned);
      },
      undefined,
      (error) => {
        console.error(`[Flower] Failed to load flower: ${type}`, error, `Path: ${assetPath}`);
      }
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

// ==================== Simple 10x10 Ground ====================

function SimpleGround() {
  return (
    <mesh
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#3d6b2d" roughness={0.8} />
    </mesh>
  );
}

// ==================== Erase Cursor ====================

function EraseCursor({ size }: { size: number }) {
  const { camera, raycaster, pointer } = useThree();
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const groundPlane = useRef<THREE.Mesh | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (!cursorRef.current || !groundPlane.current) return;

    const rect = document.body.getBoundingClientRect();
    pointer.x = ((mousePosRef.current.x - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((mousePosRef.current.y - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(groundPlane.current);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      cursorRef.current.position.set(point.x, 0.1, point.z);
      cursorRef.current.scale.setScalar(size / 1.5);
      cursorRef.current.visible = true;
    } else {
      cursorRef.current.visible = false;
    }
  });

  return (
    <>
      <mesh
        ref={groundPlane}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={cursorRef} visible={false}>
        <sphereGeometry args={[size / 2, 16, 16]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// ==================== Category Section Component ====================

function CategorySection({ 
  title, 
  isExpanded, 
  onToggle, 
  children 
}: { 
  title: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '8px', border: '1px solid #555', borderRadius: '4px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '8px',
          background: '#444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{title}</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div style={{ padding: '8px', background: '#222' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ==================== Ground Click Handler ====================

function GroundClickHandler({ 
  selectedAsset, 
  eraseMode,
  eraseBrushSize,
  placedAssets,
  isDragging,
  setIsDragging,
  dragStart,
  setDragStart,
  onPlaceAsset,
  onEraseAsset,
}: { 
  selectedAsset: string | null; 
  eraseMode: boolean;
  eraseBrushSize: number;
  placedAssets: Array<{ id: string; position: [number, number, number] }>;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  dragStart: THREE.Vector3 | null;
  setDragStart: (value: THREE.Vector3 | null) => void;
  onPlaceAsset: (data: { position: [number, number, number]; rotation: number; scale: number }) => void;
  onEraseAsset: (id: string) => void;
}) {
  const { camera, raycaster, pointer } = useThree();
  const groundPlane = useRef<THREE.Mesh | null>(null);
  const placedAssetsRef = useRef(placedAssets);
  
  // Keep ref updated to avoid stale closures
  useEffect(() => {
    placedAssetsRef.current = placedAssets;
  }, [placedAssets]);

  useEffect(() => {
    if (!selectedAsset && !eraseMode) return;

    const getWorldPosition = (event: MouseEvent): THREE.Vector3 | null => {
      if (!groundPlane.current) return null;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(groundPlane.current);
      
      if (intersects.length > 0) {
        return intersects[0].point;
      }
      return null;
    };

    const handleMouseUp = (event: MouseEvent) => {
      // Ignore clicks on buttons or UI elements (asset panel, dialogs, etc.)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' || 
        target.closest('button') || 
        target.closest('input') ||
        target.closest('[role="dialog"]') ||
        // Check if click is in the left sidebar area (asset panel)
        (event.clientX < 250 && event.clientY > 80)
      ) {
        return;
      }

      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        return;
      }

      if (!groundPlane.current) return;

      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      // Clamp to 10x10 area (-5 to +5)
      if (Math.abs(worldPos.x) > 5 || Math.abs(worldPos.z) > 5) return;

      if (eraseMode) {
        try {
          const eraseRadius = eraseBrushSize;
          const assetsToErase: string[] = [];
          // Use ref to get current assets to avoid stale closure
          const currentAssets = placedAssetsRef.current;
          
          if (currentAssets && Array.isArray(currentAssets) && currentAssets.length > 0) {
            for (const asset of currentAssets) {
              if (!asset || !asset.position) continue;
              const distance = Math.sqrt(
                Math.pow(asset.position[0] - worldPos.x, 2) +
                Math.pow(asset.position[2] - worldPos.z, 2)
              );
              if (distance < eraseRadius) {
                assetsToErase.push(asset.id);
              }
            }
            // Erase all found assets
            assetsToErase.forEach(id => {
              try {
                onEraseAsset(id);
              } catch (err) {
                console.error('Error erasing asset:', err);
              }
            });
          }
        } catch (error) {
          console.error('Error in erase handler:', error);
        }
      } else if (selectedAsset) {
        const newPosition: [number, number, number] = [worldPos.x, 0, worldPos.z];
        const rotation = Math.random() * Math.PI * 2;
        const scale = 0.8 + Math.random() * 0.4;
        onPlaceAsset({ position: newPosition, rotation, scale });
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedAsset, eraseMode, eraseBrushSize, isDragging, dragStart, camera, raycaster, pointer, onPlaceAsset, onEraseAsset, setIsDragging, setDragStart]);

  return (
    <mesh
      ref={groundPlane}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// ==================== Main Component ====================

export function TileCreation() {
  const navigate = useNavigate();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const exportRootRef = useRef<THREE.Group | null>(null);
  const [showAssetPanel, setShowAssetPanel] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [placedAssets, setPlacedAssets] = useState<Array<{ id: string; type: string; position: [number, number, number]; rotation: number; scale: number; variant?: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['nature']));
  const [eraseBrushSize, setEraseBrushSize] = useState(2);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [tileName, setTileName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedTiles, setSavedTiles] = useState<string[]>([]);
  const [zoomDistance, setZoomDistance] = useState(10);

  const grassTypes = ['Grass_Common_Short', 'Grass_Common_Tall', 'Grass_Wispy_Short', 'Grass_Wispy_Tall'];
  const pebbleTypes = ['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Round_4', 'Pebble_Round_5'];
  // Flowers:
  // - "Small" should be the flatter flowers (Petals)
  // - "Large" should be the upright single flowers
  const flowerSmallTypes = ['Petal_1', 'Petal_2', 'Petal_3', 'Petal_4', 'Petal_5'];
  const flowerLargeTypes = ['Flower_3_Single', 'Flower_4_Single'];

  const makeId = () => `placed-${Date.now()}-${Math.random()}`;

  // Base grass: store transforms for a single InstancedMesh (performance + "one mesh" export)
  type GrassInstance = {
    position: [number, number, number];
    rotationY: number;
    scale: number;
  };

  // Shared base grass generation function (same as MinimalDemo and WorldFromTiles)
  const generateBaseGrass = useCallback((): GrassInstance[] => {
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
  }, []);

  const [baseGrassInstances, setBaseGrassInstances] = useState<GrassInstance[]>([]);
  const baseGrassVariant = 'Grass_Common_Short'; // single model for instancing (fast)

  // Load saved tiles list on mount
  useEffect(() => {
    const tiles = Object.keys(localStorage).filter(key => key.startsWith('tile_'));
    setSavedTiles(tiles.map(key => key.replace('tile_', '')));
  }, []);

  // Default: start every fresh tile with a dense tiny grass carpet (if empty)
  useEffect(() => {
    setBaseGrassInstances((prev) => (prev.length === 0 ? generateBaseGrass() : prev));
  }, [generateBaseGrass]);

  // Keep camera distance in sync with the zoom slider (in addition to mousewheel zoom)
  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(zoomDistance, zoomDistance, zoomDistance);
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current?.update?.();
  }, [zoomDistance]);

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const exportAndStoreTileGLB = useCallback(async (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!exportRootRef.current) {
        reject(new Error('No export root'));
        return;
      }

      // Collect meshes under export root
      const allMeshes: THREE.Mesh[] = [];
      exportRootRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          allMeshes.push(child);
        }
      });
      if (allMeshes.length === 0) {
        reject(new Error('No meshes to export'));
        return;
      }

      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];
      allMeshes.forEach((mesh) => {
        const source = mesh.geometry as THREE.BufferGeometry | undefined;
        if (!source) return;

        // Normalize attributes so all geometries are compatible:
        // keep only position/normal/uv, drop color / skin / morph attributes.
        const geom = new THREE.BufferGeometry();
        const pos = source.getAttribute('position');
        if (!pos) return;
        geom.setAttribute('position', pos.clone());

        const normal = source.getAttribute('normal');
        if (normal) geom.setAttribute('normal', normal.clone());

        const uv = source.getAttribute('uv');
        if (uv) geom.setAttribute('uv', uv.clone());

        if (source.index) {
          geom.setIndex(source.index.clone());
        }

        // Ensure no morph attributes so Mesh.updateMorphTargets won't choke
        geom.morphAttributes = {};
        // Apply world transform
        geom.applyMatrix4(mesh.matrixWorld);

        geometries.push(geom);

        if (mesh.material) {
          materials.push(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);
        }
      });
      if (geometries.length === 0) {
        reject(new Error('No geometries to merge'));
        return;
      }

      // Merge into ONE mesh but keep multiple materials via geometry groups
      // This preserves textures across different assets inside the tile.
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true);
      const mergedMesh = new THREE.Mesh(
        mergedGeometry,
        materials.length > 0 ? materials : new THREE.MeshStandardMaterial({ color: 0xffffff })
      );

      const scene = new THREE.Scene();
      scene.add(mergedMesh);

      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (result) => {
          const output = result as ArrayBuffer;
          const blob = new Blob([output], { type: 'model/gltf-binary' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            localStorage.setItem(`tile_glb_${name}`, base64);
            resolve();
          };
          reader.onerror = () => reject(new Error('Failed to encode GLB'));
          reader.readAsDataURL(blob);
        },
        (error) => reject(error),
        { 
          binary: true,
          includeCustomExtensions: true,
          // Ensure textures are embedded
          embedImages: true
        }
      );
    });
  }, []);

  const handleSaveConfirm = async () => {
    if (!tileName.trim()) {
      alert('Please enter a tile name');
      return;
    }
    // Add collision metadata to trees and rocks
    const assetsWithCollision = placedAssets.map(asset => {
      // Only LARGE trees/rocks collide (grass/flowers/small stones have no collision)
      const isLarge = (asset.scale ?? 1) >= 1.0;
      const hasCollision = (asset.type === 'tree' || asset.type === 'rock') && isLarge;
      return {
        ...asset,
        hasCollision, // Mark trees and rocks as having collision
        collisionRadius: hasCollision ? (asset.type === 'tree' ? 1.5 * asset.scale : 0.8 * asset.scale) : undefined,
      };
    });
    
    const tileData = {
      assets: assetsWithCollision,
      createdAt: new Date().toISOString(),
      format: 'single_glb', // From this point on: always a single merged mesh GLB
      version: '1.0',
    };
    const name = tileName.trim();
    try {
      localStorage.setItem(`tile_${name}`, JSON.stringify(tileData));
      // Merge + store GLB (single mesh)
      await exportAndStoreTileGLB(name);
      setShowSaveDialog(false);
      setTileName('');
      // Update saved tiles list
      const tiles = Object.keys(localStorage).filter(key => key.startsWith('tile_'));
      setSavedTiles(tiles.map(key => key.replace('tile_', '')));
      alert(`Tile "${name}" saved successfully!\n\nFormat: Single merged GLB\nCollisions: Large trees/rocks only`);
    } catch (e) {
      console.error('Error saving tile/glb:', e);
      alert('Error saving tile. Check console for details.');
    }
  };

  const handleLoad = () => {
    setShowLoadDialog(true);
  };

  const handleLoadTile = (name: string) => {
    const tileData = localStorage.getItem(`tile_${name}`);
    if (tileData) {
      try {
        const parsed = JSON.parse(tileData);
        const loadedAssets = parsed.assets || [];
        setPlacedAssets(loadedAssets);
        setShowLoadDialog(false);
        const format = parsed.format || 'multiple_meshes';
        const collisionCount = loadedAssets.filter((a: any) => a.hasCollision).length;
        alert(`Tile "${name}" loaded successfully!\n\nFormat: ${format}\nAssets: ${loadedAssets.length}\nWith Collision: ${collisionCount}`);
      } catch (error) {
        console.error('Error loading tile:', error);
        alert('Error loading tile');
      }
    }
  };

  const handleNew = () => {
    if (confirm('Create a new tile? This will clear all placed assets.')) {
      setPlacedAssets([]);
      setBaseGrassInstances(generateBaseGrass());
      setSelectedAsset(null);
      setEraseMode(false);
    }
  };

  // No manual export button anymore; Save always stores a merged single-mesh GLB.

  function BaseGrassInstanced({ instances }: { instances: GrassInstance[] }) {
    const [meshData, setMeshData] = useState<{ geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] } | null>(null);
    const instRef = useRef<THREE.InstancedMesh | null>(null);

    useEffect(() => {
      const loader = new GLTFLoader();
      const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${baseGrassVariant}.gltf`;
      loader.load(
        assetPath,
        (gltf) => {
          let found: THREE.Mesh | null = null;
          gltf.scene.traverse((o) => {
            if (!found && o instanceof THREE.Mesh) found = o;
          });
          if (!found) return;
          const mesh = found as THREE.Mesh;
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
        dummy.position.set(it.position[0], it.position[1], it.position[2]);
        dummy.rotation.set(0, it.rotationY, 0);
        dummy.scale.setScalar(it.scale);
        dummy.updateMatrix();
        instRef.current!.setMatrixAt(i, dummy.matrix);
      });
      instRef.current.instanceMatrix.needsUpdate = true;
    }, [instances, meshData]);

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

      {/* Save/Load/New Buttons */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {/* Zoom slider */}
        <div style={{
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
            <span>{zoomDistance.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="0.5"
            value={zoomDistance}
            onChange={(e) => setZoomDistance(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <button
          onClick={handleNew}
          style={{
            padding: '10px 20px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          New
        </button>
        <button
          onClick={handleLoad}
          style={{
            padding: '10px 20px',
            background: '#4a9eff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Load
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            background: '#3d6b2d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Save
        </button>
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
            <h2 style={{ marginTop: 0 }}>Save Tile</h2>
            <input
              type="text"
              value={tileName}
              onChange={(e) => setTileName(e.target.value)}
              placeholder="Enter tile name"
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
                  handleSaveConfirm();
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTileName('');
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
                onClick={handleSaveConfirm}
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

      {/* Load Dialog */}
      {showLoadDialog && (
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
            maxHeight: '500px',
            overflowY: 'auto',
          }}>
            <h2 style={{ marginTop: 0 }}>Load Tile</h2>
            {savedTiles.length === 0 ? (
              <p>No saved tiles found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedTiles.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleLoadTile(name)}
                    style={{
                      padding: '10px',
                      background: '#444',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadDialog(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                width: '100%',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Asset Panel Toggle Button */}
      {!showAssetPanel && (
        <button 
          onClick={() => setShowAssetPanel(true)}
          style={{
            position: 'absolute',
            top: '80px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '5px',
            cursor: 'pointer',
            padding: '10px 15px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          ▶ Assets
        </button>
      )}

      {/* Asset Placement Panel */}
      {showAssetPanel && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            padding: '15px',
            borderRadius: '5px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px',
            width: '200px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Assets</h3>
            <button 
              onClick={() => setShowAssetPanel(false)}
              style={{
                background: '#555',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                padding: '5px 8px',
                fontSize: '10px',
              }}
            >
              ◀
            </button>
          </div>
          <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Erase Button */}
            <button
              onClick={() => {
                setEraseMode(!eraseMode);
                setSelectedAsset(null);
              }}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                background: eraseMode ? '#ff4444' : '#555',
                color: 'white',
                border: eraseMode ? '2px solid #fff' : '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              {eraseMode ? '✕ Erase Mode ON' : '✕ Erase'}
            </button>
            
            {eraseMode && (
              <div style={{ marginBottom: '10px', padding: '8px', background: '#333', borderRadius: '4px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>
                  Erase Size: {eraseBrushSize.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={eraseBrushSize}
                  onChange={(e) => setEraseBrushSize(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* Nature Category */}
            <CategorySection
              title="Nature"
              isExpanded={expandedCategories.has('nature')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('nature')) {
                  newSet.delete('nature');
                } else {
                  newSet.add('nature');
                }
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Trees - Small and Large side by side */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAsset('tree_small'); setEraseMode(false); }}
                    title="Place Small Tree"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'tree_small' ? '#4a9eff' : '#3d6b2d',
                      border: selectedAsset === 'tree_small' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    🌳
                  </button>
                  <button
                    onClick={() => { setSelectedAsset('tree_large'); setEraseMode(false); }}
                    title="Place Large Tree"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'tree_large' ? '#4a9eff' : '#2d5016',
                      border: selectedAsset === 'tree_large' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    🌲
                  </button>
                </div>
                {/* Rocks - Small and Large side by side */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAsset('rock_small'); setEraseMode(false); }}
                    title="Place Small Rock"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'rock_small' ? '#4a9eff' : '#666666',
                      border: selectedAsset === 'rock_small' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    🪨
                  </button>
                  <button
                    onClick={() => { setSelectedAsset('rock_large'); setEraseMode(false); }}
                    title="Place Large Rock"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'rock_large' ? '#4a9eff' : '#444444',
                      border: selectedAsset === 'rock_large' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    ⛰️
                  </button>
                </div>
                {/* Grass - Small and Large side by side */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAsset('grass_small'); setEraseMode(false); }}
                    title="Place Small Grass (half-size)"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'grass_small' ? '#4a9eff' : '#3d6b2d',
                      border: selectedAsset === 'grass_small' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    🌱
                  </button>
                  <button
                    onClick={() => { setSelectedAsset('grass_large'); setEraseMode(false); }}
                    title="Place Large Grass"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'grass_large' ? '#4a9eff' : '#2e5a22',
                      border: selectedAsset === 'grass_large' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    🌾
                  </button>
                </div>
                {/* Flowers - Small (flat petals) and Large (single flowers) side by side */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAsset('flower_small'); setEraseMode(false); }}
                    title="Place Small Flat Flowers"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'flower_small' ? '#4a9eff' : '#ff69b4',
                      border: selectedAsset === 'flower_small' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    🌸
                  </button>
                  <button
                    onClick={() => { setSelectedAsset('flower_large'); setEraseMode(false); }}
                    title="Place Large Flowers"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAsset === 'flower_large' ? '#4a9eff' : '#d94a9a',
                      border: selectedAsset === 'flower_large' ? '2px solid #fff' : '1px solid #555',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    💐
                  </button>
                </div>
                {/* Pebble button - no small/large variants */}
                <button
                  onClick={() => { setSelectedAsset('pebble'); setEraseMode(false); }}
                  title="Place Pebble"
                  style={{
                    width: '100%',
                    height: '40px',
                    background: selectedAsset === 'pebble' ? '#4a9eff' : '#666666',
                    border: selectedAsset === 'pebble' ? '2px solid #fff' : '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🪨
                </button>
              </div>
            </CategorySection>

            {selectedAsset && !eraseMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#4a9eff', textAlign: 'center' }}>
                Selected: {selectedAsset}
              </p>
            )}
            {eraseMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#ff4444', textAlign: 'center' }}>
                Click assets to delete
              </p>
            )}
          </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [8, 8, 8], near: 0.1, far: 1000 }}>
        <PerspectiveCamera ref={cameraRef} makeDefault position={[zoomDistance, zoomDistance, zoomDistance]} fov={50} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={40}
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

        {/* Export root: everything inside gets exported as one GLB file */}
        <group ref={exportRootRef}>
          {/* Simple 10x10 green ground */}
          <SimpleGround />

          {/* Base grass carpet as ONE instanced mesh (fast) */}
          <BaseGrassInstanced instances={baseGrassInstances} />

          {/* Placed assets (user-placed) */}
          {placedAssets.map(asset => {
            if (asset.type === 'grass') {
              const type = asset.variant || grassTypes[Math.floor(Math.random() * grassTypes.length)];
              return (
                <GrassPatch 
                  key={asset.id} 
                  position={asset.position} 
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
                  position={asset.position} 
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
                  position={asset.position} 
                  rotation={asset.rotation}
                  type={type}
                  scale={asset.scale || 1.5}
                />
              );
            } else {
              return (
                <PlacedAsset 
                  key={asset.id} 
                  assetType={asset.type} 
                  position={asset.position} 
                  rotation={asset.rotation}
                  scale={asset.scale}
                />
              );
            }
          })}
        </group>

        {/* Cursor indicators */}
        {eraseMode && <EraseCursor size={eraseBrushSize} />}
        
        {/* Ground click handler */}
        <GroundClickHandler
          selectedAsset={selectedAsset}
          eraseMode={eraseMode}
          eraseBrushSize={eraseBrushSize}
          placedAssets={placedAssets}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          dragStart={dragStart}
          setDragStart={setDragStart}
          onPlaceAsset={(data) => {
            if (selectedAsset) {
              const id = makeId();
              let variant: string | undefined;
              let finalScale = data.scale;
              let assetType = selectedAsset;
              
              // Handle tree sizes
              if (selectedAsset === 'tree_small') {
                assetType = 'tree';
                finalScale = 0.35 + Math.random() * 0.15; // Small: 0.35-0.50 (very obvious)
              } else if (selectedAsset === 'tree_large') {
                assetType = 'tree';
                finalScale = 1.6 + Math.random() * 0.6; // Large: 1.6-2.2 (very obvious)
              }
              // Handle rock sizes
              else if (selectedAsset === 'rock_small') {
                assetType = 'rock';
                finalScale = 0.4 + Math.random() * 0.2; // Small: 0.4-0.6
              } else if (selectedAsset === 'rock_large') {
                assetType = 'rock';
                finalScale = 1.3 + Math.random() * 0.5; // Large: 1.3-1.8
              }
              // Handle grass sizes (small is half of large)
              else if (selectedAsset === 'grass_small') {
                assetType = 'grass';
                variant = grassTypes[Math.floor(Math.random() * grassTypes.length)];
                finalScale = 0.75; // half of 1.5
              } else if (selectedAsset === 'grass_large') {
                assetType = 'grass';
                variant = grassTypes[Math.floor(Math.random() * grassTypes.length)];
                finalScale = 1.5;
              }
              // Handle flowers sizes: keep scale the same, but choose flat petals for "small"
              else if (selectedAsset === 'flower_small') {
                assetType = 'flower';
                variant = flowerSmallTypes[Math.floor(Math.random() * flowerSmallTypes.length)];
                finalScale = 0.2; // tiny – same scale as small grass
              } else if (selectedAsset === 'flower_large') {
                assetType = 'flower';
                variant = flowerLargeTypes[Math.floor(Math.random() * flowerLargeTypes.length)];
                finalScale = 0.2; // keep flowers small per request
              }
              // Back-compat single buttons
              else if (selectedAsset === 'grass') {
                assetType = 'grass';
                variant = grassTypes[Math.floor(Math.random() * grassTypes.length)];
                finalScale = 1.5;
              } else if (selectedAsset === 'flower') {
                assetType = 'flower';
                // default to flat, small flowers
                variant = flowerSmallTypes[Math.floor(Math.random() * flowerSmallTypes.length)];
                finalScale = 0.2;
              } else if (selectedAsset === 'pebble') {
                assetType = 'pebble';
                variant = pebbleTypes[Math.floor(Math.random() * pebbleTypes.length)];
                finalScale = 1.2; // visible above base grass
              }
              
              setPlacedAssets(prev => [...prev, {
                id,
                type: assetType,
                // lift stones a hair so they sit above the grass carpet
                position: assetType === 'pebble' ? [data.position[0], 0.03, data.position[2]] : data.position,
                rotation: data.rotation,
                scale: finalScale,
                variant,
              }]);
            }
          }}
          onEraseAsset={(id) => {
            setPlacedAssets(prev => prev.filter(asset => asset.id !== id));
          }}
        />
      </Canvas>
    </div>
  );
}

export default TileCreation;
