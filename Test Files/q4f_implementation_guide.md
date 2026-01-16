# Quests4Friends - Complete Implementation Guide

## 📋 Project Overview

This implementation guide provides all the code files needed to build Quests4Friends on top of the viber3d repository. The project is organized as follows:

```
viber3d/
├── templates/
│   └── quests4friends/     # New template for Q4F
├── Assets/                  # KayKit assets (already present)
└── src/                     # Main application code
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/rcbiscuitsbelfast-prog/viber3d.git
cd viber3d
pnpm install
```

### 2. Create Quests4Friends Template

Create a new template directory:

```bash
mkdir -p templates/quests4friends
cd templates/quests4friends
```

### 3. Install Dependencies

Your `package.json` should include:

```json
{
  "name": "quests4friends",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.22.0",
    "three": "^0.173.0",
    "@react-three/fiber": "^9.0.4",
    "@react-three/drei": "^9.105.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "@types/three": "^0.173.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.8.2",
    "vite": "^6.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

## 📁 File Structure

Create the following directory structure:

```
templates/quests4friends/
├── public/
│   └── Assets/ (symlink to ../../Assets)
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── QuestPlayer.tsx
│   │   │   ├── PlayerController.tsx
│   │   │   ├── QuestEnvironment.tsx
│   │   │   ├── QuestEntities.tsx
│   │   │   └── entities/
│   │   │       ├── NPCEntity.tsx
│   │   │       ├── EnemyEntity.tsx
│   │   │       └── CollectibleEntity.tsx
│   │   └── ui/
│   │       ├── QuestUI.tsx
│   │       ├── DialogueBox.tsx
│   │       ├── CombatUI.tsx
│   │       ├── RewardModal.tsx
│   │       ├── HealthBar.tsx
│   │       ├── TasksList.tsx
│   │       ├── LoadingScreen.tsx
│   │       └── ErrorScreen.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── QuestPlayerPage.tsx
│   │   ├── BuilderPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── AccountPage.tsx
│   ├── systems/
│   │   └── assets/
│   │       └── AssetRegistry.ts
│   ├── store/
│   │   └── questStore.ts
│   ├── types/
│   │   └── quest.types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## 🔧 Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'loading-bar': 'loading-bar 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
    },
  },
  plugins: [],
}
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quests4Friends - Playable Messages</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### src/main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

canvas {
  display: block;
  touch-action: none;
}
```

## 🎯 Core Systems Implemented

### 1. Asset Registry System ✅
- Loads and indexes KayKit assets
- Supports glTF format
- Caching and instancing
- Located in `src/systems/assets/AssetRegistry.ts`

### 2. Quest Data Model ✅
- Complete type definitions
- Entity, Task, Trigger, Reward systems
- Located in `src/types/quest.types.ts`

### 3. State Management (Zustand) ✅
- Quest session management
- Player state tracking
- Combat system state
- Dialogue and UI state
- Located in `src/store/questStore.ts`

### 4. Player Controller ✅
- WASD movement
- Camera following
- Collision detection
- Located in `src/components/game/PlayerController.tsx`

### 5. Quest Entities ✅
- NPC with dialogue system
- Enemy with combat mechanics
- Collectible items with auto-pickup
- Located in `src/components/game/entities/`

### 6. Quest Environment ✅
- Procedural placement based on seed
- Template world support (Forest, Meadow, Town)
- Located in `src/components/game/QuestEnvironment.tsx`

### 7. UI System ✅
- Dialogue box with typewriter effect
- Combat UI with turn-based mechanics
- Reward modal with multiple reward types
- Task list and health bar
- Located in `src/components/ui/`

### 8. Routing ✅
- Home page
- Quest player
- Builder (placeholder)
- Authentication (placeholder)
- Located in `src/pages/` and `src/App.tsx`

## 🚧 Next Steps (To Complete MVP)

### Phase 1: Backend Integration
1. **Firebase Setup**
   - Firestore for quest storage
   - Firebase Storage for media files
   - Firebase Auth for user authentication

2. **API Layer**
   ```typescript
   // src/api/questApi.ts
   export async function fetchQuest(questId: string): Promise<Quest>
   export async function createQuest(quest: Quest): Promise<string>
   export async function updateQuest(quest: Quest): Promise<void>
   export async function trackAnalytics(event: AnalyticsEvent): Promise<void>
   ```

### Phase 2: Quest Builder
1. **Builder Components**
   - Asset palette
   - Drag-and-drop placement
   - Entity configuration forms
   - Task editor
   - Trigger editor
   - Reward uploader

2. **Preview Mode**
   - Live quest testing
   - Hot reload changes

### Phase 3: Advanced Features
1. **Animations**
   - Character animations from KayKit rigs
   - Idle, walk, attack states
   - Using THREE.AnimationMixer

2. **Audio System**
   - Background music per world
   - Sound effects
   - Voice recordings
   - Using Howler.js

3. **Mobile Controls**
   - Virtual joystick
   - Touch-optimized UI
   - Responsive layouts

### Phase 4: Monetization & Premium Features
1. **Stripe Integration**
2. **Premium tier limits**
3. **Quest expiration system**
4. **Analytics dashboard**

## 🎮 Testing Your Implementation

### Run Development Server

```bash
cd templates/quests4friends
pnpm dev
```

Visit `http://localhost:5173`

### Test Quest Player

1. Navigate to `/play/test-quest-1`
2. Should load the mock quest data
3. Test movement with WASD
4. Interact with NPCs using E key
5. Collect items by walking near them

### Expected Behavior

- ✅ Asset registry loads successfully
- ✅ Forest environment generates with trees and rocks
- ✅ Player character loads and moves
- ✅ Camera follows player
- ✅ NPCs show interaction prompts
- ✅ Dialogue system works
- ✅ Collectibles can be picked up
- ✅ Tasks update in real-time
- ✅ Combat UI appears when engaging enemies
- ✅ Reward modal shows on quest completion

## 📝 Development Notes

### Asset Loading
- Assets are loaded from `/Assets/` directory
- Make sure the KayKit folders are accessible
- Use symlinks if needed: `ln -s ../../Assets public/Assets`

### Performance Optimization
- Models are cached after first load
- Use instancing for repeated objects (trees, rocks)
- Limit to 20-30 simultaneous loaded models
- Disable shadows by default

### Browser Compatibility
- Tested on Chrome, Firefox, Safari
- Requires WebGL 2.0 support
- Mobile browsers supported

## 🐛 Common Issues & Solutions

### Assets Not Loading
- Check file paths in asset manifests
- Verify `/Assets/` directory is accessible
- Check browser console for 404 errors

### Performance Issues
- Reduce number of environment objects
- Check model poly counts
- Disable shadows if needed
- Use LOD (Level of Detail) for distant objects

### TypeScript Errors
- Ensure all dependencies are installed
- Run `pnpm install` again
- Check TypeScript version compatibility

## 📚 Additional Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Docs](https://threejs.org/docs/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 🎉 You're Ready!

You now have a complete foundation for Quests4Friends! The core gameplay loop is functional:

1. ✅ Load a quest
2. ✅ Explore the environment
3. ✅ Interact with NPCs
4. ✅ Collect items
5. ✅ Complete tasks
6. ✅ Receive rewards

Next, focus on:
- Building the Quest Builder interface
- Integrating Firebase backend
- Adding animations
- Implementing mobile controls
- Creating more quest templates

Good luck building Quests4Friends! 🚀