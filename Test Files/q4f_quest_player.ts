// src/components/game/QuestPlayer.tsx
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, Sky, Environment } from '@react-three/drei';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlayerController, playerControls } from './PlayerController';
import { QuestEnvironment } from './QuestEnvironment';
import { QuestEntities } from './QuestEntities';
import { QuestUI } from '../ui/QuestUI';
import { useQuestStore } from '../../store/questStore';
import { assetRegistry } from '../../systems/assets/AssetRegistry';

export function QuestPlayer() {
  const { questId } = useParams<{ questId: string }>();
  
  const {
    currentQuest,
    isLoading,
    error,
    setCurrentQuest,
    startQuestSession,
    setLoading,
    setError,
  } = useQuestStore();

  // Load quest data
  useEffect(() => {
    if (!questId) return;

    setLoading(true);
    
    // TODO: Replace with actual API call
    // For now, load from mock data or localStorage
    loadQuestData(questId)
      .then((quest) => {
        setCurrentQuest(quest);
        startQuestSession(questId, 'anonymous-player-' + Date.now());
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load quest: ' + err.message);
        setLoading(false);
      });
  }, [questId]);

  // Initialize asset registry
  useEffect(() => {
    assetRegistry.initialize().catch((err) => {
      console.error('Failed to initialize asset registry:', err);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-white text-2xl font-bold animate-pulse">
          Loading Quest...
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
          />

          {/* Environment preset for realistic lighting */}
          <Environment preset="forest" />
        </Canvas>
      </KeyboardControls>

      {/* UI Overlay */}
      <QuestUI />
    </div>
  );
}

// Mock quest data loader (replace with actual API)
async function loadQuestData(questId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock quest data
  return {
    id: questId,
    ownerId: 'creator-123',
    title: 'Forest Adventure',
    templateWorld: 'forest' as const,
    gameplayStyle: 'nonCombat' as const,
    createdAt: Date.now(),
    expiresAt: null,
    isPremium: false,
    environment: {
      seed: Math.random() * 10000,
      spawnPoint: { x: 0, y: 0, z: 0 },
      ambientLight: {
        color: '#ffffff',
        intensity: 0.5,
      },
      directionalLight: {
        color: '#ffffbb',
        intensity: 1,
        position: { x: 10, y: 20, z: 10 },
      },
    },
    entities: [
      {
        id: 'npc-1',
        type: 'npc' as const,
        assetId: 'char_mage',
        position: { x: 5, y: 0, z: 5 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        npcData: {
          name: 'Wise Elder',
          dialog: [
            'Welcome, brave adventurer!',
            'Find the three magical crystals scattered throughout the forest.',
            'Only then will the path to your reward be revealed.',
          ],
        },
      },
      {
        id: 'collectible-1',
        type: 'collectible' as const,
        assetId: 'item_spellbook_closed',
        position: { x: -8, y: 0.5, z: 3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collectibleData: {
          name: 'Blue Crystal',
          collected: false,
          autoCollect: true,
          collectionRadius: 2,
        },
      },
    ],
    tasks: [
      {
        id: 'task-1',
        type: 'collect' as const,
        description: 'Collect 3 magical crystals',
        targetAssetId: 'item_spellbook_closed',
        requiredCount: 3,
        currentCount: 0,
        isOptional: false,
        isCompleted: false,
        order: 1,
      },
    ],
    triggers: [
      {
        id: 'trigger-1',
        event: 'onTaskComplete' as const,
        sourceId: 'task-1',
        actions: [
          {
            type: 'unlockReward' as const,
            payload: {},
          },
        ],
      },
    ],
    reward: {
      type: 'text' as const,
      revealStyle: 'chest' as const,
      title: 'Congratulations!',
      message: 'You completed the quest!',
      payloadText: 'You are amazing! - Love, Alex',
    },
    limits: {
      maxRecipients: 10,
    },
    analytics: {
      plays: 0,
      completions: 0,
    },
  };
}