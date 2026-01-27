# Viber3D Asset and Animation Index

## 🎯 Overview
This repository contains multiple 3D asset packs and animation systems for building interactive 3D applications with React Three Fiber. The system supports multiple character rigs and animation libraries with automatic bone mapping and compatibility detection.

## 📁 Repository Structure

```
viber3d/
├── Assets/                          # All 3D assets and models
│   ├── KayKit_Adventurers_2.0_FREE/        # KayKit character pack
│   ├── KayKit_Character_Animations_1.1/    # KayKit animation library
│   ├── KayKit Character Animations 1.2/    # Updated KayKit animations
│   ├── RPG Characters - Nov 2020/           # Quaternius RPG character pack
│   ├── three.js/                           # Three.js example models
│   ├── glTF-Sample-Models/                 # Khronos glTF samples
│   └── glTF-Sample-Assets/                 # Additional glTF assets
├── templates/questly/               # Main application
│   ├── public/Assets/               # Web-accessible assets
│   └── src/                         # Application source code
└── Documentation and guides
```

## 🎮 Asset Packs

### 1. KayKit Adventurers Pack
**Location:** `Assets/KayKit_Adventurers_2.0_FREE/`
**Status:** ✅ Fully Working
**Characters:** 5 fantasy adventurers
- Mage (char_mage)
- Knight (char_knight) 
- Ranger (char_ranger)
- Rogue (char_rogue)
- Barbarian (char_barbarian)

**Animations:** 57+ professional animations
- Movement: idle, walk, run, sprint, jump
- Combat: attack, defend, dodge, death
- Actions: cast, interact, climb, swim
- Emotions: celebrate, taunt, bow

### 2. Quaternius RPG Characters
**Location:** `Assets/RPG Characters - Nov 2020/`
**Status:** ⚠️ Models Working, Animations in Progress
**Characters:** 6 fantasy classes
- Cleric (quat_cleric)
- Monk (quat_monk)
- Ranger (quat_ranger)
- Rogue (quat_rogue)
- Warrior (quat_warrior)
- Wizard (quat_wizard)

**Model Formats Available:**
- FBX files in `Humanoid Rig Versions/FBX/`
- glTF files in `glTF/`
- Blender files in `Blends/`

### 3. Kenny Assets Pack
**Location:** Placeholder
**Status:** 🔧 Under Development
**Description:** Reserved for Kenny.nl style assets

## 🎭 Animation Systems

### KayKit Animation System
**Database:** `templates/questly/src/data/kaykit-animations.json`
**Type:** Custom bone structure (hips, handslotl, etc.)
**Animation Files:** 8 GLB files with specific animation categories

**File Structure:**
```
KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/
├── Rig_Medium_MovementBasic.glb      # Walk, run, idle
├── Rig_Medium_MovementAdvanced.glb   # Jump, climb, swim
├── Rig_Medium_CombatMelee.glb        # Sword attacks, blocks
├── Rig_Medium_CombatRanged.glb       # Bow, crossbow, throw
├── Rig_Medium_General.glb            # Interactions, gestures
├── Rig_Medium_Simulation.glb         # Sit, sleep, eat
├── Rig_Medium_Special.glb            # Magic, celebrate
└── Rig_Medium_Tools.glb              # Mining, crafting
```

### Mixamo-Compatible Animation System
**Database:** `mixamo_enhanced` animation set
**Type:** Standard humanoid bones (Hips, Spine, LeftArm, etc.)
**Source Models:** Professional glTF samples

**Animation Sources:**
```
templates/questly/public/Assets/mixamo-animations/
├── Fox.glb              # 3 animations (Survey, Walk, Run)
├── CesiumMan.glb        # 1 walking animation
├── RiggedFigure.glb     # 1 rigged animation
├── Xbot.glb             # 7 animations (agree, headShake, idle, run, etc.)
├── Soldier.glb          # 4 military animations
└── RobotExpressive.glb  # 14 expressive animations
```

## 🔧 Technical Implementation

### Animation Database Structure
```json
{
  "basePaths": {
    "characterAnim11_medium": "/Assets/KayKit_Character_Animations_1.1/...",
    "mixamo_animations": "/Assets/mixamo-animations"
  },
  "characterMappings": {
    "char_mage": "humanoid_enhanced",     // KayKit system
    "quat_cleric": "mixamo_enhanced"      // Mixamo system
  },
  "animationSets": {
    "humanoid_enhanced": { /* KayKit animations */ },
    "mixamo_enhanced": { /* Mixamo-compatible animations */ }
  }
}
```

### Character Asset IDs
**KayKit Characters:**
- `char_mage` → Mage character
- `char_knight` → Knight character  
- `char_ranger` → Ranger character
- `char_rogue` → Rogue character
- `char_barbarian` → Barbarian character

**Quaternius Characters:**
- `quat_cleric` → Cleric model
- `quat_monk` → Monk model
- `quat_ranger` → Ranger model
- `quat_rogue` → Rogue model
- `quat_warrior` → Warrior model
- `quat_wizard` → Wizard model

## 📊 Animation Compatibility Matrix

| Character Pack | Animation System | Bone Structure | Status | Animation Count |
|---------------|------------------|----------------|---------|-----------------|
| KayKit | humanoid_enhanced | Custom KayKit | ✅ Working | 57+ |
| Quaternius | mixamo_enhanced | Standard Humanoid | ⚠️ Testing | 22+ |
| Kenny | TBD | TBD | 🚧 Planned | TBD |

## 🎨 Asset Pack Selection UI

The application provides a three-button asset pack selector:
```typescript
const ASSET_PACKS = [
  { id: 'kaykit', name: 'KayKit', characters: [...] },
  { id: 'kenny', name: 'Kenny', characters: [...] },
  { id: 'quaternius', name: 'Quaternius', characters: [...] }
]
```

## 🔍 Current Issues and Status

### ✅ Working Systems
- KayKit characters with full animation support
- Multi-asset pack UI system
- Character preview and selection
- Animation database with corrected clip mappings
- Bone structure analysis and debugging

### ⚠️ In Progress
- Quaternius animation compatibility
- Bone mapping between different rig systems
- Animation retargeting for cross-compatibility

### 🚧 Planned Features
- Kenny asset pack integration
- Custom animation uploads
- Animation blending and transitions
- Character customization system

## 📋 Animation Categories

### Movement Animations
- **idle** - Character resting state
- **walk** - Normal walking pace
- **run** - Fast running motion
- **sprint** - Maximum speed movement
- **jump** - Jumping motion
- **climb** - Climbing ladders/walls

### Combat Animations
- **attack_melee** - Sword/melee attacks
- **attack_ranged** - Bow/projectile attacks
- **defend** - Blocking/defensive poses
- **dodge** - Evasive movements
- **death** - Character defeat animation

### Interaction Animations
- **cast** - Magic spell casting
- **interact** - Object interaction
- **pickup** - Item collection
- **use_item** - Item usage
- **talk** - Conversation gestures

### Emotional Animations
- **celebrate** - Victory/success
- **taunt** - Provocative gestures
- **bow** - Respectful greeting
- **wave** - Friendly gesture
- **agree/disagree** - Nodding motions

## 🛠️ Development Tools

### Animation Analysis
```bash
# Analyze GLB file structure
node -e "analyzeGLB('path/to/file.glb')"

# Check bone compatibility
console.log('Sample bones:', bones.map(n => n.name))
```

### Asset Management
```bash
# Copy new assets
Copy-Item 'source/file.glb' 'public/Assets/destination/'

# Update animation database
# Edit: templates/questly/src/data/kaykit-animations.json
```

## 📖 Usage Examples

### Loading a Character
```typescript
// Select KayKit Mage
const character = {
  assetPack: 'kaykit',
  characterId: 'char_mage',
  animationSet: 'humanoid_enhanced'
}

// Select Quaternius Cleric  
const character = {
  assetPack: 'quaternius',
  characterId: 'quat_cleric',
  animationSet: 'mixamo_enhanced'
}
```

### Playing Animations
```typescript
// Play idle animation
animationManager.playAnimation(characterId, 'idle', { loop: true })

// Play attack sequence
animationManager.playAnimation(characterId, 'attack_melee', { 
  loop: false,
  clampWhenFinished: true 
})
```

## 🔧 Troubleshooting

### Common Issues
1. **Animation not playing** - Check bone structure compatibility
2. **Wrong animation mapping** - Verify clip names in GLB files
3. **T-pose flickering** - Bone naming mismatch between character and animation
4. **Console binding errors** - Animation trying to bind to non-existent bones

### Debugging Commands
```javascript
// Check model bone structure
model.traverse(child => {
  if (child instanceof THREE.Bone) {
    console.log('Bone:', child.name)
  }
})

// List available animations
console.log('Animations:', Object.keys(animations))
```

## 🎯 Future Roadmap

### Phase 1 - Current (Animation Compatibility)
- ✅ KayKit system working
- 🔄 Quaternius animation integration
- 🔄 Cross-rig compatibility testing

### Phase 2 - Asset Expansion
- 📋 Kenny asset pack integration
- 📋 Additional character varieties
- 📋 Custom character creation tools

### Phase 3 - Advanced Features
- 📋 Animation blending system
- 📋 Real-time retargeting
- 📋 Custom animation uploads
- 📋 Character equipment/customization

## 🧑‍💻 Developer Notes

### Asset Integration Checklist
1. Copy GLB/FBX files to appropriate directories
2. Analyze bone structure and animation clips
3. Update animation database with new mappings
4. Test character loading and animation playback
5. Document any compatibility issues
6. Add to asset pack selection UI

### Performance Considerations
- GLB files are optimized for web delivery
- Animation clips are shared between characters where possible
- Bone analysis is cached to prevent repeated calculations
- Large animation sets are lazy-loaded

---

**Last Updated:** January 24, 2026  
**Repository:** https://github.com/user/viber3d  
**Documentation Version:** 1.0