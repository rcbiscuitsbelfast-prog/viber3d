/**
 * CharacterStats - Character statistics and attributes system
 * Phase 5.1 - Character Customization
 */

export interface CharacterStats {
  // Core stats
  health: number;
  maxHealth: number;
  speed: number;
  jumpHeight: number;
  stamina: number;
  maxStamina: number;
  
  // Combat stats
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
  
  // Movement stats
  walkSpeed: number;
  runSpeed: number;
  sprintSpeed: number;
  crouchSpeed: number;
  
  // Physics stats
  mass: number;
  friction: number;
  airControl: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  modelPath: string;
  stats: CharacterStats;
  equipment?: Equipment;
  createdAt: string;
  updatedAt?: string;
}

export interface Equipment {
  weapon?: Item;
  armor?: Item[];
  accessories?: Item[];
  inventory?: Item[];
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'quest-item';
  stats?: Partial<CharacterStats>;
  description?: string;
  icon?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export class CharacterStatsManager {
  /**
   * Create default stats for a character
   */
  static createDefaultStats(): CharacterStats {
    return {
      health: 100,
      maxHealth: 100,
      speed: 5,
      jumpHeight: 5,
      stamina: 100,
      maxStamina: 100,
      attack: 10,
      defense: 5,
      critChance: 0.05,
      critDamage: 1.5,
      walkSpeed: 5,
      runSpeed: 8,
      sprintSpeed: 12,
      crouchSpeed: 2,
      mass: 1,
      friction: 0.8,
      airControl: 0.3,
    };
  }

  /**
   * Calculate final stats with equipment bonuses
   */
  static calculateFinalStats(baseStats: CharacterStats, equipment?: Equipment): CharacterStats {
    const finalStats = { ...baseStats };

    if (!equipment) return finalStats;

    // Apply weapon bonuses
    if (equipment.weapon?.stats) {
      Object.entries(equipment.weapon.stats).forEach(([key, value]) => {
        if (value !== undefined && key in finalStats) {
          (finalStats as any)[key] += value;
        }
      });
    }

    // Apply armor bonuses
    equipment.armor?.forEach((armor) => {
      if (armor.stats) {
        Object.entries(armor.stats).forEach(([key, value]) => {
          if (value !== undefined && key in finalStats) {
            (finalStats as any)[key] += value;
          }
        });
      }
    });

    // Apply accessory bonuses
    equipment.accessories?.forEach((accessory) => {
      if (accessory.stats) {
        Object.entries(accessory.stats).forEach(([key, value]) => {
          if (value !== undefined && key in finalStats) {
            (finalStats as any)[key] += value;
          }
        });
      }
    });

    return finalStats;
  }

  /**
   * Save character configuration
   */
  static saveCharacter(config: CharacterConfig): void {
    const saved = this.getSavedCharacters();
    const existingIndex = saved.findIndex((c) => c.id === config.id);

    const configToSave = {
      ...config,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      saved[existingIndex] = configToSave;
    } else {
      saved.push(configToSave);
    }

    localStorage.setItem('savedCharacters', JSON.stringify(saved));
  }

  /**
   * Get all saved characters
   */
  static getSavedCharacters(): CharacterConfig[] {
    const saved = localStorage.getItem('savedCharacters');
    return saved ? JSON.parse(saved) : [];
  }

  /**
   * Get character by ID
   */
  static getCharacter(id: string): CharacterConfig | null {
    const characters = this.getSavedCharacters();
    return characters.find((c) => c.id === id) || null;
  }

  /**
   * Delete character
   */
  static deleteCharacter(id: string): boolean {
    const characters = this.getSavedCharacters();
    const filtered = characters.filter((c) => c.id !== id);

    if (filtered.length < characters.length) {
      localStorage.setItem('savedCharacters', JSON.stringify(filtered));
      return true;
    }

    return false;
  }
}
