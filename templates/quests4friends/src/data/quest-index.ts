import { Quest } from '../types/quest.types';

/**
 * Quest Index - Registry of available quests in the system
 * Add new quests here to make them accessible in the app
 */

import forestForagerQuest from './demo-quest-forest-forager.json';

export interface QuestIndexItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  questData: Quest;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  isFeatured: boolean;
}

export const questIndex: QuestIndexItem[] = [
  {
    id: 'demo-forest-forager',
    title: 'Forest Forager',
    description: 'Help the Forest Keeper gather potion ingredients. A peaceful adventure of exploration and discovery.',
    thumbnailUrl: '/thumbnails/forest-forager.jpg',
    questData: forestForagerQuest as Quest,
    tags: ['demo', 'non-combat', 'collection', 'beginner-friendly'],
    difficulty: 'beginner',
    estimatedDuration: '3-5 minutes',
    isFeatured: true
  }
];

/**
 * Get quest by ID
 */
export function getQuest(id: string): Quest | null {
  const questItem = questIndex.find(item => item.id === id);
  return questItem?.questData || null;
}

/**
 * Get featured quests for the homepage
 */
export function getFeaturedQuests(): QuestIndexItem[] {
  return questIndex.filter(item => item.isFeatured);
}

/**
 * Get quests by tag
 */
export function getQuestsByTag(tag: string): QuestIndexItem[] {
  return questIndex.filter(item => item.tags.includes(tag));
}