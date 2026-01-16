import { EntityType } from './quest.types';

export interface AssetDefinition {
  id: string;
  name: string;
  assetId: string;
  thumbnail: string;
  type: EntityType;
  defaultStats?: {
    hp?: number;
    maxHp?: number;
    attackDamage?: number;
    attackSpeed?: number;
    attackPattern?: 'tap' | 'timing' | 'dodge';
    isBoss?: boolean;
  };
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: string;
  assets: AssetDefinition[];
}
