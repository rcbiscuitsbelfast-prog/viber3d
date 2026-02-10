import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Check } from 'lucide-react';
import { CHARACTER_OPTIONS } from '../components/CharacterSelector';

interface CharacterSelectPageProps {
  templateId?: string;
  templateConfig?: any;
  onConfirm?: (characterId: string, characterPath: string) => void;
}

export default function CharacterSelectPage({ templateId, templateConfig, onConfirm }: CharacterSelectPageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<string>('rogue');

  const selectedCharacterData = CHARACTER_OPTIONS.find(c => c.id === selectedCharacter);
  const isPlayMode = location.state?.mode === 'play';
  const playTemplate = location.state?.template; // Template from TemplateQuests (forest/island)
  const questType = location.state?.questType; // Quest type from QuestTypeSelector

  // Load template from sessionStorage if available (skip check in play mode)
  useEffect(() => {
    // Skip this check if we're in play mode - we have template from TemplateQuests
    if (isPlayMode && playTemplate) {
      return;
    }

    const pendingTemplate = sessionStorage.getItem('pendingTemplate');
    if (!pendingTemplate && !templateConfig) {
      // No template selected, redirect back
      navigate('/test-world');
    }
  }, [navigate, templateConfig, isPlayMode, playTemplate]);

  const handleConfirm = () => {
    if (selectedCharacterData) {
      // Store character selection
      sessionStorage.setItem('selectedCharacterPath', selectedCharacterData.modelPath);

      // If in play mode, navigate directly to TestWorld with template and character
      if (isPlayMode && playTemplate) {
        // Store play mode data for TestWorld
        sessionStorage.setItem('playMode', 'true');
        sessionStorage.setItem('playTemplate', playTemplate);
        if (questType) {
          sessionStorage.setItem('playQuestType', questType);
        }

        // Navigate to TestWorld with template parameter, play mode, and character selection
        navigate(`/test-world?template=${playTemplate}&mode=play&character=${selectedCharacterData.modelPath}`);
        return;
      }

      // Otherwise, handle builder mode (existing logic)
      const pendingTemplate = sessionStorage.getItem('pendingTemplate');
      if (pendingTemplate) {
        try {
          const templateData = JSON.parse(pendingTemplate);
          sessionStorage.setItem('pendingTemplate', JSON.stringify({
            id: templateData.id || templateId || 'island',
            config: templateData.config || templateConfig,
          }));
        } catch (error) {
          console.error('[CharacterSelectPage] Failed to parse pending template:', error);
        }
      }

      // Navigate back to test-world for builder mode
      navigate('/test-world');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b-2 border-slate-600">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/test-world')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-serif">Choose Your Character</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Instructions */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-lg">
              Select your character
            </p>
          </div>

          {/* Grid Character Selection - Compact Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-4xl mx-auto mb-8">
            {CHARACTER_OPTIONS.map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character.id)}
                className={`
                  aspect-square p-3 rounded-lg border-2 transition-all
                  flex flex-col items-center justify-center gap-2
                  ${selectedCharacter === character.id
                    ? 'bg-blue-600/30 border-blue-500 scale-105 shadow-lg shadow-blue-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                  }
                `}
              >
                <span className="text-4xl md:text-5xl">{character.icon}</span>
                <span className="text-xs md:text-sm font-medium text-center leading-tight">
                  {character.name}
                </span>
                {selectedCharacter === character.id && (
                  <Check className="w-4 h-4 text-blue-400 absolute top-1 right-1" />
                )}
              </button>
            ))}
          </div>

          {/* Selected Character Info - Compact */}
          {selectedCharacterData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCharacterData.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{selectedCharacterData.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedCharacterData.description}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Confirm Button */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-t-2 border-slate-600 p-4">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleConfirm}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all shadow-lg shadow-primary/50 flex items-center justify-center gap-3"
              >
                <Check className="w-6 h-6" />
                Confirm & Start Playing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
