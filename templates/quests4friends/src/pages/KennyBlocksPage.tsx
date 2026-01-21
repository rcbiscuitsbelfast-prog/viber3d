import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as LZString from 'lz-string';

// ==================== ASSET CATALOGUE ====================

interface AssetInfo {
  name: string;
  path: string;
  category: string;
  pack: string;
  defaultScale?: number;
  scaleRange?: [number, number]; // Min/max for randomization
  rotationSnap?: number; // Snap rotation to degrees (e.g., 90 for cardinal directions)
  allowRandomRotation?: boolean;
  collision?: { width: number; height: number; depth: number }; // Collision box dimensions
}

const ASSET_REGISTRY: Record<string, AssetInfo[]> = {
  // Kenny Platformer Kit - Blocks (existing)
  blocks: [
    // (Blocks are handled separately via blockCategories)
  ],
  
  // Kenny Platformer Kit - Trees
  trees: [
    { name: 'Tree', path: '/Assets/kenney_platformer-kit/Models/GLB format/tree.glb', category: 'Trees', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.8, 1.3], allowRandomRotation: true, collision: { width: 0.8, height: 2.5, depth: 0.8 } },
    { name: 'Tree Pine', path: '/Assets/kenney_platformer-kit/Models/GLB format/tree-pine.glb', category: 'Trees', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.8, 1.4], allowRandomRotation: true, collision: { width: 0.8, height: 2.8, depth: 0.8 } },
    { name: 'Tree Pine Small', path: '/Assets/kenney_platformer-kit/Models/GLB format/tree-pine-small.glb', category: 'Trees', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.6, 1.2], allowRandomRotation: true, collision: { width: 0.6, height: 1.8, depth: 0.6 } },
    { name: 'Tree Snow', path: '/Assets/kenney_platformer-kit/Models/GLB format/tree-snow.glb', category: 'Trees', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.8, 1.3], allowRandomRotation: true, collision: { width: 0.8, height: 2.5, depth: 0.8 } },
  ],
  
  // Kenny Platformer Kit - Rocks & Stones
  rocks: [
    { name: 'Rocks', path: '/Assets/kenney_platformer-kit/Models/GLB format/rocks.glb', category: 'Rocks', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.7, 1.5], allowRandomRotation: true, collision: { width: 1.2, height: 0.8, depth: 1.2 } },
    { name: 'Stones', path: '/Assets/kenney_platformer-kit/Models/GLB format/stones.glb', category: 'Rocks', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.7, 1.5], allowRandomRotation: true, collision: { width: 1.0, height: 0.6, depth: 1.0 } },
    { name: 'Barrel', path: '/Assets/kenney_platformer-kit/Models/GLB format/barrel.glb', category: 'Rocks', pack: 'Kenney', defaultScale: 0.5, scaleRange: [0.4, 0.8], allowRandomRotation: true, collision: { width: 0.6, height: 0.8, depth: 0.6 } },
    { name: 'Crate', path: '/Assets/kenney_platformer-kit/Models/GLB format/crate.glb', category: 'Rocks', pack: 'Kenney', defaultScale: 0.5, scaleRange: [0.4, 0.8], allowRandomRotation: true, collision: { width: 1.0, height: 1.0, depth: 1.0 } },
    { name: 'Crate Strong', path: '/Assets/kenney_platformer-kit/Models/GLB format/crate-strong.glb', category: 'Rocks', pack: 'Kenney', defaultScale: 0.5, scaleRange: [0.4, 0.8], allowRandomRotation: true, collision: { width: 1.0, height: 1.0, depth: 1.0 } },
    { name: 'Chest', path: '/Assets/kenney_platformer-kit/Models/GLB format/chest.glb', category: 'Rocks', pack: 'Kenney', defaultScale: 0.5, scaleRange: [0.4, 0.8], allowRandomRotation: false, collision: { width: 1.0, height: 0.8, depth: 0.6 } },
  ],
  
  // Kenny Platformer Kit - Plants & Vegetation
  plants: [
    { name: 'Grass', path: '/Assets/kenney_platformer-kit/Models/GLB format/grass.glb', category: 'Plants', pack: 'Kenney', defaultScale: 0.8, scaleRange: [0.6, 1.2], allowRandomRotation: true },
    { name: 'Plant', path: '/Assets/kenney_platformer-kit/Models/GLB format/plant.glb', category: 'Plants', pack: 'Kenney', defaultScale: 0.8, scaleRange: [0.7, 1.3], allowRandomRotation: true },
    { name: 'Flowers', path: '/Assets/kenney_platformer-kit/Models/GLB format/flowers.glb', category: 'Plants', pack: 'Kenney', defaultScale: 0.6, scaleRange: [0.5, 1.0], allowRandomRotation: true },
    { name: 'Flowers Tall', path: '/Assets/kenney_platformer-kit/Models/GLB format/flowers-tall.glb', category: 'Plants', pack: 'Kenney', defaultScale: 0.7, scaleRange: [0.6, 1.1], allowRandomRotation: true },
    { name: 'Mushrooms', path: '/Assets/kenney_platformer-kit/Models/GLB format/mushrooms.glb', category: 'Plants', pack: 'Kenney', defaultScale: 0.6, scaleRange: [0.5, 1.0], allowRandomRotation: true },
    { name: 'Hedge', path: '/Assets/kenney_platformer-kit/Models/GLB format/hedge.glb', category: 'Plants', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.7, 1.3], allowRandomRotation: false },
  ],
  
  // Kenny Platformer Kit - Decorative Elements
  decorative: [
    { name: 'Poles', path: '/Assets/kenney_platformer-kit/Models/GLB format/poles.glb', category: 'Decorative', pack: 'Kenney', defaultScale: 0.8, scaleRange: [0.7, 1.3], allowRandomRotation: false },
    { name: 'Sign', path: '/Assets/kenney_platformer-kit/Models/GLB format/sign.glb', category: 'Decorative', pack: 'Kenney', defaultScale: 0.8, scaleRange: [0.7, 1.2], allowRandomRotation: false },
    { name: 'Flag', path: '/Assets/kenney_platformer-kit/Models/GLB format/flag.glb', category: 'Decorative', pack: 'Kenney', defaultScale: 0.7, scaleRange: [0.6, 1.0], allowRandomRotation: false },
    { name: 'Ladder', path: '/Assets/kenney_platformer-kit/Models/GLB format/ladder.glb', category: 'Decorative', pack: 'Kenney', defaultScale: 1.0, scaleRange: [0.8, 1.2], allowRandomRotation: false },
  ],
};

// Helper to randomize asset properties
function randomizeAsset(asset: AssetInfo): { scale: number; rotation: number } {
  const scale = asset.scaleRange 
    ? asset.scaleRange[0] + Math.random() * (asset.scaleRange[1] - asset.scaleRange[0])
    : (asset.defaultScale || 1.0);
  
  let rotation = 0;
  if (asset.allowRandomRotation) {
    if (asset.rotationSnap) {
      const steps = 360 / asset.rotationSnap;
      rotation = (Math.floor(Math.random() * steps) * asset.rotationSnap) * (Math.PI / 180);
    } else {
      rotation = Math.random() * Math.PI * 2;
    }
  }
  
  return { scale, rotation };
}

// ==================== END ASSET CATALOGUE ====================

// ==================== Type Definitions ====================

interface PlacedAssetData {
  id: string;
  asset: AssetInfo;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

// ==================== END TYPE DEFINITIONS ====================
const DB_NAME = 'kenny-blocks-db';
const STORE_NAME = 'glb';

function openGlbDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
  });
}

async function storeGlbInDb(key: string, data: string) {
  try {
    const db = await openGlbDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('indexedDB write failed'));
    });
  } catch (err) {
    console.warn('IDB store failed, falling back to localStorage', err);
    localStorage.setItem(key, data);
  }
}

async function getGlbFromDb(key: string): Promise<string | null> {
  try {
    const db = await openGlbDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => reject(req.error || new Error('indexedDB read failed'));
    });
  } catch (err) {
    console.warn('IDB read failed, falling back to localStorage', err);
    return localStorage.getItem(key);
  }
}

// ==================== Placed Block Component ====================

interface PlacedBlockProps {
  blockType: string;
  position: [number, number, number];
  rotation?: number; // Y rotation in radians
  scale?: number;
  showCollisionBox?: boolean;
  isSelected?: boolean;
}

function PlacedBlock({ blockType, position, rotation = 0, scale = 1.0, showCollisionBox = false, isSelected = false }: PlacedBlockProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [blockScene, setBlockScene] = useState<THREE.Group | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const loader = new GLTFLoader();
    // Load from downloaded Kenny platformer kit
    const blockPath = `/Assets/kenney_platformer-kit/Models/GLB%20format/${blockType}.glb`;

    loader.load(
      blockPath,
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
        setBlockScene(cloned);
      },
      undefined,
      (error) => {
        console.warn(`[PlacedBlock] Failed to load ${blockType}:`, error);
      }
    );
  }, [blockType, scale]);

  // Animate block placement with scale-up effect
  useFrame((_, delta) => {
    if (animProgress < 1) {
      setAnimProgress((prev) => Math.min(prev + delta * 4, 1));
      if (groupRef.current) {
        const eased = 1 - Math.pow(1 - animProgress, 3); // Ease-out cubic
        groupRef.current.scale.setScalar(eased);
      }
    }
  });

  if (!blockScene) {
    // Placeholder cube
    return (
      <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B7355" />
        </mesh>
      </group>
    );
  }

  // Create collision mesh from actual geometry
  const collisionMesh = blockScene.clone();
  collisionMesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshBasicMaterial({
        color: '#00ff00',
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={blockScene} />
      {showCollisionBox && <primitive object={collisionMesh} />}
      {isSelected && (
        <mesh position={[0, scale / 2, 0]}>
          <boxGeometry args={[scale * 1.2, scale * 1.2, scale * 1.2]} />
          <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ==================== Placed Asset Component (memoized & stable) ====================

function PlacedAsset({ asset, position, rotation = 0, scale = 1.0, showCollisionBox = false }: { asset: AssetInfo; position: [number, number, number]; rotation?: number; scale?: number; showCollisionBox?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [assetScene, setAssetScene] = useState<THREE.Group | null>(null);
  const [collisionGeom, setCollisionGeom] = useState<THREE.BufferGeometry | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  // Cache loader to avoid recreating it
  const loaderRef = useRef<GLTFLoader | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loaderRef.current) {
      loaderRef.current = new GLTFLoader();
    }

    // Create abort controller for cleanup
    loadAbortRef.current = new AbortController();
    const abortSignal = loadAbortRef.current.signal;

    const finalScale = scale * (asset.defaultScale || 1.0);

    loaderRef.current.load(
      asset.path,
      (gltf) => {
        if (abortSignal.aborted) return;

        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(finalScale);
        cloned.updateMatrixWorld(true);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setAssetScene(cloned);

        // Extract collision geometry once
        if (asset.collision) {
          const geometries: THREE.BufferGeometry[] = [];
          cloned.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              const geo = child.geometry as THREE.BufferGeometry;
              const clonedGeo = geo.clone();
              clonedGeo.applyMatrix4(child.matrixWorld);
              geometries.push(clonedGeo);
            }
          });

          if (geometries.length > 0) {
            try {
              const merged = BufferGeometryUtils.mergeGeometries(geometries, true);
              setCollisionGeom(merged);
            } catch (e) {
              console.warn(`[PlacedAsset] Failed to merge collision geometry for ${asset.name}`);
            }
          }
        }
      },
      undefined,
      (error) => {
        if (!abortSignal.aborted) {
          console.error(`[PlacedAsset] Failed to load ${asset.name}:`, error);
        }
      }
    );

    return () => {
      // Cancel pending load on unmount
      loadAbortRef.current?.abort();
    };
  }, [asset.path, asset.name, asset.defaultScale, scale, asset.collision]);

  // Animate asset placement with easing
  useFrame((_, delta) => {
    if (animProgress < 1 && groupRef.current) {
      setAnimProgress((prev) => {
        const next = Math.min(prev + delta * 4, 1);
        const eased = 1 - Math.pow(1 - next, 3);
        groupRef.current!.scale.setScalar(eased);
        return next;
      });
    }
  });

  if (!assetScene) {
    return (
      <group ref={groupRef} position={position} rotation={[0, rotation, 0]} scale={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e74c3c" wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={assetScene} />
      {showCollisionBox && asset.collision && collisionGeom && (
        <mesh geometry={collisionGeom}>
          <meshStandardMaterial 
            color="#f1c40f" 
            wireframe 
            transparent 
            opacity={0.3}
            emissive="#f39c12"
          />
        </mesh>
      )}
    </group>
  );
}

// Memoize PlacedAsset to prevent re-renders when parent updates
const MemoizedPlacedAsset = React.memo(PlacedAsset, (prevProps, nextProps) => {
  return (
    prevProps.asset.path === nextProps.asset.path &&
    prevProps.position[0] === nextProps.position[0] &&
    prevProps.position[1] === nextProps.position[1] &&
    prevProps.position[2] === nextProps.position[2] &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.scale === nextProps.scale &&
    prevProps.showCollisionBox === nextProps.showCollisionBox
  );
});

// ==================== Camera Controller ====================

function CameraController({ 
  zoomDistance, 
  cameraRotation,
  cameraPitch,
  controlMode,
  controlsRef,
  onCameraUpdate
}: { 
  zoomDistance: number; 
  cameraRotation: number;
  cameraPitch: number;
  controlMode: 'pan' | 'rotate' | 'none';
  controlsRef: React.MutableRefObject<any>;
  onCameraUpdate: (distance: number, rotation: number, pitch: number) => void;
}) {
  const { camera, gl } = useThree();
  const savedPosition = useRef({ x: 0, y: 0, z: 0 });
  const savedTarget = useRef({ x: 0, y: 0, z: 0 });
  const cameraLocked = useRef(false);
  const lastSliderValues = useRef({ rotation: 0, zoom: 0, pitch: 0 });
  const lastCalculatedValues = useRef({ rotation: 0, zoom: 0, pitch: 0 });
  
  // Save camera position when entering pan/rotate, restore when exiting
  useEffect(() => {
    if (controlMode === 'pan' || controlMode === 'rotate') {
      // Save current state when entering control modes
      savedPosition.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      };
      if (controlsRef.current) {
        savedTarget.current = {
          x: controlsRef.current.target.x,
          y: controlsRef.current.target.y,
          z: controlsRef.current.target.z
        };
      }
      lastSliderValues.current = { rotation: cameraRotation, zoom: zoomDistance, pitch: cameraPitch };
    } else if (controlMode === 'none') {
      // When exiting pan/rotate, keep the current camera position (do not reset)
      // Only apply slider changes if user explicitly moves a slider
      const rotationChanged = cameraRotation !== lastSliderValues.current.rotation;
      const zoomChanged = zoomDistance !== lastSliderValues.current.zoom;
      const pitchChanged = cameraPitch !== lastSliderValues.current.pitch;
      
      if (rotationChanged || zoomChanged || pitchChanged) {
        // User manually changed sliders while in normal mode - apply it
        cameraLocked.current = false;
        const angleRad = (cameraRotation * Math.PI) / 180;
        const pitchRad = (cameraPitch * Math.PI) / 180;
        const radius = zoomDistance;
        
        camera.position.x = Math.sin(angleRad) * Math.cos(pitchRad) * radius;
        camera.position.y = Math.sin(pitchRad) * radius;
        camera.position.z = Math.cos(angleRad) * Math.cos(pitchRad) * radius;
        
        if (controlsRef.current) {
          camera.lookAt(controlsRef.current.target);
        }
      } else if (cameraLocked.current) {
        // Camera is locked from pan/rotate - keep it locked (do not restore old position)
        // Just update the slider values to match current camera position
        if (controlsRef.current) {
          const relativePos = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
          const distance = relativePos.length();
          const rotation = Math.atan2(relativePos.x, relativePos.z) * 180 / Math.PI;
          const pitch = Math.asin(relativePos.y / distance) * 180 / Math.PI;
          onCameraUpdate(distance, (rotation + 360) % 360, pitch);
        }
      }
      lastSliderValues.current = { rotation: cameraRotation, zoom: zoomDistance, pitch: cameraPitch };
    }
  }, [controlMode, cameraRotation, zoomDistance, cameraPitch, camera, controlsRef]);
  
  // Pan mode - attach directly to canvas element
  useEffect(() => {
    if (controlMode !== 'pan' || !gl.domElement || !controlsRef.current) return;

    const canvas = gl.domElement;
    const controls = controlsRef.current;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) { // Left click only
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        e.preventDefault();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      
      // Pan using camera's right and up vectors for correct direction
      const moveSpeed = 0.05;
      
      // Get camera's right vector (for left/right movement)
      const right = new THREE.Vector3();
      right.setFromMatrixColumn(camera.matrix, 0);
      right.y = 0; // Keep movement horizontal
      right.normalize();
      
      // Get camera's forward vector (for up/down movement)
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; // Keep movement horizontal
      forward.normalize();
      
      // Calculate offset based on camera orientation
      const offset = new THREE.Vector3();
      offset.addScaledVector(right, deltaX * moveSpeed);
      offset.addScaledVector(forward, -deltaY * moveSpeed);
      
      // Move camera position
      camera.position.add(offset);
      
      // Move OrbitControls target so center point moves
      controls.target.add(offset);
      controls.update();
      
      // Mark camera as locked to this position
      cameraLocked.current = true;

      lastX = e.clientX;
      lastY = e.clientY;
      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging = false;
      e.preventDefault();
    };

    // Attach to canvas with capture phase
    canvas.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, [controlMode, gl, camera, controlsRef]);
  
  useFrame(() => {
    if (controlMode === 'none' && !cameraLocked.current) {
      // Only apply slider-based positioning if camera is not locked
      const angleRad = (cameraRotation * Math.PI) / 180;
      const pitchRad = (cameraPitch * Math.PI) / 180;
      const radius = zoomDistance;
      
      camera.position.x = Math.sin(angleRad) * Math.cos(pitchRad) * radius;
      camera.position.y = Math.sin(pitchRad) * radius;
      camera.position.z = Math.cos(angleRad) * Math.cos(pitchRad) * radius;
      
      if (controlsRef.current) {
        camera.lookAt(controlsRef.current.target);
      }
    } else if (controlMode === 'pan' || controlMode === 'rotate') {
      // Check if user manually adjusted sliders
      const rotationChanged = Math.abs(cameraRotation - lastCalculatedValues.current.rotation) > 0.1;
      const zoomChanged = Math.abs(zoomDistance - lastCalculatedValues.current.zoom) > 0.1;
      const pitchChanged = Math.abs(cameraPitch - lastCalculatedValues.current.pitch) > 0.1;
      
      if (rotationChanged || zoomChanged || pitchChanged) {
        // User manually adjusted slider - apply it to camera
        const angleRad = (cameraRotation * Math.PI) / 180;
        const pitchRad = (cameraPitch * Math.PI) / 180;
        const radius = zoomDistance;
        
        // Calculate new position relative to current target
        const target = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
        
        camera.position.x = target.x + Math.sin(angleRad) * Math.cos(pitchRad) * radius;
        camera.position.y = target.y + Math.sin(pitchRad) * radius;
        camera.position.z = target.z + Math.cos(angleRad) * Math.cos(pitchRad) * radius;
        
        camera.lookAt(target);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
      }
      
      // Track actual camera position and update sliders during pan/rotate
      cameraLocked.current = true;
      
      const target = controlsRef.current?.target || new THREE.Vector3(0, 0, 0);
      const relativePos = new THREE.Vector3().subVectors(camera.position, target);
      
      const distance = relativePos.length();
      const rotation = Math.atan2(relativePos.x, relativePos.z) * 180 / Math.PI;
      const pitch = Math.asin(relativePos.y / distance) * 180 / Math.PI;
      
      // Store calculated values before updating
      lastCalculatedValues.current = {
        rotation: (rotation + 360) % 360,
        zoom: distance,
        pitch: pitch
      };
      
      onCameraUpdate(distance, (rotation + 360) % 360, pitch);
    }
  });
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enableRotate={controlMode === 'rotate'}
      enablePan={false}
      enableZoom={controlMode !== 'pan'}
      enableDamping={true}
      dampingFactor={0.05}
      autoRotate={false}
      autoRotateSpeed={0}
    />
  );
}

// ==================== GhostAsset Preview (Defined Outside Main Component) ====================

interface GhostAssetProps {
  asset: AssetInfo;
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}

const GhostAsset = React.memo(function GhostAssetComponent({ asset, position, rotation = 0, scale = 1.0 }: GhostAssetProps) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const assetPathRef = useRef<string>('');
  
  useEffect(() => {
    // Only load if the asset path actually changed
    if (assetPathRef.current === asset.path) {
      // Asset already loaded, mark loading as done
      if (scene) {
        setIsLoading(false);
      }
      return;
    }
    
    // New asset, load it
    assetPathRef.current = asset.path;
    setIsLoading(true);
    setScene(null);
    
    const loader = new GLTFLoader();
    let isMounted = true;
    
    loader.load(
      asset.path,
      (gltf) => {
        if (!isMounted) return;
        
        const cloned = gltf.scene.clone();
        const finalScale = scale * (asset.defaultScale || 1.0);
        cloned.scale.setScalar(finalScale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.Material) = new THREE.MeshBasicMaterial({ 
              color: '#9b59b6', 
              transparent: true, 
              opacity: 0.35 
            });
            child.frustumCulled = false;
          }
        });
        setScene(cloned);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        if (!isMounted) return;
        console.warn(`[GhostAsset] Failed to load ${asset.name}:`, error);
        setIsLoading(false);
      }
    );
    
    return () => {
      isMounted = false;
    };
  }, [asset.path, asset.name, scale]);
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Render loaded asset or placeholder */}
      {!isLoading && scene ? (
        <primitive object={scene} />
      ) : (
        <mesh>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#9b59b6" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
});

// ==================== End GhostAsset ====================

// ==================== Simple Ground ====================
function SimpleGround({ showGrid, gridSize, groundPlaneRef, showOriginMarker }: { showGrid: boolean; gridSize: number; groundPlaneRef: React.MutableRefObject<THREE.Mesh | null>; showOriginMarker: boolean }) {
  return (
    <>
      {/* Invisible ground plane for raycasting - unlimited area */}
      <mesh
        ref={groundPlaneRef}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        visible={false}
      >
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial />
      </mesh>
      
      {/* Grid helper - adjustable size */}
      {showGrid && (
        <gridHelper args={[gridSize, Math.floor(gridSize / 10), '#666666', '#444444']} position={[0, 0.01, 0]} />
      )}
      
      {/* Origin Marker */}
      {showOriginMarker && (
        <group position={[0, 0.1, 0]}>
          {/* X axis - Red */}
          <mesh position={[2.5, 0, 0]}>
            <boxGeometry args={[5, 0.2, 0.2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          {/* Y axis - Green */}
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[0.2, 5, 0.2]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          {/* Z axis - Blue */}
          <mesh position={[0, 0, 2.5]}>
            <boxGeometry args={[0.2, 0.2, 5]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
          {/* Center sphere */}
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}
    </>
  );
}

// ==================== Block Click Handler ====================

function BlockClickHandler({
  selectedBlock,
  selectedAsset,
  assetRandomizeRotation,
  assetRandomizeScale,
  eraseBrushSize,
  eraseMode,
  placedBlocks,
  placedAssets,
  isDragging,
  setIsDragging,
  dragStart,
  setDragStart,
  onPlaceBlock,
  onPlaceAsset,
  onEraseBlock,
  onEraseAsset,
  groundPlaneRef,
  currentElevation,
  assetYOffset = 0,
  eraseTarget = 'blocks',
  setPreviewPosition,
  setErasePreview,
  measureMode,
  setMeasureStart,
  setMeasureEnd,
  adjustMode,
  onSelectBlock,
  cameraControlMode,
  getSurfaceHeight,
}: {
  selectedBlock: string | null;
  selectedAsset: AssetInfo | null;
  assetRandomizeRotation: boolean;
  assetRandomizeScale: boolean;
  eraseBrushSize: number;
  eraseMode: boolean;
  placedBlocks: Array<{ id: string; blockType: string; position: [number, number, number]; rotation: number; scale: number }>;
  placedAssets: PlacedAssetData[];
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  dragStart: THREE.Vector3 | null;
  setDragStart: (value: THREE.Vector3 | null) => void;
  onPlaceBlock: (data: { position: [number, number, number]; rotation: number; scale: number }) => void;
  onPlaceAsset: (data: { position: [number, number, number]; rotation: number; scale: number }) => void;
  onEraseBlock: (id: string) => void;
  onEraseAsset: (id: string) => void;
  groundPlaneRef: React.MutableRefObject<THREE.Mesh | null>;
  currentElevation: number;
  assetYOffset?: number;
  eraseTarget?: 'blocks' | 'assets';
  setPreviewPosition: (pos: [number, number, number] | null) => void;
  setErasePreview: (pos: [number, number, number] | null) => void;
  measureMode: boolean;
  setMeasureStart: (pos: THREE.Vector3 | null) => void;
  setMeasureEnd: (pos: THREE.Vector3 | null) => void;
  adjustMode: boolean;
  onSelectBlock: (id: string | null) => void;
  cameraControlMode: 'pan' | 'rotate' | 'none';
  getSurfaceHeight: (x: number, z: number) => number | null;
}) {
  const { camera, raycaster, pointer } = useThree();
  const placedBlocksRef = useRef(placedBlocks);
  const placedAssetsRef = useRef(placedAssets);

  useEffect(() => {
    placedBlocksRef.current = placedBlocks;
    placedAssetsRef.current = placedAssets;
  }, [placedBlocks, placedAssets]);

  // Helper to find the surface height under a 3D point by checking placed blocks
  const getSurfaceHeightAtPoint = useCallback((x: number, z: number): number | null => {
    let maxHeight: number | null = null;
    const currentBlocks = placedBlocksRef.current;

    if (!currentBlocks || !Array.isArray(currentBlocks)) {
      return null;
    }

    for (const block of currentBlocks) {
      if (!block || !block.position) continue;
      const bx = block.position[0];
      const bz = block.position[2];
      const by = block.position[1];
      const scale = block.scale || 1;
      const halfScale = scale / 2;

      if (x >= bx - halfScale && x <= bx + halfScale && z >= bz - halfScale && z <= bz + halfScale) {
        const topHeight = by + halfScale;
        if (maxHeight === null || topHeight > maxHeight) {
          maxHeight = topHeight;
        }
      }
    }

    return maxHeight;
  }, []);

  useEffect(() => {
    // Don't handle clicks when camera control mode is active
    if (cameraControlMode !== 'none') return;
    if (!selectedBlock && !selectedAsset && !eraseMode && !adjustMode) return;

    const getWorldPosition = (event: MouseEvent): THREE.Vector3 | null => {
      if (!groundPlaneRef.current) return null;

      // Get the canvas element from the DOM (R3F attaches to canvas)
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;

      // Calculate normalized device coordinates (-1 to 1)
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      
      // For asset mode, raycast at asset placement height to align mouse with asset bottom
      let targetPlane = groundPlaneRef.current;
      if (selectedAsset) {
        // Create temp plane at asset placement height
        // Use average block surface height + offset to match where assets will appear
        const tempPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(10000, 10000),
          new THREE.MeshStandardMaterial()
        );
        tempPlane.position.y = assetYOffset + 1.5; // Approximate surface + offset
        tempPlane.rotation.x = -Math.PI / 2;
        tempPlane.updateMatrixWorld();
        targetPlane = tempPlane;
      }
      
      const intersects = raycaster.intersectObject(targetPlane);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        return point;
      }
      return null;
    };

    const snap = (x: number, z: number, unit = 1): [number, number] => {
      const sx = Math.round(x / unit) * unit;
      const sz = Math.round(z / unit) * unit;
      return [sx, sz];
    };

    // Helper to find the surface height under a 3D point by checking placed blocks
    const getSurfaceHeightAtPoint = (x: number, z: number): number | null => {
      let maxHeight: number | null = null;
      const currentBlocks = placedBlocksRef.current;

      if (!currentBlocks || !Array.isArray(currentBlocks)) {
        console.log('[getSurfaceHeightAtPoint] No blocks');
        return null;
      }

      // Check each placed block to see if this point is over it
      for (const block of currentBlocks) {
        if (!block || !block.position) continue;
        
        const bx = block.position[0];
        const bz = block.position[2];
        const by = block.position[1];
        const scale = block.scale || 1;
        
        // Block extends from center by scale/2 in each direction
        const halfScale = scale / 2;
        const minX = bx - halfScale;
        const maxX = bx + halfScale;
        const minZ = bz - halfScale;
        const maxZ = bz + halfScale;
        
        // Check if point is within this block's horizontal bounds
        if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
          const topHeight = by + halfScale;
          if (maxHeight === null || topHeight > maxHeight) {
            maxHeight = topHeight;
            console.log(`[getSurfaceHeightAtPoint] Hit block at (${bx.toFixed(1)}, ${bz.toFixed(1)}), point at (${x.toFixed(2)}, ${z.toFixed(2)}), height: ${topHeight.toFixed(2)}`);
          }
        }
      }
      
      return maxHeight;
    };

    const handleMouseMove = (event: MouseEvent) => {
      const worldPos = getWorldPosition(event);
      
      if (measureMode && worldPos) {
        setMeasureEnd(worldPos);
        return;
      }
      
      if (eraseMode) {
        if (!worldPos) {
          setErasePreview(null);
          return;
        }
        const surface = getSurfaceHeightAtPoint(worldPos.x, worldPos.z);
        if (surface === null) {
          setErasePreview([worldPos.x, 0, worldPos.z]);
        } else {
          setErasePreview([worldPos.x, surface, worldPos.z]);
        }
        return;
      }

      if (!worldPos || (!selectedBlock && !selectedAsset)) {
        setPreviewPosition(null);
        setErasePreview(null);
        return;
      }

      // Assets: free placement at exact mouse location, no snapping
      if (selectedAsset) {
        // Raycast against actual placed blocks to find surface height
        const surface = getSurfaceHeightAtPoint(worldPos.x, worldPos.z);
        if (surface === null) {
          setPreviewPosition(null);
          return;
        }
        // Place at exact mouse position on surface
        setPreviewPosition([worldPos.x, surface + assetYOffset, worldPos.z]);
        return;
      }

      // Blocks: snap to grid as before
      const [sx, sz] = snap(worldPos.x, worldPos.z, 1);
      const surface = getSurfaceHeight(sx, sz);
      // Blocks: use current elevation but ensure we do not go below surface
      const elevation = Math.max(currentElevation, surface ?? currentElevation);
      setPreviewPosition([sx, elevation, sz]);
    };

    const handleMouseUp = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only block direct UI element clicks, not spatial areas
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[role="dialog"]') ||
        target.tagName === 'LABEL' ||
        target.closest('.sidebar-panel')
      ) {
        return;
      }

      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        return;
      }

      if (!groundPlaneRef.current) return;

      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      // Measurement mode - set start/end points
      if (measureMode) {
        if (!dragStart) {
          setMeasureStart(worldPos);
          setDragStart(worldPos);
        } else {
          setMeasureEnd(worldPos);
          setDragStart(null);
        }
        return;
      }

      // No bounds - unlimited placement area

      // Check for block selection in adjust mode
      if (adjustMode) {
        const currentBlocks = placedBlocksRef.current;
        let nearestBlock = null;
        let nearestDistance = 2; // 2 meter selection radius

        if (currentBlocks && Array.isArray(currentBlocks) && currentBlocks.length > 0) {
          for (const block of currentBlocks) {
            if (!block || !block.position) continue;
            const distance = Math.sqrt(
              Math.pow(block.position[0] - worldPos.x, 2) +
              Math.pow(block.position[2] - worldPos.z, 2)
            );
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestBlock = block;
            }
          }
        }

        if (nearestBlock) {
          onSelectBlock(nearestBlock.id);
        }
        return;
      }

      if (eraseMode) {
        const eraseRadius = eraseBrushSize;

        if (eraseTarget === 'assets') {
          // Erase assets when in asset mode
          const assetsToErase: string[] = [];
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
            assetsToErase.forEach(id => {
              try {
                onEraseAsset(id);
              } catch (err) {
                console.error('Error erasing asset:', err);
              }
            });
          }
        } else {
          // Default: erase blocks
          const blocksToErase: string[] = [];
          const currentBlocks = placedBlocksRef.current;

          if (currentBlocks && Array.isArray(currentBlocks) && currentBlocks.length > 0) {
            for (const block of currentBlocks) {
              if (!block || !block.position) continue;
              const distance = Math.sqrt(
                Math.pow(block.position[0] - worldPos.x, 2) +
                Math.pow(block.position[2] - worldPos.z, 2)
              );
              if (distance < eraseRadius) {
                blocksToErase.push(block.id);
              }
            }
            blocksToErase.forEach(id => {
              try {
                onEraseBlock(id);
              } catch (err) {
                console.error('Error erasing block:', err);
              }
            });
          }
        }
      } else if (selectedBlock) {
        const [sx, sz] = snap(worldPos.x, worldPos.z, 1);
        const surface = getSurfaceHeight(sx, sz);
        const newElevation = Math.max(currentElevation, surface ?? currentElevation);
        const newPosition: [number, number, number] = [sx, newElevation, sz];
        const rotation = 0; // All blocks same orientation
        // Scale blocks: large blocks 4x (tile-sized), regular blocks 3x (bigger than player)
        const scale = selectedBlock.includes('large') || selectedBlock.includes('Large') ? 4.0 : 3.0;
        onPlaceBlock({ position: newPosition, rotation, scale });
      } else if (selectedAsset) {
        // Raycast against actual placed blocks to find surface height
        const surface = getSurfaceHeightAtPoint(worldPos.x, worldPos.z);
        // Assets only on collisions; if none, abort placement
        if (surface === null) {
          return;
        }
        // Place at exact mouse position on the surface
        const newPosition: [number, number, number] = [worldPos.x, surface + assetYOffset, worldPos.z];
        
        // Apply randomization
        const randomized = randomizeAsset(selectedAsset);
        const scale = assetRandomizeScale ? randomized.scale : (selectedAsset.defaultScale || 1.0);
        const rotation = assetRandomizeRotation ? randomized.rotation : 0;
        
        onPlaceAsset({ position: newPosition, rotation, scale });
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      setErasePreview(null);
    };
  }, [selectedBlock, selectedAsset, eraseMode, eraseBrushSize, isDragging, dragStart, camera, raycaster, pointer, onPlaceBlock, onPlaceAsset, onEraseBlock, setIsDragging, setDragStart, currentElevation, setPreviewPosition, measureMode, setMeasureStart, setMeasureEnd, adjustMode, onSelectBlock, cameraControlMode, assetRandomizeRotation, assetRandomizeScale, getSurfaceHeight, assetYOffset, eraseTarget, getSurfaceHeightAtPoint, setErasePreview]);

  return null;
}

// ==================== Block Category Section ====================

function CategorySection({
  title,
  isExpanded,
  onToggle,
  children,
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

// ==================== Main Component ====================

export function KennyBlocks() {
  const navigate = useNavigate();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const exportRootRef = useRef<THREE.Group | null>(null);
  const groundPlaneRef = useRef<THREE.Mesh | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [placedBlocks, setPlacedBlocks] = useState<Array<{ id: string; blockType: string; position: [number, number, number]; rotation: number; scale: number }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['grass']));
  const [eraseBrushSize, setEraseBrushSize] = useState(2);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedBlocks, setSavedBlocks] = useState<string[]>([]);
  const [zoomDistance, setZoomDistance] = useState(10);
  const [cameraRotation, setCameraRotation] = useState(45);
  const [cameraPitch, setCameraPitch] = useState(45);
  const [showCollisionBoxes, setShowCollisionBoxes] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(200);
  const [currentElevation, setCurrentElevation] = useState(0);
  const [previewPosition, setPreviewPosition] = useState<[number, number, number] | null>(null);
  const [showElevationOverlay, setShowElevationOverlay] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'top' | 'side' | 'free'>('isometric');
  const [showOriginMarker, setShowOriginMarker] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [measureStart, setMeasureStart] = useState<THREE.Vector3 | null>(null);
  const [measureEnd, setMeasureEnd] = useState<THREE.Vector3 | null>(null);
  const [hideUI, setHideUI] = useState(false);
  const [adjustMode, setAdjustMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showRotationTool, setShowRotationTool] = useState(false);
  const [rotationInput, setRotationInput] = useState(0);
  const [cameraControlMode, setCameraControlMode] = useState<'pan' | 'rotate' | 'none'>('none');
  const [sidebarView, setSidebarView] = useState<'blocks' | 'assets'>('blocks');
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo | null>(null);
  const [placedAssets, setPlacedAssets] = useState<PlacedAssetData[]>([]);
  const [assetRandomizeRotation, setAssetRandomizeRotation] = useState(true);
  const [assetRandomizeScale, setAssetRandomizeScale] = useState(true);
  const [expandedAssetCategories, setExpandedAssetCategories] = useState<Set<string>>(new Set(['trees']));
  const [previewAssetRandom, setPreviewAssetRandom] = useState<{ scale: number; rotation: number }>({ scale: 1, rotation: 0 });
  const [assetYOffset, setAssetYOffset] = useState(2); // default lift to sit on block tops
  const [erasePreview, setErasePreview] = useState<[number, number, number] | null>(null);

  // ==================== Undo/Redo System ====================
  type HistoryState = { blocks: typeof placedBlocks; assets: typeof placedAssets };
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      setPlacedBlocks(previousState.blocks);
      setPlacedAssets(previousState.assets);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setPlacedBlocks(nextState.blocks);
      setPlacedAssets(nextState.assets);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Compute surface height by checking full block bounds, not just the center
  const getSurfaceHeight = useCallback((x: number, z: number): number | null => {
    let maxHeight: number | null = null;

    for (const block of placedBlocks) {
      const bx = block.position[0];
      const bz = block.position[2];
      const by = block.position[1];
      const scale = block.scale || 1;
      const half = scale / 2;

      if (x >= bx - half && x <= bx + half && z >= bz - half && z <= bz + half) {
        const top = by + half;
        if (maxHeight === null || top > maxHeight) {
          maxHeight = top;
        }
      }
    }

    return maxHeight;
  }, [placedBlocks]);

  const makeId = () => `block-${Date.now()}-${Math.random()}`;

  // Kenny Platformer Kit actual block categories (grass only - verified to exist)
  const blockCategories = {
    // Only include GLBs confirmed in /public/Assets/kenney_platformer-kit/Models/GLB format
    'Corner Blocks': [
      'block-grass-corner',
      'block-grass-corner-low',
    ],
    'Curve Blocks': [
      'block-grass-curve',
      'block-grass-curve-low',
      'block-grass-curve-half',
    ],
    'Hexagon Blocks': [
      'block-grass-hexagon',
      'block-grass-low-hexagon',
    ],
    'Large Blocks': [
      'block-grass-large',
      'block-grass-large-slope',
      'block-grass-large-slope-narrow',
      'block-grass-large-slope-steep',
      'block-grass-large-slope-steep-narrow',
    ],
    'Narrow/Long Blocks': [
      'block-grass-narrow',
      'block-grass-low-narrow',
      'block-grass-long',
      'block-grass-low-long',
      'block-grass-edge',
    ],
  };

  // Keep a stable randomization sample for the ghost preview so it does not re-roll on every mouse move
  useEffect(() => {
    if (!selectedAsset) {
      setPreviewAssetRandom({ scale: 1, rotation: 0 });
      return;
    }
    const randomized = randomizeAsset(selectedAsset);
    setPreviewAssetRandom({
      scale: assetRandomizeScale ? randomized.scale : (selectedAsset.defaultScale || 1.0),
      rotation: assetRandomizeRotation ? randomized.rotation : 0,
    });
  }, [selectedAsset, assetRandomizeRotation, assetRandomizeScale]);

  // Load saved blocks list on mount - verify they exist
  useEffect(() => {
    const verifyAndLoadBlocks = async () => {
      const verified: string[] = [];
      const metaKeys = Object.keys(localStorage).filter(key => key.startsWith('kenny_blocks_') && !key.startsWith('kenny_blocks_glb_'));
      for (const key of metaKeys) {
        const blockName = key.replace('kenny_blocks_', '');
        const glbKey = `kenny_blocks_glb_${blockName}`;
        const glbData = await getGlbFromDb(glbKey);
        if (glbData && glbData.length > 0) {
          verified.push(blockName);
        }
      }
      
      console.log('Verified saved block groups:', verified);
      setSavedBlocks(verified);
    };
    
    verifyAndLoadBlocks();
  }, []);

  // Keep camera distance in sync with the zoom slider
  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(zoomDistance, zoomDistance, zoomDistance);
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current?.update?.();
  }, [zoomDistance]);

  const handleNext = async () => {
    console.log('[handleNext] Starting export...', { blockCount: placedBlocks.length, assetCount: placedAssets.length });
    // Export collision mesh from blocks + assets - all merged into ONE solid mesh
    const allGeometries: THREE.BufferGeometry[] = [];
    
    // Add block collision boxes
    placedBlocks.forEach((block) => {
      const bx = block.position[0];
      const by = block.position[1];
      const bz = block.position[2];
      const scale = block.scale;
      
      const geometry = new THREE.BoxGeometry(scale, scale, scale);
      const mesh = new THREE.Mesh(geometry);
      mesh.position.set(bx, by, bz);
      mesh.rotation.setFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), block.rotation));
      mesh.updateMatrixWorld();
      
      // Extract geometry with world transform
      const geom = geometry.clone();
      geom.applyMatrix4(mesh.matrixWorld);
      allGeometries.push(geom);
    });
    
    // Add asset geometry - actual visual geometry, not just collision boxes
    const assetPromises: Promise<void>[] = [];
    placedAssets.forEach((asset) => {
      assetPromises.push(
        new Promise((resolve) => {
          const loader = new GLTFLoader();
          loader.load(
            asset.asset.path,
            (gltf) => {
              try {
                // Create parent group with asset's world transform
                const assetGroup = new THREE.Group();
                assetGroup.position.set(...asset.position);
                assetGroup.rotation.setFromQuaternion(
                  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), asset.rotation)
                );
                
                // Clone and scale the asset
                const cloned = gltf.scene.clone();
                const finalScale = asset.scale * (asset.asset.defaultScale || 1.0);
                cloned.scale.setScalar(finalScale);
                
                // Add to parent group
                assetGroup.add(cloned);
                assetGroup.updateMatrixWorld(true);
                
                // Extract ALL visual geometry with full world transform
                assetGroup.traverse((child) => {
                  if (child instanceof THREE.Mesh && child.geometry) {
                    const geo = child.geometry as THREE.BufferGeometry;
                    const clonedGeo = geo.clone();
                    clonedGeo.applyMatrix4(child.matrixWorld);
                    allGeometries.push(clonedGeo);
                  }
                });
              } catch (e) {
                console.warn(`[handleNext] Failed to process asset ${asset.asset.name}:`, e);
              }
              resolve();
            },
            undefined,
            () => resolve()
          );
        })
      );
    });

    try {
      await Promise.all(assetPromises);
      console.log('[handleNext] Assets loaded, total geometries:', allGeometries.length);
    } catch (e) {
      console.warn('[handleNext] Asset loading error:', e);
    }

    if (allGeometries.length === 0) {
      console.error('[handleNext] No geometries to export!');
      alert('No blocks or assets to export');
      return;
    }

    try {
      // Merge ALL geometries (blocks + assets) into ONE single solid mesh
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(allGeometries, true);
      const mergedMesh = new THREE.Mesh(
        mergedGeometry,
        new THREE.MeshStandardMaterial({ color: 0x808080 })
      );

      const exportScene = new THREE.Scene();
      exportScene.add(mergedMesh);

      const exporter = new GLTFExporter();
      exporter.parse(
        exportScene,
        (result) => {
          const output = result as ArrayBuffer;
          const blob = new Blob([output], { type: 'model/gltf-binary' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const compressed = LZString.compressToBase64(base64);
            
            // Save merged collision mesh to localStorage
            const collisionKey = 'quest_collisions_merged';
            localStorage.setItem(collisionKey, compressed);
            
            // Also save metadata about the level
            const levelData = {
              blockCount: placedBlocks.length,
              assetCount: placedAssets.length,
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem('level_metadata', JSON.stringify(levelData));
            
            // CRITICAL: Save asset data so they load in the game world
            localStorage.setItem('placed_assets_data', JSON.stringify(placedAssets.map(asset => ({
              id: asset.id,
              assetName: asset.asset.name,
              assetPath: asset.asset.path,
              position: asset.position,
              rotation: asset.rotation,
              scale: asset.scale,
              defaultScale: asset.asset.defaultScale,
            }))));
            
            // Persist spawn info for next scene and navigate
            localStorage.setItem('player_spawn', JSON.stringify({ x: 0, y: 0, z: 0 }));
            alert('World exported successfully! All blocks and assets merged into one solid mesh. Loading...');
            console.log('[Next] Collision mesh saved:', { collisionKey, levelData, geometryCount: allGeometries.length });
            try {
              navigate('/kenny-demo');
            } catch (e) {
              console.warn('Navigate failed, leaving data in storage', e);
            }
          };
          reader.onerror = () => alert('Failed to encode collision mesh');
          reader.readAsDataURL(blob);
        },
        (error) => {
          console.error('[Next] Export error:', error);
          alert('Failed to export collision mesh');
        },
        {
          binary: true,
          includeCustomExtensions: true,
          embedImages: true
        }
      );
    } catch (error) {
      console.error('[Next] Merge error:', error);
      alert('Failed to merge collision geometries: ' + (error as Error).message);
    }
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const exportAndStoreBlocks = useCallback(async (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!exportRootRef.current) {
        reject(new Error('No export root'));
        return;
      }

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

        geom.morphAttributes = {};
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
            const compressed = LZString.compressToBase64(base64);
            const glbKey = `kenny_blocks_glb_${name}`;
            const worldKey = `world_glb_${name}`;
            // Store in IndexedDB (fallback to localStorage if needed) to avoid quota issues
            storeGlbInDb(glbKey, compressed).then(() => {
              // Tiny marker so existing listings still work without large payloads in localStorage
              localStorage.setItem(glbKey, 'idb');
            });
            storeGlbInDb(worldKey, compressed).then(() => {
              localStorage.setItem(worldKey, 'idb');
            });
            resolve();
          };
          reader.onerror = () => reject(new Error('Failed to encode GLB'));
          reader.readAsDataURL(blob);
        },
        (error) => reject(error),
        {
          binary: true,
          includeCustomExtensions: true,
          embedImages: true
        }
      );
    });
  }, []);

  const handleSaveConfirm = async () => {
    if (!blockName.trim()) {
      alert('Please enter a blocks name');
      return;
    }

    // Add collision metadata - all blocks have full 3D collision
    const blocksWithCollision = placedBlocks.map(block => ({
      ...block,
      type: 'kenny-block', // Ensures collision detection recognizes as block
      hasCollision: true,
      collisionHeight: block.scale, // Full block height for collision
    }));

    const blockData = {
      blocks: blocksWithCollision,
      createdAt: new Date().toISOString(),
      format: 'single_glb',
      version: '1.0',
    };
    const name = blockName.trim();
    try {
      // Save with both kenny_blocks_ and world_ prefix for demo accessibility
      localStorage.setItem(`kenny_blocks_${name}`, JSON.stringify(blockData));
      localStorage.setItem(`world_${name}`, JSON.stringify(blockData));
      await exportAndStoreBlocks(name);
      setShowSaveDialog(false);
      setBlockName('');
      const blocks = Object.keys(localStorage).filter(key => key.startsWith('kenny_blocks_') && !key.startsWith('kenny_blocks_glb_'));
      setSavedBlocks(blocks.map(key => key.replace('kenny_blocks_', '')));
      alert(`Blocks "${name}" saved successfully!\n\nCollisions: Top surface of blocks\nAccessible in demo as: ${name}`);
    } catch (e) {
      console.error('Error saving blocks:', e);
      alert('Error saving blocks. Check console for details.');
    }
  };

  const handleLoad = () => {
    setShowLoadDialog(true);
  };

  const handleLoadBlocks = (name: string) => {
    const blockData = localStorage.getItem(`kenny_blocks_${name}`);
    if (blockData) {
      try {
        const parsed = JSON.parse(blockData);
        const loadedBlocks = parsed.blocks || [];
        setPlacedBlocks(loadedBlocks);
        setShowLoadDialog(false);
        alert(`Blocks "${name}" loaded successfully!\n\nBlocks: ${loadedBlocks.length}`);
      } catch (error) {
        console.error('Error loading blocks:', error);
        alert('Error loading blocks');
      }
    }
  };

  // ==================== Hover Preview (ghost block) ====================

  function GhostBlock({ blockType, position, rotation = 0, scale = 1.0 }: { blockType: string; position: [number, number, number]; rotation?: number; scale?: number }) {
    const [scene, setScene] = useState<THREE.Group | null>(null);
    useEffect(() => {
      const loader = new GLTFLoader();
      const blockPath = `/Assets/kenney_platformer-kit/Models/GLB%20format/${blockType}.glb`;
      loader.load(
        blockPath,
        (gltf) => {
          const cloned = gltf.scene.clone();
          cloned.scale.setScalar(scale);
          cloned.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              (child.material as THREE.Material) = new THREE.MeshBasicMaterial({ color: '#4a9eff', transparent: true, opacity: 0.35 });
              child.frustumCulled = false;
            }
          });
          setScene(cloned);
        },
        undefined,
        () => {}
      );
    }, [blockType, scale]);
    if (!scene) return null;
    return (
      <group position={position} rotation={[0, rotation, 0]}>
        <primitive object={scene} />
      </group>
    );
  }



  const handlePlaceBlock = useCallback((data: { position: [number, number, number]; rotation: number; scale: number }) => {
    setPlacedBlocks(prev => {
      const newBlocks = [...prev, {
        id: makeId(),
        blockType: selectedBlock || 'grass_tall',
        ...data,
      }];
      // Save to history after state update
      setTimeout(() => {
        setHistory(h => {
          const updated = h.slice(0, historyIndex + 1);
          updated.push({ blocks: newBlocks, assets: placedAssets });
          return updated;
        });
        setHistoryIndex(prev => prev + 1);
      }, 0);
      return newBlocks;
    });
  }, [selectedBlock, placedAssets, historyIndex]);

  const handlePlaceAsset = useCallback((data: { position: [number, number, number]; rotation: number; scale: number }) => {
    if (!selectedAsset) return;
    setPlacedAssets(prev => {
      const newAssets = [...prev, {
        id: makeId(),
        asset: selectedAsset,
        ...data,
      }];
      // Save to history after state update
      setTimeout(() => {
        setHistory(h => {
          const updated = h.slice(0, historyIndex + 1);
          updated.push({ blocks: placedBlocks, assets: newAssets });
          return updated;
        });
        setHistoryIndex(prev => prev + 1);
      }, 0);
      return newAssets;
    });
  }, [selectedAsset, placedBlocks, historyIndex]);

  const handleNew = () => {
    if (placedBlocks.length > 0 || placedAssets.length > 0) {
      if (window.confirm('Clear all blocks and assets? This cannot be undone.')) {
        setPlacedBlocks([]);
        setPlacedAssets([]);
        setCurrentElevation(0);
        setShowElevationOverlay(false);
        setHistory([]);
        setHistoryIndex(-1);
      }
    } else {
      setPlacedBlocks([]);
      setPlacedAssets([]);
      setCurrentElevation(0);
      setShowElevationOverlay(false);
    }
  };

  const handleEraseBlock = useCallback((id: string) => {
    setPlacedBlocks(prev => {
      const newBlocks = prev.filter(block => block.id !== id);
      // Save to history after state update
      setTimeout(() => {
        setHistory(h => {
          const updated = h.slice(0, historyIndex + 1);
          updated.push({ blocks: newBlocks, assets: placedAssets });
          return updated;
        });
        setHistoryIndex(prev => prev + 1);
      }, 0);
      return newBlocks;
    });
  }, [placedAssets, historyIndex]);

  const handleEraseAsset = useCallback((id: string) => {
    setPlacedAssets(prev => {
      const newAssets = prev.filter(asset => asset.id !== id);
      // Save to history after state update
      setTimeout(() => {
        setHistory(h => {
          const updated = h.slice(0, historyIndex + 1);
          updated.push({ blocks: placedBlocks, assets: newAssets });
          return updated;
        });
        setHistoryIndex(prev => prev + 1);
      }, 0);
      return newAssets;
    });
  }, [placedBlocks, historyIndex]);

  const handleSelectBlock = useCallback((id: string | null) => {
    setSelectedBlockId(id);
    if (id) {
      const block = placedBlocks.find(b => b.id === id);
      if (block) {
        setRotationInput(Math.round((block.rotation * 180 / Math.PI)) || 0);
        setShowRotationTool(true);
      }
    } else {
      setShowRotationTool(false);
    }
  }, [placedBlocks]);

  const handleRotateBlock = useCallback(() => {
    if (!selectedBlockId) return;
    const degrees = rotationInput || 0;
    const radians = (degrees * Math.PI) / 180;
    setPlacedBlocks(prev => prev.map(block => 
      block.id === selectedBlockId 
        ? { ...block, rotation: radians }
        : block
    ));
  }, [selectedBlockId, rotationInput]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* UI Toggle Button - Always Visible */}
      <button
        onClick={() => setHideUI(!hideUI)}
        style={{
          position: 'absolute',
          top: '20px',
          left: hideUI ? '20px' : '320px',
          zIndex: 1001,
          padding: '10px',
          background: hideUI ? '#27ae60' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '20px',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={hideUI ? 'Show UI' : 'Hide UI'}
      >
        {hideUI ? '👁️' : '🚫'}
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: hideUI ? '80px' : '390px',
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

      {/* Undo/Redo Buttons - Top Center */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          style={{
            padding: '10px 15px',
            background: historyIndex <= 0 ? '#555' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: historyIndex <= 0 ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          style={{
            padding: '10px 15px',
            background: historyIndex >= history.length - 1 ? '#555' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: historyIndex >= history.length - 1 ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷ Redo
        </button>
      </div>

      {/* Right Sidebar - Controls and Settings */}
      {!hideUI && (
        <div
          className="sidebar-panel"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            width: '240px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
          }}
        >
        {/* Camera Control Modes */}
        <div
          style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #555',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '10px',
          }}
        >
          <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '14px' }}>🎥 Camera</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button
              onClick={() => {
                const newMode = cameraControlMode === 'pan' ? 'none' : 'pan';
                setCameraControlMode(newMode);
                if (newMode === 'pan') {
                  setSelectedBlock(null);
                  setSelectedBlockId(null);
                  setShowRotationTool(false);
                  setEraseMode(false);
                  setAdjustMode(false);
                  setMeasureMode(false);
                }
              }}
              style={{
                padding: '8px',
                background: cameraControlMode === 'pan' ? '#3498db' : '#555',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {cameraControlMode === 'pan' ? '✓ Pan' : '✋ Pan'}
            </button>
            <button
              onClick={() => {
                const newMode = cameraControlMode === 'rotate' ? 'none' : 'rotate';
                setCameraControlMode(newMode);
                if (newMode === 'rotate') {
                  setSelectedBlock(null);
                  setSelectedBlockId(null);
                  setShowRotationTool(false);
                  setEraseMode(false);
                  setAdjustMode(false);
                  setMeasureMode(false);
                }
              }}
              style={{
                padding: '8px',
                background: cameraControlMode === 'rotate' ? '#3498db' : '#555',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {cameraControlMode === 'rotate' ? '✓ Rotate' : '🔄 Rotate'}
            </button>
          </div>
        </div>
        {/* Controls */}
        <div
          style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #555',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
          }}
        >
          <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '16px' }}>⚙️ Controls</h3>
          <button
            onClick={handleNew}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
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
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
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
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
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
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              padding: '10px',
              background: '#2c5f2d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Next →
          </button>
        </div>

        {/* Tools */}
        <div
          style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid #555',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
          }}
        >
          <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '16px' }}>🛠️ Tools</h3>
          <button
            onClick={() => { setEraseMode(!eraseMode); setSelectedBlock(null); }}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              background: eraseMode ? '#e74c3c' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {eraseMode ? '✓ Erase Mode' : 'Erase Mode'}
          </button>
          
          <button
            onClick={() => {
              setAdjustMode(!adjustMode);
              if (adjustMode) {
                setSelectedBlockId(null);
                setShowRotationTool(false);
              }
            }}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              background: adjustMode ? '#ff9800' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {adjustMode ? '✓ ' : ''}{sidebarView === 'assets' ? 'Adjust Asset' : 'Adjust Block'}
          </button>
          
          {eraseMode && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Brush: {eraseBrushSize.toFixed(1)}m
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={eraseBrushSize}
                onChange={(e) => setEraseBrushSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Zoom: {zoomDistance.toFixed(0)}m
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={zoomDistance}
              onChange={(e) => setZoomDistance(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Camera Angle: {cameraRotation.toFixed(0)}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={cameraRotation}
              onChange={(e) => setCameraRotation(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Camera Pitch: {cameraPitch.toFixed(0)}°
            </label>
            <input
              type="range"
              min="-10"
              max="89"
              step="5"
              value={cameraPitch}
              onChange={(e) => setCameraPitch(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Grid Size: {gridSize}m
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Placement tuning */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Block Elevation: {currentElevation.toFixed(2)}m
            </label>
            <input
              type="range"
              min="-5"
              max="25"
              step="0.25"
              value={currentElevation}
              onChange={(e) => setCurrentElevation(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Asset Y Offset: {assetYOffset.toFixed(2)}m
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={assetYOffset}
              onChange={(e) => setAssetYOffset(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              background: showGrid ? '#27ae60' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showGrid ? '✓ Show Grid' : 'Show Grid'}
          </button>

          <button
            onClick={() => setShowCollisionBoxes(!showCollisionBoxes)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              background: showCollisionBoxes ? '#27ae60' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showCollisionBoxes ? '✓ Show Collision' : 'Show Collision'}
          </button>

          <button
            onClick={() => setShowOriginMarker(!showOriginMarker)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '15px',
              background: showOriginMarker ? '#27ae60' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showOriginMarker ? '✓ Origin Marker' : 'Origin Marker'}
          </button>

          {/* Camera Presets */}
          <div style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px solid #555' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              📷 Camera Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <button
                onClick={() => {
                  setCameraPreset('top');
                  setZoomDistance(50);
                  setCameraRotation(0);
                  setCameraPitch(89);
                }}
                style={{
                  padding: '8px',
                  background: cameraPreset === 'top' ? '#3498db' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ⬇️ Top
              </button>
              <button
                onClick={() => {
                  setCameraPreset('isometric');
                  setZoomDistance(30);
                  setCameraRotation(45);
                  setCameraPitch(35);
                }}
                style={{
                  padding: '8px',
                  background: cameraPreset === 'isometric' ? '#3498db' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                🔷 Iso
              </button>
              <button
                onClick={() => {
                  setCameraPreset('side');
                  setZoomDistance(40);
                  setCameraRotation(90);
                  setCameraPitch(0);
                }}
                style={{
                  padding: '8px',
                  background: cameraPreset === 'side' ? '#3498db' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ↔️ Side
              </button>
              <button
                onClick={() => {
                  setCameraPreset('free');
                }}
                style={{
                  padding: '8px',
                  background: cameraPreset === 'free' ? '#3498db' : '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                🎮 Free
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setZoomDistance(30);
              setCameraRotation(45);
              setCameraPitch(35);
              setCurrentElevation(0);
              setAssetYOffset(2);
              setCameraPreset('isometric');
              setShowGrid(true);
              setShowCollisionBoxes(false);
              setShowOriginMarker(false);
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              background: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            🔄 Reset View
          </button>

          {/* Measurement Tool */}
          {/* Hide UI Toggle */}
          <button
            onClick={() => setHideUI(!hideUI)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              background: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {hideUI ? '👁️ Show UI' : '🚫 Clear View'}
          </button>

          <button
            onClick={() => setShowCollisionBoxes(!showCollisionBoxes)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              background: showCollisionBoxes ? '#e67e22' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showCollisionBoxes ? '✓ Collision Boxes' : 'Collision Boxes'}
          </button>

          <div style={{ marginBottom: '15px', borderTop: '1px solid #555', paddingTop: '15px' }}>
            <label style={{ color: 'white', fontSize: '12px', display: 'block', marginBottom: '5px' }}>
              Elevation: {currentElevation.toFixed(1)}
            </label>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button
                onClick={() => {
                  const step = selectedBlock && (selectedBlock.includes('large') || selectedBlock.includes('Large')) ? 4.0 : 3.0;
                  setCurrentElevation(e => Math.max(-50, e - step));
                  setShowElevationOverlay(false);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                ↓ Down
              </button>
              <button
                onClick={() => {
                  const step = selectedBlock && (selectedBlock.includes('large') || selectedBlock.includes('Large')) ? 4.0 : 3.0;
                  setCurrentElevation(e => Math.min(100, e + step));
                  setShowElevationOverlay(true);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                ↑ Up
              </button>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={currentElevation}
              onChange={(e) => setCurrentElevation(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
        )}

      {/* Left Sidebar - Block Selection Panel */}
      {!hideUI && (
        <div
          className="sidebar-panel"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '280px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid #555',
            borderRadius: '8px',
            padding: '15px',
            color: 'white',
            zIndex: 10,
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {sidebarView === 'blocks' ? (
            <>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>🧩 Kenny Blocks</h3>

              {Object.entries(blockCategories).map(([category, blocks]) => (
                <CategorySection
                  key={category}
                  title={`${category.charAt(0).toUpperCase() + category.slice(1)} Blocks`}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                >
                  {blocks.map(block => (
                    <button
                      key={block}
                      onClick={() => {
                        setSelectedBlock(block);
                        setEraseMode(false);
                        setCameraControlMode('none');
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px',
                        margin: '2px 0',
                        background: selectedBlock === block ? '#4a9eff' : '#333',
                        color: 'white',
                        border: '1px solid #555',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      {block}
                    </button>
                  ))}
                </CategorySection>
              ))}
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>🎨 Nature Assets</h3>
              
              {/* Randomization Controls */}
              <div style={{ marginBottom: '15px', padding: '10px', background: '#222', borderRadius: '4px', border: '1px solid #555' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#4a9eff' }}>🎲 Randomization</div>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={assetRandomizeRotation}
                    onChange={(e) => setAssetRandomizeRotation(e.target.checked)}
                    style={{ marginRight: '6px' }}
                  />
                  Random Rotation
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={assetRandomizeScale}
                    onChange={(e) => setAssetRandomizeScale(e.target.checked)}
                    style={{ marginRight: '6px' }}
                  />
                  Random Scale
                </label>
              </div>
              
              {/* Asset Categories */}
              {Object.keys(ASSET_REGISTRY).map((categoryKey) => {
                const assets = ASSET_REGISTRY[categoryKey];
                if (assets.length === 0) return null;
                
                const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                const isExpanded = expandedAssetCategories.has(categoryKey);
                
                return (
                  <CategorySection
                    key={categoryKey}
                    title={`${categoryName} (${assets.length})`}
                    isExpanded={isExpanded}
                    onToggle={() => {
                      const newSet = new Set(expandedAssetCategories);
                      if (isExpanded) {
                        newSet.delete(categoryKey);
                      } else {
                        newSet.add(categoryKey);
                      }
                      setExpandedAssetCategories(newSet);
                    }}
                  >
                    {assets.map((asset) => (
                      <button
                        key={asset.path}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setSelectedBlock(null);
                          setEraseMode(false);
                          setAdjustMode(false);
                          setMeasureMode(false);
                        }}
                        style={{
                          width: '100%',
                          marginBottom: '4px',
                          padding: '8px',
                          background: selectedAsset?.path === asset.path ? '#3498db' : '#444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '10px',
                        }}
                      >
                        {asset.name}
                      </button>
                    ))}
                  </CategorySection>
                );
              })}
              
              <button
                onClick={() => setSidebarView('blocks')}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  marginTop: '20px',
                  background: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                ← Back to Blocks
              </button>
            </>
          )}

          {sidebarView === 'blocks' && (
            <>
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #555' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Erase Brush: {eraseBrushSize.toFixed(1)}m
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={eraseBrushSize}
              onChange={(e) => setEraseBrushSize(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <button
              onClick={() => setEraseMode(!eraseMode)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px',
                marginTop: '8px',
                background: eraseMode ? '#ff4444' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {eraseMode ? '🗑️ Erase Mode ON' : '🗑️ Erase Mode OFF'}
            </button>
          </div>

          <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.7 }}>
            <strong>Controls:</strong>
            <br />Click to place
            <br />Toggle Erase to remove
            <br />Right-click+drag to rotate
            <br />Scroll to zoom
          </div>

          <button
            onClick={() => setSidebarView('assets')}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              marginTop: '15px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ✓ Finished with Blocks
          </button>
            </>
          )}
        </div>
        )}


      {/* Save Dialog */}
      {showSaveDialog && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #4a9eff',
            borderRadius: '10px',
            padding: '30px',
            zIndex: 1000,
            color: 'white',
            minWidth: '300px',
          }}
        >
          <h2>Save Blocks</h2>
          <input
            type="text"
            placeholder="Enter blocks name"
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              background: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '5px',
              boxSizing: 'border-box',
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveConfirm()}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveConfirm}
              style={{
                flex: 1,
                padding: '10px',
                background: '#3d6b2d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #4a9eff',
            borderRadius: '10px',
            padding: '30px',
            zIndex: 1000,
            color: 'white',
            minWidth: '300px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <h2>Load Blocks</h2>
          {savedBlocks.length === 0 ? (
            <p>No saved blocks found.</p>
          ) : (
            <div style={{ marginBottom: '15px' }}>
              {savedBlocks.map(name => (
                <button
                  key={name}
                  onClick={() => handleLoadBlocks(name)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    margin: '5px 0',
                    background: '#333',
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
              width: '100%',
              padding: '10px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        shadows
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ background: '#87CEEB' }}
      >
        <CameraController 
          zoomDistance={zoomDistance} 
          cameraRotation={cameraRotation}
          cameraPitch={cameraPitch}
          controlMode={cameraControlMode}
          controlsRef={controlsRef}
          onCameraUpdate={(distance, rotation, pitch) => {
            setZoomDistance(distance);
            setCameraRotation(rotation);
            setCameraPitch(pitch);
          }}
        />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        <SimpleGround showGrid={showGrid} gridSize={gridSize} groundPlaneRef={groundPlaneRef} showOriginMarker={showOriginMarker} />

        <group ref={exportRootRef}>
          {placedBlocks.map((block) => (
            <PlacedBlock
              key={block.id}
              blockType={block.blockType}
              position={block.position}
              rotation={block.rotation}
              scale={block.scale}
              showCollisionBox={showCollisionBoxes}
              isSelected={block.id === selectedBlockId}
            />
          ))}
        </group>

        {/* Elevation overlay highlighting top collision boundaries at current elevation */}
        {showElevationOverlay && placedBlocks.map((block) => {
          const topY = block.position[1] + (block.scale / 2);
          if (Math.abs(topY - currentElevation) > 0.001) return null;
          return (
            <mesh key={`overlay-${block.id}`} position={[block.position[0], topY - 0.001, block.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[block.scale + 0.05, block.scale + 0.05]} />
              <meshBasicMaterial color="#4a9eff" transparent opacity={0.15} depthWrite={false} />
            </mesh>
          );
        })}

        {/* Place assets */}
        {placedAssets.map(({ id, asset, position, rotation, scale }) => (
          <MemoizedPlacedAsset key={id} asset={asset} position={position} rotation={rotation} scale={scale} showCollisionBox={showCollisionBoxes} />
        ))}
        
        {/* Hover ghost preview of selected block */}
        {selectedBlock && previewPosition && (
          <GhostBlock blockType={selectedBlock} position={previewPosition} scale={selectedBlock.includes('large') || selectedBlock.includes('Large') ? 4.0 : 3.0} />
        )}

        {/* Highlight the active elevation plane for clarity */}
        {previewPosition && selectedAsset && placedBlocks.map((block) => {
          const bx = block.position[0];
          const bz = block.position[2];
          const by = block.position[1];
          const scale = block.scale || 1;
          const halfScale = scale / 2;
          
          // Check if preview is within block bounds
          if (previewPosition[0] >= bx - halfScale && previewPosition[0] <= bx + halfScale &&
              previewPosition[2] >= bz - halfScale && previewPosition[2] <= bz + halfScale) {
            // Show plane at the exact surface height, covering full block
            const topHeight = by + (scale / 2);
            return (
              <mesh 
                key={`highlight-${block.id}`}
                position={[bx, topHeight + 0.01, bz]} 
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={9999}
              >
                <planeGeometry args={[scale, scale]} />
                <meshBasicMaterial color="#4a9eff" transparent opacity={0.18} depthWrite={false} />
              </mesh>
            );
          }
          return null;
        })}

        {/* Erase brush preview aligned to surface */}
        {eraseMode && erasePreview && (
          <mesh position={[erasePreview[0], erasePreview[1] + 0.05, erasePreview[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9999}>
            <circleGeometry args={[eraseBrushSize, 48]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        )}

        {/* Hover ghost preview of selected asset */}
        {selectedAsset && previewPosition && (
          <GhostAsset 
            key={selectedAsset.path}
            asset={selectedAsset} 
            position={previewPosition} 
            scale={previewAssetRandom.scale}
            rotation={previewAssetRandom.rotation}
          />
        )}

        {/* Measurement Line */}
        {measureMode && measureStart && measureEnd && (
          <group>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    measureStart.x, measureStart.y, measureStart.z,
                    measureEnd.x, measureEnd.y, measureEnd.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#f39c12" linewidth={3} />
            </line>
            {/* Start marker */}
            <mesh position={[measureStart.x, measureStart.y, measureStart.z]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color="#27ae60" />
            </mesh>
            {/* End marker */}
            <mesh position={[measureEnd.x, measureEnd.y, measureEnd.z]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <meshBasicMaterial color="#e74c3c" />
            </mesh>
          </group>
        )}

        <BlockClickHandler
          selectedBlock={selectedBlock}
          selectedAsset={selectedAsset}
          assetRandomizeRotation={assetRandomizeRotation}
          assetRandomizeScale={assetRandomizeScale}
          eraseBrushSize={eraseBrushSize}
          eraseMode={eraseMode}
          placedBlocks={placedBlocks}
          placedAssets={placedAssets}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          dragStart={dragStart}
          setDragStart={setDragStart}
          onPlaceBlock={handlePlaceBlock}
          onPlaceAsset={handlePlaceAsset}
          onEraseBlock={handleEraseBlock}
          onEraseAsset={handleEraseAsset}
          groundPlaneRef={groundPlaneRef}
          currentElevation={currentElevation}
          assetYOffset={assetYOffset}
          eraseTarget={sidebarView === 'assets' ? 'assets' : 'blocks'}
          setPreviewPosition={setPreviewPosition}
          setErasePreview={setErasePreview}
          measureMode={measureMode}
          setMeasureStart={setMeasureStart}
          setMeasureEnd={setMeasureEnd}
          adjustMode={adjustMode}
          onSelectBlock={handleSelectBlock}
          cameraControlMode={cameraControlMode}
          getSurfaceHeight={getSurfaceHeight}
        />
      </Canvas>

      {/* Block Rotation Tool Popup */}
      {showRotationTool && selectedBlockId && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #4a9eff',
            borderRadius: '10px',
            padding: '20px',
            zIndex: 1000,
            minWidth: '300px',
            color: 'white',
            fontFamily: 'monospace',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'center' }}>
            🔄 Rotate {sidebarView === 'assets' ? 'Asset' : 'Block'}
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
            <label style={{ flex: '0 0 auto', fontSize: '14px' }}>Angle: {rotationInput}°</label>
            <input
              type="range"
              min="0"
              max="359"
              step="1"
              value={rotationInput}
              onChange={(e) => setRotationInput(Number(e.target.value))}
              style={{
                flex: 1,
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRotateBlock}
              style={{
                flex: 1,
                padding: '10px',
                background: '#4a9eff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Apply
            </button>
            <button
              onClick={() => {
                setShowRotationTool(false);
                setSelectedBlockId(null);
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
