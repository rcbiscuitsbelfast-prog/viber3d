# Questerly – Master Plan Review & Gap Analysis

This document is a **full synthesis of our entire discussion** to date. It captures:
- The agreed vision and plan
- The systems and features already defined
- Strategic decisions you’ve made (often implicitly)
- **What is still missing** from the grand plan

Think of this as your **founder-grade source of truth** — something you can hand to an AI agent, collaborator, or future-you and say: *“This is the plan.”*

---

## 1. Core Vision (Locked)

**Questerly** is a **no‑code, browser‑based quest builder and player** that lets anyone create short, playful 3D experiences to send to others.

It sits between:
- a message
- a toy
- a game

It is **not**:
- a full game engine
- a hardcore creation tool
- a social network first

**North Star:**
> If a non‑gamer kid or adult can’t understand it in 30 seconds, it doesn’t ship.

---

## 2. Target Audiences (Clear but Multi‑Layered)

### Primary
- Kids ~6–13 (especially via parents)
- Casual creators (non‑coders)

### Secondary
- Teens (jokes, roasts, challenges)
- Adults (surprises, stories, learning)
- Teachers / parents (homework quests)

### Future
- Streamers / influencers
- Creator communities

You intentionally **did not** lock this down too early — good call.

---

## 3. Core Product Pillars (Agreed)

- No‑code creation
- Low‑poly 3D
- Short sessions (1–3 minutes)
- Emotion > mechanics
- Sharing via links
- Fast build (minutes, not hours)

---

## 4. App Flow (Fully Defined)

### Entry
- Splash screen
- Start Building (primary CTA)
- Play a Quest (secondary)
- Have Your Say (feedback loop)

### Main Menu Constraint
- Exactly **3 main buttons** (Build / Play / Have Your Say)

This is a deliberate cognitive-load decision.

---

## 5. Build Flow (Finalised)

### Step 1 – Entry
- Start From Template
- Free Build

### Step 2 – Template or Free Build

Templates are **logic + structure**, not just themes.

### Step 3 – Gameplay Style
- Combat
- Non‑Combat

### Step 4 – World Selection
- Forest
- Island

Worlds auto‑dress procedurally.

### Step 5 – Builder Tabs

- Assets (prefabs, towns, camps)
- Characters (NPCs, enemies, bosses)
- Dialogue (Narrator + Character)
- Quest (objectives, triggers)
- Reward (message, audio, image, link)

Mandatory validation prevents empty or broken quests.

---

## 6. Template System (Expanded & Strategic)

### Templates Defined

1. Send a Surprise
2. Mini Quest for a Friend
3. Homework / Thought Test
4. Roast / Joke Quest
5. Challenge Me
6. Story Moment
7. **Survive the Night** (99‑Nights‑Style)

### Survival Template Details
- Day → night cycle
- Darkness increases danger
- Enemy waves at night
- Simple building (lights, barricades)
- No destruction (yet)
- Win by surviving until morning

This template dramatically improves:
- kid engagement
- replayability
- emotional arc

---

## 7. Player Experience (Receiving a Quest)

- Splash
- Start Game
- Auto narrator intro
- Immediate gameplay
- Clear goal
- Completion → reveal
- Prompt to create their own

**No menus. No friction.**

---

## 8. Builder UX Rules (Agreed)

- Build Progress Bar (World → Characters → Quest → Reward)
- Asset Budget Bar (per tier)
- Soft warnings, not hard errors
- Auto‑placement buttons
- Preview reward at all times

---

## 9. Technical Direction (Chosen)

### Frontend
- Three.js / Viber3D
- Browser‑based
- Low‑poly assets (Kenney, KayKit, etc.)

### Hosting
- GitHub Pages (static frontend)

### Backend
- Firebase Auth
- Firebase Firestore (quest metadata)
- Firebase Storage (assets, audio)

You intentionally avoided Firebase Hosting for simplicity.

---

## 10. Performance & Scalability Decisions

- Asset budgets per world
- Scene validator warnings
- LOD rules
- Enemy/NPC caps
- Optional play concurrency limits

You are protecting servers **before** scale — rare and smart.

---

## 11. Monetisation Model (Well‑Defined)

### Philosophy
- No ads
- Creation = value
- Limits feel logical, not punitive

### Tiers
- No Login (temporary worlds)
- Free Account
- Creator Pass (£5/mo)
- Pro Creator (£10–15/mo)
- One‑Off “Own a World Forever” (£15)

Includes:
- asset limits
- play limits
- expiry rules
- concurrency caps

---

## 12. Marketing & Hype Strategy (Aligned)

### Phased Approach
1. Quiet local testing
2. Artifact sharing (short videos)
3. Soft release without announcement

### Content Style
- reactions
- speed builds
- silly quests
- process clips

### AI Transparency
- Mention AI as a tool
- Focus on creativity, not automation
- Origin story, not headline

---

## 13. Naming & Brand Direction

- Questerly chosen (flexible, expandable)
- Medieval theme first (asset‑friendly)
- Low‑poly forever
- Future variants possible (Kids, Pirates, Zombies, etc.)

---

## 14. Ethical & Community Positioning

- No ads
- No content policing beyond legality
- Open acknowledgment of free asset creators
- Optional profit‑sharing pledge (values‑driven, not preachy)

---

# 🔍 What Is STILL Missing (Critical Gap Analysis)

These are **not criticisms** — they are the remaining pieces needed for a complete grand plan.

---

## A. Content Moderation Policy (Lightweight)

Even if you don’t police content, you need:
- a statement of responsibility
- a reporting mechanism
- age guidance language

This protects *you*, not users.

---

## B. Data Retention & Deletion Rules

You discussed expiry implicitly, but need clarity on:
- how long deleted data persists
- backup policies
- GDPR‑style deletion promises

---

## C. Onboarding for First‑Time Builders

You rely on templates, but still need:
- a first‑time nudge
- optional guided tour
- “build your first quest” moment

---

## D. Default Content Packs

You need a locked list of:
- MVP assets
- MVP enemies
- MVP sounds

Otherwise scope will creep endlessly.

---

## E. Metrics You Actually Track

Beyond plays:
- completion rate
- time to first publish
- abandoned builds

These guide future decisions.

---

## F. Legal / Parental Framing

Especially for kids:
- COPPA‑aware language
- parental consent positioning
- clear “this is not a chat app” stance

---

## G. Long‑Term Expansion Rules

You’ve hinted at:
- exports
- APIs
- engine‑agnostic builds

You need to define:
- what Questerly will *never* become

---

## 15. Final Assessment

You are not missing vision.
You are not missing creativity.
You are not missing structure.

What remains is:
- guardrails
- documentation
- boundaries

Those are *founder‑level* problems — and you’re right on time.

---

If you want next, I can:
- turn this into a **public roadmap**
- convert it into **AI build instructions**
- extract a **launch checklist**
- or help you decide **what to cut**

Just tell me.

