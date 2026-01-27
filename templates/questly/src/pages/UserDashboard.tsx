import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import CustomButton from '@/components/CustomButton';
import AnimatedCharacter from '@/r3f/AnimatedCharacter';
import * as THREE from 'three';

// Camera controller component
function CameraController({ distance }: { distance: number }) {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 1.5, distance);
    camera.lookAt(0, 1, 0);
  }, [camera, distance]);
  
  return null;
}

interface Character {
  id: string;
  name: string;
  modelPath: string;
  assetId: string;
  weapon?: string;
  pack: string;
}

interface AssetPack {
  id: string;
  name: string;
  description: string;
  characters: Character[];
}

const ASSET_PACKS: AssetPack[] = [
  {
    id: 'self_contained',
    name: 'Self-Contained Models',
    description: 'Models with built-in animations',
    characters: [
      { id: 'fox', name: 'Fox', modelPath: '/Assets/mixamo-animations/Fox.glb', assetId: 'fox', pack: 'self_contained' },
      { id: 'soldier', name: 'Soldier', modelPath: '/Assets/mixamo-animations/Soldier.glb', assetId: 'soldier', pack: 'self_contained' },
      { id: 'parrot', name: 'Parrot', modelPath: '/Assets/mixamo-animations/Parrot.glb', assetId: 'parrot', pack: 'self_contained' },
      { id: 'horse', name: 'Horse', modelPath: '/Assets/mixamo-animations/Horse.glb', assetId: 'horse', pack: 'self_contained' },
      { id: 'flamingo', name: 'Flamingo', modelPath: '/Assets/mixamo-animations/Flamingo.glb', assetId: 'flamingo', pack: 'self_contained' },
      { id: 'stork', name: 'Stork', modelPath: '/Assets/mixamo-animations/Stork.glb', assetId: 'stork', pack: 'self_contained' },
      { id: 'robot_expressive', name: 'Robot', modelPath: '/Assets/mixamo-animations/RobotExpressive.glb', assetId: 'robot_expressive', pack: 'self_contained' },
    ],
  },
  {
    id: 'additional_models',
    name: 'Additional Models',
    description: 'Other available character models',
    characters: [
      { id: 'char_animated_main', name: 'Main Character', modelPath: '/models/character_animated.glb', assetId: 'char_animated', pack: 'self_contained' },
      { id: 'char_movement', name: 'Movement Character', modelPath: '/models/character_with_anims.glb', assetId: 'char_movement', pack: 'self_contained' },
      { id: 'sage_static', name: 'Sage', modelPath: '/models/sage_idle.glb', assetId: 'sage_idle', pack: 'self_contained' },
      { id: 'quaternius_cleric', name: 'Cleric (Q)', modelPath: '/models/quaternius/Cleric.gltf', assetId: 'quaternius_cleric', pack: 'self_contained' },
      { id: 'quaternius_monk', name: 'Monk (Q)', modelPath: '/models/quaternius/Monk.gltf', assetId: 'quaternius_monk', pack: 'self_contained' },
      { id: 'quaternius_ranger', name: 'Ranger (Q)', modelPath: '/models/quaternius/Ranger.gltf', assetId: 'quaternius_ranger', pack: 'self_contained' },
      { id: 'quaternius_rogue', name: 'Rogue (Q)', modelPath: '/models/quaternius/Rogue.gltf', assetId: 'quaternius_rogue', pack: 'self_contained' },
      { id: 'quaternius_warrior', name: 'Warrior (Q)', modelPath: '/models/quaternius/Warrior.gltf', assetId: 'quaternius_warrior', pack: 'self_contained' },
      { id: 'quaternius_wizard', name: 'Wizard (Q)', modelPath: '/models/quaternius/Wizard.gltf', assetId: 'quaternius_wizard', pack: 'self_contained' },
    ],
  },
  {
    id: 'kaykit',
    name: 'KayKit',
    description: 'Medieval fantasy characters with full animation sets',
    characters: [
      { id: 'mage', name: 'Mage', modelPath: '/models/Mage.glb', assetId: 'char_mage', weapon: '/Assets/weapons/staff.gltf', pack: 'kaykit' },
      { id: 'knight', name: 'Knight', modelPath: '/models/Knight.glb', assetId: 'char_knight', weapon: '/Assets/weapons/sword_1handed.gltf', pack: 'kaykit' },
      { id: 'ranger', name: 'Ranger', modelPath: '/models/Ranger.glb', assetId: 'char_ranger', weapon: '/Assets/weapons/bow.gltf', pack: 'kaykit' },
      { id: 'rogue', name: 'Rogue', modelPath: '/models/Rogue.glb', assetId: 'char_rogue', weapon: '/Assets/weapons/dagger.gltf', pack: 'kaykit' },
      { id: 'barbarian', name: 'Barbarian', modelPath: '/models/Barbarian.glb', assetId: 'char_barbarian', weapon: '/Assets/weapons/sword_2handed.gltf', pack: 'kaykit' },
      { id: 'skeleton_mage', name: 'Skeleton Mage', modelPath: '/models/Skeleton_Mage.glb', assetId: 'skeleton_mage', pack: 'kaykit' },
      { id: 'skeleton_warrior', name: 'Skeleton Warrior', modelPath: '/models/Skeleton_Warrior.glb', assetId: 'skeleton_warrior', pack: 'kaykit' },
      { id: 'skeleton_rogue', name: 'Skeleton Rogue', modelPath: '/models/Skeleton_Rogue.glb', assetId: 'skeleton_rogue', pack: 'kaykit' },
      { id: 'skeleton_minion', name: 'Skeleton Minion', modelPath: '/models/Skeleton_Minion.glb', assetId: 'skeleton_minion', pack: 'kaykit' },
    ],
  },
  {
    id: 'kenny',
    name: 'Kenney',
    description: 'Coming soon - Kenney character assets',
    characters: [],
  },
  {
    id: 'quaternius',
    name: 'Quaternius (Disabled - Under Investigation)',
    description: 'Investigating skeleton compatibility',
    characters: [],
  },
];

// Character Preview Component
function CharacterPreview({ character }: { character: Character }) {
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(8);
  const [characterPosition, setCharacterPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [characterScale, setCharacterScale] = useState(1);
  const [selectedWeapon, setSelectedWeapon] = useState<string | undefined>(character.weapon);
  const [selectedShield, setSelectedShield] = useState<string | undefined>(undefined);

  // Reset state when character changes
  useEffect(() => {
    setAvailableAnimations([]);
    setCurrentAnimation('');
    setIsLoaded(false);
    // Reset position for new character
    setCharacterPosition([0, 0, 0]);
    setCharacterScale(1);
    setSelectedWeapon(character.weapon);
    setSelectedShield(undefined);
  }, [character.id]);

  const handleAnimationsLoaded = useCallback((animations: string[]) => {
    console.log(`✓ Loaded ${animations.length} animations for ${character.name}:`, animations);
    setAvailableAnimations(animations);
    if (animations.length > 0 && !currentAnimation) {
      // For Quaternius characters, prefer xbot or soldier animations
      let defaultAnim;
      if (character.pack === 'quaternius') {
        defaultAnim = animations.find(a => a.includes('idle') || a.includes('soldier_idle')) ||
                     animations.find(a => a.includes('walk') || a.includes('soldier_walk')) ||
                     animations.find(a => a.includes('robot_idle')) ||
                     animations[0];
      } else {
        // For KayKit, use the standard logic
        defaultAnim = animations.find(a => a.toLowerCase().includes('idle')) || animations[0];
      }
      console.log(`Setting default animation for ${character.pack}: ${defaultAnim}`);
      setCurrentAnimation(defaultAnim);
    }
    setIsLoaded(true);
  }, [character.name, character.pack, currentAnimation]);

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Canvas - Takes up most of the space */}
      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: [0, 1.5, cameraDistance], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <CameraController distance={cameraDistance} />
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[5, 5, 5]}
              intensity={1.2}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-5, 5, -5]} intensity={0.6} />
            <pointLight position={[0, 2, 2]} intensity={0.4} />

            <AnimatedCharacter
              characterPath={character.modelPath}
              assetId={character.assetId}
              characterId={`dashboard-${character.id}`}
              position={characterPosition}
              scale={character.id === 'soldier' ? characterScale * 0.5 : 1}
              rotation={[0, 0, 0]}
              currentAnimation={currentAnimation}
              weaponPath={selectedWeapon}
              shieldPath={selectedShield}
              onAnimationsLoaded={handleAnimationsLoaded}
            />

            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.5}
              scale={10}
              blur={2}
              far={4}
            />
            <Environment preset="sunset" />

            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={2}
              maxDistance={15}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
              target={[0, 1, 0]}
            />
          </Suspense>
        </Canvas>

        {/* Zoom Control - Right side */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3">
          <button
            onClick={() => setCameraDistance(Math.max(2, cameraDistance - 1))}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-white font-bold text-lg transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <input
            type="range"
            min="2"
            max="15"
            step="0.5"
            value={cameraDistance}
            onChange={(e) => setCameraDistance(Number(e.target.value))}
            className="w-32 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
            style={{ writingMode: 'bt-lr' }}
            title="Zoom"
          />
          <button
            onClick={() => setCameraDistance(Math.min(15, cameraDistance + 1))}
            className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-white font-bold text-lg transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <div className="text-xs text-slate-400 mt-1">{cameraDistance.toFixed(1)}m</div>
        </div>

        {/* Position Controls - Only for Soldier */}
        {character.id === 'soldier' && (
          <div className="absolute right-4 top-4 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 w-48">
            <div className="text-xs text-slate-300 font-bold uppercase mb-1">Soldier Controls</div>
            {/* Scale */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Scale</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={characterScale}
                  onChange={(e) => setCharacterScale(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-12 text-right">{characterScale.toFixed(1)}x</span>
              </div>
            </div>

            {/* Y Position (Up/Down) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Height (Y)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={characterPosition[1]}
                  onChange={(e) => setCharacterPosition([characterPosition[0], Number(e.target.value), characterPosition[2]])}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-12 text-right">{characterPosition[1].toFixed(1)}</span>
              </div>
            </div>

            {/* X Position (Left/Right) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Left/Right (X)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={characterPosition[0]}
                  onChange={(e) => setCharacterPosition([Number(e.target.value), characterPosition[1], characterPosition[2]])}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-12 text-right">{characterPosition[0].toFixed(1)}</span>
              </div>
            </div>

            {/* Z Position (Forward/Back) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Forward/Back (Z)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.2"
                  value={characterPosition[2]}
                  onChange={(e) => setCharacterPosition([characterPosition[0], characterPosition[1], Number(e.target.value)])}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-slate-400 w-12 text-right">{characterPosition[2].toFixed(1)}</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setCharacterPosition([0, 0, 0]);
                setCharacterScale(1);
              }}
              className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Weapon Selector - For KayKit characters (right side) */}
        {character.pack === 'kaykit' && !character.id.includes('skeleton') && (
          <div className="absolute right-4 top-4 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 w-56 max-h-[70vh] overflow-y-auto">
            <div className="text-xs text-slate-300 font-bold uppercase mb-1">Weapon Selection</div>
            
            <button
              onClick={() => setSelectedWeapon(undefined)}
              className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                !selectedWeapon ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              None
            </button>

            <div className="text-xs text-slate-500 uppercase mt-2 mb-1">One-Handed Weapons</div>
            {[
              { path: '/Assets/weapons/sword_1handed.gltf', name: 'Sword (1H)' },
              { path: '/Assets/weapons/dagger.gltf', name: 'Dagger' },
              { path: '/Assets/weapons/axe_1handed.gltf', name: 'Axe (1H)' },
              { path: '/Assets/weapons/crossbow_1handed.gltf', name: 'Crossbow (1H)' },
              { path: '/Assets/weapons/wand.gltf', name: 'Wand' },
            ].map((weapon) => (
              <button
                key={weapon.path}
                onClick={() => setSelectedWeapon(weapon.path)}
                className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                  selectedWeapon === weapon.path ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {weapon.name}
              </button>
            ))}

            <div className="text-xs text-slate-500 uppercase mt-2 mb-1">Two-Handed Weapons</div>
            {[
              { path: '/Assets/weapons/sword_2handed.gltf', name: 'Sword (2H)' },
              { path: '/Assets/weapons/sword_2handed_color.gltf', name: 'Sword (2H Color)' },
              { path: '/Assets/weapons/axe_2handed.gltf', name: 'Axe (2H)' },
              { path: '/Assets/weapons/bow.gltf', name: 'Bow' },
              { path: '/Assets/weapons/bow_withString.gltf', name: 'Bow (String)' },
              { path: '/Assets/weapons/crossbow_2handed.gltf', name: 'Crossbow (2H)' },
              { path: '/Assets/weapons/staff.gltf', name: 'Staff' },
            ].map((weapon) => (
              <button
                key={weapon.path}
                onClick={() => setSelectedWeapon(weapon.path)}
                className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                  selectedWeapon === weapon.path ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {weapon.name}
              </button>
            ))}

            <div className="text-xs text-slate-500 uppercase mt-2 mb-1">Shields (Left Hand)</div>
            <button
              onClick={() => setSelectedShield(undefined)}
              className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                !selectedShield ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              No Shield
            </button>
            {[
              { path: '/Assets/weapons/shield_badge.gltf', name: 'Shield (Badge)' },
              { path: '/Assets/weapons/shield_badge_color.gltf', name: 'Shield (Badge Color)' },
              { path: '/Assets/weapons/shield_round.gltf', name: 'Shield (Round)' },
              { path: '/Assets/weapons/shield_round_color.gltf', name: 'Shield (Round Color)' },
              { path: '/Assets/weapons/shield_spikes.gltf', name: 'Shield (Spikes)' },
              { path: '/Assets/weapons/shield_spikes_color.gltf', name: 'Shield (Spikes Color)' },
              { path: '/Assets/weapons/shield_square.gltf', name: 'Shield (Square)' },
              { path: '/Assets/weapons/shield_square_color.gltf', name: 'Shield (Square Color)' },
            ].map((shield) => (
              <button
                key={shield.path}
                onClick={() => setSelectedShield(shield.path)}
                className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                  selectedShield === shield.path ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {shield.name}
              </button>
            ))}

            <div className="text-xs text-slate-500 uppercase mt-2 mb-1">Magic Items</div>
            {[
              { path: '/Assets/weapons/spellbook_closed.gltf', name: 'Spellbook (Closed)' },
              { path: '/Assets/weapons/spellbook_open.gltf', name: 'Spellbook (Open)' },
            ].map((weapon) => (
              <button
                key={weapon.path}
                onClick={() => setSelectedWeapon(weapon.path)}
                className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                  selectedWeapon === weapon.path ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {weapon.name}
              </button>
            ))}
          </div>
        )}

        {/* Weapon Selector - For Skeleton characters (right side) */}
        {character.pack === 'kaykit' && character.id.includes('skeleton') && (
          <div className="absolute right-4 top-4 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 w-56 max-h-[70vh] overflow-y-auto">
            <div className="text-xs text-slate-300 font-bold uppercase mb-1">Skeleton Weapons</div>
            
            <button
              onClick={() => setSelectedWeapon(undefined)}
              className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                !selectedWeapon ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              None
            </button>

            <div className="text-xs text-slate-500 uppercase mt-2 mb-1">Undead Arsenal</div>
            {[
              { path: '/Assets/weapons/sword_1handed.gltf', name: 'Rusty Sword' },
              { path: '/Assets/weapons/sword_2handed.gltf', name: 'Old Greatsword' },
              { path: '/Assets/weapons/axe_1handed.gltf', name: 'Worn Axe' },
              { path: '/Assets/weapons/axe_2handed.gltf', name: 'Battle Axe' },
              { path: '/Assets/weapons/dagger.gltf', name: 'Bone Dagger' },
              { path: '/Assets/weapons/bow.gltf', name: 'Ancient Bow' },
              { path: '/Assets/weapons/crossbow_1handed.gltf', name: 'Crossbow' },
              { path: '/Assets/weapons/shield_round.gltf', name: 'Cracked Shield' },
              { path: '/Assets/weapons/shield_spikes.gltf', name: 'Spiked Shield' },
              { path: '/Assets/weapons/staff.gltf', name: 'Cursed Staff' },
            ].map((weapon) => (
              <button
                key={weapon.path}
                onClick={() => setSelectedWeapon(weapon.path)}
                className={`px-3 py-2 text-left text-sm rounded transition-colors ${
                  selectedWeapon === weapon.path ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {weapon.name}
              </button>
            ))}
          </div>
        )}

        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white font-bold text-lg animate-pulse">Loading {character.name}...</div>
          </div>
        )}
      </div>

      {/* Animation Sidebar - Left side with scrollable list */}
      {isLoaded && availableAnimations.length > 1 && (
        <div className="absolute left-0 top-0 bottom-0 w-56 bg-slate-900/95 backdrop-blur border-r border-slate-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-700 sticky top-0 bg-slate-900/95">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{availableAnimations.length} Animations</p>
            <p className="text-xs text-slate-500 mt-1">{character.name}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {availableAnimations.map((anim) => (
                <button
                  key={anim}
                  onClick={() => {
                    setCurrentAnimation(anim);
                    console.log(`Playing animation: ${anim}`);
                  }}
                  title={anim}
                  className={`w-full text-left px-3 py-2 text-xs rounded transition-colors truncate ${
                    currentAnimation === anim
                      ? 'bg-primary text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-slate-700 text-xs text-slate-500 bg-slate-900/95">
            {character.pack === 'quaternius' ? (
              <p>Static model - no animations</p>
            ) : (
              <p>Click to preview</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const [selectedPack, setSelectedPack] = useState<AssetPack>(ASSET_PACKS[0]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(ASSET_PACKS[0].characters[0]);

  const handlePackChange = (pack: AssetPack) => {
    setSelectedPack(pack);
    if (pack.characters.length > 0) {
      setSelectedCharacter(pack.characters[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold font-serif mb-2">
              Welcome back, {user?.displayName || 'Builder'}!
            </h1>
            <p className="text-slate-400">Choose a character to preview</p>
          </div>
          <CustomButton
            onClick={() => window.location.href = '/test-world'}
            variant="primary"
          >
            🌍 Test World
          </CustomButton>
        </motion.div>

        {/* Asset Pack Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-300">Choose Asset Pack</h3>
          <div className="flex flex-wrap gap-4">
            {ASSET_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handlePackChange(pack)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all min-w-32 ${
                  selectedPack.id === pack.id
                    ? 'bg-primary text-white shadow-lg border-2 border-primary'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-2 border-slate-700'
                }`}
              >
                <div className="text-sm font-bold">{pack.name}</div>
                <div className="text-xs opacity-75 mt-1">{pack.characters.length} chars</div>
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-2">{selectedPack.description}</p>
        </div>

        {/* Character Selection Buttons */}
        {selectedPack.characters.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-slate-300">Choose Character</h3>
            <div className="flex flex-wrap gap-3">
              {selectedPack.characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedCharacter.id === char.id
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  {char.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Preview Area */}
        {selectedPack.characters.length > 0 ? (
          <motion.div
            key={selectedCharacter.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
          >
            <div className="aspect-video">
              <CharacterPreview character={selectedCharacter} />
            </div>

            {/* Character Info Bar */}
            <div className="p-6 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCharacter.name}</h2>
                  <p className="text-slate-400 text-sm">Click animations on the left to preview</p>
                  <p className="text-slate-500 text-xs mt-1">Asset Pack: {selectedPack.name}</p>
                </div>
                {selectedCharacter.weapon && (
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Weapon:</p>
                    <p className="font-semibold">{selectedCharacter.weapon.split('/').pop()?.replace('.gltf', '')}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
            <div className="text-slate-400 text-lg mb-2">Coming Soon</div>
            <p className="text-slate-500">{selectedPack.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
