import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Sword, Scroll } from 'lucide-react';
import ParallaxBackground from '@/components/ParallaxBackground';
import { cn } from '@/lib/utils';
import { globalAudioManager } from '@/systems/audio';

interface QuestTypeOption {
  title: string;
  description: string;
  icon: typeof Sword;
}

const questTypes: QuestTypeOption[] = [
  {
    title: 'Combat Quest',
    description: 'Defeat enemies, clear areas, and fight epic bosses.',
    icon: Sword,
  },
  {
    title: 'Non-Combat Quest',
    description: 'Puzzles, collecting, foraging, fetch quests, exploration.',
    icon: Scroll,
  },
];

export default function QuestTypeSelector() {
  const navigate = useNavigate();

  // Play background music for quest type selector (no need to reinit - done in App)
  useEffect(() => {
    globalAudioManager.playMusic('track_5');
  }, []);

  const handleSelectType = (typeTitle: string) => {
    // Navigate directly to templates page when clicking a quest type
    navigate('/templates', { state: { questType: typeTitle } });
  };

  return (
    <ParallaxBackground>
      <div className="max-w-4xl mx-auto w-full p-4 pt-24 pb-24 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-primary/20">
          <button
            onClick={() => navigate('/builder')}
            className="text-primary hover:underline flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-primary font-display font-bold">Choose Quest Type</span>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-primary mb-2">
            What kind of adventure?
          </h1>
          <p className="text-muted-foreground font-display">
            Choose your quest style
          </p>
        </motion.div>

        {/* Quest Type Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key="type-selection"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1"
          >
            {questTypes.map((type, idx) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSelectType(type.title)}
                className={cn(
                  'parchment-box cursor-pointer transition-all duration-200 p-8',
                  'hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-primary/50 group'
                )}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-6 rounded-full bg-primary/20 transition-colors group-hover:bg-primary">
                    <type.icon className="w-12 h-12 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-primary">
                    {type.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
    </ParallaxBackground>
  );
}
