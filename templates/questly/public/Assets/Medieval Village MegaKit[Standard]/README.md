# Medieval Village MegaKit [Standard]

## Overview  
Comprehensive modular building system for creating medieval villages and towns. Features 200+ individual components including walls, roofs, floors, stairs, props, and architectural details designed for flexible construction.

## Purpose in Viber3D
- **Modular Building:** Create custom medieval structures
- **Village Construction:** Complete settlement building system
- **Quest Architecture:** Buildings for adventure locations  
- **Procedural Towns:** Mix-and-match building components

## Component Categories & Count

### Structural Elements (75+ models)
| Category | Components | Description |
|----------|------------|-------------|
| **Walls** | 25 | Plaster & brick walls with doors/windows |
| **Roofs** | 35 | Various tile and wooden roof sections |
| **Floors** | 15 | Wood and brick flooring options |
| **Stairs** | 20 | Interior and exterior staircase variants |

### Architectural Details (50+ models)
| Category | Components | Description |
|----------|------------|-------------|
| **Corners** | 10 | Interior/exterior building corners |
| **Doors** | 12 | Various door styles and frames |
| **Windows** | 16 | Different window styles with shutters |
| **Balconies** | 4 | Cross and simple balcony types |
| **Overhangs** | 20 | Roof overhangs and architectural extensions |

### Props & Decorations (75+ models)
| Category | Components | Description |
|----------|------------|-------------|
| **Fencing** | 8 | Metal and wooden fence variants |
| **Props** | 15 | Chimneys, crates, wagons, supports |
| **Vines** | 6 | Climbing vegetation details |
| **Architectural** | 10 | Exterior borders, hole covers |

## Directory Structure
```
Medieval Village MegaKit[Standard]/
├── glTF/                           # glTF 2.0 format (400+ files)
│   ├── Walls/                     # Wall components (50 models)
│   │   ├── Wall_Plaster_*.gltf    # Plaster walls with openings
│   │   └── Wall_UnevenBrick_*.gltf # Brick walls with features
│   ├── Roofs/                     # Roof systems (70 models)
│   │   ├── Roof_RoundTiles_*.gltf # Tile roof sections
│   │   ├── Roof_Wooden_*.gltf     # Wooden beam roofs
│   │   └── Roof_Front_*.gltf      # Front-facing roof elements
│   ├── Floors/                    # Flooring (30 models)
│   │   ├── Floor_Brick*.gltf      # Stone/brick floors
│   │   └── Floor_Wood*.gltf       # Wooden floor variants
│   ├── Stairs/                    # Staircases (40 models)
│   │   ├── Stairs_Exterior_*.gltf # External stairs/platforms
│   │   └── Stair_Interior_*.gltf  # Internal staircases
│   ├── Doors & Windows/           # Openings (56 models)
│   │   ├── Door_*.gltf            # Various door styles
│   │   ├── DoorFrame_*.gltf       # Door frames
│   │   ├── Window_*.gltf          # Window variations
│   │   └── WindowShutters_*.gltf  # Window shutters
│   ├── Architectural/             # Details (60 models)
│   │   ├── Corner_*.gltf          # Building corners
│   │   ├── Balcony_*.gltf         # Balcony components
│   │   └── Overhang_*.gltf        # Roof overhangs
│   ├── Props/                     # Scene props (60 models)
│   │   ├── Prop_*.gltf            # Various props and details
│   │   └── HoleCover_*.gltf       # Utility covers
│   └── Textures/                  # 11 PBR texture sets
│       ├── T_*_BaseColor.png      # Diffuse maps
│       ├── T_*_Normal.png         # Normal maps
│       └── T_*_Roughness.png      # Surface properties
├── FBX/                           # FBX format versions
├── OBJ/                           # OBJ format versions
├── Textures/                      # Standalone texture files
└── Preview.jpg                    # Asset overview
```

## Component Breakdown

### Wall System (25 models)
**Plaster Walls (15 models):**
- Wall_Plaster_Straight variants (4)
- Wall_Plaster_Door_Flat/Round (3)  
- Wall_Plaster_Window variants (6)
- Wall_Plaster_WoodGrid (1)
- Wall_Arch, Wall_BottomCover (2)

**Brick Walls (10 models):**
- Wall_UnevenBrick_Straight (1)
- Wall_UnevenBrick_Door_Flat/Round (2)
- Wall_UnevenBrick_Window variants (4)

### Roof System (35 models)  
**Tile Roofs (20 models):**
- Roof_RoundTiles_4x4 through 8x14 (15)
- Roof_RoundTile_2x1 variants (3)
- Roof_Modular_RoundTiles (1)
- Roof_Tower_RoundTiles (1)

**Wooden Roofs (8 models):**
- Roof_Wooden_2x1 variants (7)
- Roof_Log (1)

**Roof Details (7 models):**
- Roof_Front_Brick variants (6)
- Roof_Support systems (1)

### Floor System (15 models)
**Brick Floors (4 models):**
- Floor_Brick, Floor_RedBrick (2)
- Floor_UnevenBrick (1)

**Wood Floors (11 models):**
- Floor_WoodDark variants (7)
- Floor_WoodLight variants (4)

### Stair System (20 models)
**Exterior Stairs (15 models):**
- Platform and side configurations
- Straight, angled, and U-shaped variants
- Different support structures

**Interior Stairs (5 models):**
- Simple, solid, and railed versions
- Extended configurations

### Door & Window System (28 models)
**Doors (8 models):**
- Door_1/2/4/8 in Flat/Round styles (8)

**Door Frames (4 models):**
- Flat/Round in Brick/Wood materials (4)

**Windows (8 models):**
- Thin/Wide in Flat/Round styles (4)
- Roof windows (2)

**Window Shutters (8 models):**
- Open/Closed in Thin/Wide variants (8)

## Technical Specifications

### File Format
- **Primary:** glTF 2.0 with separate .gltf + .bin files
- **Alternative:** FBX and OBJ versions available
- **Total Files:** 400+ individual components

### Texture System
- **PBR Materials:** 11 texture sets with BaseColor, Normal, Roughness
- **Material Types:** Brick, Plaster, Wood, Metal, Tiles, Stone
- **High Quality:** Detailed surface textures
- **Consistent Style:** Cohesive medieval aesthetic

### Modular Design
- **Grid-Based:** Components align on standard grid
- **Flexible Combination:** Mix materials and styles
- **Scalable Architecture:** From small houses to large complexes
- **Detail Levels:** Structural elements to fine decorative details

## Asset Manifest
```json
{
  "total_components": 200,
  "walls": 25,
  "roofs": 35,
  "floors": 15,
  "stairs": 20,
  "doors_windows": 28,
  "architectural_details": 30,
  "props": 35,
  "textures": 11,
  "formats": ["glTF", "FBX", "OBJ"],
  "style": "Medieval modular",
  "license": "Standard"
}
```

## Building Component Categories

### Core Structure
```
Walls: 25 components
├── Plaster walls (15) - Clean interior/exterior surfaces
└── Brick walls (10) - Rustic stone construction

Roofs: 35 components  
├── Round tiles (20) - Traditional clay roof tiles
├── Wooden beams (8) - Rustic timber construction
└── Decorative (7) - Architectural roof details

Floors: 15 components
├── Brick floors (4) - Stone and brick surfaces  
└── Wood floors (11) - Various wooden flooring
```

### Architectural Details
```
Doors & Windows: 28 components
├── Doors (8) - Various sizes and styles
├── Door frames (4) - Brick and wood frames
├── Windows (8) - Different configurations
└── Shutters (8) - Functional window covers

Stairs: 20 components
├── Exterior (15) - Platforms, sides, angles
└── Interior (5) - Simple to complex staircases

Details: 30 components
├── Corners (8) - Building edge treatments
├── Balconies (4) - Cross and simple styles
├── Overhangs (20) - Roof extensions and eaves
```

### Props & Decoration
```
Scene Props: 35 components
├── Fencing (8) - Metal and wooden barriers
├── Furniture (7) - Crates, wagons, supports
├── Vegetation (6) - Climbing vines and plants
├── Chimneys (2) - Roof smoke stacks
└── Utility (12) - Hole covers, borders, misc
```

## Usage Guidelines

### Building Construction
1. **Foundation:** Start with floor components
2. **Walls:** Use straight walls, add doors/windows
3. **Corners:** Connect wall sections properly
4. **Roofing:** Layer roof tiles, add overhangs
5. **Details:** Add stairs, balconies, props

### Material Combinations
- **Plaster + Wood:** Standard village houses
- **Brick + Tile:** Sturdy commercial buildings  
- **Mixed Materials:** Realistic architectural variety
- **Consistent Textures:** Maintain visual cohesion

### Performance Optimization
- **Component Instancing:** Reuse common elements
- **LOD System:** Simplify distant buildings
- **Texture Atlasing:** Group similar materials
- **Culling:** Hide interior components when enclosed

## Integration Status

### Current Use in Viber3D
- 📋 **Available** - Ready for building system integration
- 🎯 **High Value** - Complete medieval construction kit
- 🔧 **Modular Design** - Perfect for procedural generation

### Recommended Applications
- **Village Builder:** Player-constructed settlements
- **Quest Locations:** Custom building creation
- **Procedural Towns:** Algorithm-generated layouts
- **Set Pieces:** Hand-crafted important buildings

---
**Source:** Unknown Publisher  
**License:** Standard License  
**Purpose:** Modular medieval building system  
**Total Components:** 200+ models  
**Complexity:** Professional architectural kit  
**Viber3D Status:** Available for integration  
**Last Updated:** January 24, 2026