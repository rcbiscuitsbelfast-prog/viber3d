// WorldBuilder - Wrapper around TestWorld for quest creation flow
// This integrates the world editor into the guided quest builder

import { useLocation, useNavigate } from 'react-router-dom';
import TestWorld from './TestWorld';
import { useState, useEffect } from 'react';

interface QuestData {
  questType?: 'combat' | 'non-combat';
  templateId?: string;
  templateName?: string;
}

export default function WorldBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const worldStateRef = useRef<WorldState | null>(null);

  // Get quest data from navigation state
  useEffect(() => {
    if (location.state) {
      setQuestData(location.state as QuestData);
    } else {
      // If no state, redirect back to templates
      navigate('/templates');
    }
  }, [location.state, navigate]);

  const handleWorldComplete = () => {
    // Navigate to quest settings with world data
    // World state will be retrieved from TestWorld via localStorage or context
    navigate('/quest-settings', {
      state: {
        ...questData,
        worldComplete: true,
        // World state will be loaded from auto-save or manual save
      },
    });
  };

  const handleBack = () => {
    navigate('/templates', { state: questData });
  };

  if (!questData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading World Builder...</h2>
          <p className="text-slate-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Quest Flow Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">World Builder</h1>
            <p className="text-sm text-slate-400">
              {questData.templateName || 'Custom World'} • {questData.questType === 'combat' ? 'Combat Quest' : 'Non-Combat Quest'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleWorldComplete}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
            >
              Continue to Settings →
            </button>
          </div>
        </div>
      </div>

      {/* TestWorld with offset for header */}
      <div className="pt-20">
        <TestWorld />
      </div>
    </div>
  );
}
