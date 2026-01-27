/**
 * WorldFirebaseStorage - Firebase Firestore storage for world configurations
 * Phase 4.1 - Cloud Storage Integration
 * 
 * Stores world configs in Firestore with the following structure:
 * - Collection: 'worlds'
 * - Document ID: auto-generated or user-provided
 * - Fields: world config + metadata (userId, createdAt, updatedAt, etc.)
 */

import { db, isFirebaseConfigured } from '../../lib/firebase';
import { WorldConfig } from './WorldConfig';
import type { WorldState } from './WorldExporter';
import { exportWorldConfig } from './WorldExporter';
import { importWorldConfigFromJSON, configToWorldState } from './WorldImporter';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';

export interface WorldMetadata {
  id: string;
  name: string;
  description?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  thumbnailUrl?: string;
}

export interface SavedWorld {
  id: string;
  config: WorldConfig;
  metadata: WorldMetadata;
}

/**
 * Save world to Firebase Firestore
 */
export async function saveWorldToFirebase(
  state: WorldState,
  worldId?: string,
  metadata?: Partial<WorldMetadata>
): Promise<string> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured. Please set up Firebase credentials.');
  }

  try {
    const config = exportWorldConfig(state);
    const now = new Date();
    const worldRef = worldId 
      ? doc(db, 'worlds', worldId)
      : doc(collection(db, 'worlds'));

    const worldData = {
      config,
      metadata: {
        name: metadata?.name || `World ${now.toLocaleString()}`,
        description: metadata?.description || '',
        userId: metadata?.userId || null,
        createdAt: metadata?.createdAt ? Timestamp.fromDate(metadata.createdAt) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        isPublic: metadata?.isPublic ?? false,
        thumbnailUrl: metadata?.thumbnailUrl || null,
      },
    };

    await setDoc(worldRef, worldData);
    console.log('[Firebase] World saved:', worldRef.id);
    return worldRef.id;
  } catch (error) {
    console.error('[Firebase] Failed to save world:', error);
    throw error;
  }
}

/**
 * Load world from Firebase Firestore
 */
export async function loadWorldFromFirebase(worldId: string): Promise<SavedWorld | null> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured.');
  }

  try {
    const worldRef = doc(db, 'worlds', worldId);
    const worldSnap = await getDoc(worldRef);

    if (!worldSnap.exists()) {
      return null;
    }

    const data = worldSnap.data();
    const metadata = data.metadata;
    
    return {
      id: worldSnap.id,
      config: data.config as WorldConfig,
      metadata: {
        id: worldSnap.id,
        name: metadata.name,
        description: metadata.description,
        userId: metadata.userId,
        createdAt: metadata.createdAt?.toDate() || new Date(),
        updatedAt: metadata.updatedAt?.toDate() || new Date(),
        isPublic: metadata.isPublic ?? false,
        thumbnailUrl: metadata.thumbnailUrl,
      },
    };
  } catch (error) {
    console.error('[Firebase] Failed to load world:', error);
    throw error;
  }
}

/**
 * Get all worlds for a user (or public worlds if no userId)
 */
export async function getUserWorlds(userId?: string): Promise<SavedWorld[]> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured.');
  }

  try {
    const constraints: QueryConstraint[] = [];
    
    if (userId) {
      constraints.push(where('metadata.userId', '==', userId));
    } else {
      // If no userId, get public worlds
      constraints.push(where('metadata.isPublic', '==', true));
    }
    
    constraints.push(orderBy('metadata.updatedAt', 'desc'));

    const q = query(collection(db, 'worlds'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const metadata = data.metadata;
      
      return {
        id: doc.id,
        config: data.config as WorldConfig,
        metadata: {
          id: doc.id,
          name: metadata.name,
          description: metadata.description,
          userId: metadata.userId,
          createdAt: metadata.createdAt?.toDate() || new Date(),
          updatedAt: metadata.updatedAt?.toDate() || new Date(),
          isPublic: metadata.isPublic ?? false,
          thumbnailUrl: metadata.thumbnailUrl,
        },
      };
    });
  } catch (error) {
    console.error('[Firebase] Failed to get user worlds:', error);
    throw error;
  }
}

/**
 * Delete world from Firebase
 */
export async function deleteWorldFromFirebase(worldId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase is not configured.');
  }

  try {
    await deleteDoc(doc(db, 'worlds', worldId));
    console.log('[Firebase] World deleted:', worldId);
  } catch (error) {
    console.error('[Firebase] Failed to delete world:', error);
    throw error;
  }
}

/**
 * Check if Firebase is available
 */
export function isFirebaseAvailable(): boolean {
  return isFirebaseConfigured() && db !== null;
}
