# 🚨 IMMEDIATE ACTION ITEMS

## Run This First (Priority 1)

```bash
# Start dev server
cd /home/engine/project/templates/quests4friends
npm run dev

# Open browser
# Navigate to: http://localhost:5173/play/demo-quest

# Check console for:
# 1. Asset loading logs
# 2. Model loading success/failure
# 3. Any 404 errors
# 4. Whether models or fallback geometry showing
```

---

## Quick Check Questions

### Visual Verification:
1. Are characters red capsules (fallback) or actual 3D models?
2. Are NPCs static or moving?
3. Does the character walk or slide?
4. Is the environment rendering (ground, trees, fog)?
5. Can you move with WASD?
6. Can you interact with the NPC (E key)?
7. Does dialogue appear?

### Console Verification:
1. Do you see "Asset Registry initialized with X assets"?
2. Do you see "Loading player model: char_rogue"?
3. Do you see "Player model loaded successfully" OR "Failed to load player model"?
4. Any 404 errors for .glb or .gltf files?
5. Any GLTFLoader parsing errors?

---

## Decision Tree

### If Models ARE Loading ✅
→ Great! Focus on animations and builder

**Next Steps:**
1. Implement simple idle animation (procedural breathing)
2. Add walking animation for player
3. Start building Quest Builder MVP

### If Models ARE NOT Loading (fallback only) ❌
→ Fix asset loading first

**Next Steps:**
1. Check file paths in console
2. Verify files exist (they should - we checked)
3. Check for CORS issues
4. Add detailed error logging
5. Test with direct file paths

---

## Quick Fixes (2-4 hours each)

### 1. Add Logging (1 hour)
Edit `src/systems/assets/AssetRegistry.ts`:
```typescript
async loadModel(assetId: string) {
  console.log('[AssetRegistry] Loading:', assetId);
  console.log('[AssetRegistry] Path:', asset.gltfPath);

  const loadingPromise = new Promise((resolve, reject) => {
    this.loader.load(
      asset.gltfPath,
      (gltf) => {
        console.log('[AssetRegistry] ✅ Loaded:', assetId);
        console.log('[AssetRegistry] Scene children:', gltf.scene.children.length);
        console.log('[AssetRegistry] Animations:', gltf.animations?.length || 0);
        // ... rest of code
      },
      (progress) => {
        console.log('[AssetRegistry] Progress:', Math.round(progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('[AssetRegistry] ❌ Failed:', assetId, error);
        reject(error);
      }
    );
  });
}
```

### 2. Procedural Idle Animation (2 hours)
Edit `src/components/game/entities/NPCEntity.tsx`:
```typescript
// Add after model is set
const originalY = useRef(0);

useEffect(() => {
  if (model) {
    originalY.current = model.position.y;
  }
}, [model]);

useFrame((state) => {
  if (modelRef.current && !showInteract) {
    // Gentle breathing/bobbing
    const bob = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    modelRef.current.position.y = originalY.current + bob;
  }
});
```

### 3. Model Auto-Scaling (1 hour)
Edit `src/components/game/PlayerController.tsx` (and NPCEntity.tsx):
```typescript
// After setting modelClone.position.y
const targetHeight = 1.8; // meters
const currentHeight = box.max.y - box.min.y;

if (currentHeight > 0) {
  const scale = targetHeight / currentHeight;
  modelClone.scale.setScalar(scale);
  console.log(`Scaled ${playerAssetId} by ${scale.toFixed(2)}x to ${targetHeight}m`);
}
```

---

## Full Implementation Tasks

### Priority 1: Animation System (2-3 days)
- [ ] Create `src/hooks/useAnimations.ts`
- [ ] Load animation clips from `Animations/gltf/` directory
- [ ] Set up THREE.AnimationMixer for each entity
- [ ] Implement idle animation for NPCs
- [ ] Implement walk/run animation for player
- [ ] Add animation blending (idle ↔ walk)
- [ ] Update animations in `useFrame` loop

### Priority 2: Quest Builder MVP (3-5 days)
- [ ] Create `src/components/builder/BuilderCanvas.tsx`
- [ ] Create `src/components/builder/AssetPalette.tsx`
- [ ] Create `src/components/builder/EntityEditor.tsx`
- [ ] Create `src/store/builderStore.ts`
- [ ] Implement click-to-place entities
- [ ] Implement entity selection
- [ ] Implement drag-to-move entities
- [ ] Add quest settings form (title, template, style)
- [ ] Add task creation interface
- [ ] Implement save to localStorage
- [ ] Implement export to JSON

### Priority 3: Polish (2-3 days)
- [ ] Add interaction animations
- [ ] Add facial expressions
- [ ] Improve builder UX (drag-drop, visual editor)
- [ ] Add trigger system visualizer
- [ ] Add quest preview mode
- [ ] Implement share URL generation
- [ ] Add error boundaries
- [ ] Add loading states for assets

---

## Testing Checklist

### Asset Loading Test:
```bash
1. Start dev server
2. Open http://localhost:5173/play/demo-quest
3. Open DevTools (F12)
4. Go to Console tab
5. Look for:
   ✅ "Asset Registry initialized with X assets"
   ✅ "Loading player model: char_rogue"
   ✅ "Player model loaded successfully"
   ✅ "Player model positioned at: {x: 0, y: 0, z: 0}"
   ✅ "NPC model loaded and positioned: char_rogue"

If you see ❌ errors:
   - Check file paths
   - Check for 404s
   - Check GLTFLoader errors
```

### Gameplay Test:
```bash
1. Try to move with WASD
2. Try to interact with NPC (E key)
3. Try to collect treasure (walk to -5, 0, -5)
4. Check task completion updates in UI
5. Check dialogue appears correctly
6. Check all controls work
```

### Builder Test (after implementation):
```bash
1. Go to http://localhost:5173/builder
2. Try to select world template
3. Try to add NPC
4. Try to move NPC in 3D view
5. Try to edit NPC properties
6. Try to create task
7. Try to save quest
8. Try to export quest
9. Try to play created quest
```

---

## Known Issues & Workarounds

### Issue: NPCs in T-pose
**Workaround:** Add procedural idle animation (see above)
**Permanent Fix:** Implement full animation system

### Issue: Player slides when moving
**Workaround:** Acceptable for demo
**Permanent Fix:** Add walk animation

### Issue: Builder not implemented
**Workaround:** N/A - cannot use builder
**Permanent Fix:** Implement Builder MVP

### Issue: Models might not be loading
**Workaround:** Verify with console logs
**Permanent Fix:** Add logging and fix paths if needed

---

## Files to Modify

### For Logging:
- `src/systems/assets/AssetRegistry.ts` - Add console.log statements

### For Quick Fixes:
- `src/components/game/PlayerController.tsx` - Add auto-scaling
- `src/components/game/entities/NPCEntity.tsx` - Add procedural idle

### For Animation System:
- `src/hooks/useAnimations.ts` - NEW FILE
- `src/components/game/PlayerController.tsx` - Use useAnimations
- `src/components/game/entities/NPCEntity.tsx` - Use useAnimations
- `src/components/game/entities/EnemyEntity.tsx` - Use useAnimations

### For Quest Builder:
- `src/store/builderStore.ts` - NEW FILE
- `src/components/builder/BuilderCanvas.tsx` - NEW FILE
- `src/components/builder/AssetPalette.tsx` - NEW FILE
- `src/components/builder/EntityEditor.tsx` - NEW FILE
- `src/components/builder/TaskEditor.tsx` - NEW FILE
- `src/components/builder/Toolbar.tsx` - NEW FILE
- `src/pages/BuilderPage.tsx` - Replace with builder UI

---

## Helpful Commands

```bash
# Development
npm run dev                    # Start dev server

# Building
npm run build                  # Build for production
npm run preview                # Preview production build

# Linting
npm run lint                   # Run ESLint

# Verification
node verify-assets.js          # Check asset files exist

# Testing (once implemented)
npm test                      # Run tests
```

---

## Documentation

Created audit documents:
- ✅ `AUDIT_REPORT.md` - Comprehensive 500+ line audit
- ✅ `AUDIT_SUMMARY.md` - Executive summary with action items
- ✅ `TODO_NEXT.md` - This file - immediate action items
- ✅ `verify-assets.js` - Asset verification script

---

## Contact & Support

**Repository:** /home/engine/project/templates/quests4friends
**Dev Server:** http://localhost:5173
**Demo Quest:** http://localhost:5173/play/demo-quest
**Builder:** http://localhost:5173/builder (not implemented yet)

---

**Ready to proceed with implementation! 🚀**
