/**
 * QuestProgressTracker - UI for tracking quest progress
 * Phase 6.3 - Quest Preview & Testing
 */

import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import type { Quest, Objective } from '../systems/quest/QuestLogic';
import { QuestLogicManager } from '../systems/quest/QuestLogic';

interface QuestProgressTrackerProps {
  quest: Quest;
  showDetails?: boolean;
}

export function QuestProgressTracker({ quest, showDetails = true }: QuestProgressTrackerProps) {
  const progress = QuestLogicManager.getProgress(quest);
  const completedCount = QuestLogicManager.getCompletedCount(quest);

  const getStateColor = () => {
    switch (quest.state) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'in-progress':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStateLabel = () => {
    switch (quest.state) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Quest Progress</h3>
          <p className={`text-sm ${getStateColor()}`}>{getStateLabel()}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{Math.round(progress)}%</div>
          <div className="text-xs text-slate-400">
            {completedCount} / {quest.objectives.length} objectives
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              quest.state === 'completed'
                ? 'bg-green-500'
                : quest.state === 'failed'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Objectives List */}
      {showDetails && (
        <div className="space-y-2">
          {quest.objectives.map((objective) => (
            <ObjectiveProgressItem key={objective.id} objective={objective} />
          ))}
        </div>
      )}
    </div>
  );
}

function ObjectiveProgressItem({ objective }: { objective: Objective }) {
  const progress = (objective.currentCount / objective.targetCount) * 100;

  return (
    <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
      <div className="flex-shrink-0">
        {objective.completed ? (
          <CheckCircle size={18} className="text-green-400" />
        ) : (
          <Circle size={18} className="text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${objective.completed ? 'text-green-400' : 'text-slate-300'}`}>
          {objective.description || 'No description'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                objective.completed ? 'bg-green-500' : 'bg-blue-500'
              } transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {objective.currentCount} / {objective.targetCount}
          </span>
        </div>
      </div>
    </div>
  );
}
