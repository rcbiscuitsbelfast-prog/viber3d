import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import * as THREE from 'three';
import { CHARACTER_OPTIONS } from './CharacterSelector';
import AnimatedCharacter from '../r3f/AnimatedCharacter';
import { getAssetPath } from '../utils/assetPath';
import { getWeaponConfig, getShieldConfig } from '../data/weapon-configs';

interface CharacterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (characterId: string, characterPath: string) => void;
  currentCharacter?: string;
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

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={isSelected ? 1.05 : 0.95}>
      <AnimatedCharacter
        characterPath={getAssetPath(characterPath)}
        assetId={assetId}
        characterId={`modal-preview-${characterPath}`}
        scale={0.6}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        autoScale={false}
        currentAnimation={isSelected ? 'idleCombat' : 'idle'}
        weaponPath={weaponPath ? getAssetPath(weaponPath) : undefined}
        shieldPath={shieldPath ? getAssetPath(shieldPath) : undefined}
        weaponAdjustments={weaponAdjustments}
        shieldAdjustments={shieldAdjustments}
        animationTimeScale={0.05}
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
        relative rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 snap-center bg-slate-800/90 backdrop-blur-sm
        ${isSelected 
          ? 'ring-4 ring-primary shadow-2xl shadow-primary/50' 
          : 'ring-2 ring-slate-600 hover:ring-slate-500'
        }
      `}
      style={{
        width: '200px',
        height: '300px',
        minWidth: '200px',
        minHeight: '300px',
      }}
    >
      <Canvas camera={{ position: [0, 2.2, 5.5], fov: 40 }}>
        <Suspense fallback={null}>
          <CharacterPreview 
            characterPath={character.modelPath} 
            isSelected={isSelected}
            onSelect={onSelect}
          />
        </Suspense>
        <OrbitControls 
          enabled={false} 
          target={[0, 0.8, 0]}
          minDistance={2}
          maxDistance={6}
        />
      </Canvas>
      
      {/* Character name overlay - no description */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center justify-center">
          <h3 className="text-white font-bold text-sm md:text-base">{character.name}</h3>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary rounded-full p-1.5">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default function CharacterSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect,
  currentCharacter = 'rogue'
}: CharacterSelectionModalProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string>(currentCharacter);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const selectedCharacterData = CHARACTER_OPTIONS.find(c => c.id === selectedCharacter);

  const handleConfirm = () => {
    if (selectedCharacterData) {
      onSelect(selectedCharacter, selectedCharacterData.modelPath);
      onClose();
    }
  };

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  const startScrolling = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) return; // Already scrolling
    
    scrollIntervalRef.current = window.setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ 
          left: direction === 'left' ? -10 : 10, 
          behavior: 'auto' 
        });
      }
    }, 16); // ~60fps
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScrolling();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Floating content - no background box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl mx-2 md:mx-4"
          >
            {/* Header - floating */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white font-display drop-shadow-lg">Choose Your Character</h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Horizontal Scrolling Character Selection with arrows */}
            <div className="relative mb-6" style={{ minHeight: '300px' }}>
              {/* Left arrow - Always visible */}
              <button
                onMouseDown={() => startScrolling('left')}
                onMouseUp={stopScrolling}
                onMouseLeave={stopScrolling}
                onTouchStart={() => startScrolling('left')}
                onTouchEnd={stopScrolling}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/40 backdrop-blur-md rounded-full p-3 transition-all shadow-lg"
                style={{
                  left: '-20px',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              {/* Right arrow - Always visible */}
              <button
                onMouseDown={() => startScrolling('right')}
                onMouseUp={stopScrolling}
                onMouseLeave={stopScrolling}
                onTouchStart={() => startScrolling('right')}
                onTouchEnd={stopScrolling}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/40 backdrop-blur-md rounded-full p-3 transition-all shadow-lg"
                style={{
                  right: '-20px',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              {/* Scroll container */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  paddingLeft: '40px',
                  paddingRight: '40px',
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
            </div>

            {/* Action Buttons - Just Confirm button - floating */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg backdrop-blur-sm"
              >
                <Check className="w-5 h-5" />
                Confirm
              </button>
            </div>

            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
