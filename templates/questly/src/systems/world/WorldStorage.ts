/**
 * WorldStorage - LocalStorage persistence for world configurations
 * Phase 4.1 - Save/Load System
 */

import { WorldConfig } from './WorldConfig';
import { exportWorldConfigToJSON } from './WorldExporter';
import { importWorldConfigFromJSON } from './WorldImporter';
import type { WorldState } from './WorldExporter';

const STORAGE_KEY_PREFIX = 'questly_world_';
const AUTO_SAVE_KEY = 'questly_world_autosave';
const SAVED_WORLDS_KEY = 'questly_saved_worlds';

export interface SavedWorldMetadata {
  id: string;
  name: string;
  timestamp: string;
  thumbnail?: string; // Future: base64 thumbnail
}

/**
 * Save world to localStorage with auto-save key
 */
export function saveWorldToLocalStorage(state: WorldState, isAutoSave: boolean = false): void {
  try {
    const json = exportWorldConfigToJSON(state, false);
    const key = isAutoSave ? AUTO_SAVE_KEY : `${STORAGE_KEY_PREFIX}${Date.now()}`;
    localStorage.setItem(key, json);
    
    // Update saved worlds list
    if (!isAutoSave) {
      updateSavedWorldsList(key, state.name || `World ${new Date().toLocaleString()}`);
    }
    
    console.log(`[WorldStorage] World saved to localStorage: ${key}`);
  } catch (error) {
    console.error('[WorldStorage] Failed to save world:', error);
    throw error;
  }
}

/**
 * Load world from localStorage
 */
export function loadWorldFromLocalStorage(key: string): WorldConfig | null {
  try {
    const json = localStorage.getItem(key);
    if (!json) {
      return null;
    }
    return importWorldConfigFromJSON(json);
  } catch (error) {
    console.error('[WorldStorage] Failed to load world:', error);
    return null;
  }
}

/**
 * Load auto-saved world
 */
export function loadAutoSavedWorld(): WorldConfig | null {
  return loadWorldFromLocalStorage(AUTO_SAVE_KEY);
}

/**
 * Delete world from localStorage
 */
export function deleteWorldFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    removeFromSavedWorldsList(key);
    console.log(`[WorldStorage] World deleted: ${key}`);
  } catch (error) {
    console.error('[WorldStorage] Failed to delete world:', error);
  }
}

/**
 * Get all saved world keys
 */
export function getSavedWorldKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys.sort().reverse(); // Most recent first
}

/**
 * Get saved worlds metadata list
 */
export function getSavedWorldsMetadata(): SavedWorldMetadata[] {
  try {
    const json = localStorage.getItem(SAVED_WORLDS_KEY);
    if (!json) return [];
    const list = JSON.parse(json) as SavedWorldMetadata[];
    // Filter out worlds that no longer exist
    return list.filter(meta => localStorage.getItem(meta.id) !== null);
  } catch (error) {
    console.error('[WorldStorage] Failed to get saved worlds list:', error);
    return [];
  }
}

/**
 * Update saved worlds list
 */
function updateSavedWorldsList(key: string, name: string): void {
  try {
    const list = getSavedWorldsMetadata();
    const existing = list.findIndex(meta => meta.id === key);
    const metadata: SavedWorldMetadata = {
      id: key,
      name,
      timestamp: new Date().toISOString(),
    };
    
    if (existing >= 0) {
      list[existing] = metadata;
    } else {
      list.unshift(metadata); // Add to beginning
    }
    
    // Keep only last 50 saved worlds
    const trimmed = list.slice(0, 50);
    localStorage.setItem(SAVED_WORLDS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[WorldStorage] Failed to update saved worlds list:', error);
  }
}

/**
 * Remove from saved worlds list
 */
function removeFromSavedWorldsList(key: string): void {
  try {
    const list = getSavedWorldsMetadata();
    const filtered = list.filter(meta => meta.id !== key);
    localStorage.setItem(SAVED_WORLDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[WorldStorage] Failed to remove from saved worlds list:', error);
  }
}

/**
 * Clear all saved worlds (except auto-save)
 */
export function clearAllSavedWorlds(): void {
  const keys = getSavedWorldKeys();
  keys.forEach(key => deleteWorldFromLocalStorage(key));
  localStorage.removeItem(SAVED_WORLDS_KEY);
}

/**
 * Get storage size estimate (in bytes)
 */
export function getStorageSizeEstimate(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(STORAGE_KEY_PREFIX) || key === AUTO_SAVE_KEY || key === SAVED_WORLDS_KEY)) {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    }
  }
  return total;
}
