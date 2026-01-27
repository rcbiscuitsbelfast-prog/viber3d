# Questly Phase 3 Plan - World Builder & Enhanced Systems

## Current Status

✅ **Phase 2 Complete:**
- TestWorld scene working (character movement, ocean waves, terrain)
- Character controller functional
- Ocean shader animations working
- Basic test mode operational

## Phase 3 Goals

### 1. World Builder Integration (High Priority)
**Goal:** Connect TestWorld to the quest builder flow as the actual World Editor

**Tasks:**
- [ ] Create WorldBuilder page that wraps TestWorld functionality
- [ ] Add save/load functionality for world configurations
- [ ] Integrate with quest creation flow (from TemplateQuests → WorldBuilder)
- [ ] Add world export/import system
- [ ] Connect to Firebase/Firestore for cloud storage

**Files to Create/Modify:**
- `src/pages/WorldBuilder.tsx` - Main world editor page
- `src/systems/world/WorldExporter.ts` - Export world config to JSON
- `src/systems/world/WorldImporter.ts` - Load world config from JSON
- `src/lib/worldStorage.ts` - Firebase integration for world saves

### 2. Enhanced Character System (Medium Priority)
**Goal:** Improve character controller and add character customization

**Tasks:**
- [ ] Add character selection (Mage, Knight, Ranger, Rogue, etc.)
- [ ] Character stats system (health, speed, jump height)
- [ ] Equipment/weapon system
- [ ] Character preview in dashboard
- [ ] Save character configurations

**Files to Create/Modify:**
- `src/components/CharacterSelector.tsx` - Character selection UI
- `src/systems/character/CharacterStats.ts` - Stats management
- `src/systems/character/EquipmentSystem.ts` - Equipment/weapon handling
- Update `CharacterController` to use selected character

### 3. Quest Settings & Configuration (Medium Priority)
**Goal:** Add quest configuration UI and settings

**Tasks:**
- [ ] Quest settings page (victory conditions, rewards, difficulty)
- [ ] Quest metadata editor (title, description, tags)
- [ ] Quest preview mode
- [ ] Quest sharing/export functionality

**Files to Create/Modify:**
- `src/pages/QuestSettings.tsx` - Quest configuration page
- `src/components/QuestPreview.tsx` - Preview mode component
- `src/systems/quest/QuestExporter.ts` - Export quest data

### 4. Asset Library Integration (Low Priority)
**Goal:** Integrate Kenny blocks and other assets into builder

**Tasks:**
- [ ] Asset browser component
- [ ] Drag-drop asset placement in WorldBuilder
- [ ] Asset categories (buildings, nature, props, etc.)
- [ ] Asset search/filter functionality

**Files to Create/Modify:**
- `src/components/AssetBrowser.tsx` - Asset library UI
- `src/systems/assets/AssetManager.ts` - Asset loading/management
- Update WorldBuilder to support asset placement

## Implementation Order

### Week 1: World Builder Foundation
1. Create WorldBuilder page wrapper
2. Add save/load to localStorage
3. Integrate with quest flow navigation
4. Test world save/load cycle

### Week 2: Character System
1. Character selector component
2. Character stats system
3. Update CharacterController to use selected character
4. Character preview in dashboard

### Week 3: Quest Settings
1. Quest settings page
2. Quest metadata editor
3. Quest preview mode
4. Export functionality

### Week 4: Asset Integration
1. Asset browser component
2. Asset placement in WorldBuilder
3. Asset categories and search
4. Polish and testing

## Success Criteria

- [ ] Users can create/edit worlds in WorldBuilder
- [ ] Worlds can be saved and loaded
- [ ] Character selection works in test mode
- [ ] Quest settings can be configured
- [ ] Assets can be placed in world editor
- [ ] Complete quest flow: Type → Template → World → Settings → Preview

## Technical Notes

- Use existing TestWorld.tsx as base for WorldBuilder
- Follow MASTER_THREEJS_BEST_PRACTICES.md for all 3D code
- Use Zustand for state management
- Firebase/Firestore for cloud storage
- localStorage for offline saves

## Dependencies

- Firebase SDK (for cloud storage)
- Zustand (already installed)
- React Router (already installed)
- Three.js / R3F (already installed)

---

**Status:** Ready to begin Phase 3
**Next Step:** Create WorldBuilder page wrapper
