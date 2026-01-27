/**
 * WorldPreview - Preview mode for testing world without editing
 * Phase 4.4 - Quest Flow Integration
 */

import { useLocation, useNavigate } from 'react-router-dom';
import TestWorld from './TestWorld';
import { useState, useEffect } from 'react';
import { Eye, Edit, Play } from 'lucide-react';

interface PreviewData {
  questId?: string;
  worldState?: any;
  readOnly?: boolean;
}

export default function WorldPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  useEffect(() => {
    if (location.state) {
      setPreviewData(location.state as PreviewData);
      setIsPreviewMode(location.state.readOnly !== false);
    }
  }, [location.state]);

  const handleEdit = () => {
    // Switch to edit mode
    navigate('/world-builder', { state: previewData });
  };

  const handlePlay = () => {
    // Start playing the quest
    // This would navigate to the actual game/quest play mode
    console.log('Starting quest play mode...');
  };

  if (!previewData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Preview...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Preview Mode Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="text-blue-400" size={20} />
            <div>
              <h1 className="text-xl font-bold">Preview Mode</h1>
              <p className="text-sm text-slate-400">Testing world without editing</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isPreviewMode && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit World
              </button>
            )}
            <button
              onClick={handlePlay}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 font-semibold"
            >
              <Play size={16} />
              Start Quest
            </button>
          </div>
        </div>
      </div>

      {/* TestWorld with preview mode flag */}
      <div className="pt-20">
        <TestWorld previewMode={isPreviewMode} />
      </div>
    </div>
  );
}
