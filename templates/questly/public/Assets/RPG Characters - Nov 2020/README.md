# Quaternius RPG Characters - November 2020

## Overview
Professional RPG character pack by Quaternius featuring 6 fantasy class archetypes with standard humanoid rigs. These characters use industry-standard bone structures compatible with Mixamo and other animation systems.

## Character Classes (6 Models)

| Character | Description | Weapon | Texture Files |
|-----------|-------------|---------|---------------|
| **Cleric** | Divine healer/support | Staff | `Cleric_Texture.png`, `Cleric_Staff_Texture.png` |
| **Monk** | Martial artist/fighter | Unarmed | `Monk_Texture.png` |
| **Ranger** | Nature archer/scout | Bow | `Ranger_Texture.png`, `Ranger_Bow_Texture.png` |
| **Rogue** | Stealth assassin | Dagger | `Rogue_Texture.png`, `Rogue_Dagger_Texture.png` |
| **Warrior** | Tank/melee fighter | Sword | `Warrior_Texture.png`, `Warrior_Sword_Texture.png` |
| **Wizard** | Arcane spellcaster | Staff | `Wizard_Texture.png`, `Wizard_Staff_Texture.png` |

## Available Formats

### Humanoid Rig Versions
**Location:** `Humanoid Rig Versions/FBX/`
- **Purpose:** Standard humanoid bone structure
- **Compatible with:** Mixamo animations, UE4/Unity humanoid systems
- **File Format:** FBX with embedded rigs
- **Best for:** Animation retargeting and game engines

### glTF Web Format
**Location:** `glTF/`
- **Purpose:** Web-optimized 3D models
- **File Format:** glTF separate files (.gltf + .bin + textures)
- **Best for:** Web applications, Three.js, React Three Fiber

### FBX (Original)
**Location:** `FBX/`
- **Purpose:** 3D software integration
- **File Format:** Standard FBX
- **Best for:** Blender, Maya, 3ds Max workflow

### OBJ (Static)
**Location:** `OBJ/`
- **Purpose:** Static meshes only
- **File Format:** OBJ + MTL
- **Best for:** 3D printing, static scenes (no animations)

### Blender Source
**Location:** `Blends/`
- **Purpose:** Original Blender project files
- **Best for:** Modifications, custom variants

## Technical Specifications

### Bone Structure
Uses **standard humanoid naming convention:**
```
Armature
├── Hips
├── Spine
│   ├── Spine1
│   ├── Spine2
│   └── Chest
├── Neck
├── Head
├── LeftShoulder → LeftArm → LeftForeArm → LeftHand
├── RightShoulder → RightArm → RightForeArm → RightHand
├── LeftUpLeg → LeftLeg → LeftFoot → LeftToeBase
└── RightUpLeg → RightLeg → RightFoot → RightToeBase
```

### Animation Compatibility
- ✅ **Mixamo:** Fully compatible with Mixamo animation library
- ✅ **Unity Humanoid:** Works with Unity's humanoid rig system
- ✅ **UE4/UE5:** Compatible with Unreal Engine humanoid system
- ⚠️ **KayKit Animations:** Bone structure incompatible (custom naming)

## Texture Details
**Location:** `Textures/`
**Resolution:** 1024x1024 PNG
**Style:** Hand-painted, stylized
**Channels:** Diffuse color maps

### Texture Breakdown
- **Character Textures:** Base character skin/clothing (11 files)
- **Weapon Textures:** Separate textures for weapons (5 files)
- **Total Size:** ~16 MB texture data

## Integration Status (Viber3D)

### Current Implementation
- ✅ **Models Loading:** All 6 characters display correctly
- ⚠️ **Animation System:** Testing Mixamo-compatible animations
- 🔄 **Bone Mapping:** Working on animation retargeting
- 📋 **Planned:** Full animation library integration

### Asset IDs (Internal)
```javascript
const quaterniusCharacters = {
  'quat_cleric': 'Cleric.gltf',
  'quat_monk': 'Monk.gltf', 
  'quat_ranger': 'Ranger.gltf',
  'quat_rogue': 'Rogue.gltf',
  'quat_warrior': 'Warrior.gltf',
  'quat_wizard': 'Wizard.gltf'
};
```

## Usage Recommendations

### For Animation
1. **Use Humanoid Rig Versions** for animation compatibility
2. **Import to Mixamo** for automatic animation retargeting
3. **Export as GLB** for web deployment
4. **Use standard humanoid animations** (not KayKit custom)

### For Web Development
1. Convert to GLB format for optimal loading
2. Use glTF files as starting point
3. Apply Mixamo animations via external sources
4. Implement standard humanoid bone mapping

## Known Limitations
- **No Built-in Animations:** Characters are static models
- **KayKit Incompatibility:** Cannot use KayKit animation system directly
- **Texture Separation:** Textures not embedded in model files
- **Large File Sizes:** Higher polygon count than KayKit characters

## Asset Manifest
```json
{
  "characters": 6,
  "classes": ["Cleric", "Monk", "Ranger", "Rogue", "Warrior", "Wizard"],
  "formats": ["FBX", "glTF", "OBJ", "Blend"],
  "textures": 16,
  "rig_type": "Standard Humanoid",
  "animations_included": false,
  "mixamo_compatible": true,
  "total_size": "~50 MB",
  "license": "CC0 (Public Domain)"
}
```

## File Structure
```
RPG Characters - Nov 2020/
├── Humanoid Rig Versions/
│   └── FBX/                    # Animation-ready characters
├── glTF/                       # Web format (6 files)
├── FBX/                        # Standard FBX format
├── OBJ/                        # Static meshes only
├── Blends/                     # Blender source files
├── Textures/                   # 16 PNG texture files
├── Preview.jpg                 # Character lineup preview
└── License.txt                 # CC0 Public Domain license
```

---
**Source:** Quaternius  
**Release:** November 2020  
**License:** CC0 Public Domain (Free for any use)  
**Rig Type:** Standard Humanoid  
**Animation Ready:** Yes (requires external animations)  
**Viber3D Status:** Models integrated, animations in development  
**Last Updated:** January 24, 2026