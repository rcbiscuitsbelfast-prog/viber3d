// src/store/questStore.ts
import { create } from 'zustand';
import { Quest, PlayerState, QuestSession, CombatState, Task } from '../types/quest.types';
import * as THREE from 'three';

interface QuestStore {
  // Current Quest Data
  currentQuest: Quest | null;
  questSession: QuestSession | null;
  
  // Player State
  playerState: PlayerState | null;
  
  // Combat State
  combatState: CombatState | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  showReward: boolean;
  activeDialogue: string[] | null;
  activeNPCId: string | null;
  
  // Actions
  setCurrentQuest: (quest: Quest) => void;
  startQuestSession: (questId: string, playerId: string) => void;
  updatePlayerPosition: (position: THREE.Vector3) => void;
  updatePlayerHealth: (health: number) => void;
  addToInventory: (itemId: string) => void;
  removeFromInventory: (itemId: string) => void;
  completeTask: (taskId: string) => void;
  fireTrigger: (triggerId: string) => void;
  startCombat: (enemyId: string, enemyHealth: number) => void;
  updateCombat: (updates: Partial<CombatState>) => void;
  endCombat: (victory: boolean) => void;
  showDialogue: (npcId: string, dialogue: string[]) => void;
  hideDialogue: () => void;
  completeQuest: () => void;
  resetQuest: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  // Initial State
  currentQuest: null,
  questSession: null,
  playerState: null,
  combatState: null,
  isLoading: false,
  error: null,
  showReward: false,
  activeDialogue: null,
  activeNPCId: null,

  // Actions
  setCurrentQuest: (quest) => {
    set({ currentQuest: quest });
  },

  startQuestSession: (questId, playerId) => {
    const quest = get().currentQuest;
    if (!quest) {
      console.error('Cannot start session: No quest loaded');
      return;
    }

    const session: QuestSession = {
      questId,
      playerId,
      startedAt: Date.now(),
      isCompleted: false,
      playTime: 0,
      playerState: {
        position: quest.environment.spawnPoint,
        rotation: new THREE.Vector3(0, 0, 0),
        health: 100,
        maxHealth: 100,
        inventory: [],
        completedTasks: [],
        firedTriggers: [],
        questStartTime: Date.now(),
      },
    };

    set({
      questSession: session,
      playerState: session.playerState,
    });
  },

  updatePlayerPosition: (position) => {
    set((state) => {
      if (!state.playerState) return state;
      return {
        playerState: {
          ...state.playerState,
          position,
        },
      };
    });
  },

  updatePlayerHealth: (health) => {
    set((state) => {
      if (!state.playerState) return state;
      return {
        playerState: {
          ...state.playerState,
          health: Math.max(0, Math.min(health, state.playerState.maxHealth)),
        },
      };
    });
  },

  addToInventory: (itemId) => {
    set((state) => {
      if (!state.playerState) return state;
      
      // Prevent duplicates
      if (state.playerState.inventory.includes(itemId)) {
        return state;
      }

      return {
        playerState: {
          ...state.playerState,
          inventory: [...state.playerState.inventory, itemId],
        },
      };
    });
  },

  removeFromInventory: (itemId) => {
    set((state) => {
      if (!state.playerState) return state;
      return {
        playerState: {
          ...state.playerState,
          inventory: state.playerState.inventory.filter((id) => id !== itemId),
        },
      };
    });
  },

  completeTask: (taskId) => {
    set((state) => {
      if (!state.playerState || !state.currentQuest) return state;

      // Check if already completed
      if (state.playerState.completedTasks.includes(taskId)) {
        return state;
      }

      // Find and update the task
      const updatedQuest = {
        ...state.currentQuest,
        tasks: state.currentQuest.tasks.map((task) =>
          task.id === taskId ? { ...task, isCompleted: true } : task
        ),
      };

      return {
        currentQuest: updatedQuest,
        playerState: {
          ...state.playerState,
          completedTasks: [...state.playerState.completedTasks, taskId],
        },
      };
    });
  },

  fireTrigger: (triggerId) => {
    set((state) => {
      if (!state.playerState) return state;

      // Check if already fired
      if (state.playerState.firedTriggers.includes(triggerId)) {
        return state;
      }

      return {
        playerState: {
          ...state.playerState,
          firedTriggers: [...state.playerState.firedTriggers, triggerId],
        },
      };
    });
  },

  startCombat: (enemyId, enemyHealth) => {
    const playerState = get().playerState;
    if (!playerState) return;

    set({
      combatState: {
        isActive: true,
        enemyId,
        enemyHealth,
        playerHealth: playerState.health,
        currentPhase: 'playerTurn',
        combo: 0,
        lastHitTime: Date.now(),
      },
    });
  },

  updateCombat: (updates) => {
    set((state) => {
      if (!state.combatState) return state;
      return {
        combatState: {
          ...state.combatState,
          ...updates,
        },
      };
    });
  },

  endCombat: (victory) => {
    const state = get();
    
    if (victory && state.combatState) {
      // Mark enemy as defeated
      const enemyId = state.combatState.enemyId;
      
      // Update quest to mark enemy entity as defeated
      if (state.currentQuest) {
        const updatedQuest = {
          ...state.currentQuest,
          entities: state.currentQuest.entities.map((entity) => {
            if (entity.id === enemyId && entity.enemyData) {
              return {
                ...entity,
                enemyData: {
                  ...entity.enemyData,
                  hp: 0,
                },
              };
            }
            return entity;
          }),
        };
        
        set({ currentQuest: updatedQuest });
      }
    }

    set({ combatState: null });
  },

  showDialogue: (npcId, dialogue) => {
    set({
      activeNPCId: npcId,
      activeDialogue: dialogue,
    });
  },

  hideDialogue: () => {
    set({
      activeNPCId: null,
      activeDialogue: null,
    });
  },

  completeQuest: () => {
    const state = get();
    
    if (!state.questSession) return;

    const completedSession: QuestSession = {
      ...state.questSession,
      isCompleted: true,
      completedAt: Date.now(),
      playTime: Date.now() - state.questSession.startedAt,
    };

    set({
      questSession: completedSession,
      showReward: true,
    });

    // TODO: Send analytics event to backend
    console.log('Quest completed!', {
      questId: state.currentQuest?.id,
      playTime: completedSession.playTime,
    });
  },

  resetQuest: () => {
    set({
      currentQuest: null,
      questSession: null,
      playerState: null,
      combatState: null,
      showReward: false,
      activeDialogue: null,
      activeNPCId: null,
      error: null,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },
}));

// Selector hooks for better performance
export const useCurrentQuest = () => useQuestStore((state) => state.currentQuest);
export const usePlayerState = () => useQuestStore((state) => state.playerState);
export const useCombatState = () => useQuestStore((state) => state.combatState);
export const useActiveDialogue = () => useQuestStore((state) => state.activeDialogue);
export const useQuestActions = () => useQuestStore((state) => ({
  setCurrentQuest: state.setCurrentQuest,
  startQuestSession: state.startQuestSession,
  updatePlayerPosition: state.updatePlayerPosition,
  updatePlayerHealth: state.updatePlayerHealth,
  addToInventory: state.addToInventory,
  completeTask: state.completeTask,
  startCombat: state.startCombat,
  updateCombat: state.updateCombat,
  endCombat: state.endCombat,
  showDialogue: state.showDialogue,
  hideDialogue: state.hideDialogue,
  completeQuest: state.completeQuest,
  resetQuest: state.resetQuest,
}));