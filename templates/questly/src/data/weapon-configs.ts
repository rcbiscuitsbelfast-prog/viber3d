// Weapon configuration for KayKit models
// Each weapon type has position, rotation, and scale adjustments

export interface WeaponConfig {
  scale: number;
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] in radians
}

export interface ShieldConfig {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

// Weapon configurations - keyed by weapon path patterns
export const WEAPON_CONFIGS: Record<string, WeaponConfig> = {
  // Staff - working correctly, keep as is
  'staff': {
    scale: 0.6,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // Bows
  'bow': {
    scale: 0.5,
    position: [0.05, 0.1, 0],
    rotation: [Math.PI, Math.PI, 0], // Rotate 180 degrees on X and Y
  },
  
  // One-handed swords
  'sword_1handed': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // Two-handed swords
  'sword_2handed': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // Daggers
  'dagger': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // One-handed axes
  'axe_1handed': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // Two-handed axes
  'axe_2handed': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // Wands
  'wand': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
  
  // Crossbows
  'crossbow': {
    scale: 0.5,
    position: [0.05, 0.1, 0],
    rotation: [Math.PI, Math.PI, 0],
  },
  
  // Spellbooks
  'spellbook': {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  },
};

// Shield configurations
export const SHIELD_CONFIGS: Record<string, ShieldConfig> = {
  // Default shield config - increased size
  'default': {
    scale: 0.7, // Increased from 0.4
    position: [-0.05, 0, 0],
    rotation: [Math.PI, Math.PI, 0],
  },
  
  // Round shields
  'shield_round': {
    scale: 0.7,
    position: [-0.05, 0, 0],
    rotation: [Math.PI, Math.PI, 0],
  },
  
  // Square shields
  'shield_square': {
    scale: 0.7,
    position: [-0.05, 0, 0],
    rotation: [Math.PI, Math.PI, 0],
  },
  
  // Badge shields
  'shield_badge': {
    scale: 0.7,
    position: [-0.05, 0, 0],
    rotation: [Math.PI, Math.PI, 0],
  },
  
  // Spiked shields
  'shield_spikes': {
    scale: 0.7,
    position: [-0.05, 0, 0],
    rotation: [Math.PI, Math.PI, 0],
  },
};

// Helper function to get weapon config from path
export function getWeaponConfig(weaponPath: string): WeaponConfig {
  // Check localStorage for saved custom configs first
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem(`weapon_config_${weaponPath}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved weapon config:', e);
      }
    }
  }
  
  const pathLower = weaponPath.toLowerCase();
  
  // Check for exact matches first
  for (const [key, config] of Object.entries(WEAPON_CONFIGS)) {
    if (pathLower.includes(key)) {
      return config;
    }
  }
  
  // Default fallback
  return {
    scale: 0.5,
    position: [0.05, 0, 0],
    rotation: [0, 0, Math.PI / 4],
  };
}

// Helper function to get shield config from path
export function getShieldConfig(shieldPath: string): ShieldConfig {
  // Check localStorage for saved custom configs first
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem(`shield_config_${shieldPath}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        return parsed;
      } catch (e) {
        console.warn('Failed to parse saved shield config:', e);
      }
    }
  }
  
  const pathLower = shieldPath.toLowerCase();
  
  // Check for exact matches first
  for (const [key, config] of Object.entries(SHIELD_CONFIGS)) {
    if (pathLower.includes(key)) {
      return config;
    }
  }
  
  // Default fallback
  return SHIELD_CONFIGS['default'];
}
