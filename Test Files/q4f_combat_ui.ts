// src/components/ui/CombatUI.tsx
import { useState, useEffect } from 'react';
import { useQuestStore } from '../../store/questStore';

export function CombatUI() {
  const combatState = useQuestStore((state) => state.combatState);
  const currentQuest = useQuestStore((state) => state.currentQuest);
  const updateCombat = useQuestStore((state) => state.updateCombat);
  const endCombat = useQuestStore((state) => state.endCombat);
  const updatePlayerHealth = useQuestStore((state) => state.updatePlayerHealth);
  const completeTask = useQuestStore((state) => state.completeTask);

  const [attackCooldown, setAttackCooldown] = useState(false);
  const [message, setMessage] = useState<string>('');

  if (!combatState || !currentQuest) return null;

  // Find enemy entity
  const enemy = currentQuest.entities.find((e) => e.id === combatState.enemyId);
  const enemyName = enemy?.enemyData?.name || 'Enemy';
  const isBoss = enemy?.type === 'boss' || enemy?.enemyData?.isBoss;

  // Handle player attack
  const handleAttack = () => {
    if (attackCooldown || combatState.currentPhase !== 'playerTurn') return;

    setAttackCooldown(true);
    
    // Calculate damage (10-20)
    const damage = Math.floor(Math.random() * 11) + 10;
    const newEnemyHealth = Math.max(0, combatState.enemyHealth - damage);
    
    // Update combo
    const newCombo = combatState.combo + 1;
    
    setMessage(`You hit for ${damage} damage!`);
    
    // Update combat state
    updateCombat({
      enemyHealth: newEnemyHealth,
      combo: newCombo,
      lastHitTime: Date.now(),
    });

    // Check if enemy defeated
    if (newEnemyHealth <= 0) {
      setTimeout(() => {
        setMessage(`${enemyName} defeated!`);
        
        // Find and complete defeat task
        const defeatTask = currentQuest.tasks.find(
          (t) => t.type === 'defeat' && t.targetId === combatState.enemyId
        );
        
        if (defeatTask) {
          completeTask(defeatTask.id);
        }
        
        setTimeout(() => {
          endCombat(true);
        }, 1500);
      }, 500);
      
      return;
    }

    // Enemy turn
    setTimeout(() => {
      updateCombat({ currentPhase: 'enemyTurn' });
      
      setTimeout(() => {
        // Enemy attacks
        const enemyDamage = Math.floor(Math.random() * 11) + 5;
        const newPlayerHealth = Math.max(0, combatState.playerHealth - enemyDamage);
        
        setMessage(`${enemyName} hits you for ${enemyDamage} damage!`);
        updatePlayerHealth(newPlayerHealth);
        updateCombat({ 
          playerHealth: newPlayerHealth,
          currentPhase: 'playerTurn'
        });
        
        // Check if player defeated
        if (newPlayerHealth <= 0) {
          setTimeout(() => {
            setMessage('You have been defeated...');
            setTimeout(() => {
              endCombat(false);
              // TODO: Handle respawn
            }, 1500);
          }, 500);
          return;
        }
        
        setAttackCooldown(false);
      }, 1000);
    }, 800);
  };

  // Handle flee
  const handleFlee = () => {
    endCombat(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAttack();
      } else if (e.key === 'Escape') {
        handleFlee();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [attackCooldown, combatState.currentPhase]);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
      <div className="w-full max-w-2xl p-8">
        {/* Combat Arena */}
        <div className="bg-gradient-to-b from-red-950 to-black border-4 border-red-600 rounded-lg p-8 shadow-2xl">
          {/* Enemy Info */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-2xl font-bold ${isBoss ? 'text-red-400' : 'text-orange-400'}`}>
                {enemyName}
                {isBoss && <span className="ml-2 text-sm">👑 BOSS</span>}
              </h2>
              <div className="text-right">
                <div className="text-sm text-gray-400">HP</div>
                <div className="text-xl font-bold text-red-400">
                  {combatState.enemyHealth} / {enemy?.enemyData?.maxHp || 100}
                </div>
              </div>
            </div>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                style={{
                  width: `${(combatState.enemyHealth / (enemy?.enemyData?.maxHp || 100)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Message Area */}
          <div className="bg-black/50 rounded-lg p-4 mb-6 min-h-[60px] flex items-center justify-center">
            <p className="text-white text-lg text-center">{message || 'Battle Start!'}</p>
          </div>

          {/* Player Info */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-blue-400">You</h3>
              <div className="text-right">
                <div className="text-sm text-gray-400">HP</div>
                <div className="text-xl font-bold text-blue-400">
                  {combatState.playerHealth}
                </div>
              </div>
            </div>
            <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                style={{
                  width: `${combatState.playerHealth}%`,
                }}
              />
            </div>
          </div>

          {/* Combo Counter */}
          {combatState.combo > 0 && (
            <div className="text-center mb-4">
              <span className="text-yellow-400 font-bold text-xl">
                COMBO x{combatState.combo}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleAttack}
              disabled={attackCooldown || combatState.currentPhase !== 'playerTurn'}
              className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                attackCooldown || combatState.currentPhase !== 'playerTurn'
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transform hover:scale-105'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>⚔️</span>
                <span>ATTACK</span>
              </div>
              <div className="text-xs mt-1 opacity-70">SPACE</div>
            </button>

            <button
              onClick={handleFlee}
              className="py-4 px-6 rounded-lg font-bold text-lg bg-gray-700 text-white hover:bg-gray-600 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <span>🏃</span>
                <span>FLEE</span>
              </div>
              <div className="text-xs mt-1 opacity-70">ESC</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}