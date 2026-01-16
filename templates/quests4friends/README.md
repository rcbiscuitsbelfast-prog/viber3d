# Quests4Friends

Turn your messages into playable adventures. Not a text. Not a game. A playable message.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm

### Installation

```bash
# From the repo root
pnpm install

# Navigate to the template
cd templates/quests4friends

# Run development server
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview

```bash
pnpm preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── game/
│   │   ├── QuestPlayer.tsx          # Main game component
│   │   ├── PlayerController.tsx      # Player movement and camera
│   │   ├── QuestEnvironment.tsx      # Procedural environment generation
│   │   ├── QuestEntities.tsx         # Entity rendering
│   │   └── entities/
│   │       ├── NPCEntity.tsx         # NPC characters
│   │       ├── EnemyEntity.tsx       # Enemy encounters
│   │       └── CollectibleEntity.tsx # Collectable items
│   └── ui/
│       ├── QuestUI.tsx              # Main UI overlay
│       ├── DialogueBox.tsx          # NPC dialogue system
│       ├── CombatUI.tsx             # Combat interface
│       ├── RewardModal.tsx          # Quest completion reward
│       └── HelperComponents.tsx     # Health bars, task lists, etc.
├── pages/
│   ├── HomePage.tsx                # Landing page
│   ├── QuestPlayerPage.tsx         # Quest player wrapper
│   └── BuilderPage.tsx             # Quest builder (coming soon)
├── store/
│   └── questStore.ts               # Zustand state management
├── systems/
│   └── assets/
│       └── AssetRegistry.ts        # 3D asset loading and caching
├── types/
│   └── quest.types.ts              # TypeScript interfaces
├── App.tsx                          # Main app component
├── main.tsx                         # Entry point
└── index.css                        # Tailwind styling
```

## 🎮 Features

- **Interactive 3D Environments**: Forest, Meadow, and Town templates
- **NPC Dialogue System**: Branching conversations with typewriter effects
- **Combat System**: Turn-based enemy encounters with difficulty levels
- **Collectible Items**: Auto-collect or manual pickup of quest items
- **Task System**: Structured quest objectives with progress tracking
- **Reward System**: Multiple reward types (text, image, audio, links)
- **Asset Integration**: KayKit models for characters and environments
- **Responsive UI**: Tailwind CSS with glass-morphism effects
- **State Management**: Zustand for efficient state handling

## 🎨 Technologies

- **React 18**: UI framework
- **Three.js & React Three Fiber**: 3D rendering
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety
- **Zustand**: State management
- **React Router**: Navigation
- **Vite**: Build tool

## 📦 Assets

Uses free KayKit asset packs:
- KayKit Adventurers 2.0 (characters and weapons)
- KayKit Forest Nature Pack 1.0 (environments and objects)

Both located in `/Assets` directory with asset manifests.

## 🔧 Development

### Hot Module Replacement
Vite provides HMR for instant updates during development.

### TypeScript
Strict mode enabled for type safety.

### ESLint
Run linting:
```bash
pnpm lint
```

## 📖 API Reference

### useQuestStore()
Zustand store for quest state management:

```typescript
const {
  currentQuest,
  playerState,
  combatState,
  setCurrentQuest,
  startQuestSession,
  completeTask,
  startCombat,
  endCombat,
  completeQuest,
} = useQuestStore();
```

### assetRegistry
Singleton for loading and managing 3D assets:

```typescript
import { assetRegistry } from '@/systems/assets/AssetRegistry';

// Initialize
await assetRegistry.initialize();

// Load a model
const model = await assetRegistry.loadModel('char_rogue');

// Get assets by tags
const trees = assetRegistry.getAssetsByTags(['tree']);
```

## 🚀 Deployment

Build for production:
```bash
pnpm build
```

Deploy the `dist/` directory to your hosting service.

## 📝 License

MIT - See LICENSE file

## 🙏 Credits

- Built with [viber3d](https://github.com/instructa/viber3d)
- Assets from [KayKit](https://kaykit.dev/)
- Powered by React Three Fiber and Three.js

## 🤝 Contributing

Contributions welcome! Please see CONTRIBUTE.md in the root directory.
