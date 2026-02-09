import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mountain, Trees, FolderOpen } from 'lucide-react';
import type { BuildingArea } from '@/systems/world/WorldConfig';

export interface WorldTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  config: {
    roughness: number;
    islandSize: number;
    terrainDetail: number;
    seed: number;
    heightScale: number;
    waterLevel: number;
    cliffIntensity: number;
    noiseType?: 'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent';
    treeAmount: number;
    treeSize: number;
    grassAmount: number;
    grassSize: number;
    terrainGrassCoverage: number;
    buildingGrassFalloff: number;
    rockAmount: number;
    rockSize: number;
    bushAmount: number;
    bushSize: number;
    treeHeightOffset: number;
    grassHeightOffset: number;
    rockHeightOffset: number;
    bushHeightOffset: number;
    slopeAdjustmentIntensity: number;
    isSquareTerrain?: boolean; // If true, terrain is square with no island falloff
    sunIntensity?: number;
    waveStrength?: number;
    waveAmplitude?: number;
    waveSpeed?: number;
    oceanTransparency?: number;
    oceanSize?: number;
    rippleScale?: number;
    fogHeight?: number;
    bubbleScale?: number;
    bubbleDensity?: number;
    bubbleSpeed?: number;
    buildingAreas?: BuildingArea[]; // Default building areas for template
  };
}

export const WORLD_TEMPLATES: WorldTemplate[] = [
  {
    id: 'island',
    name: 'Island',
    description: 'Circular island with ocean, hills, and beaches',
    icon: Mountain,
    config: {
      roughness: 26, // Island: Roughness 26
      islandSize: 44, // Island: Terrain Size 44
      terrainDetail: 64,
      seed: 0,
      heightScale: 55, // Island: Height Scale 55
      waterLevel: 0.9, // Island: Water Level 0.9
      cliffIntensity: 100, // Island: Cliff Intensity 100
      treeAmount: 2000,
      treeSize: 100,
      grassAmount: 2000,
      grassSize: 100,
      terrainGrassCoverage: 100,
      buildingGrassFalloff: 50,
      rockAmount: 400,
      rockSize: 100,
      bushAmount: 600,
      bushSize: 100,
      treeHeightOffset: 0,
      grassHeightOffset: 0,
      rockHeightOffset: 0,
      bushHeightOffset: 0,
      slopeAdjustmentIntensity: 3.5,
      isSquareTerrain: false, // Island: circular terrain
      noiseType: 'smooth' as const, // Island: Smooth (Rolling Hills)
      // Island template defaults
      sunIntensity: 1.0,
      waveStrength: 0.08, // Island: Wave Strength 0.08
      waveAmplitude: 1.0,
      waveSpeed: 1.7,
      oceanTransparency: 1.0,
      oceanSize: 500,
      rippleScale: 5.0,
      fogHeight: 16.0, // Island: Fog Height 16.0m
      bubbleScale: 0.7, // Island: Bubble Scale 0.7x
      bubbleDensity: 2.4, // Island: Bubble Density 2.4x
      bubbleSpeed: 0.0,
      // Island default building area
      buildingAreas: [
        { id: 0, x: 10, z: -50, radius: 40, height: 4.0, minimized: false } // Island: Position X: 10, Z: -50, Radius: 40, Height: 4.0
      ],
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Square forest area with hills, no water',
    icon: Trees,
    config: {
      roughness: 25, // Forest: Roughness 25
      islandSize: 83, // Forest: Terrain Size 83
      terrainDetail: 64,
      seed: 0,
      heightScale: 35, // Forest: Height Scale 35
      waterLevel: -20.0, // Forest: Water Level -20.0
      cliffIntensity: 80, // Forest: Cliff Intensity 80
      treeAmount: 2000,
      treeSize: 100,
      grassAmount: 2000,
      grassSize: 100,
      terrainGrassCoverage: 100,
      buildingGrassFalloff: 50,
      rockAmount: 400,
      rockSize: 100,
      bushAmount: 600,
      bushSize: 100,
      treeHeightOffset: 0,
      grassHeightOffset: 0,
      rockHeightOffset: 0,
      bushHeightOffset: 0,
      slopeAdjustmentIntensity: 3.5,
      isSquareTerrain: true, // Forest: Square terrain, no island falloff
      noiseType: 'ridged' as const, // Forest: Ridged (Valleys)
      // Forest template defaults
      sunIntensity: 1.0,
      waveStrength: 0.02, // Forest: Wave Strength 0.02
      waveAmplitude: 1.0,
      waveSpeed: 1.7,
      oceanTransparency: 1.0,
      oceanSize: 500,
      rippleScale: 5.0,
      fogHeight: 13.4, // Forest: Fog Height 13.4m
      bubbleScale: 1.0, // Forest: Bubble Scale 1.0x
      bubbleDensity: 2.8, // Forest: Bubble Density 2.8x
      bubbleSpeed: 0.0,
      // Forest default building area
      buildingAreas: [
        { id: 0, x: 0, z: -10, radius: 45, height: 2.5, minimized: false } // Forest: Position X: 0, Z: -10, Radius: 45, Height: 2.5
      ],
    },
  },
];

interface SavedWorld {
  id: string;
  name: string;
  timestamp: number | string; // Support both number and string timestamps
}

interface WorldTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorldTemplate) => void;
  onSelectSavedWorld: (worldId: string) => void;
  savedWorlds: SavedWorld[];
}

export default function WorldTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
  onSelectSavedWorld,
  savedWorlds,
}: WorldTemplateModalProps) {
  const [view, setView] = useState<'main' | 'templates' | 'saved'>('main');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-primary/30 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white font-display">Select World</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main View - Templates or Saved Worlds */}
            {view === 'main' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('templates')}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-primary/30 hover:border-primary/50 rounded-lg p-6 text-left transition-all group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-primary/20 p-3 rounded-lg group-hover:bg-primary/30 transition-colors">
                      <Mountain className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Templates</h3>
                      <p className="text-sm text-slate-400">Start with a pre-configured world</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('saved')}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-primary/30 hover:border-primary/50 rounded-lg p-6 text-left transition-all group"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-primary/20 p-3 rounded-lg group-hover:bg-primary/30 transition-colors">
                      <FolderOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Saved Worlds</h3>
                      <p className="text-sm text-slate-400">Load a previously saved world</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            )}

            {/* Templates View */}
            {view === 'templates' && (
              <div>
                <button
                  onClick={() => setView('main')}
                  className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                >
                  ← Back
                </button>
                <div className="grid grid-cols-1 gap-4">
                  {WORLD_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onClose();
                          setTimeout(() => onSelectTemplate(template), 100);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 border-2 border-primary/30 hover:border-primary/50 rounded-lg p-4 text-left transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/20 p-3 rounded-lg group-hover:bg-primary/30 transition-colors">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                            <p className="text-sm text-slate-400">{template.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Saved Worlds View */}
            {view === 'saved' && (
              <div>
                <button
                  onClick={() => setView('main')}
                  className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                >
                  ← Back
                </button>
                <div className="space-y-2">
                  {savedWorlds.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No saved worlds found</p>
                    </div>
                  ) : (
                    savedWorlds.map((world) => (
                      <motion.button
                        key={world.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onSelectSavedWorld(world.id);
                          onClose();
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-primary/30 hover:border-primary/50 rounded-lg p-4 text-left transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{world.name}</h3>
                            <p className="text-sm text-slate-400">
                              {new Date(typeof world.timestamp === 'string' ? parseInt(world.timestamp) : world.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <FolderOpen className="w-5 h-5 text-primary" />
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
