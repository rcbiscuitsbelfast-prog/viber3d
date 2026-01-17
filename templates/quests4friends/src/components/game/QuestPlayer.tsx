import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls, Sky, Environment } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlayerController, playerControls } from './PlayerController';
import { QuestEnvironment } from './QuestEnvironment';
import { QuestEntities } from './QuestEntities';
import { QuestUI } from '../ui/QuestUI';
import { useQuestStore } from '../../store/questStore';
import { assetRegistry } from '../../systems/assets/AssetRegistry';
import { animationManager } from '../../systems/animation/AnimationManager';
import { Quest } from '../../types/quest.types';
import * as THREE from 'three';

// Animation update component (must be inside Canvas)
function AnimationUpdater() {
  useFrame((_state, delta) => {
    // Update all animation mixers every frame
    animationManager.update(delta);
  });
  return null;
}

// Mock quest data for demo
function createMockQuest(): Quest {
  return {
    id: 'quest-demo-001',
    ownerId: 'user-123',
    title: 'Welcome to Quests4Friends',
    templateWorld: 'forest',
    gameplayStyle: 'mixed',
    createdAt: Date.now(),
    expiresAt: null,
    isPremium: false,
    environment: {
      seed: 12345,
      spawnPoint: new THREE.Vector3(0, 0, 0),
      ambientLight: {
        color: '#ffffff',
        intensity: 0.6,
      },
      directionalLight: {
        color: '#ffffff',
        intensity: 0.8,
        position: new THREE.Vector3(10, 20, 10),
      },
    },
    entities: [
      {
        id: 'npc-1',
        type: 'npc',
        assetId: 'char_rogue',
        position: new THREE.Vector3(5, 0, 5),
        rotation: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1),
        npcData: {
          name: 'Sage',
          dialog: [
            'Welcome, adventurer!',
            'This is a demo of Quests4Friends.',
            'Explore the world and collect items!',
            'Good luck on your quest!',
          ],
          interactionRadius: 3,
          animationSet: 'humanoid_basic',
          idleAnimation: 'idle',
          interactionAnimation: 'wave',
        },
      },
      {
        id: 'collectible-1',
        type: 'collectible',
        assetId: 'item_spellbook_closed',
        position: new THREE.Vector3(-5, 0.5, -5),
        rotation: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(0.5, 0.5, 0.5),
        collectibleData: {
          name: 'Treasure',
          autoCollect: true,
          collectionRadius: 1.5,
        },
      },
    ],
    tasks: [
      {
        id: 'task-1',
        type: 'interact',
        description: 'Talk to the Sage',
        targetId: 'npc-1',
        isOptional: false,
        isCompleted: false,
        order: 1,
      },
      {
        id: 'task-2',
        type: 'collect',
        description: 'Find the treasure',
        targetId: 'collectible-1',
        requiredCount: 1,
        currentCount: 0,
        isOptional: false,
        isCompleted: false,
        order: 2,
      },
    ],
    triggers: [],
    reward: {
      type: 'text',
      payloadText: 'Congratulations! You completed the quest!',
      revealStyle: 'chest',
      title: 'Mission Accomplished',
    },
    limits: {
      maxRecipients: 100,
    },
    analytics: {
      plays: 0,
      completions: 0,
    },
  };
}

export function QuestPlayer() {
  const { questId } = useParams<{ questId: string }>();
  const [assetsReady, setAssetsReady] = useState(false);
  
  const {
    currentQuest,
    isLoading,
    error,
    setCurrentQuest,
    startQuestSession,
    setLoading,
    setError,
  } = useQuestStore();

  // Initialize asset registry FIRST
  useEffect(() => {
    let isMounted = true;
    
    assetRegistry.initialize()
      .then(() => {
        if (isMounted) {
          setAssetsReady(true);
          console.log('Asset registry initialized successfully');
        }
      })
      .catch((err) => {
        console.error('Failed to initialize asset registry:', err);
        if (isMounted) {
          setError(`Failed to load game assets: ${err.message}`);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load quest data (only after assets are ready)
  useEffect(() => {
    if (!assetsReady) return;
    
    setLoading(true);
    
    try {
      // Use mock data for demo
      const quest = createMockQuest();
      setCurrentQuest(quest);
      startQuestSession(questId || 'demo-quest', 'anonymous-player-' + Date.now());
      setLoading(false);
    } catch (err) {
      setError('Failed to load quest');
      setLoading(false);
    }
  }, [questId, assetsReady]);

  if (!assetsReady || isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-white text-center">
          <div className="text-2xl font-bold animate-pulse">
            {!assetsReady ? 'Loading game assets...' : 'Loading Quest...'}
          </div>
          <div className="text-sm text-gray-300 mt-4">This may take a moment</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-red-900 to-purple-900">
        <div className="text-white text-center">
          <h1 className="text-3xl font-bold mb-4">Oops!</h1>
          <p className="text-xl">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentQuest) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <div className="text-white text-2xl">Quest not found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <KeyboardControls map={playerControls}>
        <Canvas
          camera={{
            position: [0, 10, 15],
            fov: 60,
          }}
          shadows
        >
          {/* Animation system updater */}
          <AnimationUpdater />

          {/* Lighting based on quest environment */}
          <ambientLight 
            color={currentQuest.environment.ambientLight.color} 
            intensity={currentQuest.environment.ambientLight.intensity} 
          />
          
          {currentQuest.environment.directionalLight && (
            <directionalLight
              color={currentQuest.environment.directionalLight.color}
              intensity={currentQuest.environment.directionalLight.intensity}
              position={currentQuest.environment.directionalLight.position.toArray()}
              castShadow
            />
          )}

          {/* Sky and environment based on template world */}
          {currentQuest.templateWorld === 'forest' && (
            <>
              <Sky sunPosition={[100, 20, 100]} />
              <fog attach="fog" args={['#a8d8ea', 30, 100]} />
            </>
          )}
          
          {currentQuest.templateWorld === 'meadow' && (
            <>
              <Sky sunPosition={[100, 50, 100]} />
              <fog attach="fog" args={['#e8f4f8', 40, 120]} />
            </>
          )}

          {currentQuest.templateWorld === 'town' && (
            <>
              <Sky sunPosition={[50, 20, 50]} />
              <fog attach="fog" args={['#d4d4d4', 50, 150]} />
            </>
          )}

          {/* Ground plane */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -0.1, 0]} 
            receiveShadow
          >
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#7ca982" />
          </mesh>

          {/* Quest environment (procedurally placed assets) */}
          <QuestEnvironment 
            templateWorld={currentQuest.templateWorld}
            seed={currentQuest.environment.seed}
          />

          {/* Quest entities (NPCs, enemies, collectibles) */}
          <QuestEntities entities={currentQuest.entities} />

          {/* Player */}
          <PlayerController 
            spawnPosition={currentQuest.environment.spawnPoint}
            playerAssetId="char_rogue"
          />
          
          {/* Debug: Show spawn point */}
          <mesh position={currentQuest.environment.spawnPoint.toArray()}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>

          {/* Environment preset for realistic lighting */}
          <Environment preset="forest" />
        </Canvas>
      </KeyboardControls>

      {/* UI Overlay - Must be above canvas */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <QuestUI />
      </div>
    </div>
  );
}
