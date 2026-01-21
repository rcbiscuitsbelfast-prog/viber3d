/**
 * Heightmap Generation using Simplex-like Noise
 * Based on improved Perlin noise algorithm
 */

import { HeightmapConfig, Heightmap } from './types';

/**
 * Simple pseudorandom noise generator
 */
class NoiseGenerator {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  private hash(x: number, y: number): number {
    let h = this.seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return (h ^ (h >>> 16)) >>> 0;
  }

  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * 2D Perlin-like noise
   */
  noise2D(x: number, y: number): number {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const sx = this.smoothstep(x - x0);
    const sy = this.smoothstep(y - y0);

    const n00 = this.gradientDot(x0, y0, x, y);
    const n10 = this.gradientDot(x1, y0, x, y);
    const n01 = this.gradientDot(x0, y1, x, y);
    const n11 = this.gradientDot(x1, y1, x, y);

    const nx0 = this.lerp(n00, n10, sx);
    const nx1 = this.lerp(n01, n11, sx);

    return this.lerp(nx0, nx1, sy);
  }

  private gradientDot(gridX: number, gridY: number, x: number, y: number): number {
    const hash = this.hash(gridX, gridY);
    const angle = (hash & 0xff) / 255 * Math.PI * 2;
    const gradX = Math.cos(angle);
    const gradY = Math.sin(angle);
    const dx = x - gridX;
    const dy = y - gridY;
    return dx * gradX + dy * gradY;
  }

  /**
   * Fractal Brownian Motion (layered octaves)
   */
  fbm(x: number, y: number, octaves: number, persistence: number, lacunarity: number): number {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

/**
 * Radial falloff for island shaping
 */
function radialFalloff(x: number, y: number, centerX: number, centerY: number, radius: number): number {
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const normalized = distance / radius;
  
  if (normalized >= 1) return 0;
  
  // Smooth falloff curve
  const falloff = 1 - normalized * normalized;
  return falloff * falloff;
}

/**
 * Generate heightmap with island shape
 */
export function generateHeightmap(config: HeightmapConfig): Heightmap {
  const { size, scale, octaves, persistence, lacunarity, waterLevel, islandRadius, seed } = config;
  
  const noise = new NoiseGenerator(seed);
  const data = new Float32Array(size * size);
  
  let min = Infinity;
  let max = -Infinity;
  
  const centerX = size / 2;
  const centerY = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = x + y * size;
      
      // Generate base noise
      const nx = x / scale;
      const ny = y / scale;
      const noiseValue = noise.fbm(nx, ny, octaves, persistence, lacunarity);
      
      // Apply island mask
      const falloff = radialFalloff(x, y, centerX, centerY, islandRadius);
      
      // Combine noise and falloff
      let height = noiseValue * falloff;
      
      // Apply water level
      height = height - waterLevel;
      
      data[idx] = height;
      
      if (height < min) min = height;
      if (height > max) max = height;
    }
  }

  // Normalize to 0-1 range
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i++) {
      data[i] = (data[i] - min) / range;
    }
  }

  return {
    data,
    size,
    min: 0,
    max: 1,
  };
}

/**
 * Get height at specific coordinates (with bilinear interpolation)
 */
export function sampleHeightmap(heightmap: Heightmap, x: number, y: number): number {
  const { data, size } = heightmap;
  
  // Clamp to bounds
  x = Math.max(0, Math.min(size - 1, x));
  y = Math.max(0, Math.min(size - 1, y));
  
  const x0 = Math.floor(x);
  const x1 = Math.min(x0 + 1, size - 1);
  const y0 = Math.floor(y);
  const y1 = Math.min(y0 + 1, size - 1);
  
  const fx = x - x0;
  const fy = y - y0;
  
  const h00 = data[x0 + y0 * size];
  const h10 = data[x1 + y0 * size];
  const h01 = data[x0 + y1 * size];
  const h11 = data[x1 + y1 * size];
  
  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  
  return h0 * (1 - fy) + h1 * fy;
}
