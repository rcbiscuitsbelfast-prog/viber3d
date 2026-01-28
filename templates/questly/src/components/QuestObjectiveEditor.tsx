/**
 * QuestObjectiveEditor - UI for creating and editing quest objectives
 * Phase 6.1 - Quest Settings Page
 */

import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import type { Objective, ObjectiveType, Reward } from '../systems/quest/QuestLogic';

interface QuestObjectiveEditorProps {
  objectives: Objective[];
  onUpdate: (objectives: Objective[]) => void;
}

const OBJECTIVE_TYPES: { value: ObjectiveType; label: string; icon: string }[] = [
  { value: 'kill-enemies', label: 'Kill Enemies', icon: '⚔️' },
  { value: 'collect-items', label: 'Collect Items', icon: '📦' },
  { value: 'reach-location', label: 'Reach Location', icon: '📍' },
  { value: 'talk-to-npc', label: 'Talk to NPC', icon: '💬' },
  { value: 'interact-with-object', label: 'Interact with Object', icon: '🔧' },
  { value: 'defeat-boss', label: 'Defeat Boss', icon: '👹' },
  { value: 'solve-puzzle', label: 'Solve Puzzle', icon: '🧩' },
  { value: 'survive-time', label: 'Survive Time', icon: '⏱️' },
];

export function QuestObjectiveEditor({ objectives, onUpdate }: QuestObjectiveEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addObjective = () => {
    const newObjective: Objective = {
      id: `obj_${Date.now()}`,
      type: 'kill-enemies',
      description: '',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      required: true,
    };

    onUpdate([...objectives, newObjective]);
    setEditingId(newObjective.id);
  };

  const removeObjective = (id: string) => {
    onUpdate(objectives.filter((obj) => obj.id !== id));
  };

  const updateObjective = (id: string, updates: Partial<Objective>) => {
    onUpdate(
      objectives.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Quest Objectives</h3>
        <button
          onClick={addObjective}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <Plus size={16} />
          Add Objective
        </button>
      </div>

      <div className="space-y-3">
        {objectives.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No objectives yet. Click "Add Objective" to create one.</p>
          </div>
        ) : (
          objectives.map((objective) => (
            <ObjectiveItem
              key={objective.id}
              objective={objective}
              isEditing={editingId === objective.id}
              onEdit={() => setEditingId(objective.id)}
              onSave={() => setEditingId(null)}
              onUpdate={(updates) => updateObjective(objective.id, updates)}
              onDelete={() => removeObjective(objective.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ObjectiveItem({
  objective,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onDelete,
}: {
  objective: Objective;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updates: Partial<Objective>) => void;
  onDelete: () => void;
}) {
  if (isEditing) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <select
            value={objective.type}
            onChange={(e) => onUpdate({ type: e.target.value as ObjectiveType })}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          >
            {OBJECTIVE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={objective.required !== false}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="rounded"
              />
              Required
            </label>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          </div>
        </div>

        <input
          type="text"
          value={objective.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Objective description..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
        />

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Target Count</label>
            <input
              type="number"
              min="1"
              value={objective.targetCount}
              onChange={(e) => onUpdate({ targetCount: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />
          </div>
        </div>

        <button
          onClick={onSave}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
        >
          Save Objective
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {objective.completed ? (
              <CheckCircle size={18} className="text-green-400" />
            ) : (
              <Circle size={18} className="text-slate-500" />
            )}
            <span className="text-sm font-semibold text-white">
              {OBJECTIVE_TYPES.find((t) => t.value === objective.type)?.icon}{' '}
              {OBJECTIVE_TYPES.find((t) => t.value === objective.type)?.label}
            </span>
            {objective.required === false && (
              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-700 rounded">Optional</span>
            )}
          </div>
          <p className="text-sm text-slate-300 mb-1">{objective.description || 'No description'}</p>
          <p className="text-xs text-slate-500">
            Progress: {objective.currentCount} / {objective.targetCount}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
        >
          <span className="text-xs text-blue-400">Edit</span>
        </button>
      </div>
    </div>
  );
}
