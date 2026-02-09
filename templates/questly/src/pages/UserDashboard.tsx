import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { Text, Text3D } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { User, ChevronDown, ChevronRight, RotateCcw, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import CustomButton from '@/components/CustomButton';
import AnimatedCharacter from '@/r3f/AnimatedCharacter';
import AvatarController2D from '@/components/AvatarController2D';
import SpeechBubbleController from '@/components/SpeechBubbleController';
import ColorPickerWheel from '@/components/ColorPickerWheel';
import ColorPaletteBoard from '@/components/ColorPaletteBoard';
import { useCustomizableCharacter } from '@/hooks/useCustomizableCharacter';
import { CharacterPresets } from '@/modules/character-customizer/CharacterPresets';
import { RGB } from '@/modules/character-customizer/types';
import { DEFAULT_AVATAR_LAYERS } from '@/lib/avatarDefaults';
import { getWeaponConfig, getShieldConfig } from '@/data/weapon-configs';
import { animationManager } from '@/systems/animation/AnimationManager';
import { Font3DText } from '../r3f/Font3DText';
import { globalAudioManager } from '@/systems/audio';
import * as THREE from 'three';

// Helper to resolve asset paths with base URL for GitHub Pages
const BASE_URL = import.meta.env.BASE_URL || '/';
const resolvePath = (path: string) => {
  if (!path) return path;
  // Remove leading slash and prepend base URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}${cleanPath}`;
};

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
  subGroups?: {
    [key: string]: Character[];
  };
}

interface SavedVariantSummary {
  id: string;
  name: string;
  baseModel: string;
}

const ASSET_PACKS: AssetPack[] = [
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your custom assets, including ornate wooden sign and druid.',
    characters: [
      {
        id: 'ornate_wooden_sign',
        name: 'Ornate Wooden Sign',
        modelPath: '/Assets/button/ornate+wooden+sign+3d+model.glb',
        assetId: 'ornate_wooden_sign',
        pack: 'custom',
        defaultRotation: [0, Math.PI / 2, 0], // 90 degrees right
      },
      {
        id: 'druid',
        name: 'Druid',
        modelPath: '/Assets/button/druid+clean.glb',
        assetId: 'druid',
        pack: 'custom',
      },
      {
        id: 'fonts_demo',
        name: 'Fonts',
        modelPath: '', // No model, will render 3D text demo
        assetId: 'fonts_demo',
        pack: 'custom',
      },
    ],
  },
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
      { id: 'sage_static', name: 'Sage (Animation Model)', modelPath: '/models/sage_idle.glb', assetId: 'sage_idle', pack: 'self_contained' },
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
  {
    id: 'ultimate_monsters',
    name: 'Ultimate Monsters',
    description: '50+ animated monster models with built-in animations',
    characters: [], // Empty - will use subGroups instead
    subGroups: {
      'Big': [
        { id: 'monster_alien', name: 'Alien', modelPath: '/Assets/Ultimate_Monsters/Alien.gltf', assetId: 'monster_alien', pack: 'ultimate_monsters' },
        { id: 'monster_birb', name: 'Birb', modelPath: '/Assets/Ultimate_Monsters/Birb.gltf', assetId: 'monster_birb', pack: 'ultimate_monsters' },
        { id: 'monster_bluedemon', name: 'Blue Demon', modelPath: '/Assets/Ultimate_Monsters/BlueDemon.gltf', assetId: 'monster_bluedemon', pack: 'ultimate_monsters' },
        { id: 'monster_bunny', name: 'Bunny', modelPath: '/Assets/Ultimate_Monsters/Bunny.gltf', assetId: 'monster_bunny', pack: 'ultimate_monsters' },
        { id: 'monster_cactoro', name: 'Cactoro', modelPath: '/Assets/Ultimate_Monsters/Cactoro.gltf', assetId: 'monster_cactoro', pack: 'ultimate_monsters' },
        { id: 'monster_demon', name: 'Demon', modelPath: '/Assets/Ultimate_Monsters/Demon.gltf', assetId: 'monster_demon', pack: 'ultimate_monsters' },
        { id: 'monster_dino', name: 'Dino', modelPath: '/Assets/Ultimate_Monsters/Dino.gltf', assetId: 'monster_dino', pack: 'ultimate_monsters' },
        { id: 'monster_fish', name: 'Fish', modelPath: '/Assets/Ultimate_Monsters/Fish.gltf', assetId: 'monster_fish', pack: 'ultimate_monsters' },
        { id: 'monster_frog', name: 'Frog', modelPath: '/Assets/Ultimate_Monsters/Frog.gltf', assetId: 'monster_frog', pack: 'ultimate_monsters' },
        { id: 'monster_monkroose', name: 'Monkroose', modelPath: '/Assets/Ultimate_Monsters/Monkroose.gltf', assetId: 'monster_monkroose', pack: 'ultimate_monsters' },
        { id: 'monster_mushroomking', name: 'Mushroom King', modelPath: '/Assets/Ultimate_Monsters/MushroomKing.gltf', assetId: 'monster_mushroomking', pack: 'ultimate_monsters' },
        { id: 'monster_ninja', name: 'Ninja', modelPath: '/Assets/Ultimate_Monsters/Ninja.gltf', assetId: 'monster_ninja', pack: 'ultimate_monsters' },
        { id: 'monster_orc', name: 'Orc', modelPath: '/Assets/Ultimate_Monsters/Orc.gltf', assetId: 'monster_orc', pack: 'ultimate_monsters' },
        { id: 'monster_orc_skull', name: 'Orc Skull', modelPath: '/Assets/Ultimate_Monsters/Orc_Skull.gltf', assetId: 'monster_orc_skull', pack: 'ultimate_monsters' },
        { id: 'monster_tribal', name: 'Tribal', modelPath: '/Assets/Ultimate_Monsters/Tribal.gltf', assetId: 'monster_tribal', pack: 'ultimate_monsters' },
        { id: 'monster_yeti', name: 'Yeti', modelPath: '/Assets/Ultimate_Monsters/Yeti.gltf', assetId: 'monster_yeti', pack: 'ultimate_monsters' },
      ],
      'Blob': [
        { id: 'monster_greenblob', name: 'Green Blob', modelPath: '/Assets/Ultimate_Monsters/GreenBlob.gltf', assetId: 'monster_greenblob', pack: 'ultimate_monsters' },
        { id: 'monster_greenspikyblob', name: 'Green Spiky Blob', modelPath: '/Assets/Ultimate_Monsters/GreenSpikyBlob.gltf', assetId: 'monster_greenspikyblob', pack: 'ultimate_monsters' },
        { id: 'monster_pinkblob', name: 'Pink Blob', modelPath: '/Assets/Ultimate_Monsters/PinkBlob.gltf', assetId: 'monster_pinkblob', pack: 'ultimate_monsters' },
        { id: 'monster_mushnub', name: 'Mushnub', modelPath: '/Assets/Ultimate_Monsters/Mushnub.gltf', assetId: 'monster_mushnub', pack: 'ultimate_monsters' },
        { id: 'monster_mushnub_evolved', name: 'Mushnub Evolved', modelPath: '/Assets/Ultimate_Monsters/Mushnub_Evolved.gltf', assetId: 'monster_mushnub_evolved', pack: 'ultimate_monsters' },
        { id: 'monster_cat', name: 'Cat', modelPath: '/Assets/Ultimate_Monsters/Cat.gltf', assetId: 'monster_cat', pack: 'ultimate_monsters' },
        { id: 'monster_chicken', name: 'Chicken', modelPath: '/Assets/Ultimate_Monsters/Chicken.gltf', assetId: 'monster_chicken', pack: 'ultimate_monsters' },
        { id: 'monster_dog', name: 'Dog', modelPath: '/Assets/Ultimate_Monsters/Dog.gltf', assetId: 'monster_dog', pack: 'ultimate_monsters' },
        { id: 'monster_wizard', name: 'Wizard', modelPath: '/Assets/Ultimate_Monsters/Wizard.gltf', assetId: 'monster_wizard', pack: 'ultimate_monsters' },
      ],
      'Flying': [
        { id: 'monster_alpaking', name: 'Alpaking', modelPath: '/Assets/Ultimate_Monsters/Alpaking.gltf', assetId: 'monster_alpaking', pack: 'ultimate_monsters' },
        { id: 'monster_alpaking_evolved', name: 'Alpaking Evolved', modelPath: '/Assets/Ultimate_Monsters/Alpaking_Evolved.gltf', assetId: 'monster_alpaking_evolved', pack: 'ultimate_monsters' },
        { id: 'monster_armabee', name: 'Armabee', modelPath: '/Assets/Ultimate_Monsters/Armabee.gltf', assetId: 'monster_armabee', pack: 'ultimate_monsters' },
        { id: 'monster_armabee_evolved', name: 'Armabee Evolved', modelPath: '/Assets/Ultimate_Monsters/Armabee_Evolved.gltf', assetId: 'monster_armabee_evolved', pack: 'ultimate_monsters' },
        { id: 'monster_dragon', name: 'Dragon', modelPath: '/Assets/Ultimate_Monsters/Dragon.gltf', assetId: 'monster_dragon', pack: 'ultimate_monsters' },
        { id: 'monster_dragon_evolved', name: 'Dragon Evolved', modelPath: '/Assets/Ultimate_Monsters/Dragon_Evolved.gltf', assetId: 'monster_dragon_evolved', pack: 'ultimate_monsters' },
        { id: 'monster_ghost', name: 'Ghost', modelPath: '/Assets/Ultimate_Monsters/Ghost.gltf', assetId: 'monster_ghost', pack: 'ultimate_monsters' },
        { id: 'monster_ghost_skull', name: 'Ghost Skull', modelPath: '/Assets/Ultimate_Monsters/Ghost_Skull.gltf', assetId: 'monster_ghost_skull', pack: 'ultimate_monsters' },
        { id: 'monster_glub', name: 'Glub', modelPath: '/Assets/Ultimate_Monsters/Glub.gltf', assetId: 'monster_glub', pack: 'ultimate_monsters' },
        { id: 'monster_glub_evolved', name: 'Glub Evolved', modelPath: '/Assets/Ultimate_Monsters/Glub_Evolved.gltf', assetId: 'monster_glub_evolved', pack: 'ultimate_monsters' },
        { id: 'monster_goleling', name: 'Goleling', modelPath: '/Assets/Ultimate_Monsters/Goleling.gltf', assetId: 'monster_goleling', pack: 'ultimate_monsters' },
        { id: 'monster_goleling_evolved', name: 'Goleling Evolved', modelPath: '/Assets/Ultimate_Monsters/Goleling_Evolved.gltf', assetId: 'monster_goleling_evolved', pack: 'ultimate_monsters' },
        { id: 'monster_hywirl', name: 'Hywirl', modelPath: '/Assets/Ultimate_Monsters/Hywirl.gltf', assetId: 'monster_hywirl', pack: 'ultimate_monsters' },
        { id: 'monster_pigeon', name: 'Pigeon', modelPath: '/Assets/Ultimate_Monsters/Pigeon.gltf', assetId: 'monster_pigeon', pack: 'ultimate_monsters' },
        { id: 'monster_squidle', name: 'Squidle', modelPath: '/Assets/Ultimate_Monsters/Squidle.gltf', assetId: 'monster_squidle', pack: 'ultimate_monsters' },
      ],
    },
  },
];

// Collapsible Monster Groups Component
function CollapsibleMonsterGroups({
  subGroups,
  selectedCharacter,
  onSelectCharacter,
}: {
  subGroups: { [key: string]: Character[] };
  selectedCharacter: Character;
  onSelectCharacter: (char: Character) => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(subGroups)));

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-2">
      {Object.entries(subGroups).map(([groupName, characters]) => {
        const isExpanded = expandedGroups.has(groupName);
        return (
          <div key={groupName} className="border border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition-colors"
            >
              <h4 className="text-sm font-semibold text-slate-300 uppercase">
                {groupName} ({characters.length})
              </h4>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {isExpanded && (
              <div className="p-3 flex flex-wrap gap-3 bg-slate-900/50">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    data-help-id={`char-${char.id}`}
                    onClick={() => onSelectCharacter(char)}
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
            )}
          </div>
        );
      })}
    </div>
  );
}

// Character Preview Component
function CharacterPreview({ 
  character,
  signText3DSize,
  signText3DHeight,
  signText3DBevel,
  signText3DBevelThickness,
  signText3DBevelSegments,
  signText3DCurveSegments,
  signTextPosition,
  signTextRotation,
  signText,
}: { 
  character: Character;
  signText3DSize?: number;
  signText3DHeight?: number;
  signText3DBevel?: number;
  signText3DBevelThickness?: number;
  signText3DBevelSegments?: number;
  signText3DCurveSegments?: number;
  signTextPosition?: [number, number, number];
  signTextRotation?: [number, number, number];
  signText?: string;
}) {
  // 3D text controls (for fonts_demo)
  // All adjustable options for Three.js TextGeometry
  const [textDepth, setTextDepth] = useState(0.110); // height (default thickness)
  const [textBevel, setTextBevel] = useState(0.001); // bevelSize (smaller)
  const [textBevelThickness, setTextBevelThickness] = useState(0.003); // bevelThickness (smaller)
  const [textBevelSegments, setTextBevelSegments] = useState(5);
  const [textBevelOffset, setTextBevelOffset] = useState(0);
  const [textCurveSegments, setTextCurveSegments] = useState(12);
  const [textScale, setTextScale] = useState(1.0); // size
  // Font selection for 3D text demo
  const fontOptions = [
    // Only working 3D fonts (.typeface.json) are selectable for 3D text
    { label: 'Helvetiker Regular (3D)', value: '/Assets/three.js/examples/fonts/helvetiker_regular.typeface.json' },
    { label: 'Helvetiker Bold (3D)', value: '/Assets/three.js/examples/fonts/helvetiker_bold.typeface.json' },
    { label: 'Gentilis Regular (3D)', value: '/fonts/gentilis_regular.typeface.json' },
    // Medieval font is TTF only (2D preview/fallback)
    { label: 'Medieval (TTF, 2D only)', value: '/fonts/MedievalSharp-Regular.ttf', isTTF: true, disabled: true },
  ];
  const defaultFont = fontOptions.find((option) => option.label.startsWith('Gentilis'))?.value ?? fontOptions[0].value;
  const [selectedFont, setSelectedFont] = useState(defaultFont);
  // Fallback for font loading errors
  const [fontError, setFontError] = useState(false);
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const characterIdRef = useRef(`dashboard-${character.id}`);
  const [cameraDistance, setCameraDistance] = useState(8);
  const [characterPosition, setCharacterPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [characterScale, setCharacterScale] = useState(1);
  const [selectedWeapon, setSelectedWeapon] = useState<string | undefined>(character.weapon);
  const [selectedShield, setSelectedShield] = useState<string | undefined>(undefined);
  
  // Weapon/shield adjustment sliders
  const [weaponAdjustments, setWeaponAdjustments] = useState({
    scale: 0.5,
    positionX: 0.05,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: Math.PI / 4,
  });
  
  const [shieldAdjustments, setShieldAdjustments] = useState({
    scale: 0.7,
    positionX: -0.05,
    positionY: 0,
    positionZ: 0,
    rotationX: Math.PI,
    rotationY: Math.PI,
    rotationZ: 0,
  });

  // Update characterId ref when character changes
  useEffect(() => {
    characterIdRef.current = `dashboard-${character.id}`;
  }, [character.id]);

  // Fallback: Check animationManager directly if callback doesn't fire
  useEffect(() => {
    const checkAnimations = setInterval(() => {
      const characterId = characterIdRef.current;
      const animations = animationManager.getAnimations(characterId);
      if (animations && Object.keys(animations).length > 0 && availableAnimations.length === 0) {
        const animationNames = Object.keys(animations);
        console.log(`[CharacterPreview] Fallback: Found ${animationNames.length} animations in animationManager:`, animationNames);
        setAvailableAnimations(animationNames);
        setIsLoaded(true);
        if (!currentAnimation && animationNames.length > 0) {
          const defaultAnim = animationNames.find(a => a.toLowerCase().includes('idle')) || animationNames[0];
          setCurrentAnimation(defaultAnim);
        }
      }
    }, 500);

    return () => clearInterval(checkAnimations);
  }, [availableAnimations.length, currentAnimation]);

  // Reset state when character changes
  useEffect(() => {
    console.log(`[CharacterPreview] Character changed to: ${character.name} (${character.id})`);
    setAvailableAnimations([]);
    setCurrentAnimation('');
    setIsLoaded(false);
    // Reset position for new character
    setCharacterPosition([0, 0, 0]);
    setCharacterScale(1);
    setSelectedWeapon(character.weapon);
    setSelectedShield(undefined);
    // Reset adjustments to defaults
    setWeaponAdjustments({
      scale: 0.5,
      positionX: 0.05,
      positionY: 0,
      positionZ: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: Math.PI / 4,
    });
    setShieldAdjustments({
      scale: 0.7,
      positionX: -0.05,
      positionY: 0,
      positionZ: 0,
      rotationX: Math.PI,
      rotationY: Math.PI,
      rotationZ: 0,
    });
  }, [character.id]);
  
  // Load default configs when weapon/shield changes
  useEffect(() => {
    if (selectedWeapon) {
      const config = getWeaponConfig(selectedWeapon);
      setWeaponAdjustments({
        scale: config.scale,
        positionX: config.position[0],
        positionY: config.position[1],
        positionZ: config.position[2],
        rotationX: config.rotation[0],
        rotationY: config.rotation[1],
        rotationZ: config.rotation[2],
      });
    }
  }, [selectedWeapon]);
  
  useEffect(() => {
    if (selectedShield) {
      const config = getShieldConfig(selectedShield);
      setShieldAdjustments({
        scale: config.scale,
        positionX: config.position[0],
        positionY: config.position[1],
        positionZ: config.position[2],
        rotationX: config.rotation[0],
        rotationY: config.rotation[1],
        rotationZ: config.rotation[2],
      });
    }
  }, [selectedShield]);

  const handleAnimationsLoaded = useCallback((animations: string[]) => {
    console.log(`[CharacterPreview] ✓ Loaded ${animations.length} animations for ${character.name}:`, animations);
    console.log(`[CharacterPreview] Animation names:`, animations);
    setAvailableAnimations(animations);
    setIsLoaded(true);
    
    // Set default animation after state is updated
    if (animations.length > 0) {
      // Use a small delay to ensure state is set
      setTimeout(() => {
        if (!currentAnimation) {
          // For Quaternius characters, prefer xbot or soldier animations
          let defaultAnim;
          if (character.pack === 'quaternius') {
            defaultAnim = animations.find(a => a.includes('idle') || a.includes('soldier_idle')) ||
                         animations.find(a => a.includes('walk') || a.includes('soldier_walk')) ||
                         animations.find(a => a.includes('robot_idle')) ||
                         animations[0];
          } else {
            // For other characters (including Sage), use the standard logic
            defaultAnim = animations.find(a => a.toLowerCase().includes('idle')) || animations[0];
          }
          console.log(`[CharacterPreview] Setting default animation for ${character.pack}: ${defaultAnim}`);
          setCurrentAnimation(defaultAnim);
        }
      }, 100);
    }
  }, [character.name, character.pack, currentAnimation]);

  return (
    <div className="w-full h-full relative flex flex-col">

      {/* Canvas - Takes up most of the space */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
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

            {character.id === 'fonts_demo' ? (
                <>
                  {selectedFont.endsWith('.ttf') ? null : (
                    <Suspense fallback={null}>
                      <Font3DText
                        text="Questerly"
                        position={[0, 0.5, 0.5]}
                        rotation={[0, 0, 0]}
                        height={textDepth}
                        curveSegments={textCurveSegments}
                        size={textScale}
                        bevelEnabled={textBevel > 0}
                        bevelThickness={textBevelThickness}
                        bevelSize={textBevel}
                        bevelSegments={textBevelSegments}
                        fontUrl={selectedFont}
                      />
                    </Suspense>
                  )}
                </>
            ) :
              character.id === 'fonts_demo' && selectedFont.endsWith('.ttf') ? (
                <>
                  <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                    background: 'rgba(30,30,30,0.95)',
                    padding: '2rem 3rem',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 32px #0008',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}>
                    <span style={{
                      fontFamily: 'MedievalSharp, serif',
                      fontSize: '3rem',
                      color: '#FFD700',
                      letterSpacing: '0.1em',
                      textShadow: '2px 2px 8px #000a',
                      display: 'block',
                    }}>
                      Questerly
                    </span>
                    <div className="text-xs text-yellow-400 mt-2">
                      (2D preview using MedievalSharp TTF font)
                    </div>
                  </div>
                  <style>{`
                    @font-face {
                      font-family: 'MedievalSharp';
                      src: url('/fonts/MedievalSharp-Regular.ttf') format('truetype');
                      font-weight: normal;
                      font-style: normal;
                    }
                  `}</style>
                </>
              ) : null
            }
            {character.modelPath && character.modelPath.length > 0 && (
              <AnimatedCharacter
                characterPath={resolvePath(character.modelPath)}
                assetId={character.assetId}
                characterId={`dashboard-${character.id}`}
                position={characterPosition}
                scale={character.id === 'soldier' ? characterScale * 0.5 : character.id === 'ornate_wooden_sign' ? 2 : 1}
                rotation={character.id === 'ornate_wooden_sign' && character.defaultRotation ? character.defaultRotation : [0, 0, 0]}
                currentAnimation={currentAnimation}
                weaponPath={selectedWeapon ? resolvePath(selectedWeapon) : undefined}
                shieldPath={selectedShield ? resolvePath(selectedShield) : undefined}
                weaponAdjustments={selectedWeapon ? {
                  scale: weaponAdjustments.scale,
                  position: [weaponAdjustments.positionX, weaponAdjustments.positionY, weaponAdjustments.positionZ],
                  rotation: [weaponAdjustments.rotationX, weaponAdjustments.rotationY, weaponAdjustments.rotationZ],
                } : undefined}
                shieldAdjustments={selectedShield ? {
                  scale: shieldAdjustments.scale,
                  position: [shieldAdjustments.positionX, shieldAdjustments.positionY, shieldAdjustments.positionZ],
                  rotation: [shieldAdjustments.rotationX, shieldAdjustments.rotationY, shieldAdjustments.rotationZ],
                } : undefined}
                onAnimationsLoaded={handleAnimationsLoaded}
              />
            )}
            {/* Render 3D text overlay on wooden sign for sizing/placement confirmation */}
            {character.id === 'ornate_wooden_sign' && (
              <Suspense fallback={null}>
                <Font3DText
                  text={signText || 'SIGN'}
                  position={signTextPosition || [0, 0.5, 0.01]}
                  color="#FFD700"
                  size={signText3DSize || 0.8}
                  height={signText3DHeight || 0.08}
                  bevelEnabled={true}
                  bevelSize={signText3DBevel || 0.008}
                  bevelThickness={signText3DBevelThickness || 0.015}
                  bevelSegments={signText3DBevelSegments || 3}
                  curveSegments={signText3DCurveSegments || 12}
                  fontUrl="/Assets/three.js/examples/fonts/helvetiker_regular.typeface.json"
                  rotation={signTextRotation || [0, 0, 0]}
                />
              </Suspense>
            )}

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

        {/* 3D Text Controls (only for Fonts demo) - OUTSIDE Canvas */}
        {character.id === 'fonts_demo' && (
          <div className="absolute right-4 top-4 flex flex-col gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 w-80 max-h-[80vh] overflow-y-auto z-10">
            <div className="text-xs text-slate-300 font-bold uppercase mb-2">3D Text Controls</div>
            <label className="text-xs text-slate-400">Font:</label>
            <select
              className="w-full mb-2 bg-slate-800 text-slate-200 rounded px-2 py-1"
              value={selectedFont}
              onChange={e => setSelectedFont(e.target.value)}
            >
              {fontOptions.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
              ))}
            </select>
            {selectedFont.endsWith('.ttf') && (
              <div className="text-xs text-yellow-400 mb-2">
                <b>Medieval font is not available in 3D</b> (Three.js TextGeometry requires .typeface.json).<br />
                Only Helvetiker Regular/Bold are available for 3D text. Use the sign for 2D medieval font preview.
              </div>
            )}
            <label className="text-xs text-slate-400">Thickness (Height): {textDepth.toFixed(3)}</label>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={textDepth}
              onChange={e => setTextDepth(Number(e.target.value))}
              className="w-full mb-2"
            />
            <label className="text-xs text-slate-400">Bevel Size: {textBevel.toFixed(3)}</label>
            <input
              type="range"
              min="0"
              max="0.01"
              step="0.001"
              value={textBevel}
              onChange={e => setTextBevel(Number(e.target.value))}
              className="w-full mb-2"
            />
            <label className="text-xs text-slate-400">Bevel Thickness: {textBevelThickness.toFixed(3)}</label>
            <input
              type="range"
              min="0.001"
              max="0.03"
              step="0.001"
              value={textBevelThickness}
              onChange={e => setTextBevelThickness(Number(e.target.value))}
              className="w-full mb-2"
            />
            <label className="text-xs text-slate-400">Bevel Segments: {textBevelSegments}</label>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={textBevelSegments}
              onChange={e => setTextBevelSegments(Number(e.target.value))}
              className="w-full mb-2"
            />
            <label className="text-xs text-slate-400">Bevel Offset: {textBevelOffset.toFixed(3)}</label>
            <input
              type="range"
              min="-0.05"
              max="0.05"
              step="0.001"
              value={textBevelOffset}
              onChange={e => setTextBevelOffset(Number(e.target.value))}
              className="w-full mb-2"
            />
            <label className="text-xs text-slate-400">Curve Segments: {textCurveSegments}</label>
            <input
              type="range"
              min="1"
              max="24"
              step="1"
              value={textCurveSegments}
              onChange={e => setTextCurveSegments(Number(e.target.value))}
              className="w-full mb-2"
            />
            <label className="text-xs text-slate-400">Scale (Size): {textScale.toFixed(2)}</label>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={textScale}
              onChange={e => setTextScale(Number(e.target.value))}
              className="w-full mb-2"
            />
          </div>
        )}

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
            className="w-32 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
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

        {/* Weapon Selector - For Additional Models (Sage) */}
        {character.pack === 'self_contained' && character.id === 'sage_static' && (
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

        {/* Only show loading overlay for non-fonts models */}
        {!isLoaded && character.id !== 'fonts_demo' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="text-white font-bold text-lg animate-pulse">Loading {character.name}...</div>
          </div>
        )}
      </div>

      {/* Animation Sidebar - Left side with scrollable list */}
      {isLoaded && availableAnimations.length > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-56 bg-slate-900/95 backdrop-blur border-r border-slate-700 flex flex-col overflow-hidden z-40">
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

      {/* Weapon/Shield Adjustment Sliders - Below canvas - Only for Sage */}
      {character.pack === 'self_contained' && character.id === 'sage_static' && (selectedWeapon || selectedShield) && (
        <div className="mt-4 relative z-30" style={{ marginLeft: isLoaded && availableAnimations.length > 0 ? '224px' : '0', paddingRight: isLoaded && availableAnimations.length > 0 ? '0' : '0' }}>
          <WeaponShieldAdjustments
          selectedWeapon={selectedWeapon}
          selectedShield={selectedShield}
          weaponAdjustments={weaponAdjustments}
          setWeaponAdjustments={setWeaponAdjustments}
          shieldAdjustments={shieldAdjustments}
          setShieldAdjustments={setShieldAdjustments}
          onSaveDefaults={(weapon, shield, weaponAdj, shieldAdj) => {
            if (weapon && weaponAdj) {
              localStorage.setItem(`weapon_config_${weapon}`, JSON.stringify(weaponAdj));
              console.log(`Saved weapon config for ${weapon}:`, weaponAdj);
            }
            if (shield && shieldAdj) {
              localStorage.setItem(`shield_config_${shield}`, JSON.stringify(shieldAdj));
              console.log(`Saved shield config for ${shield}:`, shieldAdj);
            }
            alert('Settings saved as default! They will be used next time you select this weapon/shield.');
          }}
          />
        </div>
      )}
    </div>
  );
}

// Weapon/Shield Adjustment Sliders Component - Separate from canvas
function WeaponShieldAdjustments({
  selectedWeapon,
  selectedShield,
  weaponAdjustments,
  setWeaponAdjustments,
  shieldAdjustments,
  setShieldAdjustments,
  onSaveDefaults,
}: {
  selectedWeapon?: string;
  selectedShield?: string;
  weaponAdjustments: {
    scale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  };
  setWeaponAdjustments: React.Dispatch<React.SetStateAction<{
    scale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  }>>;
  shieldAdjustments: {
    scale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  };
  setShieldAdjustments: React.Dispatch<React.SetStateAction<{
    scale: number;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  }>>;
  onSaveDefaults?: (weapon?: string, shield?: string, weaponAdj?: any, shieldAdj?: any) => void;
}) {
  if (!selectedWeapon && !selectedShield) return null;
  
  const handleSaveDefaults = () => {
    if (onSaveDefaults) {
      const weaponAdj = selectedWeapon ? {
        scale: weaponAdjustments.scale,
        position: [weaponAdjustments.positionX, weaponAdjustments.positionY, weaponAdjustments.positionZ] as [number, number, number],
        rotation: [weaponAdjustments.rotationX, weaponAdjustments.rotationY, weaponAdjustments.rotationZ] as [number, number, number],
      } : undefined;
      
      const shieldAdj = selectedShield ? {
        scale: shieldAdjustments.scale,
        position: [shieldAdjustments.positionX, shieldAdjustments.positionY, shieldAdjustments.positionZ] as [number, number, number],
        rotation: [shieldAdjustments.rotationX, shieldAdjustments.rotationY, shieldAdjustments.rotationZ] as [number, number, number],
      } : undefined;
      
      onSaveDefaults(selectedWeapon, selectedShield, weaponAdj, shieldAdj);
    }
  };
  
  return (
    <div className="bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4 max-h-[40vh] overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase">Weapon/Shield Adjustments</h3>
          <button
            onClick={handleSaveDefaults}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
          >
            Save as Default
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWeapon && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase">Weapon</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-400">Scale: {weaponAdjustments.scale.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={weaponAdjustments.scale}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, scale: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Position X: {weaponAdjustments.positionX.toFixed(3)}</label>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.001"
                        value={weaponAdjustments.positionX}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, positionX: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Position Y: {weaponAdjustments.positionY.toFixed(3)}</label>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.001"
                        value={weaponAdjustments.positionY}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, positionY: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Position Z: {weaponAdjustments.positionZ.toFixed(3)}</label>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.001"
                        value={weaponAdjustments.positionZ}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, positionZ: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rotation X: {(weaponAdjustments.rotationX * 180 / Math.PI).toFixed(1)}°</label>
                      <input
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step="0.01"
                        value={weaponAdjustments.rotationX}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, rotationX: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rotation Y: {(weaponAdjustments.rotationY * 180 / Math.PI).toFixed(1)}°</label>
                      <input
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step="0.01"
                        value={weaponAdjustments.rotationY}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, rotationY: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rotation Z: {(weaponAdjustments.rotationZ * 180 / Math.PI).toFixed(1)}°</label>
                      <input
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step="0.01"
                        value={weaponAdjustments.rotationZ}
                        onChange={(e) => setWeaponAdjustments(prev => ({ ...prev, rotationZ: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {selectedShield && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <h4 className="text-xs font-semibold text-green-400 mb-2 uppercase">Shield</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-400">Scale: {shieldAdjustments.scale.toFixed(2)}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={shieldAdjustments.scale}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, scale: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Position X: {shieldAdjustments.positionX.toFixed(3)}</label>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.001"
                        value={shieldAdjustments.positionX}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, positionX: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Position Y: {shieldAdjustments.positionY.toFixed(3)}</label>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.001"
                        value={shieldAdjustments.positionY}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, positionY: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Position Z: {shieldAdjustments.positionZ.toFixed(3)}</label>
                      <input
                        type="range"
                        min="-0.5"
                        max="0.5"
                        step="0.001"
                        value={shieldAdjustments.positionZ}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, positionZ: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rotation X: {(shieldAdjustments.rotationX * 180 / Math.PI).toFixed(1)}°</label>
                      <input
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step="0.01"
                        value={shieldAdjustments.rotationX}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, rotationX: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rotation Y: {(shieldAdjustments.rotationY * 180 / Math.PI).toFixed(1)}°</label>
                      <input
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step="0.01"
                        value={shieldAdjustments.rotationY}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, rotationY: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Rotation Z: {(shieldAdjustments.rotationZ * 180 / Math.PI).toFixed(1)}°</label>
                      <input
                        type="range"
                        min={-Math.PI}
                        max={Math.PI}
                        step="0.01"
                        value={shieldAdjustments.rotationZ}
                        onChange={(e) => setShieldAdjustments(prev => ({ ...prev, rotationZ: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [selectedPack, setSelectedPack] = useState<AssetPack>(ASSET_PACKS[0]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(ASSET_PACKS[0].characters[0]);
  const [customizerVariantName, setCustomizerVariantName] = useState('');
  const [customizerShowWheel, setCustomizerShowWheel] = useState(false);
  const [customizerIsSaving, setCustomizerIsSaving] = useState(false);
  const [customizerMessage, setCustomizerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customizerSavedVariants, setCustomizerSavedVariants] = useState<SavedVariantSummary[]>([]);
  const [customizerLoadingVariants, setCustomizerLoadingVariants] = useState(false);

  // Play background music (track 2.5) for user dashboard
  useEffect(() => {
    globalAudioManager.init().then(() => {
      globalAudioManager.playMusic('track_2_5');
    });
  }, []);
  const [avatarMode, setAvatarMode] = useState<'idle' | 'talk'>('idle');
  const [avatarSpeech, setAvatarSpeech] = useState<{ id: number; text: string } | null>(null);
  const avatarTalkTimeoutRef = useRef<number | null>(null);
  const [avatarTweaks, setAvatarTweaks] = useState({ ...DEFAULT_AVATAR_LAYERS });
  const [expressionIntensity, setExpressionIntensity] = useState(1);
  const [explodeMode, setExplodeMode] = useState(false);
  const [explodeDistance, setExplodeDistance] = useState(90);
  const [forceMouthOpen, setForceMouthOpen] = useState(false);
  const [forceBlinkVisible, setForceBlinkVisible] = useState(false);
  const [hideEyesOnSelect, setHideEyesOnSelect] = useState(true);
  const [avatarZoom, setAvatarZoom] = useState(520);
  const [bubbleTweaks, setBubbleTweaks] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedAvatarPart, setSelectedAvatarPart] = useState<
    | 'head'
    | 'face'
    | 'mouth'
    | 'blink'
    | 'leftEye'
    | 'rightEye'
    | 'leftPupil'
    | 'rightPupil'
    | 'leftBrow'
    | 'rightBrow'
    | 'bubble'
    | null
  >(null);
  const dragStateRef = useRef<{
    part:
      | 'head'
      | 'face'
      | 'mouth'
      | 'blink'
      | 'leftEye'
      | 'rightEye'
      | 'leftPupil'
      | 'rightPupil'
      | 'leftBrow'
      | 'rightBrow'
      | 'bubble'
      | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  
  // Sign 3D text parameters
  const [signText, setSignText] = useState('Questerly');
  const [signText3DSize, setSignText3DSize] = useState(0.80);
  const [signText3DHeight, setSignText3DHeight] = useState(0.420);
  const [signText3DBevel, setSignText3DBevel] = useState(0.024);
  const [signText3DBevelThickness, setSignText3DBevelThickness] = useState(0.050);
  const [signText3DBevelSegments, setSignText3DBevelSegments] = useState(3);
  const [signText3DCurveSegments, setSignText3DCurveSegments] = useState(3);
  const [signTextPosition, setSignTextPosition] = useState<[number, number, number]>([0, 1.90, 0.20]);
  const [signTextRotation, setSignTextRotation] = useState<[number, number, number]>([0, 0, 0]);

  const isKaykitCustomizer =
    selectedPack.id === 'kaykit' &&
    ['rogue', 'knight', 'ranger', 'mage', 'barbarian'].includes(selectedCharacter.id);

  const {
    model: customizerModel,
    colorPalette: customizerPalette,
    selectedColorIndex: customizerSelectedColorIndex,
    selectColor: selectCustomizerColor,
    replaceColor: replaceCustomizerColor,
    undoLastChange: undoCustomizerChange,
    saveVariant: saveCustomizerVariant,
    loadVariant: loadCustomizerVariant,
    isLoading: isCustomizerLoading,
    error: customizerError,
  } = useCustomizableCharacter({
    characterPath: isKaykitCustomizer ? selectedCharacter.modelPath : '',
  });

  const triggerAvatarSpeech = useCallback((text: string) => {
    setAvatarSpeech({ id: Date.now(), text });
    setAvatarMode('talk');

    if (avatarTalkTimeoutRef.current) {
      window.clearTimeout(avatarTalkTimeoutRef.current);
    }

    avatarTalkTimeoutRef.current = window.setTimeout(() => {
      setAvatarMode('idle');
    }, 2400);
  }, []);

  useEffect(() => {
    return () => {
      if (avatarTalkTimeoutRef.current) {
        window.clearTimeout(avatarTalkTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current) return;
      const { part, startX, startY, initialX, initialY } = dragStateRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      if (part === 'bubble') {
        setBubbleTweaks((prev) => ({ ...prev, x: initialX + dx, y: initialY + dy }));
        return;
      }

      if (part) {
        setAvatarTweaks((prev) => ({
          ...prev,
          [part]: { ...prev[part], x: initialX + dx, y: initialY + dy },
        }));
      }
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const avatarPartList = [
    { key: 'head', label: 'Head' },
    { key: 'face', label: 'Face' },
    { key: 'mouth', label: 'Mouth' },
    { key: 'blink', label: 'Blink' },
    { key: 'leftEye', label: 'Left Eye' },
    { key: 'rightEye', label: 'Right Eye' },
    { key: 'leftPupil', label: 'Left Pupil' },
    { key: 'rightPupil', label: 'Right Pupil' },
    { key: 'leftBrow', label: 'Left Brow' },
    { key: 'rightBrow', label: 'Right Brow' },
  ] as const;

  const getScaleMin = (part: (typeof avatarPartList)[number]['key']) => {
    if (part === 'mouth' || part === 'blink' || part === 'leftPupil' || part === 'rightPupil') {
      return 0.2;
    }
    return 0.4;
  };

  const handlePackChange = (pack: AssetPack) => {
    setSelectedPack(pack);
    // Get all characters (from characters array or subGroups)
    const allCharacters = pack.subGroups 
      ? Object.values(pack.subGroups).flat()
      : pack.characters;
    if (allCharacters.length > 0) {
      setSelectedCharacter(allCharacters[0]);
    }
  };

  const showCustomizerMessage = (type: 'success' | 'error', text: string) => {
    setCustomizerMessage({ type, text });
    window.setTimeout(() => setCustomizerMessage(null), 4000);
  };

  const loadCustomizerVariants = useCallback(async () => {
    if (!isKaykitCustomizer) {
      setCustomizerSavedVariants([]);
      return;
    }

    try {
      setCustomizerLoadingVariants(true);
      const variants = await CharacterPresets.getVariantsByModel(selectedCharacter.id);
      setCustomizerSavedVariants(
        variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          baseModel: variant.baseModel,
        }))
      );
    } catch (error) {
      console.error('[Dashboard Customizer] Failed to load variants:', error);
      showCustomizerMessage('error', 'Failed to load saved variants');
    } finally {
      setCustomizerLoadingVariants(false);
    }
  }, [isKaykitCustomizer, selectedCharacter.id]);

  useEffect(() => {
    loadCustomizerVariants();
    setCustomizerVariantName('');
    setCustomizerShowWheel(false);
  }, [loadCustomizerVariants, selectedCharacter.id]);

  const handleCustomizerColorChange = async (newColor: RGB) => {
    if (customizerSelectedColorIndex === null || !customizerPalette[customizerSelectedColorIndex]) return;

    const selectedColor = customizerPalette[customizerSelectedColorIndex];
    try {
      await replaceCustomizerColor(selectedColor.rgb, newColor, 20);
    } catch (error) {
      console.error('[Dashboard Customizer] Color replacement failed:', error);
      showCustomizerMessage('error', 'Failed to apply color change');
    }
  };

  const handleCustomizerSave = async () => {
    if (!customizerVariantName.trim()) {
      showCustomizerMessage('error', 'Please enter a name for your variant');
      return;
    }

    try {
      setCustomizerIsSaving(true);
      const variantId = await saveCustomizerVariant(customizerVariantName.trim(), [selectedCharacter.id]);
      setCustomizerSavedVariants((prev) => [
        ...prev,
        {
          id: variantId,
          name: customizerVariantName.trim(),
          baseModel: selectedCharacter.id,
        },
      ]);
      setCustomizerVariantName('');
      showCustomizerMessage('success', `Variant "${customizerVariantName}" saved`);
    } catch (error) {
      console.error('[Dashboard Customizer] Save failed:', error);
      showCustomizerMessage('error', 'Failed to save variant');
    } finally {
      setCustomizerIsSaving(false);
    }
  };

  const handleCustomizerLoadVariant = async (variantId: string) => {
    try {
      await loadCustomizerVariant(variantId);
      showCustomizerMessage('success', 'Variant loaded');
    } catch (error) {
      console.error('[Dashboard Customizer] Load failed:', error);
      showCustomizerMessage('error', 'Failed to load variant');
    }
  };

  const handleCustomizerDeleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant permanently?')) return;

    try {
      await CharacterPresets.deleteVariant(variantId);
      setCustomizerSavedVariants((prev) => prev.filter((variant) => variant.id !== variantId));
      showCustomizerMessage('success', 'Variant deleted');
    } catch (error) {
      console.error('[Dashboard Customizer] Delete failed:', error);
      showCustomizerMessage('error', 'Failed to delete variant');
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
          <div className="flex gap-2">
            <CustomButton
              onClick={() => navigate('/test-world')}
              variant="primary"
              data-help-id="terrain-builder"
            >
              🏔️ Terrain Builder
            </CustomButton>
            <CustomButton
              onClick={() => {
                const templates = JSON.parse(localStorage.getItem('questly_templates') || '[]');
                if (templates.length > 0) {
                  navigate('/test-world');
                  setTimeout(() => {
                    const event = new CustomEvent('openTemplateModal');
                    window.dispatchEvent(event);
                  }, 500);
                } else {
                  alert('No templates saved yet. Create a template in the Terrain Builder!');
                }
              }}
              variant="primary"
              data-help-id="templates"
            >
              ⭐ My Templates ({JSON.parse(localStorage.getItem('questly_templates') || '[]').length})
            </CustomButton>
            <CustomButton
              onClick={() => navigate('/builder')}
              variant="primary"
              data-help-id="builder"
            >
              🏰 Builder
            </CustomButton>
            <CustomButton
              onClick={() => navigate('/three-text')}
              variant="primary"
              data-help-id="three-text"
            >
              🔤 Three-text
            </CustomButton>
            <CustomButton
              onClick={() => navigate('/character-customizer')}
              variant="primary"
              data-help-id="character-customizer"
            >
              🎨 Customizer
            </CustomButton>
          </div>
        </motion.div>

        {/* Asset Pack Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-slate-300">Choose Asset Pack</h3>
          <div className="flex flex-wrap gap-4">
            {ASSET_PACKS.map((pack) => (
              <button
                key={pack.id}
                data-help-id={`pack-${pack.id}`}
                onClick={() => handlePackChange(pack)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all min-w-32 ${
                  selectedPack.id === pack.id
                    ? 'bg-primary text-white shadow-lg border-2 border-primary'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-2 border-slate-700'
                }`}
              >
                <div className="text-sm font-bold">{pack.name}</div>
                <div className="text-xs opacity-75 mt-1">
                  {pack.subGroups 
                    ? Object.values(pack.subGroups).flat().length 
                    : pack.characters.length} chars
                </div>
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-2">{selectedPack.description}</p>
        </div>

        {/* Character Selection Buttons */}
        {(() => {
          const allCharacters = selectedPack.subGroups 
            ? Object.values(selectedPack.subGroups).flat()
            : selectedPack.characters;
          
          if (allCharacters.length === 0) return null;
          
          return (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-slate-300">Choose Character</h3>
              {selectedPack.subGroups ? (
                // Render with collapsible sub-groups
                <CollapsibleMonsterGroups
                  subGroups={selectedPack.subGroups}
                  selectedCharacter={selectedCharacter}
                  onSelectCharacter={setSelectedCharacter}
                />
              ) : (
                // Render flat list
                <div className="flex flex-wrap gap-3">
                  {allCharacters.map((char) => (
                    <button
                      key={char.id}
                      data-help-id={`char-${char.id}`}
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
              )}
            </div>
          );
        })()}

        {/* Sign 3D Text Controls - Only for ornate_wooden_sign */}
        {selectedCharacter.id === 'ornate_wooden_sign' && (
          <div className="mb-8 bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Sign 3D Text Settings</h3>
            
            {/* Text Input */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Sign Text</label>
              <input
                type="text"
                placeholder="Enter text for the sign"
                value={signText}
                onChange={(e) => setSignText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 3D Text Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Size */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Size: {signText3DSize.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={signText3DSize}
                  onChange={(e) => setSignText3DSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Height (Depth) */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Height (Depth): {signText3DHeight.toFixed(3)}</label>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={signText3DHeight}
                  onChange={(e) => setSignText3DHeight(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Bevel Size */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Bevel Size: {signText3DBevel.toFixed(3)}</label>
                <input
                  type="range"
                  min="0"
                  max="0.05"
                  step="0.001"
                  value={signText3DBevel}
                  onChange={(e) => setSignText3DBevel(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Bevel Thickness */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Bevel Thickness: {signText3DBevelThickness.toFixed(3)}</label>
                <input
                  type="range"
                  min="0.001"
                  max="0.05"
                  step="0.001"
                  value={signText3DBevelThickness}
                  onChange={(e) => setSignText3DBevelThickness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Bevel Segments */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Bevel Segments: {signText3DBevelSegments}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={signText3DBevelSegments}
                  onChange={(e) => setSignText3DBevelSegments(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Curve Segments */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Curve Segments: {signText3DCurveSegments}</label>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="1"
                  value={signText3DCurveSegments}
                  onChange={(e) => setSignText3DCurveSegments(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Position X */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Position X: {signTextPosition[0].toFixed(2)}</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={signTextPosition[0]}
                  onChange={(e) => setSignTextPosition([Number(e.target.value), signTextPosition[1], signTextPosition[2]])}
                  className="w-full"
                />
              </div>

              {/* Position Y */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Position Y: {signTextPosition[1].toFixed(2)}</label>
                <input
                  type="range"
                  min="-1"
                  max="2"
                  step="0.01"
                  value={signTextPosition[1]}
                  onChange={(e) => setSignTextPosition([signTextPosition[0], Number(e.target.value), signTextPosition[2]])}
                  className="w-full"
                />
              </div>

              {/* Position Z */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Position Z: {signTextPosition[2].toFixed(2)}</label>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.01"
                  value={signTextPosition[2]}
                  onChange={(e) => setSignTextPosition([signTextPosition[0], signTextPosition[1], Number(e.target.value)])}
                  className="w-full"
                />
              </div>

              {/* Rotation X */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Rotation X: {(signTextRotation[0] * 180 / Math.PI).toFixed(1)}°</label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.01"
                  value={signTextRotation[0]}
                  onChange={(e) => setSignTextRotation([Number(e.target.value), signTextRotation[1], signTextRotation[2]])}
                  className="w-full"
                />
              </div>

              {/* Rotation Y */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Rotation Y: {(signTextRotation[1] * 180 / Math.PI).toFixed(1)}°</label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.01"
                  value={signTextRotation[1]}
                  onChange={(e) => setSignTextRotation([signTextRotation[0], Number(e.target.value), signTextRotation[2]])}
                  className="w-full"
                />
              </div>

              {/* Rotation Z */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Rotation Z: {(signTextRotation[2] * 180 / Math.PI).toFixed(1)}°</label>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step="0.01"
                  value={signTextRotation[2]}
                  onChange={(e) => setSignTextRotation([signTextRotation[0], signTextRotation[1], Number(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Preview Area */}
        {(() => {
          const allCharacters = selectedPack.subGroups 
            ? Object.values(selectedPack.subGroups).flat()
            : selectedPack.characters;
          return allCharacters.length > 0;
        })() ? (
          <motion.div
            key={selectedCharacter.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
          >
            <div className="aspect-video">
              <CharacterPreview 
                character={selectedCharacter}
                signText={signText}
                signText3DSize={signText3DSize}
                signText3DHeight={signText3DHeight}
                signText3DBevel={signText3DBevel}
                signText3DBevelThickness={signText3DBevelThickness}
                signText3DBevelSegments={signText3DBevelSegments}
                signText3DCurveSegments={signText3DCurveSegments}
                signTextPosition={signTextPosition}
                signTextRotation={signTextRotation}
              />
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

        {/* KayKit Variant Builder */}
        <div className="mt-8 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-xl font-semibold">KayKit Variant Builder</h3>
              <p className="text-sm text-slate-400">
                Recolor and save idle variants for KayKit Adventurers.
              </p>
            </div>
            {customizerMessage && (
              <div
                className={
                  customizerMessage.type === 'success'
                    ? 'px-3 py-2 rounded-md bg-emerald-900/50 border border-emerald-600 text-emerald-200 text-sm'
                    : 'px-3 py-2 rounded-md bg-rose-900/50 border border-rose-600 text-rose-200 text-sm'
                }
              >
                {customizerMessage.text}
              </div>
            )}
          </div>

          {!isKaykitCustomizer ? (
            <div className="text-slate-400 text-sm">
              Select a KayKit Adventurer (Rogue, Knight, Ranger, Mage, Barbarian) to enable recoloring.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden">
                  <div className="p-3 border-b border-slate-700 text-sm text-slate-300">
                    {selectedCharacter.name} Preview (rotate + zoom)
                  </div>
                  <div className="relative" style={{ height: '420px' }}>
                    {isCustomizerLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
                        <div className="text-slate-200">Loading model...</div>
                      </div>
                    )}
                    {customizerError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 z-10">
                        <div className="text-rose-300 text-sm px-4 text-center">{customizerError}</div>
                      </div>
                    )}
                    <Canvas
                      camera={{ position: [0, 1, 3], fov: 50 }}
                      style={{ background: 'linear-gradient(to bottom, #1f2937, #0f172a)' }}
                    >
                      <ambientLight intensity={0.7} />
                      <directionalLight position={[4, 6, 4]} intensity={1} />
                      <directionalLight position={[-4, 3, -4]} intensity={0.4} />
                      {customizerModel && (
                        <group>
                          <primitive object={customizerModel} scale={1.4} position={[0, -1, 0]} />
                        </group>
                      )}
                      <OrbitControls enablePan={false} minDistance={2} maxDistance={8} target={[0, 0.5, 0]} />
                    </Canvas>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-200 mb-3">Color Palette</h4>
                    {customizerPalette.length === 0 && !isCustomizerLoading && (
                      <p className="text-xs text-slate-500">No colors detected.</p>
                    )}
                    {customizerPalette.length > 0 && (
                      <ColorPaletteBoard
                        colors={customizerPalette}
                        selectedColorIndex={customizerSelectedColorIndex}
                        onColorClick={selectCustomizerColor}
                      />
                    )}
                  </div>

                  <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-200">Color Editor</h4>
                      <button
                        onClick={undoCustomizerChange}
                        className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Undo last change"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    {customizerSelectedColorIndex !== null && customizerPalette[customizerSelectedColorIndex] ? (
                      <div>
                        <button
                          onClick={() => setCustomizerShowWheel((prev) => !prev)}
                          className="w-full px-3 py-2 rounded-md border border-primary/60 text-primary text-sm font-semibold hover:bg-primary/10"
                        >
                          {customizerShowWheel ? 'Hide' : 'Show'} Color Wheel
                        </button>
                        {customizerShowWheel && (
                          <div className="mt-4 flex justify-center">
                            <ColorPickerWheel
                              initialColor={customizerPalette[customizerSelectedColorIndex].rgb}
                              onColorChange={handleCustomizerColorChange}
                              size={200}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Select a palette color to edit.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">Save Variant</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={customizerVariantName}
                      onChange={(e) => setCustomizerVariantName(e.target.value)}
                      placeholder="Variant name..."
                      className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500"
                      disabled={!customizerModel || customizerIsSaving}
                    />
                    <button
                      onClick={handleCustomizerSave}
                      disabled={!customizerModel || customizerIsSaving || !customizerVariantName.trim()}
                      className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {customizerIsSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-200">Saved Variants</h4>
                    {customizerLoadingVariants && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  {customizerSavedVariants.length === 0 ? (
                    <p className="text-xs text-slate-500">No saved variants yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {customizerSavedVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-md px-3 py-2"
                        >
                          <div>
                            <div className="text-sm text-slate-200">{variant.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{variant.baseModel}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCustomizerLoadVariant(variant.id)}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleCustomizerDeleteVariant(variant.id)}
                              className="text-xs text-rose-300 hover:text-rose-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2D Avatar Test Panel */}
        <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">2D Avatar Test (Druid)</h3>
              <p className="text-xs text-slate-400">Dashboard-only sprite animation sandbox</p>
            </div>
            <span className="text-xs text-slate-500">Idle · Talk · Pupil tracking</span>
          </div>
          <div className="flex flex-col gap-6">
            <div className="relative w-full sm:w-auto">
              <div className="relative w-full min-h-[90vh] bg-slate-900/50 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                <div
                  className={`absolute left-1/2 top-3 ${selectedAvatarPart === 'bubble' ? 'ring-2 ring-violet-400/70 rounded-lg' : ''}`}
                  style={{
                    transform: `translate(calc(-50% + ${bubbleTweaks.x}px), ${bubbleTweaks.y}px) scale(${bubbleTweaks.scale})`,
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    setSelectedAvatarPart('bubble');
                    dragStateRef.current = {
                      part: 'bubble',
                      startX: event.clientX,
                      startY: event.clientY,
                      initialX: bubbleTweaks.x,
                      initialY: bubbleTweaks.y,
                    };
                  }}
                >
                  <SpeechBubbleController
                    key={avatarSpeech?.id}
                    text={avatarSpeech?.text}
                    visible={Boolean(avatarSpeech)}
                    onHide={() => setAvatarSpeech(null)}
                    className="relative"
                  />
                </div>
                <AvatarController2D
                  mode={avatarMode}
                  size={avatarZoom}
                  headTransform={avatarTweaks.head}
                  faceTransform={{
                    x: avatarTweaks.face.x + (explodeMode ? -explodeDistance : 0),
                    y: avatarTweaks.face.y,
                    scale: avatarTweaks.face.scale,
                  }}
                  mouthTransform={{
                    x: avatarTweaks.mouth.x + (explodeMode ? explodeDistance : 0),
                    y: avatarTweaks.mouth.y,
                    scale: avatarTweaks.mouth.scale,
                  }}
                  blinkTransform={{
                    x: avatarTweaks.blink.x,
                    y: avatarTweaks.blink.y + (explodeMode ? -explodeDistance : 0),
                    scale: avatarTweaks.blink.scale,
                  }}
                  leftEyeTransform={{
                    x: avatarTweaks.leftEye.x + (explodeMode ? -explodeDistance : 0),
                    y: avatarTweaks.leftEye.y,
                    scale: avatarTweaks.leftEye.scale,
                  }}
                  rightEyeTransform={{
                    x: avatarTweaks.rightEye.x + (explodeMode ? explodeDistance : 0),
                    y: avatarTweaks.rightEye.y,
                    scale: avatarTweaks.rightEye.scale,
                  }}
                  leftPupilTransform={{
                    x: avatarTweaks.leftPupil.x + (explodeMode ? -explodeDistance : 0),
                    y: avatarTweaks.leftPupil.y,
                    scale: avatarTweaks.leftPupil.scale,
                  }}
                  rightPupilTransform={{
                    x: avatarTweaks.rightPupil.x + (explodeMode ? explodeDistance : 0),
                    y: avatarTweaks.rightPupil.y,
                    scale: avatarTweaks.rightPupil.scale,
                  }}
                  leftBrowTransform={{
                    x: avatarTweaks.leftBrow.x,
                    y: avatarTweaks.leftBrow.y + (explodeMode ? -explodeDistance : 0),
                    scale: avatarTweaks.leftBrow.scale,
                  }}
                  rightBrowTransform={{
                    x: avatarTweaks.rightBrow.x,
                    y: avatarTweaks.rightBrow.y + (explodeMode ? -explodeDistance : 0),
                    scale: avatarTweaks.rightBrow.scale,
                  }}
                  expressionIntensity={expressionIntensity}
                  selectedPart={selectedAvatarPart && selectedAvatarPart !== 'bubble' ? selectedAvatarPart : null}
                  onPartPointerDown={(part, event) => {
                    event.stopPropagation();
                    setSelectedAvatarPart(part);
                    dragStateRef.current = {
                      part,
                      startX: event.clientX,
                      startY: event.clientY,
                      initialX: avatarTweaks[part].x,
                      initialY: avatarTweaks[part].y,
                    };
                  }}
                  hideEyesOnSelect={hideEyesOnSelect}
                  forceMouthOpen={forceMouthOpen}
                  forceBlinkVisible={forceBlinkVisible}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-center">Click & drag parts to move</div>
            </div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setAvatarMode('idle')}
                  className="px-3 py-2 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                >
                  Idle
                </button>
                <button
                  onClick={() => triggerAvatarSpeech('Hello from Questerly!')}
                  className="px-3 py-2 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                >
                  Talk
                </button>
                <button
                  onClick={() => triggerAvatarSpeech('Need help? Select a model pack to preview animations.')}
                  className="px-3 py-2 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                >
                  Help
                </button>
                <button
                  onClick={() => triggerAvatarSpeech('Ask me about the dashboard or models.')}
                  className="px-3 py-2 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                >
                  Chat
                </button>
                <button
                  onClick={() => {
                    const jokes = [
                      'Why did the ranger bring string? For quest lines!',
                      'My spellbook is just a list of TODOs.',
                      'The druid says: keep your branches organized. 🌿',
                    ];
                    triggerAvatarSpeech(jokes[Math.floor(Math.random() * jokes.length)]);
                  }}
                  className="px-3 py-2 bg-slate-900 text-slate-200 text-xs rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                >
                  Joke/Story
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">Pupils follow the mouse automatically for this test.</p>
              <div className="mt-4 bg-slate-900/60 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-300 font-semibold uppercase">Alignment Controls</div>
                  <button
                    onClick={() =>
                      setAvatarTweaks({ ...DEFAULT_AVATAR_LAYERS })
                    }
                    className="text-[10px] text-slate-300 hover:text-white"
                  >
                    Reset
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mb-2">Selected: {selectedAvatarPart ?? 'none'}</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className="text-[10px] text-slate-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={explodeMode}
                      onChange={(e) => setExplodeMode(e.target.checked)}
                    />
                    Explode features
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hideEyesOnSelect}
                      onChange={(e) => setHideEyesOnSelect(e.target.checked)}
                    />
                    Hide eyes on select
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={forceMouthOpen}
                      onChange={(e) => setForceMouthOpen(e.target.checked)}
                    />
                    Mouth always visible
                  </label>
                  <label className="text-[10px] text-slate-500 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={forceBlinkVisible}
                      onChange={(e) => setForceBlinkVisible(e.target.checked)}
                    />
                    Blink always visible
                  </label>
                </div>
                <label className="text-[10px] text-slate-500 block mb-3">
                  Explode distance: {explodeDistance}
                  <input
                    type="range"
                    min={40}
                    max={140}
                    step={1}
                    value={explodeDistance}
                    onChange={(e) => setExplodeDistance(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
                <label className="text-[10px] text-slate-500 block mb-3">
                  Canvas zoom: {avatarZoom}px
                  <input
                    type="range"
                    min={320}
                    max={760}
                    step={10}
                    value={avatarZoom}
                    onChange={(e) => setAvatarZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
                {avatarPartList.map((part) => (
                  <div key={part.key} className="mb-3">
                    <div className="text-[10px] text-slate-400 uppercase mb-1">{part.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] text-slate-500">
                        X: {avatarTweaks[part.key].x}
                        <input
                          type="range"
                          min={-120}
                          max={120}
                          step={1}
                          value={avatarTweaks[part.key].x}
                          onChange={(e) =>
                            setAvatarTweaks((prev) => ({
                              ...prev,
                              [part.key]: { ...prev[part.key], x: Number(e.target.value) },
                            }))
                          }
                          className="w-full"
                        />
                      </label>
                      <label className="text-[10px] text-slate-500">
                        Y: {avatarTweaks[part.key].y}
                        <input
                          type="range"
                          min={-120}
                          max={120}
                          step={1}
                          value={avatarTweaks[part.key].y}
                          onChange={(e) =>
                            setAvatarTweaks((prev) => ({
                              ...prev,
                              [part.key]: { ...prev[part.key], y: Number(e.target.value) },
                            }))
                          }
                          className="w-full"
                        />
                      </label>
                    </div>
                    <label className="text-[10px] text-slate-500 block mt-2">
                      Scale: {avatarTweaks[part.key].scale.toFixed(2)}
                      <input
                        type="range"
                        min={getScaleMin(part.key)}
                        max={2}
                        step={0.01}
                        value={avatarTweaks[part.key].scale}
                        onChange={(e) =>
                          setAvatarTweaks((prev) => ({
                            ...prev,
                            [part.key]: { ...prev[part.key], scale: Number(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                    </label>
                  </div>
                ))}
                <div className="mt-2 border-t border-slate-700 pt-3">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Expression</div>
                  <label className="text-[10px] text-slate-500 block mt-2">
                    Expression: {expressionIntensity.toFixed(2)}
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={expressionIntensity}
                      onChange={(e) => setExpressionIntensity(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                </div>
                <div className="mt-2 border-t border-slate-700 pt-3">
                  <div className="text-[10px] text-slate-400 uppercase mb-1">Speech Bubble</div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-[10px] text-slate-500">
                      X: {bubbleTweaks.x}
                      <input
                        type="range"
                        min={-60}
                        max={60}
                        step={1}
                        value={bubbleTweaks.x}
                        onChange={(e) => setBubbleTweaks((prev) => ({ ...prev, x: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </label>
                    <label className="text-[10px] text-slate-500">
                      Y: {bubbleTweaks.y}
                      <input
                        type="range"
                        min={-80}
                        max={80}
                        step={1}
                        value={bubbleTweaks.y}
                        onChange={(e) => setBubbleTweaks((prev) => ({ ...prev, y: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </label>
                    <label className="text-[10px] text-slate-500">
                      Scale: {bubbleTweaks.scale.toFixed(2)}
                      <input
                        type="range"
                        min={0.6}
                        max={1.6}
                        step={0.01}
                        value={bubbleTweaks.scale}
                        onChange={(e) => setBubbleTweaks((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
