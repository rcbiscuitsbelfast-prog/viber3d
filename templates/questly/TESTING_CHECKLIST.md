# Questly Character Animation - Testing Checklist

## Access the Application
- URL: http://localhost:3000
- Dev server is running on port 3000

## Testing Steps

### 1. Main Menu
- [ ] Load main menu page
- [ ] Verify Three.js splash screen appears
- [ ] Click "Start Building" to enter app

### 2. Navigation
- [ ] Top-right should show "Sign In" button (not authenticated)
- [ ] Click "Sign In" - should show mock sign-in success
- [ ] Button should change to "Dashboard" with dashboard icon

### 3. Dashboard Access
- [ ] Click "Dashboard" button
- [ ] Dashboard page should load

### 4. Character Preview Box
#### Visual Checks
- [ ] Mage character model should be **fully visible** (not just skeleton)
- [ ] Character should have proper colors and textures
- [ ] Character should be well-lit (not too dark)
- [ ] Shadow should appear under character
- [ ] Background should have sunset environment lighting

#### Animation Checks
- [ ] Loading text "Loading Character..." should appear briefly
- [ ] Character should start in "idle" animation
- [ ] Animation dropdown should appear at bottom of preview box
- [ ] Dropdown should list multiple animations (20+)

### 5. Animation Testing
Try these animations and verify smooth transitions:
- [ ] **idle** - Character standing still, subtle breathing
- [ ] **walk** - Walking forward animation
- [ ] **run** - Running forward animation
- [ ] **jump** - Jump animation
- [ ] **attack** or **attackMelee** - Sword/melee attack
- [ ] **wave** - Friendly wave gesture
- [ ] **death** - Death animation

#### Expected Behavior
- [ ] Animations should transition smoothly (crossfade)
- [ ] No T-pose or broken poses
- [ ] Character body should remain visible during all animations
- [ ] No yellow skeleton/rig visible
- [ ] Animations should loop appropriately (walk, run, idle)
- [ ] One-shot animations (attack, jump) should complete then return

### 6. Camera Controls
- [ ] Click and drag to rotate camera around character
- [ ] Scroll to zoom in/out
- [ ] Camera should stay focused on character
- [ ] Cannot zoom too close or too far

### 7. Browser Console
Open browser DevTools (F12) and check Console tab:
- [ ] No red errors
- [ ] Should see logs like:
  ```
  [AnimationSetLoader] Loading animation set: humanoid_enhanced for character: char_mage
  [useCharacterAnimation] Loaded 24 animations: ['idle', 'walk', 'run', ...]
  [AnimatedCharacter] Loaded 24 animations: [...]
  ```

## Known Issues to Watch For

### ❌ Yellow Skeleton Visible
**Problem**: Character mesh not loading, only animation rig showing
**Fix**: Check that `/models/Mage.glb` exists and `/Assets/` folder is copied

### ❌ Character in T-Pose
**Problem**: Animations not playing
**Fix**: Check browser console for animation loading errors

### ❌ "Loading..." Stuck on Screen
**Problem**: Animations not loading or callback not firing
**Fix**: Check console for GLTFLoader errors

### ❌ Character Not Visible at All
**Problem**: Model failed to load
**Fix**: Check Network tab in DevTools for 404 errors on model files

## Success Criteria
✅ Mage character **body is fully visible** with proper textures
✅ Character plays default "idle" animation on load
✅ Animation dropdown shows 20+ animations
✅ Animations transition smoothly when selected
✅ No T-pose, no skeleton/rig visible
✅ Camera controls work smoothly
✅ No console errors

## Debugging Tips

### Check Model Loading
1. Open DevTools → Network tab
2. Filter by "glb"
3. Verify these load successfully:
   - `/models/Mage.glb` (character model)
   - `/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/...` (animation files)

### Check Console Logs
Look for these key log messages:
```
[AnimationSetLoader] Loading animation set: humanoid_enhanced
[useCharacterAnimation] Loaded N animations
[AnimatedCharacter] Loaded N animations
```

### Animation Database
If animations don't load, check:
1. `/src/data/kaykit-animations.json` exists
2. `characterMappings` has entry for `char_mage`
3. Animation GLB files exist in `/public/Assets/`

## Comparison: Before vs After

### Before (Broken)
- Yellow skeleton visible
- No character mesh/body
- Only animation rig showing
- User frustrated: "WTF?"

### After (Fixed)
- Full Mage character visible
- Proper colors and textures
- Smooth animations
- Professional character preview

## Next Steps After Successful Test
1. Add more characters (Knight, Ranger, Rogue)
2. Add character selector to dashboard
3. Integrate character into quest builder
4. Add animation preview thumbnails
5. Create character customization UI
