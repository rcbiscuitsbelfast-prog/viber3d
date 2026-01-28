import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

// Plugin to copy Assets from root to public during build
// Only copies specific asset folders that are actually used
function copyAssetsPlugin() {
  return {
    name: 'copy-assets',
    buildStart() {
      const rootAssetsPath = path.resolve(__dirname, '../../Assets');
      const publicAssetsPath = path.resolve(__dirname, './public/Assets');
      
      // Only copy asset folders that are actually referenced in the code
      const assetFoldersToCopy = [
        'KayKit_Adventurers_2.0_FREE',
        'KayKit_Character_Animations_1.1',
        'KayKit_Character_Animations_1.2',
        'KayKit_Forest_Nature_Pack_1.0_FREE',
        'KayKit_Medieval_Hexagon_Pack_1.0_FREE',
        'KayKit_Skeletons_1.1_FREE',
        'Medieval Village MegaKit[Standard]',
        'Stylized Nature MegaKit[Standard]',
        'RPG Characters - Nov 2020',
        'button',
        'castle',
      ];
      
      if (existsSync(rootAssetsPath)) {
        console.log('[Vite] Copying required Assets from root to public...');
        
        if (!existsSync(publicAssetsPath)) {
          mkdirSync(publicAssetsPath, { recursive: true });
        }
        
        // Copy only the folders we need
        for (const folder of assetFoldersToCopy) {
          const srcFolder = join(rootAssetsPath, folder);
          const destFolder = join(publicAssetsPath, folder);
          
          if (existsSync(srcFolder)) {
            console.log(`[Vite] Copying ${folder}...`);
            copyRecursiveSync(srcFolder, destFolder);
          }
        }
        
        console.log('[Vite] Assets copied successfully');
      } else {
        console.warn('[Vite] Root Assets folder not found - using public/Assets only');
      }
    }
  };
}

function copyRecursiveSync(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const entries = readdirSync(src, { withFileTypes: true });
  
  // Folders to skip entirely
  const excludeFolders = [
    'sourceModels', 'Blends', 'FBX', 'OBJ', 'Documentation', 
    'Samples', 'samples', 'test', 'docs', 'manual', 'wiki', 
    'utils', 'editor', 'node_modules', '.git'
  ];
  
  // Only copy these file types (actual assets)
  const allowedExtensions = ['.glb', '.gltf', '.bin', '.png', '.jpg', '.jpeg', '.webp'];
  
  for (const entry of entries) {
    const entryName = entry.name;
    const srcPath = join(src, entryName);
    const destPath = join(dest, entryName);
    
    // Skip excluded folders
    if (entry.isDirectory()) {
      if (excludeFolders.some(folder => entryName.toLowerCase().includes(folder.toLowerCase()))) {
        continue;
      }
      // Recursively copy allowed directories
      copyRecursiveSync(srcPath, destPath);
    } else {
      // Only copy allowed file types
      const ext = entryName.substring(entryName.lastIndexOf('.')).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        // Skip documentation files even if they have allowed extensions
        const lowerName = entryName.toLowerCase();
        if (lowerName.includes('readme') || lowerName.includes('license') || 
            lowerName.includes('preview') || lowerName.includes('contents_')) {
          continue;
        }
        copyFileSync(srcPath, destPath);
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Use automatic JSX runtime
    }),
    copyAssetsPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Ensure Vite can find React in workspace setup
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'simplex-noise', 
      'three-pathfinding', 
      'troika-three-text',
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'zustand'
    ],
    // Force pre-bundling for workspace dependencies
    force: true,
  },
  build: {
    // Optimize chunk sizes
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit for large 3D libraries
  },
  base: '/', // Ensure base path is root for Firebase Hosting
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
    },
  },
});
