/**
 * QuestLogic - Quest objectives, triggers, and state machine
 * Phase 6.2 - Quest Logic System
 */

export type QuestState = 'not-started' | 'in-progress' | 'completed' | 'failed';

export type ObjectiveType = 
  | 'kill-enemies'
  | 'collect-items'
  | 'reach-location'
  | 'talk-to-npc'
  | 'interact-with-object'
  | 'defeat-boss'
  | 'solve-puzzle'
  | 'survive-time';

export type TriggerType =
  | 'on-enter-area'
  | 'on-interact'
  | 'on-kill'
  | 'on-collect'
  | 'on-complete-objective'
  | 'on-quest-start'
  | 'on-quest-complete';

export interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  required?: boolean; // If false, optional objective
  rewards?: Reward[];
}

export interface Trigger {
  id: string;
  type: TriggerType;
  targetId?: string; // ID of entity/area/object
  condition?: (quest: Quest) => boolean;
  actions: TriggerAction[];
}

export interface TriggerAction {
  type: 'start-objective' | 'complete-objective' | 'fail-quest' | 'complete-quest' | 'spawn-entity' | 'show-dialogue';
  targetId?: string;
  data?: any;
}

export interface Reward {
  type: 'xp' | 'item' | 'currency' | 'unlock';
  amount?: number;
  itemId?: string;
  currencyType?: 'gold' | 'silver' | 'bronze';
}

export interface Quest {
  id: string;
  state: QuestState;
  objectives: Objective[];
  triggers: Trigger[];
  rewards: Reward[];
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

export class QuestLogicManager {
  /**
   * Create a new quest
   */
  static createQuest(objectives: Objective[], triggers: Trigger[] = [], rewards: Reward[] = []): Quest {
    return {
      id: `quest_${Date.now()}`,
      state: 'not-started',
      objectives: objectives.map((obj) => ({
        ...obj,
        currentCount: 0,
        completed: false,
      })),
      triggers,
      rewards,
    };
  }

  /**
   * Start a quest
   */
  static startQuest(quest: Quest): Quest {
    if (quest.state !== 'not-started') {
      return quest;
    }

    const updated = {
      ...quest,
      state: 'in-progress' as QuestState,
      startedAt: new Date().toISOString(),
    };

    // Execute start triggers
    this.executeTriggers(updated, 'on-quest-start');

    return updated;
  }

  /**
   * Update objective progress
   */
  static updateObjective(quest: Quest, objectiveId: string, increment: number = 1): Quest {
    if (quest.state !== 'in-progress') {
      return quest;
    }

    const updated = { ...quest };
    const objective = updated.objectives.find((obj) => obj.id === objectiveId);

    if (!objective || objective.completed) {
      return quest;
    }

    objective.currentCount = Math.min(objective.currentCount + increment, objective.targetCount);
    objective.completed = objective.currentCount >= objective.targetCount;

    // Check if quest is complete
    const allRequiredCompleted = updated.objectives
      .filter((obj) => obj.required !== false)
      .every((obj) => obj.completed);

    if (allRequiredCompleted) {
      updated.state = 'completed';
      updated.completedAt = new Date().toISOString();
      this.executeTriggers(updated, 'on-quest-complete');
    }

    // Execute objective completion triggers
    if (objective.completed) {
      this.executeTriggers(updated, 'on-complete-objective', objectiveId);
    }

    return updated;
  }

  /**
   * Fail a quest
   */
  static failQuest(quest: Quest, reason?: string): Quest {
    if (quest.state === 'completed') {
      return quest;
    }

    const updated = {
      ...quest,
      state: 'failed' as QuestState,
      failedAt: new Date().toISOString(),
    };

    return updated;
  }

  /**
   * Execute triggers
   */
  static executeTriggers(quest: Quest, triggerType: TriggerType, targetId?: string): void {
    const triggers = quest.triggers.filter(
      (trigger) => trigger.type === triggerType && (!targetId || trigger.targetId === targetId)
    );

    triggers.forEach((trigger) => {
      // Check condition if present
      if (trigger.condition && !trigger.condition(quest)) {
        return;
      }

      // Execute actions
      trigger.actions.forEach((action) => {
        this.executeAction(quest, action);
      });
    });
  }

  /**
   * Execute a trigger action
   */
  static executeAction(quest: Quest, action: TriggerAction): void {
    switch (action.type) {
      case 'start-objective':
        if (action.targetId) {
          const objective = quest.objectives.find((obj) => obj.id === action.targetId);
          if (objective && !objective.completed) {
            // Objective is already tracked, just ensure it's active
          }
        }
        break;

      case 'complete-objective':
        if (action.targetId) {
          const objective = quest.objectives.find((obj) => obj.id === action.targetId);
          if (objective) {
            objective.currentCount = objective.targetCount;
            objective.completed = true;
          }
        }
        break;

      case 'complete-quest':
        quest.state = 'completed';
        quest.completedAt = new Date().toISOString();
        break;

      case 'fail-quest':
        quest.state = 'failed';
        quest.failedAt = new Date().toISOString();
        break;

      case 'spawn-entity':
        // This would be handled by the game engine
        console.log('[QuestLogic] Spawn entity:', action.data);
        break;

      case 'show-dialogue':
        // This would be handled by the UI system
        console.log('[QuestLogic] Show dialogue:', action.data);
        break;
    }
  }

  /**
   * Get quest progress percentage
   */
  static getProgress(quest: Quest): number {
    if (quest.objectives.length === 0) return 0;

    const total = quest.objectives.length;
    const completed = quest.objectives.filter((obj) => obj.completed).length;

    return (completed / total) * 100;
  }

  /**
   * Get completed objectives count
   */
  static getCompletedCount(quest: Quest): number {
    return quest.objectives.filter((obj) => obj.completed).length;
  }

  /**
   * Check if quest can be completed
   */
  static canComplete(quest: Quest): boolean {
    return (
      quest.state === 'in-progress' &&
      quest.objectives.filter((obj) => obj.required !== false).every((obj) => obj.completed)
    );
  }
}
