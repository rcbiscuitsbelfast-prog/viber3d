/**
 * UI Mode Store - Controls which UI mode is active
 * 
 * Modes:
 * - PLAYER_FREE: Free tier user (most restricted)
 * - PLAYER_CREATOR: Creator tier user
 * - PLAYER_PRO: Pro tier user
 * - SUPERUSER: Internal authoring mode (no restrictions)
 * 
 * IMPORTANT: UI mode only affects visible controls.
 * Scene/world data does NOT change when switching modes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type UIMode = 'PLAYER_FREE' | 'PLAYER_CREATOR' | 'PLAYER_PRO' | 'SUPERUSER';

export interface UIFeatureConfig {
  // Terrain tools
  terrainSculpting: boolean;
  pathTool: boolean;
  gridSnap: boolean;
  heightPresets: boolean;
  
  // Asset placement
  maxBuildingAreas: number;
  maxNPCs: number;
  maxEnemies: number;
  maxBuildings: number;
  advancedNPCSettings: boolean;
  
  // Mini-games
  miniGamePresets: boolean;
  miniGameNumericOverrides: boolean;
  
  // Audio
  maxAudioSeconds: number;
  customTTS: boolean;
  
  // Performance
  maxMeshCount: number;
  performanceDebugPanel: boolean;
  bypassBudgets: boolean;
  
  // Publishing
  canPublish: boolean;
  canExportTemplate: boolean;
}

export interface UIModeState {
  // Current mode
  currentMode: UIMode;
  
  // Cached feature config (computed from mode)
  features: UIFeatureConfig;
  
  // Is superuser mode unlocked (requires secret)
  superuserUnlocked: boolean;
  
  // Actions
  setMode: (mode: UIMode) => void;
  unlockSuperuser: (secret: string) => boolean;
  lockSuperuser: () => void;
  
  // Feature checks
  canUseFeature: (feature: keyof UIFeatureConfig) => boolean;
  getFeatureLimit: (feature: keyof UIFeatureConfig) => number;
  isFeatureEnabled: (feature: keyof UIFeatureConfig) => boolean;
}

// ============================================================================
// FEATURE CONFIGURATIONS BY MODE
// ============================================================================

const FEATURE_CONFIGS: Record<UIMode, UIFeatureConfig> = {
  PLAYER_FREE: {
    terrainSculpting: false,
    pathTool: false,
    gridSnap: false,
    heightPresets: false,
    maxBuildingAreas: 1,
    maxNPCs: 2,
    maxEnemies: 3,
    maxBuildings: 5,
    advancedNPCSettings: false,
    miniGamePresets: false,
    miniGameNumericOverrides: false,
    maxAudioSeconds: 30,
    customTTS: false,
    maxMeshCount: 300,
    performanceDebugPanel: false,
    bypassBudgets: false,
    canPublish: false,
    canExportTemplate: false,
  },
  
  PLAYER_CREATOR: {
    terrainSculpting: true,
    pathTool: true,
    gridSnap: true,
    heightPresets: false,
    maxBuildingAreas: 3,
    maxNPCs: 10,
    maxEnemies: 15,
    maxBuildings: 25,
    advancedNPCSettings: false,
    miniGamePresets: true,
    miniGameNumericOverrides: false,
    maxAudioSeconds: 120,
    customTTS: true,
    maxMeshCount: 500,
    performanceDebugPanel: false,
    bypassBudgets: false,
    canPublish: true,
    canExportTemplate: false,
  },
  
  PLAYER_PRO: {
    terrainSculpting: true,
    pathTool: true,
    gridSnap: true,
    heightPresets: true,
    maxBuildingAreas: 10,
    maxNPCs: 50,
    maxEnemies: 50,
    maxBuildings: 100,
    advancedNPCSettings: true,
    miniGamePresets: true,
    miniGameNumericOverrides: true,
    maxAudioSeconds: 600,
    customTTS: true,
    maxMeshCount: 800,
    performanceDebugPanel: true,
    bypassBudgets: false,
    canPublish: true,
    canExportTemplate: true,
  },
  
  SUPERUSER: {
    terrainSculpting: true,
    pathTool: true,
    gridSnap: true,
    heightPresets: true,
    maxBuildingAreas: 999,
    maxNPCs: 999,
    maxEnemies: 999,
    maxBuildings: 999,
    advancedNPCSettings: true,
    miniGamePresets: true,
    miniGameNumericOverrides: true,
    maxAudioSeconds: 9999,
    customTTS: true,
    maxMeshCount: 9999,
    performanceDebugPanel: true,
    bypassBudgets: true, // Superuser sees warnings but can exceed
    canPublish: true,
    canExportTemplate: true,
  },
};

// Secret code to unlock superuser mode
const SUPERUSER_SECRET = 'questly-founder-2026';

// ============================================================================
// STORE
// ============================================================================

export const useUIModeStore = create<UIModeState>()(
  persist(
    (set, get) => ({
      currentMode: 'PLAYER_FREE',
      features: FEATURE_CONFIGS.PLAYER_FREE,
      superuserUnlocked: false,
      
      setMode: (mode: UIMode) => {
        // Cannot set SUPERUSER unless unlocked
        if (mode === 'SUPERUSER' && !get().superuserUnlocked) {
          console.warn('[UIModeStore] Cannot set SUPERUSER mode - not unlocked');
          return;
        }
        
        set({
          currentMode: mode,
          features: FEATURE_CONFIGS[mode],
        });
        
        console.log(`[UIModeStore] Mode changed to: ${mode}`);
      },
      
      unlockSuperuser: (secret: string) => {
        if (secret === SUPERUSER_SECRET) {
          set({ superuserUnlocked: true });
          console.log('[UIModeStore] Superuser mode unlocked');
          return true;
        }
        console.warn('[UIModeStore] Invalid superuser secret');
        return false;
      },
      
      lockSuperuser: () => {
        const state = get();
        set({ 
          superuserUnlocked: false,
          currentMode: state.currentMode === 'SUPERUSER' ? 'PLAYER_FREE' : state.currentMode,
          features: state.currentMode === 'SUPERUSER' ? FEATURE_CONFIGS.PLAYER_FREE : state.features,
        });
      },
      
      canUseFeature: (feature: keyof UIFeatureConfig) => {
        const value = get().features[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value > 0;
        return false;
      },
      
      getFeatureLimit: (feature: keyof UIFeatureConfig) => {
        const value = get().features[feature];
        if (typeof value === 'number') return value;
        return 0;
      },
      
      isFeatureEnabled: (feature: keyof UIFeatureConfig) => {
        return get().features[feature] === true;
      },
    }),
    {
      name: 'questly-ui-mode',
      partialize: (state) => ({
        // Only persist superuserUnlocked, not current mode
        superuserUnlocked: state.superuserUnlocked,
      }),
    }
  )
);

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useUIMode(): UIMode {
  return useUIModeStore((state) => state.currentMode);
}

export function useIsSuperuser(): boolean {
  return useUIModeStore((state) => state.currentMode === 'SUPERUSER');
}

export function useFeatureConfig(): UIFeatureConfig {
  return useUIModeStore((state) => state.features);
}

export function useCanUseFeature(feature: keyof UIFeatureConfig): boolean {
  return useUIModeStore((state) => state.canUseFeature(feature));
}

// ============================================================================
// MODE DISPLAY NAMES
// ============================================================================

export const UI_MODE_LABELS: Record<UIMode, string> = {
  PLAYER_FREE: 'Free Tier',
  PLAYER_CREATOR: 'Creator Tier',
  PLAYER_PRO: 'Pro Tier',
  SUPERUSER: '🔧 Superuser',
};

export const UI_MODE_DESCRIPTIONS: Record<UIMode, string> = {
  PLAYER_FREE: 'Basic building tools with limited assets',
  PLAYER_CREATOR: 'Extended tools and more assets',
  PLAYER_PRO: 'Full access to all building features',
  SUPERUSER: 'Internal authoring mode - all restrictions bypassed',
};
