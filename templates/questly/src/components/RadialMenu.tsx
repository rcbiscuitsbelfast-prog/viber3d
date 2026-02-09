import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionSlot } from './ActionBar';

interface RadialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlotIndex: number;
  equippedWeaponId?: string;
  onSelectItem: (slot: ActionSlot) => void;
}

type MenuCategory = 'main' | 'animations' | 'weapons' | 'special';

// Available animations (emotes)
const AVAILABLE_ANIMATIONS: ActionSlot[] = [
  { id: 'anim_idle', type: 'animation', name: 'Idle', animationName: 'idle', icon: '🧍' },
  { id: 'anim_walk', type: 'animation', name: 'Walk', animationName: 'walk', icon: '🚶' },
  { id: 'anim_run', type: 'animation', name: 'Run', animationName: 'run', icon: '🏃' },
  { id: 'anim_attack', type: 'animation', name: 'Attack', animationName: 'attackMelee', icon: '⚔️' },
  { id: 'anim_block', type: 'animation', name: 'Block', animationName: 'blockHit', icon: '🛡️' },
  { id: 'anim_jump', type: 'animation', name: 'Jump', animationName: 'jump', icon: '⬆️' },
  { id: 'anim_dance', type: 'animation', name: 'Dance', animationName: 'dance', icon: '💃' },
  { id: 'anim_wave', type: 'animation', name: 'Wave', animationName: 'wave', icon: '👋' },
];

// Available weapons
const AVAILABLE_WEAPONS: ActionSlot[] = [
  { 
    id: 'weapon_sword_1h', 
    type: 'weapon', 
    name: 'Sword (1H)', 
    weaponPath: '/Assets/weapons/sword_1handed.gltf',
    icon: '⚔️'
  },
  { 
    id: 'weapon_sword_2h', 
    type: 'weapon', 
    name: 'Sword (2H)', 
    weaponPath: '/Assets/weapons/sword_2handed.gltf',
    icon: '🗡️'
  },
  { 
    id: 'weapon_dagger', 
    type: 'weapon', 
    name: 'Dagger', 
    weaponPath: '/Assets/weapons/dagger.gltf',
    icon: '🔪'
  },
  { 
    id: 'weapon_bow', 
    type: 'weapon', 
    name: 'Bow', 
    weaponPath: '/Assets/weapons/bow.gltf',
    icon: '🏹'
  },
  { 
    id: 'weapon_staff', 
    type: 'weapon', 
    name: 'Staff', 
    weaponPath: '/Assets/weapons/staff.gltf',
    icon: '🪄'
  },
];

// Available special tools/actions
const AVAILABLE_SPECIAL: ActionSlot[] = [
  { id: 'special_heal', type: 'item', name: 'Heal', animationName: 'idle', icon: '💚' },
  { id: 'special_buff', type: 'item', name: 'Buff', animationName: 'idle', icon: '✨' },
  { id: 'special_teleport', type: 'item', name: 'Teleport', animationName: 'idle', icon: '🌀' },
  { id: 'special_shield', type: 'item', name: 'Shield', animationName: 'blockHit', icon: '🛡️' },
];

export function RadialMenu({
  isOpen,
  onClose,
  selectedSlotIndex,
  equippedWeaponId,
  onSelectItem,
}: RadialMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [currentCategory, setCurrentCategory] = useState<MenuCategory>('main');

  // Reset to main category when menu opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentCategory('main');
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentCategory !== 'main') {
          setCurrentCategory('main');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, currentCategory]);

  const handleSelect = (slot: ActionSlot) => {
    // Mark weapon as equipped if it's a weapon
    const equippedSlot: ActionSlot = slot.type === 'weapon' 
      ? { ...slot, isEquipped: true }
      : slot;
    
    onSelectItem(equippedSlot);
    // Don't close menu - allow multiple selections
    // Return to main category after selection
    setCurrentCategory('main');
  };

  const handleCategoryClick = (category: MenuCategory) => {
    setCurrentCategory(category);
  };

  const getItemsForCategory = (category: MenuCategory): ActionSlot[] => {
    switch (category) {
      case 'animations':
        return AVAILABLE_ANIMATIONS;
      case 'weapons':
        return AVAILABLE_WEAPONS;
      case 'special':
        return AVAILABLE_SPECIAL;
      default:
        return [];
    }
  };

  const renderRadialItems = (items: ActionSlot[], radius: number) => {
    return items.map((item, index) => {
      const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2; // Start from top
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      const isEquipped = item.type === 'weapon' && item.id === equippedWeaponId;

      return (
        <motion.button
          key={item.id}
          className={`
            absolute w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs text-white
            transition-all duration-200 border-2
            ${isEquipped
              ? 'bg-primary/30 border-primary'
              : 'bg-slate-700/90 border-slate-600 hover:bg-slate-600 hover:border-primary'
            }
          `}
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => handleSelect(item)}
          whileHover={{ scale: 1.15, zIndex: 10 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <span className="text-xl mb-0.5">{item.icon}</span>
          <span className="text-[10px] font-semibold leading-tight">{item.name}</span>
          {isEquipped && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </motion.button>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Radial Menu */}
          <motion.div
            ref={menuRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
            style={{ width: '400px', height: '400px' }}
          >
            <div className="relative w-full h-full">
              {/* Main Category Buttons (Center) */}
              {currentCategory === 'main' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col gap-4 items-center">
                    <motion.button
                      onClick={() => handleCategoryClick('animations')}
                      className="w-24 h-24 rounded-full bg-blue-600/90 border-2 border-blue-400 flex flex-col items-center justify-center text-white shadow-lg hover:bg-blue-500 transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-3xl mb-1">💃</span>
                      <span className="text-xs font-bold">Animations</span>
                      <span className="text-[10px] text-blue-200">(Emote)</span>
                    </motion.button>
                    
                    <div className="flex gap-4">
                      <motion.button
                        onClick={() => handleCategoryClick('weapons')}
                        className="w-20 h-20 rounded-full bg-red-600/90 border-2 border-red-400 flex flex-col items-center justify-center text-white shadow-lg hover:bg-red-500 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-2xl mb-1">⚔️</span>
                        <span className="text-xs font-bold">Weapons</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleCategoryClick('special')}
                        className="w-20 h-20 rounded-full bg-purple-600/90 border-2 border-purple-400 flex flex-col items-center justify-center text-white shadow-lg hover:bg-purple-500 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-2xl mb-1">✨</span>
                        <span className="text-xs font-bold">Special</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category Items (Circular Layout) */}
              {currentCategory !== 'main' && (
                <>
                  {/* Back Button (Center) */}
                  <motion.button
                    onClick={() => setCurrentCategory('main')}
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-slate-800/90 border-2 border-slate-600 flex flex-col items-center justify-center text-white shadow-lg hover:bg-slate-700 transition-all z-20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <span className="text-2xl mb-1">←</span>
                    <span className="text-[10px] font-bold">Back</span>
                  </motion.button>

                  {/* Category Title */}
                  <motion.div
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-bold bg-slate-900/80 px-4 py-2 rounded-lg border border-primary/50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {currentCategory === 'animations' && 'Animations (Emote)'}
                    {currentCategory === 'weapons' && 'Weapons'}
                    {currentCategory === 'special' && 'Special (Tools/Actions)'}
                  </motion.div>

                  {/* Radial Items */}
                  <AnimatePresence mode="wait">
                    {renderRadialItems(getItemsForCategory(currentCategory), 120)}
                  </AnimatePresence>
                </>
              )}

              {/* Slot Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-slate-900/80 px-3 py-1 rounded-lg border border-primary/50">
                Slot {selectedSlotIndex + 1}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
