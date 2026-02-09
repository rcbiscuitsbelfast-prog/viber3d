import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Check } from 'lucide-react';
import * as THREE from 'three';
import { CHARACTER_OPTIONS } from '../components/CharacterSelector';
import AnimatedCharacter from '../r3f/AnimatedCharacter';
import { getAssetPath } from '../utils/assetPath';
import { getWeaponConfig, getShieldConfig } from '../data/weapon-configs';

interface CharacterSelectPageProps {
  templateId?: string;
  templateConfig?: any;
  onConfirm: (characterId: string, characterPath: string) => void;
}

// Get asset ID from character path
const getAssetId = (characterPath: string): string => {
  const characterName = characterPath.split('/').pop()?.replace('.glb', '').toLowerCase() || 'rogue';
  if (characterName.includes('mage')) return 'char_mage';
  if (characterName.includes('ranger')) return 'char_ranger';
  if (characterName.includes('barbarian')) return 'char_barbarian';
  if (characterName.includes('rogue')) return 'char_rogue';
  return 'char_knight'; // Default
};

// Get weapon path from character path
const getWeaponPath = (characterPath: string): string | undefined => {
  if (characterPath.includes('Mage')) return '/Assets/weapons/staff.gltf';
  if (characterPath.includes('Ranger')) return '/Assets/weapons/bow.gltf';
  if (characterPath.includes('Barbarian')) return '/Assets/weapons/sword_2handed.gltf';
  if (characterPath.includes('Rogue')) return '/Assets/weapons/dagger.gltf';
  return '/Assets/weapons/sword_1handed.gltf'; // Default for Knight
};

// Get shield path from character path
const getShieldPath = (characterPath: string): string | undefined => {
  if (characterPath.includes('Barbarian')) return '/Assets/weapons/shield_round_barbarian.gltf';
  if (characterPath.includes('Mage') || characterPath.includes('Ranger')) return undefined; // No shield
  return '/Assets/weapons/shield_round.gltf'; // Default shield for Knight/Rogue
};

// Character preview component for mini canvas
function CharacterPreview({ 
  characterPath, 
  isSelected, 
  onSelect 
}: { 
  characterPath: string; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const assetId = getAssetId(characterPath);
  const weaponPath = isSelected ? getWeaponPath(characterPath) : undefined;
  const shieldPath = isSelected ? getShieldPath(characterPath) : undefined;
  
  // Get weapon/shield adjustments
  const weaponAdjustments = weaponPath ? getWeaponConfig(weaponPath) : undefined;
  const shieldAdjustments = shieldPath ? getShieldConfig(shieldPath) : undefined;
  
  // Rotate character slowly
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={isSelected ? 1.1 : 1.0}>
      <AnimatedCharacter
        characterPath={getAssetPath(characterPath)}
        assetId={assetId}
        characterId={`preview-${characterPath}`}
        scale={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        autoScale={false}
        currentAnimation={isSelected ? 'idleCombat' : 'idle'}
        weaponPath={weaponPath ? getAssetPath(weaponPath) : undefined}
        shieldPath={shieldPath ? getAssetPath(shieldPath) : undefined}
        weaponAdjustments={weaponAdjustments}
        shieldAdjustments={shieldAdjustments}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
    </group>
  );
}

// Mini canvas component
function MiniCanvas({ 
  character, 
  isSelected, 
  onSelect 
}: { 
  character: typeof CHARACTER_OPTIONS[0]; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`
        relative w-48 h-72 rounded-lg overflow-hidden cursor-pointer transition-all
        ${isSelected 
          ? 'ring-4 ring-primary shadow-2xl shadow-primary/50' 
          : 'ring-2 ring-slate-600 hover:ring-slate-500'
        }
      `}
    >
      <Canvas camera={{ position: [0, 1.8, 4], fov: 45 }}>
        <Suspense fallback={null}>
          <CharacterPreview 
            characterPath={character.modelPath} 
            isSelected={isSelected}
            onSelect={onSelect}
          />
        </Suspense>
        <OrbitControls 
          enabled={false} 
          target={[0, 1, 0]}
          minDistance={2}
          maxDistance={6}
        />
      </Canvas>
      
      {/* Character name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">{character.name}</h3>
            <p className="text-slate-300 text-xs">{character.description}</p>
          </div>
          <span className="text-2xl">{character.icon}</span>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary rounded-full p-2">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default function CharacterSelectPage({ templateId, templateConfig, onConfirm }: CharacterSelectPageProps) {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState<string>('rogue');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedCharacterData = CHARACTER_OPTIONS.find(c => c.id === selectedCharacter);

  // Load template from sessionStorage if available
  useEffect(() => {
    const pendingTemplate = sessionStorage.getItem('pendingTemplate');
    if (!pendingTemplate && !templateConfig) {
      // No template selected, redirect back
      navigate('/test-world');
    }
  }, [navigate, templateConfig]);

  const handleConfirm = () => {
    if (selectedCharacterData) {
      // Ensure template ID is preserved
      const pendingTemplate = sessionStorage.getItem('pendingTemplate');
      if (pendingTemplate) {
        try {
          const templateData = JSON.parse(pendingTemplate);
          // Store character selection and ensure template ID is preserved
          sessionStorage.setItem('selectedCharacterPath', selectedCharacterData.modelPath);
          sessionStorage.setItem('pendingTemplate', JSON.stringify({
            id: templateData.id || templateId || 'island', // Preserve template ID
            config: templateData.config || templateConfig,
          }));
        } catch (error) {
          console.error('[CharacterSelectPage] Failed to parse pending template:', error);
          // Fallback: just store character
          sessionStorage.setItem('selectedCharacterPath', selectedCharacterData.modelPath);
        }
      } else {
        // No template in storage, store character anyway
        sessionStorage.setItem('selectedCharacterPath', selectedCharacterData.modelPath);
      }
      
      // Navigate back to test-world
      navigate('/test-world');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b-2 border-slate-600">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/test-world')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-serif">Choose Your Character</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Instructions */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-lg">
              Select a character to play as. Click to see them in combat stance.
            </p>
          </div>

          {/* Horizontal Scrolling Character Selection */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {CHARACTER_OPTIONS.map((character) => (
              <MiniCanvas
                key={character.id}
                character={character}
                isSelected={selectedCharacter === character.id}
                onSelect={() => setSelectedCharacter(character.id)}
              />
            ))}
          </div>

          {/* Selected Character Info */}
          {selectedCharacterData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{selectedCharacterData.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCharacterData.name}</h2>
                  <p className="text-slate-400">{selectedCharacterData.description}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Confirm Button */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t-2 border-slate-600 p-4">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleConfirm}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all shadow-lg shadow-primary/50 flex items-center justify-center gap-3"
              >
                <Check className="w-6 h-6" />
                Confirm & Start Playing
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
