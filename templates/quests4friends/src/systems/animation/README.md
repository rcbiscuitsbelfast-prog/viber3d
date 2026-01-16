# Animation System

This directory contains the core animation system for Quests4Friends.

## Modules

### AnimationLoader
Loads animation clips from GLB files and caches them for reuse.

```ts
import { animationLoader } from './AnimationLoader';

const clips = await animationLoader.loadAnimations('/path/to/animations.glb');
```

### AnimationManager
Singleton that manages all AnimationMixer instances for all characters.

```ts
import { animationManager } from './AnimationManager';

// Register character
animationManager.registerCharacter(characterId, model, animations);

// Play animation
animationManager.playAnimation(characterId, 'walk', { loop: true });

// Crossfade
animationManager.crossfadeToAnimation(characterId, 'run', 0.3);

// Update (call every frame)
animationManager.update(deltaTime);

// Cleanup
animationManager.unregisterCharacter(characterId);
```

### AnimationSetLoader
Loads complete animation sets based on character asset IDs using the animation database.

```ts
import { animationSetLoader } from './AnimationSetLoader';

const animations = await animationSetLoader.loadCharacterAnimations('char_rogue');
// Returns: { idle: AnimationClip, walk: AnimationClip, ... }
```

## Usage

### In React Components

Use the `useCharacterAnimation` hook (recommended):

```tsx
import { useCharacterAnimation } from '../../../hooks/useCharacterAnimation';

function Character({ assetId, model }) {
  const { playAnimation, crossfadeTo, isLoaded } = useCharacterAnimation({
    characterId: 'my-character',
    assetId,
    model,
    defaultAnimation: 'idle'
  });

  // Play animation
  const handleAction = () => {
    playAnimation('attack', { loop: false });
  };

  return <primitive object={model} />;
}
```

### Animation Database

Configure animations in `src/data/kaykit-animations.json`:

```json
{
  "animationSets": {
    "humanoid_basic": {
      "animations": {
        "idle": {
          "file": "general",
          "clipName": "Idle",
          "loop": true
        }
      }
    }
  },
  "characterMappings": {
    "char_rogue": "humanoid_basic"
  }
}
```

## Architecture

```
AnimationSetLoader
    ↓ (loads)
AnimationLoader
    ↓ (provides clips)
AnimationManager
    ↓ (manages mixers)
useCharacterAnimation Hook
    ↓ (used by)
React Components
```

## See Also

- [Animation Guide](../../../ANIMATION_GUIDE.md) - Complete usage guide
- [Implementation Summary](../../../ANIMATION_IMPLEMENTATION.md) - Implementation details
