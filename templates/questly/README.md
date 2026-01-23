# Questly - Game Builder

A visual game builder powered by Three.js and React Three Fiber.

## Features

- **Three.js Splash Screen**: Immersive 3D entry experience with animated logo
- **Visual Game Builder**: Drag-and-drop interface for creating 3D games
- **Kenny Block-Style Assets**: Beautiful low-poly game assets
- **Canvas Portaling**: Seamless Three.js scene transitions using tunnel-rat
- **Responsive Design**: Works across desktop, tablet, and mobile

## Architecture

### Tech Stack
- **React 18**: UI framework
- **Three.js r173**: 3D rendering
- **React Three Fiber 8.17**: React renderer for Three.js
- **tunnel-rat**: Canvas portaling between routes
- **Framer Motion**: Smooth animations
- **React Router**: Client-side routing
- **Tailwind CSS**: Styling
- **Zustand**: State management (ready to integrate)
- **TypeScript**: Type safety

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── CustomButton.tsx
│   ├── Navigation.tsx
│   └── ParallaxBackground.tsx
├── pages/              # Route pages
│   ├── SplashScreen.tsx   # Three.js intro
│   ├── MainMenu.tsx       # Main navigation
│   └── GameBuilder.tsx    # Visual builder
├── r3f/                # Three.js components
│   └── R3FCanvas.tsx
├── lib/                # Utilities
│   ├── tunnel.ts       # Canvas portaling
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Getting Started

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

Visit http://localhost:3000

### Build
```bash
pnpm build
```

## Key Patterns

### Canvas Portaling
Uses tunnel-rat to portal Three.js canvas between routes:

```tsx
// lib/tunnel.ts - Create tunnel
export const r3f = tunnel();

// R3FCanvas.tsx - Canvas with portal outlet
<Canvas><r3f.Out /></Canvas>

// Any page - Portal scene content
<r3f.In>
  <mesh>...</mesh>
</r3f.In>
```

### Best Practices
- Follow MASTER_THREEJS_BEST_PRACTICES.md
- Use tunnel-rat for scene transitions
- Dispose Three.js resources on unmount
- Optimize geometries and materials
- Use proper TypeScript types

## Documentation

See parent documentation for comprehensive guides:
- MASTER_THREEJS_BEST_PRACTICES.md
- THREEJS_GAME_DEVELOPMENT_GUIDE.md
- DOCUMENTATION_INDEX.md

## Roadmap

- [x] Three.js splash screen
- [x] Main menu with navigation
- [x] Game builder UI structure
- [ ] Kenny block asset integration
- [ ] Drag-drop 3D scene editing
- [ ] Character creator
- [ ] World builder
- [ ] Export functionality
- [ ] Asset marketplace
- [ ] Multiplayer collaboration

## License

See LICENSE in repository root.
