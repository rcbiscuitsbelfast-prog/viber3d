/**
 * Resolves asset paths to work with both local development and GitHub Pages.
 * Uses Vite's BASE_URL to prefix paths correctly.
 *
 * Examples:
 * - getAssetPath('/Assets/models/char.glb') => './Assets/models/char.glb' (production)
 * - getAssetPath('/Assets/models/char.glb') => '/Assets/models/char.glb' (development)
 */

// Cache the base URL - it won't change during runtime
const BASE_URL = import.meta.env.BASE_URL || '/';

export function getAssetPath(path: string): string {
  if (!path) return path;

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Combine base with path
  return `${BASE_URL}${cleanPath}`;
}

// Alias for convenience
export const resolvePath = getAssetPath;
