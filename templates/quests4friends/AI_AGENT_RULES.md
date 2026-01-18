# AI Agent Rules for Quests4Friends Development

**Last Updated:** 2024-12-19  
**Purpose:** Rules for ALL AI agents working on this repository to prevent common mistakes and ensure consistency.

---

## 🚨 CRITICAL RULES

### 1. Animations Are in SEPARATE Files - NEVER ASSUME They're in Character Models

**❌ WRONG - This will cause T-pose issues:**
```typescript
const loader = new GLTFLoader();
const gltf = await loader.load('/Assets/.../Rogue.glb');
const animations = gltf.animations; // ❌ EMPTY ARRAY - No animations here!
```

**✅ CORRECT - Use AnimationSetLoader:**
```typescript
import { animationSetLoader } from '../systems/animation/AnimationSetLoader';

// Load animations from separate files
const animations = await animationSetLoader.loadCharacterAnimations('char_rogue');
// Returns: { idle: AnimationClip, walk: AnimationClip, ... }
```

**Why:** Character models (`Rogue.glb`, `Knight.glb`, etc.) contain ONLY the 3D model and skeleton. Animations are in separate GLB files in:
- `/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/`
- `/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/`

### 2. ALWAYS Check Existing Systems Before Creating New Code

**Before writing animation code:**
1. ✅ Check `src/systems/animation/` - Working animation system exists
2. ✅ Check `src/hooks/useCharacterAnimation.ts` - React hook exists
3. ✅ Check `src/data/kaykit-animations.json` - Animation mappings exist
4. ✅ Check `ANIMATION_GUIDE.md` - Complete documentation exists

**If you're creating animation code, you're probably doing it wrong. Use existing systems!**

### 3. Use Existing Hooks and Systems

**✅ Use the existing hook:**
```typescript
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';

function MyCharacter({ model }) {
  const { playAnimation, crossfadeTo, isLoaded } = useCharacterAnimation({
    characterId: 'my-character',
    assetId: 'char_rogue',
    model,
    defaultAnimation: 'idle'
  });
  
  // Now use playAnimation() and crossfadeTo()
}
```

**❌ Don't create manual AnimationMixer/state machines unless absolutely necessary**

### 4. Reference Helper Games for Patterns

Two MIT-licensed helper games show correct patterns:
- `clear_the_dungeon/` - Shows correct animation loading from separate files
- `toonshooter-game/` - Additional implementation patterns

**Study these before creating new animation code.**

### 5. Check Context Folder for Objectives

Before major architectural changes, refer to:
- `Context/Quests4friends – Technical Design Document (gdd-aligned).docx`
- `Context/Quests4friends – High-level Game Design Document (updated).docx`
- `Context/Quests4friends – Asset Integration & Runtime Spec (claude Helper Doc).docx`

These are the **SOURCE OF TRUTH** for project objectives.

### 6. Asset Paths Are Important

**Character Models:**
```
/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb
```

**Animation Files (SEPARATE!):**
```
/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/Rig_Medium_General.glb
/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb
```

**Don't confuse these paths!**

---

## 📋 STANDARD WORKFLOW

### When Adding Character Animations:

1. **Load character model:**
   ```typescript
   const loader = new GLTFLoader();
   const gltf = await loader.load('/Assets/.../Characters/gltf/Rogue.glb');
   const model = gltf.scene;
   ```

2. **Load animations using AnimationSetLoader:**
   ```typescript
   import { animationSetLoader } from '../systems/animation/AnimationSetLoader';
   const animations = await animationSetLoader.loadCharacterAnimations('char_rogue');
   // animations = { idle: Clip, walk: Clip, run: Clip, ... }
   ```

3. **Use useCharacterAnimation hook:**
   ```typescript
   const { playAnimation, crossfadeTo } = useCharacterAnimation({
     characterId: 'player',
     assetId: 'char_rogue',
     model,
     defaultAnimation: 'idle'
   });
   ```

4. **Play animations:**
   ```typescript
   // For movement
   crossfadeTo('walk', 0.2);
   
   // For one-shot actions
   playAnimation('attack', { loop: false });
   ```

### When Debugging Animation Issues:

1. **Check console for errors:**
   - Are animation files loading?
   - Are clip names matching?

2. **Verify animation mappings in kaykit-animations.json:**
   - Does `char_rogue` map to correct animation set?
   - Are clip names correct?

3. **Verify file paths:**
   - Do animation files exist at expected paths?
   - Are paths relative to `public/` folder?

4. **Check mixer is updating:**
   - Is `AnimationManager.update(deltaTime)` being called?
   - Is `useFrame` hook running?

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Loading Animations from Character Model
```typescript
// WRONG
const gltf = await loader.load('/Characters/Rogue.glb');
const animations = gltf.animations; // Empty!
```
**Fix:** Use `animationSetLoader.loadCharacterAnimations('char_rogue')`

### ❌ Mistake 2: Creating New Animation Systems
Don't create new AnimationMixer/state machine code when existing systems work.
**Fix:** Use `useCharacterAnimation` hook or `AnimationManager`

### ❌ Mistake 3: Hardcoding Animation Paths
```typescript
// WRONG
const animPath = '/Assets/KayKit_.../Rig_Medium_General.glb';
```
**Fix:** Use `kaykit-animations.json` mappings via `AnimationSetLoader`

### ❌ Mistake 4: Assuming Animation Names
Don't guess animation names like 'Idle', 'Walking_A', etc.
**Fix:** Check `kaykit-animations.json` for exact names

### ❌ Mistake 5: Not Using Crossfading
```typescript
// WRONG - Instant switch
stopAnimation();
playAnimation('walk');
```
**Fix:** Use `crossfadeTo('walk', 0.2)` for smooth transitions

---

## 📁 File Organization

### Core Systems (Don't Modify Without Good Reason)
- `src/systems/animation/` - Animation loading and management
- `src/hooks/useCharacterAnimation.ts` - React animation hook
- `src/data/kaykit-animations.json` - Animation mappings

### Reference Material
- `clear_the_dungeon/` - Helper game (MIT)
- `toonshooter-game/` - Helper game
- `Test Files/` - Original Claude suggestions

### Source of Truth
- `Context/` - Design documents and objectives

### Documentation
- `ANIMATION_GUIDE.md` - Comprehensive animation guide
- `README.md` - Project overview

---

## ✅ Checklist Before Committing Animation Code

- [ ] Using `AnimationSetLoader` or `useCharacterAnimation` hook?
- [ ] Not trying to load animations from character models?
- [ ] Animation paths checked against `kaykit-animations.json`?
- [ ] Using `crossfadeTo` for smooth transitions?
- [ ] Mixer updates happening in `useFrame` or via `AnimationManager`?
- [ ] Tested idle animation plays correctly (no T-pose)?
- [ ] Movement animations transition smoothly?

---

## 🔍 Debugging Commands

### Check Available Animations:
```typescript
import { animationSetLoader } from '../systems/animation/AnimationSetLoader';
const animations = await animationSetLoader.loadCharacterAnimations('char_rogue');
console.log('Available animations:', Object.keys(animations));
```

### Check Animation Clips in File:
```typescript
import { animationLoader } from '../systems/animation/AnimationLoader';
const clips = await animationLoader.loadAnimations('/path/to/animation.glb');
console.log('Clips in file:', clips.map(c => c.name));
```

---

## 📚 Additional Resources

- `ANIMATION_GUIDE.md` - Complete animation system documentation
- `src/systems/animation/README.md` - Animation system README
- `clear_the_dungeon/src/app/props/character.ts` - Reference implementation

---

## 🎯 Remember

1. **Animations are in separate files** - Never assume they're in character models
2. **Use existing systems** - Don't reinvent the wheel
3. **Check Context folder** - For project objectives
4. **Reference helper games** - For patterns
5. **Test thoroughly** - Idle should NOT be T-pose!

**When in doubt, check `ANIMATION_GUIDE.md` and existing code before writing new code.**
