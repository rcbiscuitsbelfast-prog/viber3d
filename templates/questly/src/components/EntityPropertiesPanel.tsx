/**
 * EntityPropertiesPanel - Panel for editing selected entity properties
 * Phase 4.2 - Builder UI Enhancements
 */

import { X, RotateCw, Move, Maximize2 } from 'lucide-react';
import * as THREE from 'three';

export interface EntityProperties {
  id: string;
  type: 'manual-asset' | 'building-area' | 'quest-marker' | 'npc';
  position: [number, number, number];
  rotation?: number;
  scale?: number;
  [key: string]: any; // Additional properties
}

interface EntityPropertiesPanelProps {
  entity: EntityProperties | null;
  onClose: () => void;
  onUpdate: (updates: Partial<EntityProperties>) => void;
  onDelete?: () => void;
}

export function EntityPropertiesPanel({
  entity,
  onClose,
  onUpdate,
  onDelete,
}: EntityPropertiesPanelProps) {
  if (!entity) return null;

  return (
    <div className="absolute top-20 right-4 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-xl z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h3 className="text-sm font-bold text-white">Properties</h3>
          <p className="text-xs text-slate-400 capitalize">{entity.type.replace('-', ' ')}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Properties */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Position */}
        <div>
          <label className="text-xs text-slate-400 mb-2 flex items-center gap-2">
            <Move size={14} />
            Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">X</label>
              <input
                type="number"
                value={entity.position[0].toFixed(2)}
                onChange={(e) =>
                  onUpdate({
                    position: [Number(e.target.value), entity.position[1], entity.position[2]],
                  })
                }
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Y</label>
              <input
                type="number"
                value={entity.position[1].toFixed(2)}
                onChange={(e) =>
                  onUpdate({
                    position: [entity.position[0], Number(e.target.value), entity.position[2]],
                  })
                }
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Z</label>
              <input
                type="number"
                value={entity.position[2].toFixed(2)}
                onChange={(e) =>
                  onUpdate({
                    position: [entity.position[0], entity.position[1], Number(e.target.value)],
                  })
                }
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        {entity.rotation !== undefined && (
          <div>
            <label className="text-xs text-slate-400 mb-2 flex items-center gap-2">
              <RotateCw size={14} />
              Rotation
            </label>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.1"
              value={entity.rotation}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="text-xs text-slate-500 mt-1">
              {((entity.rotation * 180) / Math.PI).toFixed(1)}°
            </div>
          </div>
        )}

        {/* Scale */}
        {entity.scale !== undefined && (
          <div>
            <label className="text-xs text-slate-400 mb-2 flex items-center gap-2">
              <Maximize2 size={14} />
              Scale
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={entity.scale}
              onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="text-xs text-slate-500 mt-1">{entity.scale.toFixed(1)}x</div>
          </div>
        )}

        {/* Type-specific properties */}
        {entity.type === 'building-area' && (
          <>
            <div>
              <label className="text-xs text-slate-400 mb-2">Radius</label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={entity.radius || 20}
                onChange={(e) => onUpdate({ radius: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="text-xs text-slate-500 mt-1">{entity.radius || 20}m</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2">Height</label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={entity.height || 2.5}
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="text-xs text-slate-500 mt-1">{entity.height || 2.5}m</div>
            </div>
          </>
        )}

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Delete Entity
          </button>
        )}
      </div>
    </div>
  );
}
