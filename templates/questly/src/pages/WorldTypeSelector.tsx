import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Map, Layers, Cuboid } from 'lucide-react';
import type { QuestCategory, WorldType } from '@/data/quest-templates';

interface WorldTypeState {
  mode?: 'template' | 'free-build';
  category?: QuestCategory;
}

const WORLD_TYPES: Array<{
  id: WorldType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    id: 'openWorld',
    name: 'Open World',
    description: 'Explore freely with open terrain and wide spaces.',
    icon: Map,
    color: 'bg-emerald-600',
  },
  {
    id: 'platformer',
    name: 'Platformer',
    description: 'Jump between platforms and layered routes.',
    icon: Layers,
    color: 'bg-blue-600',
  },
  {
    id: 'multiLevel',
    name: 'Multi-Level',
    description: 'Stacked areas with vertical progression.',
    icon: Cuboid,
    color: 'bg-purple-600',
  },
];

export default function WorldTypeSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as WorldTypeState | null;

  const mode = state?.mode || 'template';
  const category = state?.category || 'combat';

  useEffect(() => {
    if (!state?.mode || !state?.category) {
      navigate('/quest-type');
    }
  }, [navigate, state?.mode, state?.category]);

  const categoryLabel = useMemo(
    () => (category === 'combat' ? '⚔️ Combat Quest' : '💜 Non-Combat Quest'),
    [category]
  );

  const handleSelect = (worldType: WorldType) => {
    if (mode === 'free-build') {
      navigate('/quest-builder', {
        state: {
          mode,
          category,
          worldType,
        },
      });
      return;
    }

    navigate('/templates', {
      state: {
        mode,
        category,
        worldType,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border-2 border-primary/30 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/quest-type')}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white font-display">Choose World Type</h2>
              <p className="text-xs text-slate-400">{categoryLabel}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORLD_TYPES.map((worldType) => (
            <motion.button
              key={worldType.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(worldType.id)}
              className="bg-slate-800 hover:bg-slate-700 border-2 border-primary/20 hover:border-primary/40 rounded-lg p-4 text-left transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${worldType.color} p-3 rounded-lg group-hover:opacity-90 transition-colors`}>
                  <worldType.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{worldType.name}</h3>
                  <p className="text-xs text-slate-400">{worldType.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
