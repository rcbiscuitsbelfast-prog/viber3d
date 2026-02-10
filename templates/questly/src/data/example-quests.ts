/**
 * Example quests for testing
 * These can be loaded when a world starts in play mode
 */

import type { Objective, Trigger, Reward, Quest } from '../systems/quest/QuestLogic';
import { QuestLogicManager } from '../systems/quest/QuestLogic';

// Non-Combat Quest: Explore and Collect
export function createExplorationQuest(): Quest {
  const objectives: Objective[] = [
    {
      id: 'talk-to-npc-1',
      type: 'talk-to-npc',
      description: 'Talk to the village elder',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      required: true,
    },
    {
      id: 'collect-items-1',
      type: 'collect-items',
      description: 'Collect 3 health potions from the forest',
      targetCount: 3,
      currentCount: 0,
      completed: false,
      required: true,
    },
    {
      id: 'reach-location-1',
      type: 'reach-location',
      description: 'Find the ancient temple',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      required: true,
    },
  ];

  const rewards: Reward[] = [
    { type: 'xp', amount: 100 },
    { type: 'currency', amount: 50, currencyType: 'gold' },
  ];

  return QuestLogicManager.createQuest(objectives, [], rewards);
}

// Combat Quest: Defeat Enemies
export function createCombatQuest(): Quest {
  const objectives: Objective[] = [
    {
      id: 'kill-enemies-1',
      type: 'kill-enemies',
      description: 'Defeat 5 forest creatures',
      targetCount: 5,
      currentCount: 0,
      completed: false,
      required: true,
    },
    {
      id: 'defeat-boss-1',
      type: 'defeat-boss',
      description: 'Defeat the Forest Guardian',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      required: true,
    },
  ];

  const rewards: Reward[] = [
    { type: 'xp', amount: 250 },
    { type: 'currency', amount: 100, currencyType: 'gold' },
    { type: 'item', itemId: 'legendary_sword' },
  ];

  return QuestLogicManager.createQuest(objectives, [], rewards);
}

// Mixed Quest: Combat and Exploration
export function createMixedQuest(): Quest {
  const objectives: Objective[] = [
    {
      id: 'talk-to-npc-2',
      type: 'talk-to-npc',
      description: 'Talk to the blacksmith',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      required: true,
    },
    {
      id: 'kill-enemies-2',
      type: 'kill-enemies',
      description: 'Clear the path of 3 bandits',
      targetCount: 3,
      currentCount: 0,
      completed: false,
      required: true,
    },
    {
      id: 'collect-items-2',
      type: 'collect-items',
      description: 'Gather 2 iron ore',
      targetCount: 2,
      currentCount: 0,
      completed: false,
      required: false, // Optional
    },
    {
      id: 'interact-object-1',
      type: 'interact-with-object',
      description: 'Activate the ancient shrine',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      required: true,
    },
  ];

  const rewards: Reward[] = [
    { type: 'xp', amount: 150 },
    { type: 'currency', amount: 75, currencyType: 'gold' },
  ];

  return QuestLogicManager.createQuest(objectives, [], rewards);
}
