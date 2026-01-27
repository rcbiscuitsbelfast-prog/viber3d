import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Use automatic JSX runtime
    })
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
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
    },
  },
});
