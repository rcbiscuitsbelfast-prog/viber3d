import { useEffect, useState } from 'react';
import { useQuestStore } from '../../store/questStore';

export function RewardModal() {
  const currentQuest = useQuestStore((state) => state.currentQuest);
  const questSession = useQuestStore((state) => state.questSession);
  const resetQuest = useQuestStore((state) => state.resetQuest);
  const [revealed, setRevealed] = useState(false);

  const reward = currentQuest?.reward;

  useEffect(() => {
    // Animate reveal after a short delay
    const timer = setTimeout(() => {
      setRevealed(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!reward || !questSession) return null;

  const playTime = questSession.playTime;
  const minutes = Math.floor(playTime / 60000);
  const seconds = Math.floor((playTime % 60000) / 1000);

  const handleClose = () => {
    resetQuest();
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-auto">
      <div className={`w-full max-w-2xl p-8 transition-all duration-1000 ${
        revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}>
        {/* Chest/Reward Visual */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">
            {reward.revealStyle === 'chest' && '🎁'}
            {reward.revealStyle === 'portal' && '🌟'}
            {reward.revealStyle === 'door' && '🚪'}
            {reward.revealStyle === 'npc' && '💌'}
          </div>
          
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2">
            Quest Complete!
          </h1>
          
          <p className="text-gray-400 text-lg">
            Completed in {minutes}m {seconds}s
          </p>
        </div>

        {/* Reward Content */}
        <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-yellow-600 rounded-lg p-8 shadow-2xl">
          {reward.title && (
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              {reward.title}
            </h2>
          )}

          {/* Text Reward */}
          {reward.type === 'text' && reward.payloadText && (
            <div className="bg-black/50 rounded-lg p-6 mb-6">
              <p className="text-white text-xl leading-relaxed text-center">
                {reward.payloadText}
              </p>
            </div>
          )}

          {/* Image Reward */}
          {reward.type === 'image' && reward.payloadUrl && (
            <div className="mb-6">
              <img
                src={reward.payloadUrl}
                alt="Reward"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Audio Reward */}
          {reward.type === 'audio' && reward.payloadUrl && (
            <div className="mb-6">
              <audio
                controls
                autoPlay
                className="w-full"
                src={reward.payloadUrl}
              />
            </div>
          )}

          {/* Link Reward */}
          {reward.type === 'link' && reward.payloadUrl && (
            <div className="text-center mb-6">
              <a
                href={reward.payloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                🔗 Open Your Reward
              </a>
            </div>
          )}

          {/* Message */}
          {reward.message && (
            <p className="text-gray-300 text-center mb-6">
              {reward.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={handleClose}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all transform hover:scale-105"
            >
              Create Your Own Quest
            </button>
          </div>
        </div>

        {/* Social Sharing */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-3">
            Share this amazing experience!
          </p>
          <div className="flex gap-3 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all">
              Share on Twitter
            </button>
            <button className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-lg transition-all">
              Share on Facebook
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
