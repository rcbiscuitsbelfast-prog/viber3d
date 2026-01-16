import { useState, useMemo } from 'react';
import assetData from '../../data/asset-categories.json';
import { AssetDefinition } from '../../types/builder.types';

interface AssetPaletteProps {
  onAssetDragStart: (asset: AssetDefinition) => void;
}

export function AssetPalette({ onAssetDragStart }: AssetPaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState(assetData.categories[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = useMemo(
    () => assetData.categories.find((cat) => cat.id === selectedCategory),
    [selectedCategory]
  );

  const filteredAssets = useMemo(() => {
    if (!currentCategory) return [];
    if (!searchQuery) return currentCategory.assets;

    return currentCategory.assets.filter((asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentCategory, searchQuery]);

  const handleDragStart = (e: React.DragEvent, asset: AssetDefinition) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    onAssetDragStart(asset);
  };

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Asset Palette</h2>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-gray-300 bg-white">
        {assetData.categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={category.name}
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, asset as AssetDefinition)}
              className="bg-white rounded-lg border-2 border-gray-300 hover:border-purple-400 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg group"
              title={asset.name}
            >
              {/* Asset Preview */}
              <div className="aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                {/* Placeholder - replace with actual thumbnail */}
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {currentCategory?.icon}
                </div>
                
                {/* Drag Indicator */}
                <div className="absolute inset-0 bg-purple-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-xs">
                    Drag to add
                  </span>
                </div>
              </div>
              
              {/* Asset Name */}
              <div className="p-2 text-center">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {asset.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredAssets.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No assets found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-3 border-t border-gray-300 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          💡 Drag assets onto the canvas to add them
        </p>
      </div>
    </aside>
  );
}
