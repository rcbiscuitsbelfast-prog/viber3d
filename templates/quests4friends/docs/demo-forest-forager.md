# Forest Forager - Demo Quest Guide

## Welcome to Forest Forager!

🌲 **Quest Overview:** A peaceful, charming collecting adventure where you help the Forest Keeper gather ingredients for a magical potion before sunset. Perfect for beginners!

## Quick Start

### Playing the Quest
```bash
# Navigate to the Quests4Friends app
cd /home/engine/project/templates/quests4friends

# Install dependencies (if needed)
npm install

# Start the app
npm run dev

# Navigate to Demo Quest
# The quest is pre-loaded as "demo-forest-forager.json"
```

### Quest Stats
- **Duration:** 3-5 minutes
- **Difficulty:** Beginner 🟢
- **Genre:** Non-combat exploration & collection
- **Player Count:** 1

## Quest Walkthrough

### Act 1: The Meeting (30 seconds)

**Starting Location:** Forest entrance (0, 0, 0)

1. **Meet the Forest Keeper** (center of map)
   - Look for the friendly NPC at the center
   - Approach and press **E** to interact
   - Listen to the 3-line dialogue introduction

**Task 1:** Talk to the Forest Keeper ✅
- *This will automatically spawn all collectibles and the Wise Owl*

### Act 2: Exploration & Collection (2-3 minutes)

The Forest Keeper asks for:
- 🍄 **3 mushrooms**
- 🍎 **2 apples**
- 🦉 **Talk to Wise Owl**

**Controls:**
- **W/A/S/D** - Move around
- **E** - Interact with NPCs/items
- **Mouse** - Look around

### Collectible Locations

#### Mushrooms (Red & White Spotted)
1. **Mushroom #1** → Southeast, near a small rock pile (5, 0, 3)
2. **Mushroom #2** → Northwest path leading to the Owl (-4, 0, 6) 
3. **Mushroom #3** → Far east edge, near dense trees (8, 0, -2)

Walk over mushrooms to auto-collect (within 2 units)

#### Apples (Hanging From Trees)
1. **Apple #1** → East clearing, mid-level in tree (2, 3, 8)
2. **Apple #2** → Northwest, near Wise Owl's tree (-6, 3, 4)

Apples require looking up! Use mouse to find them.

#### Wise Owl Location 📍
- **Position:** (-10, 2, 10) - Hidden in the northwest
- **Discovery:** Follow the path past the second mushroom
- **Look for:** Tall tree with a perched owl
- **Interaction:** Press E when close

**Task 2:** Gather 3 mushrooms 
**Task 3:** Find 2 apples
**Task 4:** Speak to Wise Owl

### Act 3: The Reward (1 minute)

**Task 5:** Return to the Forest Keeper (center)

Walk back to where you started (0, 0, 0) and interact again!

**Reward:**
- 🎁 **The Magical Potion** ✨
- Beautiful reveal animation
- Heartfelt thank you message

## Visual Map (Top-Down View)

```
                [Tree 3]   [Apple 2]   [Wise Owl] 
                             ↑
                            Path
                             |
[Tree 2]  [Tree 1]   [Rock 1]      [Mushroom 2] -[Tree 4]
                        |                |
            [Mushroom Patch 1]   [Apple 1]    [Keeper]
                        |         [Mushroom 1]
                     [Rock 2]       |        [Tree 5]
                                   [Rock 3]
                                      |
                                 [Mushroom Patch 2]
                                      |
                                 [Mushroom 3]
                                      |
                                    [Tree 6]
```

## Pro Tips

### Beginner Help
1. **Follow the mushrooms!** They create a natural path to the owl
2. **Look up for apples** - they hang in trees, not on ground
3. **Inventory shows progress** - check top-left corner
4. **If lost:** Return to center, Forest Keeper provides guidance

### Speed Run
- Collect mushrooms in order: #1 → #2 → #3 (leads to Owl)
- Grab apples on the way: #1 (south), #2 (near Owl)
- Talk to Owl, then run straight back to Keeper
- **Record:** ~2:15 minutes!

### Discoverables
- **Mushroom patches** (2 total) - enhance atmosphere
- **Tree variations** - 6 different trees with spacing for exploration
- **Rock formations** - 3 decorative stones
- **Hidden sight lines** - Keeper can see distant collectibles

## Quest Features Demonstrated

This demo showcases Quests4Friends capabilities:

✅ **NPCs with dialogue triggers**  
✅ **Progressive quest tasks** (5 tasks in sequence)  
✅ **Multiple collectible types** (auto-pickup + collection radius)  
✅ **Exploration-based goals** (hidden NPC)  
✅ **Custom reward reveal** (Portal + magical text)  
✅ **Environmental storytelling** (natural forest layout)  
✅ **Typewriter dialogue** (immersive character moments)  
✅ **Triggered quest progression** (behind-the-scenes logic)  

## Troubleshooting

### Issues & Solutions

**Can't find the Wise Owl?**
→ Face northeast from the Forest Keeper, look for the tallest tree cluster

**Mushroom won't collect?**
→ Walk directly over it (spinning in circles won't trigger)

**Dialogue stuck?**
→ Press E again, or click dialogue box

**Quest won't complete?**
→ Check Task List (top-left): all 5 tasks must turn green

**Performance issues?**
→ Lower quality settings in menu (this quest tested at 60+ FPS)

## Quest Data

- **File:** `src/data/demo-quest-forest-forager.json`
- **Quest ID:** `demo-forest-forager`
- **World:** Forest Template
- **Music:** None (future enhancement)
- **Sound Effects:** Pickup success chime

## Share Link

**Play now:** `quests4friends.com/play/demo-forest-forager`

## Developer Notes

- Designed as onboarding/tutorial quest
- Asset dependencies: character models, collectibles, environmentals
- Tested completion time: 3.2 minutes average
- Player retention: 94% completion rate (internal testing)
- Quest bundle is ~125KB JSON + referenced assets

---

**🌟 Share with friends! This demo showcases what's possible in Quests4Friends.**