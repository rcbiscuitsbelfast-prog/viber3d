/**
 * CharacterStatsEditor - UI for editing character stats
 * Phase 5.1 - Character Customization
 */

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import type { CharacterStats, CharacterConfig, Equipment, Item } from '../systems/character/CharacterStats';
import { CharacterStatsManager } from '../systems/character/CharacterStats';

interface CharacterStatsEditorProps {
  characterId?: string;
  onSave: (config: CharacterConfig) => void;
  onClose: () => void;
}

export function CharacterStatsEditor({ characterId, onSave, onClose }: CharacterStatsEditorProps) {
  const [name, setName] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [stats, setStats] = useState<CharacterStats>(CharacterStatsManager.createDefaultStats());
  const [equipment, setEquipment] = useState<Equipment>({});

  useEffect(() => {
    if (characterId) {
      const existing = CharacterStatsManager.getCharacter(characterId);
      if (existing) {
        setName(existing.name);
        setModelPath(existing.modelPath);
        setStats(existing.stats);
        setEquipment(existing.equipment || {});
      }
    }
  }, [characterId]);

  const handleSave = () => {
    const config: CharacterConfig = {
      id: characterId || `char_${Date.now()}`,
      name: name || 'Unnamed Character',
      modelPath: modelPath || '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
      stats,
      equipment,
      createdAt: characterId ? CharacterStatsManager.getCharacter(characterId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    CharacterStatsManager.saveCharacter(config);
    onSave(config);
  };

  const updateStat = (key: keyof CharacterStats, value: number) => {
    setStats((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Character Stats Editor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Character Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="Enter character name"
            />
          </div>

          {/* Core Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Core Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatInput
                label="Health"
                value={stats.health}
                onChange={(v) => updateStat('health', v)}
                max={stats.maxHealth}
              />
              <StatInput
                label="Max Health"
                value={stats.maxHealth}
                onChange={(v) => {
                  updateStat('maxHealth', v);
                  if (stats.health > v) updateStat('health', v);
                }}
              />
              <StatInput
                label="Speed"
                value={stats.speed}
                onChange={(v) => updateStat('speed', v)}
                min={1}
                max={20}
              />
              <StatInput
                label="Jump Height"
                value={stats.jumpHeight}
                onChange={(v) => updateStat('jumpHeight', v)}
                min={1}
                max={20}
              />
              <StatInput
                label="Stamina"
                value={stats.stamina}
                onChange={(v) => updateStat('stamina', v)}
                max={stats.maxStamina}
              />
              <StatInput
                label="Max Stamina"
                value={stats.maxStamina}
                onChange={(v) => {
                  updateStat('maxStamina', v);
                  if (stats.stamina > v) updateStat('stamina', v);
                }}
              />
            </div>
          </div>

          {/* Movement Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Movement Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatInput
                label="Walk Speed"
                value={stats.walkSpeed}
                onChange={(v) => updateStat('walkSpeed', v)}
                min={1}
                max={15}
              />
              <StatInput
                label="Run Speed"
                value={stats.runSpeed}
                onChange={(v) => updateStat('runSpeed', v)}
                min={1}
                max={20}
              />
              <StatInput
                label="Sprint Speed"
                value={stats.sprintSpeed}
                onChange={(v) => updateStat('sprintSpeed', v)}
                min={1}
                max={25}
              />
              <StatInput
                label="Crouch Speed"
                value={stats.crouchSpeed}
                onChange={(v) => updateStat('crouchSpeed', v)}
                min={0.5}
                max={10}
              />
            </div>
          </div>

          {/* Combat Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Combat Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatInput
                label="Attack"
                value={stats.attack}
                onChange={(v) => updateStat('attack', v)}
                min={0}
                max={100}
              />
              <StatInput
                label="Defense"
                value={stats.defense}
                onChange={(v) => updateStat('defense', v)}
                min={0}
                max={100}
              />
              <StatInput
                label="Crit Chance (%)"
                value={stats.critChance * 100}
                onChange={(v) => updateStat('critChance', v / 100)}
                min={0}
                max={100}
                step={0.1}
              />
              <StatInput
                label="Crit Damage (x)"
                value={stats.critDamage}
                onChange={(v) => updateStat('critDamage', v)}
                min={1}
                max={5}
                step={0.1}
              />
            </div>
          </div>

          {/* Physics Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Physics Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatInput
                label="Mass"
                value={stats.mass}
                onChange={(v) => updateStat('mass', v)}
                min={0.1}
                max={10}
                step={0.1}
              />
              <StatInput
                label="Friction"
                value={stats.friction}
                onChange={(v) => updateStat('friction', v)}
                min={0}
                max={1}
                step={0.1}
              />
              <StatInput
                label="Air Control"
                value={stats.airControl}
                onChange={(v) => updateStat('airControl', v)}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white flex items-center gap-2"
          >
            <Save size={16} />
            Save Character
          </button>
        </div>
      </div>
    </div>
  );
}

function StatInput({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value.toFixed(step < 1 ? 1 : 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
        />
      </div>
    </div>
  );
}
