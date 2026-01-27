/**
 * AssetPalette - Sidebar with asset categories and drag-and-drop
 * Phase 4.2 - Builder UI Enhancements
 */

import { ChevronDown, ChevronRight, TreePine, Mountain, Sprout, Shrub } from 'lucide-react';
import { useState } from 'react';

export interface AssetItem {
  id: string;
  name: string;
  type: 'tree' | 'rock' | 'grass' | 'bush';
  icon: string;
  modelPath?: string;
}

interface AssetPaletteProps {
  onSelectAsset: (asset: AssetItem) => void;
  selectedAssetType: 'tree' | 'rock' | 'grass' | 'bush' | null;
  expandedCategories?: Set<string>;
  onToggleCategory?: (category: string) => void;
}

const ASSET_CATEGORIES = {
  nature: {
    name: 'Nature',
    icon: '🌳',
    assets: [
      { id: 'tree-pine', name: 'Pine Tree', type: 'tree' as const, icon: '🌲' },
      { id: 'tree-broad', name: 'Broad Tree', type: 'tree' as const, icon: '🌳' },
      { id: 'tree-bushy', name: 'Bushy Tree', type: 'tree' as const, icon: '🌴' },
      { id: 'rock-1', name: 'Rock Small', type: 'rock' as const, icon: '🪨' },
      { id: 'rock-2', name: 'Rock Medium', type: 'rock' as const, icon: '🗿' },
      { id: 'rock-3', name: 'Rock Large', type: 'rock' as const, icon: '⛰️' },
      { id: 'grass-1', name: 'Grass Patch', type: 'grass' as const, icon: '🌿' },
      { id: 'bush-1', name: 'Bush', type: 'bush' as const, icon: '🌿' },
    ],
  },
};

export function AssetPalette({
  onSelectAsset,
  selectedAssetType,
  expandedCategories = new Set(['nature']),
  onToggleCategory,
}: AssetPaletteProps) {
  const handleToggleCategory = (category: string) => {
    if (onToggleCategory) {
      onToggleCategory(category);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-300 uppercase mb-3">Asset Palette</h4>

      {Object.entries(ASSET_CATEGORIES).map(([categoryKey, category]) => {
        const isExpanded = expandedCategories.has(categoryKey);

        return (
          <div key={categoryKey} className="mb-2">
            <button
              onClick={() => handleToggleCategory(categoryKey)}
              className="w-full flex items-center justify-between px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{category.icon}</span>
                <span className="text-xs font-semibold text-slate-300">{category.name}</span>
              </div>
              {isExpanded ? (
                <ChevronDown size={14} className="text-slate-400" />
              ) : (
                <ChevronRight size={14} className="text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-2 ml-2 space-y-1">
                {category.assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => onSelectAsset(asset)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left ${
                      selectedAssetType === asset.type
                        ? 'bg-blue-600/50 border border-blue-500'
                        : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-lg">{asset.icon}</span>
                    <span className="text-xs text-slate-300">{asset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-[10px] text-slate-500">
          💡 Click an asset to select it, then click in the world to place it
        </p>
      </div>
    </div>
  );
}
