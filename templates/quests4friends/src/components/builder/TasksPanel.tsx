import { useState } from 'react';
import { useBuilderStore } from '../../store/builderStore';
import { Task, TaskType } from '../../types/quest.types';
import { TaskEditModal } from './TaskEditModal';

export function TasksPanel() {
  const { currentQuest } = useBuilderStore();
  const { deleteTask } = useBuilderStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  if (!currentQuest) return null;

  const tasks = currentQuest.tasks.sort((a, b) => a.order - b.order);

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'collect':
        return '📦';
      case 'defeat':
        return '⚔️';
      case 'interact':
        return '💬';
      case 'reach':
        return '🎯';
      case 'puzzle':
        return '🧩';
      default:
        return '✓';
    }
  };

  const getTaskTypeColor = (type: TaskType) => {
    switch (type) {
      case 'collect':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'defeat':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'interact':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'reach':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'puzzle':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <>
      <section className="h-64 bg-gray-100 border-t border-gray-300 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Quest Tasks</h2>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 transition-colors text-sm"
          >
            + Add Task
          </button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          {tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="text-xs mt-1">Add your first task to get started</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 h-full">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex-shrink-0 w-72 border-2 rounded-lg p-3 shadow ${getTaskTypeColor(
                    task.type
                  )} hover:shadow-lg transition-shadow cursor-pointer`}
                  onClick={() => setEditingTask(task)}
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTaskTypeIcon(task.type)}</span>
                      <div>
                        <p className="text-xs font-semibold uppercase">{task.type}</p>
                        <p className="text-xs opacity-75">Task {index + 1}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {task.isOptional && (
                        <span className="text-xs bg-white bg-opacity-50 px-2 py-0.5 rounded">
                          Optional
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="text-red-600 hover:text-red-800 px-1"
                        title="Delete Task"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Task Description */}
                  <p className="text-sm font-medium mb-2 line-clamp-2">
                    {task.description || 'No description'}
                  </p>

                  {/* Task Details */}
                  <div className="text-xs space-y-1 opacity-75">
                    {task.requiredCount && (
                      <p>Required: {task.requiredCount}</p>
                    )}
                    {task.targetId && (
                      <p className="truncate">Target: {task.targetId}</p>
                    )}
                  </div>

                  {/* Edit Indicator */}
                  <div className="mt-2 text-xs text-center opacity-50">
                    Click to edit
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <TaskEditModal
          task={null}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}
    </>
  );
}
