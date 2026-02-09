/**
 * CharacterPresets.ts
 * Save and load customized character variants
 */

import { SavedCharacterVariant, ColorSwap, RGB } from './types';

export class CharacterPresets {
  private static readonly DB_NAME = 'viber3d-customizer';
  private static readonly STORE_VARIANTS = 'character_variants';
  private static readonly STORE_TEXTURES = 'texture_files';

  /**
   * Initialize IndexedDB
   */
  static async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create variants store
        if (!db.objectStoreNames.contains(this.STORE_VARIANTS)) {
          const variantStore = db.createObjectStore(this.STORE_VARIANTS, {
            keyPath: 'id',
          });
          variantStore.createIndex('baseModel', 'baseModel', { unique: false });
          variantStore.createIndex('createdAt', 'metadata.createdAt', {
            unique: false,
          });
        }

        // Create textures store
        if (!db.objectStoreNames.contains(this.STORE_TEXTURES)) {
          const textureStore = db.createObjectStore(this.STORE_TEXTURES, {
            keyPath: 'id',
          });
          textureStore.createIndex('variantId', 'variantId', { unique: false });
        }
      };
    });
  }

  /**
   * Save a character variant
   */
  static async saveVariant(
    variant: Omit<SavedCharacterVariant, 'id'>
  ): Promise<string> {
    const db = await this.initDB();
    const id = this.generateId();
    const now = new Date().toISOString();

    const fullVariant: SavedCharacterVariant = {
      ...variant,
      id,
      metadata: {
        ...variant.metadata,
        createdAt: now,
        modifiedAt: now,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_VARIANTS], 'readwrite');
      const store = transaction.objectStore(this.STORE_VARIANTS);
      const request = store.add(fullVariant);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  /**
   * Load a character variant by ID
   */
  static async loadVariant(id: string): Promise<SavedCharacterVariant | null> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_VARIANTS], 'readonly');
      const store = transaction.objectStore(this.STORE_VARIANTS);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Get all variants for a base model
   */
  static async getVariantsByModel(
    baseModel: string
  ): Promise<SavedCharacterVariant[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_VARIANTS], 'readonly');
      const store = transaction.objectStore(this.STORE_VARIANTS);
      const index = store.index('baseModel');
      const request = index.getAll(baseModel);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Get all saved variants
   */
  static async getAllVariants(): Promise<SavedCharacterVariant[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_VARIANTS], 'readonly');
      const store = transaction.objectStore(this.STORE_VARIANTS);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Update a variant
   */
  static async updateVariant(id: string, updates: Partial<SavedCharacterVariant>): Promise<void> {
    const db = await this.initDB();
    const existing = await this.loadVariant(id);

    if (!existing) {
      throw new Error(`Variant ${id} not found`);
    }

    const updated: SavedCharacterVariant = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        modifiedAt: new Date().toISOString(),
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_VARIANTS], 'readwrite');
      const store = transaction.objectStore(this.STORE_VARIANTS);
      const request = store.put(updated);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete a variant
   */
  static async deleteVariant(id: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.STORE_VARIANTS, this.STORE_TEXTURES],
        'readwrite'
      );

      // Delete variant
      const variantStore = transaction.objectStore(this.STORE_VARIANTS);
      const variantRequest = variantStore.delete(id);

      // Delete associated textures
      const textureStore = transaction.objectStore(this.STORE_TEXTURES);
      const textureIndex = textureStore.index('variantId');
      const textureRequest = textureIndex.getAll(id);

      textureRequest.onsuccess = () => {
        const textures = textureRequest.result;
        for (const texture of textures) {
          textureStore.delete(texture.id);
        }
      };

      variantRequest.onerror = () => reject(variantRequest.error);
      variantRequest.onsuccess = () => resolve();
    });
  }

  /**
   * Export variant as JSON
   */
  static async exportVariantAsJson(id: string): Promise<string> {
    const variant = await this.loadVariant(id);
    if (!variant) {
      throw new Error(`Variant ${id} not found`);
    }

    return JSON.stringify(variant, null, 2);
  }

  /**
   * Import variant from JSON
   */
  static async importVariantFromJson(json: string): Promise<string> {
    const variant = JSON.parse(json) as Omit<SavedCharacterVariant, 'id'>;
    return this.saveVariant(variant);
  }

  /**
   * Export variant as GLB file
   * (This would require additional model processing)
   */
  static async exportVariantAsGLB(id: string): Promise<Blob> {
    throw new Error('GLB export not yet implemented');
  }

  /**
   * Get storage quota and usage
   */
  static async getStorageInfo(): Promise<{ usage: number; quota: number }> {
    if (!navigator.storage?.estimate) {
      return { usage: 0, quota: 0 };
    }

    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }

  /**
   * Clear all saved variants
   */
  static async clearAll(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.STORE_VARIANTS, this.STORE_TEXTURES],
        'readwrite'
      );

      const variantStore = transaction.objectStore(this.STORE_VARIANTS);
      const textureStore = transaction.objectStore(this.STORE_TEXTURES);

      const variantRequest = variantStore.clear();
      const textureRequest = textureStore.clear();

      variantRequest.onerror = () => reject(variantRequest.error);
      textureRequest.onerror = () => reject(textureRequest.error);
      variantRequest.onsuccess = () => resolve();
    });
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
