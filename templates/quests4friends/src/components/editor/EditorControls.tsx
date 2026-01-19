import { useState, useEffect } from 'react';
import { TileDraft, WorldDraft } from '../../types/editor.types';
import { TileExporter } from '../../systems/editor/TileExporter';
import { WorldExporter } from '../../systems/editor/WorldExporter';
import { ASSET_PALETTE } from '../../systems/editor/AssetPalette';

interface EditorControlsProps {
  // Content data
  tileDraft?: TileDraft;
  worldDraft?: WorldDraft;
  
  // Actions
  onSave?: () => void;
  onExportJSON?: () => void;
  onExportGLB?: () => void;
  onImport?: (file: File) => void;
  onClear?: () => void;
  
  // Editor type
  editorType: 'tile' | 'world';
  
  // Additional actions
  onNew?: () => void;
  onLoad?: (id: string) => void;
  onDuplicate?: () => void;
  
  // UI State
  isLoading?: boolean;
  isDirty?: boolean;
  className?: string;
}

function SavedItemsList({ type, onSelect }: { type: 'tile' | 'world'; onSelect: (id: string) => void }) {
  const [savedItems, setSavedItems] = useState<Array<{ id: string; name: string; savedAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSavedItems = () => {
    setIsLoading(true);
    try {
      if (type === 'tile') {
        const tiles = TileExporter.listSavedTiles();
        setSavedItems(tiles);
      } else {
        const worlds = WorldExporter.listSavedWorlds();
        setSavedItems(worlds);
      }
    } catch (error) {
      console.error('Failed to load saved items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedItems();
  }, [type]);

  if (isLoading) {
    return <div className="text-gray-400 text-sm">Loading saved items...</div>;
  }

  if (savedItems.length === 0) {
    return <div className="text-gray-500 text-sm">No saved {type}s found</div>;
  }

  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {savedItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between text-sm">
          <button
            onClick={() => onSelect(item.id)}
            className="flex-1 text-left text-blue-400 hover:text-blue-300 truncate"
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export function EditorControls({
  tileDraft,
  worldDraft,
  onSave,
  onExportJSON,
  onExportGLB,
  onClear,
  editorType,
  onNew,
  onLoad,
  onDuplicate,
  isLoading = false,
  isDirty = false,
  className = ''
}: EditorControlsProps) {
  const [showSavedItems, setShowSavedItems] = useState(false);

  const currentDraft = editorType === 'tile' ? tileDraft : worldDraft;
  const draftName = currentDraft?.name || 'Untitled';

  const handleExportJSON = async () => {
    if (!currentDraft) return;
    
    try {
      if (editorType === 'tile') {
        TileExporter.downloadAsJSON(currentDraft as TileDraft);
      } else {
        WorldExporter.downloadAsJSON(currentDraft as WorldDraft);
      }
      onExportJSON?.();
    } catch (error) {
      console.error('Export JSON failed:', error);
      alert('Failed to export JSON. Please try again.');
    }
  };

  const handleExportGLB = async () => {
    if (editorType !== 'tile' || !currentDraft) return;
    
    try {
      await TileExporter.downloadAsGLB(currentDraft as TileDraft, ASSET_PALETTE);
      onExportGLB?.();
    } catch (error) {
      console.error('Export GLB failed:', error);
      alert('Failed to export GLB. Please try again.');
    }
  };

  const handleImport = () => {
    // File import functionality would go here
  };

  const handleLoad = (id: string) => {
    onLoad?.(id);
    setShowSavedItems(false);
  };

  return (
    <div className={`bg-gray-800 text-white ${className}`}>
      <div className="p-3 border-b border-gray-600">
        <h3 className="text-lg font-semibold">Editor Controls</h3>
        <p className="text-sm text-gray-400">
          {editorType === 'tile' ? 'Tile' : 'World'}: {draftName}
          {isDirty && <span className="text-yellow-400 ml-2">• Unsaved changes</span>}
        </p>
      </div>

      <div className="p-3 space-y-3">
        {/* File Operations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">File Operations</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSave}
              disabled={!currentDraft || isLoading}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={() => setShowSavedItems(!showSavedItems)}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
            >
              Load
            </button>
            
            <button
              onClick={onNew}
              disabled={isLoading}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
            >
              New
            </button>
            
            <button
              onClick={onDuplicate}
              disabled={!currentDraft || isLoading}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
            >
              Duplicate
            </button>
          </div>
        </div>

        {/* Export/Import */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Export/Import</h4>
          
          <div className="space-y-2">
            <button
              onClick={handleExportJSON}
              disabled={!currentDraft || isLoading}
              className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
            >
              Export JSON
            </button>
            
            {editorType === 'tile' && (
              <button
                onClick={handleExportGLB}
                disabled={!currentDraft || isLoading}
                className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
              >
                Export GLB
              </button>
            )}
            
            <div>
              <label className="block">
                <input
                  type="file"
                  accept={editorType === 'tile' ? '.json' : '.json'}
                  onChange={handleImport}
                  className="hidden"
                />
                <span className="w-full inline-block px-3 py-2 bg-gray-600 hover:bg-gray-700 text-sm rounded cursor-pointer text-center transition-colors">
                  Import JSON
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Saved Items List */}
        {showSavedItems && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Saved {editorType === 'tile' ? 'Tiles' : 'Worlds'}</h4>
            <SavedItemsList
              type={editorType}
              onSelect={handleLoad}
            />
          </div>
        )}

        {/* Clear */}
        {onClear && (
          <div className="space-y-2">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all content?')) {
                  onClear();
                }
              }}
              disabled={!currentDraft || isLoading}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-2 bg-gray-700 rounded text-xs text-gray-300">
          <h5 className="font-medium mb-1">Controls:</h5>
          <ul className="space-y-1">
            <li>• Click asset to select</li>
            <li>• R to rotate</li>
            <li>• +/- to scale</li>
            <li>• Delete to remove</li>
            <li>• Drag to move</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EditorControls;