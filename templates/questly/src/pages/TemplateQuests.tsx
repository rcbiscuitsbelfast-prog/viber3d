import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Mountain, Trees, Lock } from 'lucide-react';
import ParallaxBackground from '@/components/ParallaxBackground';
import { globalAudioManager } from '@/systems/audio';
import { loadWorld } from '@/utils/worldStorage';

interface WorldOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const worldOptions: WorldOption[] = [
  {
    id: 'forest',
    name: 'Forest',
    description: 'Square forest area with rolling hills, dense trees, and winding paths. No surrounding water.',
    icon: Trees,
    available: true,
  },
  {
    id: 'island',
    name: 'Island',
    description: 'Circular island with ocean, sandy beaches, hills, and lush vegetation surrounded by water.',
    icon: Mountain,
    available: true,
  },
];

export default function TemplateQuests() {
  const navigate = useNavigate();
  const location = useLocation();
  const [worldTemplate, setWorldTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect play mode
  const isPlayMode = location.state?.mode === 'play';
  const playWorldId = location.state?.worldId;

  // Play background music for template selection (no need to reinit - done in App)
  useEffect(() => {
    globalAudioManager.playMusic('track_5');
  }, []);

  // In play mode, load the world's template and auto-proceed
  useEffect(() => {
    if (isPlayMode && playWorldId) {
      loadWorld(playWorldId).then((worldData) => {
        if (worldData) {
          // Extract template from world data (should be 'forest' or 'island')
          const template = worldData.worldType || worldData.template || 'forest';
          setWorldTemplate(template);

          // Auto-proceed to character selection after a brief moment
          setTimeout(() => {
            navigate('/character-select', {
              state: {
                mode: 'play',
                worldId: playWorldId,
                template: template,
                worldData: worldData
              }
            });
          }, 800); // Brief delay to show the template
        }
        setIsLoading(false);
      }).catch((error) => {
        console.error('[TemplateQuests] Failed to load world:', error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [isPlayMode, playWorldId, navigate]);

  const handleSelectTemplate = (templateId: string) => {
    // Navigate directly to test-world with template param when clicking a template
    navigate(`/test-world?template=${templateId}`);
  };

  // Show loading state in play mode
  if (isPlayMode && isLoading) {
    return (
      <ParallaxBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Loading World...</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </ParallaxBackground>
    );
  }

  return (
    <ParallaxBackground>
      <div className="max-w-4xl mx-auto w-full p-4 pt-24 pb-24 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-primary/20">
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:underline flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-primary font-display font-bold">
            {isPlayMode ? 'Loading World Template...' : 'Choose Your World'}
          </span>
          <div className="w-16" />
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-primary mb-2">
            {isPlayMode ? 'Preparing Your Adventure' : 'Pick a World Template'}
          </h1>
          <p className="text-muted-foreground font-display">
            {isPlayMode
              ? `Loading ${worldTemplate || 'world'} template...`
              : 'Choose the terrain for your adventure'}
          </p>
        </motion.div>

        {/* World Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 max-w-2xl mx-auto w-full">
          {worldOptions.map((world, idx) => {
            const Icon = world.icon;
            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => world.available && handleSelectTemplate(world.id)}
                className={`
                  parchment-box cursor-pointer transition-all duration-200 p-8 relative
                  ${world.available ? 'hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-primary/50' : 'opacity-60 cursor-not-allowed'}
                `}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-primary/10 p-5 rounded-2xl">
                    <Icon className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-primary">
                    {world.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {world.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* More Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 border-2 border-primary/20 rounded-full">
            <Lock className="w-4 h-4 text-primary/60" />
            <span className="text-sm font-display font-semibold text-primary/70">
              More world templates coming soon!
            </span>
          </div>
        </motion.div>

      </div>
    </ParallaxBackground>
  );
}
