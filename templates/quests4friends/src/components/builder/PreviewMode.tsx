import { useEffect } from 'react';
import { useBuilderStore } from '../../store/builderStore';
import { useQuestStore } from '../../store/questStore';

export function PreviewMode() {
  const { currentQuest, setViewMode } = useBuilderStore();
  const { setCurrentQuest, startQuestSession, resetQuest } = useQuestStore();

  useEffect(() => {
    if (currentQuest) {
      // Load quest into play store
      setCurrentQuest(currentQuest);
      startQuestSession(currentQuest.id, 'preview-player');
    }

    return () => {
      // Clean up on exit
      resetQuest();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExit = () => {
    resetQuest();
    setViewMode('edit');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full h-full relative">
        {/* Exit Button */}
        <button
          onClick={handleExit}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          ✕ Exit Preview
        </button>

        {/* Controls Hint */}
        <div className="absolute top-4 right-4 z-50 bg-black bg-opacity-70 text-white px-4 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold mb-2">Controls:</p>
          <p className="text-xs">WASD - Move</p>
          <p className="text-xs">E - Interact</p>
          <p className="text-xs">Mouse - Look around</p>
        </div>

        {/* Preview Notice */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-2 rounded-full shadow-lg">
          <p className="text-sm font-semibold">🎮 Preview Mode</p>
        </div>

        {/* Game Preview Content */}
        <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-2xl font-bold mb-4">Preview Mode</p>
            <p className="text-sm opacity-70 mb-8">
              Full game preview will be integrated here
            </p>
            <p className="text-xs opacity-50">
              This will load the actual quest player with your quest data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
