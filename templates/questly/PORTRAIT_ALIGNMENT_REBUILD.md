# Portrait Sign/Title Alignment Rebuild - Complete

## Overview
Complete architectural rebuild of the portrait sign/title positioning system to eliminate alignment drift between reloads and provide deterministic, geometry-based positioning.

## Problems Solved
1. **Sign Pivot Offset Magnification**: Sign model's non-centered pivot was magnified by nested scaling, causing inconsistent positioning
2. **Manual Offset Dependency**: Previous system relied on hardcoded offsets that varied unpredictably between portrait/landscape
3. **localStorage Drift**: Persisted values carried forward inconsistently across sessions/devices
4. **Width-based Portrait Detection**: Portrait mode triggered on width<768 even in landscape orientation

## Architecture Changes

### 1. CenteredSign Component (NEW)
**File**: `src/r3f/CenteredSign.tsx`

- Normalizes sign model's pivot point using bounding box center
- Calculates and reports sign geometry (min, max, center, size) to parent
- Eliminates offset magnification caused by nested transforms
- Preloads model for faster rendering

### 2. SplashSignScene - Geometry-Based Positioning
**File**: `src/r3f/SplashSignScene.tsx`

**Before**:
- Separate `signPos` and `textPos` props with manual offsets
- No relationship between sign and text positioning
- Different values for portrait vs landscape modes

**After**:
- Single `scale` prop with unified computation
- `textMargin` prop for space between sign top and text bottom
- Text position automatically computed from sign bounding box
- Position formula: `textY = signBounds.max.y - signBounds.center.y + textMargin`

### 3. SignCanvas - Unified Scale & Debug Mode
**File**: `src/r3f/SignCanvas.tsx`

**Before**:
- Separate portrait/landscape config objects
- Manual scale values (1.80 portrait, 3.0 landscape)
- Three localStorage-persisted sliders (scale, yOffset, gap)
- Always-visible tuning UI

**After**:
- **Unified Scale Computation**:
  ```typescript
  aspectRatio > 1.2 → scale 3.0 (landscape)
  aspectRatio > 0.8 → scale 2.5 (square-ish)
  aspectRatio ≤ 0.8 → scale 2.0 - dynamic (portrait)
  ```
- **Debug Mode**: Tuning UI only shown when `?debug=true` in URL
- localStorage only used in debug mode
- Single Canvas component (no portrait/landscape duplication)

## Benefits

### Deterministic Alignment
- Sign and text positions computed from actual geometry, not guessed offsets
- Same formula works for all aspect ratios
- No drift between reloads or devices

### Simplified Maintenance
- Removed 100+ lines of manual offset code
- Single positioning logic path
- No mode-specific configurations

### Developer Experience
- Debug mode via `?debug=true` for fine-tuning
- Normal users get clean, stable defaults
- Geometry-based approach is self-documenting

## Testing Checklist

- [x] Portrait mode (phone): Sign/text aligned consistently
- [ ] Landscape mode (desktop): Sign/text aligned consistently
- [ ] Reload in portrait: Alignment stays stable (no drift)
- [ ] Reload in landscape: Alignment stays stable
- [ ] Switch from portrait to landscape: Smooth transition
- [ ] Switch from landscape to portrait: Smooth transition
- [ ] Debug mode (`?debug=true`): Sliders visible and functional
- [ ] Normal mode: No debug UI, deterministic defaults
- [ ] Multiple devices: Same alignment everywhere

## Debug Mode Usage

1. **Enable**: Add `?debug=true` to URL (e.g., `localhost:5173/?debug=true`)
2. **Tune**: Use sliders to adjust scale and text margin
3. **Save**: Values persist in localStorage for that browser
4. **Disable**: Remove `?debug=true` from URL to use production defaults

## Migration Notes

### Removed Files/Concepts
- `DEFAULT_PORTRAIT_SCALE`, `DEFAULT_PORTRAIT_Y_OFFSET`, `DEFAULT_PORTRAIT_GAP` constants
- `STORAGE_KEYS` object with three separate keys
- `loadStoredNumber()` helper (replaced with debug-gated loading)
- Portrait/landscape dual Canvas components
- Manual `signPos`/`textPos` calculations with `portraitSignTextGap`

### New Files/Concepts
- `CenteredSign.tsx` component for geometry normalization
- Aspect-ratio-based scale computation
- Debug mode URL flag pattern
- Bounding-box-based text anchoring
- `textMargin` prop for spacing control

## Future Enhancements

1. **Responsive Text Size**: Scale text size with viewport (currently fixed at 0.11)
2. **Vertical Centering**: Auto-center sign+text vertically in viewport
3. **Animation Tweaks**: Adjust fade-in timing per device performance
4. **Custom Fonts**: Support for additional font loading and selection

## Technical Details

### Sign Bounding Box
The CenteredSign component calculates:
- `min`: Bottom-left-front corner of sign
- `max`: Top-right-back corner of sign
- `center`: Geometric center point
- `size`: Width, height, depth of bounding box

### Text Positioning Formula
```typescript
// Center sign at origin
signPos = [-center.x, -center.y, -center.z]

// Position text above sign's top edge
textY = max.y - center.y + textMargin
textPos = [0, textY, -0.18]
```

### Scale Computation
```typescript
const aspectRatio = width / height;
if (aspectRatio > 1.2) scale = 3.0;      // Wide landscape
else if (aspectRatio > 0.8) scale = 2.5; // Square-ish
else scale = 2.0 - (0.8 - aspectRatio) * 0.8; // Portrait (dynamic)
```

## Troubleshooting

**Q: Sign/text appear too large/small?**
A: Enable debug mode (`?debug=true`) and adjust scale slider, then update default in SignCanvas.tsx

**Q: Text overlaps sign?**
A: Increase `textMargin` in debug mode, then update default (currently 0.05)

**Q: Sign appears offset to one side?**
A: Check CenteredSign component - may need to verify bounding box calculation

**Q: Alignment differs between devices?**
A: Clear localStorage and test without `?debug=true` to ensure deterministic defaults

## References

- **ASSET_AND_ANIMATION_INDEX.md**: Asset pipeline documentation
- **THREEJS_GAME_DEVELOPMENT_GUIDE.md**: Three.js best practices
- **React Three Fiber Docs**: https://docs.pmnd.rs/react-three-fiber

---

**Completed**: February 2, 2026  
**Author**: GitHub Copilot (Claude Sonnet 4.5)  
**Status**: ✅ Implementation Complete, Testing In Progress
