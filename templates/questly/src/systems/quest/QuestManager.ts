/**
 * QuestManager - Manages quest data and world associations
 * Phase 4.4 - Quest Flow Integration
 */

import type { WorldState } from '../world/WorldExporter';

export interface QuestConfig {
  id?: string;
  questType: 'combat' | 'non-combat';
  templateId?: string;
  templateName?: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  victoryCondition: string;
  rewards: string[];
  tags: string[];
  worldConfigId?: string; // Reference to saved world config
  worldState?: WorldState; // Embedded world state (optional)
  createdAt: string;
  updatedAt?: string;
  isPublished?: boolean;
}

export class QuestManager {
  /**
   * Create a new quest configuration
   */
  static createQuest(config: Partial<QuestConfig>): QuestConfig {
    return {
      id: `quest_${Date.now()}`,
      questType: 'non-combat',
      title: '',
      description: '',
      difficulty: 'Medium',
      victoryCondition: '',
      rewards: [],
      tags: [],
      createdAt: new Date().toISOString(),
      ...config,
    };
  }

  /**
   * Save quest to localStorage
   */
  static saveQuest(quest: QuestConfig): void {
    const savedQuests = this.getSavedQuests();
    const existingIndex = quest.id ? savedQuests.findIndex((q) => q.id === quest.id) : -1;

    const questToSave = {
      ...quest,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      savedQuests[existingIndex] = questToSave;
    } else {
      savedQuests.push(questToSave);
    }

    localStorage.setItem('savedQuests', JSON.stringify(savedQuests));
  }

  /**
   * Get all saved quests
   */
  static getSavedQuests(): QuestConfig[] {
    const saved = localStorage.getItem('savedQuests');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Get quest by ID
   */
  static getQuest(id: string): QuestConfig | null {
    const quests = this.getSavedQuests();
    return quests.find((q) => q.id === id) || null;
  }

  /**
   * Delete quest
   */
  static deleteQuest(id: string): boolean {
    const quests = this.getSavedQuests();
    const filtered = quests.filter((q) => q.id !== id);
    
    if (filtered.length < quests.length) {
      localStorage.setItem('savedQuests', JSON.stringify(filtered));
      return true;
    }
    
    return false;
  }

  /**
   * Link world config to quest
   */
  static linkWorldToQuest(questId: string, worldConfigId: string): void {
    const quest = this.getQuest(questId);
    if (quest) {
      quest.worldConfigId = worldConfigId;
      this.saveQuest(quest);
    }
  }

  /**
   * Embed world state in quest (for standalone quests)
   */
  static embedWorldInQuest(questId: string, worldState: WorldState): void {
    const quest = this.getQuest(questId);
    if (quest) {
      quest.worldState = worldState;
      this.saveQuest(quest);
    }
  }
}
