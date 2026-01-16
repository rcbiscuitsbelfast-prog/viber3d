import { useEffect } from 'react';
import { useQuestStore } from '../../store/questStore';
import { DialogueBox } from './DialogueBox.tsx';
import { CombatUI } from './CombatUI.tsx';
import { RewardModal } from './RewardModal.tsx';
import { TasksList, HealthBar } from './HelperComponents.tsx';

export function QuestUI() {
  const combatState = useQuestStore((state) => state.combatState);
  const activeDialogue = useQuestStore((state) => state.activeDialogue);
  const showReward = useQuestStore((state) => state.showReward);
  const playerState = useQuestStore((state) => state.playerState);
  const currentQuest = useQuestStore((state) => state.currentQuest);

  // Debug logging
  useEffect(() => {
    if (activeDialogue) {
      console.log('QuestUI: activeDialogue is set:', activeDialogue);
    }
  }, [activeDialogue]);

  return (
    <>
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-4xl mx-auto flex justify-between items-start">
          {/* Quest Title */}
          <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-lg">
            <h2 className="text-xl font-bold">{currentQuest?.title || 'Quest'}</h2>
          </div>

          {/* Health Bar */}
          {playerState && !combatState?.isActive && (
            <HealthBar
              current={playerState.health}
              max={playerState.maxHealth}
            />
          )}
        </div>
      </div>

      {/* Tasks List (Right side) */}
      {currentQuest && !combatState?.isActive && (
        <div className="absolute top-20 right-4 pointer-events-none">
          <TasksList tasks={currentQuest.tasks} />
        </div>
      )}

      {/* Controls hint (Bottom left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-3 rounded-lg space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <kbd className="bg-white text-black px-2 py-1 rounded text-xs font-bold">WASD</kbd>
            <span>Move</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="bg-white text-black px-2 py-1 rounded text-xs font-bold">E</kbd>
            <span>Interact</span>
          </div>
        </div>
      </div>

      {/* Dialogue Box */}
      {activeDialogue && activeDialogue.length > 0 && (
        <DialogueBox />
      )}
      
      {/* Debug: Show dialogue state */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 left-4 bg-red-500/80 text-white p-2 text-xs z-[10000]">
          Dialogue: {activeDialogue ? 'YES' : 'NO'} ({activeDialogue?.length || 0})
        </div>
      )}

      {/* Combat UI */}
      {combatState?.isActive && <CombatUI />}

      {/* Reward Modal */}
      {showReward && <RewardModal />}
    </>
  );
}
