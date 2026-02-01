# QUESTLY MASTER PLAN
## Comprehensive Development Roadmap

**Version:** 1.0
**Last Updated:** February 2025
**Status:** Active Development
**Primary Template:** `templates/questly/`

---

# TABLE OF CONTENTS

1. [Project Vision](#1-project-vision)
2. [Current Status](#2-current-status)
3. [Technical Architecture](#3-technical-architecture)
4. [UI/UX Design System](#4-uiux-design-system)
5. [User-Facing Naming Conventions](#5-user-facing-naming-conventions)
6. [Pricing & Tier System](#6-pricing--tier-system)
7. [Development Phases](#7-development-phases)
8. [Phase Details](#8-phase-details)
9. [Asset Integration](#9-asset-integration)
10. [Voice & Audio System](#10-voice--audio-system)
11. [Quest Sharing System](#11-quest-sharing-system)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [Accessibility](#13-accessibility)
14. [Performance & Optimization](#14-performance--optimization)
15. [Security & Moderation](#15-security--moderation)
16. [Testing Checklist](#16-testing-checklist)
17. [Known Issues & Fixes](#17-known-issues--fixes)
18. [File Structure Reference](#18-file-structure-reference)
19. [Success Metrics](#19-success-metrics)

---

# 1. PROJECT VISION

## What is Questly?

A **mobile-first, no-code 3D game builder** where users can create quest-based mini-games and share them with friends. Built with a medieval fantasy aesthetic, friendly UI, and freemium model.

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Mobile-First** | Portrait primary, landscape supported |
| **Medieval Fantasy** | Wood, vines, stone, parchment textures |
| **Friendly & Whimsical** | Playful language, story-first, no jargon |
| **No-Code Builder** | Drag-drop, visual editing, templates |
| **Social Sharing** | Create for friends, share via link/QR |
| **Freemium** | Free to create, paid for more features |

## Target Users

1. **Casual Creators** - Quick quest for a friend's birthday
2. **Teachers** - Educational quests for classrooms
3. **Content Creators** - Shareable experiences for followers
4. **Families** - Collaborative storytelling
5. **Streamers** - Interactive audience experiences

---

# 2. CURRENT STATUS

## Completed Systems (Working)

| System | Status | Location |
|--------|--------|----------|
| 3D Rendering | ✅ Complete | TestWorld.tsx |
| Terrain Generation | ✅ Complete | simplex-noise procedural |
| Ocean Shaders | ✅ Complete | OceanShaders.ts |
| Character Controller | ✅ Complete | CharacterController.ts |
| Character Selection | ✅ Complete | 5 KayKit + Quaternius + Ultimate Monsters + Animals |
| Animation System | ✅ Complete | AnimationStateMachine.ts (139 animations) |
| Instanced Rendering | ✅ Complete | Trees, rocks, grass (99.5% draw call reduction) |
| Physics System | ✅ Initialized | Cannon-ES ready |
| NPC System | ✅ Working | WalkingNPC with pathfinding |
| Combat System | 🔄 In Progress | Another AI agent working |
| Save/Load | ✅ Complete | LocalStorage + Firebase ready |
| Quest Logic | ✅ Complete | QuestLogic.ts (8 objectives, 7 triggers) |
| Quest Flow Pages | ✅ Complete | Type → Template → Builder → Settings → Complete |
| Auth (Mock) | ✅ Complete | Zustand store, Firebase placeholder |
| 3D Text | 🔄 Half Done | troika-three-text + medieval fonts |
| Structure Builder | ✅ Exists | Separate page, needs UI refinement |
| Dashboard | ✅ Complete | All character packs animated |

## Partially Complete (Needs Work)

| System | Status | What's Needed |
|--------|--------|---------------|
| Builder UI Components | Created, not integrated | Wire into TestWorld |
| Firebase Auth | Mock only | Real implementation |
| Voice Recording | Planned | Full implementation |
| Premium Gating | Not started | UI + logic |
| Mobile Responsiveness | Desktop-first | Portrait mode |
| World Type Selection | Missing | Add to flow |

## Known Issues

| Issue | Cause | Priority |
|-------|-------|----------|
| Ultimate Monsters in TestWorld | Missing animation mappings + scale | Medium |
| Weapons not aligning | Hand bone offsets | Being fixed |
| Buildings scale issues | No scale config | Being fixed |

---

# 3. TECHNICAL ARCHITECTURE

## Tech Stack

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.7.3 | Type safety |
| Vite | 6.2.0 | Build tool |
| Zustand | 5.0.3 | State management |

### 3D Rendering
| Package | Version | Purpose |
|---------|---------|---------|
| Three.js | 0.173.0 | 3D engine |
| React Three Fiber | 8.17.10 | React renderer |
| React Three Drei | 9.122.0 | Helpers |
| three-mesh-bvh | 0.6.0 | BVH raycasting (100× faster) |
| troika-three-text | 0.52.4 | 3D text rendering |

### Physics & Systems
| Package | Version | Purpose |
|---------|---------|---------|
| Cannon-ES | 0.20.0 | Physics engine |
| simplex-noise | 4.0.3 | Terrain generation |
| three-pathfinding | 1.3.0 | NPC AI |

### UI & Animation
| Package | Version | Purpose |
|---------|---------|---------|
| Framer Motion | 11.18.2 | Page transitions |
| Tailwind CSS | 3.4.17 | Styling |
| Lucide React | 0.453.0 | Icons |

### Backend
| Service | Purpose |
|---------|---------|
| Firebase Auth | User authentication |
| Firebase Firestore | Quest data storage |
| Firebase Storage | Audio files, custom assets |

## Firebase Configuration

```typescript
// src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyDwm190rmzMLrlZen_BbYi_LzuDrfh1Gg0",
  authDomain: "quests4friends.firebaseapp.com",
  projectId: "quests4friends",
  storageBucket: "quests4friends.firebasestorage.app",
  messagingSenderId: "896975079647",
  appId: "1:896975079647:web:ac2c98611984ba9b5a416a",
};
```

## Data Model (Firestore)

```typescript
// quests/{questId}
{
  ownerId: string;
  title: string;
  templateWorld: 'forest' | 'meadow' | 'town' | 'castle';
  worldType: 'openWorld' | 'platformer' | 'multiLevel';
  gameplayStyle: 'combat' | 'nonCombat' | 'mixed';
  createdAt: timestamp;
  expiresAt: timestamp | null;
  isPublished: boolean;

  terrain: TerrainConfig;
  entities: Entity[];      // NPCs, enemies, objects
  buildings: Building[];   // Prefab structures
  paths: Path[];           // NPC walking routes
  tasks: Task[];           // Quest objectives
  triggers: Trigger[];     // Event triggers
  reward: Reward;

  voiceClips: {
    [npcId: string]: {
      type: 'tts' | 'recorded';
      text: string;
      audioUrl?: string;   // Firebase Storage URL
      voiceStyle?: string; // TTS voice name
    }
  };

  analytics: {
    plays: number;
    completions: number;
    avgPlayTime: number;
  };

  tier: 'free' | 'creator' | 'pro' | 'owned';
}
```

---

# 4. UI/UX DESIGN SYSTEM

## Visual Style

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Wood Brown | #8B4513 | Buttons, frames |
| Forest Green | #228B22 | Accents, nature |
| Parchment Beige | #F5DEB3 | Backgrounds, panels |
| Soft Gold | #FFD700 | Highlights, premium |
| Stone Gray | #708090 | Secondary elements |

### Textures
- Wood grain (buttons, frames)
- Stone (panels, borders)
- Vines & moss (decorative)
- Scroll/parchment (text areas)

### Fonts
- **Titles:** Medieval serif (MedievalSharp, Cinzel)
- **Body:** Clean sans-serif (Inter, system-ui)

### Animations
- Fade-in for screens
- Slide-up for buttons
- Scale-in for cards
- Gentle bobbing for logo
- Parallax backgrounds
- Glow pulses for interactive elements

## Responsive Layouts

### Landscape Mode (Desktop/Tablet Landscape)
```
┌─────────────────────────────────────────────────────────┐
│                    WORLD EDITOR PAGE                     │
│                                                          │
│  ┌──────────┐   ┌─────────────────────────────────────┐ │
│  │ SIDEBAR  │   │                                     │ │
│  │ (LEFT)   │   │          3D CANVAS                  │ │
│  │          │   │                                     │ │
│  │ [Section]│   │    Isometric Builder View           │ │
│  │ [Assets] │   │         ─── or ───                  │ │
│  │          │   │    First-Person Play Mode           │ │
│  │ ──────── │   │                                     │ │
│  │ Progress │   │                                     │ │
│  │ ████░░░░ │   └─────────────────────────────────────┘ │
│  │          │                                          │
│  │ [NEXT]   │   ┌─────────────────────────────────────┐ │
│  └──────────┘   │  ASSET LIMIT: ████████░░ 73%        │ │
│                 └─────────────────────────────────────┘ │
│                                                          │
│         [PLAY TEST]      [SAVE]      [PUBLISH]          │
└─────────────────────────────────────────────────────────┘
```

### Portrait Mode (Mobile/Tablet Portrait)
```
┌───────────────────────────┐
│      WORLD EDITOR         │
│                           │
│  ┌─────────────────────┐  │
│  │                     │  │
│  │     3D CANVAS       │  │
│  │                     │  │
│  │   (Touch to place)  │  │
│  │                     │  │
│  │                     │  │
│  └─────────────────────┘  │
│                           │
│  ASSET LIMIT: ████░░ 60%  │
│                           │
│  ┌─────────────────────┐  │
│  │ SIDEBAR (BOTTOM)    │  │
│  │ ← [🌲][🏠][👤][🐉] →│  │
│  │                     │  │
│  │ [Tree] [Rock] [Bush]│  │
│  │                     │  │
│  │ Progress: ██░░ 2/7  │  │
│  │ [NEXT: Buildings]   │  │
│  └─────────────────────┘  │
│                           │
│  [▶ PLAY]  [💾]  [📤]    │
└───────────────────────────┘
```

## Key UI Components

### Progress Indicator
```
Building Your Quest
Step 3 of 7: Buildings
████████████░░░░░░░░░░░░ 43%
```

### Asset Limit Bar
```
World Capacity
████████████████░░░░ 78/100 assets
[Upgrade for more room →]
```

### Section Navigation (Sidebar)
```
┌────────────────┐
│ ✓ Terrain      │  ← Completed
│ ● Buildings    │  ← Current
│ ○ Characters   │  ← Upcoming
│ ○ Creatures    │
│ ○ Paths        │
│ ○ Audio        │
│ ○ Settings     │
├────────────────┤
│ [NEXT: NPCs →] │
└────────────────┘
```

### Upgrade Prompt
```
┌────────────────────────────┐
│ 🔒 Premium Feature         │
│                            │
│ Moving buildings requires  │
│ Creator Pass               │
│                            │
│ [Upgrade £5/mo] [Maybe Later]│
└────────────────────────────┘
```

---

# 5. USER-FACING NAMING CONVENTIONS

## Core Rule
> Names must describe **intent**, not implementation.
> Use playful, story-first language kids can repeat.

## World Building

| Internal Term | User-Facing Name |
|---------------|------------------|
| World / Scene | **Island** |
| Biome | **Area** |
| Map Template | **Starting World** |
| Procedural Fill | **Auto-Fill** |
| Prefab Town | **Ready-Made Place** |
| Custom Build | **Build Your Own** |
| Quest Flow | **Story Path** |

## Buildings & Locations

| Internal Term | User-Facing Name |
|---------------|------------------|
| Town | **Village** |
| Castle | **Castle** |
| House | **Home** |
| Dungeon | **Cave** or **Ruins** |
| Interior | **Inside View** |
| Spawn Point | **Starting Spot** |

## Characters & Enemies

| Internal Term | User-Facing Name |
|---------------|------------------|
| NPC | **Villager** / **Character** |
| Enemy | **Creature** |
| Boss | **Big Bad** |
| AI Path | **Walking Route** |
| Patrol | **Guarding** |
| Line of Sight | **What They Can See** |
| Health Points | **Hearts** |
| Damage | **Hurt** |

## Dialogue & Audio

| Internal Term | User-Facing Name |
|---------------|------------------|
| Dialogue Line | **Speech Bubble** |
| Voice Pack | **Voice Style** |
| TTS | **Robot Voice** |
| Recorded Audio | **Your Voice** |
| Audio Trigger | **When They Speak** |

## Quests & Rewards

| Internal Term | User-Facing Name |
|---------------|------------------|
| Objective | **Task** |
| Quest Complete | **Victory!** |
| Reward | **Surprise** |
| XP | **Stars** |
| Currency | **Coins** |
| Puzzle | **Brain Teaser** |
| Completion Trigger | **Winning Moment** |

## UI Elements

| Internal Term | User-Facing Name |
|---------------|------------------|
| Save | **Save Progress** |
| Load | **Continue Building** |
| Publish | **Share with Friends** |
| Delete | **Remove** |
| Settings | **Options** |
| Preview | **Try It Out** |

---

# 6. PRICING & TIER SYSTEM

## Tier Overview

### Free (No Login)
**£0 - Play & Share**

| Feature | Limit |
|---------|-------|
| Worlds allowed | Unlimited (temporary) |
| World expiry | ~5 days or ~5 plays |
| Plays per world | Very limited |
| Concurrent players | 5-10 |
| Templates | ✅ All basic |
| Build from scratch | ✅ |
| Auto-fill world | ✅ |
| Ready-made places | ✅ Basic |
| Custom buildings | ❌ |
| NPC placement | Auto only |
| NPC walking routes | ❌ |
| Voice styles | Basic |
| Enemy types | Basic |
| Analytics | ❌ |

### Free Account
**£0 - With Login**

| Feature | Limit |
|---------|-------|
| Worlds allowed | 2 |
| World expiry | ~10 days or ~50 plays |
| All Free features | ✅ |
| Analytics | Basic |

### Creator Pass
**£5/month**

| Feature | Limit |
|---------|-------|
| Worlds allowed | 5 |
| World expiry | ~30 days |
| Plays per world | High (~500) |
| Concurrent players | 20-30 |
| Custom buildings | ✅ |
| Manual NPC placement | ✅ |
| NPC walking routes | ❌ |
| Voice styles | More |
| Enemy types | More |
| Reveal effects | Better |
| Analytics | Better |

### Pro Creator
**£12/month**

| Feature | Limit |
|---------|-------|
| Worlds allowed | 20 |
| World expiry | Never |
| Plays per world | Unlimited |
| Concurrent players | 100 |
| NPC walking routes | ✅ |
| Enemy vision cones | ✅ |
| Weapon/behavior tuning | ✅ |
| Multiple areas per quest | ✅ |
| Private/unlisted quests | ✅ |
| Collaboration | ✅ |
| Custom asset uploads | ✅ |
| Voice styles | All |
| Analytics | Full |

### Own a Quest Forever
**£15 one-time**

| Feature | Limit |
|---------|-------|
| Worlds allowed | 1 (permanent) |
| World expiry | Never |
| Plays per world | Unlimited |
| Concurrent players | 50 |
| Storage | ~100MB fixed |
| All Creator Pass features | ✅ |
| NPC routes, enemy vision | ❌ |

## Tier Philosophy

> **Free = Story decisions** (names, dialogue, choices)
> **Paid = Spatial & behavioral control** (placement, routes, AI)

## Upgrade Prompts (Contextual)

| Trigger | Message |
|---------|---------|
| Asset limit reached | "Your island is full! Upgrade for more room." |
| Try to move building | "Moving places requires Creator Pass" |
| Try to add NPC route | "Walking routes are a Pro feature" |
| 5th world creation | "You've used all your free worlds" |
| Quest about to expire | "This quest expires in 2 days. Own it forever for £15" |

---

# 7. DEVELOPMENT PHASES

## Phase Overview

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| 1 | Foundation | ✅ Complete | - |
| 2 | Quest Flow | ✅ Complete | - |
| 3 | Performance | ✅ Complete | - |
| 4 | Builder Integration | 🔄 In Progress | CRITICAL |
| 5 | Character System | ✅ Complete | - |
| 6 | Quest System | ✅ Complete | - |
| 7 | Voice & Audio | 📋 Planned | HIGH |
| 8 | NPC & Enemies | 🔄 In Progress | HIGH |
| 9 | Mobile & Responsive | 📋 Planned | HIGH |
| 10 | Premium & Tiers | 📋 Planned | MEDIUM |
| 11 | Polish & Publishing | 📋 Planned | MEDIUM |
| 12 | Advanced Features | 📋 Planned | LOW |

## Critical Path (Must Complete First)

1. **Phase 4** - Wire builder UI components
2. **Phase 9** - Mobile responsive layout
3. **Phase 7** - Voice recording system
4. **Phase 10** - Premium tier gating
5. **Phase 11** - Quest sharing polish

---

# 8. PHASE DETAILS

## Phase 4: Builder Integration (CURRENT PRIORITY)

### 4.1 Single-Page Builder Architecture
**Goal:** All building sections on one page with cycling sidebar

**Tasks:**
- [ ] Create `BuilderPage.tsx` (unified single page)
- [ ] Implement sidebar section cycling
- [ ] Add "Next Section" button logic
- [ ] Create section state machine (Terrain → Buildings → NPCs → etc.)
- [ ] Persist section progress in state

**Sections (in order):**
1. Terrain (trees, rocks, grass, water)
2. Buildings (prefabs, custom structures)
3. Characters (NPCs, quest givers, merchants)
4. Creatures (enemies, Big Bad)
5. Paths (walking routes - Pro only)
6. Audio (voice recording, ambient sounds)
7. Settings (quest name, rewards, difficulty)

### 4.2 Wire Existing Components
**Goal:** Integrate created-but-not-connected components

**Tasks:**
- [ ] Integrate `BuilderToolbar.tsx` into BuilderPage
- [ ] Connect `AssetPalette.tsx` to sidebar
- [ ] Wire `EntityPropertiesPanel.tsx` for selected entities
- [ ] Connect `UndoRedoManager.ts` to all actions
- [ ] Integrate `useAssetPlacement.ts` hook
- [ ] Wire `PlacementGizmo.tsx` for transform controls
- [ ] Connect `MultiSelectManager.tsx` for bulk operations

### 4.3 Progress & Limits UI
**Goal:** Visual feedback on building progress and limits

**Tasks:**
- [ ] Create `ProgressBar.tsx` component (Step X of 7)
- [ ] Create `AssetLimitBar.tsx` component (73/100 assets)
- [ ] Implement asset counting system
- [ ] Add tier-based limit configuration
- [ ] Create `UpgradePrompt.tsx` modal component
- [ ] Wire upgrade prompts to limit triggers

### 4.4 View Toggle System
**Goal:** Switch between builder and play modes

**Tasks:**
- [ ] Create `ViewToggle.tsx` component
- [ ] Implement isometric camera for builder mode
- [ ] Implement first-person camera for play mode
- [ ] Add smooth camera transition animation
- [ ] Preserve entity state between modes
- [ ] Add "Play Test" button to toolbar
- [ ] Add "Back to Building" button in play mode

### 4.5 Building Placement System
**Goal:** Prefab placement with tier restrictions

**Tasks:**
- [ ] Connect existing prefab system to sidebar
- [ ] Add placement preview (ghost building)
- [ ] Implement collision detection for placement
- [ ] Add rotation controls (Pro tier only for move)
- [ ] Create prefab library browser
- [ ] Wire "Building Areas" from terrain builder

### 4.6 World Type Selection
**Goal:** Add missing step in creation flow

**Tasks:**
- [ ] Create `WorldTypeSelector.tsx` page
- [ ] Options: Open World, Platformer, Multi-Level
- [ ] Add to routing between QuestType and Template
- [ ] Pass world type to template filtering
- [ ] Update template data with world type tags

---

## Phase 7: Voice & Audio System

### 7.1 Text-to-Speech (Default)
**Goal:** Robot voice for all NPCs by default

**Tasks:**
- [ ] Create `voiceEngine.ts` module
- [ ] Implement Web Speech API integration
- [ ] Create voice style selector UI
- [ ] Curated voice list (Google UK Male, etc.)
- [ ] Preview voice before selecting
- [ ] Save voice preference per NPC

**Curated Voices:**
```
- Google UK English Male
- Google UK English Female
- Google US English
- Google Deutsch
- Samantha (iOS)
- Daniel (British)
- Karen (Australian)
```

### 7.2 Voice Recording (Optional)
**Goal:** Users can record their own NPC dialogue

**Tasks:**
- [ ] Create `VoiceRecorder.tsx` component
- [ ] Implement microphone permission request
- [ ] Add recording UI (record, stop, playback, re-record)
- [ ] Implement audio waveform visualization
- [ ] Add audio trimming (cut silence)
- [ ] Compress audio before upload (WebM/Opus)
- [ ] Upload to Firebase Storage
- [ ] Store audio URL in quest data

**Recording UI:**
```
┌────────────────────────────────────┐
│ Record Your Voice                  │
│                                    │
│ What should this villager say?     │
│ ┌────────────────────────────────┐ │
│ │ "Welcome to my shop!"          │ │
│ └────────────────────────────────┘ │
│                                    │
│ ○ Use Robot Voice (Daniel)         │
│ ● Record My Own Voice              │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 🎤 ▓▓▓▓▓▓▓░░░░░░░░ 00:03      │ │
│ └────────────────────────────────┘ │
│                                    │
│ [🔴 Record] [▶ Play] [🗑 Delete]   │
│                                    │
│ [Cancel]              [Save Voice] │
└────────────────────────────────────┘
```

### 7.3 Audio Limits by Tier
| Tier | Max Duration/Clip | Total Audio | Clips/Quest |
|------|-------------------|-------------|-------------|
| Free | 5 seconds | 30 seconds | 5 |
| Creator | 15 seconds | 2 minutes | 15 |
| Pro | 30 seconds | 10 minutes | Unlimited |
| Owned | 15 seconds | 5 minutes | 30 |

### 7.4 In-Game Audio Playback
**Tasks:**
- [ ] Create `AudioManager.ts` for game audio
- [ ] Implement NPC dialogue triggers (on interact, on approach)
- [ ] Add speech bubble UI during playback
- [ ] Fallback to text if audio fails
- [ ] Add skip dialogue button
- [ ] Implement audio spatialization (3D sound)

---

## Phase 8: NPC & Enemy System

### 8.1 NPC Types
| Type | Behavior | Tier |
|------|----------|------|
| Villager | Static, dialogue | Free |
| Quest Giver | Gives tasks | Free |
| Merchant | Shop UI (future) | Creator |
| Guard | Patrols area | Pro |
| Guide | Follows player | Pro |

### 8.2 Enemy/Creature Types
| Type | Behavior | Tier |
|------|----------|------|
| Basic Creature | Chase, simple attack | Free |
| Ranged Creature | Shoots projectiles | Creator |
| Big Bad (Boss) | Complex patterns | Free (limited) |
| Ultimate Monster | Full animations | Pro |

### 8.3 Fix Ultimate Monsters
**Tasks:**
- [ ] Add monster mappings to `kaykit-animations.json`
- [ ] Create `monster-scales.json` configuration
- [ ] Add scale prop to `WalkingNPC.tsx`
- [ ] Test all Ultimate Monsters in TestWorld

**Monster Scale Config:**
```json
{
  "monster_block": 0.3,
  "monster_alien": 1.2,
  "monster_birb": 0.8,
  "monster_bluedemon": 1.0,
  "monster_greenblob": 0.6
}
```

### 8.4 Combat System (In Progress - Other Agent)
- [ ] Attack/defend mechanics
- [ ] Hit detection
- [ ] Health system (Hearts)
- [ ] Death animations
- [ ] Respawn logic
- [ ] Weapon alignment fixes

### 8.5 NPC Walking Routes (Pro Feature)
**Tasks:**
- [ ] Create path editor UI
- [ ] Connect paths to NPC waypoints
- [ ] Visual path preview in builder
- [ ] Path validation (reachable points)
- [ ] NPC speed along path

---

## Phase 9: Mobile & Responsive

### 9.1 Portrait Mode Layout
**Goal:** Full functionality in portrait orientation

**Tasks:**
- [ ] Create responsive layout system
- [ ] Implement bottom sidebar for portrait
- [ ] Touch-friendly asset palette (horizontal scroll)
- [ ] Larger touch targets (44px minimum)
- [ ] Swipe gestures for sidebar sections
- [ ] Pinch-to-zoom on 3D canvas

### 9.2 Touch Controls for 3D
**Tasks:**
- [ ] Create `TouchControls.tsx` component
- [ ] Virtual joystick (left side) for movement
- [ ] Action buttons (right side) for interact/attack
- [ ] Tap-to-place for builder mode
- [ ] Long-press for entity selection
- [ ] Two-finger rotate for camera

**Touch Layout (Play Mode):**
```
┌─────────────────────────────────┐
│                                 │
│         3D GAME VIEW            │
│                                 │
│                                 │
│                                 │
│  ┌───┐                   ┌───┐  │
│  │ ↑ │                   │ E │  │
│  │←◯→│                   │ATK│  │
│  │ ↓ │                   └───┘  │
│  └───┘                          │
└─────────────────────────────────┘
```

### 9.3 Responsive Breakpoints
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile Portrait | < 480px | Bottom sidebar, stacked |
| Mobile Landscape | < 768px | Left sidebar, compact |
| Tablet Portrait | < 1024px | Bottom sidebar, spacious |
| Tablet Landscape | < 1280px | Left sidebar, full |
| Desktop | > 1280px | Left sidebar, expanded |

### 9.4 Mobile-Specific Features
- [ ] Pull-to-refresh on quest list
- [ ] Haptic feedback on actions
- [ ] Offline mode indicator
- [ ] Reduced motion option
- [ ] Battery-saver mode (lower graphics)

---

## Phase 10: Premium & Tiers

### 10.1 Tier Detection System
**Tasks:**
- [ ] Create `useTier.ts` hook
- [ ] Fetch tier from Firebase user doc
- [ ] Cache tier in Zustand store
- [ ] Create `TierGate.tsx` wrapper component
- [ ] Implement feature flags by tier

### 10.2 Upgrade Flow
**Tasks:**
- [ ] Create `PricingPage.tsx`
- [ ] Design tier comparison cards
- [ ] Integrate Stripe checkout
- [ ] Handle subscription webhooks
- [ ] Implement "Own a Quest" one-time purchase
- [ ] Add receipt/invoice emails

### 10.3 Feature Gating UI
**Tasks:**
- [ ] Add lock icons to premium features
- [ ] Create `LockedFeature.tsx` component
- [ ] Contextual upgrade prompts
- [ ] "What you'll get" preview for locked features
- [ ] Graceful degradation for expired subscriptions

### 10.4 Asset/World Limits
**Tasks:**
- [ ] Implement asset counting per quest
- [ ] Create limit configuration by tier
- [ ] Warning at 80% capacity
- [ ] Block at 100% with upgrade prompt
- [ ] World count limits per account

---

## Phase 11: Polish & Publishing

### 11.1 Quest Sharing
**Tasks:**
- [ ] Generate shareable URLs
- [ ] Create QR code generator
- [ ] Add OpenGraph meta tags for link previews
- [ ] Share buttons (WhatsApp, Twitter, Copy Link)
- [ ] Short URL support (questly.app/p/abc123)

**Link Preview:**
```
┌─────────────────────────────────┐
│ 🏰 The Dragon's Lair           │
│ A quest by Sarah               │
│                                 │
│ [Quest thumbnail image]         │
│                                 │
│ "Help the village defeat..."    │
│ questly.app/play/abc123        │
└─────────────────────────────────┘
```

### 11.2 3D Quest Name Sign
**Goal:** Custom medieval sign when quest loads

**Tasks:**
- [ ] Create `QuestNameSign.tsx` component
- [ ] Use troika-three-text with medieval font
- [ ] Character limit validation (50 chars)
- [ ] Profanity filter on quest names
- [ ] Animated reveal (sign drops in)
- [ ] Support non-Latin characters

### 11.3 Onboarding
**Tasks:**
- [ ] Create first-time tutorial flow
- [ ] Tooltips for key features
- [ ] Sample quest to play before building
- [ ] "What is this?" info icons
- [ ] Skip tutorial option

### 11.4 Error States
**Tasks:**
- [ ] Quest not found page (404)
- [ ] Quest expired page
- [ ] Network error handling
- [ ] Asset loading failures
- [ ] Graceful degradation

### 11.5 Confirmation Dialogs
**Tasks:**
- [ ] "Discard unsaved changes?"
- [ ] "Delete this [entity]?"
- [ ] "Publish quest?" (with preview)
- [ ] "Leave builder?" (browser back)

---

## Phase 12: Advanced Features (Future)

### 12.1 Visual Effects
- [ ] Post-processing (bloom, color grading)
- [ ] Particle systems (fire, magic, smoke)
- [ ] Weather system (rain, snow, fog)
- [ ] Day/night cycle
- [ ] Dynamic lighting

### 12.2 Inventory System
- [ ] Item types (weapons, armor, consumables)
- [ ] Inventory UI
- [ ] Item pickup system
- [ ] Equipment slots
- [ ] Item trading with NPCs

### 12.3 Puzzle System
- [ ] Slider puzzles
- [ ] Pattern matching
- [ ] Key/lock mechanics
- [ ] Pressure plates
- [ ] Sequence puzzles

### 12.4 Multiplayer (Far Future)
- [ ] Real-time synchronization
- [ ] Shared world editing
- [ ] Co-op quest play
- [ ] Player presence indicators

### 12.5 Analytics Dashboard
- [ ] Play count graphs
- [ ] Completion rates
- [ ] Drop-off points
- [ ] Player feedback collection
- [ ] Heat maps (where players go)

---

# 9. ASSET INTEGRATION

## Available Asset Packs

### KayKit Adventurers (Primary)
**Location:** `Assets/KayKit_Adventurers_2.0_FREE/`
**Status:** ✅ Fully Working

| Asset Type | Count |
|------------|-------|
| Characters | 5 (Mage, Knight, Ranger, Rogue, Barbarian) |
| Animations | 139 (via KayKit_Character_Animations_1.1) |
| Weapons | 20+ (swords, bows, staffs, shields) |

### Quaternius RPG
**Location:** `Assets/RPG Characters - Nov 2020/`
**Status:** ✅ Working on Dashboard

| Asset Type | Count |
|------------|-------|
| Characters | 6 (Cleric, Monk, Ranger, Rogue, Warrior, Wizard) |
| Formats | FBX, glTF, Blender |

### Ultimate Monsters (Quaternius)
**Location:** `Assets/` (various)
**Status:** ⚠️ Dashboard only, needs TestWorld fix

| Asset Type | Count |
|------------|-------|
| Monsters | 15+ (Alien, Birb, Block, Demon, Blob, etc.) |
| Animations | Built-in |

**Fix Required:**
1. Add to `kaykit-animations.json` characterMappings
2. Create scale configuration
3. Add scale prop to WalkingNPC

### Random Animals
**Location:** `Assets/`
**Status:** ✅ Working on Dashboard

### KayKit Nature/Forest
**Location:** `Assets/KayKit_Forest_Nature_Pack_1.0_FREE/`
**Status:** ✅ Working

| Asset Type | Examples |
|------------|----------|
| Trees | Pine, Oak, Birch |
| Rocks | Various sizes |
| Grass | Patches, clumps |
| Bushes | Berry, leafy |

### KayKit Medieval
**Location:** `Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/`
**Status:** ✅ Available

| Asset Type | Examples |
|------------|----------|
| Buildings | Houses, towers, walls |
| Props | Barrels, crates, signs |

### Medieval Village MegaKit
**Location:** `Assets/Medieval Village MegaKit[Standard]/`
**Status:** ✅ Available

### Stylized Nature MegaKit
**Location:** `Assets/Stylized Nature MegaKit[Standard]/`
**Status:** ✅ Available

## Animation System

### Animation Database
**Location:** `src/data/kaykit-animations.json`

**Structure:**
```json
{
  "basePaths": {
    "characterAnim11_medium": "/Assets/KayKit_Character_Animations_1.1/..."
  },
  "characterMappings": {
    "char_mage": "humanoid_enhanced",
    "char_knight": "humanoid_enhanced",
    "quat_cleric": "mixamo_enhanced",
    "monster_block": "self_contained"  // TO ADD
  },
  "animationSets": {
    "humanoid_enhanced": { /* 139 animations */ },
    "self_contained": { "useBuiltInAnimations": true }
  }
}
```

### Animation Categories
| Category | Examples |
|----------|----------|
| Movement | idle, walk, run, sprint, jump, crouch |
| Combat | attack_melee, attack_ranged, block, dodge, death |
| Interaction | pickup, use_item, talk, wave |
| Emotional | celebrate, taunt, bow |

---

# 10. VOICE & AUDIO SYSTEM

## Architecture

```
┌─────────────────────────────────────────┐
│           VOICE SYSTEM                  │
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │   TTS       │    │  Recording  │    │
│  │  Engine     │    │   Engine    │    │
│  │             │    │             │    │
│  │ Web Speech  │    │ MediaRecorder│   │
│  │ API         │    │ API         │    │
│  └──────┬──────┘    └──────┬──────┘    │
│         │                  │           │
│         └────────┬─────────┘           │
│                  │                     │
│         ┌───────▼────────┐             │
│         │  Audio Manager │             │
│         │                │             │
│         │ - Play/Pause   │             │
│         │ - Queue        │             │
│         │ - 3D Spatial   │             │
│         └───────┬────────┘             │
│                 │                      │
│         ┌───────▼────────┐             │
│         │  NPC Dialogue  │             │
│         │    System      │             │
│         └────────────────┘             │
└─────────────────────────────────────────┘
```

## Voice Styles (TTS)

| Voice Name | Description | Tier |
|------------|-------------|------|
| Google UK English Male | British narrator | Free |
| Google UK English Female | British narrator | Free |
| Google US English | American neutral | Free |
| Daniel | British male (iOS) | Creator |
| Samantha | American female (iOS) | Creator |
| Karen | Australian female | Pro |
| Moira | Irish female | Pro |

## Recording Specifications

| Spec | Value |
|------|-------|
| Format | WebM/Opus (primary), MP3 (fallback) |
| Sample Rate | 44.1kHz |
| Channels | Mono |
| Max Bitrate | 128kbps |
| Max File Size | 1MB per clip |

## Audio Triggers

| Trigger | Description |
|---------|-------------|
| `onInteract` | Player presses interact button |
| `onApproach` | Player enters NPC radius |
| `onQuestStart` | Quest begins |
| `onQuestComplete` | Victory screen |
| `onDeath` | Player dies |

---

# 11. QUEST SHARING SYSTEM

## Share Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Creator    │     │    Server    │     │   Player     │
│              │     │              │     │              │
│ [Publish] ───┼────►│ Save quest   │     │              │
│              │     │ Generate URL │     │              │
│              │◄────┼─ Return link │     │              │
│              │     │              │     │              │
│ [Share] ─────┼─────┼──────────────┼────►│ Open link    │
│              │     │              │     │              │
│              │     │ Load quest ──┼────►│ Play quest   │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## URL Structure

| Type | Format | Example |
|------|--------|---------|
| Full | `questly.app/play/{questId}` | questly.app/play/abc123xyz |
| Short | `questly.app/p/{shortCode}` | questly.app/p/DragonLair |

## Link Preview (OpenGraph)

```html
<meta property="og:title" content="The Dragon's Lair" />
<meta property="og:description" content="A quest by Sarah - Help the village defeat the dragon!" />
<meta property="og:image" content="https://questly.app/thumbs/abc123.png" />
<meta property="og:url" content="https://questly.app/play/abc123" />
```

## QR Code Generation

**Library:** `qrcode.react`
**Size:** 256x256px default
**Error Correction:** Medium (15%)

## Share Channels

| Channel | Implementation |
|---------|----------------|
| Copy Link | `navigator.clipboard.writeText()` |
| WhatsApp | `https://wa.me/?text={url}` |
| Twitter/X | `https://twitter.com/intent/tweet?url={url}` |
| Facebook | `https://www.facebook.com/sharer.php?u={url}` |
| Email | `mailto:?subject={title}&body={url}` |
| QR Code | Display + download option |

---

# 12. ERROR HANDLING & EDGE CASES

## Network Errors

| Error | User Message | Action |
|-------|--------------|--------|
| Offline | "You're offline. Changes saved locally." | Queue for sync |
| Save failed | "Couldn't save. Retrying..." | Auto-retry 3x |
| Load failed | "Quest couldn't load. Check your connection." | Retry button |
| Auth expired | "Session expired. Please sign in again." | Redirect to login |

## Browser Issues

| Issue | Detection | Fallback |
|-------|-----------|----------|
| No WebGL | `!window.WebGLRenderingContext` | "Your browser doesn't support 3D" |
| No microphone | Permission denied | Disable recording, show TTS only |
| Safari limitations | User agent check | Warning banner |
| Low memory | Performance.memory check | Reduce quality |

## Quest Errors

| Error | User Message | Action |
|-------|--------------|--------|
| Quest not found | "This quest doesn't exist or was removed." | 404 page |
| Quest expired | "This quest has expired." | Suggest similar |
| Quest full | "Too many players. You're #5 in queue." | Show queue |
| Assets failed | "Some items couldn't load." | Continue with fallback |

## Data Protection

| Scenario | Protection |
|----------|------------|
| Tab close during edit | `beforeunload` warning |
| Browser back during edit | Confirm dialog |
| Accidental delete | "Are you sure?" + undo |
| Session timeout | Auto-save before logout |

---

# 13. ACCESSIBILITY

## Minimum Requirements

| Feature | Implementation |
|---------|----------------|
| Touch targets | 44×44px minimum |
| Color contrast | 4.5:1 ratio |
| Focus indicators | Visible outline on all interactive |
| Alt text | All images and icons |
| Keyboard navigation | Tab through UI |
| Screen reader labels | ARIA labels |

## Optional Enhancements

| Feature | Description |
|---------|-------------|
| Reduced motion | Disable animations |
| High contrast | Alternative color scheme |
| Large text | Font size scaling |
| Colorblind mode | Pattern-based indicators |
| Audio descriptions | Narrate UI elements |

## Controls Reminder

Show on first play:
```
┌─────────────────────────────────┐
│         HOW TO PLAY             │
│                                 │
│  WASD or Arrow Keys - Move      │
│  E - Talk to characters         │
│  Space - Jump                   │
│  Escape - Pause                 │
│                                 │
│  Touch: Use on-screen controls  │
│                                 │
│         [Got it!]               │
└─────────────────────────────────┘
```

---

# 14. PERFORMANCE & OPTIMIZATION

## Targets

| Metric | Target | Current |
|--------|--------|---------|
| FPS (Desktop) | 60 | ✅ 60 |
| FPS (Mobile) | 30 | ⚠️ Varies |
| Initial Load | <3s | ⚠️ ~4s |
| Time to Interactive | <5s | ⚠️ ~6s |
| Memory Usage | <512MB | ✅ ~300MB |

## Implemented Optimizations

| Optimization | Impact |
|--------------|--------|
| Instanced rendering | 99.5% draw call reduction |
| BVH raycasting | 100× faster terrain collision |
| Asset lazy loading | Faster initial load |
| Texture compression | Smaller file sizes |
| Geometry merging | Fewer draw calls |

## Planned Optimizations

| Optimization | Priority |
|--------------|----------|
| LOD (Level of Detail) | Medium |
| Asset streaming | Medium |
| Web Workers for physics | Low |
| Offscreen canvas | Low |
| Service Worker caching | Medium |

## Quality Presets

| Preset | Shadows | Particles | Draw Distance | FPS Target |
|--------|---------|-----------|---------------|------------|
| Low | Off | Minimal | 50m | 30 |
| Medium | Basic | Normal | 100m | 45 |
| High | Full | Full | 200m | 60 |
| Auto | Adaptive | Adaptive | Adaptive | 30+ |

---

# 15. SECURITY & MODERATION

## Content Moderation

| Content Type | Filter |
|--------------|--------|
| Quest names | Profanity filter |
| NPC names | Profanity filter |
| Dialogue text | Profanity filter |
| Voice recordings | Report system (no auto-filter) |
| Custom images | Manual review (future) |

## Profanity Filter

**Library:** `bad-words` or custom list
**Action:** Replace with asterisks, don't block

## Report System

```
┌─────────────────────────────────┐
│      REPORT THIS QUEST          │
│                                 │
│ What's wrong?                   │
│ ○ Inappropriate content         │
│ ○ Harassment/bullying           │
│ ○ Spam                          │
│ ○ Other                         │
│                                 │
│ Additional details (optional):  │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel]           [Report]     │
└─────────────────────────────────┘
```

## Data Security

| Data | Protection |
|------|------------|
| Passwords | Never stored (Firebase Auth) |
| Payment info | Stripe handles (PCI compliant) |
| Voice recordings | Private by default |
| Quest data | Owner access only (except published) |

## Rate Limiting

| Action | Limit |
|--------|-------|
| Quest creation | 10/hour (free), unlimited (paid) |
| Voice recording | 50MB/day (free), 500MB/day (paid) |
| API requests | 1000/hour |
| Report submissions | 5/hour |

---

# 16. TESTING CHECKLIST

## Pre-Release Checklist

### Builder Flow
- [ ] Can complete full flow: Type → World → Template → Build → Settings → Publish
- [ ] All 7 sidebar sections cycle correctly
- [ ] Progress bar updates accurately
- [ ] Asset limit bar shows correct values
- [ ] Upgrade prompts appear at limits
- [ ] Save/load works correctly
- [ ] Undo/redo works for all actions
- [ ] Play test mode works
- [ ] View toggle (isometric ↔ first-person) works

### Responsive
- [ ] Works in portrait mode (mobile)
- [ ] Works in landscape mode (tablet/desktop)
- [ ] Touch controls function correctly
- [ ] No horizontal scroll on mobile
- [ ] Sidebar repositions correctly

### Assets
- [ ] All KayKit characters load
- [ ] All Quaternius characters load
- [ ] Ultimate Monsters load with correct scale
- [ ] Animations play correctly
- [ ] Weapons align with hands
- [ ] Buildings place and scale correctly

### Voice
- [ ] TTS plays for all voice styles
- [ ] Recording permission request works
- [ ] Recording plays back correctly
- [ ] Recordings upload to Firebase
- [ ] Audio plays in-game at correct triggers

### Sharing
- [ ] Publish generates correct URL
- [ ] Link preview shows correct metadata
- [ ] QR code generates and scans
- [ ] Share buttons work (WhatsApp, Twitter, etc.)
- [ ] Shared quests load for anonymous users

### Tiers
- [ ] Free limits enforced correctly
- [ ] Creator features unlock with subscription
- [ ] Pro features unlock with subscription
- [ ] Owned quest is permanent
- [ ] Upgrade flow completes successfully

### Error Handling
- [ ] Offline mode shows correct message
- [ ] Invalid quest shows 404 page
- [ ] Expired quest shows correct message
- [ ] Network errors show retry option
- [ ] Unsaved changes warning works

### Performance
- [ ] Desktop: 60 FPS
- [ ] Mobile: 30+ FPS
- [ ] No memory leaks after 10 minutes
- [ ] Assets load progressively

---

# 17. KNOWN ISSUES & FIXES

## Active Issues

| Issue | Status | Assigned |
|-------|--------|----------|
| Combat system | In Progress | AI Agent |
| Weapon hand alignment | In Progress | Manual adjustment system |
| Ultimate Monsters in TestWorld | Needs Fix | Pending |
| Building scale issues | In Progress | Manual adjustment |

## Ultimate Monsters Fix

**Problem:** Work on Dashboard, not in TestWorld
**Cause:** Missing animation mappings + no scale config
**Fix:**
1. Add to `kaykit-animations.json`:
```json
"monster_alien": "self_contained",
"monster_birb": "self_contained",
"monster_block": "self_contained"
```
2. Create `monster-scales.json`
3. Add scale prop to WalkingNPC

## Weapon Alignment Fix

**Problem:** Weapons don't align with character hands
**Solution:** Manual offset adjustment system
**Location:** `src/data/weapon-configs.ts`

```typescript
{
  "sword_longsword": {
    "handBone": "handslotr",
    "position": [0.1, 0.05, 0],
    "rotation": [0, 0, Math.PI/4],
    "scale": 0.8
  }
}
```

---

# 18. FILE STRUCTURE REFERENCE

```
templates/questly/
├── public/
│   ├── Assets/
│   │   ├── KayKit_Adventurers_2.0_FREE/
│   │   ├── KayKit_Character_Animations_1.1/
│   │   ├── KayKit_Forest_Nature_Pack_1.0_FREE/
│   │   ├── Medieval Village MegaKit/
│   │   └── mixamo-animations/
│   ├── models/
│   │   ├── Mage.glb
│   │   ├── Knight.glb
│   │   └── ...
│   └── fonts/
│       └── MedievalSharp.ttf
│
├── src/
│   ├── components/
│   │   ├── BuilderToolbar.tsx
│   │   ├── AssetPalette.tsx
│   │   ├── EntityPropertiesPanel.tsx
│   │   ├── PlacementGizmo.tsx
│   │   ├── MultiSelectManager.tsx
│   │   ├── SelectionBox.tsx
│   │   ├── CharacterSelector.tsx
│   │   ├── InstancedForest.tsx
│   │   ├── InstancedRocks.tsx
│   │   ├── InstancedGrass.tsx
│   │   ├── WalkingNPC.tsx
│   │   ├── DialogueBox.tsx
│   │   ├── QuestLabel.tsx
│   │   ├── CustomButton.tsx
│   │   ├── Navigation.tsx
│   │   ├── ParallaxBackground.tsx
│   │   ├── ProgressBar.tsx         # TO CREATE
│   │   ├── AssetLimitBar.tsx       # TO CREATE
│   │   ├── UpgradePrompt.tsx       # TO CREATE
│   │   ├── ViewToggle.tsx          # TO CREATE
│   │   ├── VoiceRecorder.tsx       # TO CREATE
│   │   └── TouchControls.tsx       # TO CREATE
│   │
│   ├── pages/
│   │   ├── SplashScreen.tsx
│   │   ├── MainMenu.tsx
│   │   ├── QuestTypeSelector.tsx
│   │   ├── WorldTypeSelector.tsx   # TO CREATE
│   │   ├── TemplateQuests.tsx
│   │   ├── UserDashboard.tsx
│   │   ├── BuilderPage.tsx         # TO CREATE (unified)
│   │   ├── TestWorld.tsx           # Current builder
│   │   ├── WorldBuilder.tsx
│   │   ├── QuestSettings.tsx
│   │   ├── QuestComplete.tsx
│   │   ├── WorldPreview.tsx
│   │   └── PricingPage.tsx         # TO CREATE
│   │
│   ├── systems/
│   │   ├── character/
│   │   │   ├── CharacterController.ts
│   │   │   └── CharacterStats.ts
│   │   ├── animation/
│   │   │   ├── AnimationManager.ts
│   │   │   ├── AnimationStateMachine.ts
│   │   │   └── AnimationLoader.ts
│   │   ├── quest/
│   │   │   ├── QuestManager.ts
│   │   │   └── QuestLogic.ts
│   │   ├── interaction/
│   │   │   └── InteractionSystem.ts
│   │   ├── world/
│   │   │   ├── WorldStorage.ts
│   │   │   ├── WorldExporter.ts
│   │   │   ├── WorldImporter.ts
│   │   │   └── WorldFirebaseStorage.ts
│   │   ├── physics/
│   │   │   └── PhysicsWorld.tsx
│   │   ├── placement/
│   │   │   └── AssetPlacementSystem.ts
│   │   ├── undo/
│   │   │   └── UndoRedoManager.ts
│   │   ├── voice/                  # TO CREATE
│   │   │   ├── VoiceEngine.ts
│   │   │   ├── VoiceRecorder.ts
│   │   │   └── AudioManager.ts
│   │   └── tier/                   # TO CREATE
│   │       └── TierManager.ts
│   │
│   ├── hooks/
│   │   ├── useCharacterAnimation.ts
│   │   ├── useAssetPlacement.ts
│   │   ├── useTier.ts              # TO CREATE
│   │   └── useVoice.ts             # TO CREATE
│   │
│   ├── data/
│   │   ├── kaykit-animations.json
│   │   ├── weapon-configs.ts
│   │   ├── monster-scales.json     # TO CREATE
│   │   ├── naming.ts               # TO CREATE
│   │   └── tier-limits.ts          # TO CREATE
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── firebase.ts
│   │   ├── tunnel.ts
│   │   └── utils.ts
│   │
│   ├── r3f/
│   │   ├── R3FCanvas.tsx
│   │   └── AnimatedCharacter.tsx
│   │
│   ├── utils/
│   │   ├── simplexTerrain.ts
│   │   ├── cloneGltf.ts
│   │   ├── animationCompatibility.ts
│   │   └── assetPath.ts
│   │
│   └── shaders/
│       └── OceanShaders.ts
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

# 19. SUCCESS METRICS

## MVP (Minimum Viable Product)

| Metric | Target |
|--------|--------|
| Users can create a quest | ✅ |
| Users can build a world | ✅ |
| Users can place assets | ✅ |
| Users can configure objectives | ✅ |
| Users can test their quest | ✅ |
| Users can save and load | ✅ |
| Users can share via link | 📋 |
| Quest plays for anonymous users | 📋 |

## Full Product

| Metric | Target |
|--------|--------|
| 60 FPS desktop, 30 FPS mobile | ⚠️ |
| <3s initial load | ⚠️ |
| Works on iOS Safari | 📋 |
| Works on Android Chrome | 📋 |
| Stripe payments functional | 📋 |
| 1000+ concurrent quests | 📋 |
| <1% error rate | 📋 |

## User Metrics (Post-Launch)

| Metric | Goal |
|--------|------|
| Quest completion rate | >60% |
| Creator return rate | >30% |
| Share rate | >20% |
| Free → Paid conversion | >5% |
| NPS score | >50 |

---

# APPENDIX

## A. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Delete | Delete selected |
| Escape | Deselect / Close modal |
| Space | Play/pause (in play mode) |
| ? | Show shortcuts help |
| P | Toggle play test mode |

## B. Touch Gestures

| Gesture | Action |
|---------|--------|
| Tap | Select / Place |
| Long press | Context menu |
| Drag | Move entity |
| Pinch | Zoom |
| Two-finger rotate | Rotate camera |
| Swipe (sidebar) | Change section |

## C. Browser Support

| Browser | Support Level |
|---------|---------------|
| Chrome (Desktop) | Full |
| Chrome (Android) | Full |
| Safari (Desktop) | Full |
| Safari (iOS) | Partial (no recording) |
| Firefox | Full |
| Edge | Full |

## D. External Resources

- Three.js Docs: https://threejs.org/docs/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber
- KayKit Assets: https://kenney.nl/
- Firebase Docs: https://firebase.google.com/docs
- Stripe Docs: https://stripe.com/docs

---

**Document Version:** 1.0
**Created:** February 2025
**Maintained By:** Questly Development Team
**Next Review:** After Phase 4 completion

---

*This document is the single source of truth for Questly development. All agents and contributors should reference this plan.*
