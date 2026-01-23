import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Users, Map, Sparkles, Save, Play } from 'lucide-react';
import CustomButton from '@/components/CustomButton';

interface BuilderSection {
  id: string;
  title: string;
  icon: typeof Layers;
  color: string;
}

const builderSections: BuilderSection[] = [
  { id: 'world', title: 'World Builder', icon: Map, color: 'bg-green-600' },
  { id: 'characters', title: 'Characters', icon: Users, color: 'bg-blue-600' },
  { id: 'objects', title: 'Objects', icon: Layers, color: 'bg-purple-600' },
  { id: 'effects', title: 'Effects', icon: Sparkles, color: 'bg-pink-600' },
];

export default function GameBuilder() {
  const [activeSection, setActiveSection] = useState<string>('world');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">Game Builder</h1>
            <p className="text-sm text-slate-400">Untitled Project</p>
          </div>
          
          <div className="flex gap-3">
            <CustomButton size="small">
              <Save className="w-4 h-4" />
              Save
            </CustomButton>
            <CustomButton size="small" className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4" />
              Test
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-36 px-4 pb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Builder Sections */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-lg font-bold mb-4 text-slate-300">Builder Tools</h2>
            {builderSections.map((section) => (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-lg
                  transition-all duration-200
                  ${activeSection === section.id 
                    ? 'bg-primary text-white shadow-lg scale-105' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }
                `}
                whileHover={{ scale: activeSection === section.id ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <section.icon className="w-6 h-6" />
                <span className="font-semibold">{section.title}</span>
              </motion.button>
            ))}
          </div>

          {/* Main Builder Area */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-xl border border-slate-700 min-h-[600px] p-8">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl font-bold mb-4 text-slate-100">
                  {builderSections.find(s => s.id === activeSection)?.title}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                  {/* Placeholder Kenny Blocks */}
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <motion.div
                      key={item}
                      className="aspect-square bg-slate-700 rounded-lg border-2 border-slate-600 hover:border-primary cursor-pointer flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-slate-600 rounded-lg mx-auto mb-2"></div>
                        <p className="text-sm text-slate-300">Item {item}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Instructions */}
                <div className="mt-8 p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h3 className="font-bold text-lg mb-2 text-slate-200">Getting Started</h3>
                  <p className="text-slate-400">
                    Select items from the grid above and drag them into your 3D scene.
                    Kenny block-style assets will appear here for visual game building.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
