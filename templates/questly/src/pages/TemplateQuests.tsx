import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Star, Lock } from 'lucide-react';
import ParallaxBackground from '@/components/ParallaxBackground';
import CustomButton from '@/components/CustomButton';
import { cn } from '@/lib/utils';

interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  premium: boolean;
}

const templates: QuestTemplate[] = [
  {
    id: 'forest-rescue',
    name: 'Forest Rescue',
    description: 'Save the lost villagers from the enchanted forest.',
    icon: '🌲',
    difficulty: 'Easy',
    premium: false,
  },
  {
    id: 'dungeon-delve',
    name: 'Dungeon Delve',
    description: 'Explore ancient ruins and defeat the guardian.',
    icon: '🏰',
    difficulty: 'Medium',
    premium: false,
  },
  {
    id: 'dragon-hunt',
    name: 'Dragon Hunt',
    description: 'Track and defeat the legendary dragon.',
    icon: '🐉',
    difficulty: 'Hard',
    premium: true,
  },
  {
    id: 'treasure-hunt',
    name: 'Treasure Hunt',
    description: 'Follow clues to find the hidden treasure.',
    icon: '💎',
    difficulty: 'Easy',
    premium: false,
  },
  {
    id: 'mystery-mansion',
    name: 'Mystery Mansion',
    description: 'Solve puzzles in the haunted mansion.',
    icon: '🏚️',
    difficulty: 'Medium',
    premium: true,
  },
  {
    id: 'wizard-tower',
    name: 'Wizard Tower',
    description: 'Climb the tower and retrieve the ancient spellbook.',
    icon: '🔮',
    difficulty: 'Hard',
    premium: false,
  },
];

export default function TemplateQuests() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Get quest type from navigation state
  const questType = (location.state as any)?.questType || 'Combat Quest';

  const handleContinue = () => {
    if (selectedTemplate) {
      navigate('/dashboard', { 
        state: { 
          questType, 
          template: templates.find(t => t.id === selectedTemplate) 
        } 
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-amber-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <ParallaxBackground>
      <div className="max-w-6xl mx-auto w-full p-4 pt-24 pb-24 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-primary/20">
          <button
            onClick={() => navigate('/quest-type')}
            className="text-primary hover:underline flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-primary font-display font-bold">Choose Template</span>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-primary mb-2">
            Quest Templates
          </h1>
          <p className="text-muted-foreground font-display">
            Start with a template or build from scratch
          </p>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => !template.premium && setSelectedTemplate(template.id)}
              className={cn(
                'parchment-box cursor-pointer transition-all duration-200 p-6 relative',
                template.premium ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl',
                selectedTemplate === template.id && !template.premium
                  ? 'ring-4 ring-primary shadow-2xl scale-105'
                  : 'hover:ring-2 hover:ring-primary/50'
              )}
            >
              {/* Premium Badge */}
              {template.premium && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Premium
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-3">
                {/* Icon */}
                <div className="text-6xl">
                  {template.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold font-serif text-primary">
                  {template.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>

                {/* Difficulty */}
                <div className="flex items-center gap-2">
                  <Star className={cn('w-4 h-4', getDifficultyColor(template.difficulty))} />
                  <span className={cn('text-sm font-bold', getDifficultyColor(template.difficulty))}>
                    {template.difficulty}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedTemplate ? 1 : 0.5 }}
          className="mt-8 flex justify-center"
        >
          <CustomButton
            size="large"
            onClick={handleContinue}
            disabled={!selectedTemplate}
          >
            Continue to Dashboard
          </CustomButton>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
}
