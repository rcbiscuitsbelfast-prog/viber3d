// QuestComplete - Final step showing quest summary and options to play/save/share

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParallaxBackground from '@/components/ParallaxBackground';
import CustomButton from '@/components/CustomButton';
import { CheckCircle, Play, Share2, Download, Home } from 'lucide-react';

export default function QuestComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questConfig, setQuestConfig] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      setQuestConfig(location.state);
    } else {
      navigate('/dashboard');
    }
  }, [location.state, navigate]);

  const handlePlay = () => {
    // Navigate to quest player (to be implemented)
    navigate('/play', { state: questConfig });
  };

  const handleShare = () => {
    // Generate shareable link (to be implemented)
    const questId = questConfig?.id || `quest-${Date.now()}`;
    const shareUrl = `${window.location.origin}/play/${questId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Quest link copied to clipboard!');
  };

  const handleDownload = () => {
    // Download quest as JSON
    const blob = new Blob([JSON.stringify(questConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${questConfig?.title || 'quest'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!questConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <ParallaxBackground>
      <div className="max-w-4xl mx-auto w-full p-4 pt-24 pb-24 min-h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="mb-8"
        >
          <CheckCircle className="w-24 h-24 text-green-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-4">Quest Created!</h1>
          <p className="text-2xl text-slate-400 mb-2">{questConfig.title}</p>
          <p className="text-slate-500">{questConfig.description || 'Your quest is ready to play!'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-8 border border-slate-700 w-full max-w-2xl"
        >
          <h2 className="text-xl font-bold mb-4">Quest Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Type:</span>
              <span className="ml-2 text-white capitalize">{questConfig.questType || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-slate-400">Difficulty:</span>
              <span className="ml-2 text-white">{questConfig.difficulty || 'Medium'}</span>
            </div>
            <div>
              <span className="text-slate-400">Template:</span>
              <span className="ml-2 text-white">{questConfig.templateName || 'Custom'}</span>
            </div>
            <div>
              <span className="text-slate-400">Victory:</span>
              <span className="ml-2 text-white capitalize">{questConfig.victoryCondition?.replace('-', ' ') || 'Not set'}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <CustomButton
            onClick={handlePlay}
            className="flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Play Quest
          </CustomButton>
          
          <CustomButton
            onClick={handleShare}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share Quest
          </CustomButton>
          
          <CustomButton
            onClick={handleDownload}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download JSON
          </CustomButton>
          
          <CustomButton
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </CustomButton>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
}
