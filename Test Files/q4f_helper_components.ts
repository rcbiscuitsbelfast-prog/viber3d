// src/components/ui/HealthBar.tsx
export function HealthBar({ current, max }: { current: number; max: number }) {
  const percentage = (current / max) * 100;
  
  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 min-w-[200px]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-sm font-bold">❤️ Health</span>
        <span className="text-white text-sm font-bold">
          {current} / {max}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage > 50
              ? 'bg-gradient-to-r from-green-600 to-green-400'
              : percentage > 25
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
              : 'bg-gradient-to-r from-red-600 to-red-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// src/components/ui/TasksList.tsx
import { Task } from '../../types/quest.types';

export function TasksList({ tasks }: { tasks: Task[] }) {
  // Sort tasks by order
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 min-w-[280px]">
      <h3 className="text-white text-lg font-bold mb-3 flex items-center gap-2">
        <span>📋</span>
        <span>Objectives</span>
      </h3>
      
      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded transition-all ${
        task.isCompleted
          ? 'bg-green-900/30 line-through text-gray-500'
          : 'bg-gray-800/50 text-white'
      }`}
    >
      <div className="mt-0.5">
        {task.isCompleted ? (
          <span className="text-green-400">✓</span>
        ) : (
          <span className="text-gray-400">○</span>
        )}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium">{task.description}</p>
        
        {task.type === 'collect' && task.requiredCount && (
          <p className="text-xs mt-1 opacity-70">
            {task.currentCount || 0} / {task.requiredCount}
          </p>
        )}
        
        {task.isOptional && (
          <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded mt-1 inline-block">
            Optional
          </span>
        )}
      </div>
    </div>
  );
}

// src/components/ui/LoadingScreen.tsx
export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 via-purple-900 to-black">
      <div className="text-center">
        {/* Animated logo or icon */}
        <div className="text-8xl mb-6 animate-bounce">🎮</div>
        
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
          Quests4Friends
        </h1>
        
        <p className="text-white text-xl mb-8 animate-pulse">{message}</p>
        
        {/* Loading bar */}
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}

// src/components/ui/ErrorScreen.tsx
export function ErrorScreen({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-red-900 via-purple-900 to-black">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl mb-6">😞</div>
        
        <h1 className="text-4xl font-bold text-white mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-300 text-lg mb-8">
          {error}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}