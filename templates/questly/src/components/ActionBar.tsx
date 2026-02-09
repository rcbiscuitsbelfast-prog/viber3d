import React from 'react';
import { motion } from 'framer-motion';

export interface ActionSlot {
  id: string;
  type: 'weapon' | 'animation' | 'item';
  name: string;
  icon?: string;
  animationName?: string;
  weaponPath?: string;
  isEquipped?: boolean;
}

interface ActionBarProps {
  slots: Array<ActionSlot | null>;
  selectedSlotIndex: number;
  activeSlotIndex: number;
  isRadialOpen: boolean;
  onSlotClick: (index: number) => void;
  onRadialToggle: () => void;
  onDrop?: (index: number, item: ActionSlot) => void;
}

export function ActionBar({
  slots,
  selectedSlotIndex,
  activeSlotIndex,
  isRadialOpen,
  onSlotClick,
  onRadialToggle,
  onDrop,
}: ActionBarProps) {
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const itemData = e.dataTransfer.getData('application/json');
    if (itemData && onDrop) {
      try {
        const item = JSON.parse(itemData) as ActionSlot;
        onDrop(index, item);
      } catch (err) {
        console.error('Failed to parse dropped item:', err);
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
      {/* Action Slots */}
      {slots.map((slot, index) => (
        <motion.button
          key={index}
          onClick={() => onSlotClick(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className={`
            w-14 h-14 rounded-lg border-2 transition-all flex items-center justify-center
            ${selectedSlotIndex === index
              ? 'border-primary bg-primary/20 scale-110'
              : 'border-slate-600 bg-slate-800/90 hover:bg-slate-700'
            }
            ${activeSlotIndex === index
              ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse'
              : ''
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {slot ? (
            <div className="flex flex-col items-center gap-1">
              {slot.icon && <span className="text-xl">{slot.icon}</span>}
              {!slot.icon && (
                <span className="text-xs text-slate-300 font-semibold">
                  {slot.name.charAt(0).toUpperCase()}
                </span>
              )}
              {slot.isEquipped && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
          ) : (
            <span className="text-slate-500 text-xs">+</span>
          )}
        </motion.button>
      ))}

      {/* Radial Menu Toggle */}
      <motion.button
        onClick={onRadialToggle}
        className={`
          w-14 h-14 rounded-lg border-2 transition-all flex items-center justify-center
          ${isRadialOpen
            ? 'border-primary bg-primary/30 scale-110'
            : 'border-slate-600 bg-slate-800/90 hover:bg-slate-700'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xl">⚙️</span>
      </motion.button>
    </div>
  );
}
