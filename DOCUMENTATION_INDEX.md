# viber3d Documentation Index

**Complete documentation navigation for the viber3d repository**

---

## 📚 Quick Start: What Are You Looking For?

### 🎮 Building a Game
→ **[THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md)** (START HERE)
- Complete game architecture with ECS
- 10 core systems (movement, combat, AI, physics)
- 3 full game examples (shooter, FPS, racing)
- Production deployment checklist

### 📖 Understanding the Three.js Ecosystem  
→ **[MASTER_THREEJS_BEST_PRACTICES.md](MASTER_THREEJS_BEST_PRACTICES.md)**
- Comprehensive audit of threejs-skills, react-three-next, viber3d
- 20 copy-paste patterns
- Migration guides
- AI tool configuration

### 🔧 Block/Asset Spawning Fix
→ **[AUDIT_AND_FIX_COMPLETE.md](AUDIT_AND_FIX_COMPLETE.md)**
- Kenny Blocks rendering issue resolution
- Implementation details
- Testing verification

---

## 📋 All Available Documentation

### Three.js Game Development

#### 1. **THREEJS_GAME_DEVELOPMENT_GUIDE.md** ⭐ PRIMARY RESOURCE
**The definitive guide for building production games with Three.js**

**What's Inside:**
- Complete ECS architecture blueprint
- 10 core game systems with full implementations
- 10 production-ready game patterns
- 3 complete game examples (top-down shooter, FPS, racing)
- Performance optimization guide (spatial hashing, pooling, LOD)
- Production deployment checklist
- Comprehensive troubleshooting section

**Best For:**
- Game developers ready to build
- Need copy-paste working code
- Production game development
- System implementation reference

**Size:** ~30,000 words  
**Time:** 2-3 hours (reference document)

---

#### 2. **MASTER_THREEJS_BEST_PRACTICES.md**
**Comprehensive ecosystem audit with consolidated best practices**

**What's Inside:**
- Repository profiles (threejs-skills, react-three-next, viber3d)
- 9 best practice categories
- 20 common patterns library
- Dependencies and version matrix
- 15 gotchas with solutions
- Migration path (vanilla → R3F → viber3d)
- AI code generation rules for all major tools

**Best For:**
- Learning the ecosystem
- Understanding different approaches
- Migrating between frameworks
- Setting up AI coding tools
- Troubleshooting compatibility issues

**Size:** ~60,000 words  
**Time:** 4-5 hours (reference document)

---

### Block/Asset Spawning Fix Documentation

**Background:** Kenny Blocks system was rendering assets inside blocks instead of on top. Complete fix implemented with backward compatibility.

#### 3. **AUDIT_AND_FIX_COMPLETE.md** 
Executive summary and complete audit

#### 4. **IMPLEMENTATION_SUMMARY_BLOCK_ASSET_FIX.md**
Detailed code changes with line numbers

#### 5. **AUDIT_OF_CURSOR_AUDIT.md**
Deep technical analysis and architecture

#### 6. **VISUAL_GUIDE_BLOCK_ASSET_FIX.md**
Diagrams and visual explanations

#### 7. **QUICK_REFERENCE_BLOCK_ASSET_FIX.md**
One-page quick lookup

---

## 🎯 Navigation by Use Case

### I Want To...

#### **Build a Game From Scratch**
1. Read [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md) → "Getting Started"
2. Follow "Complete Code Examples" → Top-Down Shooter
3. Reference "Core Systems" as you build
4. Use "Production Checklist" before launch

**Time to First Playable:** 2-4 hours

---

#### **Understand the Three.js Ecosystem**
1. Read [MASTER_THREEJS_BEST_PRACTICES.md](MASTER_THREEJS_BEST_PRACTICES.md) → "Executive Summary"
2. Review "Repository Profiles"
3. Check "Migration Path" to understand evolution

**Time:** 30-60 minutes overview

---

#### **Solve a Specific Problem**
1. Check [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md) → "Troubleshooting" (10 common issues)
2. Check [MASTER_THREEJS_BEST_PRACTICES.md](MASTER_THREEJS_BEST_PRACTICES.md) → "Gotchas & Solutions" (15 issues)
3. Search both docs with Ctrl+F for your specific issue

---

#### **Optimize Performance**
1. [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md) → "Performance & Optimization"
   - Spatial hashing for collision detection
   - Object pooling patterns
   - Instanced rendering

2. [MASTER_THREEJS_BEST_PRACTICES.md](MASTER_THREEJS_BEST_PRACTICES.md) → "Performance Optimization"
   - LOD systems
   - Texture compression
   - Memory management

---

#### **Deploy to Production**
1. [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md) → "Production Checklist"
   - Code quality checks
   - Performance targets
   - User experience requirements
   - Deployment configuration

---

#### **Set Up AI Tools (Cursor, Copilot, Windsurf, Cline)**
1. [MASTER_THREEJS_BEST_PRACTICES.md](MASTER_THREEJS_BEST_PRACTICES.md) → "AI Code Generation Rules"
   - Pre-configured rules for viber3d
   - Custom instructions for each tool
   - Prompt templates
   - Best practices for AI pair programming

**Setup Time:** 15-30 minutes

---

#### **Fix Kenny Blocks Asset Rendering**
1. [AUDIT_AND_FIX_COMPLETE.md](AUDIT_AND_FIX_COMPLETE.md) for overview
2. [VISUAL_GUIDE_BLOCK_ASSET_FIX.md](VISUAL_GUIDE_BLOCK_ASSET_FIX.md) for understanding
3. [IMPLEMENTATION_SUMMARY_BLOCK_ASSET_FIX.md](IMPLEMENTATION_SUMMARY_BLOCK_ASSET_FIX.md) for implementation

**Status:** ✅ Complete & Verified

---

## 📊 Document Comparison Matrix

| Feature | Game Dev Guide | Master Best Practices | Block Fix Docs |
|---------|----------------|----------------------|----------------|
| **Game-Specific** | ✅ 100% | ⚠️ Partial | N/A |
| **Complete Examples** | ✅ 3 full games | ⚠️ Patterns only | N/A |
| **ECS Architecture** | ✅ Deep dive | ⚠️ Overview | N/A |
| **Copy-Paste Code** | ✅ Production-ready | ✅ General patterns | ✅ Specific fix |
| **Performance** | ✅ Game-focused | ✅ General | N/A |
| **Ecosystem Overview** | ❌ No | ✅ Complete | N/A |
| **Migration Guides** | ❌ No | ✅ Yes | N/A |
| **AI Tool Setup** | ⚠️ Brief | ✅ Detailed | N/A |
| **Troubleshooting** | ✅ Game-specific | ✅ General | ✅ Specific issue |
| **Production Ready** | ✅ Checklist | ⚠️ Guidelines | ✅ Verified |

---

## 🎓 Learning Paths

### **Beginner Path** (New to Three.js Games)

**Week 1: Foundations**
- Day 1: Install viber3d starter (`npx viber3d@latest init my-game`)
- Day 2-3: Read Game Dev Guide → "Architecture Blueprint"
- Day 4-5: Build basic scene with player movement
- Day 6-7: Add simple enemy spawning

**Week 2: Core Systems**
- Implement combat system
- Add physics integration
- Create input handling
- Build basic AI

**Week 3: Complete Game**
- Follow top-down shooter example
- Add weapons and collectibles
- Implement UI/HUD
- Add sound effects

**Week 4: Polish & Deploy**
- Performance optimization
- Mobile support
- Production build
- Deploy to Vercel/Netlify

**Total Time:** 4 weeks part-time

---

### **Intermediate Path** (Know Three.js, New to Games)

**Week 1: ECS & Architecture**
- Review ECS patterns in Game Dev Guide
- Set up project with physics and state management
- Build player controller with animations

**Week 2: Game Systems**
- Implement combat, AI, and weapon systems
- Add spawning and collectible systems
- Create complete game loop

**Week 3: Polish & Deploy**
- Performance optimization
- Add particle effects and polish
- Complete production checklist
- Deploy

**Total Time:** 3 weeks part-time

---

### **Advanced Path** (Experienced Game Developer)

**Week 1: Rapid Development**
- Clone patterns from Complete Code Examples
- Adapt systems for your specific game
- Implement multiplayer (if needed)

**Week 2: Optimization & Production**
- Profile and optimize performance
- Implement advanced features (VR, procedural generation)
- Complete production checklist
- Deploy

**Total Time:** 2 weeks full-time

---

## 🔍 Quick Search Index

### By Technology

**Three.js Core**
- Master Best Practices → "Best Practices by Category" → "Scene & Renderer Setup"

**React Three Fiber**
- Game Dev Guide → "Technology Stack"
- Master Best Practices → "Repository Profiles" → react-three-next

**ECS (Koota)**
- Game Dev Guide → "Architecture Blueprint", all "Core Systems"
- Master Best Practices → "Repository Profiles" → viber3d

**Physics (Rapier)**
- Game Dev Guide → "Core Systems" → "Physics Integration System"
- Master Best Practices → "Physics Integration"

**State Management (Zustand)**
- Game Dev Guide → "Game Development Patterns" → "State Management Integration"

---

### By Topic

**Animation**
- Game Dev Guide → "Core Systems" → "Animation System"
- Master Best Practices → "Asset Loading & Animation Systems"

**AI/Enemy Behavior**
- Game Dev Guide → "Game Development Patterns" → "Enemy AI"

**Camera Controls**
- Game Dev Guide → "Core Systems" → "Camera System"
- Master Best Practices → "Common Patterns Library" → "Camera Controls"

**Collision Detection**
- Game Dev Guide → "Performance & Optimization" → "Spatial Hashing"

**Input Handling**
- Game Dev Guide → "Core Systems" → "Input System"
- Master Best Practices → "Common Patterns Library" → "Keyboard/Mobile Controls"

**Loading Assets**
- Master Best Practices → "Asset Loading & Animation Systems"

**Multiplayer**
- Game Dev Guide → "Advanced Topics" → "Multiplayer"

**Performance**
- Game Dev Guide → "Performance & Optimization" (entire section)
- Master Best Practices → "Performance Optimization"

**Weapons**
- Game Dev Guide → "Game Development Patterns" → "Weapon System"

---

## 💡 Best Practices for Using These Docs

### 1. **Start with the Right Document**
- Building a game? → Game Dev Guide
- Evaluating options? → Master Best Practices
- Fixing Kenny Blocks? → Block Fix docs

### 2. **Use Search Extensively**
Both main documents are 30,000-60,000 words. Use Ctrl+F / Cmd+F liberally.

### 3. **Copy-Paste Code Freely**
All examples are production-ready. Adapt to your needs.

### 4. **Bookmark Key Sections**
Mark frequently referenced sections for quick access.

### 5. **Keep Docs Open While Coding**
Reference as you build. These are living reference guides, not tutorials to read once.

### 6. **Check Version Numbers**
Both documents include version numbers. Keep dependencies aligned.

---

## 🤝 Contributing to Documentation

Found an issue? Want to add a pattern?

1. File an issue with document name and section
2. Submit a PR with proposed changes
3. Update relevant cross-references
4. Add to this index if creating new docs

---

## 📞 Support & Resources

### **Documentation Issues**
- File issue in this repository
- Include: document name, section, specific problem

### **Game Development Questions**
1. Check Troubleshooting sections first
2. Search both main docs
3. Join Poimandres Discord: https://discord.gg/poimandres
4. Ask on r/threejs

### **Bug Reports (Code)**
- viber3d issues: File in viber3d repository
- three.js issues: File in Three.js repository
- Include: reproduction steps, environment details

### **Community Resources**
- **Discord:** https://discord.gg/poimandres
- **Reddit:** r/threejs
- **Three.js Docs:** https://threejs.org/docs/
- **R3F Docs:** https://docs.pmnd.rs/react-three-fiber

---

## ✅ Pre-Development Checklist

Before starting your project:

- [ ] Read this index to understand available documentation
- [ ] Choose appropriate guide for your needs
- [ ] Set up development environment (Node.js, IDE)
- [ ] Install viber3d CLI if building a game
- [ ] Configure AI tools (optional but highly recommended)
- [ ] Bookmark frequently used sections
- [ ] Join community Discord for support
- [ ] Clone starter repository or example

**Ready to build?**  
→ [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md) → "Getting Started"

---

## 📈 Documentation Statistics

| Document | Words | Sections | Code Examples | Patterns |
|----------|-------|----------|---------------|----------|
| Game Dev Guide | ~30,000 | 10 major | 50+ | 10 game patterns |
| Master Best Practices | ~60,000 | 10 major | 70+ | 20 general patterns |
| Block Fix (combined) | ~15,000 | 15 | 10+ | 1 specific fix |
| **Total** | **~105,000** | **35** | **130+** | **31** |

---

## 🗺️ Document Relationships

```
DOCUMENTATION_INDEX.md (You are here)
    │
    ├─→ THREEJS_GAME_DEVELOPMENT_GUIDE.md
    │     • Primary resource for game development
    │     • References Master Best Practices for ecosystem details
    │     • Self-contained for game development workflow
    │
    ├─→ MASTER_THREEJS_BEST_PRACTICES.md
    │     • Comprehensive ecosystem reference
    │     • Referenced by Game Dev Guide for advanced topics
    │     • Covers three repositories (threejs-skills, react-three-next, viber3d)
    │
    └─→ Block/Asset Fix Documentation
          • AUDIT_AND_FIX_COMPLETE.md (overview)
          • IMPLEMENTATION_SUMMARY (details)
          • AUDIT_OF_CURSOR_AUDIT (analysis)
          • VISUAL_GUIDE (diagrams)
          • QUICK_REFERENCE (lookup)
```

---

**Last Updated:** January 2025  
**Maintained By:** viber3d project  
**License:** See repository LICENSE file

---

**Questions? Start Here:**
- [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md) for games
- [MASTER_THREEJS_BEST_PRACTICES.md](MASTER_THREEJS_BEST_PRACTICES.md) for ecosystem
- Open an issue for documentation improvements
