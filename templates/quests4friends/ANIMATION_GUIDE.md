# Animation System Guide

## Overview

The Quests4Friends animation system handles character animations using THREE.js AnimationMixer and KayKit animation files. This guide covers how to add, configure, and troubleshoot character animations.

## Architecture

### Core Components

1. **AnimationLoader** (`src/systems/animation/AnimationLoader.ts`)
   - Loads animation clips from GLB files
   - Caches animations for reuse
   - Handles multiple animation files per character

2. **AnimationManager** (`src/systems/animation/AnimationManager.ts`)
   - Singleton that manages all AnimationMixer instances
   - Handles playback, blending, and crossfading
   - Updates all mixers each frame

3. **AnimationSetLoader** (`src/systems/animation/AnimationSetLoader.ts`)
   - Maps character assets to animation sets
   - Loads complete animation sets based on character type
   - Uses `kaykit-animations.json` database

4. **useCharacterAnimation Hook** (`src/hooks/useCharacterAnimation.ts`)
   - React hook for easy animation control
   - Handles animation loading and cleanup
   - Provides playback controls

5. **Animation Database** (`src/data/kaykit-animations.json`)
   - Configuration file mapping animations to characters
   - Defines animation sets and their properties

## How Animations Work

### 1. Animation Files

KayKit animations are stored as separate GLB files in:
```
/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/
```

Each GLB file contains multiple animation clips:
- `Rig_Medium_General.glb` - General animations (idle, attack, interact, wave, etc.)
- `Rig_Medium_MovementBasic.glb` - Movement animations (walk, run, jump)

### 2. Animation Sets

Animation sets define which animations are available for a character type. They are configured in `kaykit-animations.json`:

```json
{
  "animationSets": {
    "humanoid_basic": {
      "name": "Humanoid Basic Animations",
      "files": {
        "movement": "Rig_Medium_MovementBasic.glb",
        "general": "Rig_Medium_General.glb"
      },
      "animations": {
        "idle": {
          "file": "general",
          "clipName": "Idle",
          "loop": true
        },
        "walk": {
          "file": "movement",
          "clipName": "Walking",
          "loop": true
        }
      }
    }
  }
}
```

### 3. Character Mapping

Characters are mapped to animation sets in the same file:

```json
{
  "characterMappings": {
    "char_rogue": "humanoid_basic",
    "char_knight": "humanoid_basic",
    "char_mage": "humanoid_basic"
  }
}
```

## Adding New Animations

### Step 1: Add Animation to Database

Edit `src/data/kaykit-animations.json`:

```json
{
  "animationSets": {
    "humanoid_basic": {
      "animations": {
        "dance": {
          "file": "general",
          "clipName": "Dance",
          "loop": true,
          "description": "Character dance animation"
        }
      }
    }
  }
}
```

### Step 2: Use in Component

```tsx
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';

function MyCharacter({ model }) {
  const { playAnimation, crossfadeTo } = useCharacterAnimation({
    characterId: 'my-character',
    assetId: 'char_rogue',
    model,
    defaultAnimation: 'idle'
  });

  const handleDance = () => {
    playAnimation('dance', { loop: true });
  };

  return (
    <group>
      <primitive object={model} />
      <button onClick={handleDance}>Dance</button>
    </group>
  );
}
```

## Animation Playback

### Basic Playback

```tsx
// Play animation with default settings
playAnimation('walk');

// Play with options
playAnimation('attack', {
  loop: false,
  fadeInDuration: 0.2,
  timeScale: 1.5 // Play faster
});
```

### Crossfading

```tsx
// Smooth transition between animations
crossfadeTo('run', 0.3); // 0.3 second fade duration
```

### Animation States

Common animation patterns:

```tsx
// Idle state
playAnimation('idle', { loop: true });

// Movement state
if (isMoving) {
  crossfadeTo('walk', 0.2);
} else {
  crossfadeTo('idle', 0.2);
}

// One-shot animation (attack, interact)
playAnimation('attack', { 
  loop: false,
  clampWhenFinished: true // Hold last frame
});

// Return to idle after one-shot
setTimeout(() => {
  crossfadeTo('idle', 0.3);
}, 1000);
```

## Troubleshooting

### Problem: Animations don't play

**Check:**
1. Is the character model loaded?
2. Does the model have a skeleton?
3. Are animation files present in the GLB?
4. Check browser console for loading errors

**Solution:**
```tsx
const { isLoaded, availableAnimations } = useCharacterAnimation({...});

console.log('Animations loaded:', isLoaded);
console.log('Available animations:', availableAnimations);
```

### Problem: Wrong animation plays

**Check:**
1. Verify `clipName` in `kaykit-animations.json` matches the actual clip name in the GLB file
2. Use case-insensitive matching (already handled)
3. Check available clips:

```tsx
// In AnimationSetLoader, check loaded clips
console.log('Loaded clips:', fileClips.map(c => c.name));
```

### Problem: Animation is jerky or doesn't blend smoothly

**Check:**
1. Are you using `crossfadeTo()` instead of `playAnimation()`?
2. Is the fade duration too short? Try 0.2-0.3 seconds
3. Are you calling animation changes too frequently?

**Solution:**
```tsx
// Use crossfading for smooth transitions
crossfadeTo('walk', 0.3);

// Track state to avoid redundant calls
if (!isMoving && currentAnimation !== 'idle') {
  crossfadeTo('idle', 0.2);
}
```

### Problem: Animations stop working after a while

**Check:**
1. Is `AnimationUpdater` component inside the Canvas?
2. Is `animationManager.update(delta)` being called every frame?

**Solution:**
```tsx
// In QuestPlayer.tsx
<Canvas>
  <AnimationUpdater />
  {/* other components */}
</Canvas>
```

### Problem: Multiple characters have the same animation

**This is expected!** Characters sharing the same animation set will have the same animations but play independently. Each character has its own AnimationMixer instance.

## Performance Optimization

### 1. Limit Active Animations

```tsx
// Only load animations for nearby characters
if (distanceToPlayer < 20) {
  // Load full animation set
} else {
  // Use simplified idle animation or freeze
}
```

### 2. Animation LOD (Level of Detail)

```tsx
// Distance-based animation quality
if (distanceToPlayer > 30) {
  // Disable animations for far characters
  animationManager.unregisterCharacter(characterId);
}
```

### 3. Reuse Animation Clips

The system automatically caches animation clips. No need to reload for each character instance.

## Best Practices

1. **Always use crossfading** for smooth transitions between looping animations
2. **Use playAnimation** for one-shot animations (attacks, jumps)
3. **Clean up on unmount** - The hook handles this automatically
4. **Track animation state** to avoid redundant calls
5. **Use descriptive animation names** in the database
6. **Set loop: false** for one-shot animations
7. **Set clampWhenFinished: true** for death animations to hold the last frame

## API Reference

### useCharacterAnimation Hook

```tsx
const {
  isLoaded,           // boolean - animations loaded?
  currentAnimation,   // string | null - current animation name
  playAnimation,      // (name, options?) => void
  crossfadeTo,        // (name, duration?) => void
  stopAnimation,      // () => void
  availableAnimations // string[] - available animation names
} = useCharacterAnimation({
  characterId,        // Unique ID for this character instance
  assetId,           // Asset ID from asset registry
  model,             // THREE.Object3D (character model)
  defaultAnimation   // Animation to play on load (default: 'idle')
});
```

### playAnimation Options

```tsx
{
  loop?: boolean;              // Loop animation? (default: true)
  fadeInDuration?: number;     // Fade in duration in seconds
  fadeOutDuration?: number;    // Fade out duration in seconds
  timeScale?: number;          // Playback speed multiplier (default: 1.0)
  clampWhenFinished?: boolean; // Hold last frame? (default: false)
}
```

## Examples

### Player Character with Movement

```tsx
function PlayerController() {
  const [model, setModel] = useState(null);
  const isMovingRef = useRef(false);
  
  const { crossfadeTo, isLoaded } = useCharacterAnimation({
    characterId: 'player',
    assetId: 'char_rogue',
    model,
    defaultAnimation: 'idle'
  });

  useFrame(() => {
    const isMoving = /* check input */;
    
    if (isMoving && !isMovingRef.current && isLoaded) {
      crossfadeTo('walk', 0.2);
      isMovingRef.current = true;
    } else if (!isMoving && isMovingRef.current && isLoaded) {
      crossfadeTo('idle', 0.2);
      isMovingRef.current = false;
    }
  });
}
```

### NPC with Interaction Animation

```tsx
function NPCEntity({ entity }) {
  const [model, setModel] = useState(null);
  
  const { playAnimation, crossfadeTo, isLoaded } = useCharacterAnimation({
    characterId: `npc_${entity.id}`,
    assetId: entity.assetId,
    model,
    defaultAnimation: 'idle'
  });

  const handleInteraction = () => {
    if (isLoaded) {
      playAnimation('wave', { loop: false });
      setTimeout(() => {
        crossfadeTo('idle', 0.3);
      }, 2000);
    }
  };
}
```

### Enemy with Combat Animations

```tsx
function EnemyEntity({ entity }) {
  const [model, setModel] = useState(null);
  const { playAnimation, isLoaded } = useCharacterAnimation({
    characterId: `enemy_${entity.id}`,
    assetId: entity.assetId,
    model,
    defaultAnimation: 'idle'
  });

  const handleAttack = () => {
    if (isLoaded) {
      playAnimation('attack', { 
        loop: false,
        timeScale: 1.2 // Slightly faster
      });
    }
  };

  const handleDeath = () => {
    if (isLoaded) {
      playAnimation('death', { 
        loop: false,
        clampWhenFinished: true
      });
    }
  };
}
```

## Future Enhancements

### Animation Events

Add event listeners for animation completion:

```tsx
mixer.addEventListener('finished', (e) => {
  if (e.action === attackAction) {
    // Attack animation finished
    returnToIdle();
  }
});
```

### Animation Blending

Blend multiple animations together (e.g., walking + aiming):

```tsx
const walkAction = mixer.clipAction(walkClip);
const aimAction = mixer.clipAction(aimClip);

walkAction.play();
aimAction.play();
aimAction.weight = 0.5; // Blend 50%
```

### Inverse Kinematics (IK)

For looking at targets, foot placement, etc. - requires additional libraries.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify animation files exist in the public folder
3. Check that character model has a skeleton
4. Review this guide's troubleshooting section

Happy animating! 🎮
