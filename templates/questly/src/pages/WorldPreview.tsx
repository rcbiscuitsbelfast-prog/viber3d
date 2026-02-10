/**
 * WorldPreview - Preview mode for testing world without editing
 * Phase 4.4 - Quest Flow Integration
 */

import { useLocation, useNavigate } from 'react-router-dom';
import TestWorld from './TestWorld';
import { useState, useEffect } from 'react';
import { Eye, Edit, Play, ArrowLeft } from 'lucide-react';
import { loadWorld } from '@/utils/worldStorage';

interface PreviewData {
  questId?: string;
  worldId?: string;
  worldState?: any;
  characterPath?: string;
  mode?: string;
  readOnly?: boolean;
}

export default function WorldPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [worldData, setWorldData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state) {
      const state = location.state as PreviewData;
      setPreviewData(state);
      setIsPreviewMode(state.readOnly !== false);

      // Load world data if worldId is provided
      if (state.worldId) {
        loadWorld(state.worldId).then((data) => {
          setWorldData(data);
          setIsLoading(false);
        }).catch((error) => {
          console.error('[WorldPreview] Failed to load world:', error);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }
  }, [location.state]);

  const handleBack = () => {
    navigate('/player-dashboard');
  };

  const handleEdit = () => {
    // Switch to edit mode
    if (previewData?.worldId) {
      navigate(`/quest-builder?worldId=${previewData.worldId}`);
    } else {
      navigate('/world-builder', { state: previewData });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading World...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No World Data</h2>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Play Mode Header */}
      <div className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 bg-slate-900/90 backdrop-blur border-b border-slate-700 shadow-lg flex items-center">
        <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Play className="text-emerald-400" size={20} />
            <div>
              <h1 className="text-xl font-bold text-white">Play Mode</h1>
              <p className="text-sm text-slate-400">
                {worldData?.name || 'World'} - {previewData.characterPath ? 'Ready to play!' : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {previewData.mode === 'play' && previewData.worldId && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TestWorld with play mode flag and character */}
      <div className="pt-14 md:pt-16">
        <TestWorld
          previewMode={true}
          worldId={previewData.worldId}
          selectedCharacterPath={previewData.characterPath}
          worldData={worldData}
        />
      </div>
    </div>
  );
}
