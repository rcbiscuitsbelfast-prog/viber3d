# TinyQuests / MiniQuests — Master Plan

**Purpose:** Single source of truth for cleanup, rebuild, and alignment with specifications.  
**Vision:** Mobile-first, medieval-fantasy quest builder. Build and share tiny adventures.

---

## 1. Core Principles

- **Mobile-first** (portrait primary, landscape supported)
- **Medieval fantasy aesthetic** (wood, vines, stone, parchment)
- **Collision/mesh merging** — always merge on save; prevents crashes from asset overload
- **Guided builder flow** — Quest Type → World Type → Template → Customization Hub → World Editor → Completion

---

## 2. Phases Overview

| Phase | Focus | Status |
|-------|--------|--------|
| **0** | Foundation: MASTER_PLAN, CollisionMerger, Replit UI (Splash/Menu), docs archive | ✅ Done |
| **1** | Guided builder flow (Splash → Menu → Quest Type → World → Template → Hub → Editor → Completion) | Pending |
| **2** | Fix broken systems (animations, assets, quest player) | Pending |
| **3** | Premium dashboard, templates, storage/asset limits | Pending |
| **4** | Medieval UI polish, Replit component refinement | Pending |
| **5** | Kenny blocks organized, experiments structure | Pending |

---

## 3. Critical Systems

### 3.1 Collision / Mesh Merging

- **Rule:** All world geometry (blocks + assets) must be merged into a **single collision mesh** before save.
- **Why:** Prevents runtime crashes from too many individual meshes (asset overload).
- **Where:** World Editor save, Template creation, Quest export.
- **Implementation:** `src/systems/collision/CollisionMerger.ts` + `CollisionService.ts`.

### 3.2 Template Worlds

- Manually created, pre-built worlds.
- **Premium feature:** Stored in backend; free users get limited templates.
- Template creation uses same CollisionMerger pipeline.

### 3.3 Dashboard (Premium)

- View / amend quests.
- Storage usage, asset unlocks.
- Upgrade prompts (more storage, templates, assets).

---

## 4. Replit UI Integration

**Source:** `Quests-Front-end-UI` (local / [GitHub](https://github.com/rcbiscuitsbelfast-prog/Quests-Front-end-UI)).

**Migrate & refine:**

- `SplashScreen` — video splash, Start button
- `MainMenu` — Create / Play / Credits, Coming Soon panel
- `QuestBuilder` → guided flow (Quest Type, World Type, Template)
- `Customize` → Customization Hub
- `Completion` → Play / Save / Send Quest
- `CustomButton`, `ParallaxBackground`, medieval-themed UI

**Routing:** Use existing `react-router-dom`; map Replit routes onto quests4friends app.

---

## 5. File Structure (Target)

```
src/
├── pages/
│   ├── SplashScreen.tsx      (from Replit, adapted)
│   ├── MainMenu.tsx            (from Replit, refined)
│   ├── Dashboard.tsx           (NEW – premium)
│   ├── builder/                (guided flow + World Editor)
│   └── experiments/            (Kenny, tiles, etc.)
├── systems/
│   ├── collision/              (CollisionMerger, service)
│   └── templates/              (TemplateCreator, etc.)
├── utils/
│   └── logger.ts               (replace console.* in app code)
└── components/
    ├── ui/medieval/            (Replit + new medieval components)
    └── ...
```

---

## 6. Success Criteria

- [ ] Collision merging on all saves; no crashes from asset overload.
- [ ] Guided builder flow matches TinyQuests spec (Splash → … → Completion).
- [ ] Replit UI integrated and refined.
- [ ] Dashboard exists (view/amend quests, storage, premium hooks).
- [ ] Template system supports premium templates.
- [ ] Medieval, mobile-friendly UI throughout.

---

## 7. References

- **Spec:** `master.txt` (TinyQuests UI grand plan)
- **Context:** `Context/` (Quests4friends design docs)
- **Replit UI:** `Quests-Front-end-UI` / GitHub repo above

---

---

## 8. Phase 0 Completed (Plan Start)

- **MASTER_PLAN.md** — single source of truth
- **CollisionMerger** — `src/systems/collision/` (merge blocks + assets → single mesh)
- **CollisionService** — `exportWorldCollision`, `loadCollisionMesh` (save/load localStorage)
- **Logger** — `src/utils/logger.ts` (log/warn/error, dev-only for log/warn)
- **Replit UI** — SplashScreen (`/splash`), MainMenuPage (`/menu`), ComingSoonPage (`/coming-soon`), CustomButton, ParallaxBackground (`src/components/ui/medieval/`)
- **Assets** — `/replit-ui/` (grok1.mp4, big-button.png, small-button.png, background.png)
- **Docs archive** — bloat moved to `docs/archive/`
- **Routes** — `/splash`, `/menu`, `/coming-soon` added; HomePage links to TinyQuests flow

*Last updated: Phase 0 execution complete.*
