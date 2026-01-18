export interface Entity {
  id: string;
  name: string;
  type: 'npc' | 'item' | 'object';
}

export interface Task {
  id: string;
  description: string;
  type: 'interact' | 'collect' | 'defeat';
  isCompleted: boolean;
}

export interface Trigger {
  id: string;
  type: string;
}

export interface Reward {
  type: 'coins' | 'item' | 'xp';
  amount: number;
}

export interface Quest {
  id: string;
  ownerId: string;
  title: string;
  templateWorld: 'forest' | 'meadow' | 'town';
  gameplayStyle: 'combat' | 'nonCombat' | 'mixed';
  createdAt: Date;
  expiresAt: Date | null;
  isPublished: boolean;
  
  entities: Entity[];
  tasks: Task[];
  triggers: Trigger[];
  reward: Reward;
  
  analytics: {
    plays: number;
    completions: number;
  };
}
