/**
 * BuilderPage - Single-page quest builder with cycling sidebar sections
 * Phase 4.1 - Builder Integration
 *
 * Uses actual TestWorld terrain (LowPolyTerrain, Forest) for the default world
 *
 * Responsive layout:
 * - Landscape: Sidebar on left, 3D canvas on right
 * - Portrait: 3D canvas on top, sidebar at bottom
 */

import React, { useState, useCallback, useEffect, useRef, Suspense, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  TreePine,
  Building2,
  Users,
  Skull,
  Route,
  Volume2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Play,
  Save,
  Cloud,
  Eye,
  EyeOff,
  Home,
  Check,
  Lock,
  ArrowRight,
  Undo,
  Redo,
  Menu as MenuIcon,
  X,
  Layers,
  FolderOpen,
  Sliders,
  Sun,
  Moon,
  Waves,
  MousePointer2,
  Paintbrush,
  Eraser,
  Wind,
  RotateCcw,
  ChevronDown,
  Info,
  Package,
  Plus,
} from 'lucide-react';
import CustomButton from '@/components/CustomButton';
import { TemplateSelector } from '@/components/TemplateSelector';
import { UpgradePromptBanner, useUpgradePrompts } from '@/components/UpgradePrompt';
import MiniGameHUD from '@/components/MiniGameHUD';
import DarknessOverlay from '@/components/DarknessOverlay';
import InventoryUI from '@/components/InventoryUI';
import SliderPuzzleUI from '@/components/SliderPuzzleUI';
import PuzzleBox from '@/components/PuzzleBox';
import CollectibleItem from '@/components/CollectibleItem';
import { useTier } from '@/hooks/useTier';
import { createPreBuiltWorld, getTemplateWorldId, setTemplateWorldId, initializeTemplateWorlds } from '@/data/templateWorlds';
import type { QuestTemplate, QuestCategory, WorldType } from '@/data/quest-templates';
import { globalTTSEngine } from '@/systems/voice/TTSEngine';
import { RecordingEngine, RECORDING_LIMITS } from '@/systems/voice/RecordingEngine';
import { globalMiniGameManager, type MiniGameConfig, DIFFICULTY_PRESETS } from '@/systems/minigames';
import { globalAudioManager } from '@/systems/audio';
import { createRiddleGateGame } from '@/systems/minigames/noncombat/RiddleGateMiniGame';
import { createSurviveNightGame, DEFAULT_SURVIVE_NIGHT_PARAMS } from '@/systems/minigames/combat/SurviveNightMiniGame';
import { createDefeatBossGame, DEFAULT_DEFEAT_BOSS_PARAMS } from '@/systems/minigames/combat/DefeatBossMiniGame';
import { createEnemyWavesGame, DEFAULT_ENEMY_WAVES_PARAMS } from '@/systems/minigames/combat/EnemyWavesMiniGame';
import { createSliderPuzzleGame, DEFAULT_SLIDER_PUZZLE_PARAMS } from '@/systems/minigames/noncombat/SliderPuzzleMiniGame';
import { createCollectReturnGame, DEFAULT_COLLECT_RETURN_PARAMS } from '@/systems/minigames/noncombat/CollectReturnMiniGame';
import { getNPCManager } from '@/systems/npc';
import {
  TerrainTemplate,
  BuildingTemplate,
  getTerrainTemplates,
  getBuildingTemplates,
  getDefaultTerrainConfig,
  getDefaultBuildingConfig,
} from '@/systems/templates/TemplateManager';
import { WorldConfig } from '@/systems/world/WorldConfig';
import { SavedCastleBuild, BUILDING_ASSET_PACKS, BuildingAssetPack } from './CastleBuilder';
import { ASSET_PACKS } from './UserDashboard';
import { InstancedForest } from '@/components/InstancedForest';
import { InstancedRocks } from '@/components/InstancedRocks';
import { InstancedGrass } from '@/components/InstancedGrass';
import { InstancedBushes } from '@/components/InstancedBushes';
import { PhysicsWorldProvider } from '@/components/PhysicsWorldProvider';
import { VolumetricFog } from '@/components/VolumetricFog';
import { OptimizedOcean, WavePreset, waveStrengthToPreset } from '@/components/OptimizedOcean';
import { OptimizedFog, FogDensityPreset, bubbleDensityToPreset } from '@/components/OptimizedFog';
import { BuildingAreaGizmo } from '@/components/BuildingAreaGizmo';
import { MoveRotateGizmo } from '@/components/MoveRotateGizmo';
import { GhostPreviewHandler } from '@/components/GhostPreviewHandler';
import { GhostBuilding } from '@/components/GhostBuilding';
import { GhostNPC } from '@/components/GhostNPC';
import { PlacedBuilding } from '@/components/PlacedBuilding';
import { PlacedNPC } from '@/components/PlacedNPC';
import SidebarMenu from '@/components/SidebarMenu';
import { ActionBar, ActionSlot } from '@/components/ActionBar';
import { RadialMenu } from '@/components/RadialMenu';
import { generateSimplexTerrain, sampleTerrainHeight } from '@/utils/simplexTerrain';
import { animationManager } from '@/systems/animation/AnimationManager';
import { createNoise2D } from 'simplex-noise';
import { oceanVertexShader, oceanFragmentShader, skyboxVertexShader, skyboxFragmentShader } from '@/shaders/OceanShaders';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useCharacterAnimation } from '@/hooks/useCharacterAnimation';
import { getWeaponConfig, getShieldConfig } from '@/data/weapon-configs';
import { cloneGltf } from '@/utils/cloneGltf';
import { getAssetPath } from '@/utils/assetPath';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { InlineUpgradePrompt } from '@/components/UpgradePrompt';

// UI Mode System
import { useUIModeStore, useIsSuperuser, useCanUseFeature } from '@/stores/uiModeStore';
import { UIModeSelector } from '@/components/superuser/UIModeSelector';
import { SuperuserPanel } from '@/components/superuser/SuperuserPanel';
import { ValidationPanel } from '@/components/superuser/ValidationPanel';

// Avatar Settings
import { useAvatarSettings } from '@/stores/settingsStore';

// Undo/Redo System
import {
  UndoRedoSystem,
  createModifyTerrainCommand,
  createCreatePathCommand,
  createPlaceAssetCommand,
  createRemoveAssetCommand,
  createBatchCommand,
  setupKeyboardShortcuts,
  type Command,
} from '@/systems/undo/UndoRedoSystem';

// Performance Budgets
import { usePerformanceBudgets, getPerformanceBudgetManager } from '@/systems/world/PerformanceBudgets';

// Scene Validation
import { createEmptySceneData, type WorldSceneData } from '@/systems/world/SceneValidation';

// World Storage (Local)
import { saveWorld, loadWorld, deleteWorld, type WorldData } from '@/utils/worldStorage';

// Terrain Tools - Types only for now (components render inside Canvas)
import {
  type BrushMode,
  DEFAULT_BRUSH_CONFIG,
  undoModification,
  redoModification,
} from '@/systems/terrain/TerrainBrush';
import { TerrainBrushTool } from '@/components/TerrainBrushTool';
import { PathToolComponent, type PathSegment, type PathModification } from '@/components/PathToolComponent';
import EraseTool, { useEraseableAssets, type EraseMode, type EraseableAsset } from '@/components/EraseTool';

// Patch three.js with three-mesh-bvh for accelerated raycasting
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Animation Updater Component - With distance-based culling for performance
function AnimationUpdater() {
  useFrame((state, delta) => {
    const speedMultiplier = 0.75;
    // Pass camera position for distance-based animation culling
    // Characters >50 units from camera skip animation updates entirely
    // Characters 30-50 units update every 3 frames
    animationManager.update(delta * speedMultiplier, state.camera.position);
    globalMiniGameManager.update(delta);
  });
  return null;
}

function NPCSystemUpdater({
  isActive,
  playerPosition,
}: {
  isActive: boolean;
  playerPosition: [number, number, number];
}) {
  const manager = useMemo(() => getNPCManager(), []);

  useFrame((_, delta) => {
    if (!isActive) return;
    manager.update(delta, {
      x: playerPosition[0],
      y: playerPosition[1],
      z: playerPosition[2],
    });
  });

  return null;
}

// Performance monitoring component
function PerformanceMonitor() {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);
  const memoryCheckIntervalRef = useRef(0);
  const lastFpsWarningRef = useRef(0);
  const lastMemoryWarningRef = useRef(0);

  useFrame(({ gl }) => {
    frameCountRef.current++;
    memoryCheckIntervalRef.current++;
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      fpsRef.current = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastTimeRef.current = now;

      // Warn if FPS drops below 30, but throttle to once every 5 seconds
      if (fpsRef.current < 30 && (now - lastFpsWarningRef.current) > 5000) {
        lastFpsWarningRef.current = now;
        console.warn(`[Performance] Low FPS detected: ${fpsRef.current} fps`);
      }
    }

    // ===== GPU MEMORY MONITORING (Feb 6, 2026) =====
    // Check GPU memory usage every 5 seconds (300 frames at 60fps)
    if (memoryCheckIntervalRef.current >= 300) {
      memoryCheckIntervalRef.current = 0;
      const info = gl.info;
      const geometries = info.memory?.geometries ?? 0;
      const textures = info.memory?.textures ?? 0;

      // Warn if approaching memory limits, but throttle to once every 10 seconds
      if ((geometries > 400 || textures > 80) && (now - lastMemoryWarningRef.current) > 10000) {
        lastMemoryWarningRef.current = now;
        console.warn(`[Memory] High GPU memory usage - Geometries: ${geometries}, Textures: ${textures}`);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:241',message:'High GPU memory usage',data:{geometries,textures},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }

      // Critical warning if over limits, but throttle to once every 10 seconds
      if ((geometries > 500 || textures > 100) && (now - lastMemoryWarningRef.current) > 10000) {
        lastMemoryWarningRef.current = now;
        console.error(`[Memory] CRITICAL: GPU memory exhaustion risk - Geometries: ${geometries}, Textures: ${textures}`);
      }
    }
  });

  return null;
}

// Terrain Click Handler Component - handles raycasting for asset placement
interface TerrainClickHandlerProps {
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  selectedAsset: string | null;
  onPlaceAsset: (position: [number, number, number], assetType: string) => void;
}

// Terrain click handler for deselecting - clicks on terrain (not buildings/NPCs) deselect
function TerrainDeselectHandler({ 
  terrainMeshRef, 
  onDeselect,
  selectedBuildingId,
  selectedNPCId,
  placedBuildings,
  placedNPCs
}: { 
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  onDeselect: () => void;
  selectedBuildingId: string | null;
  selectedNPCId: string | null;
  placedBuildings: Array<{ id: string; pos: [number, number, number] }>;
  placedNPCs: Array<{ id: string; pos: [number, number, number] }>;
}) {
  const { camera, gl, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    // Only handle deselection if something is selected
    if (!selectedBuildingId && !selectedNPCId) return;

    const handleClick = (event: MouseEvent) => {
      // Add delay to allow building/NPC onClick handlers to fire first
      // Increased delay to ensure building selection happens before deselection check
      setTimeout(() => {
        if (!terrainMeshRef.current) return;

        // Get canvas bounds
        const rect = gl.domElement.getBoundingClientRect();

        // Calculate normalized device coordinates
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        // Raycast to all objects in scene
        raycaster.setFromCamera(mouse, camera);

        // First check if we clicked on any building or NPC by traversing the scene
        const allSceneIntersects = raycaster.intersectObjects(scene.children, true);
        if (allSceneIntersects.length > 0) {
          // Walk up the parent chain to see if any parent has isBuilding/isNPC
          let obj: THREE.Object3D | null = allSceneIntersects[0].object;
          while (obj) {
            if (obj.userData?.isBuilding || obj.userData?.isNPC) {
              // Clicked on a building/NPC - don't deselect, let component handle selection
              return;
            }
            obj = obj.parent;
          }
        }

        // Also check if we clicked on any building or NPC directly
        const allObjects: THREE.Object3D[] = [];
        scene.traverse((obj) => {
          if (obj.userData?.isBuilding || obj.userData?.isNPC) {
            allObjects.push(obj);
          }
        });

        const objectIntersects = raycaster.intersectObjects(allObjects, true);

        // If we clicked on a building or NPC, don't deselect (let the component handle selection)
        if (objectIntersects.length > 0) {
          return;
        }

        // Check if we clicked on terrain - if so, deselect
        const terrainIntersects = raycaster.intersectObject(terrainMeshRef.current, false);
        
        if (terrainIntersects.length > 0) {
          onDeselect();
        }
      }, 50); // Increased delay to allow building onClick to fire first and complete
    };

    gl.domElement.addEventListener('click', handleClick, true); // Use capture phase
    return () => gl.domElement.removeEventListener('click', handleClick, true);
  }, [selectedBuildingId, selectedNPCId, terrainMeshRef, camera, gl, scene, raycaster, onDeselect, placedBuildings, placedNPCs]);

  return null;
}

function TerrainClickHandler({ terrainMeshRef, selectedAsset, onPlaceAsset, getTerrainHeight }: TerrainClickHandlerProps & { getTerrainHeight: (x: number, z: number) => number }) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    if (!selectedAsset) return;

    const handleClick = (event: MouseEvent) => {
      if (!terrainMeshRef.current) return;

      // Get canvas bounds
      const rect = gl.domElement.getBoundingClientRect();

      // Only process clicks within canvas bounds
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }

      // Calculate normalized device coordinates
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Raycast to terrain
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrainMeshRef.current, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        // Use getTerrainHeight to ensure correct height calculation
        const terrainY = getTerrainHeight(point.x, point.z);
        onPlaceAsset([point.x, terrainY, point.z], selectedAsset);
      } else {
        // If raycast doesn't hit terrain directly (e.g., clicked on object),
        // project the ray to the terrain plane to get approximate position
        const ray = raycaster.ray;
        // Project to y=0 plane (or use average terrain height)
        if (Math.abs(ray.direction.y) > 0.001) {
          const t = -ray.origin.y / ray.direction.y;
          const projectedPoint = ray.at(t);
          const terrainY = getTerrainHeight(projectedPoint.x, projectedPoint.z);
          onPlaceAsset([projectedPoint.x, terrainY, projectedPoint.z], selectedAsset);
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [selectedAsset, terrainMeshRef, camera, gl, raycaster, onPlaceAsset, getTerrainHeight]);

  return null;
}

// Drop Mode Click Handler - For placing player on terrain
interface DropModeClickHandlerProps {
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  isDropMode: boolean;
  onDropPlayer: (position: [number, number, number]) => void;
}

function DropModeClickHandler({ terrainMeshRef, isDropMode, onDropPlayer }: DropModeClickHandlerProps) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    if (!isDropMode) return;

    const handleClick = (event: MouseEvent) => {
      if (!terrainMeshRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(terrainMeshRef.current, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        onDropPlayer([point.x, point.y + 1, point.z]);
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [isDropMode, terrainMeshRef, camera, gl, raycaster, onDropPlayer]);

  return null;
}

// ============================================================================
// CHARACTER CONTROLLER (from TestWorld) - For Play Test Mode
// ============================================================================

type CrossfadeFn = (anim: string, duration?: number) => void;

function PlayTestCharacter({
  startPosition,
  terrainMeshRef,
  proceduralTrees,
  proceduralRocks,
  manualTrees,
  manualRocks,
  placedBuildings,
  placedNPCs,
  manualObjects,
  getTerrainHeight,
  characterHeightOffset = 0.9,
  islandSize,
  isSquareTerrain,
  fogOffset,
  terrainSize,
  isPlayMode,
  onRef,
  setCurrentPlayerPosition,
}: {
  startPosition: [number, number, number];
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  proceduralTrees: Array<{ pos: [number, number, number]; scale: number }>;
  proceduralRocks: Array<{ pos: [number, number, number]; scale: number }>;
  manualTrees: Array<{ pos: [number, number, number]; scale: number }>;
  manualRocks: Array<{ pos: [number, number, number]; scale: number }>;
  placedBuildings?: Array<{ id: string; pos: [number, number, number]; scale: number; assetType: string; bounds?: { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3; center: THREE.Vector3 } }>;
  placedNPCs?: Array<{ id: string; pos: [number, number, number] }>;
  manualObjects?: Array<{ id: string; pos: [number, number, number]; scale: number; assetType: string }>;
  getTerrainHeight: (x: number, z: number) => number;
  characterHeightOffset?: number;
  islandSize: number;
  isSquareTerrain: boolean;
  fogOffset: number;
  terrainSize: number;
  isPlayMode: boolean;
  onRef?: (ref: { attack: () => void; block: () => void; blockRelease: () => void; jump: () => void; playAnimation: (name: string) => void }) => void;
  setCurrentPlayerPosition?: (position: [number, number, number]) => void;
}) {
  const characterRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef<THREE.Vector3>(new THREE.Vector3(...startPosition));
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(...startPosition));
  const rotationRef = useRef(0); // Start facing TOWARD camera (0 degrees)
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const velocity = useRef(new THREE.Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const isMoving = useRef(false);
  const keys = useRef<{[key: string]: boolean}>({});
  const jumpPressed = useRef(false);
  const lastPositionUpdate = useRef(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const attackButtonPressed = useRef(false);
  const blockButtonPressed = useRef(false);
  const { camera } = useThree();
  
  // Auto-rotation state - player starts facing camera, then rotates after delay
  const hasAutoRotated = useRef(false);
  const spawnTime = useRef(Date.now());

  // Smooth camera follow - prevents camera from spinning wildly when player rotates
  const cameraRotationRef = useRef(0);

  // Weapon/shield refs
  const swordRef = useRef<THREE.Group | null>(null);
  const shieldRef = useRef<THREE.Group | null>(null);

  // Load character model and weapons
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        const modelPath = getAssetPath('/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb');
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(modelPath, resolve, undefined, reject);
        });

        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        characterScene.scale.setScalar(1);
        characterScene.position.set(0, 0, 0);
        characterScene.visible = true;

        characterScene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.visible = true;
          }
        });

        if (gltf.animations && gltf.animations.length > 0) {
          characterScene.userData.builtInAnimations = gltf.animations;
        }

        // Load and attach sword to right hand bone
        try {
          const swordPath = getAssetPath('/Assets/weapons/sword_1handed.gltf');
          const swordGltf = await new Promise<GLTF>((resolve, reject) => {
            loader.load(swordPath, resolve, undefined, reject);
          });
          const sword = cloneGltf(swordGltf).scene;
          sword.userData.isWeapon = true;
          sword.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Find right hand bone
          let handBone: THREE.Bone | null = null;
          const boneNames = ['handslotr', 'handr', 'hand.r', 'Hand_R', 'hand_right', 'righthand'];
          
          characterScene.traverse((node: THREE.Object3D) => {
            if (handBone) return;
            if (node instanceof THREE.Bone) {
              const nodeName = node.name.toLowerCase();
              if (boneNames.some(name => nodeName === name.toLowerCase())) {
                handBone = node;
                console.log(`[PlayTestCharacter] Found right hand bone: ${node.name}`);
              }
            }
          });

          if (handBone) {
            // Use player-specific config (isPlayer = true)
            const config = getWeaponConfig(swordPath, undefined, true);
            
            sword.scale.setScalar(config.scale);
            sword.position.set(...config.position);
            sword.rotation.set(...config.rotation);
            
            (handBone as THREE.Object3D).add(sword);
            swordRef.current = sword as any;
            console.log(`[PlayTestCharacter] ✓ Sword attached successfully with config:`, config);
          } else {
            console.warn(`[PlayTestCharacter] Could not find right hand bone for sword`);
            // Fallback: attach to scene root (will be at feet, but better than nothing)
            characterScene.add(sword);
          }
        } catch (err) {
          console.warn('[PlayTestCharacter] Failed to load sword:', err);
        }

        // Load and attach shield to left hand bone
        try {
          const shieldPath = getAssetPath('/Assets/weapons/shield_round.gltf');
          const shieldGltf = await new Promise<GLTF>((resolve, reject) => {
            loader.load(shieldPath, resolve, undefined, reject);
          });
          const shield = cloneGltf(shieldGltf).scene;
          shield.userData.isShield = true;
          shield.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Find left hand bone
          let leftHandBone: THREE.Bone | null = null;
          const leftBoneNames = ['handslotl', 'handl', 'hand.l', 'Hand_L', 'hand_left', 'lefthand'];
          
          characterScene.traverse((node: THREE.Object3D) => {
            if (leftHandBone) return;
            if (node instanceof THREE.Bone) {
              const nodeName = node.name.toLowerCase();
              if (leftBoneNames.some(name => nodeName === name.toLowerCase())) {
                leftHandBone = node;
                console.log(`[PlayTestCharacter] Found left hand bone: ${node.name}`);
              }
            }
          });

          if (leftHandBone) {
            // Use player-specific config (isPlayer = true)
            const config = getShieldConfig(shieldPath, undefined, true);
            
            shield.scale.setScalar(config.scale);
            shield.position.set(...config.position);
            shield.rotation.set(...config.rotation);
            
            (leftHandBone as THREE.Object3D).add(shield);
            shieldRef.current = shield as any;
            console.log(`[PlayTestCharacter] ✓ Shield attached successfully with config:`, config);
          } else {
            console.warn(`[PlayTestCharacter] Could not find left hand bone for shield`);
            // Fallback: attach to scene root (will be at feet, but better than nothing)
            characterScene.add(shield);
          }
        } catch (err) {
          console.warn('[PlayTestCharacter] Failed to load shield:', err);
        }

        setModel(characterScene);
        setModelLoaded(true);
      } catch (err) {
        console.error('[PlayTestCharacter] Failed to load character model:', err);
        setModelLoaded(true);
      }
    };

    loadCharacter();
  }, []);

  // Skip undo/redo setup in PlayTestCharacter - undo/redo is handled in BuilderPage parent component
  // PlayTestCharacter is for play mode only, where undo/redo is not needed

  // Character animation
  const { crossfadeTo, isLoaded: animationsLoaded } = useCharacterAnimation({
    characterId: 'builder-player',
    assetId: 'char_rogue',
    model: model,
    defaultAnimation: 'idle',
  });

  // Mobile button handlers - expose attack/block/jump functions
  const handleAttack = useCallback(() => {
    setIsAttacking(true);
    attackButtonPressed.current = true;
    
    // Notify mini-game system of attack
    if (isPlayMode && playTestCharacterRef.current) {
      const playerPos = positionRef.current;
      globalMiniGameManager.handlePlayerAction('attack', {
        position: [playerPos.x, playerPos.y, playerPos.z],
      });
    }
    
    setTimeout(() => {
      setIsAttacking(false);
      attackButtonPressed.current = false;
    }, 300);
  }, [isPlayMode]);

  const handleBlock = useCallback(() => {
    setIsBlocking(true);
    blockButtonPressed.current = true;
  }, []);

  const handleBlockRelease = useCallback(() => {
    setIsBlocking(false);
    blockButtonPressed.current = false;
  }, []);

  const handleJump = useCallback(() => {
    if (isGrounded.current && !jumpPressed.current) {
      verticalVelocity.current = 6.5;
      isGrounded.current = false;
      jumpPressed.current = true;
      if (animationsLoaded) crossfadeTo('jump', 0.1);
    }
  }, [animationsLoaded, crossfadeTo]);

  // Play animation function for action bar
  const playAnimation = useCallback((animationName: string) => {
    if (animationsLoaded && crossfadeTo) {
      crossfadeTo(animationName, 0.2, 1.0);
    }
  }, [animationsLoaded, crossfadeTo]);

  // Expose handlers to parent via ref
  useEffect(() => {
    if (onRef) {
      onRef({
        attack: handleAttack,
        block: handleBlock,
        blockRelease: handleBlockRelease,
        jump: handleJump,
        playAnimation,
      });
    }
  }, [onRef, handleAttack, handleBlock, handleBlockRelease, handleJump, playAnimation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = true;
      if (e.code === 'Space' || key === ' ') {
        keys.current[' '] = true;
        keys.current['Space'] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = false;
      if (e.code === 'Space' || key === ' ') {
        keys.current[' '] = false;
        keys.current['Space'] = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click - attack
        setIsAttacking(true);
        attackButtonPressed.current = true;
      } else if (e.button === 2) { // Right click - block
        setIsBlocking(true);
        blockButtonPressed.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsAttacking(false);
        attackButtonPressed.current = false;
      } else if (e.button === 2) {
        setIsBlocking(false);
        blockButtonPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent right-click menu

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Collision detection - check both procedural and manual trees/rocks, and fog boundary
  const checkCollision = (newPos: THREE.Vector3) => {
    const characterBox = new THREE.Box3(
      new THREE.Vector3(newPos.x - 0.3, newPos.y - 0.6, newPos.z - 0.2),
      new THREE.Vector3(newPos.x + 0.3, newPos.y + 0.6, newPos.z + 0.2)
    );

    // Check fog boundary collision barrier - prevent walking off edge
    // Match fog edge calculation: halfSize = islandSize + fogOffset for both square and circular
    const boundaryRadius = islandSize + fogOffset;
    const distanceFromCenter = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
    if (distanceFromCenter > boundaryRadius) {
      return true; // Block movement beyond boundary
    }

    // Check all trees (procedural + manual) - use exact geometry bounds
    const allTrees = [...proceduralTrees, ...manualTrees];
    for (const tree of allTrees) {
      const groundY = tree.pos[1];
      const treeScale = tree.scale || 1.0;
      
      // Compute exact bounding box from tree geometry
      // Tree geometry is approximately 1 unit wide and 3 units tall at scale 1
      // Base radius ~0.3, height ~3.0
      const baseRadius = 0.3 * treeScale;
      const height = 3.0 * treeScale;
      
      // Create bounding box accounting for rotation (simplified - uses AABB)
      const treeBox = new THREE.Box3(
        new THREE.Vector3(tree.pos[0] - baseRadius, groundY, tree.pos[2] - baseRadius),
        new THREE.Vector3(tree.pos[0] + baseRadius, groundY + height, tree.pos[2] + baseRadius)
      );
      if (characterBox.intersectsBox(treeBox)) return true;
    }

    // Check all rocks (procedural + manual) - use exact geometry bounds
    const allRocks = [...proceduralRocks, ...manualRocks];
    for (const rock of allRocks) {
      const groundY = rock.pos[1];
      const rockScale = (rock.scale || 1.0) * 1.5; // Match InstancedRocks scale multiplier
      
      // Compute exact bounding box from rock geometry
      // Rock geometry varies, but average is ~0.8 units tall and ~1.2 units wide at scale 1
      const baseRadius = 0.6 * rockScale;
      const height = 0.8 * rockScale;
      
      if (height < 0.6) continue; // Allow stepping over small rocks

      const rockBox = new THREE.Box3(
        new THREE.Vector3(rock.pos[0] - baseRadius, groundY, rock.pos[2] - baseRadius),
        new THREE.Vector3(rock.pos[0] + baseRadius, groundY + height, rock.pos[2] + baseRadius)
      );
      if (characterBox.intersectsBox(rockBox)) return true;
    }

    // Check placed buildings - use exact mesh bounding boxes with world transforms
    if (placedBuildings) {
      for (const building of placedBuildings) {
        // Use exact bounds if available, otherwise fallback to approximate
        if (building.bounds) {
          // Bounds are already in world space (computed with position, rotation, scale applied)
          // So we can use them directly without additional transformation
          const buildingBox = new THREE.Box3(building.bounds.min, building.bounds.max);
          
          if (characterBox.intersectsBox(buildingBox)) return true;
        } else {
          // Fallback to approximate collision for buildings without computed bounds
          // Use larger values to better match typical building sizes (castles, cottages, etc.)
          const groundY = building.pos[1];
          const buildingHalfSize = building.scale * 2.0; // Buildings are typically 4+ units wide
          const buildingHeight = building.scale * 3.0;   // Buildings are typically 3+ units tall
          const buildingBox = new THREE.Box3(
            new THREE.Vector3(building.pos[0] - buildingHalfSize, groundY, building.pos[2] - buildingHalfSize),
            new THREE.Vector3(building.pos[0] + buildingHalfSize, groundY + buildingHeight, building.pos[2] + buildingHalfSize)
          );
          if (characterBox.intersectsBox(buildingBox)) return true;
        }
      }
    }

    // Check placed NPCs - NPCs have collision
    if (placedNPCs) {
      for (const npc of placedNPCs) {
        const groundY = npc.pos[1];
        const npcBox = new THREE.Box3(
          new THREE.Vector3(npc.pos[0] - 0.3, groundY, npc.pos[2] - 0.3),
          new THREE.Vector3(npc.pos[0] + 0.3, groundY + 2.0, npc.pos[2] + 0.3)
        );
        if (characterBox.intersectsBox(npcBox)) return true;
      }
    }

    // Check manual objects (barrels, crates, etc.) - objects have collision, but not grass/bushes
    if (manualObjects) {
      for (const obj of manualObjects) {
        // Skip grass and bushes - they don't have collision
        if (obj.assetType === 'grass' || obj.assetType === 'bush') continue;
        
        const groundY = obj.pos[1];
        // Estimate object size based on type
        let objHalfSize = obj.scale * 0.3;
        let objHeight = obj.scale * 0.6;
        
        if (obj.assetType.includes('barrel')) {
          objHalfSize = obj.scale * 0.3;
          objHeight = obj.scale * 0.5;
        } else if (obj.assetType.includes('crate') || obj.assetType.includes('chest')) {
          objHalfSize = obj.scale * 0.3;
          objHeight = obj.scale * 0.4;
        }
        
        const objBox = new THREE.Box3(
          new THREE.Vector3(obj.pos[0] - objHalfSize, groundY, obj.pos[2] - objHalfSize),
          new THREE.Vector3(obj.pos[0] + objHalfSize, groundY + objHeight, obj.pos[2] + objHalfSize)
        );
        if (characterBox.intersectsBox(objBox)) return true;
      }
    }

    return false;
  };

  // Movement and camera update
  useFrame((_, delta) => {
    if (!characterRef.current) return;

    const moveSpeed = 8;
    const rotSpeed = 3;
    const jumpForce = 6.5;
    const gravity = -15;
    
    // Auto-rotation: After 1.5 seconds, smoothly rotate to face away from camera
    if (!hasAutoRotated.current) {
      const timeSinceSpawn = (Date.now() - spawnTime.current) / 1000;
      if (timeSinceSpawn > 1.5) {
        // Smoothly interpolate rotation from 0 to PI over ~1 second
        const targetRotation = Math.PI;
        const rotationDiff = targetRotation - rotationRef.current;
        if (Math.abs(rotationDiff) > 0.01) {
          rotationRef.current += rotationDiff * Math.min(delta * 2, 1);
        } else {
          rotationRef.current = targetRotation;
          hasAutoRotated.current = true;
        }
      }
    }

    // Check if moving
    const wasMoving = isMoving.current;
    isMoving.current = keys.current['w'] || keys.current['s'] || keys.current['arrowup'] || keys.current['arrowdown'];

    // Update animation
    if (animationsLoaded) {
      if (!isGrounded.current) {
        // Jumping handled below
      } else if (isMoving.current && !wasMoving) {
        crossfadeTo('run', 0.2);
      } else if (!isMoving.current && wasMoving) {
        crossfadeTo('idle', 0.2);
      }
    }

    // Jump
    const spacePressed = keys.current[' '] || keys.current['Space'];
    if (spacePressed && isGrounded.current && !jumpPressed.current) {
      verticalVelocity.current = jumpForce;
      isGrounded.current = false;
      jumpPressed.current = true;
      if (animationsLoaded) crossfadeTo('jump', 0.1, 1.0);
    }
    if (!spacePressed) jumpPressed.current = false;

    // Gravity
    verticalVelocity.current += gravity * delta;

    // WASD movement
    if (keys.current['w'] || keys.current['arrowup']) {
      velocity.current.z = -moveSpeed * delta;
    } else if (keys.current['s'] || keys.current['arrowdown']) {
      velocity.current.z = moveSpeed * delta;
    } else {
      velocity.current.z = 0;
    }

    // Rotation
    if (keys.current['a'] || keys.current['arrowleft']) {
      rotationRef.current += rotSpeed * delta;
    }
    if (keys.current['d'] || keys.current['arrowright']) {
      rotationRef.current -= rotSpeed * delta;
    }

    const currentRotation = rotationRef.current;
    const rotatedVelocity = velocity.current.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), currentRotation);

    // Get terrain heights
    const currentTerrainHeight = getTerrainHeight(positionRef.current.x, positionRef.current.z);
    const proposedX = positionRef.current.x + rotatedVelocity.x;
    const proposedZ = positionRef.current.z + rotatedVelocity.z;
    const terrainHeightAtNewPos = getTerrainHeight(proposedX, proposedZ);

    // Hill climbing
    if (terrainHeightAtNewPos !== null && currentTerrainHeight !== null) {
      const heightDifference = terrainHeightAtNewPos - currentTerrainHeight;
      const maxClimbableHeight = 0.5;

      if (heightDifference > maxClimbableHeight && isGrounded.current) {
        const targetY = terrainHeightAtNewPos + characterHeightOffset;
        if (positionRef.current.y < targetY - 0.1) {
          const lerpFactor = Math.min(1.0, delta * 25);
          positionRef.current.y = THREE.MathUtils.lerp(positionRef.current.y, targetY, lerpFactor);
          if (Math.abs(positionRef.current.y - targetY) > 0.2) {
            rotatedVelocity.multiplyScalar(0.3);
          }
        }
      }
    }

    // Update position
    const newPos = positionRef.current.clone();
    newPos.x += rotatedVelocity.x;
    newPos.z += rotatedVelocity.z;
    newPos.y += verticalVelocity.current * delta;
    
    // Notify mini-game system of player position (for Collect & Return, proximity checks)
    if (isPlayMode && setCurrentPlayerPosition) {
      const playerPos: [number, number, number] = [newPos.x, newPos.y, newPos.z];
      setCurrentPlayerPosition(playerPos);
      globalMiniGameManager.handlePlayerAction('player_position', {
        position: playerPos,
      });
    }

    // Apply collision and terrain snapping
    if (!checkCollision(newPos)) {
      if (terrainHeightAtNewPos !== null) {
        const targetY = terrainHeightAtNewPos + characterHeightOffset;
        const groundDistance = newPos.y - terrainHeightAtNewPos;
        const threshold = characterHeightOffset + 0.3;

        if (isGrounded.current || (verticalVelocity.current <= 0 && groundDistance <= threshold)) {
          const lerpFactor = Math.min(1.0, delta * 25);
          newPos.y = THREE.MathUtils.lerp(newPos.y, targetY, lerpFactor);
          if (newPos.y < targetY) newPos.y = targetY;
          verticalVelocity.current = 0;
          isGrounded.current = true;
        } else {
          if (verticalVelocity.current < 0 && newPos.y <= targetY) {
            newPos.y = targetY;
            verticalVelocity.current = 0;
            isGrounded.current = true;
          }
        }
      } else {
        if (verticalVelocity.current < 0 && newPos.y < 2) {
          newPos.y = 2;
          verticalVelocity.current = 0;
          isGrounded.current = true;
        }
      }

      positionRef.current.copy(newPos);
      if (characterRef.current) characterRef.current.position.copy(newPos);

      const now = Date.now();
      if (now - lastPositionUpdate.current > 100) {
        setPosition(newPos.clone());
        lastPositionUpdate.current = now;
      }
    }

    // Third-person camera - positioned behind character with smooth rotation
    // Camera follows character rotation independently (doesn't rotate with character body)
    // Smoothly interpolate camera rotation to follow player rotation (prevents jarring spins)
    const rotationDiff = currentRotation - cameraRotationRef.current;
    // Normalize rotation difference to -PI to PI range
    let normalizedDiff = rotationDiff;
    while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
    while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    // Smoothly follow with lerp factor (higher = faster follow)
    cameraRotationRef.current += normalizedDiff * Math.min(delta * 5, 1);

    // Camera offset is in world space, not character-local space
    // This prevents camera from rotating with character body
    const cameraOffset = new THREE.Vector3(0, 4, 6);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationRef.current);
    camera.position.copy(positionRef.current).add(cameraOffset);
    // Look at character position (not rotated with character)
    camera.lookAt(positionRef.current.x, positionRef.current.y + 1, positionRef.current.z);
  });

  // Update group rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotationRef.current;
    }
  });

  return (
    <group ref={characterRef} position={position}>
      <group ref={groupRef} rotation={[0, rotationRef.current, 0]} scale={1.0}>
        {model ? (
          <primitive object={model} />
        ) : (
          !modelLoaded ? (
            <mesh>
              <boxGeometry args={[1, 2, 1]} />
              <meshStandardMaterial color="orange" />
            </mesh>
          ) : null
        )}
      </group>
    </group>
  );
}

// ============================================================================
// TERRAIN COMPONENTS (from TestWorld)
// ============================================================================

interface BuildingArea {
  id: number;
  x: number;
  z: number;
  radius: number;
  height: number;
  minimized?: boolean;
}

// Heightmap-based terrain component with ref forwarding for BVH
const LowPolyTerrain = React.forwardRef<THREE.Mesh, {
  roughness: number;
  islandSize: number;
  seed: number;
  terrainDetail: number;
  heightScale: number;
  cliffIntensity: number;
  buildingAreas: BuildingArea[];
  isSquareTerrain: boolean;
  noiseType: 'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent';
  onTerrainReady?: () => void;
}>(({
  roughness,
  islandSize,
  seed,
  terrainDetail,
  heightScale,
  cliffIntensity,
  buildingAreas,
  isSquareTerrain,
  noiseType,
  onTerrainReady
}, ref) => {
  const terrainSize = terrainDetail;
  const scale = isSquareTerrain ? (islandSize * 2) : 200;
  const terrainDataRef = useRef<ReturnType<typeof generateSimplexTerrain> | null>(null);

  const generateHeightmap = () => {
    const size = terrainSize + 1;

    const terrainData = generateSimplexTerrain({
      size: terrainSize,
      scale,
      seed,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      islandRadius: islandSize,
      heightScale,
      roughness,
      isSquareTerrain,
      noiseType,
    });

    terrainDataRef.current = terrainData;

    const heights: number[] = [];
    const colors: THREE.Color[] = [];

    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const idx = x + z * size;
        let height = terrainData.heights[idx];

        if (buildingAreas.length > 0) {
          const worldX = ((x / terrainSize) - 0.5) * scale;
          const worldZ = ((z / terrainSize) - 0.5) * scale;

          for (const area of buildingAreas) {
            const distToBuildArea = Math.sqrt(
              Math.pow(worldX - area.x, 2) +
              Math.pow(worldZ - area.z, 2)
            );

            const blendRadius = area.radius * 0.2;

            if (distToBuildArea < area.radius - blendRadius) {
              height = area.height;
              break;
            } else if (distToBuildArea < area.radius + blendRadius) {
              // Use smoothstep for smoother blending
              const t = (distToBuildArea - (area.radius - blendRadius)) / (blendRadius * 2);
              const smoothT = t * t * (3 - 2 * t); // Smoothstep function
              height = area.height * (1 - smoothT) + height * smoothT;
              break;
            }
          }
        }

        heights.push(height);
        colors.push(terrainData.colors[idx]);
      }
    }

    return { heights, colors };
  };

  const geometry = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:1199',message:'LowPolyTerrain geometry creation',data:{terrainSize,roughness,islandSize,seed,heightScale,cliffIntensity,buildingAreasCount:buildingAreas.length,noiseType,isSquareTerrain},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const { heights, colors } = generateHeightmap();
    const geom = new THREE.PlaneGeometry(
      scale,
      scale,
      terrainSize,
      terrainSize
    );

    const positions = geom.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 2] = heights[i];
    }

    const colorArray = new Float32Array(colors.length * 3);
    for (let i = 0; i < colors.length; i++) {
      colorArray[i * 3] = colors[i].r;
      colorArray[i * 3 + 1] = colors[i].g;
      colorArray[i * 3 + 2] = colors[i].b;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    geom.computeVertexNormals();
    geom.rotateX(-Math.PI / 2);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:1224',message:'LowPolyTerrain geometry created',data:{vertexCount:positions.length/3,geometryId:geom.id},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return geom;
  }, [terrainSize, roughness, islandSize, seed, heightScale, cliffIntensity, buildingAreas, noiseType, isSquareTerrain]);

  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:1235',message:'LowPolyTerrain geometry effect start',data:{geometryId:geometry?.id},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (geometry) {
      if (geometry.disposeBoundsTree) {
        geometry.disposeBoundsTree();
      }
      if (geometry.computeBoundsTree) {
        geometry.computeBoundsTree();
      }
    }

    if (meshRef.current) {
      meshRef.current.userData.isTerrain = true;
      if (typeof ref === 'function') {
        ref(meshRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<THREE.Mesh | null>).current = meshRef.current;
      }
      // Notify parent that terrain is ready
      if (onTerrainReady) {
        onTerrainReady();
      }
    }

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:1258',message:'LowPolyTerrain geometry effect cleanup',data:{geometryId:geometry?.id},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (geometry && geometry.disposeBoundsTree) {
        geometry.disposeBoundsTree();
      }
    };
  }, [geometry, ref, onTerrainReady]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
});

LowPolyTerrain.displayName = 'LowPolyTerrain';

// Dynamic Skybox Component (from TestWorld)
function DynamicSkybox({
  timeOfDay,
  sunIntensity,
}: {
  timeOfDay: number;
  sunIntensity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.timeOfDay.value = timeOfDay;
      materialRef.current.uniforms.sunIntensity.value = sunIntensity;
      
      // Update sky colors to ensure they're updated (even though shader blends based on timeOfDay)
      materialRef.current.uniforms.skyColorDay.value.setRGB(0.4, 0.6, 0.9);
      materialRef.current.uniforms.skyColorHorizon.value.setRGB(0.75, 0.9, 1.0);
      materialRef.current.uniforms.skyColorNight.value.setRGB(0.227, 0.270, 0.314);
      
      // Update sun direction
      const angle = (timeOfDay - 0.25) * Math.PI * 2;
      const sunDir = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();
      materialRef.current.uniforms.sunDirection.value.copy(sunDir);
      
      // Force material update
      materialRef.current.needsUpdate = true;
    }
  }, [timeOfDay, sunIntensity]);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });
  
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      sunIntensity: { value: sunIntensity },
      skyColorDay: { value: new THREE.Color(0.4, 0.6, 0.9) },
      skyColorHorizon: { value: new THREE.Color(0.75, 0.9, 1.0) },
      skyColorNight: { value: new THREE.Color(0.227, 0.270, 0.314) }, // Matches fog/water night color
      timeOfDay: { value: timeOfDay },
    }),
    [timeOfDay, sunIntensity]
  );
  
  return (
    <mesh renderOrder={-1000}>
      <sphereGeometry args={[5000, 60, 40]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={skyboxVertexShader}
        fragmentShader={skyboxFragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Dynamic Ocean Component
function DynamicOcean({
  waterLevel,
  timeOfDay,
  waveStrength,
  waveSpeed,
  waveAmplitude,
  oceanTransparency,
  oceanSize,
  rippleScale,
}: {
  waterLevel: number;
  timeOfDay: number;
  waveStrength: number;
  waveSpeed: number;
  waveAmplitude: number;
  oceanTransparency: number;
  oceanSize: number;
  rippleScale: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.waveStrength.value = waveStrength;
      materialRef.current.uniforms.waveSpeed.value = waveSpeed;
      materialRef.current.uniforms.waveAmplitude.value = waveAmplitude;
      materialRef.current.uniforms.transparency.value = oceanTransparency;
      materialRef.current.uniforms.rippleScale.value = rippleScale;

      let waterColor;
      if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
        waterColor = new THREE.Color(0.1, 0.3, 0.5);
      } else {
        waterColor = new THREE.Color(0.227, 0.270, 0.314);
      }
      materialRef.current.uniforms.waterColor.value = waterColor;

      const angle = (timeOfDay - 0.25) * Math.PI * 2;
      const sunDir = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();
      materialRef.current.uniforms.sunDirection.value = sunDir;
    }
  }, [timeOfDay, waveStrength, waveSpeed, waveAmplitude, oceanTransparency, rippleScale]);

  useFrame((state) => {
    const material = materialRef.current;
    if (material && material.uniforms) {
      const timeUniform = material.uniforms.time;
      if (timeUniform) {
        timeUniform.value = state.clock.getElapsedTime();
      }
    }
  });

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      waterColor: { value: new THREE.Color(0.1, 0.3, 0.5) },
      waveStrength: { value: waveStrength },
      waveSpeed: { value: waveSpeed },
      waveAmplitude: { value: waveAmplitude },
      specularStrength: { value: 2.0 },
      transparency: { value: oceanTransparency },
      rippleScale: { value: rippleScale },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, waterLevel, 0]} receiveShadow>
      <planeGeometry args={[oceanSize, oceanSize, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        renderOrder={-1}
        needsUpdate
      />
    </mesh>
  );
}

// Forest Props Interface
interface ForestProps {
  roughness: number;
  islandSize: number;
  assetSeed: number;
  terrainDetail: number;
  treeAmount: number;
  treeSize: number;
  grassAmount: number;
  grassSize: number;
  terrainGrassCoverage: number;
  buildingGrassFalloff: number;
  rockAmount: number;
  rockSize: number;
  bushAmount: number;
  bushSize: number;
  heightScale: number;
  cliffIntensity: number;
  treeHeightOffset: number;
  grassHeightOffset: number;
  rockHeightOffset: number;
  bushHeightOffset: number;
  buildingAreas: BuildingArea[];
  slopeAdjustmentIntensity: number;
  getTerrainHeight: (x: number, z: number) => number;
  onAssetsGenerated?: (assets: { trees: Array<{ pos: [number, number, number]; scale: number }>; rocks: Array<{ pos: [number, number, number]; scale: number }> }) => void;
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  isSquareTerrain: boolean;
}

// Forest component - procedurally places trees, grass, rocks, bushes
function Forest(props: ForestProps) {
  const {
    islandSize,
    assetSeed,
    treeAmount,
    treeSize,
    grassAmount,
    grassSize,
    terrainGrassCoverage,
    rockAmount,
    rockSize,
    bushAmount,
    bushSize,
    treeHeightOffset,
    grassHeightOffset,
    rockHeightOffset,
    bushHeightOffset,
    buildingAreas,
    slopeAdjustmentIntensity,
    getTerrainHeight,
    onAssetsGenerated,
    isSquareTerrain
  } = props;

  // Use a ref for getTerrainHeight to avoid dependency changes causing regeneration
  const getTerrainHeightRef = useRef(getTerrainHeight);
  getTerrainHeightRef.current = getTerrainHeight;

  // Generate procedural asset positions - use a stable seeded RNG
  const { trees, rocks, grass, bushes } = useMemo(() => {
    // Create seeded random function for deterministic results
    const seededRandom = (function() {
      let s = assetSeed;
      return function() {
        s = Math.sin(s * 9999) * 10000;
        return s - Math.floor(s);
      };
    })();

    // For island terrain, use larger range to cover full terrain extent
    // Island terrain uses fixed scale of 200 (spans -100 to +100), so use larger range
    // For forest (square terrain), use islandSize which represents half the square side
    const range = isSquareTerrain ? islandSize : Math.max(islandSize * 1.5, 100);

    const isInBuildingArea = (x: number, z: number) => {
      for (const area of buildingAreas) {
        const dist = Math.sqrt(Math.pow(x - area.x, 2) + Math.pow(z - area.z, 2));
        if (dist < area.radius * 1.1) return true;
      }
      return false;
    };

    // Use ref to get current terrain height function
    const getHeight = getTerrainHeightRef.current;

    // Generate trees
    const treePositions: Array<{ pos: [number, number, number]; scale: number; treeType: 'pine' | 'broad' | 'bushy'; rotation: number }> = [];
    for (let i = 0; i < treeAmount; i++) {
      const angle = seededRandom() * Math.PI * 2;
      const radius = seededRandom() * range;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (isInBuildingArea(x, z)) continue;

      const terrainY = getHeight(x, z);
      if (terrainY < 1) continue; // Skip water areas

      const scale = (0.6 + seededRandom() * 0.8) * (treeSize / 100);
      const types: ('pine' | 'broad' | 'bushy')[] = ['pine', 'broad', 'bushy'];
      const treeType = types[Math.floor(seededRandom() * types.length)];

      treePositions.push({
        pos: [x, terrainY + treeHeightOffset, z],
        scale,
        treeType,
        rotation: seededRandom() * Math.PI * 2
      });
    }

    // Generate rocks
    const rockPositions: Array<{ pos: [number, number, number]; scale: number; variant: number; rotation: number }> = [];
    for (let i = 0; i < rockAmount; i++) {
      const angle = seededRandom() * Math.PI * 2;
      const radius = seededRandom() * range;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (isInBuildingArea(x, z)) continue;

      const terrainY = getHeight(x, z);
      if (terrainY < 0.5) continue;

      const scale = (0.4 + seededRandom() * 0.8) * (rockSize / 100);

      rockPositions.push({
        pos: [x, terrainY + rockHeightOffset, z],
        scale,
        variant: Math.floor(seededRandom() * 18),
        rotation: seededRandom() * Math.PI * 2
      });
    }

    // Generate grass - both procedural and in building areas
    const grassPositions: Array<{ pos: [number, number, number]; scale: number; variant: number; rotation: number }> = [];
    
    // Procedural grass (outside building areas)
    for (let i = 0; i < grassAmount; i++) {
      const angle = seededRandom() * Math.PI * 2;
      const radius = seededRandom() * range * (terrainGrassCoverage / 100);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (isInBuildingArea(x, z)) continue;

      const terrainY = getHeight(x, z);
      if (terrainY < 1) continue;

      const scale = (0.5 + seededRandom() * 0.5) * (grassSize / 100);

      grassPositions.push({
        pos: [x, terrainY + grassHeightOffset, z],
        scale,
        variant: Math.floor(seededRandom() * 4),
        rotation: seededRandom() * Math.PI * 2
      });
    }

    // Add grass to building areas automatically
    for (const area of buildingAreas) {
      const grassInArea = Math.floor(area.radius * 0.5); // Density based on area size
      for (let i = 0; i < grassInArea; i++) {
        const angle = seededRandom() * Math.PI * 2;
        const radius = seededRandom() * (area.radius * 0.9); // Stay within area
        const x = area.x + Math.cos(angle) * radius;
        const z = area.z + Math.sin(angle) * radius;
        const terrainY = area.height; // Use building area height

        const scale = (0.5 + seededRandom() * 0.5) * (grassSize / 100);

        grassPositions.push({
          pos: [x, terrainY + grassHeightOffset, z],
          scale,
          variant: Math.floor(seededRandom() * 4),
          rotation: seededRandom() * Math.PI * 2
        });
      }
    }

    // Generate bushes
    const bushPositions: Array<{ pos: [number, number, number]; scale: number; variant: number; rotation: number }> = [];
    for (let i = 0; i < bushAmount; i++) {
      const angle = seededRandom() * Math.PI * 2;
      const radius = seededRandom() * range;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      if (isInBuildingArea(x, z)) continue;

      const terrainY = getHeight(x, z);
      if (terrainY < 1) continue;

      const scale = (0.6 + seededRandom() * 0.6) * (bushSize / 100);

      bushPositions.push({
        pos: [x, terrainY + bushHeightOffset, z],
        scale,
        variant: Math.floor(seededRandom() * 8),
        rotation: seededRandom() * Math.PI * 2
      });
    }

    return { trees: treePositions, rocks: rockPositions, grass: grassPositions, bushes: bushPositions };
  }, [assetSeed, treeAmount, treeSize, grassAmount, grassSize, terrainGrassCoverage, rockAmount, rockSize, bushAmount, bushSize, treeHeightOffset, grassHeightOffset, rockHeightOffset, bushHeightOffset, buildingAreas, islandSize, isSquareTerrain]);

  // Notify parent of generated assets in a separate effect to avoid dependency loop
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:1647',message:'ProceduralAssets onAssetsGenerated effect',data:{treeCount:treePositions.length,rockCount:rockPositions.length,grassCount:grassPositions.length,bushCount:bushPositions.length,assetSeed},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (onAssetsGenerated) {
      onAssetsGenerated({
        trees,
        rocks
      });
    }
  }, [trees, rocks, onAssetsGenerated]);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/d75128b7-db55-4c66-9e78-8f7f24a725ff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BuilderPage.tsx:1659',message:'ProceduralAssets render',data:{treeCount:trees.length,rockCount:rocks.length,grassCount:grass.length,bushCount:bushes.length},timestamp:Date.now(),runId:'perf-debug',hypothesisId:'G'})}).catch(()=>{});
  });
  // #endregion
  return (
    <>
      <InstancedForest trees={trees} castShadow receiveShadow={false} />
      <InstancedRocks rocks={rocks} castShadow receiveShadow={false} />
      {/* PERFORMANCE OPTIMIZATION: Grass & bushes don't cast shadows to reduce GPU overhead */}
        {/* ORIGINAL (pre-optimization): <InstancedGrass grass={grass} castShadow receiveShadow={false} /> */}
        {/* ORIGINAL (pre-optimization): <InstancedBushes bushes={bushes} castShadow receiveShadow={false} /> */}
      <InstancedGrass grass={grass} castShadow={false} receiveShadow={false} />
      <InstancedBushes bushes={bushes} castShadow={false} receiveShadow={false} />
    </>
  );
}

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type BuilderSection =
  | 'terrain'
  | 'buildings'
  | 'objects'
  | 'characters'
  | 'creatures'
  | 'paths'
  | 'audio'
  | 'settings';

interface SectionConfig {
  id: BuilderSection;
  label: string;
  userLabel: string; // Friendly name from naming conventions
  icon: React.ElementType;
  description: string;
  tier: 'free' | 'creator' | 'pro';
}

const BUILDER_SECTIONS: SectionConfig[] = [
  {
    id: 'terrain',
    label: 'Terrain',
    userLabel: 'Nature',
    icon: TreePine,
    description: 'Add trees, rocks, grass, and bushes',
    tier: 'free'
  },
  {
    id: 'buildings',
    label: 'Buildings',
    userLabel: 'Places',
    icon: Building2,
    description: 'Place villages, castles, and homes',
    tier: 'free'
  },
  {
    id: 'objects',
    label: 'Objects',
    userLabel: 'Objects',
    icon: Package,
    description: 'Place individual trees, rocks, barrels, chests, and other objects',
    tier: 'free'
  },
  {
    id: 'characters',
    label: 'Characters',
    userLabel: 'Villagers',
    icon: Users,
    description: 'Add characters and quest givers',
    tier: 'free'
  },
  {
    id: 'creatures',
    label: 'Creatures',
    userLabel: 'Creatures',
    icon: Skull,
    description: 'Place creatures and the Big Bad',
    tier: 'free'
  },
  {
    id: 'paths',
    label: 'Paths',
    userLabel: 'Walking Routes',
    icon: Route,
    description: 'Create walking routes for characters',
    tier: 'pro'
  },
  {
    id: 'audio',
    label: 'Audio',
    userLabel: 'Voices',
    icon: Volume2,
    description: 'Record voices and add sounds',
    tier: 'creator'
  },
  {
    id: 'settings',
    label: 'Settings',
    userLabel: 'Quest Settings',
    icon: Settings,
    description: 'Name your quest and set rewards',
    tier: 'free'
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/** Compact progress bar for top bar (no label) */
function CompactProgressBar({
  currentIndex,
  total,
  sections
}: {
  currentIndex: number;
  total: number;
  sections: SectionConfig[];
}) {
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const percentage = ((currentIndex + 1) / total) * 100;
  const currentSection = sections[currentIndex];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    const handleMouseLeave = () => {
      setShowDetails(false);
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
      if (detailsRef.current) {
        detailsRef.current.addEventListener('mouseleave', handleMouseLeave);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  return (
    <div className="w-full flex items-center gap-2 relative" ref={detailsRef}>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden min-w-[40px]">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
        title="Show details"
      >
        <Info size={14} className="text-slate-400" />
      </button>
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg z-50 min-w-[200px]">
          <div className="text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-200 mb-1">Quest Completion Status</p>
            <p><span className="font-medium text-slate-300">Step {currentIndex + 1} of {total}</span></p>
            <p>{currentSection?.userLabel}: {currentSection?.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact asset limit bar for top bar (no label) */
function CompactAssetLimitBar({
  current,
  max
}: {
  current: number;
  max: number;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80;
  const isFull = percentage >= 100;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    const handleMouseLeave = () => {
      setShowDetails(false);
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
      if (detailsRef.current) {
        detailsRef.current.addEventListener('mouseleave', handleMouseLeave);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  return (
    <div className="w-full flex items-center gap-2 relative" ref={detailsRef}>
      <div className="flex-1 bg-slate-800 rounded-full overflow-hidden min-w-[40px] h-1.5">
        <div
          className={`h-full transition-all duration-300 ${
            isFull ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
        title="Show details"
      >
        <Info size={14} className="text-slate-400" />
      </button>
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg z-50 min-w-[200px]">
          <div className="text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-200 mb-1">Max Assets</p>
            <p><span className={`font-medium ${isFull ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-300'}`}>
              {current}/{max} assets
            </span> ({Math.round(percentage)}% used)</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Progress bar showing current step */
function ProgressIndicator({
  currentIndex,
  total,
  sections,
  isMobile = false
}: {
  currentIndex: number;
  total: number;
  sections: SectionConfig[];
  isMobile?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const percentage = ((currentIndex + 1) / total) * 100;
  const currentSection = sections[currentIndex];

  return (
    <div className={isMobile ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center gap-2">
        <span className={`text-slate-300 font-medium whitespace-nowrap ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {isMobile ? 'Quest' : 'Building Your Quest'}
        </span>
        <div className={`flex-1 bg-slate-800 rounded-full overflow-hidden min-w-[40px] ${isMobile ? 'h-1' : 'h-1.5'}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`hover:bg-slate-700 rounded transition-colors flex-shrink-0 ${isMobile ? 'p-0.5' : 'p-1'}`}
          title="Show details"
        >
          <Info size={isMobile ? 12 : 14} className="text-slate-400" />
        </button>
      </div>
      {showDetails && (
        <div className={`text-slate-400 space-y-1 pt-1 border-t border-slate-700 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          <p><span className="font-medium text-slate-300">Step {currentIndex + 1} of {total}</span></p>
          <p>{currentSection?.userLabel}: {currentSection?.description}</p>
        </div>
      )}
    </div>
  );
}

/** Asset limit bar */
function AssetLimitBar({
  current,
  max,
  onUpgrade,
  isMobile = false
}: {
  current: number;
  max: number;
  onUpgrade?: () => void;
  isMobile?: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const percentage = (current / max) * 100;
  const isWarning = percentage >= 80;
  const isFull = percentage >= 100;

  return (
    <div className={isMobile ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center gap-2">
        <span className={`text-slate-300 font-medium whitespace-nowrap ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          {isMobile ? 'Assets' : 'Island Capacity'}
        </span>
        <div className={`flex-1 bg-slate-800 rounded-full overflow-hidden min-w-[40px] ${isMobile ? 'h-1' : 'h-1.5'}`}>
        <div
          className={`h-full transition-all duration-300 ${
            isFull ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`hover:bg-slate-700 rounded transition-colors flex-shrink-0 ${isMobile ? 'p-0.5' : 'p-1'}`}
          title="Show details"
        >
          <Info size={isMobile ? 12 : 14} className="text-slate-400" />
        </button>
      </div>
      {showDetails && (
        <div className={`text-slate-400 space-y-1 pt-1 border-t border-slate-700 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
          <p><span className={`font-medium ${isFull ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-300'}`}>
            {current}/{max} assets
          </span> ({Math.round(percentage)}% used)</p>
      {isWarning && onUpgrade && (
        <button
          onClick={onUpgrade}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
              <ArrowRight size={isMobile ? 10 : 12} />
          Upgrade for more room
        </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Draggable Asset Tabs for Nature Assets */
function DraggableAssetTabs({
  assets,
  selectedId,
  onSelect,
}: {
  assets: Array<{ id: string; label: string; icon: string; amount: number }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`flex gap-2 overflow-x-auto pb-2 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
    >
      {assets.map((asset) => (
        <button
          key={asset.id}
          onClick={() => !isDragging && onSelect(asset.id)}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs ${
            selectedId === asset.id
              ? 'bg-primary text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <span>{asset.icon}</span>
          <span>{asset.label}</span>
          <span className="text-[10px] opacity-75">{asset.amount}</span>
        </button>
      ))}
    </div>
  );
}

/** Draggable Tabs Component - Selected tab stays in middle, can drag or click */
function DraggableTabs({
  sections,
  currentIndex,
  completedSections,
  isSectionLocked,
  onSectionChange,
}: {
  sections: SectionConfig[];
  currentIndex: number;
  completedSections: Set<BuilderSection>;
  isSectionLocked: (section: SectionConfig) => boolean;
  onSectionChange: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Scroll to keep selected tab in middle
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const tabWidth = 120; // Approximate tab width
    const containerWidth = container.offsetWidth;
    const targetScroll = currentIndex * tabWidth - containerWidth / 2 + tabWidth / 2;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, [currentIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`
          flex gap-2 overflow-x-auto pb-2
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
        `}
      >
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = index === currentIndex;
          const isCompleted = completedSections.has(section.id);
          const isLocked = isSectionLocked(section);

          return (
            <button
              key={section.id}
              onClick={(e) => {
                if (!isDragging) {
                  onSectionChange(index);
                }
              }}
              disabled={isLocked}
              className={`
                flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[100px]
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : isCompleted
                    ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900/70'
                    : isLocked
                      ? 'bg-slate-800/50 text-slate-600 border border-slate-700/30 cursor-not-allowed opacity-50'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50'
                }
              `}
            >
              {isCompleted ? <Check size={18} /> : isLocked ? <Lock size={18} /> : <Icon size={18} />}
              <span className="text-xs font-medium whitespace-nowrap">{section.userLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Section button in sidebar */
function SectionButton({
  section,
  isActive,
  isCompleted,
  isLocked,
  onClick,
  compact = false
}: {
  section: SectionConfig;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = section.icon;

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
        ${isActive
          ? 'bg-primary/20 border-2 border-primary text-white'
          : isCompleted
            ? 'bg-emerald-900/30 border border-emerald-700/50 text-emerald-300'
            : isLocked
              ? 'bg-slate-800/30 border border-slate-700/30 text-slate-500 cursor-not-allowed'
              : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
        }
      `}
    >
      <div className={`
        p-2 rounded-lg
        ${isActive
          ? 'bg-primary text-white'
          : isCompleted
            ? 'bg-emerald-600 text-white'
            : isLocked
              ? 'bg-slate-700 text-slate-500'
              : 'bg-slate-700 text-slate-300'
        }
      `}>
        {isCompleted ? <Check size={18} /> : isLocked ? <Lock size={18} /> : <Icon size={18} />}
      </div>

      {!compact && (
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
            {section.userLabel}
          </p>
          {!isActive && !compact && (
            <p className="text-xs text-slate-500 truncate">
              {isLocked ? `${section.tier} feature` : section.description}
            </p>
          )}
        </div>
      )}

      {isActive && !compact && (
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </button>
  );
}

/** Next section button */
function NextSectionButton({
  nextSection,
  onNext,
  isLastSection,
  isMobile = false
}: {
  nextSection: SectionConfig | null;
  onNext: () => void;
  isLastSection: boolean;
  isMobile?: boolean;
}) {
  if (isLastSection) {
    return (
      <button
        onClick={onNext}
        className={`w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 ${isMobile ? 'py-2 text-xs' : 'py-4'}`}
      >
        <Check size={isMobile ? 16 : 20} />
        {isMobile ? 'Finish' : 'Finish & Preview'}
      </button>
    );
  }

  if (!nextSection) return null;

  const Icon = nextSection.icon;

  return (
    <button
      onClick={onNext}
      className={`w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 ${isMobile ? 'py-2 text-xs' : 'py-4'}`}
    >
      {!isMobile && <span>Next: </span>}
      <span>{nextSection.userLabel}</span>
      <Icon size={isMobile ? 14 : 18} />
      <ChevronRight size={isMobile ? 14 : 18} />
    </button>
  );
}

// ============================================================================
// ASSET DATA
// ============================================================================

const TERRAIN_ASSETS = [
  { id: 'tree-pine', name: 'Pine Tree', icon: '🌲', type: 'tree' },
  { id: 'tree-oak', name: 'Oak Tree', icon: '🌳', type: 'tree' },
  { id: 'rock-small', name: 'Small Rock', icon: '🪨', type: 'rock' },
  { id: 'rock-large', name: 'Large Rock', icon: '⛰️', type: 'rock' },
  { id: 'bush', name: 'Bush', icon: '🌿', type: 'bush' },
  { id: 'grass', name: 'Grass Patch', icon: '🌱', type: 'grass' },
];

const BUILDING_ASSETS = [
  { id: 'cottage', name: 'Cottage', icon: '🏠', type: 'building' },
  { id: 'castle', name: 'Castle', icon: '🏰', type: 'building' },
  { id: 'chapel', name: 'Chapel', icon: '⛪', type: 'building' },
  { id: 'shop', name: 'Shop', icon: '🏪', type: 'building' },
  { id: 'tower', name: 'Tower', icon: '🗼', type: 'building' },
  { id: 'well', name: 'Well', icon: '🪣', type: 'building' },
];

const CHARACTER_ASSETS = [
  { id: 'villager', name: 'Villager', icon: '👨‍🌾', type: 'character' },
  { id: 'quest-giver', name: 'Quest Giver', icon: '🧙', type: 'character' },
  { id: 'guard', name: 'Guard', icon: '🛡️', type: 'character' },
  { id: 'merchant', name: 'Merchant', icon: '🧝', type: 'character' },
];

const CREATURE_ASSETS = [
  { id: 'wolf', name: 'Wolf', icon: '🐺', type: 'creature' },
  { id: 'bat', name: 'Bat', icon: '🦇', type: 'creature' },
  { id: 'skeleton', name: 'Skeleton', icon: '💀', type: 'creature' },
  { id: 'dragon', name: 'Big Bad', icon: '🐉', type: 'boss' },
];

// ============================================================================
// SECTION CONTENT COMPONENTS
// ============================================================================

interface AssetButtonProps {
  asset: { id: string; name: string; icon: string; type: string };
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function AssetButton({ asset, isSelected, onSelect }: AssetButtonProps) {
  return (
    <button
      onClick={() => onSelect(asset.id)}
      className={`p-4 rounded-xl text-center transition-all ${
        isSelected
          ? 'bg-primary/30 border-2 border-primary ring-2 ring-primary/20'
          : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'
      }`}
    >
      <span className="text-2xl block mb-1">{asset.icon}</span>
      <span className={`text-xs ${isSelected ? 'text-white font-medium' : 'text-slate-400'}`}>
        {asset.name}
      </span>
    </button>
  );
}

// Asset Slider Component - Blue themed
function AssetSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  isMobile = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  color?: string; // kept for backwards compatibility but ignored
  isMobile?: boolean;
}) {
  return (
    <div className={isMobile ? 'space-y-0.5' : 'space-y-1'}>
      {label && (
      <div className="flex items-center justify-between">
          <span className={`text-slate-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{label}</span>
          <span className={`text-white font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}</span>
      </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full rounded-lg appearance-none cursor-pointer bg-slate-700
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-blue-500/30
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-500
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
          ${isMobile 
            ? 'h-1 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3' 
            : 'h-2 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4'
          }`}
      />
    </div>
  );
}

function TerrainSection({
  selectedAsset,
  onSelectAsset,
  onOpenTemplates,
  templateName,
  treeAmount,
  setTreeAmount,
  grassAmount,
  setGrassAmount,
  rockAmount,
  setRockAmount,
  bushAmount,
  setBushAmount,
  islandSize,
  setIslandSize,
  isSquareTerrain,
  noiseType,
  setNoiseType,
  onApplyTerrainType,
  roughness,
  setRoughness,
  onRefreshWorld,
  isMobile = false,
}: {
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
  onOpenTemplates: () => void;
  templateName?: string;
  treeAmount: number;
  setTreeAmount: (value: number) => void;
  grassAmount: number;
  setGrassAmount: (value: number) => void;
  rockAmount: number;
  setRockAmount: (value: number) => void;
  bushAmount: number;
  setBushAmount: (value: number) => void;
  islandSize: number;
  setIslandSize: (value: number) => void;
  isSquareTerrain: boolean;
  noiseType: 'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent';
  setNoiseType: (value: 'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent') => void;
  onApplyTerrainType: (type: 'forest' | 'island') => void;
  roughness: number;
  setRoughness: (value: number) => void;
  onRefreshWorld: () => void;
  isMobile?: boolean;
}) {
  const [expandedSliders, setExpandedSliders] = useState<Set<string>>(new Set());
  const [terrainSettingsExpanded, setTerrainSettingsExpanded] = useState(false); // Collapsed by default
  const [natureAssetsExpanded, setNatureAssetsExpanded] = useState(false); // Collapsed by default

  const toggleSlider = (assetId: string) => {
    setExpandedSliders(prev => {
      const newSet = new Set<string>();
      // Accordion behavior: if clicking the same one, close it; otherwise open only the clicked one
      if (prev.has(assetId)) {
        // Close it
        return newSet;
      } else {
        // Open only this one
        newSet.add(assetId);
      return newSet;
      }
    });
  };

  // Accordion behavior for main sections
  const toggleTerrainSettings = () => {
    setTerrainSettingsExpanded(prev => {
      if (prev) {
        // Closing terrain settings
        return false;
      } else {
        // Opening terrain settings - close nature assets
        setNatureAssetsExpanded(false);
        return true;
      }
    });
  };

  const toggleNatureAssets = () => {
    setNatureAssetsExpanded(prev => {
      if (prev) {
        // Closing nature assets
        return false;
      } else {
        // Opening nature assets - close terrain settings
        setTerrainSettingsExpanded(false);
        return true;
      }
    });
  };

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
      {/* Terrain Settings */}
      <div data-subsection="terrain-settings" className={`bg-slate-800/50 border border-blue-500/30 rounded-xl ${isMobile ? 'p-2 space-y-2' : 'p-4 space-y-4'}`}>
        <div className="w-full flex items-center justify-between">
        <button
            onClick={toggleTerrainSettings}
            className="flex-1 flex items-center justify-between"
        >
            <h3 className={`font-bold text-blue-300 flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <Layers size={isMobile ? 14 : 16} />
            Terrain Settings
          </h3>
            <ChevronDown
              size={16}
              className={`text-blue-300 transition-transform ${terrainSettingsExpanded ? '' : '-rotate-90'}`}
            />
          </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefreshWorld();
              }}
            className="p-1.5 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg transition-colors ml-2"
              title="Regenerate assets"
            >
              <RotateCcw size={14} className="text-blue-300" />
            </button>
          </div>

        {terrainSettingsExpanded && (
          <div className={`pt-2 border-t border-slate-700 ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
            {/* Terrain Type Buttons */}
            <div className={isMobile ? 'space-y-0.5' : 'space-y-1'}>
              <label className={`text-slate-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Terrain Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onApplyTerrainType('forest')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isSquareTerrain
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } ${isMobile ? 'text-[10px] py-1' : ''}`}
                >
                  🌲 Forest
                </button>
                <button
                  onClick={() => onApplyTerrainType('island')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    !isSquareTerrain
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } ${isMobile ? 'text-[10px] py-1' : ''}`}
                >
                  🏝️ Island
                </button>
              </div>
            </div>

            {/* Terrain Style Buttons */}
            <div className={isMobile ? 'space-y-0.5' : 'space-y-1'}>
              <label className={`text-slate-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Terrain Style</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setNoiseType('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    noiseType === 'standard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } ${isMobile ? 'text-[10px] py-1' : ''}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setNoiseType('ridged')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    noiseType === 'ridged'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } ${isMobile ? 'text-[10px] py-1' : ''}`}
                >
                  Ridged Valleys
                </button>
                <button
                  onClick={() => setNoiseType('turbulent')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    noiseType === 'turbulent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  } ${isMobile ? 'text-[10px] py-1' : ''}`}
                >
                  Chaotic
                </button>
              </div>
            </div>

            {/* Terrain Size Slider - Dynamic range based on terrain type */}
            <AssetSlider
              label="Terrain Size"
              value={islandSize}
              min={isSquareTerrain ? 50 : 10}
              max={isSquareTerrain ? 100 : 140}
              step={5}
              onChange={setIslandSize}
              color="blue"
              isMobile={isMobile}
            />

            {/* Terrain Roughness Slider */}
            <AssetSlider
              label="Terrain Roughness"
              value={roughness}
              min={5}
              max={50}
              step={1}
              onChange={setRoughness}
              color="blue"
              isMobile={isMobile}
            />
          </div>
        )}
      </div>

      {/* Nature Assets Box */}
      <div data-subsection="nature-assets" className={`bg-slate-800/50 border border-emerald-500/30 rounded-xl ${isMobile ? 'p-2 space-y-2' : 'p-4 space-y-3'}`}>
        <button
          onClick={toggleNatureAssets}
          className="w-full flex items-center justify-between"
        >
          <h3 className={`font-bold text-emerald-300 flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <span className={isMobile ? 'text-sm' : 'text-base'}>🌿</span>
            Nature Assets
          </h3>
          <ChevronDown
            size={isMobile ? 14 : 16}
            className={`text-emerald-300 transition-transform ${natureAssetsExpanded ? '' : '-rotate-90'}`}
          />
        </button>

        {natureAssetsExpanded && (
          <div className={`pt-2 border-t border-slate-700 ${isMobile ? '' : 'space-y-3'}`}>
            {isMobile ? (
              /* Portrait Mode: Horizontal tabs with horizontal slider popup */
              <div className="space-y-2">
                {/* Horizontal Asset Tabs - Draggable without scrollbar */}
                <DraggableAssetTabs
                  assets={[
                    { id: 'trees', label: 'Trees', icon: '🌲', amount: treeAmount },
                    { id: 'grass', label: 'Grass', icon: '🌿', amount: grassAmount },
                    { id: 'rocks', label: 'Rocks', icon: '🪨', amount: rockAmount },
                    { id: 'bushes', label: 'Bushes', icon: '🌳', amount: bushAmount },
                  ]}
                  selectedId={Array.from(expandedSliders)[0] || null}
                  onSelect={(id) => toggleSlider(id)}
                />

                {/* Horizontal Slider Popup - Shows next to selected tab */}
                {expandedSliders.has('trees') && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-300 whitespace-nowrap">Amount:</span>
                    <div className="flex-1">
                      <AssetSlider
                        label=""
                        value={treeAmount}
                        min={0}
                        max={1500}
                        step={100}
                        onChange={setTreeAmount}
                        color="blue"
                        isMobile={true}
                      />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{treeAmount}</span>
                  </div>
                )}
                {expandedSliders.has('grass') && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-300 whitespace-nowrap">Amount:</span>
                    <div className="flex-1">
                      <AssetSlider
                        label=""
                        value={grassAmount}
                        min={0}
                        max={1000}
                        step={100}
                        onChange={setGrassAmount}
                        color="blue"
                        isMobile={true}
                      />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{grassAmount}</span>
                  </div>
                )}
                {expandedSliders.has('rocks') && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-300 whitespace-nowrap">Amount:</span>
                    <div className="flex-1">
                      <AssetSlider
                        label=""
                        value={rockAmount}
                        min={0}
                        max={1000}
                        step={10}
                        onChange={setRockAmount}
                        color="blue"
                        isMobile={true}
                      />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{rockAmount}</span>
                  </div>
                )}
                {expandedSliders.has('bushes') && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-300 whitespace-nowrap">Amount:</span>
                    <div className="flex-1">
                      <AssetSlider
                        label=""
                        value={bushAmount}
                        min={0}
                        max={1000}
                        step={50}
                        onChange={setBushAmount}
                        color="blue"
                        isMobile={true}
                      />
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{bushAmount}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Landscape Mode: Original vertical layout with manual placement */
              <>
                <p className={`text-slate-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Adjust procedural amounts or manually place assets.</p>

            {/* Trees Section */}
            <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSlider('trees')}
                    className={`w-full flex items-center justify-between transition-colors ${
            expandedSliders.has('trees') ? 'bg-blue-900/30' : 'bg-slate-800/50 hover:bg-slate-700/50'
                    } p-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🌲</span>
            <span className="text-sm font-medium text-white">Trees</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{treeAmount}</span>
            <Sliders size={14} className="text-slate-400" />
          </div>
        </button>
        {expandedSliders.has('trees') && (
                    <div className="border-t border-slate-700 p-3 space-y-3">
            <AssetSlider
              label="Amount"
              value={treeAmount}
              min={0}
                        max={1500}
              step={100}
              onChange={setTreeAmount}
              color="blue"
                        isMobile={false}
            />
            <button
              onClick={() => onSelectAsset('tree-pine')}
              className={`w-full p-2 text-xs rounded-lg transition-colors ${
                selectedAsset === 'tree-pine'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              + Manual Placement
            </button>
          </div>
        )}
      </div>

      {/* Grass Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSlider('grass')}
                    className={`w-full flex items-center justify-between transition-colors ${
            expandedSliders.has('grass') ? 'bg-blue-900/30' : 'bg-slate-800/50 hover:bg-slate-700/50'
                    } p-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="text-sm font-medium text-white">Grass</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{grassAmount}</span>
            <Sliders size={14} className="text-slate-400" />
          </div>
        </button>
        {expandedSliders.has('grass') && (
                    <div className="border-t border-slate-700 p-3 space-y-3">
            <AssetSlider
              label="Amount"
              value={grassAmount}
              min={0}
                        max={1000}
              step={100}
              onChange={setGrassAmount}
              color="blue"
                        isMobile={false}
            />
            <button
              onClick={() => onSelectAsset('grass')}
              className={`w-full p-2 text-xs rounded-lg transition-colors ${
                selectedAsset === 'grass'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              + Manual Placement
            </button>
          </div>
        )}
      </div>

      {/* Rocks Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSlider('rocks')}
                    className={`w-full flex items-center justify-between transition-colors ${
            expandedSliders.has('rocks') ? 'bg-blue-900/30' : 'bg-slate-800/50 hover:bg-slate-700/50'
                    } p-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🪨</span>
            <span className="text-sm font-medium text-white">Rocks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{rockAmount}</span>
            <Sliders size={14} className="text-slate-400" />
          </div>
        </button>
        {expandedSliders.has('rocks') && (
                    <div className="border-t border-slate-700 p-3 space-y-3">
            <AssetSlider
              label="Amount"
              value={rockAmount}
              min={0}
                        max={1000}
              step={10}
              onChange={setRockAmount}
              color="blue"
                        isMobile={false}
            />
            <button
              onClick={() => onSelectAsset('rock-small')}
              className={`w-full p-2 text-xs rounded-lg transition-colors ${
                selectedAsset === 'rock-small'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              + Manual Placement
            </button>
          </div>
        )}
      </div>

      {/* Bushes Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSlider('bushes')}
                    className={`w-full flex items-center justify-between transition-colors ${
            expandedSliders.has('bushes') ? 'bg-blue-900/30' : 'bg-slate-800/50 hover:bg-slate-700/50'
                    } p-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🌳</span>
            <span className="text-sm font-medium text-white">Bushes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{bushAmount}</span>
            <Sliders size={14} className="text-slate-400" />
          </div>
        </button>
        {expandedSliders.has('bushes') && (
                    <div className="border-t border-slate-700 p-3 space-y-3">
            <AssetSlider
              label="Amount"
              value={bushAmount}
              min={0}
                        max={1000}
              step={50}
              onChange={setBushAmount}
              color="blue"
                        isMobile={false}
            />
            <button
              onClick={() => onSelectAsset('bush')}
              className={`w-full p-2 text-xs rounded-lg transition-colors ${
                selectedAsset === 'bush'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              + Manual Placement
            </button>
          </div>
        )}
      </div>

            <p className="text-xs text-slate-500 italic">
              💡 Adjust sliders for procedural density, or click "Manual Placement" to place individually
            </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ObjectsSection({
  selectedAsset,
  onSelectAsset,
  selectedBuildingPack,
  onSelectBuildingPack,
  selectedBuildingAsset,
  onSelectBuildingAsset,
}: {
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
  selectedBuildingPack: string;
  onSelectBuildingPack: (packId: string) => void;
  selectedBuildingAsset: string | null;
  onSelectBuildingAsset: (assetType: string | null) => void;
}) {
  // Nature objects
  const natureObjects = [
    { id: 'tree-pine', name: 'Pine Tree', icon: '🌲' },
    { id: 'tree-oak', name: 'Oak Tree', icon: '🌳' },
    { id: 'rock-small', name: 'Small Rock', icon: '🪨' },
    { id: 'rock-large', name: 'Large Rock', icon: '⛰️' },
    { id: 'bush', name: 'Bush', icon: '🌿' },
  ];
  
  // Get object props from medieval_village pack
  const medievalPack = BUILDING_ASSET_PACKS.find((p: any) => p.id === 'medieval_village');
  const objectTypes = ['bag', 'bag_open', 'bags', 'barrel', 'bell', 'bench', 'bonfire', 'cart', 'cauldron', 'crate', 'hay', 'package', 'rocks', 'sawmill_saw', 'smoke', 'door_round', 'door_straight', 'fence', 'gazebo', 'market_stand', 'path_straight', 'round_window', 'stairs', 'well', 'window'];
  const medievalObjects = medievalPack?.assets.filter((a: any) => objectTypes.includes(a.type)) || [];

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4">
        <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-3">
          <Package size={16} />
          Manual Object Placement
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Click an object below to place it manually on the terrain.
        </p>
        
        {/* Nature Objects */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-semibold text-slate-300">Nature</h4>
          <div className="grid grid-cols-2 gap-2">
            {natureObjects.map((asset) => (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                  selectedAsset === asset.id
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <span className="text-2xl">{asset.icon}</span>
                <span className="text-xs font-medium">{asset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Medieval Village Objects */}
        {medievalObjects.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Medieval Objects</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto sidebar-scrollbar">
              {medievalObjects.map((asset: any) => {
                const assetKey = `medieval_village:${asset.type}`;
                return (
                  <button
                    key={asset.id}
                    onClick={() => {
                      if (selectedBuildingAsset === assetKey) {
                        onSelectBuildingAsset(null);
                        onSelectAsset(null as any);
                      } else {
                        onSelectBuildingAsset(assetKey);
                        onSelectAsset(assetKey);
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                      selectedBuildingAsset === assetKey
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="text-2xl">{asset.icon}</span>
                    <span className="text-xs font-medium text-center">{asset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BuildingsSection({
  selectedAsset,
  onSelectAsset,
  onOpenTemplates,
  templateName,
  buildingAreas,
  onAddBuildingArea,
  onRemoveBuildingArea,
  onUpdateBuildingArea,
  selectedBuildingAreaId,
  onSelectBuildingArea,
  selectedBuildingPack,
  onSelectBuildingPack,
  selectedBuildingAsset,
  onSelectBuildingAsset,
}: {
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
  onOpenTemplates: () => void;
  templateName?: string;
  buildingAreas: BuildingArea[];
  onAddBuildingArea: () => void;
  onRemoveBuildingArea: (id: number) => void;
  onUpdateBuildingArea: (id: number, updates: Partial<BuildingArea>) => void;
  selectedBuildingAreaId: number | null;
  onSelectBuildingArea: (id: number | null) => void;
  selectedBuildingPack: string;
  onSelectBuildingPack: (packId: string) => void;
  selectedBuildingAsset: string | null;
  onSelectBuildingAsset: (assetType: string | null) => void;
}) {
  const selectedPack = BUILDING_ASSET_PACKS.find(p => p.id === selectedBuildingPack);
  
  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <button
        onClick={onOpenTemplates}
        className="w-full p-3 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 rounded-xl transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-amber-400" />
          <span className="text-sm text-amber-300">Buildings: {templateName || 'Empty'}</span>
        </div>
        <FolderOpen size={16} className="text-amber-400" />
      </button>

      {/* Building Areas Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Building Areas</h3>
          <button
            onClick={onAddBuildingArea}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            Add Area
          </button>
        </div>
        <p className="text-sm text-slate-400">Create flat areas for building placement.</p>

        {buildingAreas.length === 0 ? (
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center text-slate-400 text-sm">
            No building areas yet. Click "Add Area" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {buildingAreas.map((area) => (
              <div
                key={area.id}
                className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      // Toggle selection
                      if (selectedBuildingAreaId === area.id) {
                        onSelectBuildingArea(null);
                      } else {
                        onSelectBuildingArea(area.id);
                      }
                    }}
                    className={`flex-1 text-left p-2 rounded transition-colors ${
                      selectedBuildingAreaId === area.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <span className="text-sm font-medium">Area {area.id}</span>
                    <div className="text-xs mt-1">
                      {selectedBuildingAreaId === area.id ? 'Click to deselect' : 'Click to edit in 3D'}
                    </div>
                  </button>
                  <button
                    onClick={() => onRemoveBuildingArea(area.id)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors ml-2"
                  >
                    <X size={14} />
                  </button>
                </div>

                {selectedBuildingAreaId === area.id && (
                  <div className="mt-2 p-2 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-blue-300">
                    Use the orange gizmo in the 3D view to move, resize, and adjust elevation.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-slate-700" />

      {/* Building Pack Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">Building Packs</h3>
        <div className="space-y-2">
          {BUILDING_ASSET_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                onSelectBuildingPack(pack.id);
                onSelectBuildingAsset(null); // Clear selection when switching packs
              }}
              className={`w-full p-3 rounded-lg border transition-colors text-left ${
                selectedBuildingPack === pack.id
                  ? 'bg-amber-600/30 border-amber-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="font-semibold text-sm">{pack.name}</div>
              <div className="text-xs text-slate-400 mt-1">{pack.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Building Selection from Selected Pack */}
      {selectedPack && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Buildings</h3>
          <p className="text-sm text-slate-400">Click a building to place it on the terrain.</p>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto sidebar-scrollbar">
            {selectedPack.assets
              .filter((asset) => {
                // Filter out props/objects - keep only buildings
                const objectTypes = ['bag', 'bag_open', 'bags', 'barrel', 'bell', 'bench', 'bonfire', 'cart', 'cauldron', 'crate', 'hay', 'package', 'rocks', 'sawmill_saw', 'smoke', 'door_round', 'door_straight', 'fence', 'gazebo', 'market_stand', 'path_straight', 'round_window', 'stairs', 'well', 'window'];
                return !objectTypes.includes(asset.type);
              })
              .map((asset) => (
              <button
            key={asset.id}
                onClick={() => {
                  const assetKey = `${selectedBuildingPack}:${asset.type}`;
                  if (selectedBuildingAsset === assetKey) {
                    onSelectBuildingAsset(null);
                    onSelectAsset(null as any);
                  } else {
                    onSelectBuildingAsset(assetKey);
                    onSelectAsset(assetKey);
                  }
                }}
                className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                  selectedBuildingAsset === `${selectedBuildingPack}:${asset.type}`
                    ? 'bg-amber-600/30 border-amber-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl">{asset.icon}</span>
                <span className="text-xs font-medium text-center">{asset.name}</span>
              </button>
        ))}
      </div>
        </div>
      )}
    </div>
  );
}

function CharactersSection({
  selectedAsset,
  onSelectAsset,
  selectedNPCCharacter,
  onSelectNPCCharacter,
}: {
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
  selectedNPCCharacter: string | null;
  onSelectNPCCharacter: (characterId: string | null) => void;
}) {
  // Get KayKit pack characters - exclude skeletons (they go in creatures)
  const kaykitPack = ASSET_PACKS.find((p: any) => p.id === 'kaykit');
  const kaykitCharacters = kaykitPack?.characters.filter((c: any) => !c.id.includes('skeleton')) || [];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">NPCs & Characters</h3>
      <p className="text-sm text-slate-400">Add characters from KayKit pack. Click to place on terrain.</p>

      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto sidebar-scrollbar">
        {kaykitCharacters.map((character) => {
          const characterKey = `npc:${character.id}`;
          return (
            <button
              key={character.id}
              onClick={() => {
                if (selectedNPCCharacter === character.id) {
                  onSelectNPCCharacter(null);
                  onSelectAsset(null as any);
                } else {
                  onSelectNPCCharacter(character.id);
                  onSelectAsset(characterKey);
                }
              }}
              className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                selectedNPCCharacter === character.id
                  ? 'bg-blue-600/30 border-blue-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="text-2xl">👤</span>
              <span className="text-xs font-medium text-center">{character.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CreaturesSection({
  selectedAsset,
  onSelectAsset,
  selectedNPCCharacter,
  onSelectNPCCharacter,
}: {
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
  selectedNPCCharacter: string | null;
  onSelectNPCCharacter: (characterId: string | null) => void;
}) {
  // Get KayKit skeletons for creatures section
  const kaykitPack = ASSET_PACKS.find((p: any) => p.id === 'kaykit');
  const skeletonCharacters = kaykitPack?.characters.filter((c: any) => c.id.includes('skeleton')) || [];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Creatures & The Big Bad</h3>
      <p className="text-sm text-slate-400">Add enemies and skeletons to challenge players.</p>

      {/* Skeletons from KayKit */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-300">Skeletons</h4>
        <div className="grid grid-cols-2 gap-2">
          {skeletonCharacters.map((character: any) => {
            const characterKey = `npc:${character.id}`;
            return (
              <button
                key={character.id}
                onClick={() => {
                  if (selectedNPCCharacter === character.id) {
                    onSelectNPCCharacter(null);
                    onSelectAsset(null as any);
                  } else {
                    onSelectNPCCharacter(character.id);
                    onSelectAsset(characterKey);
                  }
                }}
                className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                  selectedNPCCharacter === character.id
                    ? 'bg-red-600/30 border-red-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl">💀</span>
                <span className="text-xs font-medium text-center">{character.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-700" />

      {/* Other creatures */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-300">Other Creatures</h4>
      <div className="grid grid-cols-2 gap-2">
        {CREATURE_ASSETS.map((asset) => (
          <AssetButton
            key={asset.id}
            asset={asset}
            isSelected={selectedAsset === asset.id}
            onSelect={onSelectAsset}
          />
        ))}
        </div>
      </div>
    </div>
  );
}

function PathsSection({ isLocked }: { isLocked: boolean }) {
  if (isLocked) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lock className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-400">Walking Routes</h3>
        <p className="text-sm text-slate-500">
          Create paths for characters to follow.
        </p>
        <InlineUpgradePrompt trigger="npc_route" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Walking Routes</h3>
      <p className="text-sm text-slate-400">Create paths for characters to patrol.</p>

      <button className="w-full p-4 bg-blue-600/20 border-2 border-dashed border-blue-500 rounded-xl text-blue-400 hover:bg-blue-600/30 transition-colors">
        + Create New Route
      </button>
    </div>
  );
}

interface AudioSectionProps {
  isLocked: boolean;
  voiceSample: string;
  onVoiceSampleChange: (sample: string) => void;
  selectedVoice: string;
  onSelectedVoiceChange: (voiceId: string) => void;
  recordingUrl: string | null;
  onRecordingUrlChange: (url: string | null) => void;
}

function AudioSection({
  isLocked,
  voiceSample,
  onVoiceSampleChange,
  selectedVoice,
  onSelectedVoiceChange,
  recordingUrl,
  onRecordingUrlChange,
}: AudioSectionProps) {
  const { tierId } = useTier();
  const [recordingState, setRecordingState] = useState<'idle' | 'requesting' | 'ready' | 'recording' | 'stopped' | 'playing' | 'error'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorderRef = useRef<RecordingEngine | null>(null);

  const voiceTier =
    tierId === 'pro_creator' ? 'pro' : tierId === 'creator_pass' ? 'creator' : 'free';

  useEffect(() => {
    globalTTSEngine.setTier(voiceTier);
  }, [voiceTier]);

  useEffect(() => {
    if (!recorderRef.current) {
      const limits = RECORDING_LIMITS[voiceTier] || RECORDING_LIMITS.free;
      recorderRef.current = new RecordingEngine(
        { maxDuration: limits.maxDuration },
        {
          onStateChange: setRecordingState,
          onDurationUpdate: setRecordingDuration,
          onComplete: (result) => {
            onRecordingUrlChange(result.url);
          },
          onError: () => setRecordingState('error'),
        }
      );
    }
  }, [voiceTier, onRecordingUrlChange]);

  if (isLocked) {
    return (
      <div className="space-y-4 text-center py-8">
        <Lock className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-400">Record Your Voice</h3>
        <p className="text-sm text-slate-500">
          Record custom dialogue for characters.
        </p>
        <InlineUpgradePrompt trigger="voice_recording" />
      </div>
    );
  }

  const voices = globalTTSEngine.getAllVoices();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Voices & Sounds</h3>
      <p className="text-sm text-slate-400">Preview TTS and record voice clips.</p>

      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Text-to-Speech Preview</h4>
          <span className="text-xs text-slate-400">Tier: {voiceTier}</span>
        </div>
        <textarea
          value={voiceSample}
          onChange={(e) => onVoiceSampleChange(e.target.value)}
          className="w-full h-20 bg-slate-800 border border-slate-700 rounded text-sm text-white px-3 py-2"
        />
        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
          {voices.map((voice) => {
            const isAvailable = globalTTSEngine.isVoiceAvailable(voice.id);
            return (
              <button
                key={voice.id}
                onClick={() => {
                  if (!isAvailable) return;
                  onSelectedVoiceChange(voice.id);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left ${
                  selectedVoice === voice.id ? 'border-primary bg-slate-800' : 'border-slate-700 bg-slate-900/50'
                } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800/60'}`}
              >
                <div>
                  <div className="text-sm text-white">{voice.name}</div>
                  <div className="text-xs text-slate-400">{voice.description}</div>
                </div>
                <span className="text-[10px] text-slate-500 uppercase">{voice.tier}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => globalTTSEngine.speak(voiceSample, selectedVoice)}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-semibold text-white"
        >
          Preview Voice
        </button>
      </div>

      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Voice Recording</h4>
          <span className="text-xs text-slate-400">{recordingDuration.toFixed(1)}s</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => recorderRef.current?.requestPermission()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-white"
          >
            Request Mic
          </button>
          <button
            onClick={() => recorderRef.current?.startRecording()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs text-white"
          >
            Record
          </button>
          <button
            onClick={() => recorderRef.current?.stopRecording()}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded text-xs text-white"
          >
            Stop
          </button>
          <button
            onClick={() => recorderRef.current?.playRecording()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white"
          >
            Play
          </button>
        </div>
        {recordingUrl && (
          <audio controls src={recordingUrl} className="w-full mt-2" />
        )}
        <div className="text-xs text-slate-500">State: {recordingState}</div>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">Quest Settings</h3>
      <p className="text-sm text-slate-400">Name your quest and set the winning moment.</p>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-2">Quest Name</label>
          <input
            type="text"
            placeholder="The Dragon's Lair"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-2">Winning Moment</label>
          <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary">
            <option>Defeat the Big Bad</option>
            <option>Collect all items</option>
            <option>Reach the goal</option>
            <option>Talk to everyone</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-2">Surprise Reward</label>
          <input
            type="text"
            placeholder="A special message for your friend"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TERRAIN CONFIGS - Matching TestWorld templates
// ============================================================================

const ISLAND_CONFIG = {
  roughness: 26,
  islandSize: 60, // Default island size (range 10-140)
  terrainDetail: 64,
  seed: 42,
  heightScale: 55,
  waterLevel: 0.9,
  cliffIntensity: 100,
  treeAmount: 750, // Middle of 0-1500 range
  treeSize: 100,
  grassAmount: 500, // Middle of 0-1000 range
  grassSize: 100,
  terrainGrassCoverage: 100,
  buildingGrassFalloff: 50,
  rockAmount: 500, // Middle of 0-1000 range
  rockSize: 100,
  bushAmount: 500, // Middle of 0-1000 range
  bushSize: 100,
  treeHeightOffset: -0.2, // Lower natural assets slightly
  grassHeightOffset: -0.2,
  rockHeightOffset: -0.2,
  bushHeightOffset: -0.2,
  slopeAdjustmentIntensity: 3.5,
  isSquareTerrain: false,
  noiseType: 'standard' as const,
  // Ocean/sky settings for island
  sunIntensity: 1.0,
  waveStrength: 0.20,
  waveSpeed: 1.10,
  waveAmplitude: 3.25, // Wave height
  oceanTransparency: 0.90, // Water Clarity
  oceanSize: 500,
  rippleScale: 0.15,  // Slightly increased for more detail
  fogHeight: 6.50,
  bubbleScale: 1.0, // Cloud Size
  bubbleDensity: 2.0, // Cloud Density
  bubbleSpeed: 1.40, // Cloud Speed
  fogOffset: 48, // Fog Distance from Edge
  timeOfDay: 0.5,
};

const FOREST_CONFIG = {
  roughness: 20,
  islandSize: 80, // Default forest size (range 50-100)
  terrainDetail: 64,
  seed: 42,
  heightScale: 30,
  waterLevel: -20,
  cliffIntensity: 100,
  treeAmount: 200, // REDUCED from 750 for performance
  treeSize: 100,
  grassAmount: 150, // REDUCED from 500 for performance
  grassSize: 100,
  terrainGrassCoverage: 100,
  buildingGrassFalloff: 50,
  rockAmount: 150, // REDUCED from 500 for performance
  rockSize: 100,
  bushAmount: 150, // REDUCED from 500 for performance
  bushSize: 100,
  treeHeightOffset: -0.2, // Lower natural assets slightly
  grassHeightOffset: -0.2,
  rockHeightOffset: -0.2,
  bushHeightOffset: -0.2,
  slopeAdjustmentIntensity: 3.5,
  isSquareTerrain: true,
  noiseType: 'standard' as const,
  // Ocean/sky settings (not visible in forest mode)
  sunIntensity: 1.0,
  waveStrength: 0.02,
  waveSpeed: 0.0,
  oceanTransparency: 0.0,
  oceanSize: 500,
  rippleScale: 0.1,
  fogHeight: 3.0,
  bubbleScale: 1.0, // Cloud Size
  bubbleDensity: 0.10, // Cloud Density - REDUCED from 2.50 for performance (8 bubbles instead of 200)
  bubbleSpeed: 0.60, // Cloud Speed
  fogOffset: 0, // Fog Distance from Edge
  waveAmplitude: 1.5, // Wave height (not used in forest but needed for type consistency)
  timeOfDay: 0.5,
};

// Default to forest
const DEFAULT_FOREST_CONFIG = FOREST_CONFIG;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Location state types

// Location state from QuestTypeSelector
interface BuilderLocationState {
  mode?: 'template' | 'free-build' | 'build' | 'play';
  template?: QuestTemplate;
  category?: QuestCategory;
  worldType?: WorldType;
  preBuiltWorldId?: string; // ID of pre-built world for template
  playOnlyMode?: boolean; // If true, lock to play mode with no builder UI
}

export default function BuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Device detection for mobile-specific UI
  const deviceInfo = useDeviceDetection();

  const { tierId, limits } = useTier();
  const upgradePrompts = useUpgradePrompts();

  // Get state from QuestTypeSelector navigation (check early to allow template access)
  const locationState = location.state as BuilderLocationState | null;
  const questTemplate = locationState?.template || null;
  const playOnlyMode = locationState?.playOnlyMode || false;
  
  // Allow template access regardless of authentication status
  // Templates in play mode should be accessible to everyone
  // Only free-build mode requires authentication (handled in QuestTypeSelector)

  // UI Mode System
  const currentMode = useUIModeStore((state) => state.currentMode);
  const setMode = useUIModeStore((state) => state.setMode);
  const isSuperuser = useIsSuperuser();
  const canSculptTerrain = useCanUseFeature('terrainSculpting');
  const canUsePathTool = useCanUseFeature('pathTool');
  const canPublish = useCanUseFeature('canPublish');

  // Avatar Settings (for 3D character scale in play mode)
  const { avatar: avatarSettings } = useAvatarSettings();

  // Get state from QuestTypeSelector navigation (already extracted above for early access check)
  const questMode = locationState?.mode || 'free-build';
  const questCategory = locationState?.category || null;
  const initialWorldType = locationState?.worldType || 'openWorld';
  const preBuiltWorldId = locationState?.preBuiltWorldId;

  const [worldType, setWorldType] = useState<WorldType>(initialWorldType);

  // Template state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTerrainTemplate, setSelectedTerrainTemplate] = useState<TerrainTemplate | null>(null);
  const [selectedBuildingTemplate, setSelectedBuildingTemplate] = useState<BuildingTemplate | null>(null);
  const [terrainConfig, setTerrainConfig] = useState<WorldConfig>(getDefaultTerrainConfig());
  const [buildingConfig, setBuildingConfig] = useState<SavedCastleBuild>(getDefaultBuildingConfig());

  // ============================================================================
  // TERRAIN STATE - Using Forest template defaults
  // ============================================================================
  const [seed, setSeed] = useState(DEFAULT_FOREST_CONFIG.seed);
  const [assetSeed, setAssetSeed] = useState(DEFAULT_FOREST_CONFIG.seed);
  const [roughness, setRoughness] = useState(DEFAULT_FOREST_CONFIG.roughness);
  const [islandSize, setIslandSize] = useState(DEFAULT_FOREST_CONFIG.islandSize);
  const [terrainDetail, setTerrainDetail] = useState(DEFAULT_FOREST_CONFIG.terrainDetail);
  const [heightScale, setHeightScale] = useState(DEFAULT_FOREST_CONFIG.heightScale);
  const [waterLevel, setWaterLevel] = useState(DEFAULT_FOREST_CONFIG.waterLevel);
  const [cliffIntensity, setCliffIntensity] = useState(DEFAULT_FOREST_CONFIG.cliffIntensity);
  const [isSquareTerrain, setIsSquareTerrain] = useState(DEFAULT_FOREST_CONFIG.isSquareTerrain);
  const [noiseType, setNoiseType] = useState<'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent'>(DEFAULT_FOREST_CONFIG.noiseType);
  const [buildingAreas, setBuildingAreas] = useState<BuildingArea[]>([]);
  const [nextAreaId, setNextAreaId] = useState(1);
  const [selectedBuildingAreaId, setSelectedBuildingAreaId] = useState<number | null>(null);
  const [isDraggingBuildingArea, setIsDraggingBuildingArea] = useState(false);

  // Building area management functions
  const addBuildingArea = () => {
    const newArea: BuildingArea = {
      id: nextAreaId,
      x: 0,
      z: 0,
      radius: 20,
      height: 2.5,
      minimized: false
    };
    setBuildingAreas([...buildingAreas, newArea]);
    setNextAreaId(nextAreaId + 1);
  };

  const removeBuildingArea = (id: number) => {
    setBuildingAreas(buildingAreas.filter(area => area.id !== id));
  };

  const updateBuildingArea = (id: number, updates: Partial<BuildingArea>) => {
    setBuildingAreas(buildingAreas.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ));
  };

  // Asset amounts (sliders)
  const [treeAmount, setTreeAmount] = useState(DEFAULT_FOREST_CONFIG.treeAmount);
  const [treeSize, setTreeSize] = useState(DEFAULT_FOREST_CONFIG.treeSize);
  const [grassAmount, setGrassAmount] = useState(DEFAULT_FOREST_CONFIG.grassAmount);
  const [grassSize, setGrassSize] = useState(DEFAULT_FOREST_CONFIG.grassSize);
  const [terrainGrassCoverage, setTerrainGrassCoverage] = useState(DEFAULT_FOREST_CONFIG.terrainGrassCoverage);
  const [rockAmount, setRockAmount] = useState(DEFAULT_FOREST_CONFIG.rockAmount);
  const [rockSize, setRockSize] = useState(DEFAULT_FOREST_CONFIG.rockSize);
  const [bushAmount, setBushAmount] = useState(DEFAULT_FOREST_CONFIG.bushAmount);
  const [bushSize, setBushSize] = useState(DEFAULT_FOREST_CONFIG.bushSize);

  // Height offsets
  const [treeHeightOffset, setTreeHeightOffset] = useState(DEFAULT_FOREST_CONFIG.treeHeightOffset);
  const [grassHeightOffset, setGrassHeightOffset] = useState(DEFAULT_FOREST_CONFIG.grassHeightOffset);
  const [rockHeightOffset, setRockHeightOffset] = useState(DEFAULT_FOREST_CONFIG.rockHeightOffset);
  const [bushHeightOffset, setBushHeightOffset] = useState(DEFAULT_FOREST_CONFIG.bushHeightOffset);
  const [slopeAdjustmentIntensity, setSlopeAdjustmentIntensity] = useState(DEFAULT_FOREST_CONFIG.slopeAdjustmentIntensity);

  // Ocean/Sky settings
  const [timeOfDay, setTimeOfDay] = useState(DEFAULT_FOREST_CONFIG.timeOfDay);
  // Old ocean settings (kept for backward compatibility)
  const [waveStrength, setWaveStrength] = useState(DEFAULT_FOREST_CONFIG.waveStrength);
  const [waveSpeed, setWaveSpeed] = useState(DEFAULT_FOREST_CONFIG.waveSpeed);
  const [waveAmplitude, setWaveAmplitude] = useState(DEFAULT_FOREST_CONFIG.waveAmplitude || 1.5); // Wave height multiplier
  const [oceanTransparency, setOceanTransparency] = useState(DEFAULT_FOREST_CONFIG.oceanTransparency);
  const [oceanSize, setOceanSize] = useState(DEFAULT_FOREST_CONFIG.oceanSize);
  const [rippleScale, setRippleScale] = useState(DEFAULT_FOREST_CONFIG.rippleScale);
  // New optimized ocean settings
  const [wavePreset, setWavePreset] = useState<WavePreset>(WavePreset.MODERATE);
  const [waveHeight, setWaveHeight] = useState(2.0);
  const [fogHeight, setFogHeight] = useState(DEFAULT_FOREST_CONFIG.fogHeight);
  const [bubbleScale, setBubbleScale] = useState(DEFAULT_FOREST_CONFIG.bubbleScale);
  const [bubbleDensity, setBubbleDensity] = useState(DEFAULT_FOREST_CONFIG.bubbleDensity);
  const [bubbleSpeed, setBubbleSpeed] = useState(DEFAULT_FOREST_CONFIG.bubbleSpeed);
  const [fogOffset, setFogOffset] = useState(DEFAULT_FOREST_CONFIG.fogOffset || 0); // Offset from terrain edge
  // New optimized fog settings
  const [fogPreset, setFogPreset] = useState<FogDensityPreset>(FogDensityPreset.MODERATE);

  // Procedural assets tracking
  const [proceduralAssets, setProceduralAssets] = useState<{
    trees: Array<{ pos: [number, number, number]; scale: number }>;
    rocks: Array<{ pos: [number, number, number]; scale: number }>;
  }>({ trees: [], rocks: [] });

  // Section state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<BuilderSection>>(new Set());
  // Play mode: if playOnlyMode is true, always true and locked
  const [isPlayMode, setIsPlayMode] = useState(playOnlyMode);
  const [showPlayModeModal, setShowPlayModeModal] = useState(false);
  const [isDropMode, setIsDropMode] = useState(false); // For dropping player on terrain
  const [playerStartPosition, setPlayerStartPosition] = useState<[number, number, number] | null>(null);

  // Play background music during build and play modes (no need to reinit - done in App)
  useEffect(() => {
    globalAudioManager.playMusic('track_5');
    // Don't stop music on unmount - keep it persistent
  }, []);

  // ===== WebGL Context Loss Recovery (Feb 6, 2026) =====
  const [webglContextLost, setWebglContextLost] = useState(false);
  const [terrainKey, setTerrainKey] = useState(0); // Increment to force terrain re-render after context restore
  const playTestCharacterRef = useRef<{ attack: () => void; block: () => void; blockRelease: () => void; jump: () => void; playAnimation: (name: string) => void } | null>(null);
  
  // Action bar state
  const [actionBarSlots, setActionBarSlots] = useState<Array<ActionSlot | null>>([
    null, null, null, null, null
  ]);
  const [selectedActionSlotIndex, setSelectedActionSlotIndex] = useState<number>(0);
  const [activeActionSlotIndex, setActiveActionSlotIndex] = useState<number>(-1); // Currently playing animation slot
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const [equippedWeaponId, setEquippedWeaponId] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false); // Environment controls - collapsed by default
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false); // Home button sidebar menu
  const [assetCount, setAssetCount] = useState(23); // Mock for now
  const maxAssets = limits.maxAssetsPerWorld;
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Voice & Audio state
  const [voiceSample, setVoiceSample] = useState('Hello! I am your quest guide.');
  const [selectedVoice, setSelectedVoice] = useState('google_uk_male');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [darknessLevel, setDarknessLevel] = useState(0); // For Survive the Night overlay
  const [showPuzzleUI, setShowPuzzleUI] = useState(false); // For slider puzzle UI
  const [puzzleImage, setPuzzleImage] = useState<string | undefined>(undefined); // Custom puzzle image
  const [currentPlayerPosition, setCurrentPlayerPosition] = useState<[number, number, number] | undefined>(undefined);
  const [collectibleItems, setCollectibleItems] = useState<Array<{ id: string; position: [number, number, number]; itemType: string; collected: boolean }>>([]);
  
  // Undo/Redo System - Define early to ensure it's always available
  const undoRedoRef = useRef(new UndoRedoSystem(50));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoState = useCallback(() => {
    setCanUndo(undoRedoRef.current.canUndo());
    setCanRedo(undoRedoRef.current.canRedo());
  }, []);

  // Define recordCommand early and ensure it's stable
  const recordCommand = useCallback((command: Command) => {
    if (!undoRedoRef.current) {
      console.error('[BuilderPage] undoRedoRef.current is null');
      return;
    }
    undoRedoRef.current.execute(command);
    updateUndoState();
  }, [updateUndoState]);

  // Terrain Tool State
  type ToolMode = 'select' | 'brush' | 'path' | 'erase';
  const [currentTool, setCurrentTool] = useState<ToolMode>('select');
  const [brushMode, setBrushMode] = useState<BrushMode>('raise');
  const [brushRadius, setBrushRadius] = useState(DEFAULT_BRUSH_CONFIG.radius);
  const [brushIntensity, setBrushIntensity] = useState(DEFAULT_BRUSH_CONFIG.intensity);
  const [paths, setPaths] = useState<PathSegment[]>([]);
  const [pathWidth, setPathWidth] = useState(4);
  const [pathTexture, setPathTexture] = useState<PathSegment['texture']>('dirt');
  const [smoothTerrain, setSmoothTerrain] = useState(true);
  const [removeAssetsOnPath, setRemoveAssetsOnPath] = useState(true);
  const [eraseMode, setEraseMode] = useState<EraseMode>('brush');
  const [eraseBrushRadius, setEraseBrushRadius] = useState(6);
  const pendingPathCommandsRef = useRef<Command[]>([]);

  // Superuser controls state
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);
  const [pathSmoothingStrength, setPathSmoothingStrength] = useState(0.5);
  const [miniGameEnemyCount, setMiniGameEnemyCount] = useState(10);
  const [miniGameSpawnRate, setMiniGameSpawnRate] = useState(1);
  const [miniGameTimerSeconds, setMiniGameTimerSeconds] = useState(120);
  const [npcVisionCone, setNpcVisionCone] = useState(60);
  const [npcPatrolSpeed, setNpcPatrolSpeed] = useState(2);
  const [npcAggressionRadius, setNpcAggressionRadius] = useState(15);

  useEffect(() => {
    if (!canSculptTerrain && currentTool === 'brush') {
      setCurrentTool('select');
    }
    if (!canUsePathTool && currentTool === 'path') {
      setCurrentTool('select');
    }
  }, [canSculptTerrain, canUsePathTool, currentTool]);

  useEffect(() => {
    if (isSuperuser) return;
    const mappedMode =
      tierId === 'pro_creator'
        ? 'PLAYER_PRO'
        : tierId === 'creator_pass'
        ? 'PLAYER_CREATOR'
        : 'PLAYER_FREE';
    if (currentMode !== mappedMode) {
      setMode(mappedMode);
    }
  }, [currentMode, isSuperuser, setMode, tierId]);

  // Selected asset for placement
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Manually placed assets
  const [manualTrees, setManualTrees] = useState<Array<{ id: string; pos: [number, number, number]; scale: number; treeType: 'pine' | 'broad' | 'bushy'; rotation: number }>>([]);
  const [manualRocks, setManualRocks] = useState<Array<{ id: string; pos: [number, number, number]; scale: number; variant: number; rotation: number }>>([]);
  const [manualGrass, setManualGrass] = useState<Array<{ id: string; pos: [number, number, number]; scale: number; variant: number; rotation: number }>>([]);
  const [manualBushes, setManualBushes] = useState<Array<{ id: string; pos: [number, number, number]; scale: number; variant: number; rotation: number }>>([]);
  const [manualObjects, setManualObjects] = useState<Array<{ id: string; pos: [number, number, number]; scale: number; assetType: string }>>([]);

  // ===== PERFORMANCE OPTIMIZATION (Feb 6, 2026) =====
  // Memoize manual asset arrays to prevent re-renders from creating new arrays every frame
  const memoizedTrees = useMemo(() =>
    manualTrees.map(tree => ({
      pos: tree.pos,
      rotation: tree.rotation,
      scale: tree.scale,
      treeType: tree.treeType,
    })),
    [manualTrees]
  );

  // Memoized collision data for PlayTestCharacter (simpler format)
  const memoizedTreeCollisions = useMemo(() =>
    manualTrees.map(t => ({ pos: t.pos, scale: t.scale })),
    [manualTrees]
  );

  const memoizedRockCollisions = useMemo(() =>
    manualRocks.map(r => ({ pos: r.pos, scale: r.scale })),
    [manualRocks]
  );

  // Placed buildings and NPCs
  const [placedBuildings, setPlacedBuildings] = useState<Array<{
    id: string;
    packId: string;
    assetType: string;
    pos: [number, number, number];
    rotation: number;
    scale: number;
    bounds?: { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3; center: THREE.Vector3 };
  }>>([]);
  
  // Collision cache for building bounds
  const buildingBoundsCache = useRef<Map<string, { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3; center: THREE.Vector3 }>>(new Map());
  const [placedNPCs, setPlacedNPCs] = useState<Array<{
    id: string;
    characterId: string;
    modelPath: string;
    assetId: string;
    pos: [number, number, number];
    rotation: number;
    weaponPath?: string;
    shieldPath?: string;
  }>>([]);
  
  // Selected building/NPC for editing
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null);
  
  // Building pack selection
  const [selectedBuildingPack, setSelectedBuildingPack] = useState<string>('kaykit_castle');
  const [selectedBuildingAsset, setSelectedBuildingAsset] = useState<string | null>(null);
  
  // NPC selection
  const [selectedNPCCharacter, setSelectedNPCCharacter] = useState<string | null>(null);
  
  // Ghost preview position
  const [ghostPreviewPosition, setGhostPreviewPosition] = useState<[number, number, number] | null>(null);
  
  // Gizmo dragging state
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);

  // Refs
  const terrainMeshRef = useRef<THREE.Mesh>(null);
  const miniGameRegisteredRef = useRef(false);
  const activeMiniGameIdRef = useRef<string | null>(null);

  // Responsive detection
  const [isPortrait, setIsPortrait] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  // Track when terrain mesh is ready
  const [terrainReady, setTerrainReady] = useState(false);

  const regenerateProceduralAssets = useCallback(() => {
    setAssetSeed(Math.floor(Math.random() * 10000));
  }, []);

  // Reset terrainReady when terrain params change (so Forest regenerates with new terrain)
  useEffect(() => {
    setTerrainReady(false);
  }, [seed, terrainDetail, heightScale, islandSize, isSquareTerrain]);

  // Performance monitoring - warn when asset count is high
  useEffect(() => {
    const totalAssetCount = 
      placedBuildings.length + 
      placedNPCs.length + 
      manualTrees.length + 
      manualRocks.length + 
      manualGrass.length + 
      manualBushes.length;
    
    if (totalAssetCount > 500) {
      console.warn(`[Performance] High asset count detected: ${totalAssetCount} assets. Consider merging static meshes.`);
    }
  }, [placedBuildings.length, placedNPCs.length, manualTrees.length, manualRocks.length, manualGrass.length, manualBushes.length]);

  useEffect(() => {
    if (typeof maxAssets === 'number' && assetCount >= maxAssets) {
      upgradePrompts.showPrompt('asset_limit');
    }
  }, [assetCount, maxAssets, upgradePrompts]);

  // ============================================================================
  // TERRAIN HEIGHT FUNCTION
  // ============================================================================
  const getTerrainHeight = useCallback((worldX: number, worldZ: number) => {
    const scale = isSquareTerrain ? (islandSize * 2) : 200;

    // Try to sample from actual terrain mesh geometry
    if (terrainMeshRef.current?.geometry) {
      const geometry = terrainMeshRef.current.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const size = Math.sqrt(positions.length / 3);

      const nx = (worldX / scale) + 0.5;
      const nz = (worldZ / scale) + 0.5;

      if (nx < 0 || nx > 1 || nz < 0 || nz > 1) return 2; // Default height instead of -10

      const gridX = nx * (size - 1);
      const gridZ = nz * (size - 1);
      const x0 = Math.floor(gridX);
      const z0 = Math.floor(gridZ);
      const x1 = Math.min(x0 + 1, size - 1);
      const z1 = Math.min(z0 + 1, size - 1);

      const fx = gridX - x0;
      const fz = gridZ - z0;

      const getHeight = (x: number, z: number) => {
        // Clamp to valid range
        const clampedX = Math.max(0, Math.min(x, size - 1));
        const clampedZ = Math.max(0, Math.min(z, size - 1));
        const idx = Math.floor(clampedX) + Math.floor(clampedZ) * size;
        // After rotateX(-Math.PI/2), original Z (height) becomes Y (vertical in world space)
        // So height is at index 1, not index 2!
        return positions[idx * 3 + 1];
      };

      const h00 = getHeight(x0, z0);
      const h10 = getHeight(x1, z0);
      const h01 = getHeight(x0, z1);
      const h11 = getHeight(x1, z1);

      const h0 = h00 * (1 - fx) + h10 * fx;
      const h1 = h01 * (1 - fx) + h11 * fx;
      let height = h0 * (1 - fz) + h1 * fz;

      // Check building areas - match visual terrain blending for perfect collision alignment
      for (const area of buildingAreas) {
        const distToBuildArea = Math.sqrt(
          Math.pow(worldX - area.x, 2) +
          Math.pow(worldZ - area.z, 2)
        );

        const blendRadius = area.radius * 0.2;

        if (distToBuildArea < area.radius - blendRadius) {
          // Full flat area
          return area.height;
        } else if (distToBuildArea < area.radius + blendRadius) {
          // Smooth blend zone - use smoothstep for smoother interpolation
          // This matches the visual terrain blending exactly
          const t = (distToBuildArea - (area.radius - blendRadius)) / (blendRadius * 2);
          const smoothT = t * t * (3 - 2 * t); // Smoothstep function
          return area.height * (1 - smoothT) + height * smoothT;
        }
      }

      return height;
    }

    // Fallback: use simplex noise calculation (must match terrain generation)
    // This is used when terrain mesh isn't ready yet
    const noise2D = createNoise2D(() => seed);

    // Normalize coordinates
    const nx = (worldX / scale) + 0.5;
    const nz = (worldZ / scale) + 0.5;

    if (nx < 0 || nx > 1 || nz < 0 || nz > 1) return 2; // Default height

    // FBM noise calculation matching terrain generation
    let noiseValue = 0;
    let amplitude = 1;
    let frequency = 4 / scale; // Match terrain generation frequency
    let maxValue = 0;

    for (let i = 0; i < 4; i++) {
      noiseValue += noise2D(worldX * frequency, worldZ * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    noiseValue = (noiseValue / maxValue + 1) / 2; // Normalize to 0-1

    // Apply height scale
    const height = noiseValue * heightScale * 0.5 + 2;
    let finalHeight = Math.max(height, 2); // Ensure minimum height of 2

    // Check building areas - match visual terrain blending for perfect collision alignment
    for (const area of buildingAreas) {
      const distToBuildArea = Math.sqrt(
        Math.pow(worldX - area.x, 2) +
        Math.pow(worldZ - area.z, 2)
      );

      const blendRadius = area.radius * 0.2;

      if (distToBuildArea < area.radius - blendRadius) {
        // Full flat area
        return area.height;
      } else if (distToBuildArea < area.radius + blendRadius) {
        // Smooth blend zone - use smoothstep for smoother interpolation
        // This matches the visual terrain blending exactly
        const t = (distToBuildArea - (area.radius - blendRadius)) / (blendRadius * 2);
        const smoothT = t * t * (3 - 2 * t); // Smoothstep function
        return area.height * (1 - smoothT) + finalHeight * smoothT;
      }
    }

    return finalHeight;
  }, [islandSize, isSquareTerrain, heightScale, seed, buildingAreas]);

  const terrainScale = useMemo(() => (isSquareTerrain ? islandSize * 2 : 200), [isSquareTerrain, islandSize]);
  const terrainSize = useMemo(() => terrainDetail, [terrainDetail]);
  const brushConfig = useMemo(() => ({
    mode: brushMode,
    radius: brushRadius,
    intensity: brushIntensity,
    falloff: DEFAULT_BRUSH_CONFIG.falloff,
  }), [brushMode, brushRadius, brushIntensity]);

  // Path modification handler - used by undo/redo system
  const applyPathModification = useCallback((modification: PathModification, useOriginal: boolean) => {
    if (!terrainMeshRef.current?.geometry) return;
    const geometry = terrainMeshRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < modification.affectedTerrainIndices.length; i++) {
      const idx = modification.affectedTerrainIndices[i];
      const positionIndex = idx * 3 + 1;
      positions[positionIndex] = useOriginal
        ? modification.originalHeights[i]
        : modification.newHeights[i];
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }, []);

  // Undo/Redo command handlers - defined after all state setters are available
  const applyUndoCommand = useCallback((command: Command) => {
    switch (command.type) {
      case 'MODIFY_TERRAIN':
        if (terrainMeshRef.current?.geometry) {
          undoModification(terrainMeshRef.current.geometry, command.modification, terrainSize);
        }
        break;
      case 'CREATE_PATH':
        setPaths(prev => prev.filter(path => path.id !== command.path.id));
        if (command.terrainModification) {
          applyPathModification(command.terrainModification, true);
        }
        break;
      case 'PLACE_ASSET':
        if (command.assetType === 'building') {
          setPlacedBuildings(prev => prev.filter(b => b.id !== command.assetId));
        } else if (command.assetType === 'npc') {
          setPlacedNPCs(prev => prev.filter(n => n.id !== command.assetId));
        } else if (command.assetType === 'tree') {
          setManualTrees(prev => prev.filter(t => t.id !== command.assetId));
        } else if (command.assetType === 'rock') {
          setManualRocks(prev => prev.filter(r => r.id !== command.assetId));
        } else if (command.assetType === 'grass') {
          setManualGrass(prev => prev.filter(g => g.id !== command.assetId));
        } else if (command.assetType === 'bush') {
          setManualBushes(prev => prev.filter(b => b.id !== command.assetId));
        } else if (command.assetType === 'object') {
          setManualObjects(prev => prev.filter(o => o.id !== command.assetId));
        }
        setAssetCount(prev => Math.max(prev - 1, 0));
        break;
      case 'REMOVE_ASSET':
        if (command.assetType === 'building') {
          setPlacedBuildings(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'npc') {
          setPlacedNPCs(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'tree') {
          setManualTrees(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'rock') {
          setManualRocks(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'grass') {
          setManualGrass(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'bush') {
          setManualBushes(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'object') {
          setManualObjects(prev => [...prev, command.data as any]);
        }
        setAssetCount(prev => prev + 1);
        break;
      case 'BATCH':
        [...command.commands].reverse().forEach((child) => {
          applyUndoCommand(child);
        });
        break;
      default:
        break;
    }
  }, [applyPathModification, terrainSize, setPaths, setPlacedBuildings, setPlacedNPCs, setManualTrees, setManualRocks, setManualGrass, setManualBushes, setManualObjects, setAssetCount]);

  const applyRedoCommand = useCallback((command: Command) => {
    switch (command.type) {
      case 'MODIFY_TERRAIN':
        if (terrainMeshRef.current?.geometry) {
          redoModification(terrainMeshRef.current.geometry, command.modification, terrainSize);
        }
        break;
      case 'CREATE_PATH':
        setPaths(prev => [...prev, command.path]);
        if (command.terrainModification) {
          applyPathModification(command.terrainModification, false);
        }
        break;
      case 'PLACE_ASSET':
        if (command.assetType === 'building') {
          setPlacedBuildings(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'npc') {
          setPlacedNPCs(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'tree') {
          setManualTrees(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'rock') {
          setManualRocks(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'grass') {
          setManualGrass(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'bush') {
          setManualBushes(prev => [...prev, command.data as any]);
        } else if (command.assetType === 'object') {
          setManualObjects(prev => [...prev, command.data as any]);
        }
        setAssetCount(prev => prev + 1);
        break;
      case 'REMOVE_ASSET':
        if (command.assetType === 'building') {
          setPlacedBuildings(prev => prev.filter(b => b.id !== command.assetId));
        } else if (command.assetType === 'npc') {
          setPlacedNPCs(prev => prev.filter(n => n.id !== command.assetId));
        } else if (command.assetType === 'tree') {
          setManualTrees(prev => prev.filter(t => t.id !== command.assetId));
        } else if (command.assetType === 'rock') {
          setManualRocks(prev => prev.filter(r => r.id !== command.assetId));
        } else if (command.assetType === 'grass') {
          setManualGrass(prev => prev.filter(g => g.id !== command.assetId));
        } else if (command.assetType === 'bush') {
          setManualBushes(prev => prev.filter(b => b.id !== command.assetId));
        } else if (command.assetType === 'object') {
          setManualObjects(prev => prev.filter(o => o.id !== command.assetId));
        }
        setAssetCount(prev => Math.max(prev - 1, 0));
        break;
      case 'BATCH':
        command.commands.forEach((child) => {
          applyRedoCommand(child);
        });
        break;
      default:
        break;
    }
  }, [applyPathModification, terrainSize, setPaths, setPlacedBuildings, setPlacedNPCs, setManualTrees, setManualRocks, setManualGrass, setManualBushes, setManualObjects, setAssetCount]);

  // Set undo/redo handlers after callbacks are defined
  useEffect(() => {
    if (undoRedoRef.current && applyUndoCommand && applyRedoCommand) {
      undoRedoRef.current.setHandlers(applyUndoCommand, applyRedoCommand);
    }
  }, [applyUndoCommand, applyRedoCommand]);

  const eraseableAssets = useEraseableAssets(
    placedBuildings,
    placedNPCs,
    manualTrees,
    manualRocks,
    manualBushes,
    manualGrass,
    manualObjects
  );

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      // Consider narrow if width is less than 900px (sidebars need ~320px + 64px toggle space)
      setIsNarrowScreen(window.innerWidth < 900);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    if (miniGameRegisteredRef.current) return;
    
    // Register all mini-game types
    globalMiniGameManager.registerGameType('riddle_gate', (config) =>
      createRiddleGateGame(config, globalMiniGameManager)
    );
    globalMiniGameManager.registerGameType('survive_night', (config) =>
      createSurviveNightGame(config, globalMiniGameManager)
    );
    globalMiniGameManager.registerGameType('defeat_boss', (config) =>
      createDefeatBossGame(config, globalMiniGameManager)
    );
    globalMiniGameManager.registerGameType('enemy_waves', (config) =>
      createEnemyWavesGame(config, globalMiniGameManager)
    );
    globalMiniGameManager.registerGameType('slider_puzzle', (config) =>
      createSliderPuzzleGame(config, globalMiniGameManager)
    );
    globalMiniGameManager.registerGameType('collect_return', (config) =>
      createCollectReturnGame(config, globalMiniGameManager)
    );
    
    miniGameRegisteredRef.current = true;
  }, []);

  // Load templates on mount
  useEffect(() => {
    const terrainTemplates = getTerrainTemplates();
    const buildingTemplates = getBuildingTemplates();

    // Use first available template or default
    if (terrainTemplates.length > 0) {
      setSelectedTerrainTemplate(terrainTemplates[0]);
      setTerrainConfig(terrainTemplates[0].config);
    }
    if (buildingTemplates.length > 0) {
      setSelectedBuildingTemplate(buildingTemplates[0]);
      setBuildingConfig(buildingTemplates[0].build);
    }
  }, []);

  // Handle template selection
  const handleSelectTerrain = useCallback((template: TerrainTemplate) => {
    setSelectedTerrainTemplate(template);
    setTerrainConfig(template.config);
  }, []);

  const handleSelectBuilding = useCallback((template: BuildingTemplate) => {
    setSelectedBuildingTemplate(template);
    setBuildingConfig(template.build);
  }, []);

  // Handle asset selection for placement
  const handleAssetSelect = useCallback((assetId: string) => {
    setSelectedAsset(prev => prev === assetId ? null : assetId);
  }, []);

  // Computed values
  const currentSection = BUILDER_SECTIONS[currentSectionIndex];
  const nextSection = BUILDER_SECTIONS[currentSectionIndex + 1] || null;
  const isLastSection = currentSectionIndex === BUILDER_SECTIONS.length - 1;

  // Check if section is locked based on tier
  const isSectionLocked = useCallback((section: SectionConfig) => {
    if (isSuperuser) return false;

    const effectiveTier =
      tierId === 'pro_creator'
        ? 'pro'
        : tierId === 'creator_pass'
        ? 'creator'
        : 'free';

    if (section.tier === 'free') return false;
    if (section.tier === 'creator' && (effectiveTier === 'creator' || effectiveTier === 'pro')) return false;
    if (section.tier === 'pro' && effectiveTier === 'pro') return false;
    return true;
  }, [isSuperuser, tierId]);

  // Handlers
  const handleSectionChange = useCallback((index: number) => {
    const section = BUILDER_SECTIONS[index];
    if (!isSectionLocked(section)) {
      setCurrentSectionIndex(index);
      return;
    }

    if (section.id === 'paths') {
      upgradePrompts.showPrompt('npc_route');
      return;
    }
    if (section.id === 'audio') {
      upgradePrompts.showPrompt('voice_recording');
    }
  }, [isSectionLocked, upgradePrompts]);

  // Auto-save function
  const saveBuilderState = useCallback(() => {
    try {
      const state = {
        worldType,
        // Terrain settings
        roughness,
        islandSize,
        terrainDetail,
        seed,
        heightScale,
        waterLevel,
        cliffIntensity,
        isSquareTerrain,
        noiseType,
        // Building areas
        buildingAreas,
        nextAreaId,
        // Placed assets
        placedBuildings: placedBuildings.map(b => ({
          ...b,
          bounds: b.bounds ? {
            min: { x: b.bounds.min.x, y: b.bounds.min.y, z: b.bounds.min.z },
            max: { x: b.bounds.max.x, y: b.bounds.max.y, z: b.bounds.max.z },
            size: { x: b.bounds.size.x, y: b.bounds.size.y, z: b.bounds.size.z },
            center: { x: b.bounds.center.x, y: b.bounds.center.y, z: b.bounds.center.z }
          } : undefined
        })),
        placedNPCs,
        manualTrees,
        manualRocks,
        manualGrass,
        manualBushes,
        // Procedural assets
        proceduralAssets,
        // Asset amounts
        treeAmount,
        treeSize,
        grassAmount,
        grassSize,
        terrainGrassCoverage,
        rockAmount,
        rockSize,
        bushAmount,
        bushSize,
        // Height offsets
        treeHeightOffset,
        grassHeightOffset,
        rockHeightOffset,
        bushHeightOffset,
        slopeAdjustmentIntensity,
        // Ocean/Sky settings
        timeOfDay,
        waveStrength,
        waveSpeed,
        waveAmplitude,
        oceanTransparency,
        oceanSize,
        rippleScale,
        fogHeight,
        bubbleScale,
        bubbleDensity,
        bubbleSpeed,
        fogOffset,
        // Current section
        currentSectionIndex,
        completedSections: Array.from(completedSections),
        // Selected items
        selectedBuildingId,
        selectedNPCId,
        selectedBuildingAreaId,
      };
      localStorage.setItem('builder_autosave', JSON.stringify(state));
      console.log('[BuilderPage] State auto-saved');
    } catch (error) {
      console.error('[BuilderPage] Failed to save state:', error);
    }
  }, [
    worldType, roughness, islandSize, terrainDetail, seed, heightScale, waterLevel, cliffIntensity,
    isSquareTerrain, noiseType, buildingAreas, nextAreaId, placedBuildings, placedNPCs,
    manualTrees, manualRocks, manualGrass, manualBushes, proceduralAssets,
    treeAmount, treeSize, grassAmount, grassSize, terrainGrassCoverage,
    rockAmount, rockSize, bushAmount, bushSize,
    treeHeightOffset, grassHeightOffset, rockHeightOffset, bushHeightOffset, slopeAdjustmentIntensity,
    timeOfDay, waveStrength, waveSpeed, waveAmplitude, oceanTransparency, oceanSize, rippleScale,
    fogHeight, bubbleScale, bubbleDensity, bubbleSpeed, fogOffset,
    currentSectionIndex, completedSections, selectedBuildingId, selectedNPCId, selectedBuildingAreaId
  ]);

  // Debounced save function
  const saveBuilderStateDebounced = useRef<NodeJS.Timeout | null>(null);
  const saveBuilderStateWithDebounce = useCallback(() => {
    if (saveBuilderStateDebounced.current) {
      clearTimeout(saveBuilderStateDebounced.current);
    }
    saveBuilderStateDebounced.current = setTimeout(() => {
      saveBuilderState();
    }, 300);
  }, [saveBuilderState]);

  const handleNextSection = useCallback(() => {
    // Auto-save before navigating
    saveBuilderState();
    
    // Mark current section as completed
    setCompletedSections(prev => new Set([...prev, currentSection.id]));

    if (isLastSection) {
      // Enter play mode to playtest the quest
      setShowPlayModeModal(true);
    } else {
      // Find next unlocked section
      let nextIndex = currentSectionIndex + 1;
      while (nextIndex < BUILDER_SECTIONS.length && isSectionLocked(BUILDER_SECTIONS[nextIndex])) {
        nextIndex++;
      }
      if (nextIndex < BUILDER_SECTIONS.length) {
        setCurrentSectionIndex(nextIndex);
      }
    }
  }, [currentSection, currentSectionIndex, isLastSection, isSectionLocked, setShowPlayModeModal, saveBuilderState]);

  const handlePreviousSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  }, [currentSectionIndex]);

  // Capture world thumbnail
  const captureWorldThumbnail = useCallback(async (): Promise<string | null> => {
    try {
      // Find the canvas element
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      // Capture canvas as image
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      
      // Save to localStorage with timestamp
      const timestamp = Date.now();
      const thumbnailKey = `world_thumbnail_${timestamp}`;
      localStorage.setItem(thumbnailKey, dataUrl);
      
      // Also save latest thumbnail reference
      localStorage.setItem('latest_world_thumbnail', thumbnailKey);
      
      console.log('[BuilderPage] World thumbnail captured and saved');
      return dataUrl;
    } catch (error) {
      console.error('[BuilderPage] Failed to capture world thumbnail:', error);
      return null;
    }
  }, []);

  // Build scene data for validation
  const buildSceneData = useCallback((): WorldSceneData => {
    return {
      // Required elements (TODO: these would be populated from actual quest/game data)
      hasStartTrigger: false,
      startTriggerId: undefined,
      hasWinCondition: false,
      winConditionId: undefined,
      hasFailCondition: false,
      failConditionId: undefined,
      hasReward: false,
      rewardIds: [],
      
      // Elements
      triggers: [],
      npcs: placedNPCs.map(npc => ({
        id: npc.id,
        name: npc.characterId,
        hasDialogue: false, // Would be true if NPC has dialogue configured
      })),
      enemies: [],
      buildings: placedBuildings.map(b => ({
        id: b.id,
        name: b.assetType,
      })),
      collectibles: [],
      
      // Mini-games
      miniGames: [],
      
      // Audio
      audioAssets: [],
      
      // Spawn points
      playerSpawnPoint: playerStartPosition 
        ? { x: playerStartPosition[0], y: playerStartPosition[1], z: playerStartPosition[2] } 
        : undefined,
      
      // Building areas
      buildingAreas: buildingAreas.map(area => ({
        id: String(area.id),
        radius: area.radius,
        height: area.height,
      })),
    };
  }, [buildingAreas, placedNPCs, placedBuildings, playerStartPosition]);

  const buildWorldData = useCallback((thumbnail?: string): WorldData => {
    const worldName = questTemplate?.name || (questMode === 'free-build' ? 'Free Build World' : 'Quest World');
    return {
      id: '',
      name: worldName,
      createdAt: 0,
      updatedAt: 0,
      thumbnail,
      template: isSquareTerrain ? 'forest' : 'island',
      worldType,
      assetSeed,
      terrain: {
        seed,
        roughness,
        islandSize,
        terrainDetail,
        heightScale,
        waterLevel,
        cliffIntensity,
        isSquareTerrain,
        noiseType,
      },
      assets: {
        treeAmount,
        treeSize,
        grassAmount,
        grassSize,
        rockAmount,
        rockSize,
        bushAmount,
        bushSize,
      },
      environment: {
        timeOfDay,
        waveStrength,
        waveSpeed,
        oceanTransparency,
        oceanSize,
        fogHeight,
        fogOffset,
        // New optimized ocean/fog settings
        wavePreset,
        waveHeight,
        fogPreset,
      },
      buildingAreas: buildingAreas.map(area => ({
        id: area.id,
        x: area.x,
        z: area.z,
        radius: area.radius,
        height: area.height,
      })),
      placedBuildings: placedBuildings.map(b => ({
        id: b.id,
        packId: b.packId,
        assetType: b.assetType,
        position: b.pos,
        rotation: b.rotation,
        scale: b.scale,
      })),
      placedNPCs: placedNPCs.map(npc => ({
        id: npc.id,
        packId: 'kaykit',
        assetType: npc.characterId,
        position: npc.pos,
        rotation: npc.rotation,
        scale: 1,
        characterId: npc.characterId,
        modelPath: npc.modelPath,
        assetId: npc.assetId,
        weaponPath: npc.weaponPath,
        shieldPath: npc.shieldPath,
      })),
      manualTrees: manualTrees.map(tree => ({
        id: tree.id,
        pos: tree.pos,
        scale: tree.scale,
        treeType: tree.treeType,
        rotation: tree.rotation,
      })),
      manualRocks: manualRocks.map(rock => ({
        id: rock.id,
        pos: rock.pos,
        scale: rock.scale,
        variant: rock.variant,
        rotation: rock.rotation,
      })),
      manualGrass: manualGrass.map(grass => ({
        id: grass.id,
        pos: grass.pos,
        scale: grass.scale,
        variant: grass.variant,
        rotation: grass.rotation,
      })),
      manualBushes: manualBushes.map(bush => ({
        id: bush.id,
        pos: bush.pos,
        scale: bush.scale,
        variant: bush.variant,
        rotation: bush.rotation,
      })),
      voice: {
        voiceSample,
        recordingUrl: recordingUrl || undefined,
        selectedVoice,
      },
    };
  }, [
    questTemplate,
    questMode,
    worldType,
    isSquareTerrain,
    seed,
    assetSeed,
    roughness,
    islandSize,
    terrainDetail,
    heightScale,
    waterLevel,
    cliffIntensity,
    noiseType,
    treeAmount,
    treeSize,
    grassAmount,
    grassSize,
    rockAmount,
    rockSize,
    bushAmount,
    bushSize,
    timeOfDay,
    waveStrength,
    waveSpeed,
    wavePreset,
    waveHeight,
    oceanTransparency,
    fogHeight,
    fogOffset,
    fogPreset,
    buildingAreas,
    placedBuildings,
    placedNPCs,
    manualTrees,
    manualRocks,
    manualGrass,
    manualBushes,
    voiceSample,
    selectedVoice,
    recordingUrl,
  ]);

  const applyWorldData = useCallback((world: WorldData) => {
    setWorldType(world.worldType || 'openWorld');
    setSeed(world.terrain.seed);
    setAssetSeed(world.assetSeed ?? world.terrain.seed);
    setRoughness(world.terrain.roughness);
    setIslandSize(world.terrain.islandSize);
    setTerrainDetail(world.terrain.terrainDetail);
    setHeightScale(world.terrain.heightScale);
    setWaterLevel(world.terrain.waterLevel);
    setCliffIntensity(world.terrain.cliffIntensity);
    setIsSquareTerrain(world.terrain.isSquareTerrain);
    setNoiseType(world.terrain.noiseType as any);

    setTreeAmount(world.assets.treeAmount);
    setTreeSize(world.assets.treeSize);
    setGrassAmount(world.assets.grassAmount);
    setGrassSize(world.assets.grassSize);
    setRockAmount(world.assets.rockAmount);
    setRockSize(world.assets.rockSize);
    setBushAmount(world.assets.bushAmount);
    setBushSize(world.assets.bushSize);

    setTimeOfDay(world.environment.timeOfDay);
    setWaveStrength(world.environment.waveStrength);
    setWaveSpeed(world.environment.waveSpeed);
    setOceanTransparency(world.environment.oceanTransparency);
    setFogHeight(world.environment.fogHeight);
    setFogOffset(world.environment.fogOffset);
    
    // Migration: convert old settings to new presets
    if (world.environment.wavePreset !== undefined) {
      setWavePreset(world.environment.wavePreset as WavePreset);
    } else {
      // Migrate from old waveStrength
      setWavePreset(waveStrengthToPreset(world.environment.waveStrength));
    }
    if (world.environment.waveHeight !== undefined) {
      setWaveHeight(world.environment.waveHeight);
    } else {
      // Migrate from old waveAmplitude
      setWaveHeight((world.environment.waveAmplitude || 1.5) * 1.5);
    }
    if (world.environment.fogPreset !== undefined) {
      setFogPreset(world.environment.fogPreset as FogDensityPreset);
    } else {
      // Migrate from old bubbleDensity
      setFogPreset(bubbleDensityToPreset(world.environment.bubbleDensity || 1.0));
    }

    setBuildingAreas(world.buildingAreas.map(area => ({
      ...area,
      minimized: false,
    })));
    setNextAreaId(
      world.buildingAreas.reduce((maxId, area) => Math.max(maxId, area.id), 0) + 1
    );

    setPlacedBuildings(world.placedBuildings.map(building => ({
      id: building.id,
      packId: building.packId,
      assetType: building.assetType,
      pos: building.position,
      rotation: building.rotation,
      scale: building.scale,
    })));

    const kaykitPack = ASSET_PACKS.find((p: any) => p.id === 'kaykit');
    setPlacedNPCs(world.placedNPCs.map(npc => {
      const characterId = npc.characterId || npc.assetType;
      const character = kaykitPack?.characters.find((c: any) => c.id === characterId);
      return {
        id: npc.id,
        characterId,
        modelPath: npc.modelPath || character?.modelPath || '',
        assetId: npc.assetId || character?.assetId || characterId,
        pos: npc.position,
        rotation: npc.rotation,
        weaponPath: npc.weaponPath || character?.weapon,
        shieldPath: npc.shieldPath,
      };
    }));

    setManualTrees(world.manualTrees.map(tree => ({
      id: tree.id,
      pos: tree.pos,
      scale: tree.scale,
      treeType: tree.treeType as any,
      rotation: tree.rotation,
    })));
    setManualRocks(world.manualRocks.map(rock => ({
      id: rock.id,
      pos: rock.pos,
      scale: rock.scale,
      variant: rock.variant,
      rotation: rock.rotation,
    })));
    setManualGrass((world.manualGrass || []).map(grass => ({
      id: grass.id,
      pos: grass.pos,
      scale: grass.scale,
      variant: grass.variant,
      rotation: grass.rotation,
    })));
    setManualBushes((world.manualBushes || []).map(bush => ({
      id: bush.id,
      pos: bush.pos,
      scale: bush.scale,
      variant: bush.variant,
      rotation: bush.rotation,
    })));

    const newAssetCount =
      world.placedBuildings.length +
      world.placedNPCs.length +
      world.manualTrees.length +
      world.manualRocks.length +
      (world.manualGrass?.length || 0) +
      (world.manualBushes?.length || 0);
    setAssetCount(newAssetCount);

    setSelectedBuildingId(null);
    setSelectedNPCId(null);
    setSelectedBuildingAreaId(null);
    setSelectedAsset(null);
    setSelectedBuildingAsset(null);
    setSelectedNPCCharacter(null);
    setGhostPreviewPosition(null);

    // Set player spawn point if available
    if (world.playerSpawnPoint) {
      setPlayerStartPosition(world.playerSpawnPoint);
    }

    // Force terrain regeneration with new settings
    // This ensures the terrain mesh regenerates with the loaded config
    setTerrainReady(false);
    setTimeout(() => setTerrainReady(true), 100);
  }, []);

  const handleLoadWorld = useCallback(async (worldId: string) => {
    try {
      const world = await loadWorld(worldId);
      if (!world) {
        console.warn('[BuilderPage] World not found:', worldId);
        return;
      }
      applyWorldData(world);
      regenerateProceduralAssets();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[BuilderPage] Failed to load world:', error);
    }
  }, [applyWorldData]);

  // ===== PERFORMANCE DEBUG UTILITY (Feb 6, 2026) =====
  // Clears template cache + deletes saved world to force fresh generation
  const clearTemplateCache = useCallback(async (templateId: string) => {
    try {
      const existingWorldId = getTemplateWorldId(templateId);
      if (existingWorldId) {
        await deleteWorld(existingWorldId);
        console.log(`[BuilderPage] Deleted template world ${templateId}: ${existingWorldId}`);
      }

      const key = `questly_template_world_${templateId}`;
      localStorage.removeItem(key);
      console.log(`[BuilderPage] Cleared template cache for ${templateId}`);
    } catch (error) {
      console.error(`[BuilderPage] Failed to clear template cache for ${templateId}:`, error);
    }
  }, []);

  useEffect(() => {
    const windowWithUtils = window as Window & {
      questlyClearTemplateCache?: (templateId: string) => Promise<void>;
    };
    windowWithUtils.questlyClearTemplateCache = clearTemplateCache;

    return () => {
      delete windowWithUtils.questlyClearTemplateCache;
    };
  }, [clearTemplateCache]);

  useEffect(() => {
    const worldId = searchParams.get('worldId');
    if (worldId) {
      handleLoadWorld(worldId);
    }
  }, [handleLoadWorld, searchParams]);

  // Load pre-built world if provided (for templates)
  // Always create fresh world with unique configs for templates (don't load from storage)
  useEffect(() => {
    if (questTemplate) {
      // Check if template world already exists
      const existingWorldId = getTemplateWorldId(questTemplate.id);
      
      // Always create fresh world with unique configs for this template
      // This ensures each template has unique terrain settings
      const world = createPreBuiltWorld(questTemplate.id);
      console.log(`[BuilderPage] Creating fresh world for template ${questTemplate.id}:`, {
        seed: world.terrain.seed,
        roughness: world.terrain.roughness,
        islandSize: world.terrain.islandSize,
        heightScale: world.terrain.heightScale,
        isSquareTerrain: world.terrain.isSquareTerrain,
        noiseType: world.terrain.noiseType,
      });
      
      // Save the template world if it doesn't exist or if we want to update it
      // Use the existing ID if available, otherwise save and store the new ID
      (async () => {
        try {
          if (existingWorldId) {
            // Update existing world
            world.id = existingWorldId;
            await saveWorld(world);
            console.log(`[BuilderPage] Updated template world ${questTemplate.id}: ${existingWorldId}`);
          } else {
            // Save new world and store the ID
            const savedId = await saveWorld(world);
            setTemplateWorldId(questTemplate.id, savedId);
            console.log(`[BuilderPage] Saved new template world ${questTemplate.id}: ${savedId}`);
            // Dispatch event to notify sidebar menu
            window.dispatchEvent(new CustomEvent('questly:worlds-updated'));
          }
        } catch (error) {
          console.error(`[BuilderPage] Failed to save template world for ${questTemplate.id}:`, error);
        }
      })();
      
      applyWorldData(world);
      
      // Force terrain regeneration with new settings
      // This ensures the terrain mesh regenerates with the loaded config
      setTerrainReady(false);
      setTimeout(() => setTerrainReady(true), 100);
    }
  }, [questTemplate, applyWorldData, regenerateProceduralAssets]);

  // Lock play mode if playOnlyMode is true
  useEffect(() => {
    if (playOnlyMode) {
      setIsPlayMode(true);
      // Auto-set player start position if not set (will be set when world loads)
      // Don't override if already set from world data
      if (!playerStartPosition) {
        // Wait a bit for world to load, then set default if still not set
        setTimeout(() => {
          if (!playerStartPosition) {
            setPlayerStartPosition([0, 5, 0]); // Default spawn point
          }
        }, 500);
      }
    }
  }, [playOnlyMode, playerStartPosition]);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');

    try {
      const thumbnail = await captureWorldThumbnail();
      const worldData = buildWorldData(thumbnail || undefined);
      await saveWorld(worldData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[BuilderPage] Failed to save world:', error);
      setSaveStatus('idle');
    }
  }, [buildWorldData, captureWorldThumbnail]);
  
  // Handle undo/redo
  const handleUndo = useCallback(() => {
    undoRedoRef.current.undo();
    updateUndoState();
  }, [updateUndoState]);
  
  const handleRedo = useCallback(() => {
    undoRedoRef.current.redo();
    updateUndoState();
  }, [updateUndoState]);

  // Apply terrain type template (Forest or Island)
  const handleApplyTerrainType = useCallback((type: 'forest' | 'island') => {
    const config = type === 'forest' ? FOREST_CONFIG : ISLAND_CONFIG;

    // Apply all terrain settings from template
    setRoughness(config.roughness);
    setIslandSize(config.islandSize);
    setTerrainDetail(config.terrainDetail);
    setHeightScale(config.heightScale);
    setWaterLevel(config.waterLevel);
    setCliffIntensity(config.cliffIntensity);
    setIsSquareTerrain(config.isSquareTerrain);
    setNoiseType(config.noiseType);

    // Apply asset amounts
    setTreeAmount(config.treeAmount);
    setTreeSize(config.treeSize);
    setGrassAmount(config.grassAmount);
    setGrassSize(config.grassSize);
    setTerrainGrassCoverage(config.terrainGrassCoverage);
    setRockAmount(config.rockAmount);
    setRockSize(config.rockSize);
    setBushAmount(config.bushAmount);
    setBushSize(config.bushSize);

    // Apply height offsets
    setTreeHeightOffset(config.treeHeightOffset);
    setGrassHeightOffset(config.grassHeightOffset);
    setRockHeightOffset(config.rockHeightOffset);
    setBushHeightOffset(config.bushHeightOffset);
    setSlopeAdjustmentIntensity(config.slopeAdjustmentIntensity);

    // Apply ocean/fog settings
    setWaveStrength(config.waveStrength);
    setWaveSpeed(config.waveSpeed);
    setWaveAmplitude(config.waveAmplitude);
    setOceanTransparency(config.oceanTransparency);
    setOceanSize(config.oceanSize);
    setRippleScale(config.rippleScale);
    setFogHeight(config.fogHeight);
    setBubbleScale(config.bubbleScale);
    setBubbleDensity(config.bubbleDensity);
    setBubbleSpeed(config.bubbleSpeed);
    setFogOffset(config.fogOffset || 0);
    setTimeOfDay(config.timeOfDay);

    regenerateProceduralAssets();

    // Force terrain refresh by updating terrainReady state
    // This will trigger asset regeneration with new terrain heights
    setTerrainReady(false);
    setTimeout(() => setTerrainReady(true), 100);
  }, [regenerateProceduralAssets]);

  const handleTerrainRaise = useCallback(() => {
    setBrushMode('raise');
    setCurrentTool('brush');
    setBrushIntensity((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleTerrainLower = useCallback(() => {
    setBrushMode('lower');
    setCurrentTool('brush');
    setBrushIntensity((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleTerrainFlatten = useCallback(() => {
    setBrushMode('flatten');
    setCurrentTool('brush');
  }, []);

  const handleHeightPreset = useCallback((preset: 'flat' | 'hills' | 'valley' | 'mountains') => {
    if (preset === 'flat') {
      setHeightScale(2);
      setRoughness(0.2);
    }
    if (preset === 'hills') {
      setHeightScale(6);
      setRoughness(0.4);
    }
    if (preset === 'valley') {
      setHeightScale(4);
      setRoughness(0.35);
      setWaterLevel(0.25);
    }
    if (preset === 'mountains') {
      setHeightScale(12);
      setRoughness(0.7);
    }
    setTerrainReady(false);
    setTimeout(() => setTerrainReady(true), 100);
  }, []);

  const handlePathSmoothingChange = useCallback((strength: number) => {
    setPathSmoothingStrength(strength);
    setSmoothTerrain(strength > 0);
  }, []);

  const handleLoadDifficultyPreset = useCallback((preset: 'kid_easy' | 'standard' | 'chaos') => {
    if (preset === 'kid_easy') {
      setMiniGameEnemyCount(5);
      setMiniGameSpawnRate(0.5);
      setMiniGameTimerSeconds(180);
    }
    if (preset === 'standard') {
      setMiniGameEnemyCount(10);
      setMiniGameSpawnRate(1);
      setMiniGameTimerSeconds(120);
    }
    if (preset === 'chaos') {
      setMiniGameEnemyCount(30);
      setMiniGameSpawnRate(3);
      setMiniGameTimerSeconds(60);
    }
  }, []);

  const handleSaveDifficultyPreset = useCallback((name: string) => {
    const raw = localStorage.getItem('questly_minigame_presets');
    const presets = raw ? JSON.parse(raw) : {};
    presets[name] = {
      enemyCount: miniGameEnemyCount,
      spawnRate: miniGameSpawnRate,
      timerSeconds: miniGameTimerSeconds,
    };
    localStorage.setItem('questly_minigame_presets', JSON.stringify(presets));
  }, [miniGameEnemyCount, miniGameSpawnRate, miniGameTimerSeconds]);

  const handlePlayTest = useCallback(() => {
    // Don't allow toggling if in play-only mode
    if (playOnlyMode) {
      return;
    }
    
    if (isPlayMode) {
      // Exit play mode
      setIsPlayMode(false);
      setPlayerStartPosition(null);
      setIsDropMode(false);
    } else {
      // Show modal to select start position type
      setShowPlayModeModal(true);
    }
  }, [isPlayMode, playOnlyMode]);

  // Clear ghost preview when switching away from select tool or deselecting assets
  useEffect(() => {
    if (currentTool !== 'select' || (!selectedBuildingAsset && !selectedNPCCharacter)) {
      setGhostPreviewPosition(null);
    }
  }, [currentTool, selectedBuildingAsset, selectedNPCCharacter]);

  // Auto-start mini-game based on template
  useEffect(() => {
    if (!isPlayMode || !questTemplate) {
      if (activeMiniGameIdRef.current) {
        globalMiniGameManager.removeGame(activeMiniGameIdRef.current);
        activeMiniGameIdRef.current = null;
      }
      setDarknessLevel(0);
      return;
    }

    const miniGameType = questTemplate.miniGameType;
    if (!miniGameType) {
      return; // No mini-game for this template
    }

    // Create game config based on template type
    let config: MiniGameConfig;

    switch (miniGameType) {
      case 'survive_night': {
        config = {
          id: `survive_night_${Date.now()}`,
          type: 'survive_night',
          category: 'combat',
          name: 'Survive the Night',
          description: 'Defend against waves of enemies until dawn breaks.',
          startTrigger: { type: 'manual' },
          successCondition: { type: 'survive_duration' },
          failCondition: { type: 'player_death' },
          difficulty: {
            level: 'normal',
            ageRange: '7-9',
            scaling: DIFFICULTY_PRESETS.normal,
          },
          centerPosition: playerStartPosition || [0, 0, 0],
          radius: 30,
          duration: DEFAULT_SURVIVE_NIGHT_PARAMS.nightDuration,
          gameParams: DEFAULT_SURVIVE_NIGHT_PARAMS,
        };
        break;
      }

      case 'defeat_boss': {
        // Find boss NPC in placed NPCs
        const bossNPC = placedNPCs.find(npc => npc.characterId?.includes('boss') || npc.assetType?.includes('boss'));
        const bossPosition = bossNPC?.pos || [0, 0, 0];
        
        config = {
          id: `defeat_boss_${Date.now()}`,
          type: 'defeat_boss',
          category: 'combat',
          name: 'Defeat the Boss',
          description: 'Face off against a powerful enemy in epic combat.',
          startTrigger: { type: 'manual' }, // Will start when player gets close
          successCondition: { type: 'boss_defeated' },
          failCondition: { type: 'player_death' },
          difficulty: {
            level: 'normal',
            ageRange: '7-9',
            scaling: DIFFICULTY_PRESETS.normal,
          },
          centerPosition: bossPosition as [number, number, number],
          radius: 15,
          gameParams: {
            ...DEFAULT_DEFEAT_BOSS_PARAMS,
            bossId: bossNPC?.id || 'boss_1',
            bossName: 'The Big Bad',
          },
        };
        break;
      }

      case 'enemy_waves': {
        config = {
          id: `enemy_waves_${Date.now()}`,
          type: 'enemy_waves',
          category: 'combat',
          name: 'Enemy Waves',
          description: 'Survive multiple waves of increasingly difficult enemies.',
          startTrigger: { type: 'manual' },
          successCondition: { type: 'waves_completed' },
          failCondition: { type: 'player_death' },
          difficulty: {
            level: 'normal',
            ageRange: '7-9',
            scaling: DIFFICULTY_PRESETS.normal,
          },
          centerPosition: playerStartPosition || [0, 0, 0],
          radius: 25,
          gameParams: DEFAULT_ENEMY_WAVES_PARAMS,
        };
        break;
      }

      case 'slider_puzzle': {
        config = {
          id: `slider_puzzle_${Date.now()}`,
          type: 'slider_puzzle',
          category: 'non_combat',
          name: '3x3 Slider Puzzle',
          description: 'Solve the sliding puzzle to unlock the next area.',
          startTrigger: { type: 'interaction' },
          successCondition: { type: 'puzzle_solved' },
          failCondition: { type: 'time_limit' },
          difficulty: {
            level: 'normal',
            ageRange: '7-9',
            scaling: DIFFICULTY_PRESETS.normal,
          },
          centerPosition: [0, 0, 0],
          radius: 5,
          gameParams: DEFAULT_SLIDER_PUZZLE_PARAMS,
        };
        break;
      }

      case 'collect_return': {
        config = {
          id: `collect_return_${Date.now()}`,
          type: 'collect_return',
          category: 'non_combat',
          name: 'Collect & Return',
          description: 'Gather items scattered across the world and return them.',
          startTrigger: { type: 'manual' },
          successCondition: { type: 'items_returned' },
          failCondition: { type: 'time_limit' },
          difficulty: {
            level: 'normal',
            ageRange: '7-9',
            scaling: DIFFICULTY_PRESETS.normal,
          },
          centerPosition: playerStartPosition || [0, 0, 0],
          radius: 30,
          gameParams: DEFAULT_COLLECT_RETURN_PARAMS,
        };
        break;
      }

      case 'riddle_gate': {
        config = {
          id: `riddle_gate_${Date.now()}`,
          type: 'riddle_gate',
          category: 'non_combat',
          name: 'Riddle Gate',
          description: 'Answer riddles correctly to proceed through gates.',
          startTrigger: { type: 'manual' },
          successCondition: { type: 'answer_correct' },
          failCondition: { type: 'wrong_answer' },
          difficulty: {
            level: 'normal',
            ageRange: '7-9',
            scaling: DIFFICULTY_PRESETS.normal,
          },
          centerPosition: [0, 0, 0],
          radius: 10,
          duration: miniGameTimerSeconds,
          gameParams: {
            riddles: [
              {
                id: 'r1',
                question: 'What has keys but cannot open locks?',
                answers: ['keyboard', 'a keyboard'],
                hint: 'It sits on your desk.',
              },
            ],
            maxAttempts: 3,
            showHintAfterAttempts: 1,
            requireAllCorrect: true,
          },
        };
        break;
      }

      default:
        return; // Unknown mini-game type
    }

    // Create the game
    globalMiniGameManager.createGame(config);
    
    // Auto-start if trigger is manual
    if (config.startTrigger.type === 'manual') {
      globalMiniGameManager.startGame(config.id);
    } else if (config.startTrigger.type === 'proximity') {
      // For proximity triggers, start when player gets close (handled in position tracking)
      // Don't auto-start immediately
    }
    
    activeMiniGameIdRef.current = config.id;
    
    // Handle proximity trigger for boss fights
    if (config.type === 'defeat_boss' && config.startTrigger.type !== 'manual') {
      const checkProximity = () => {
        if (!isPlayMode || !playTestCharacterRef.current) return;
        
        const game = globalMiniGameManager.getActiveGame();
        if (!game || game.getConfig().id !== config.id) return;
        
        // Get player position (approximate - would need to track this properly)
        const playerPos = playerStartPosition || [0, 0, 0];
        const bossPos = config.centerPosition;
        const distance = Math.sqrt(
          Math.pow(playerPos[0] - bossPos[0], 2) +
          Math.pow(playerPos[2] - bossPos[2], 2)
        );
        
        if (distance <= 10 && game.getProgress().state === 'idle') {
          globalMiniGameManager.startGame(config.id);
        }
      };
      
      // Check proximity periodically
      const proximityInterval = setInterval(checkProximity, 500);
      
      return () => {
        clearInterval(proximityInterval);
        if (activeMiniGameIdRef.current) {
          globalMiniGameManager.removeGame(activeMiniGameIdRef.current);
          activeMiniGameIdRef.current = null;
        }
        setDarknessLevel(0);
      };
    }

    return () => {
      if (activeMiniGameIdRef.current) {
        globalMiniGameManager.removeGame(activeMiniGameIdRef.current);
        activeMiniGameIdRef.current = null;
      }
      setDarknessLevel(0);
    };
  }, [isPlayMode, questTemplate, playerStartPosition, placedNPCs, miniGameTimerSeconds]);

  // Track darkness level from Survive the Night mini-game
  useEffect(() => {
    if (!isPlayMode) {
      setDarknessLevel(0);
      return;
    }

    const interval = setInterval(() => {
      const game = globalMiniGameManager.getActiveGame();
      if (game && game.getConfig().type === 'survive_night') {
        const progress = game.getProgress() as any;
        if (progress.darknessLevel !== undefined) {
          setDarknessLevel(progress.darknessLevel);
          
          // Control timeOfDay based on darkness (0 = day, 1 = darkest night)
          // Map darkness level to timeOfDay: 0.25 (night start) to 0.75 (night end)
          // Peak darkness at 0.5 (midnight)
          const nightProgress = progress.nightProgress || 0;
          const newTimeOfDay = 0.25 + (nightProgress * 0.5); // 0.25 to 0.75
          setTimeOfDay(newTimeOfDay);
        }
      } else {
        setDarknessLevel(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlayMode]);

  // Track collectible items from Collect & Return mini-game
  useEffect(() => {
    if (!isPlayMode || questTemplate?.miniGameType !== 'collect_return') {
      setCollectibleItems([]);
      return;
    }

    const updateCollectibles = () => {
      const game = globalMiniGameManager.getActiveGame();
      if (game && game.getConfig().type === 'collect_return') {
        const progress = game.getProgress() as any;
        if (progress.items) {
          const items = progress.items.map((item: any) => ({
            id: item.id,
            position: item.position,
            itemType: item.type,
            collected: item.collected || false,
          }));
          setCollectibleItems(items);
        }
      }
    };

    const handleItemCollected = (event: any) => {
      if (event.type === 'item_collected') {
        updateCollectibles();
      }
    };

    const unsubscribe = globalMiniGameManager.onAny(handleItemCollected);
    const interval = setInterval(updateCollectibles, 500);
    
    updateCollectibles();

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isPlayMode, questTemplate]);

  // Track puzzle box position for slider puzzle
  const puzzleBoxPosition: [number, number, number] = useMemo(() => {
    // Place puzzle box at building area center or default position
    if (buildingAreas.length > 0) {
      const area = buildingAreas[0];
      return [area.x, area.height + 1, area.z];
    }
    return [0, 2, 0];
  }, [buildingAreas]);

  const npcManager = useMemo(() => getNPCManager(), []);

  useEffect(() => {
    if (!isPlayMode) {
      npcManager.reset();
      return;
    }

    npcManager.reset();
    placedNPCs.forEach((npc) => {
      if (!npc.modelPath) return;
      
      // Check if this is a boss NPC (for Defeat the Boss mini-game)
      const isBoss = npc.characterId?.includes('boss') || npc.assetType?.includes('boss') || 
                     npc.id?.includes('boss');
      
      if (isBoss && questTemplate?.miniGameType === 'defeat_boss') {
        // Spawn boss as enemy
        npcManager.spawnEnemyFromType('skeleton', {
          x: npc.pos[0],
          y: npc.pos[1],
          z: npc.pos[2],
        }, {
          id: npc.id,
          name: npc.characterId || 'Boss',
          modelPath: npc.modelPath,
          stats: {
            health: 200,
            maxHealth: 200,
            attackDamage: 20,
            attackRange: 3,
            attackCooldown: 2,
            moveSpeed: 2,
            detectionRadius: 15,
          },
        });
      } else {
        // Spawn as regular NPC
        npcManager.spawnNPCFromPreset(
          'villager',
          npc.id,
          npc.characterId || 'NPC',
          npc.modelPath,
          { x: npc.pos[0], y: npc.pos[1], z: npc.pos[2] },
          {
            alertRadius: npcAggressionRadius,
            patrolRoute: npcPatrolSpeed > 0
              ? {
                  points: [
                    { x: npc.pos[0], y: npc.pos[1], z: npc.pos[2] },
                    { x: npc.pos[0] + 2, y: npc.pos[1], z: npc.pos[2] + 2 },
                  ],
                  loop: true,
                }
              : undefined,
          }
        );
      }
    });

    if (questCategory === 'combat') {
      npcManager.spawnEnemyFromType('skeleton', {
        x: (playerStartPosition?.[0] || 0) + 6,
        y: (playerStartPosition?.[1] || 0),
        z: (playerStartPosition?.[2] || 0) + 6,
      });
    }
  }, [isPlayMode, npcAggressionRadius, npcManager, npcPatrolSpeed, placedNPCs, playerStartPosition, questCategory]);

  // Handle play mode selection from modal
  const handlePlayModeSelect = useCallback((mode: 'start' | 'drop') => {
    setShowPlayModeModal(false);
    if (mode === 'start') {
      // Use default start position (center of map, on terrain)
      const centerY = getTerrainHeight(0, 0);
      setPlayerStartPosition([0, centerY + 1, 0]);
      setIsPlayMode(true);
    } else {
      // Enter drop mode - user clicks to place character
      setIsDropMode(true);
      setSelectedAsset(null); // Clear any selected asset
    }
  }, [getTerrainHeight]);

  // Handle dropping player on terrain
  const handleDropPlayer = useCallback((position: [number, number, number]) => {
    setPlayerStartPosition(position);
    setIsDropMode(false);
    setIsPlayMode(true);
  }, []);

  // Handle placing manual assets on terrain click
  const handlePlaceAsset = useCallback((position: [number, number, number], assetType: string) => {
    if (!isSuperuser && typeof maxAssets === 'number' && assetCount >= maxAssets) {
      upgradePrompts.showPrompt('asset_limit');
      return;
    }
    const snapPosition = (pos: [number, number, number]): [number, number, number] => {
      if (!gridSnapEnabled) return pos;
      const gridSize = 1;
      return [
        Math.round(pos[0] / gridSize) * gridSize,
        pos[1],
        Math.round(pos[2] / gridSize) * gridSize,
      ];
    };
    const snappedPosition = snapPosition(position);
    const id = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rotation = Math.random() * Math.PI * 2;

    // Check if it's a building placement
    if (assetType.includes(':')) {
      const [packId, buildingType] = assetType.split(':');
      const pack = BUILDING_ASSET_PACKS.find(p => p.id === packId);
      if (pack) {
        const assetDef = pack.assets.find(a => a.type === buildingType);
        if (assetDef) {
          const buildingData = {
            id,
            packId,
            assetType: buildingType,
            pos: snappedPosition,
            rotation: 0,
            scale: assetDef.defaultScale || 6.0,
          };
          setPlacedBuildings(prev => [...prev, buildingData]);
          setSelectedBuildingId(id);
          setSelectedBuildingAsset(null);
          setSelectedAsset(null);
          setAssetCount(prev => prev + 1);
          // Auto-save after placing building
          saveBuilderStateWithDebounce();
          recordCommand(createPlaceAssetCommand('building', id, buildingData, 'Place building'));
          return;
        }
      }
    }

    // Check if it's an NPC placement
    if (assetType.startsWith('npc:')) {
      const characterId = assetType.replace('npc:', '');
      const kaykitPack = ASSET_PACKS.find((p: any) => p.id === 'kaykit');
      const character = kaykitPack?.characters.find((c: any) => c.id === characterId);
      if (character) {
        // Use getTerrainHeight to ensure NPC is placed on correct terrain level (builder area or procedural)
        // The position[1] from TerrainClickHandler already uses getTerrainHeight, but ensure we use it correctly
        const terrainY = getTerrainHeight(position[0], position[2]);
        const characterHeightOffset = 0.0; // NPCs use 0.0 offset (same as player)
        const adjustedPosition: [number, number, number] = [
          snappedPosition[0],
          terrainY + characterHeightOffset + 0.1,
          snappedPosition[2],
        ];
        const npcData = {
          id,
          characterId: character.id,
          modelPath: character.modelPath,
          assetId: character.assetId,
          pos: adjustedPosition,
          rotation: 0,
          weaponPath: character.weapon,
        };
        setPlacedNPCs(prev => [...prev, npcData]);
        // Don't auto-select after placement - user must click to select
        setSelectedNPCId(null);
        setSelectedNPCCharacter(null);
        setSelectedAsset(null);
        setAssetCount(prev => prev + 1);
        // Clear ghost preview after placement
        setGhostPreviewPosition(null);
        // Auto-save after placing NPC
        saveBuilderStateWithDebounce();
        recordCommand(createPlaceAssetCommand('npc', id, npcData, 'Place NPC'));
        return;
      }
    }

    // Handle nature assets (existing code)
    switch (assetType) {
      case 'tree-pine':
      case 'tree-oak': {
        const treeData = {
          id,
          pos: snappedPosition,
          scale: 0.8 + Math.random() * 0.4,
          treeType: assetType === 'tree-pine' ? 'pine' : 'broad',
          rotation,
        };
        setManualTrees(prev => [...prev, treeData]);
        recordCommand(createPlaceAssetCommand('tree', id, treeData, 'Place tree'));
        break;
      }
      case 'rock-small':
      case 'rock-large': {
        const rockData = {
          id,
          pos: snappedPosition,
          scale: assetType === 'rock-small' ? 0.5 + Math.random() * 0.3 : 1.0 + Math.random() * 0.5,
          variant: Math.floor(Math.random() * 18),
          rotation,
        };
        setManualRocks(prev => [...prev, rockData]);
        recordCommand(createPlaceAssetCommand('rock', id, rockData, 'Place rock'));
        break;
      }
      case 'grass': {
        const grassData = {
          id,
          pos: snappedPosition,
          scale: 0.6 + Math.random() * 0.4,
          variant: Math.floor(Math.random() * 4),
          rotation,
        };
        setManualGrass(prev => [...prev, grassData]);
        recordCommand(createPlaceAssetCommand('grass', id, grassData, 'Place grass'));
        break;
      }
      case 'bush': {
        const bushData = {
          id,
          pos: snappedPosition,
          scale: 0.7 + Math.random() * 0.5,
          variant: Math.floor(Math.random() * 8),
          rotation,
        };
        setManualBushes(prev => [...prev, bushData]);
        recordCommand(createPlaceAssetCommand('bush', id, bushData, 'Place bush'));
        break;
      }
      default:
        console.log('Unknown asset type:', assetType);
    }

    // Update asset count
    setAssetCount(prev => prev + 1);
    // Auto-save after placing nature asset
    saveBuilderStateWithDebounce();
  }, [assetCount, getTerrainHeight, gridSnapEnabled, isSuperuser, maxAssets, recordCommand, saveBuilderStateWithDebounce, upgradePrompts]);

  const removeAssetsByIds = useCallback((assetIds: string[], assetType: EraseableAsset['type']) => {
    if (assetIds.length === 0) return [];

    if (assetType === 'building') {
      const removed = placedBuildings.filter(b => assetIds.includes(b.id));
      setPlacedBuildings(prev => prev.filter(b => !assetIds.includes(b.id)));
      if (selectedBuildingId && assetIds.includes(selectedBuildingId)) {
        setSelectedBuildingId(null);
      }
      return removed;
    }
    if (assetType === 'npc') {
      const removed = placedNPCs.filter(n => assetIds.includes(n.id));
      setPlacedNPCs(prev => prev.filter(n => !assetIds.includes(n.id)));
      if (selectedNPCId && assetIds.includes(selectedNPCId)) {
        setSelectedNPCId(null);
      }
      return removed;
    }
    if (assetType === 'tree') {
      const removed = manualTrees.filter(t => assetIds.includes(t.id));
      setManualTrees(prev => prev.filter(t => !assetIds.includes(t.id)));
      return removed;
    }
    if (assetType === 'rock') {
      const removed = manualRocks.filter(r => assetIds.includes(r.id));
      setManualRocks(prev => prev.filter(r => !assetIds.includes(r.id)));
      return removed;
    }
    if (assetType === 'grass') {
      const removed = manualGrass.filter(g => assetIds.includes(g.id));
      setManualGrass(prev => prev.filter(g => !assetIds.includes(g.id)));
      return removed;
    }
    if (assetType === 'bush') {
      const removed = manualBushes.filter(b => assetIds.includes(b.id));
      setManualBushes(prev => prev.filter(b => !assetIds.includes(b.id)));
      return removed;
    }
    if (assetType === 'object') {
      const removed = manualObjects.filter(o => assetIds.includes(o.id));
      setManualObjects(prev => prev.filter(o => !assetIds.includes(o.id)));
      return removed;
    }
    return [];
  }, [
    placedBuildings,
    placedNPCs,
    manualTrees,
    manualRocks,
    manualGrass,
    manualBushes,
    manualObjects,
    selectedBuildingId,
    selectedNPCId,
  ]);

  const handleEraseAssets = useCallback((assetIds: string[], assetType: EraseableAsset['type']) => {
    const removedAssets = removeAssetsByIds(assetIds, assetType);
    if (removedAssets.length === 0) return;

    removedAssets.forEach((asset: any) => {
      recordCommand(createRemoveAssetCommand(assetType as any, asset.id, asset, `Remove ${assetType}`));
    });
    setAssetCount(prev => Math.max(prev - removedAssets.length, 0));
  }, [removeAssetsByIds, recordCommand]);

  const handlePathAssetsRemoved = useCallback((assetIds: string[], assetType: 'tree' | 'rock' | 'bush' | 'grass') => {
    if (!removeAssetsOnPath) return;
    const removedAssets = removeAssetsByIds(assetIds, assetType);
    if (removedAssets.length === 0) return;

    removedAssets.forEach((asset: any) => {
      pendingPathCommandsRef.current.push(
        createRemoveAssetCommand(assetType, asset.id, asset, `Remove ${assetType}`)
      );
    });
    setAssetCount(prev => Math.max(prev - removedAssets.length, 0));
  }, [removeAssetsByIds, removeAssetsOnPath]);

  const handlePathComplete = useCallback((path: PathSegment, modification: PathModification) => {
    setPaths(prev => [...prev, path]);

    const pathCommand = createCreatePathCommand(path, modification, 'Create path');
    if (pendingPathCommandsRef.current.length > 0) {
      const batch = createBatchCommand([pathCommand, ...pendingPathCommandsRef.current], 'Create path');
      recordCommand(batch);
      pendingPathCommandsRef.current = [];
    } else {
      recordCommand(pathCommand);
    }
  }, [recordCommand]);

  const handleTerrainAssetUpdate = useCallback((updatedAssets: {
    buildings?: Array<{ id: string; pos: [number, number, number] }>;
    npcs?: Array<{ id: string; pos: [number, number, number] }>;
    trees?: Array<{ id: string; pos: [number, number, number] }>;
    rocks?: Array<{ id: string; pos: [number, number, number] }>;
    bushes?: Array<{ id: string; pos: [number, number, number] }>;
    grass?: Array<{ id: string; pos: [number, number, number] }>;
  }) => {
    if (updatedAssets.buildings) {
      setPlacedBuildings(prev => prev.map(b => {
        const updated = updatedAssets.buildings?.find(u => u.id === b.id);
        return updated ? { ...b, pos: updated.pos } : b;
      }));
    }
    if (updatedAssets.npcs) {
      setPlacedNPCs(prev => prev.map(n => {
        const updated = updatedAssets.npcs?.find(u => u.id === n.id);
        return updated ? { ...n, pos: updated.pos } : n;
      }));
    }
    if (updatedAssets.trees) {
      setManualTrees(prev => prev.map(t => {
        const updated = updatedAssets.trees?.find(u => u.id === t.id);
        return updated ? { ...t, pos: updated.pos } : t;
      }));
    }
    if (updatedAssets.rocks) {
      setManualRocks(prev => prev.map(r => {
        const updated = updatedAssets.rocks?.find(u => u.id === r.id);
        return updated ? { ...r, pos: updated.pos } : r;
      }));
    }
    if (updatedAssets.bushes) {
      setManualBushes(prev => prev.map(b => {
        const updated = updatedAssets.bushes?.find(u => u.id === b.id);
        return updated ? { ...b, pos: updated.pos } : b;
      }));
    }
    if (updatedAssets.grass) {
      setManualGrass(prev => prev.map(g => {
        const updated = updatedAssets.grass?.find(u => u.id === g.id);
        return updated ? { ...g, pos: updated.pos } : g;
      }));
    }
  }, []);

  // Render section content
  const renderSectionContent = () => {
    switch (currentSection.id) {
      case 'terrain':
        return (
          <TerrainSection
            selectedAsset={selectedAsset}
            onSelectAsset={handleAssetSelect}
            onOpenTemplates={() => setShowTemplateSelector(true)}
            templateName={selectedTerrainTemplate?.name || 'Forest'}
            treeAmount={treeAmount}
            setTreeAmount={setTreeAmount}
            grassAmount={grassAmount}
            setGrassAmount={setGrassAmount}
            rockAmount={rockAmount}
            setRockAmount={setRockAmount}
            bushAmount={bushAmount}
            setBushAmount={setBushAmount}
            islandSize={islandSize}
            setIslandSize={setIslandSize}
            isSquareTerrain={isSquareTerrain}
            noiseType={noiseType}
            setNoiseType={setNoiseType}
            onApplyTerrainType={handleApplyTerrainType}
            roughness={roughness}
            setRoughness={setRoughness}
            onRefreshWorld={regenerateProceduralAssets}
            isMobile={isPortrait}
          />
        );
      case 'buildings':
        return (
          <BuildingsSection
            selectedAsset={selectedAsset}
            onSelectAsset={handleAssetSelect}
            onOpenTemplates={() => setShowTemplateSelector(true)}
            templateName={selectedBuildingTemplate?.name}
            buildingAreas={buildingAreas}
            onAddBuildingArea={addBuildingArea}
            onRemoveBuildingArea={removeBuildingArea}
            onUpdateBuildingArea={updateBuildingArea}
            selectedBuildingAreaId={selectedBuildingAreaId}
            onSelectBuildingArea={setSelectedBuildingAreaId}
            selectedBuildingPack={selectedBuildingPack}
            onSelectBuildingPack={setSelectedBuildingPack}
            selectedBuildingAsset={selectedBuildingAsset}
            onSelectBuildingAsset={setSelectedBuildingAsset}
          />
        );
      case 'objects':
        return (
          <ObjectsSection
            selectedAsset={selectedAsset}
            onSelectAsset={handleAssetSelect}
            selectedBuildingPack={selectedBuildingPack}
            onSelectBuildingPack={setSelectedBuildingPack}
            selectedBuildingAsset={selectedBuildingAsset}
            onSelectBuildingAsset={setSelectedBuildingAsset}
          />
        );
      case 'characters':
        return (
          <CharactersSection
            selectedAsset={selectedAsset}
            onSelectAsset={handleAssetSelect}
            selectedNPCCharacter={selectedNPCCharacter}
            onSelectNPCCharacter={setSelectedNPCCharacter}
          />
        );
      case 'creatures':
        return (
          <CreaturesSection
            selectedAsset={selectedAsset}
            onSelectAsset={handleAssetSelect}
            selectedNPCCharacter={selectedNPCCharacter}
            onSelectNPCCharacter={setSelectedNPCCharacter}
          />
        );
      case 'paths':
        return <PathsSection isLocked={isSectionLocked(currentSection)} />;
      case 'audio':
        return (
          <AudioSection
            isLocked={isSectionLocked(currentSection)}
            voiceSample={voiceSample}
            onVoiceSampleChange={setVoiceSample}
            selectedVoice={selectedVoice}
            onSelectedVoiceChange={setSelectedVoice}
            recordingUrl={recordingUrl}
            onRecordingUrlChange={setRecordingUrl}
          />
        );
      case 'settings':
        return <SettingsSection />;
      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden flex flex-col">
      {/* Sidebar Menu - Home button menu */}
      <SidebarMenu
        isOpen={sidebarMenuOpen}
        onClose={() => setSidebarMenuOpen(false)}
        onLoadWorld={handleLoadWorld}
      />

      <UpgradePromptBanner
        trigger={upgradePrompts.currentPrompt || ''}
        isOpen={upgradePrompts.isOpen}
        onClose={upgradePrompts.closePrompt}
        onUpgrade={upgradePrompts.handleUpgrade}
      />
      
      {/* Top Toolbar - Hidden in play mode or play-only mode */}
      {!isPlayMode && !playOnlyMode && (
      <div className="bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between z-50">
        {isPortrait ? (
          /* Portrait Mode: Home + Stacked Fulfillment Bars */
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setSidebarMenuOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            >
              <Home size={20} className="text-slate-400" />
            </button>
            {/* Stacked Fulfillment Bars without labels */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <CompactProgressBar
                currentIndex={currentSectionIndex}
                total={BUILDER_SECTIONS.length}
                sections={BUILDER_SECTIONS}
              />
              <CompactAssetLimitBar
                current={assetCount}
                max={maxAssets}
              />
            </div>
          </div>
        ) : (
          /* Landscape Mode: Original layout */
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarMenuOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Open Menu"
          >
            <Home size={20} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">
              {questTemplate ? questTemplate.name : questMode === 'free-build' ? 'Free Build' : 'Quest Builder'}
            </h1>
            <p className="text-xs text-slate-400">
              {questTemplate && (
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                  questCategory === 'combat' ? 'bg-red-600/50' : 'bg-purple-600/50'
                }`}>
                  {questCategory === 'combat' ? '⚔️ Combat' : '💜 Non-Combat'}
                </span>
              )}
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] mr-2 bg-slate-700/60">
                {worldType}
              </span>
              Step {currentSectionIndex + 1}: {currentSection.userLabel}
            </p>
          </div>
        </div>
        )}

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button 
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${canUndo ? 'hover:bg-slate-800 text-slate-400' : 'text-slate-600 cursor-not-allowed'}`}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <button 
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${canRedo ? 'hover:bg-slate-800 text-slate-400' : 'text-slate-600 cursor-not-allowed'}`}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={18} />
          </button>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          {/* Tool Selection */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setCurrentTool('select')}
              className={`p-2 rounded transition-colors ${currentTool === 'select' ? 'bg-primary text-white' : 'hover:bg-slate-700 text-slate-400'}`}
              title="Select Tool"
            >
              <MousePointer2 size={16} />
            </button>
            <button
              onClick={() => {
                if (!canSculptTerrain) {
                  upgradePrompts.showPrompt('terrain_sculpt');
                  return;
                }
                setCurrentTool('brush');
              }}
              className={`p-2 rounded transition-colors ${
                currentTool === 'brush' ? 'bg-primary text-white' : 'hover:bg-slate-700 text-slate-400'
              } ${!canSculptTerrain ? 'opacity-50' : ''}`}
              title={canSculptTerrain ? 'Terrain Brush (Raise/Lower/Smooth)' : 'Terrain Brush (Creator)'}
            >
              <Paintbrush size={16} />
            </button>
            <button
              onClick={() => {
                if (!canUsePathTool) {
                  upgradePrompts.showPrompt('path_tool');
                  return;
                }
                setCurrentTool('path');
              }}
              className={`p-2 rounded transition-colors ${
                currentTool === 'path' ? 'bg-primary text-white' : 'hover:bg-slate-700 text-slate-400'
              } ${!canUsePathTool ? 'opacity-50' : ''}`}
              title={canUsePathTool ? 'Path Tool' : 'Path Tool (Pro)'}
            >
              <Route size={16} />
            </button>
            <button
              onClick={() => setCurrentTool('erase')}
              className={`p-2 rounded transition-colors ${currentTool === 'erase' ? 'bg-red-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
              title="Erase Tool"
            >
              <Eraser size={16} />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          {/* Mode Selector */}
          <div className="hidden md:block">
            <UIModeSelector compact />
          </div>

          <div className="w-px h-6 bg-slate-700 mx-2 hidden md:block" />

          {/* Play Test - Hidden in play-only mode */}
          {!playOnlyMode && (
            <button
              onClick={handlePlayTest}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${
                isPlayMode
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlayMode ? <EyeOff size={16} /> : <Eye size={16} />}
              {isPlayMode ? 'Edit' : 'Play Test'}
            </button>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${
              saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <Save size={16} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>

          {/* Publish/Validate - Only visible if user can publish */}
          <button
            onClick={() => {
              if (!canPublish) {
                upgradePrompts.showPrompt('world_limit');
                return;
              }
              setShowValidationPanel(true);
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${
              canPublish ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}
            title={canPublish ? 'Publish' : 'Publish requires upgrade'}
          >
            <Cloud size={16} />
            Publish
          </button>
        </div>
      </div>
      )}

      {/* Action Bar and Radial Menu - Only shown in play mode */}
      {isPlayMode && (
        <>
          {/* Action Bar */}
          <ActionBar
            slots={actionBarSlots}
            selectedSlotIndex={selectedActionSlotIndex}
            activeSlotIndex={activeActionSlotIndex}
            isRadialOpen={showRadialMenu}
            onSlotClick={(index) => {
              setSelectedActionSlotIndex(index);
              const slot = actionBarSlots[index];
              if (slot && slot.animationName && playTestCharacterRef.current) {
                // Mark as active temporarily
                setActiveActionSlotIndex(index);
                playTestCharacterRef.current.playAnimation(slot.animationName);
                // Reset active after 2 seconds for non-combat animations
                setTimeout(() => setActiveActionSlotIndex(-1), 2000);
              }
              // If it's a weapon, equip it
              if (slot && slot.type === 'weapon' && slot.weaponPath) {
                setEquippedWeaponId(slot.id);
              }
            }}
            onRadialToggle={() => setShowRadialMenu(!showRadialMenu)}
            onDrop={(index, item) => {
              const newSlots = [...actionBarSlots];
              newSlots[index] = item;
              setActionBarSlots(newSlots);
              // If dropping a weapon, mark it as equipped
              if (item.type === 'weapon') {
                setEquippedWeaponId(item.id);
                // Update the slot to show it's equipped
                newSlots[index] = { ...item, isEquipped: true };
                setActionBarSlots(newSlots);
              }
            }}
          />
          
          {/* Radial Menu */}
          <RadialMenu
            isOpen={showRadialMenu}
            onClose={() => setShowRadialMenu(false)}
            selectedSlotIndex={selectedActionSlotIndex}
            equippedWeaponId={equippedWeaponId}
            onSelectItem={(slot) => {
              // Add to selected slot
              const newSlots = [...actionBarSlots];
              newSlots[selectedActionSlotIndex] = slot;
              setActionBarSlots(newSlots);
              
              // Play animation immediately if it has one
              if (slot.animationName && playTestCharacterRef.current) {
                setActiveActionSlotIndex(selectedActionSlotIndex);
                playTestCharacterRef.current.playAnimation(slot.animationName);
                setTimeout(() => setActiveActionSlotIndex(-1), 2000);
              }
              
              // If it's a weapon, equip it
              if (slot.type === 'weapon' && slot.weaponPath) {
                setEquippedWeaponId(slot.id);
                newSlots[selectedActionSlotIndex] = { ...slot, isEquipped: true };
                setActionBarSlots(newSlots);
              }
              // Note: Radial menu does NOT close - user must click outside
            }}
          />
        </>
      )}

      {/* RPG UI - Only shown in play mode */}
      {isPlayMode && (
        <>
          {/* Top Left - Menu */}
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => setSidebarMenuOpen(true)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Home size={18} className="text-slate-300" />
            </button>
          </div>

          {/* Top Center - End Test Mode Button */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={handlePlayTest}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <EyeOff size={16} />
              End Test Mode
            </button>
          </div>

          {/* Top Right - Pause & Settings */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
            <button className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors">
              <Settings size={20} className="text-slate-300" />
            </button>
            <button className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors">
              <span className="text-slate-300 text-lg">⏸</span>
            </button>
          </div>

          {/* Bottom Left - Mobile Movement Toggle */}
          {isPortrait && (
            <div className="absolute bottom-4 left-4 z-50">
              <button className="p-4 bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors">
                <span className="text-white text-xl">🎮</span>
              </button>
            </div>
          )}

          {/* Bottom Center - Action Buttons (Mobile) */}
          {isPortrait && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-50">
              <button 
                onTouchStart={(e) => { e.preventDefault(); playTestCharacterRef.current?.attack(); }}
                onMouseDown={(e) => { e.preventDefault(); playTestCharacterRef.current?.attack(); }}
                className="p-3 bg-red-600/80 active:bg-red-700 rounded-lg transition-colors touch-none"
              >
                <span className="text-white text-sm font-bold">⚔️</span>
              </button>
              <button 
                onTouchStart={(e) => { e.preventDefault(); playTestCharacterRef.current?.block(); }}
                onTouchEnd={(e) => { e.preventDefault(); playTestCharacterRef.current?.blockRelease(); }}
                onMouseDown={(e) => { e.preventDefault(); playTestCharacterRef.current?.block(); }}
                onMouseUp={(e) => { e.preventDefault(); playTestCharacterRef.current?.blockRelease(); }}
                className="p-3 bg-blue-600/80 active:bg-blue-700 rounded-lg transition-colors touch-none"
              >
                <span className="text-white text-sm font-bold">🛡️</span>
              </button>
              <button 
                onTouchStart={(e) => { e.preventDefault(); playTestCharacterRef.current?.jump(); }}
                onMouseDown={(e) => { e.preventDefault(); playTestCharacterRef.current?.jump(); }}
                className="p-3 bg-green-600/80 active:bg-green-700 rounded-lg transition-colors touch-none"
              >
                <span className="text-white text-sm font-bold">⬆️</span>
              </button>
            </div>
          )}

          {/* Action Hints (PC) - Show keyboard hints */}
          {!isPortrait && (
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 z-50">
              <div className="text-xs text-slate-300 space-y-1">
                <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">WASD</kbd> Move</div>
                <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Space</kbd> Jump</div>
                <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Left Click</kbd> Attack</div>
                <div><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Right Click</kbd> Block</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex ${isPortrait ? 'flex-col' : 'flex-row'} overflow-hidden`}>

        {/* Sidebar - Floating box, compact on mobile - Hidden in play mode or play-only mode */}
        {!isSidebarCollapsed && !isPlayMode && !playOnlyMode && (
          <div className={`
            absolute bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl z-10 overflow-hidden flex flex-col
                ${isPortrait
              ? 'bottom-2 left-2 right-2 max-h-[40vh]'
                  : isNarrowScreen
                ? 'top-20 left-4 w-72 max-h-[calc(100vh-140px)]'
                : 'top-20 left-4 w-80 max-h-[calc(100vh-140px)]'
            }
          `}>
            {/* Header with close button */}
            <div className={`flex items-center justify-between border-b border-slate-700 flex-shrink-0 ${isPortrait ? 'p-2' : 'p-4'}`}>
              {isPortrait ? (
                /* Portrait: Draggable section tabs without scrollbar */
                <DraggableTabs
                  sections={BUILDER_SECTIONS}
                  currentIndex={currentSectionIndex}
                  completedSections={completedSections}
                  isSectionLocked={isSectionLocked}
                  onSectionChange={handleSectionChange}
                />
              ) : (
                <h3 className={`font-bold text-blue-300 flex items-center gap-2 ${isPortrait ? 'text-xs' : 'text-sm'}`}>
                  <Layers size={isPortrait ? 14 : 16} />
                  Builder
                </h3>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1 hover:bg-slate-700 rounded flex-shrink-0"
              >
                <X size={isPortrait ? 12 : 14} className="text-slate-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className={`flex-1 overflow-y-auto sidebar-scrollbar ${isPortrait ? 'p-2 space-y-2' : 'p-4 space-y-3'}`}>
              {!isPortrait && (
                <>
                {/* Progress */}
                <ProgressIndicator
                  currentIndex={currentSectionIndex}
                  total={BUILDER_SECTIONS.length}
                  sections={BUILDER_SECTIONS}
                    isMobile={false}
                />

                {/* Asset Limit */}
                <AssetLimitBar
                  current={assetCount}
                  max={maxAssets}
                  onUpgrade={() => console.log('Upgrade clicked')}
                    isMobile={false}
                />

                <div className="h-px bg-slate-700" />

                  {/* Section Navigation - Draggable tabs with selected in middle */}
                  <DraggableTabs
                    sections={BUILDER_SECTIONS}
                    currentIndex={currentSectionIndex}
                    completedSections={completedSections}
                    isSectionLocked={isSectionLocked}
                    onSectionChange={handleSectionChange}
                  />

                <div className="h-px bg-slate-700" />
                </>
              )}

                {/* Section Content */}
                <div className="py-2">
                  {renderSectionContent()}
                </div>

              {!isPortrait && <div className="h-px bg-slate-700" />}
            </div>

              {/* Next Button - Fixed at bottom */}
              <div className={`border-t border-slate-700 flex-shrink-0 bg-slate-900/50 ${isPortrait ? 'p-2' : 'p-4'}`}>
                <div className="flex gap-2">
                  {currentSectionIndex > 0 && (
                    <button
                      onClick={handlePreviousSection}
                      className={`bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors ${isPortrait ? 'p-2' : 'p-3'}`}
                    >
                      <ChevronLeft size={isPortrait ? 16 : 20} className="text-slate-400" />
                    </button>
                  )}
                  <div className="flex-1">
                    <NextSectionButton
                      nextSection={nextSection}
                      onNext={handleNextSection}
                      isLastSection={isLastSection}
                      isMobile={isPortrait}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* 3D Canvas Area */}
        <div className={`
          flex-1 relative bg-slate-950
          ${isPortrait ? 'order-1' : ''}
          ${isDropMode ? 'cursor-crosshair' : ''}
        `}>
          {/* 3D Canvas */}
          <Canvas
            camera={{ position: [80, 60, 80], fov: 60, far: 1500 }}
            shadows
            dpr={[1, 1.25]}
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: false,
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              const handleContextLost = (event: Event) => {
                event.preventDefault();
                console.warn('[Builder Canvas] WebGL context lost');
                setWebglContextLost(true);

                // Clear useGLTF cache to force reload on context restore
                // This prevents "object does not belong to this context" errors
                try {
                  // @ts-ignore - drei internal API
                  if (typeof useGLTF.clear === 'function') {
                    useGLTF.clear();
                    console.log('[Builder Canvas] Cleared useGLTF cache');
                  }
                } catch (e) {
                  console.warn('[Builder Canvas] Could not clear useGLTF cache:', e);
                }
              };
              const handleContextRestored = () => {
                console.log('[Builder Canvas] WebGL context restored');
                gl.resetState();

                // Force re-render of all 3D content by incrementing terrain key
                setTerrainKey(prev => prev + 1);
                setWebglContextLost(false);
              };
              canvas.addEventListener('webglcontextlost', handleContextLost, false);
              canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

              // Cleanup on unmount to avoid dangling listeners
              return () => {
                canvas.removeEventListener('webglcontextlost', handleContextLost, false);
                canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
              };
            }}
            style={{ cursor: isDropMode ? 'crosshair' : 'auto' }}
          >
            <PhysicsWorldProvider
              terrainMeshRef={terrainMeshRef}
              enablePhysics={false}
            >
              <Suspense fallback={null}>
                {/* Animation system updater */}
                <AnimationUpdater />
                <NPCSystemUpdater
                  isActive={isPlayMode}
                  playerPosition={playerStartPosition || [0, 0, 0]}
                />
                
                {/* Performance monitor */}
                <PerformanceMonitor />

                {/* Dynamic Skybox with moon effect */}
                <DynamicSkybox timeOfDay={timeOfDay} sunIntensity={1.2} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight
                  position={[
                    Math.cos((timeOfDay - 0.25) * Math.PI * 2) * 100,
                    Math.sin((timeOfDay - 0.25) * Math.PI * 2) * 100,
                    25
                  ]}
                  intensity={1.2}
                  castShadow
                  shadow-mapSize={[512, 512]}
                  shadow-camera-left={-60}
                  shadow-camera-right={60}
                  shadow-camera-top={60}
                  shadow-camera-bottom={-60}
                />

                {/* Camera Controls - Only in edit mode - allow camera movement when not dragging */}
                {!isPlayMode && (
                  <OrbitControls
                    enablePan={!isDraggingBuildingArea && !isDraggingGizmo}
                    enableZoom={!isDraggingBuildingArea && !isDraggingGizmo}
                    enableRotate={!isDraggingBuildingArea && !isDraggingGizmo}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={10}
                    maxDistance={300}
                  />
                )}

                {/* LowPoly Terrain - from TestWorld */}
                <LowPolyTerrain
                  ref={terrainMeshRef}
                  roughness={roughness}
                  islandSize={islandSize}
                  seed={seed}
                  terrainDetail={terrainDetail}
                  heightScale={heightScale}
                  cliffIntensity={cliffIntensity}
                  buildingAreas={buildingAreas}
                  isSquareTerrain={isSquareTerrain}
                  noiseType={noiseType}
                  onTerrainReady={() => setTerrainReady(true)}
                />

                {/* Optimized Ocean - Only show in island mode (not square terrain/forest) */}
                {!isSquareTerrain && (
                  <OptimizedOcean
                    wavePreset={wavePreset}
                    waveHeight={waveHeight}
                    timeOfDay={timeOfDay}
                    waterLevel={waterLevel}
                    oceanSize={oceanSize}
                    transparency={oceanTransparency}
                  />
                )}
                
                {/* OLD DynamicOcean - Preserved for reference
                {!isSquareTerrain && (
                  <DynamicOcean
                    timeOfDay={timeOfDay}
                    oceanSize={oceanSize}
                    waveStrength={waveStrength}
                    waveSpeed={waveSpeed}
                    waveAmplitude={waveAmplitude}
                    oceanTransparency={oceanTransparency}
                    rippleScale={rippleScale}
                    waterLevel={waterLevel}
                  />
                )}
                */}

                {/* Optimized Fog / Cloud Mesh */}
                <OptimizedFog
                  terrainSize={isSquareTerrain ? (islandSize * 2) : (islandSize * 3)}
                  terrainRadius={islandSize}
                  isSquareTerrain={isSquareTerrain}
                  fogHeight={fogHeight}
                  fogOffset={fogOffset}
                  densityPreset={fogPreset}
                  timeOfDay={timeOfDay}
                />

                {/* OLD VolumetricFog - Preserved for reference
                <VolumetricFog
                  key={`fog-${isSquareTerrain}-${islandSize}-${bubbleDensity}-${bubbleScale}-${fogOffset}`}
                  timeOfDay={timeOfDay}
                  fogHeight={fogHeight}
                  bubbleScale={bubbleScale}
                  bubbleDensity={bubbleDensity}
                  bubbleSpeed={bubbleSpeed}
                  terrainSize={isSquareTerrain ? (islandSize * 2) : (islandSize * 3)}
                  terrainRadius={islandSize}
                  isSquareTerrain={isSquareTerrain}
                  fogOffset={fogOffset}
                />
                */}

                {/* Building Area Gizmos - Hidden in play mode */}
                {!isPlayMode && buildingAreas.map((area) => (
                  selectedBuildingAreaId === area.id && (
                    <BuildingAreaGizmo
                      key={`gizmo-${area.id}`}
                      area={area}
                      onMove={(x, z) => updateBuildingArea(area.id, { x, z })}
                      onResize={(radius) => updateBuildingArea(area.id, { radius })}
                      onElevate={(height) => updateBuildingArea(area.id, { height })}
                      onDragStart={() => setIsDraggingBuildingArea(true)}
                      onDragEnd={() => setIsDraggingBuildingArea(false)}
                    />
                  )
                ))}

                {/* Procedural Forest Assets - only render when terrain is ready */}
                {terrainReady && (
                  <Forest
                    roughness={roughness}
                    islandSize={islandSize}
                    assetSeed={assetSeed}
                    terrainDetail={terrainDetail}
                    treeAmount={treeAmount}
                    treeSize={treeSize}
                    grassAmount={grassAmount}
                    grassSize={grassSize}
                    terrainGrassCoverage={terrainGrassCoverage}
                    buildingGrassFalloff={50}
                    rockAmount={rockAmount}
                    rockSize={rockSize}
                    bushAmount={bushAmount}
                    bushSize={bushSize}
                    heightScale={heightScale}
                    cliffIntensity={cliffIntensity}
                    treeHeightOffset={treeHeightOffset}
                    grassHeightOffset={grassHeightOffset}
                    rockHeightOffset={rockHeightOffset}
                    bushHeightOffset={bushHeightOffset}
                    buildingAreas={buildingAreas}
                    slopeAdjustmentIntensity={slopeAdjustmentIntensity}
                    getTerrainHeight={getTerrainHeight}
                    onAssetsGenerated={(assets) => {
                      setProceduralAssets(assets);
                    }}
                    terrainMeshRef={terrainMeshRef}
                    isSquareTerrain={isSquareTerrain}
                  />
                )}

                {/* Terrain Tools */}
                {!isPlayMode && (
                  <>
                    <TerrainBrushTool
                      enabled={currentTool === 'brush'}
                      terrainMeshRef={terrainMeshRef}
                      config={brushConfig}
                      terrainScale={terrainScale}
                      terrainSize={terrainSize}
                      getTerrainHeight={getTerrainHeight}
                      onModification={(modification) => {
                        recordCommand(createModifyTerrainCommand(modification, 'Modify terrain'));
                      }}
                      onAssetUpdate={handleTerrainAssetUpdate}
                      placedBuildings={placedBuildings}
                      placedNPCs={placedNPCs}
                      manualTrees={manualTrees}
                      manualRocks={manualRocks}
                      manualBushes={manualBushes}
                      manualGrass={manualGrass}
                    />

                    <PathToolComponent
                      enabled={currentTool === 'path'}
                      terrainMeshRef={terrainMeshRef}
                      terrainScale={terrainScale}
                      terrainSize={terrainSize}
                      getTerrainHeight={getTerrainHeight}
                      pathWidth={pathWidth}
                      pathTexture={pathTexture}
                      smoothTerrain={smoothTerrain}
                      removeAssets={removeAssetsOnPath}
                      paths={paths}
                      onPathComplete={handlePathComplete}
                      onAssetsRemoved={handlePathAssetsRemoved}
                      manualTrees={manualTrees}
                      manualRocks={manualRocks}
                      manualBushes={manualBushes}
                      manualGrass={manualGrass}
                    />

                    <EraseTool
                      enabled={currentTool === 'erase'}
                      mode={eraseMode}
                      brushRadius={eraseBrushRadius}
                      assets={eraseableAssets}
                      onErase={handleEraseAssets}
                    />
                  </>
                )}

                {/* Manually placed assets - using memoized arrays to prevent re-renders */}
                {manualTrees.length > 0 && (
                  <InstancedForest
                    trees={memoizedTrees}
                    castShadow
                    receiveShadow={false}
                  />
                )}
                {manualRocks.length > 0 && (
                  <InstancedRocks rocks={manualRocks} castShadow receiveShadow={false} />
                )}
                {manualGrass.length > 0 && (
                  <>
                    {/* ORIGINAL (pre-optimization): <InstancedGrass grass={manualGrass} castShadow receiveShadow={false} /> */}
                    <InstancedGrass grass={manualGrass} castShadow={false} receiveShadow={false} />
                  </>
                )}
                {manualBushes.length > 0 && (
                  <>
                    {/* ORIGINAL (pre-optimization): <InstancedBushes bushes={manualBushes} castShadow receiveShadow={false} /> */}
                    <InstancedBushes bushes={manualBushes} castShadow={false} receiveShadow={false} />
                  </>
                )}

                {/* Ghost preview handler for buildings and NPCs - only show ghost, don't auto-place */}
                {/* Only enable when in select tool mode AND building/NPC is selected */}
                {!isPlayMode && currentTool === 'select' && (selectedBuildingAsset || selectedNPCCharacter) && (
                  <>
                    <GhostPreviewHandler
                      terrainMeshRef={terrainMeshRef}
                      enabled={true}
                      onPreviewUpdate={setGhostPreviewPosition}
                      getTerrainHeight={getTerrainHeight}
                    />
                    {/* Terrain click handler for placing buildings and NPCs - only when selected */}
                    <TerrainClickHandler
                      terrainMeshRef={terrainMeshRef}
                      selectedAsset={selectedBuildingAsset || (selectedNPCCharacter ? `npc:${selectedNPCCharacter}` : null)}
                      onPlaceAsset={handlePlaceAsset}
                      getTerrainHeight={getTerrainHeight}
                    />
                  </>
                )}

                {/* Ghost preview for buildings */}
                {!isPlayMode && ghostPreviewPosition && selectedBuildingAsset && selectedBuildingPack && (
                  <GhostBuilding
                    packId={selectedBuildingPack}
                    assetType={selectedBuildingAsset.split(':')[1]}
                    position={ghostPreviewPosition}
                  />
                )}

                {/* Ghost preview for NPCs */}
                {!isPlayMode && ghostPreviewPosition && selectedNPCCharacter && (
                  <GhostNPC
                    characterId={selectedNPCCharacter}
                    modelPath={(ASSET_PACKS.find((p: any) => p.id === 'kaykit')?.characters.find((c: any) => c.id === selectedNPCCharacter) as any)?.modelPath || ''}
                    assetId={(ASSET_PACKS.find((p: any) => p.id === 'kaykit')?.characters.find((c: any) => c.id === selectedNPCCharacter) as any)?.assetId || ''}
                    position={ghostPreviewPosition}
                  />
                )}

                {/* Placed buildings */}
                {placedBuildings.map((building) => (
                  <PlacedBuilding
                    key={building.id}
                    id={building.id}
                    packId={building.packId}
                    assetType={building.assetType}
                    position={building.pos}
                    rotation={building.rotation}
                    scale={building.scale}
                    isSelected={selectedBuildingId === building.id}
                    onSelect={(id) => {
                      if (!isPlayMode) {
                        setSelectedBuildingId(id);
                        setSelectedNPCId(null);
                      }
                    }}
                    onHover={(id) => {
                      // Hover highlighting handled in component
                    }}
                    onBoundsComputed={(id, bounds) => {
                      // Update building state with computed bounds
                      setPlacedBuildings(prev => prev.map(b => 
                        b.id === id ? { ...b, bounds } : b
                      ));
                      // Cache bounds for collision detection
                      buildingBoundsCache.current.set(id, bounds);
                    }}
                  />
                ))}

                {/* Puzzle Box (for slider puzzle template) */}
                {isPlayMode && questTemplate?.miniGameType === 'slider_puzzle' && (
                  <PuzzleBox
                    position={puzzleBoxPosition}
                    onInteract={() => setShowPuzzleUI(true)}
                    playerPosition={currentPlayerPosition}
                    interactionRadius={3}
                  />
                )}

                {/* Collectible Items (for Collect & Return template) */}
                {isPlayMode && questTemplate?.miniGameType === 'collect_return' && collectibleItems.map((item) => (
                  <CollectibleItem
                    key={item.id}
                    itemId={item.id}
                    position={item.position}
                    itemType={item.itemType}
                    collected={item.collected}
                  />
                ))}

                {/* Placed NPCs - can select any NPC regardless of selected pack */}
                {placedNPCs.map((npc) => (
                  <PlacedNPC
                    key={npc.id}
                    id={npc.id}
                    characterId={npc.characterId}
                    modelPath={npc.modelPath}
                    assetId={npc.assetId}
                    position={npc.pos}
                    rotation={npc.rotation}
                    weaponPath={npc.weaponPath}
                    shieldPath={npc.shieldPath}
                    isSelected={selectedNPCId === npc.id}
                    isPlayMode={isPlayMode}
                    onSelect={(id) => {
                      if (!isPlayMode) { // Only allow selection in building mode, not play mode
                        setSelectedNPCId(id);
                        setSelectedBuildingId(null);
                      }
                    }}
                    onHover={(id) => {
                      // Hover highlighting handled in component
                    }}
                  />
                ))}

                {/* Gizmos for selected buildings */}
                {!isPlayMode && selectedBuildingId && (
                  (() => {
                    const building = placedBuildings.find(b => b.id === selectedBuildingId);
                    if (!building) return null;
                    
                    // Calculate center Z from bounds if available, otherwise use position
                    let centerZ = building.pos[2];
                    let centerY = building.pos[1];
                    if (building.bounds) {
                      centerZ = (building.bounds.min.z + building.bounds.max.z) / 2;
                      centerY = (building.bounds.min.y + building.bounds.max.y) / 2;
                    }
                    
                    const gizmoPosition: [number, number, number] = [building.pos[0], centerY, centerZ];
                    
                    return (
                      <MoveRotateGizmo
                        position={gizmoPosition}
                        rotation={building.rotation}
                        size={Math.max(building.scale * 1.5, 8)}
                        offsetY={0.1}
                        rotationAbove={true}
                        buildingBounds={building.bounds}
                        onMove={(x, z) => {
                          const terrainY = getTerrainHeight(x, z);
                          setPlacedBuildings(prev => prev.map(b => 
                            b.id === selectedBuildingId ? { ...b, pos: [x, terrainY, z] } : b
                          ));
                        }}
                        onRotate={(rotation) => {
                          setPlacedBuildings(prev => prev.map(b => 
                            b.id === selectedBuildingId ? { ...b, rotation } : b
                          ));
                        }}
                        onDragStart={() => setIsDraggingGizmo(true)}
                        onDragEnd={() => setIsDraggingGizmo(false)}
                      />
                    );
                  })()
                )}

                {/* Gizmos for selected NPCs */}
                {!isPlayMode && selectedNPCId && (
                  (() => {
                    const npc = placedNPCs.find(n => n.id === selectedNPCId);
                    if (!npc) return null;
                    return (
                      <MoveRotateGizmo
                        position={npc.pos}
                        rotation={npc.rotation}
                        size={6} // Larger gizmo for NPCs
                        offsetY={2.5}
                        rotationAbove={false}
                        onMove={(x, z) => {
                          const terrainY = getTerrainHeight(x, z);
                          setPlacedNPCs(prev => prev.map(n => 
                            n.id === selectedNPCId ? { ...n, pos: [x, terrainY, z] } : n
                          ));
                        }}
                        onRotate={(rotation) => {
                          setPlacedNPCs(prev => prev.map(n => 
                            n.id === selectedNPCId ? { ...n, rotation } : n
                          ));
                        }}
                        onDragStart={() => setIsDraggingGizmo(true)}
                        onDragEnd={() => setIsDraggingGizmo(false)}
                      />
                    );
                  })()
                )}

                {/* Terrain click handler for manual placement - only for nature assets, not buildings/NPCs */}
                {!isPlayMode && currentTool === 'select' && selectedAsset && !selectedBuildingAsset && !selectedNPCCharacter && (
                  <TerrainClickHandler
                    terrainMeshRef={terrainMeshRef}
                    selectedAsset={selectedAsset}
                    onPlaceAsset={handlePlaceAsset}
                    getTerrainHeight={getTerrainHeight}
                  />
                )}

                {/* Terrain deselection handler - click on terrain to deselect buildings/NPCs */}
                {!isPlayMode && (selectedBuildingId || selectedNPCId) && (
                  <TerrainDeselectHandler
                    terrainMeshRef={terrainMeshRef}
                    selectedBuildingId={selectedBuildingId}
                    selectedNPCId={selectedNPCId}
                    placedBuildings={placedBuildings}
                    placedNPCs={placedNPCs}
                    onDeselect={() => {
                      setSelectedBuildingId(null);
                      setSelectedNPCId(null);
                    }}
                  />
                )}

                {/* Play Test Character - only in play mode with valid position */}
                {isPlayMode && terrainReady && playerStartPosition && (
                  <PlayTestCharacter
                    startPosition={playerStartPosition}
                    terrainMeshRef={terrainMeshRef}
                    proceduralTrees={proceduralAssets.trees}
                    proceduralRocks={proceduralAssets.rocks}
                    manualTrees={memoizedTreeCollisions}
                    manualRocks={memoizedRockCollisions}
                    placedBuildings={placedBuildings}
                    placedNPCs={placedNPCs}
                    manualObjects={manualObjects}
                    getTerrainHeight={getTerrainHeight}
                    characterHeightOffset={0.0}
                    islandSize={islandSize}
                    isSquareTerrain={isSquareTerrain}
                    fogOffset={fogOffset}
                    terrainSize={terrainSize}
                    isPlayMode={isPlayMode}
                    setCurrentPlayerPosition={setCurrentPlayerPosition}
                    onRef={(ref) => { playTestCharacterRef.current = ref; }}
                  />
                )}

                {/* Drop Mode Click Handler - for placing player on terrain */}
                {isDropMode && (
                  <DropModeClickHandler
                    terrainMeshRef={terrainMeshRef}
                    isDropMode={isDropMode}
                    onDropPlayer={handleDropPlayer}
                  />
                )}
              </Suspense>
            </PhysicsWorldProvider>
          </Canvas>

          {/* WebGL Context Lost Overlay */}
          {webglContextLost && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
              <div className="text-center text-white">
                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-lg font-medium">Restoring graphics...</div>
                <div className="text-sm text-slate-400 mt-2">GPU memory was recovered</div>
              </div>
            </div>
          )}

          {/* Toggle Sidebar Button - Always show when collapsed, at top - Hidden in play mode or play-only mode */}
          {isSidebarCollapsed && !isPlayMode && !playOnlyMode && (
          <button
              onClick={() => setIsSidebarCollapsed(false)}
            className={`
                absolute z-20 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-all
                top-4 left-4
              `}
              title="Show Builder"
            >
              <Layers size={20} className="text-slate-400" />
          </button>
          )}

          {/* Right Sidebar - Environment Controls - Hidden in play mode or play-only mode */}
          {showRightSidebar && !isPlayMode && !playOnlyMode && (
            <div className={`
              absolute bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-4 space-y-4 z-10 overflow-y-auto sidebar-scrollbar
              ${isPortrait
                ? 'bottom-4 left-4 right-4 max-h-[40vh]'
                : isNarrowScreen
                  ? 'top-4 right-4 w-56 max-h-[calc(100vh-120px)]'
                  : 'top-4 right-4 w-64 max-h-[calc(100vh-120px)]'
              }
            `}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <Settings size={16} />
                  Environment
                </h3>
                <button
                  onClick={() => setShowRightSidebar(false)}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              </div>

              {/* Day/Night Slider */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sun size={14} className="text-amber-400" />
                  <span>Time of Day</span>
                  <Moon size={14} className="text-blue-400 ml-auto" />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-amber-500 via-blue-500 to-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Fog Controls (OptimizedFog) */}
              <div className="space-y-3 border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Cloud size={14} className="text-slate-300" />
                    <span>Fog / Clouds</span>
                  </div>
                  <div className="flex gap-1 text-[11px]">
                    {[FogDensityPreset.LIGHT, FogDensityPreset.MODERATE, FogDensityPreset.DENSE].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setFogPreset(preset)}
                        className={`px-2 py-1 rounded border border-slate-700 transition-colors ${
                          fogPreset === preset ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <AssetSlider
                  label="Fog Height"
                  value={fogHeight}
                  min={0}
                  max={15}
                  step={0.5}
                  onChange={setFogHeight}
                  color="blue"
                />
                <AssetSlider
                  label="Fog Distance from Edge"
                  value={fogOffset}
                  min={0}
                  max={80}
                  step={1}
                  onChange={(v) => setFogOffset(Math.max(0, Math.min(80, v)))}
                  color="blue"
                />
              </div>

              {/* Ocean Controls - Only for Island mode */}
              {!isSquareTerrain && (
                <div className="space-y-2 border-t border-slate-700 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Waves size={14} className="text-cyan-400" />
                    <span>Ocean</span>
                  </div>
                  <AssetSlider
                    label="Water Height"
                    value={waterLevel}
                    min={-2}
                    max={2}
                    step={0.1}
                    onChange={setWaterLevel}
                    color="blue"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Wave Preset</span>
                    <div className="flex gap-1 text-[11px]">
                      {[WavePreset.CALM, WavePreset.GENTLE, WavePreset.MODERATE, WavePreset.ROUGH, WavePreset.STORM].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setWavePreset(preset)}
                          className={`px-2 py-1 rounded border border-slate-700 transition-colors ${
                            wavePreset === preset ? 'bg-cyan-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {preset.charAt(0).toUpperCase() + preset.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AssetSlider
                    label="Wave Height"
                    value={waveHeight}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onChange={(v) => setWaveHeight(Math.max(0.5, Math.min(3, v)))}
                    color="blue"
                  />
                  <AssetSlider
                    label="Water Clarity"
                    value={oceanTransparency}
                    min={0.05}
                    max={1}
                    step={0.05}
                    onChange={(v) => setOceanTransparency(Math.max(0.05, Math.min(1, v)))}
                    color="blue"
                  />
                  <AssetSlider
                    label="Ocean Size"
                    value={oceanSize}
                    min={200}
                    max={800}
                    step={25}
                    onChange={(v) => setOceanSize(Math.max(200, Math.min(800, v)))}
                    color="blue"
                  />
                </div>
              )}
            </div>
          )}

          {/* Toggle Right Sidebar Button - when collapsed, at top - Hidden in play mode */}
          {!showRightSidebar && !isPlayMode && (
            <button
              onClick={() => setShowRightSidebar(true)}
              className={`
                absolute p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg z-10
                top-4 right-4
              `}
              title="Show Environment Controls"
            >
              <Settings size={20} className="text-slate-400" />
            </button>
          )}

          {/* Selected Asset Indicator - Hidden in play mode */}
          {selectedAsset && !isPlayMode && (
            <div className={`
              absolute px-4 py-2 bg-primary/90 text-white rounded-full font-bold text-sm flex items-center gap-2
              ${isPortrait
                ? 'top-4 right-4'
                : showRightSidebar
                  ? isNarrowScreen ? 'top-4 right-64' : 'top-4 right-72'
                  : 'top-4 right-4'
              }
            `}>
              <span>Placing: {selectedAsset}</span>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Old Mode Indicator - Removed, using new RPG UI instead */}
          {false && isPlayMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-600/90 text-white rounded-lg font-bold text-sm flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Play size={16} />
                Play Test Mode
              </div>
              <div className="text-xs font-normal opacity-80">
                WASD to move • Space to jump
              </div>
            </div>
          )}

          {/* Help Text - only in edit mode */}
          {!isPlayMode && !isDropMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800/80 text-slate-300 rounded-lg text-xs">
              {selectedAsset
                ? 'Click in the world to place asset'
                : 'Select an asset from the sidebar, then click to place'}
            </div>
          )}

          {/* Drop Mode Indicator */}
          {isDropMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-blue-600/90 text-white rounded-lg font-bold text-sm flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
                Drop Mode
              </div>
              <div className="text-xs font-normal opacity-80">
                Click anywhere on terrain to place your character
              </div>
              <button
                onClick={() => setIsDropMode(false)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Mini-Game HUD */}
          <MiniGameHUD isPlayMode={isPlayMode} />

          {/* Inventory UI */}
          <InventoryUI isPlayMode={isPlayMode} />

          {/* Slider Puzzle UI */}
          <SliderPuzzleUI
            isOpen={showPuzzleUI}
            onClose={() => setShowPuzzleUI(false)}
            puzzleImage={puzzleImage}
          />

          {/* Darkness Overlay for Survive the Night */}
          <DarknessOverlay darknessLevel={darknessLevel} enabled={isPlayMode && darknessLevel > 0} />
        </div>
      </div>

      {/* Play Mode Selection Modal */}
      <AnimatePresence>
        {showPlayModeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowPlayModeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-primary/30 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Play size={24} className="text-emerald-400" />
                Start Play Test
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Choose where to spawn your character
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* Start Position Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlayModeSelect('start')}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-lg p-4 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-3 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                      <Home size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Start Position</h3>
                      <p className="text-sm text-slate-400">Spawn at quest start point</p>
                    </div>
                  </div>
                </motion.button>

                {/* Drop Position Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlayModeSelect('drop')}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-cyan-500/30 hover:border-cyan-500/50 rounded-lg p-4 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/20 p-3 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Drop Position</h3>
                      <p className="text-sm text-slate-400">Click on map to place character</p>
                    </div>
                  </div>
                </motion.button>
              </div>

              <button
                onClick={() => setShowPlayModeModal(false)}
                className="mt-4 w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTerrain={handleSelectTerrain}
        onSelectBuilding={handleSelectBuilding}
        mode="both"
        selectedTerrainId={selectedTerrainTemplate?.id}
        selectedBuildingId={selectedBuildingTemplate?.id}
      />

      {/* Superuser Panel - Only visible in SUPERUSER mode */}
      {isSuperuser && !isPlayMode && (
        <SuperuserPanel
          onTerrainRaise={handleTerrainRaise}
          onTerrainLower={handleTerrainLower}
          onTerrainFlatten={handleTerrainFlatten}
          onHeightPreset={handleHeightPreset}
          onGridSnapToggle={setGridSnapEnabled}
          onPathSmoothingChange={handlePathSmoothingChange}
          onLoadDifficultyPreset={handleLoadDifficultyPreset}
          onSaveDifficultyPreset={handleSaveDifficultyPreset}
          onEnemyCountChange={setMiniGameEnemyCount}
          onSpawnRateChange={setMiniGameSpawnRate}
          onTimerChange={setMiniGameTimerSeconds}
          onVisionConeChange={setNpcVisionCone}
          onPatrolSpeedChange={setNpcPatrolSpeed}
          onAggressionRadiusChange={setNpcAggressionRadius}
          currentGridSnap={gridSnapEnabled}
          currentPathSmoothing={pathSmoothingStrength}
          currentEnemyCount={miniGameEnemyCount}
          currentSpawnRate={miniGameSpawnRate}
          currentTimer={miniGameTimerSeconds}
          currentVisionCone={npcVisionCone}
          currentPatrolSpeed={npcPatrolSpeed}
          currentAggressionRadius={npcAggressionRadius}
        />
      )}

      {/* Validation Panel Modal */}
      <AnimatePresence>
        {showValidationPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowValidationPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-purple-500/30 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cloud size={24} className="text-purple-400" />
                  Publish World
                </h2>
                <button
                  onClick={() => setShowValidationPanel(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              <ValidationPanel 
                sceneData={buildSceneData()}
                onPublish={() => {
                  console.log('[BuilderPage] Publishing world...');
                  setShowValidationPanel(false);
                }}
                onIssueClick={(assetId) => {
                  console.log('[BuilderPage] Navigate to asset:', assetId);
                  setShowValidationPanel(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 2px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.6);
          border-radius: 2px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
      `}</style>
    </div>
  );
}
