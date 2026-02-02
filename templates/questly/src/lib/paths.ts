/**
 * Resolve asset paths to work with both localhost and GitHub Pages
 * GitHub Pages uses base: '/viber3d/' so absolute paths need the base prepended
 */
export function resolveAssetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  
  // If path is absolute, prepend base
  if (path.startsWith('/')) {
    // Remove trailing slash from base, add the path
    return base.replace(/\/$/, '') + path;
  }
  
  // Relative paths stay as-is
  return path;
}

export function resolvePath(path: string): string {
  return resolveAssetPath(path);
}
