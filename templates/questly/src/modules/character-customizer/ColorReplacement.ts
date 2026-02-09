/**
 * ColorReplacement.ts
 * Real-time color replacement on canvas with WebGL texture updates
 */

import * as THREE from 'three';
import { ColorReplacementOptions, ColorReplacementResult, RGB } from './types';
import { TextureExtractor } from './TextureExtractor';

export class ColorReplacement {
  /**
   * Replace one color with another on a canvas
   * @param canvas Source canvas
   * @param originalColor Color to replace (RGB)
   * @param newColor Replacement color (RGB)
   * @param options Replacement options
   * @returns Updated canvas and pixel count
   */
  static replaceColor(
    canvas: HTMLCanvasElement,
    originalColor: RGB,
    newColor: RGB,
    options: ColorReplacementOptions = {}
  ): ColorReplacementResult {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const tolerance = options.tolerance ?? 20;
    const preserveAlpha = options.preserveAlpha ?? true;

    let pixelsModified = 0;

    // Iterate through every pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip fully transparent pixels
      if (a < 50) continue;

      // Check if pixel matches original color within tolerance
      if (this.colorWithinTolerance([r, g, b], originalColor, tolerance)) {
        data[i] = newColor[0];      // R
        data[i + 1] = newColor[1];  // G
        data[i + 2] = newColor[2];  // B
        // Alpha stays the same unless affectAlpha is true
        if (options.affectAlpha) {
          data[i + 3] = a * 0.95; // Slightly fade if requested
        }
        pixelsModified++;
      }
    }

    // Put modified data back on canvas
    ctx.putImageData(imageData, 0, 0);

    return {
      updatedCanvas: canvas,
      pixelsModified,
      originalPixels: imageData,
    };
  }

  /**
   * Replace multiple colors in batch
   */
  static replaceMultipleColors(
    canvas: HTMLCanvasElement,
    colorSwaps: Array<{ original: RGB; replacement: RGB; tolerance?: number }>
  ): ColorReplacementResult {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalPixelsModified = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 50) continue;

      for (const swap of colorSwaps) {
        const tolerance = swap.tolerance ?? 20;

        if (this.colorWithinTolerance([r, g, b], swap.original, tolerance)) {
          data[i] = swap.replacement[0];
          data[i + 1] = swap.replacement[1];
          data[i + 2] = swap.replacement[2];
          totalPixelsModified++;
          break; // Only apply first matching swap
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    return {
      updatedCanvas: canvas,
      pixelsModified: totalPixelsModified,
      originalPixels: imageData,
    };
  }

  /**
   * Update WebGL material with new canvas texture
   */
  static updateMaterialTexture(
    material: THREE.Material,
    canvas: HTMLCanvasElement,
    options: { magFilter?: THREE.TextureFilter; minFilter?: THREE.TextureFilter } = {}
  ): THREE.Texture {
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.magFilter = options.magFilter ?? THREE.NearestFilter;
    newTexture.minFilter = options.minFilter ?? THREE.NearestFilter;

    if ('map' in material && material.map) {
      // Dispose old texture
      material.map.dispose();
      material.map = newTexture;
    }

    (material as any).needsUpdate = true;

    return newTexture;
  }

  /**
   * Update all materials in a group with new texture
   */
  static updateGroupMaterials(
    group: THREE.Group,
    canvas: HTMLCanvasElement,
    options: { magFilter?: THREE.TextureFilter; minFilter?: THREE.TextureFilter } = {}
  ): void {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const mat of materials) {
          if ('map' in mat && mat.map) {
            this.updateMaterialTexture(mat as THREE.Material, canvas, options);
          }
        }
      }
    });
  }

  /**
   * Check if a color is within tolerance of a target
   */
  private static colorWithinTolerance(color: RGB, target: RGB, tolerance: number): boolean {
    const dr = color[0] - target[0];
    const dg = color[1] - target[1];
    const db = color[2] - target[2];
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    return distance <= tolerance;
  }

  /**
   * Create a color replacement preview (non-destructive)
   */
  static previewColorReplacement(
    sourceCanvas: HTMLCanvasElement,
    originalColor: RGB,
    newColor: RGB,
    tolerance: number = 20
  ): HTMLCanvasElement {
    // Clone canvas
    const previewCanvas = sourceCanvas.cloneNode() as HTMLCanvasElement;
    const previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true })!;
    
    const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
    const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    previewCtx.putImageData(sourceImageData, 0, 0);

    // Apply replacement on preview
    this.replaceColor(previewCanvas, originalColor, newColor, { tolerance });
    return previewCanvas;
  }

  /**
   * Lighten a color
   */
  static lightenColor(color: RGB, amount: number = 30): RGB {
    return [
      Math.min(255, color[0] + amount),
      Math.min(255, color[1] + amount),
      Math.min(255, color[2] + amount),
    ];
  }

  /**
   * Darken a color
   */
  static darkenColor(color: RGB, amount: number = 30): RGB {
    return [
      Math.max(0, color[0] - amount),
      Math.max(0, color[1] - amount),
      Math.max(0, color[2] - amount),
    ];
  }

  /**
   * Saturate/desaturate a color
   */
  static adjustSaturation(color: RGB, factor: number = 1.2): RGB {
    // Convert to HSL, adjust, convert back
    const [h, s, l] = this.rgbToHsl(color);
    const newS = Math.min(100, s * factor);
    return this.hslToRgb([h, newS, l]);
  }

  /**
   * RGB to HSL conversion
   */
  private static rgbToHsl(rgb: RGB): [number, number, number] {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return [h * 360, s * 100, l * 100];
  }

  /**
   * HSL to RGB conversion
   */
  private static hslToRgb(hsl: [number, number, number]): RGB {
    const h = hsl[0] / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
    ];
  }
}
