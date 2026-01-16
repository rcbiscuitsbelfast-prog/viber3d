# Quest Builder UI - Implementation Guide

## Overview

The Quest Builder is a professional, intuitive interface for creating interactive 3D quests. It features drag-and-drop entity placement, real-time 3D preview, comprehensive property editing, and task management.

## Architecture

### Directory Structure

```
src/
├── components/
│   └── builder/
│       ├── BuilderHeader.tsx          # Top toolbar with quest meta and actions
│       ├── AssetPalette.tsx           # Left sidebar with draggable assets
│       ├── BuilderCanvas.tsx          # Center 3D canvas with entity preview
│       ├── EntityPreview.tsx          # 3D representation of entities
│       ├── EntityPropertiesPanel.tsx  # Right sidebar for entity editing
│       ├── TasksPanel.tsx             # Bottom panel for task management
│       ├── TaskEditModal.tsx          # Modal for creating/editing tasks
│       ├── PreviewMode.tsx            # Full-screen quest preview
│       └── index.ts                   # Barrel exports
├── store/
│   ├── builderStore.ts                # Zustand store for builder state
│   └── questStore.ts                  # Zustand store for quest playback
├── data/
│   └── asset-categories.json          # Asset library definition
└── pages/
    └── BuilderPage.tsx                # Main builder page component
```

## Features Implemented

### ✅ Core Functionality

1. **Quest Management**
   - Create new quests
   - Edit quest metadata (title, world template, gameplay style)
   - Auto-save every 30 seconds
   - Manual save with Ctrl+S
   - Save to localStorage
   - Undo/Redo with full history (up to 50 states)

2. **Entity Management**
   - Drag-and-drop entities from asset palette to canvas
   - Select entities by clicking
   - Edit entity properties in real-time
   - Delete entities (with confirmation)
   - Duplicate entities
   - Support for multiple entity types:
     - NPCs (with dialogue, interaction radius)
     - Enemies (with HP, attack patterns, damage)
     - Bosses (enhanced enemies)
     - Collectibles (with auto-collect, collection radius)
     - Objects (decorative or interactive)

3. **3D Canvas**
   - Real-time 3D rendering with React Three Fiber
   - Orbit controls (rotate, pan, zoom)
   - Grid overlay (toggleable)
   - Snap-to-grid (toggleable)
   - Entity selection highlights
   - Visual spawn point marker
   - Ground plane with lighting

4. **Property Editing**
   - Transform properties (position, rotation, scale)
   - Type-specific properties:
     - NPC: name, dialogue, interaction radius
     - Enemy: name, HP, attack damage, attack speed, attack pattern
     - Collectible: name, auto-collect, collection radius
   - Real-time updates reflected in canvas

5. **Task System**
   - Create multiple task types:
     - Collect (with target asset and count)
     - Defeat (with target enemy)
     - Interact (with target NPC/object)
     - Reach (with target location)
     - Puzzle (custom logic)
   - Edit task descriptions
   - Mark tasks as optional
   - Visual task cards with type indicators
   - Task ordering

6. **UI/UX**
   - Beautiful gradient header matching home page
   - Clean, modern interface
   - Responsive panels
   - Smooth transitions and hover effects
   - Visual feedback for all interactions
   - Status indicators (saved/unsaved)

### ⌨️ Keyboard Shortcuts

- `Ctrl+S` - Save quest
- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo
- `Delete` - Delete selected entity
- `P` - Toggle preview mode

### 🎨 Design System

**Colors:**
- Primary: Purple/Blue gradient (`from-purple-900 via-blue-900`)
- Accent: Purple (`purple-600`)
- Success: Green (`green-600`)
- Error: Red (`red-600`)
- Background: Gray (`gray-100`, `gray-200`)
- Text: Gray scale (`gray-700`, `gray-800`)

**Spacing:**
- Base unit: 4px (Tailwind default)
- Padding: 16px (p-4)
- Gaps: 8-16px (gap-2 to gap-4)

**Components:**
- Rounded corners: `rounded-lg` (8px)
- Shadows: `shadow`, `shadow-lg`, `shadow-2xl`
- Transitions: `transition-colors`, `transition-all`

## State Management

### BuilderStore (Zustand)

The builder uses a centralized Zustand store for all builder-related state:

```typescript
interface BuilderStore {
  // Quest state
  currentQuest: Quest | null
  
  // Selection
  selectedEntityId: string | null
  
  // UI state
  isDirty: boolean
  lastSaved: number | null
  isAutoSaving: boolean
  viewMode: 'edit' | 'preview'
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  
  // History
  history: Quest[]
  historyIndex: number
  
  // Actions
  createNewQuest()
  loadQuest(quest: Quest)
  saveQuest()
  updateQuestMeta(updates)
  addEntity(entity)
  updateEntity(id, updates)
  deleteEntity(id)
  selectEntity(id)
  duplicateEntity(id)
  addTask(task)
  updateTask(id, updates)
  deleteTask(id)
  reorderTasks(taskIds)
  addTrigger(trigger)
  updateTrigger(id, updates)
  deleteTrigger(id)
  updateReward(reward)
  undo()
  redo()
  // ... more actions
}
```

### Selectors

Optimized selector hooks for better performance:

```typescript
const currentQuest = useCurrentBuilderQuest()
const selectedEntity = useSelectedEntity()
const actions = useBuilderActions()
```

## Component Details

### BuilderHeader

**Purpose:** Top toolbar with quest controls

**Features:**
- Editable quest title
- Template world selector (Forest, Meadow, Town)
- Gameplay style selector (Combat, Non-Combat, Mixed)
- Undo/Redo buttons
- Save status indicator
- Save button
- Preview toggle
- Help button

### AssetPalette

**Purpose:** Draggable asset library

**Features:**
- Category tabs (Characters, NPCs, Enemies, Objects, Collectibles)
- Search functionality
- Grid layout with asset thumbnails
- Drag-and-drop support
- Asset count per category

**Asset Categories:**
- **Characters:** Player skins
- **NPCs:** Merchants, guards, villagers, elders
- **Enemies:** Goblins, orcs, skeletons, bosses
- **Objects:** Trees, rocks, chests, doors, barrels
- **Collectibles:** Apples, gems, coins, keys, potions

### BuilderCanvas

**Purpose:** 3D scene editor

**Features:**
- React Three Fiber canvas
- OrbitControls for camera
- Grid helper (toggleable)
- Entity rendering with EntityPreview
- Drag-and-drop target
- Selection system
- Spawn point marker
- Ground plane with shadows

**Controls:**
- Left mouse: Rotate camera
- Middle mouse: Pan camera
- Scroll wheel: Zoom
- Click entity: Select
- Click canvas: Deselect

### EntityPreview

**Purpose:** Visual representation of entities in 3D space

**Features:**
- Type-specific colors and geometries
- Selection highlights (glow ring, wireframe)
- Labels with entity type
- Click interaction for selection

**Entity Appearances:**
- NPC: Blue capsule
- Enemy: Red capsule
- Boss: Dark red capsule (larger)
- Collectible: Golden sphere
- Object: Brown box

### EntityPropertiesPanel

**Purpose:** Detailed entity property editor

**Sections:**
1. **Actions:** Duplicate, Delete
2. **Transform:** Position, Rotation, Scale (X, Y, Z inputs)
3. **Type-Specific:**
   - **NPC:** Name, Dialogue (textarea), Interaction Radius
   - **Enemy:** Name, HP (slider), Attack Damage (slider), Attack Speed (slider), Attack Pattern (dropdown), Boss toggle
   - **Collectible:** Name, Auto-collect toggle, Collection Radius (slider)

### TasksPanel

**Purpose:** Quest task management

**Features:**
- Horizontal scrollable task list
- Task cards with type indicators
- Color-coded task types:
  - Collect: Blue
  - Defeat: Red
  - Interact: Green
  - Reach: Purple
  - Puzzle: Yellow
- Click to edit
- Delete button per task
- "Add Task" button

### TaskEditModal

**Purpose:** Create/edit quest tasks

**Features:**
- Task type selector (5 types)
- Description textarea
- Required count (for collect/defeat)
- Target entity selector
- Target asset ID input (for collect)
- Optional toggle
- Create/Update actions

### PreviewMode

**Purpose:** Full-screen quest preview

**Features:**
- Exit button
- Controls hint overlay
- Quest preview notice
- Integration point for game engine

## Usage Guide

### Creating a Quest

1. Navigate to `/builder`
2. The builder automatically creates a new quest
3. Edit the quest title in the header
4. Select template world and gameplay style

### Adding Entities

1. Browse the asset palette on the left
2. Drag an asset onto the canvas
3. The entity appears at the drop location
4. Click to select and edit properties

### Editing Entities

1. Click an entity on the canvas
2. The properties panel opens on the right
3. Modify transform or type-specific properties
4. Changes are reflected immediately
5. Use Duplicate to copy an entity
6. Use Delete to remove an entity

### Creating Tasks

1. Click "+ Add Task" in the bottom panel
2. Select task type
3. Fill in description and requirements
4. Link to entities if needed
5. Mark as optional if desired
6. Click "Create Task"

### Saving

- Auto-saves every 30 seconds
- Manual save with "Save" button or `Ctrl+S`
- Saves to localStorage (backend integration pending)
- Save status indicator shows saved/unsaved/saving

### Undo/Redo

- History of up to 50 states
- Undo with `Ctrl+Z` or "Undo" button
- Redo with `Ctrl+Y` or "Redo" button
- History is preserved until page reload

### Preview

- Click "Preview" button or press `P`
- Full-screen preview mode
- Exit with "Exit Preview" button
- (Full game integration pending)

## Technical Details

### Performance Optimizations

1. **Memoization:** Components use React.memo where appropriate
2. **Selector Hooks:** Zustand selectors prevent unnecessary re-renders
3. **Lazy Loading:** Asset thumbnails loaded on demand (future)
4. **History Limiting:** Max 50 history states to prevent memory issues

### Storage

**LocalStorage:**
- Key: `quest-{questId}`
- Value: JSON serialized Quest object
- Auto-saves every 30 seconds
- Manual save with Ctrl+S

**Future:** Backend integration via Firebase/API

### Type Safety

All components are fully TypeScript typed:
- Quest data types from `quest.types.ts`
- Store types from `builderStore.ts`
- Strict null checks enabled
- No implicit any

## Future Enhancements

### Post-MVP Features

1. **Advanced Gizmos**
   - Visual transform handles
   - Move/Rotate/Scale modes
   - 3D manipulation in viewport

2. **Animation Preview**
   - Play NPC animations in editor
   - Preview enemy attack patterns
   - Dialogue typewriter effect preview

3. **Collaboration**
   - Multi-user editing
   - Real-time sync
   - Comments and annotations

4. **Templates**
   - Quest template library
   - Save as template
   - Share templates

5. **Version History**
   - Named saves
   - Revert to previous versions
   - Compare versions

6. **Advanced Triggers**
   - Visual trigger editor
   - Condition builder
   - Action sequencer

7. **Sound & Music**
   - Background music selector
   - Sound effect triggers
   - Voice recording for NPCs

8. **Testing Tools**
   - In-editor playtest
   - Debug overlay
   - Console logs in preview

9. **Export/Import**
   - Export to JSON
   - Import from file
   - Share via URL

10. **Mobile Support**
    - Touch-optimized interface
    - Responsive layout
    - Gesture controls

## Troubleshooting

### Assets Not Loading

- Check `asset-categories.json` for correct paths
- Verify thumbnail images exist in `/assets/thumbnails/`
- Check browser console for errors

### Save Not Working

- Check browser console for errors
- Verify localStorage is available
- Check for quota exceeded errors

### Canvas Not Rendering

- Check browser WebGL support
- Verify React Three Fiber is installed
- Check for Three.js errors in console

### Selection Not Working

- Ensure entities have unique IDs
- Check click event propagation
- Verify selectedEntityId in store

## Contributing

When adding new features:

1. Follow existing patterns and conventions
2. Update TypeScript types
3. Add to BuilderStore if needed
4. Document keyboard shortcuts
5. Update this README
6. Test undo/redo with your changes

## License

Part of Quests4Friends project.
