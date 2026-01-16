import { useState, useEffect } from 'react';
import { useBuilderStore } from '../../store/builderStore';

export function BuilderHeader() {
  const {
    currentQuest,
    isDirty,
    lastSaved,
    isAutoSaving,
    viewMode,
    updateQuestMeta,
    saveQuest,
    setViewMode,
    undo,
    redo,
  } = useBuilderStore();

  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

  useEffect(() => {
    if (isAutoSaving) {
      setSaveStatus('saving');
    } else if (isDirty) {
      setSaveStatus('unsaved');
    } else {
      setSaveStatus('saved');
    }
  }, [isDirty, isAutoSaving]);

  const handleSave = async () => {
    await saveQuest();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestMeta({ title: e.target.value });
  };

  const handleTemplateWorldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQuestMeta({ templateWorld: e.target.value as 'forest' | 'meadow' | 'town' });
  };

  const handleGameplayStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateQuestMeta({ gameplayStyle: e.target.value as 'combat' | 'nonCombat' | 'mixed' });
  };

  const handlePreview = () => {
    setViewMode(viewMode === 'preview' ? 'edit' : 'preview');
  };

  if (!currentQuest) return null;

  return (
    <header className="h-16 bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 border-b border-purple-700 flex items-center px-4 gap-4">
      {/* Quest Title */}
      <input
        type="text"
        value={currentQuest.title}
        onChange={handleTitleChange}
        className="text-xl font-bold text-white bg-transparent border-b-2 border-transparent hover:border-purple-400 focus:border-purple-400 focus:outline-none px-2 py-1 w-64 transition-colors"
        placeholder="Quest Title"
      />

      <div className="h-8 w-px bg-purple-700" />

      {/* Template World Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">World:</label>
        <select
          value={currentQuest.templateWorld}
          onChange={handleTemplateWorldChange}
          className="bg-purple-800 text-white px-3 py-1 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
        >
          <option value="forest">Forest</option>
          <option value="meadow">Meadow</option>
          <option value="town">Town</option>
        </select>
      </div>

      {/* Gameplay Style */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">Style:</label>
        <select
          value={currentQuest.gameplayStyle}
          onChange={handleGameplayStyleChange}
          className="bg-purple-800 text-white px-3 py-1 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
        >
          <option value="combat">Combat</option>
          <option value="nonCombat">Non-Combat</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          className="px-3 py-1 bg-purple-800 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          className="px-3 py-1 bg-purple-800 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>

      <div className="h-8 w-px bg-purple-700" />

      {/* Save Status */}
      <div className="flex items-center gap-2 text-sm">
        {saveStatus === 'saving' && (
          <span className="text-yellow-400">⏳ Saving...</span>
        )}
        {saveStatus === 'unsaved' && (
          <span className="text-red-400">● Unsaved</span>
        )}
        {saveStatus === 'saved' && lastSaved && (
          <span className="text-green-400">✓ Saved</span>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isAutoSaving}
        className="px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Save (Ctrl+S)"
      >
        💾 Save
      </button>

      {/* Preview Button */}
      <button
        onClick={handlePreview}
        className={`px-4 py-2 font-semibold rounded transition-colors ${
          viewMode === 'preview'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-purple-800 text-white hover:bg-purple-700'
        }`}
      >
        {viewMode === 'preview' ? '✏️ Edit' : '▶️ Preview'}
      </button>

      {/* Help */}
      <button
        className="px-3 py-2 text-white hover:bg-purple-800 rounded transition-colors"
        title="Help & Keyboard Shortcuts"
      >
        ❓
      </button>
    </header>
  );
}
