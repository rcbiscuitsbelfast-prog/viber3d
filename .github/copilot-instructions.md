# GitHub Copilot Instructions for Viber3D

## Project Overview
Viber3D is a modern starter kit for 3D browser games, built with React 19, React Three Fiber, Drei, Vite, TailwindCSS, Zustand, and TypeScript. It features an Entity Component System (ECS) architecture powered by the Koota library, and includes physics via React Three Rapier. The workspace contains multiple packages and asset directories, including sample viewers and model libraries.

## System Overview & Conventions (SOC)

### Grand Plan Context
- The workspace is designed for modular, visual 3D game building using React Three Fiber, Three.js, and ECS (Koota).
- All major game logic, asset management, and animation systems are documented in `DOCUMENTATION_INDEX.md`, `ASSET_AND_ANIMATION_INDEX.md`, and `THREEJS_GAME_DEVELOPMENT_GUIDE.md`.
- The asset pipeline supports multiple character/animation libraries (KayKit, Quaternius, Mixamo), with automatic bone mapping and compatibility detection.

### Working Models

#### Questly (Current Model)
- Visual game builder with drag-and-drop 3D scene editing.
- Uses tunnel-rat for seamless Three.js canvas portaling between routes.
- Project structure: `src/components`, `src/pages`, `src/r3f`, `src/lib`.
- Key features: animated splash screen, responsive UI, asset integration, builder UI.
- Animations: KayKit and Mixamo systems, with JSON-based animation databases.
- See `templates/questly/README.md` and `ASSET_AND_ANIMATION_INDEX.md` for details.

#### Quests4Friends (Previous Model)
- Message-driven playable adventures with 3D environments, NPCs, combat, collectibles, and quest logic.
- Project structure: `src/components/game`, `src/components/ui`, `src/pages`, `src/store`, `src/systems/assets`, `src/types`.
- Uses Zustand for state management, KayKit assets for models, and a modular quest system.
- See `templates/quests4friends/README.md` for architecture and API patterns.

### Key Conventions
- ECS architecture: modular systems, entities, and components (see Koota integration).
- Asset management: all assets in `/Assets`, referenced via manifest files and asset registries.
- Animation: JSON databases map character IDs to animation sets and bone structures.
- Scene transitions: use tunnel-rat for canvas portaling.
- Documentation: always reference the main guides for implementation details and best practices.

### AI Agent Guidance
- Always check the current working model (Questly) for up-to-date patterns.
- Reference previous models (Quests4Friends) for legacy logic and migration.
- Use the documentation index for navigation and troubleshooting.
- Follow naming conventions and modularization as shown in the templates.
- For new features, document in markdown and update the SOC section.

## Key Architecture & Patterns
- **Monorepo Structure**: Code is organized into `packages/` (core, viber3d, etc.), `Assets/` (models, viewers), and `templates/`.
- **Game Logic**: ECS pattern is central—see Koota integration in `packages/core` and `packages/viber3d`.
- **Frontend**: React Three Fiber is used for 3D rendering. Components follow React conventions but often use hooks and context for ECS and state.
- **Assets**: 3D models and textures are stored in `Assets/`, with glTF as the preferred format. Viewer and validator tools are in `Assets/three-gltf-viewer`.

## Developer Workflows
- **Start Dev Server**: `npm run dev` or `pnpm run dev` (Vite-powered)
- **Build**: `npm run build`
- **CLI Tool**: Use `npx viber3d@latest init` to scaffold new projects.
- **Testing**: No standard test runner is enforced; check individual package docs for specifics.
- **Asset Preview**: Use the glTF viewer in `Assets/three-gltf-viewer` for model validation and preview.

## Project-Specific Conventions
- **Component Structure**: Favor functional React components, hooks, and context. ECS entities/components should be modular and reusable.
- **AI Integration**: `.cursor/rules` (if present) and this file guide AI agents to follow project conventions, especially for Three.js and ECS code.
- **Documentation**: Maintain clear docstrings and markdown docs. See `DOCUMENTATION_INDEX.md` and `THREEJS_GAME_DEVELOPMENT_GUIDE.md` for standards.
- **Naming**: Use descriptive names for assets, components, and ECS systems. Avoid generic names.

## Integration Points & Dependencies
- **External Libraries**: React, React Three Fiber, Drei, Zustand, Koota, Vite, TailwindCSS, React Three Rapier.
- **Model Formats**: glTF is preferred; see `Assets/glTF-Sample-Models` for examples.
- **Viewer**: `Assets/three-gltf-viewer` is a standalone tool for glTF model preview and validation.

## Examples
- **Scaffold a new game**: `npx viber3d@latest init myGame`
- **Preview a model**: Open `Assets/three-gltf-viewer` and run `npm run dev`
- **Add a new ECS system**: Place in `packages/core` or `packages/viber3d/src` and document in markdown.

## References
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- [THREEJS_GAME_DEVELOPMENT_GUIDE.md](THREEJS_GAME_DEVELOPMENT_GUIDE.md)
- [Assets/glTF-Sample-Models/README.md](Assets/glTF-Sample-Models/README.md)
- [packages/viber3d/README.md](packages/viber3d/README.md)

---
For further conventions, see the main README and documentation files. Update this file as new workflows or patterns emerge.
