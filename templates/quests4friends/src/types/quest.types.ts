import { Vector3 } from 'three';

/**
 * Quest Data Model - Main structure for a quest
 */
export interface Quest {
  id: string;
  ownerId: string;
  title: string;
  templateWorld: 'forest' | 'meadow' | 'town';
  gameplayStyle: 'combat' | 'nonCombat' | 'mixed';
  createdAt: number;
  expiresAt: number | null;
  isPremium: boolean;

  environment: QuestEnvironment;
  entities: Entity[];
  tasks: Task[];
  triggers: Trigger[];
  reward: Reward;

  limits: {
    maxRecipients: number;
  };

  analytics: {
    plays: number;
    completions: number;
  };
}

/**
 * Environment configuration
 */
export interface QuestEnvironment {
  seed: number;
  spawnPoint: Vector3;
  ambientLight: {
    color: string;
    intensity: number;
  };
  directionalLight?: {
    color: string;
    intensity: number;
    position: Vector3;
  };
}

/**
 * Entity types and data structures
 */
export type EntityType = 'npc' | 'enemy' | 'object' | 'collectible' | 'boss';

export interface Entity {
  id: string;
  type: EntityType;
  assetId: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;

  // Type-specific data
  npcData?: NPCData;
  enemyData?: EnemyData;
  collectibleData?: CollectibleData;
}

export interface NPCData {
  name?: string;
  dialog: string[];
  voiceUrl?: string;
  animation?: string;
  interactionRadius?: number;
}

export interface EnemyData {
  name?: string;
  hp: number;
  maxHp: number;
  attackPattern: 'tap' | 'timing' | 'dodge';
  attackDamage: number;
  attackSpeed: number; // attacks per second
  isBoss?: boolean;
}

export interface CollectibleData {
  name?: string;
  collected?: boolean;
  autoCollect?: boolean;
  collectionRadius?: number;
}

/**
 * Task System - Quest objectives
 */
export type TaskType = 'collect' | 'puzzle' | 'defeat' | 'interact' | 'reach';

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  targetId?: string; // Entity ID
  targetAssetId?: string; // Asset ID for collection tasks
  requiredCount?: number;
  currentCount?: number;
  isOptional: boolean;
  isCompleted: boolean;
  order: number; // Task sequence
}

/**
 * Trigger System - Event-driven actions
 */
export type TriggerEvent = 'onEnter' | 'onInteract' | 'onTaskComplete' | 'onEnemyDefeat';

export interface Trigger {
  id: string;
  event: TriggerEvent;
  sourceId?: string; // Entity ID or Task ID
  condition?: TriggerCondition;
  actions: TriggerAction[];
  fired?: boolean; // Track if trigger has been activated
}

export interface TriggerCondition {
  type: 'taskComplete' | 'allTasksComplete' | 'hasItem' | 'enemyDefeated';
  value?: any;
}

export type TriggerActionType = 
  | 'playAudio' 
  | 'showText' 
  | 'spawnEntity' 
  | 'unlockReward' 
  | 'playAnimation'
  | 'changeMusic';

export interface TriggerAction {
  type: TriggerActionType;
  payload: any;
  delay?: number; // milliseconds
}

/**
 * Reward System - Final reveal
 */
export type RewardType = 'text' | 'audio' | 'image' | 'link' | 'video';

export interface Reward {
  type: RewardType;
  payloadUrl?: string;
  payloadText?: string;
  revealStyle: 'chest' | 'npc' | 'portal' | 'door';
  title?: string;
  message?: string;
}

/**
 * Player State - Runtime state during quest play
 */
export interface PlayerState {
  position: Vector3;
  rotation: Vector3;
  health: number;
  maxHealth: number;
  inventory: string[]; // Asset IDs or item IDs
  completedTasks: string[]; // Task IDs
  firedTriggers: string[]; // Trigger IDs
  questStartTime: number;
  currentCheckpoint?: Vector3;
}

/**
 * Quest Session - Active play session
 */
export interface QuestSession {
  questId: string;
  playerId: string;
  startedAt: number;
  playerState: PlayerState;
  isCompleted: boolean;
  completedAt?: number;
  playTime: number; // milliseconds
}

/**
 * Combat State - For combat encounters
 */
export interface CombatState {
  isActive: boolean;
  enemyId: string;
  enemyHealth: number;
  playerHealth: number;
  currentPhase: 'idle' | 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat';
  combo: number;
  lastHitTime: number;
}
