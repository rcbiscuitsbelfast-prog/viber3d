// CharacterSelector - UI component for selecting character models

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface CharacterOption {
  id: string;
  name: string;
  modelPath: string;
  icon: string;
  description: string;
}

export const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: 'rogue',
    name: 'Rogue',
    modelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
    icon: '🗡️',
    description: 'Stealthy and agile',
  },
  {
    id: 'knight',
    name: 'Knight',
    modelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb',
    icon: '🛡️',
    description: 'Heavy armor and sword',
  },
  {
    id: 'ranger',
    name: 'Ranger',
    modelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Ranger.glb',
    icon: '🏹',
    description: 'Bow and nature magic',
  },
  {
    id: 'mage',
    name: 'Mage',
    modelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb',
    icon: '🔮',
    description: 'Powerful spells',
  },
  {
    id: 'barbarian',
    name: 'Barbarian',
    modelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Barbarian.glb',
    icon: '⚔️',
    description: 'Brutal strength',
  },
];

interface CharacterSelectorProps {
  selectedCharacter: string;
  onSelectCharacter: (characterId: string) => void;
  className?: string;
}

export default function CharacterSelector({
  selectedCharacter,
  onSelectCharacter,
  className = '',
}: CharacterSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-slate-300 mb-2">
        Character
      </label>
      <div className="grid grid-cols-2 gap-2">
        {CHARACTER_OPTIONS.map((character) => (
          <motion.button
            key={character.id}
            onClick={() => onSelectCharacter(character.id)}
            className={`
              p-3 rounded-lg border-2 transition-all text-left
              ${
                selectedCharacter === character.id
                  ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/50'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{character.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">
                  {character.name}
                </div>
                <div className="text-xs text-slate-400">
                  {character.description}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
