import { useState } from 'react';
import { PlaceableAsset } from '../../types/editor.types';
import { ASSET_PALETTE, getAssetsByCategory, getAllCategories } from '../../systems/editor/AssetPalette';

interface AssetPaletteProps {
  onSelectAsset: (assetId: string) => void;
  selectedAssetId?: string | null;
}

interface CategorySectionProps {
  title: string;
  assets: PlaceableAsset[];
  onSelect: (assetId: string) => void;
  selectedAssetId?: string | null;
  isExpanded: boolean;
  onToggle: () => void;
}

function CategorySection({ title, assets, onSelect, selectedAssetId, isExpanded, onToggle }: CategorySectionProps) {
  return (
    <div className="border-b border-gray-600">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 text-left text-white font-medium hover:bg-gray-700 focus:outline-none focus:bg-gray-700 flex items-center justify-between"
      >
        <span>{title} ({assets.length})</span>
        <span className="text-sm">{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() => onSelect(asset.id)}
              className={`w-full px-2 py-2 text-left rounded text-sm transition-colors flex items-center space-x-2 ${
                selectedAssetId === asset.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              title={asset.description || asset.name}
            >
              <span className="text-lg">{asset.previewIcon || '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{asset.name}</div>
                <div className="text-xs text-gray-400 truncate">{asset.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetPalette({ onSelectAsset, selectedAssetId }: AssetPaletteProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(getAllCategories())
  );

  const categories = getAllCategories();

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const selectAsset = (assetId: string) => {
    onSelectAsset(assetId);
  };

  return (
    <div className="bg-gray-800 text-white h-full">
      <div className="p-3 border-b border-gray-600">
        <h3 className="text-lg font-semibold">Asset Palette</h3>
        <p className="text-sm text-gray-400">Click to select assets for placement</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => {
          const categoryAssets = getAssetsByCategory(category);
          if (categoryAssets.length === 0) return null;
          
          const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
          
          return (
            <CategorySection
              key={category}
              title={categoryTitle}
              assets={categoryAssets}
              onSelect={selectAsset}
              selectedAssetId={selectedAssetId}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => toggleCategory(category)}
            />
          );
        })}
      </div>
      
      {selectedAssetId && (
        <div className="p-3 border-t border-gray-600 bg-gray-750">
          <div className="text-sm">
            <span className="text-gray-400">Selected: </span>
            <span className="text-blue-400 font-medium">
              {ASSET_PALETTE.find(a => a.id === selectedAssetId)?.name || selectedAssetId}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Click on the grid to place this asset
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetPalette;