// QuestSettings - Configure quest victory conditions, rewards, and metadata

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParallaxBackground from '@/components/ParallaxBackground';
import CustomButton from '@/components/CustomButton';

interface QuestData {
  questType?: 'combat' | 'non-combat';
  templateId?: string;
  templateName?: string;
  worldComplete?: boolean;
}

export default function QuestSettings() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questData, setQuestData] = useState<QuestData | null>(null);
  
  // Quest settings state
  const [questTitle, setQuestTitle] = useState('');
  const [questDescription, setQuestDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [victoryCondition, setVictoryCondition] = useState('');
  const [rewards, setRewards] = useState<string[]>(['Experience Points']);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (location.state) {
      const data = location.state as QuestData;
      setQuestData(data);
      // Set default title based on template
      if (data.templateName) {
        setQuestTitle(`${data.templateName} Quest`);
      }
    } else {
      navigate('/templates');
    }
  }, [location.state, navigate]);

  const handleSave = () => {
    const questConfig = {
      ...questData,
      title: questTitle,
      description: questDescription,
      difficulty,
      victoryCondition,
      rewards,
      tags,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for now (will be Firebase later)
    const savedQuests = JSON.parse(localStorage.getItem('savedQuests') || '[]');
    savedQuests.push(questConfig);
    localStorage.setItem('savedQuests', JSON.stringify(savedQuests));

    // Navigate to completion/preview
    navigate('/quest-complete', { state: questConfig });
  };

  const handleBack = () => {
    navigate('/world-builder', { state: questData });
  };

  if (!questData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Quest Settings...</h2>
        </div>
      </div>
    );
  }

  return (
    <ParallaxBackground>
      <div className="max-w-4xl mx-auto w-full p-4 pt-24 pb-24 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBack}
            className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to World Builder
          </button>
          <h1 className="text-4xl font-bold mb-2">Quest Settings</h1>
          <p className="text-slate-400">
            Configure your quest: {questData.templateName} ({questData.questType === 'combat' ? 'Combat' : 'Non-Combat'})
          </p>
        </motion.div>

        {/* Quest Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-slate-700"
        >
          <h2 className="text-2xl font-bold mb-4">Quest Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Quest Title</label>
              <input
                type="text"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="Enter quest title..."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={questDescription}
                onChange={(e) => setQuestDescription(e.target.value)}
                placeholder="Describe your quest..."
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Victory Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-slate-700"
        >
          <h2 className="text-2xl font-bold mb-4">Victory Conditions</h2>
          
          <div className="space-y-4">
            {questData.questType === 'combat' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="victory"
                    value="defeat-all-enemies"
                    checked={victoryCondition === 'defeat-all-enemies'}
                    onChange={(e) => setVictoryCondition(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Defeat All Enemies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="victory"
                    value="defeat-boss"
                    checked={victoryCondition === 'defeat-boss'}
                    onChange={(e) => setVictoryCondition(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Defeat Boss</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="victory"
                    value="survive-waves"
                    checked={victoryCondition === 'survive-waves'}
                    onChange={(e) => setVictoryCondition(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Survive Enemy Waves</span>
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="victory"
                    value="collect-items"
                    checked={victoryCondition === 'collect-items'}
                    onChange={(e) => setVictoryCondition(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Collect All Items</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="victory"
                    value="solve-puzzles"
                    checked={victoryCondition === 'solve-puzzles'}
                    onChange={(e) => setVictoryCondition(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Solve All Puzzles</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="victory"
                    value="reach-location"
                    checked={victoryCondition === 'reach-location'}
                    onChange={(e) => setVictoryCondition(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Reach Target Location</span>
                </label>
              </>
            )}
          </div>
        </motion.div>

        {/* Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-slate-700"
        >
          <h2 className="text-2xl font-bold mb-4">Rewards</h2>
          
          <div className="space-y-2">
            {['Experience Points', 'Gold', 'Items', 'Unlock New Area'].map((reward) => (
              <label key={reward} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rewards.includes(reward)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRewards([...rewards, reward]);
                    } else {
                      setRewards(rewards.filter(r => r !== reward));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span>{reward}</span>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 justify-end"
        >
          <CustomButton
            onClick={handleBack}
            variant="secondary"
          >
            Back
          </CustomButton>
          <CustomButton
            onClick={handleSave}
            disabled={!questTitle || !victoryCondition}
          >
            Save Quest
          </CustomButton>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
}
