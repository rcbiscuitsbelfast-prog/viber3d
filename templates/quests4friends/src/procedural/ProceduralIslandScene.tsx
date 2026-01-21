/**
 * Procedural Island Scene - Tile-Based Approach
 * Uses Kenny assets (rocks) placed on a grid plane
 * Completely isolated experimental feature
 */

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { animationManager } from '../systems/animation/AnimationManager';

// Simple seeded noise function
function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 0.5 + 0.5;
  return n * 2 - 1;
}

// Animation updater component
function AnimationUpdater() {
  useFrame((_state, delta) => {
    animationManager.update(delta);
  });
  return null;
}

// Clone GLTF with skeleton binding
function cloneGltf(gltf: GLTF): GLTF {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true),
  } as GLTF;

  const skinnedMeshes: Record<string, THREE.SkinnedMesh> = {};
  gltf.scene.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) skinnedMeshes[node.name] = node;
  });

  const cloneBones: Record<string, THREE.Bone> = {};
  const cloneSkinnedMeshes: Record<string, THREE.SkinnedMesh> = {};
  clone.scene.traverse((node) => {
    if (node instanceof THREE.Bone) cloneBones[node.name] = node;
    if (node instanceof THREE.SkinnedMesh) cloneSkinnedMeshes[node.name] = node;
  });

  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];
    const orderedCloneBones: THREE.Bone[] = [];
    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }
    cloneSkinnedMesh.bind(new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses), cloneSkinnedMesh.matrixWorld);
  }

  return clone;
}

interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface CameraSettings {
  pitch: number;
  zoom: number;
  rotation: number;
}

interface RockPlacement {
  position: [number, number, number];
  variant: string;
  scale: number;
  rotation: number;
}

/**
 * Player character with animation
 */
function PlayerCharacter({ 
  input, 
  cameraSettings,
  rockPlacements,
  gridSize,
}: { 
  input: CharacterInput; 
  cameraSettings: CameraSettings;
  rockPlacements: RockPlacement[];
  gridSize: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const directionRef = useRef<'idle' | 'walk' | 'run'>('idle');
  const { camera } = useThree();
  const rockCollidersRef = useRef<Array<{ position: THREE.Vector3; radius: number }>>([]);

  // Build collision spheres from rock placements
  useEffect(() => {
    rockCollidersRef.current = rockPlacements.map(rock => ({
      position: new THREE.Vector3(...rock.position),
      radius: rock.scale * 0.8, // collision radius based on rock scale
    }));
  }, [rockPlacements]);

  // Load character model
  useEffect(() => {
    if (!groupRef.current) return;

    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load('/models/Rogue.glb', resolve, undefined, reject);
        });

        const cloned = cloneGltf(gltf);
        cloned.scene.scale.set(1.0, 1.0, 1.0);
        setModel(cloned.scene);

        // Setup animations
        const animations = cloned.animations || [];
        if (groupRef.current) {
          groupRef.current.add(cloned.scene);
        }

        // Register with AnimationManager
        const animationRecord: Record<string, THREE.AnimationClip> = {};
        animations.forEach(clip => {
          animationRecord[clip.name] = clip;
        });
        animationManager.registerCharacter('procedural-player', cloned.scene, animationRecord);
        animationManager.playAnimation('procedural-player', 'Idle');
      } catch (err) {
        console.error('Failed to load player model:', err);
      }
    };

    loadCharacter();
  }, []);

  // Update animation and direction
  useEffect(() => {
    const isMoving = input.forward || input.backward || input.left || input.right;
    const newDirection: 'idle' | 'walk' | 'run' = isMoving ? 'walk' : 'idle';

    if (newDirection !== directionRef.current) {
      directionRef.current = newDirection;
      animationManager.playAnimation('procedural-player', newDirection === 'idle' ? 'Idle' : 'Walk_Forward');
    }
  }, [input]);

  // Movement and collision
  useFrame(() => {
    if (!groupRef.current) return;

    // Update animations for this character
    animationManager.update(0.016); // ~60fps

    // Calculate movement direction
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), -cameraSettings.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), -cameraSettings.rotation);

    const moveVector = new THREE.Vector3();
    if (input.forward) moveVector.add(forward);
    if (input.backward) moveVector.sub(forward);
    if (input.right) moveVector.add(right);
    if (input.left) moveVector.sub(right);

    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(0.15);
      
      // Collision detection: check against rocks
      let canMove = true;
      const nextPos = groupRef.current.position.clone().add(moveVector);
      const playerRadius = 0.3;

      for (const rock of rockCollidersRef.current) {
        const dist = nextPos.distanceTo(rock.position);
        if (dist < playerRadius + rock.radius) {
          canMove = false;
          break;
        }
      }

      // Terrain boundary
      if (Math.abs(nextPos.x) > gridSize / 2 - 1 || Math.abs(nextPos.z) > gridSize / 2 - 1) {
        canMove = false;
      }

      if (canMove) {
        groupRef.current.position.add(moveVector);
      }

      // Rotate player to face movement direction
      const angle = Math.atan2(moveVector.x, moveVector.z);
      groupRef.current.rotation.y = angle;
    }

    // Update camera to follow player with settings
    const camDistance = cameraSettings.zoom;
    const camAngle = cameraSettings.rotation;
    const camPitch = cameraSettings.pitch;

    const offsetX = Math.sin(camAngle) * camDistance * Math.cos(camPitch);
    const offsetY = Math.sin(camPitch) * camDistance;
    const offsetZ = Math.cos(camAngle) * camDistance * Math.cos(camPitch);

    camera.position.lerp(
      new THREE.Vector3(
        groupRef.current.position.x + offsetX,
        groupRef.current.position.y + 1.8 + offsetY,
        groupRef.current.position.z + offsetZ,
      ),
      0.1
    );

    camera.lookAt(
      groupRef.current.position.x,
      groupRef.current.position.y + 1.2,
      groupRef.current.position.z,
    );
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {model && <primitive object={model} />}
    </group>
  );
}
/**
 * Rock asset placed on grid
 */
function RockAsset({ placement }: { placement: RockPlacement }) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/${placement.variant}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        if (groupRef.current) {
          const cloned = gltf.scene.clone();
          cloned.scale.setScalar(placement.scale);
          cloned.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          groupRef.current.add(cloned);
        }
      },
      undefined,
      (error) => {
        console.warn(`Failed to load rock ${placement.variant}:`, error);
        // Placeholder if load fails
        if (groupRef.current) {
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.6, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x666666 })
          );
          groupRef.current.add(mesh);
        }
      }
    );
  }, [placement.variant, placement.scale]);

  return (
    <group
      ref={groupRef}
      position={placement.position}
      rotation={[0, placement.rotation, 0]}
    />
  );
}

/**
 * Grid plane base
 */
function GridPlane({ size }: { size: number }) {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#2d5016" roughness={0.8} />
    </mesh>
  );
}

/**
 * Generate procedural rock placements using noise
 */
function generateRockPlacements(seed: number, gridSize: number, density: number): RockPlacement[] {
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

  const placements: RockPlacement[] = [];
  const tileSize = 1; // 1 meter tiles
  const tilesPerSide = Math.floor(gridSize / tileSize);

  for (let tx = -tilesPerSide / 2; tx < tilesPerSide / 2; tx++) {
    for (let tz = -tilesPerSide / 2; tz < tilesPerSide / 2; tz++) {
      // Noise value determines if rock is placed here
      const noiseVal = noise2D(tx * 0.5, tz * 0.5, seed) * 0.5 + 0.5;
      
      if (noiseVal > 1 - density) {
        const variant = rockVariants[Math.floor(noiseVal * rockVariants.length) % rockVariants.length];
        const scale = 0.7 + (noiseVal % 0.3); // Scale varies based on noise
        const rotation = (noiseVal * Math.PI * 2) % (Math.PI * 2);

        placements.push({
          position: [tx * tileSize + tileSize / 2, 0, tz * tileSize + tileSize / 2],
          variant,
          scale,
          rotation,
        });
      }
    }
  }

  return placements;
}

/**
 * Main scene
 */
function Scene({ 
  config,
  input,
  cameraSettings,
}: { 
  config: any;
  input: CharacterInput;
  cameraSettings: CameraSettings;
}) {
  const rockPlacements = useMemo(() => 
    generateRockPlacements(config.seed, config.gridSize, config.rockDensity),
    [config.seed, config.gridSize, config.rockDensity]
  );

  return (
    <>
      <AnimationUpdater />
      
      {/* Lighting */}
      <directionalLight
        position={[50, 50, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={[0x87ceeb, 0x2d5016, 0.6]} />

      {/* Grid plane */}
      <GridPlane size={config.gridSize} />

      {/* Rock placements */}
      {rockPlacements.map((placement, idx) => (
        <RockAsset key={idx} placement={placement} />
      ))}

      {/* Player character */}
      <PlayerCharacter
        input={input}
        cameraSettings={cameraSettings}
        rockPlacements={rockPlacements}
        gridSize={config.gridSize}
      />
    </>
  );
}

/**
 * Main component
 */
export function ProceduralIslandScene() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(true);
  const [input, setInput] = useState<CharacterInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    pitch: Math.PI / 6,
    zoom: 20,
    rotation: 0,
  });

  const [config, setConfig] = useState({
    seed: 42,
    gridSize: 50,
    rockDensity: 0.3,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') setInput(prev => ({ ...prev, forward: true }));
      if (key === 's' || key === 'arrowdown') setInput(prev => ({ ...prev, backward: true }));
      if (key === 'a' || key === 'arrowleft') setInput(prev => ({ ...prev, left: true }));
      if (key === 'd' || key === 'arrowright') setInput(prev => ({ ...prev, right: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') setInput(prev => ({ ...prev, forward: false }));
      if (key === 's' || key === 'arrowdown') setInput(prev => ({ ...prev, backward: false }));
      if (key === 'a' || key === 'arrowleft') setInput(prev => ({ ...prev, left: false }));
      if (key === 'd' || key === 'arrowright') setInput(prev => ({ ...prev, right: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse drag for camera rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    setCameraSettings(prev => ({
      ...prev,
      rotation: prev.rotation + deltaX * 0.01,
      pitch: Math.max(0.1, Math.min(Math.PI / 2, prev.pitch + deltaY * 0.005)),
    }));

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setCameraSettings(prev => ({
      ...prev,
      zoom: Math.max(10, Math.min(50, prev.zoom + e.deltaY * 0.01)),
    }));
  };

  const updateConfig = (updates: any) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div 
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '12px 24px',
          fontSize: '16px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid white',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        ← Back to Menu
      </button>

      {/* Toggle settings button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '12px 24px',
          fontSize: '16px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid white',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {showSettings ? 'Hide' : 'Show'} Settings
      </button>
      
      {/* Settings Sidebar */}
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            zIndex: 1000,
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            borderRadius: '12px',
            fontFamily: 'monospace',
            fontSize: '14px',
            width: '300px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '16px', fontSize: '16px' }}>
            🏝️ Island Settings
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Seed: {config.seed}
            </label>
            <input
              type="range"
              min="1"
              max="10000"
              value={config.seed}
              onChange={(e) => updateConfig({ seed: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Grid Size: {config.gridSize}m
            </label>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={config.gridSize}
              onChange={(e) => updateConfig({ gridSize: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Rock Density: {(config.rockDensity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={config.rockDensity}
              onChange={(e) => updateConfig({ rockDensity: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <hr style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,0.2)' }} />

          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>
            📷 Camera Settings
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Zoom: {cameraSettings.zoom.toFixed(1)}
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              value={cameraSettings.zoom}
              onChange={(e) => setCameraSettings(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Pitch: {(cameraSettings.pitch * 180 / Math.PI).toFixed(0)}°
            </label>
            <input
              type="range"
              min="5"
              max="70"
              step="1"
              value={cameraSettings.pitch * 180 / Math.PI}
              onChange={(e) => setCameraSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) * Math.PI / 180 }))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ fontSize: '12px', marginTop: '16px', opacity: 0.7 }}>
            Controls:
            <br />• WASD / Arrows - Move
            <br />• Mouse Drag - Rotate Camera
            <br />• Mouse Wheel - Zoom
          </div>
        </div>
      )}
      
      {/* Canvas */}
      <Canvas
        shadows
        camera={{ position: [30, 40, 30], fov: 50 }}
        style={{ background: '#87CEEB' }}
      >
        <Scene 
          config={config} 
          input={input}
          cameraSettings={cameraSettings}
        />
      </Canvas>
    </div>
  );
}
