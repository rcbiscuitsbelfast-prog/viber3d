/**
 * TextureExtractor.ts
 * Analyzes model textures and extracts unique flat colors using clustering
 */

import * as THREE from 'three';
import { ExtractedColor, TextureExtractionResult, RGB } from './types';

export class TextureExtractor {
  /**
   * Extract unique colors from a THREE.js texture
   * @param texture The texture to analyze
   * @param samplingMethod How to scan the texture
   * @param clusterThreshold Similarity threshold for color clustering (0-255)
   * @returns Extracted color palette and canvas data
   */
  static async extractColors(
    texture: THREE.Texture,
    samplingMethod: 'smart' | 'grid' | 'all' = 'smart',
    clusterThreshold: number = 15,
    minPixelThreshold: number = 5
  ): Promise<TextureExtractionResult> {
    // Create canvas from texture
    const canvas = await this.textureToCanvas(texture);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    return this.extractFromImageData(
      imageData,
      samplingMethod,
      clusterThreshold,
      minPixelThreshold
    );
  }

  /**
   * Extract colors from ImageData
   * @param imageData Canvas ImageData
   * @param samplingMethod Sampling strategy
   * @param clusterThreshold Color similarity threshold
   * @param minPixelThreshold Minimum pixels to count as valid color
   */
  static extractFromImageData(
    imageData: ImageData,
    samplingMethod: 'smart' | 'grid' | 'all' = 'smart',
    clusterThreshold: number = 15,
    minPixelThreshold: number = 5
  ): TextureExtractionResult {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const pixelCount = width * height;

    // Collect all pixels based on sampling method
    const pixels: RGBA[] = [];

    if (samplingMethod === 'all') {
      // Include all pixels
      for (let i = 0; i < data.length; i += 4) {
        pixels.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
      }
    } else if (samplingMethod === 'grid') {
      // Sample in grid pattern (every Nth pixel)
      const step = Math.max(1, Math.floor(Math.sqrt(pixelCount / 1000)));
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const idx = (y * width + x) * 4;
          pixels.push([data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]);
        }
      }
    } else {
      // 'smart' - Focus on opaque pixels first, then edges
      const opaquePixels: RGBA[] = [];
      const edgePixels: RGBA[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        const pixel: RGBA = [data[i], data[i + 1], data[i + 2], alpha];

        if (alpha > 200) {
          opaquePixels.push(pixel);
        } else if (alpha > 50) {
          edgePixels.push(pixel);
        }
      }

      // Sample from opaque pixels primarily
      const step = Math.max(1, Math.floor(opaquePixels.length / 2000));
      for (let i = 0; i < opaquePixels.length; i += step) {
        pixels.push(opaquePixels[i]);
      }

      // Add some edge pixels for blending detection
      const edgeStep = Math.max(1, Math.floor(edgePixels.length / 500));
      for (let i = 0; i < edgePixels.length; i += edgeStep) {
        pixels.push(edgePixels[i]);
      }
    }

    // Cluster similar colors
    const colorClusters = this.clusterColors(pixels, clusterThreshold);

    // Count pixel occurrences in full texture for percentages
    const colorCounts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Find cluster this pixel belongs to
      let clusterKey: string | null = null;
      for (const key of colorClusters.keys()) {
        const cluster = colorClusters.get(key)!;
        if (this.colorDistance([r, g, b, a], cluster.centroid) <= clusterThreshold) {
          clusterKey = key;
          break;
        }
      }

      if (clusterKey) {
        colorCounts.set(clusterKey, (colorCounts.get(clusterKey) || 0) + 1);
      }
    }

    // Convert clusters to extracted colors
    const extractedColors: ExtractedColor[] = [];
    for (const [hexKey, count] of colorCounts) {
      if (count >= minPixelThreshold) {
        const [r, g, b] = hexKey.split(',').map(Number) as [number, number, number];
        extractedColors.push({
          hex: this.rgbToHex(r, g, b),
          rgb: [r, g, b],
          rgba: [r, g, b, 255],
          pixelCount: count,
          percentage: (count / pixelCount) * 100,
          indexInPalette: 0,
        });
      }
    }

    // Sort by frequency (most common first)
    extractedColors.sort((a, b) => b.pixelCount - a.pixelCount);

    // Update indices
    extractedColors.forEach((color, index) => {
      color.indexInPalette = index;
    });

    return {
      colors: extractedColors,
      canvasData: imageData,
      textureWidth: width,
      textureHeight: height,
      totalPixels: pixelCount,
      uniqueColorCount: extractedColors.length,
    };
  }

  /**
   * Cluster similar colors using a simple greedy algorithm
   */
  private static clusterColors(
    pixels: RGBA[],
    threshold: number
  ): Map<string, { centroid: RGBA; pixels: RGBA[] }> {
    const clusters = new Map<string, { centroid: RGBA; pixels: RGBA[] }>();

    for (const pixel of pixels) {
      // Skip fully transparent pixels
      if (pixel[3] < 50) continue;

      let foundCluster = false;
      for (const cluster of clusters.values()) {
        if (this.colorDistance(pixel, cluster.centroid) <= threshold) {
          cluster.pixels.push(pixel);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        const key = `${pixel[0]},${pixel[1]},${pixel[2]}`;
        clusters.set(key, {
          centroid: pixel,
          pixels: [pixel],
        });
      }
    }

    // Recalculate centroids
    for (const cluster of clusters.values()) {
      const avgR = Math.round(
        cluster.pixels.reduce((sum, p) => sum + p[0], 0) / cluster.pixels.length
      );
      const avgG = Math.round(
        cluster.pixels.reduce((sum, p) => sum + p[1], 0) / cluster.pixels.length
      );
      const avgB = Math.round(
        cluster.pixels.reduce((sum, p) => sum + p[2], 0) / cluster.pixels.length
      );
      const avgA = Math.round(
        cluster.pixels.reduce((sum, p) => sum + p[3], 0) / cluster.pixels.length
      );

      cluster.centroid = [avgR, avgG, avgB, avgA];
    }

    return clusters;
  }

  /**
   * Calculate distance between two colors in RGBA space
   */
  private static colorDistance(color1: RGBA, color2: RGBA): number {
    const r = color1[0] - color2[0];
    const g = color1[1] - color2[1];
    const b = color1[2] - color2[2];
    const a = (color1[3] - color2[3]) * 0.5; // Alpha weighted less

    return Math.sqrt(r * r + g * g + b * b + a * a);
  }

  /**
   * Convert THREE.Texture to canvas
   */
  private static async textureToCanvas(texture: THREE.Texture): Promise<HTMLCanvasElement> {
    const image = texture.source?.data ?? (texture as unknown as { image?: unknown }).image;

    if (!image) {
      throw new Error('Texture has no source image data');
    }

    if (image instanceof HTMLCanvasElement) {
      return image;
    }

    // Create canvas from image
    const canvas = document.createElement('canvas');
    const width = (image as { width?: number }).width ?? (image as { videoWidth?: number }).videoWidth;
    const height = (image as { height?: number }).height ?? (image as { videoHeight?: number }).videoHeight;

    if (!width || !height) {
      throw new Error('Texture source has invalid dimensions');
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (image instanceof ImageData) {
      ctx.putImageData(image, 0, 0);
    } else if (image instanceof HTMLImageElement) {
      ctx.drawImage(image, 0, 0);
    } else if (image instanceof HTMLVideoElement) {
      ctx.drawImage(image, 0, 0);
    } else if (image instanceof ImageBitmap) {
      ctx.drawImage(image, 0, 0);
    } else if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) {
      ctx.drawImage(image, 0, 0);
    } else if (image instanceof HTMLCanvasElement) {
      ctx.drawImage(image, 0, 0);
    } else {
      throw new Error('Unsupported texture source type');
    }

    return canvas;
  }

  /**
   * Convert RGB to hex string
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  /**
   * Convert hex to RGB
   */
  static hexToRgb(hex: string): RGB {
    // Remove # if present
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b];
  }

  /**
   * Check if two colors are similar within tolerance
   */
  static areColorsSimilar(color1: RGB, color2: RGB, tolerance: number = 20): boolean {
    return this.colorDistance([...color1, 255], [...color2, 255]) <= tolerance;
  }
}

type RGBA = [number, number, number, number];
