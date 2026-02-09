/**
 * Firebase Storage Utilities
 * Handles file uploads and downloads for world assets, thumbnails, etc.
 */

import { storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage
 * @param path Storage path (e.g., 'worlds/thumbnails/world-123.jpg')
 * @param file File or Blob to upload
 * @param metadata Optional metadata
 * @returns Download URL
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<string> {
  if (!isFirebaseConfigured() || !storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  try {
    const storageRef = ref(storage, path);
    const uploadMetadata = {
      contentType: metadata?.contentType || file.type || 'application/octet-stream',
      customMetadata: metadata?.customMetadata || {},
    };

    await uploadBytes(storageRef, file, uploadMetadata);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('[Firebase Storage] File uploaded:', path);
    return downloadURL;
  } catch (error) {
    console.error('[Firebase Storage] Upload failed:', error);
    throw error;
  }
}

/**
 * Get download URL for a file
 * @param path Storage path
 * @returns Download URL
 */
export async function getFileURL(path: string): Promise<string> {
  if (!isFirebaseConfigured() || !storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('[Firebase Storage] Failed to get URL:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path Storage path
 */
export async function deleteFile(path: string): Promise<void> {
  if (!isFirebaseConfigured() || !storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('[Firebase Storage] File deleted:', path);
  } catch (error) {
    console.error('[Firebase Storage] Delete failed:', error);
    throw error;
  }
}

/**
 * List all files in a directory
 * @param path Storage path (directory)
 * @returns Array of file paths
 */
export async function listFiles(path: string): Promise<string[]> {
  if (!isFirebaseConfigured() || !storage) {
    throw new Error('Firebase Storage is not configured.');
  }

  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    return result.items.map(item => item.fullPath);
  } catch (error) {
    console.error('[Firebase Storage] List failed:', error);
    throw error;
  }
}

/**
 * Upload a world thumbnail
 * @param worldId World ID
 * @param imageFile Image file (File or Blob)
 * @returns Download URL
 */
export async function uploadWorldThumbnail(worldId: string, imageFile: File | Blob): Promise<string> {
  const path = `worlds/thumbnails/${worldId}.jpg`;
  return uploadFile(path, imageFile, {
    contentType: 'image/jpeg',
    customMetadata: { worldId },
  });
}

/**
 * Upload an audio file (for NPC dialogue, etc.)
 * @param userId User ID
 * @param audioFile Audio file
 * @param filename Optional custom filename
 * @returns Download URL
 */
export async function uploadAudioFile(
  userId: string,
  audioFile: File | Blob,
  filename?: string
): Promise<string> {
  const name = filename || `audio-${Date.now()}.mp3`;
  const path = `users/${userId}/audio/${name}`;
  return uploadFile(path, audioFile, {
    contentType: 'audio/mpeg',
    customMetadata: { userId },
  });
}
