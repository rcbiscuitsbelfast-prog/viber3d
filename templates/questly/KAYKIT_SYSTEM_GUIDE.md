# KayKit Animation System Guide

## Overview

KayKit is a modular animation and character system that separates **character models** from **animation rigs**. This guide explains how to work with KayKit assets to add new characters, animations, and weapons to Questly.

## Key Concept: Separation of Concerns

KayKit keeps three things separate:

1. **Character Models** - Visual mesh/body (e.g., Mage.glb, Knight.glb)
2. **Animation Rigs** - Skeletal animations (e.g., Rig_Medium_General.glb)
3. **Weapons** - Equipment (e.g., Sword_Longsword_1.glb)

This modular approach allows:
- Reusing animations across multiple characters
- Mixing and matching weapons with characters
- Efficient memory usage
- Easy addition of new animations without recreating character models

## Asset Structure

### Character Models
Location: `/Assets/KayKit_Adventurers_2.0_FREE/Characters/gltf/`

**Available Characters:**
- `Mage.glb` - Wizard character
- `Knight.glb` - Armored warrior
- `Ranger.glb` - Agile archer
- `Rogue.glb` - Stealthy character
- `Barbarian.glb` - Large powerful warrior

**Properties:**
- File size: ~200KB each
- Contains visual mesh only (no animations)
- Includes full skinned mesh and bones
- Ready to bind with animation clips

### Animation Rigs

#### KayKit Adventurers 2.0 (Basic Set)
Location: `/Assets/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/`

**Files:**
- `Rig_Medium_General.glb` - Basic animations (idle, interact, death)
- `Rig_Medium_MovementBasic.glb` - Movement animations (walk, run, jump)

**Animation Count:** ~26 total animations

#### KayKit Character Animations 1.1 (Enhanced Set)
Location: `/Assets/KayKit_Character_Animations_1.1/Animations/gltf/`

Two rig sizes available:
- **Rig_Medium/** - For standard humanoid characters
- **Rig_Large/** - For larger characters (barbarians, trolls)

**Rig_Medium Files:**
- `Rig_Medium_MovementBasic.glb` (11 animations)
- `Rig_Medium_MovementAdvanced.glb` (13 animations)
- `Rig_Medium_General.glb` (15 animations)
- `Rig_Medium_CombatMelee.glb` (22 animations)
- `Rig_Medium_CombatRanged.glb` (20 animations)
- `Rig_Medium_Simulation.glb` (14 animations)
- `Rig_Medium_Special.glb` (15 animations)
- `Rig_Medium_Tools.glb` (29 animations)

**Total:** 139 animations per rig

### Weapons
Location: `/Assets/KayKit_Adventurers_2.0_FREE/Weapons/gltf/`

**Available Weapons:**
- `Sword_*.glb` - Various swords
- `Bow_*.glb` - Various bows
- `Staff_*.glb` - Staffs and polearms
- `Shield_*.glb` - Shield equipment

## Animation Sets (kaykit-animations.json)

The `src/data/kaykit-animations.json` file maps characters to animation sets and clips to actual files.

### Structure
```json
{
  "characterMappings": {
    "char_mage": "humanoid_enhanced",
    "char_knight": "humanoid_enhanced",
    "char_rogue": "humanoid_basic"
  },
  "animationSets": {
    "humanoid_enhanced": {
      "basePath": "characterAnim11_medium",
      "files": {
        "movement": "Rig_Medium_MovementBasic.glb",
        "general": "Rig_Medium_General.glb",
        ...
      },
      "animations": {
        "idle": {
          "file": "general",
          "clipName": "Idle",
          "loop": true
        },
        "walk": {
          "file": "movement",
          "clipName": "Walking_A",
          "loop": true
        },
        ...
      }
    }
  }
}
```

## How It Works: Loading Flow

### 1. Character Model Loading
```tsx
const loader = new GLTFLoader();
const gltf = await loader.load('/models/Mage.glb');
const clonedGltf = cloneGltf(gltf);  // Proper skinned mesh cloning
const characterScene = clonedGltf.scene;
```

**Important:** Use `cloneGltf()` utility to properly clone:
- Skinned meshes
- Skeleton bones
- Bone hierarchy
- Bone inverse matrices

### 2. Animation Loading
The `useCharacterAnimation` hook:
1. Looks up character in `characterMappings` (e.g., char_mage → humanoid_enhanced)
2. Gets animation set config from `animationSets`
3. Loads animation GLB files from configured paths
4. Extracts animation clips from each file
5. Maps clip names to animation names (e.g., "Idle_A" → "idle")
6. Registers character with `AnimationManager`
7. Plays default animation (idle)

### 3. Animation Playback
```tsx
const { crossfadeTo, hasAnimation } = useCharacterAnimation({
  characterId: 'dashboard-mage',
  assetId: 'char_mage',  // Maps to animation set
  model: characterScene,
  defaultAnimation: 'idle'
});

// Switch animations with smooth crossfade
crossfadeTo('walk', 0.3);  // 0.3s fade duration
```

### 4. Weapon Attachment
```tsx
// Find right hand bone
let handBone: THREE.Bone | null = null;
characterScene.traverse((node) => {
  if (node instanceof THREE.Bone && node.name.includes('hand')) {
    handBone = node;
  }
});

// Attach weapon to hand
if (handBone) {
  const weapon = weaponGltf.scene.clone();
  weapon.scale.setScalar(0.8);
  weapon.position.set(0.1, 0, 0);
  weapon.rotation.set(0, 0, Math.PI / 4);
  handBone.add(weapon);
}
```

## Adding New Characters

### Step 1: Add Character Model
1. Copy character GLB file to `public/models/`
2. Note the character ID you'll use (e.g., `char_barbarian`)

### Step 2: Update Animation Database
Edit `src/data/kaykit-animations.json`:

```json
{
  "characterMappings": {
    "char_barbarian": "large_humanoid"  // NEW
  }
}
```

### Step 3: Use in Code
```tsx
<AnimatedCharacter
  characterPath="/models/Barbarian.glb"
  assetId="char_barbarian"  // Must match mapping
  characterId="some-barbarian-1"
  scale={1.2}
  weaponPath="/Assets/KayKit_Adventurers_2.0_FREE/Weapons/gltf/Sword_Greatsword_1.glb"
/>
```

### Step 4: (Optional) Add to Character Selector
If building a character selection UI, add the new character with its animations automatically loaded.

## Adding New Animations

### Step 1: Get Animation Files
KayKit provides animation files in the 1.1 pack. Check what's available in:
- `/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/`

### Step 2: Update kaykit-animations.json
Add the animation to the appropriate set:

```json
{
  "humanoid_enhanced": {
    "animations": {
      "myNewAnimation": {
        "file": "general",
        "clipName": "Actual_Clip_Name_In_GLB",
        "loop": true,
        "description": "What this animation does"
      }
    }
  }
}
```

**Important:** The `clipName` must match **exactly** the animation clip name inside the GLB file.

### Step 3: Use in Code
```tsx
const { crossfadeTo, hasAnimation } = useCharacterAnimation({...});

if (hasAnimation('myNewAnimation')) {
  crossfadeTo('myNewAnimation', 0.3);
}
```

## Animation Clip Names Reference

### General Animations
- `Idle` - Standing idle
- `Idle_A`, `Idle_B` - Variations
- `Death_A`, `Death_B` - Death animations
- `Interact` - Interaction pose

### Movement Animations
- `Walking_A`, `Walking_B` - Walking variations
- `Running_A` - Running forward
- `Jump_Full_Long` - Long jump
- `Crawling` - Crawling motion

### Combat Animations
- `Melee_1H_Attack_Chop` - 1-handed attack
- `Melee_2H_Attack_Overhead` - 2-handed overhead
- `Melee_Attack_Spin` - Spinning attack
- `Ranged_1H_Aiming` - Aiming bow

### Special Animations
- `Cheering` - Victory cheer
- `Chop`, `Mining` - Tool usage
- `Swimming` - Swimming motion

## Troubleshooting

### Character Shows as T-Pose
**Problem:** Character appears with arms outstretched
**Solutions:**
- Ensure `cloneGltf()` is used (handles bone cloning)
- Check that animation is actually loading (check console logs)
- Verify animation clip name matches exactly in JSON

### Animations Don't Play
**Problem:** Character loads but animations don't animate
**Solutions:**
- Check console for animation loading errors
- Verify `characterMappings` has entry for your character's assetId
- Verify animation files exist at configured paths
- Check that `clipName` matches exactly (case-sensitive)
- Ensure AnimationUpdater component is in Canvas

### Weapon Doesn't Attach
**Problem:** Weapon spawns but not held correctly
**Solutions:**
- Check hand bone name (usually `handslotr` or `handr`)
- Adjust weapon position/rotation (currently 0.1, 0, 0 and Math.PI/4)
- Scale weapon appropriately (currently 0.8)

### Character Flickers Between Poses
**Problem:** Character rapidly switches between animations
**Solutions:**
- Use `modelLoadedRef` to prevent reloading
- Don't trigger animation changes on every render
- Use `useCallback` for crossfadeTo to maintain reference equality

## Performance Tips

1. **Preload Models and Animations**
   - Use GLTFLoader.preload() for common characters
   - Cache loaded animation sets

2. **Reuse Animation Sets**
   - Multiple characters can use same animation set
   - Only load animation files once

3. **Optimize Bone Count**
   - Rig_Medium (Medium complexity) is default
   - Rig_Large for bigger characters
   - Remove unused bones from models if needed

4. **Clean Up Resources**
   - Dispose of geometry, materials, and textures
   - Unregister characters from AnimationManager on unmount

## File Structure Reference

```
public/Assets/
├── KayKit_Adventurers_2.0_FREE/
│   ├── Characters/gltf/
│   │   ├── Mage.glb
│   │   ├── Knight.glb
│   │   ├── Rogue.glb
│   │   └── ...
│   ├── Weapons/gltf/
│   │   ├── Sword_*.glb
│   │   ├── Bow_*.glb
│   │   └── ...
│   └── Animations/gltf/Rig_Medium/
│       ├── Rig_Medium_General.glb
│       ├── Rig_Medium_MovementBasic.glb
│       └── ...
├── KayKit_Character_Animations_1.1/
│   └── Animations/gltf/
│       ├── Rig_Medium/
│       │   ├── Rig_Medium_CombatMelee.glb
│       │   ├── Rig_Medium_General.glb
│       │   └── ...
│       └── Rig_Large/
│           └── ...

src/
├── data/
│   └── kaykit-animations.json        ← Master animation database
├── systems/animation/
│   ├── AnimationManager.ts           ← Animation playback control
│   ├── AnimationSetLoader.ts         ← Loads animations from files
│   ├── AnimationLoader.ts            ← Low-level GLB loading
│   └── index.ts
├── hooks/
│   └── useCharacterAnimation.ts      ← React hook for animations
├── r3f/
│   ├── AnimatedCharacter.tsx         ← Reusable character component
│   └── ...
└── utils/
    └── cloneGltf.ts                  ← Proper skeletal mesh cloning
```

## Quick Start: Adding a New Character

```tsx
// 1. Add to src/data/kaykit-animations.json
"char_newcharacter": "humanoid_enhanced"

// 2. Use in component
<AnimatedCharacter
  characterPath="/models/NewCharacter.glb"
  assetId="char_newcharacter"
  characterId="unique-id"
  weaponPath="/Assets/.../Weapon.glb"
  onAnimationsLoaded={handleLoad}
/>

// 3. Switch animations
const { crossfadeTo } = useCharacterAnimation({...});
crossfadeTo('walk', 0.3);  // Smooth transition
```

## Resources

- KayKit Website: https://kenney.nl/
- Asset Licenses: Check individual pack licenses
- Three.js Animation: https://threejs.org/docs/#api/en/animation/AnimationAction
- Our Animation Database: `src/data/kaykit-animations.json`

## Contributing

When adding new animations or characters:
1. Update `kaykit-animations.json` with accurate clip names
2. Test the character in dashboard before using in production
3. Document any new animation sets or categories
4. Use consistent naming conventions (lowercase_underscore)
5. Keep animation descriptions clear for future reference
