import { useState } from 'react';
import { Task, TaskType } from '../../types/quest.types';
import { useBuilderActions, useBuilderStore } from '../../store/builderStore';

interface TaskEditModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskEditModal({ task, onClose }: TaskEditModalProps) {
  const { currentQuest } = useBuilderStore();
  const { addTask, updateTask } = useBuilderActions();

  const [formData, setFormData] = useState<Partial<Task>>({
    type: task?.type || 'collect',
    description: task?.description || '',
    targetId: task?.targetId || '',
    targetAssetId: task?.targetAssetId || '',
    requiredCount: task?.requiredCount || 1,
    isOptional: task?.isOptional || false,
    order: task?.order || currentQuest?.tasks.length || 0,
    isCompleted: false,
    currentCount: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description) {
      alert('Please enter a task description');
      return;
    }

    if (task) {
      // Update existing task
      updateTask(task.id, formData);
    } else {
      // Create new task
      addTask(formData as Omit<Task, 'id'>);
    }

    onClose();
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600">
          <h2 className="text-2xl font-bold text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['collect', 'defeat', 'interact', 'reach', 'puzzle'] as TaskType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('type', type)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors capitalize ${
                    formData.type === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g., Collect 3 apples from the orchard"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              required
            />
          </div>

          {/* Required Count (for collect/defeat tasks) */}
          {(formData.type === 'collect' || formData.type === 'defeat') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Count
              </label>
              <input
                type="number"
                value={formData.requiredCount}
                onChange={(e) => handleChange('requiredCount', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          )}

          {/* Target Entity (for interact/defeat tasks) */}
          {(formData.type === 'interact' || formData.type === 'defeat' || formData.type === 'reach') && currentQuest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Entity
              </label>
              <select
                value={formData.targetId}
                onChange={(e) => handleChange('targetId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select an entity...</option>
                {currentQuest.entities
                  .filter((e) => {
                    if (formData.type === 'defeat') return e.type === 'enemy' || e.type === 'boss';
                    if (formData.type === 'interact') return e.type === 'npc' || e.type === 'object';
                    return true;
                  })
                  .map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.npcData?.name || entity.enemyData?.name || entity.id} ({entity.type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Target Asset ID (for collect tasks) */}
          {formData.type === 'collect' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collectible Asset ID
              </label>
              <input
                type="text"
                value={formData.targetAssetId}
                onChange={(e) => handleChange('targetAssetId', e.target.value)}
                placeholder="e.g., apple_01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                The asset ID of the collectible item to track
              </p>
            </div>
          )}

          {/* Optional Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOptional"
              checked={formData.isOptional}
              onChange={(e) => handleChange('isOptional', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="isOptional" className="text-sm font-medium text-gray-700">
              This task is optional
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition-colors"
          >
            {task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
