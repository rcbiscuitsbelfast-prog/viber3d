/**
 * BuilderToolbar - Top toolbar for world builder
 * Phase 4.2 - Builder UI Enhancements
 */

import { Save, FolderOpen, Cloud, Undo, Redo, Grid, RotateCw } from 'lucide-react';

interface BuilderToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onSaveToCloud: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleGrid?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  gridEnabled?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isFirebaseAvailable?: boolean;
}

export function BuilderToolbar({
  onSave,
  onLoad,
  onSaveToCloud,
  onUndo,
  onRedo,
  onToggleGrid,
  canUndo = false,
  canRedo = false,
  gridEnabled = false,
  saveStatus = 'idle',
  isFirebaseAvailable = false,
}: BuilderToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-white">World Builder</h1>
          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded">Phase 4.2</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          {onUndo && onRedo && (
            <>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-lg transition-colors ${
                  canUndo
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo size={18} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 rounded-lg transition-colors ${
                  canRedo
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo size={18} />
              </button>
            </>
          )}

          {/* Grid Toggle */}
          {onToggleGrid && (
            <button
              onClick={onToggleGrid}
              className={`p-2 rounded-lg transition-colors ${
                gridEnabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Toggle Grid"
            >
              <Grid size={18} />
            </button>
          )}

          <div className="w-px h-6 bg-slate-700 mx-2" />

          {/* Save/Load */}
          <button
            onClick={onLoad}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            title="Load World"
          >
            <FolderOpen size={16} />
            Load
          </button>

          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              saveStatus === 'saving'
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Save World (Ctrl+S)"
          >
            <Save size={16} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>

          {/* Cloud Save */}
          <button
            onClick={onSaveToCloud}
            disabled={!isFirebaseAvailable || saveStatus === 'saving'}
            className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              isFirebaseAvailable
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-600/50 text-slate-400 cursor-not-allowed'
            }`}
            title={isFirebaseAvailable ? 'Save to Cloud' : 'Firebase not configured'}
          >
            <Cloud size={16} />
            Cloud
          </button>
        </div>
      </div>
    </div>
  );
}
