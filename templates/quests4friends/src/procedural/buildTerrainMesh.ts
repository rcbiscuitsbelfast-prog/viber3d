/**
 * Terrain Mesh Builder
 * Creates optimized mesh with vertex colors from heightmap
 */

import * as THREE from 'three';
import { Heightmap, BiomeMasks, TerrainMeshData } from './types';

/**
 * Build terrain mesh from heightmap
 */
export function buildTerrainMesh(
  heightmap: Heightmap,
  biomeMasks: BiomeMasks,
  worldSize: number = 100
): TerrainMeshData {
  const { data, size } = heightmap;
  
  // Calculate vertex count (size x size grid)
  const vertexCount = size * size;
  const faceCount = (size - 1) * (size - 1) * 2;
  
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const colors = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(faceCount * 3);
  
  const heightScale = 25; // Max terrain height in meters
  
  // Generate vertices
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = x + y * size;
      const vertIdx = idx * 3;
      const uvIdx = idx * 2;
      
      // Position
      const wx = (x / (size - 1) - 0.5) * worldSize;
      const wz = (y / (size - 1) - 0.5) * worldSize;
      const height = data[idx] * heightScale;
      
      positions[vertIdx] = wx;
      positions[vertIdx + 1] = height;
      positions[vertIdx + 2] = wz;
      
      // UVs
      uvs[uvIdx] = x / (size - 1);
      uvs[uvIdx + 1] = y / (size - 1);
      
      // Vertex color based on biome
      const color = getBiomeColor(biomeMasks, x, y, data[idx]);
      colors[vertIdx] = color.r;
      colors[vertIdx + 1] = color.g;
      colors[vertIdx + 2] = color.b;
    }
  }
  
  // Generate indices
  let indexPtr = 0;
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const a = x + y * size;
      const b = (x + 1) + y * size;
      const c = x + (y + 1) * size;
      const d = (x + 1) + (y + 1) * size;
      
      // First triangle
      indices[indexPtr++] = a;
      indices[indexPtr++] = c;
      indices[indexPtr++] = b;
      
      // Second triangle
      indices[indexPtr++] = b;
      indices[indexPtr++] = c;
      indices[indexPtr++] = d;
    }
  }
  
  // Calculate normals
  calculateNormals(positions, indices, normals);
  
  return {
    positions,
    normals,
    uvs,
    colors,
    indices,
  };
}

/**
 * Get color based on biome masks
 */
function getBiomeColor(masks: BiomeMasks, x: number, y: number, height: number): THREE.Color {
  const idx = x + y * masks.size;
  
  const water = masks.water[idx];
  const forest = masks.forest[idx];
  const grass = masks.grass[idx];
  const cliff = masks.cliff[idx];
  
  // Color palette
  const waterColor = new THREE.Color(0.2, 0.4, 0.6);
  const sandColor = new THREE.Color(0.8, 0.75, 0.6);
  const grassColor = new THREE.Color(0.4, 0.6, 0.3);
  const forestColor = new THREE.Color(0.25, 0.45, 0.25);
  const cliffColor = new THREE.Color(0.5, 0.5, 0.5);
  const peakColor = new THREE.Color(0.9, 0.9, 0.9);
  
  const color = new THREE.Color(0, 0, 0);
  
  // Water
  if (water > 0.5) {
    return waterColor;
  }
  
  // Beach (just above water)
  if (height < 0.35) {
    return sandColor;
  }
  
  // Cliff
  if (cliff > 0.5) {
    return cliffColor;
  }
  
  // Forest
  if (forest > 0.5) {
    color.lerp(forestColor, forest);
  }
  
  // Grass
  if (grass > 0.5) {
    color.lerp(grassColor, grass);
  }
  
  // High peaks
  if (height > 0.7) {
    const t = (height - 0.7) / 0.3;
    color.lerp(peakColor, t);
  }
  
  // Default to grass if no strong biome
  if (color.r === 0 && color.g === 0 && color.b === 0) {
    return grassColor;
  }
  
  return color;
}

/**
 * Calculate smooth normals for mesh
 */
function calculateNormals(positions: Float32Array, indices: Uint32Array, normals: Float32Array): void {
  // Initialize normals to zero
  normals.fill(0);
  
  // Accumulate face normals
  for (let i = 0; i < indices.length; i += 3) {
    const ia = indices[i] * 3;
    const ib = indices[i + 1] * 3;
    const ic = indices[i + 2] * 3;
    
    const ax = positions[ia];
    const ay = positions[ia + 1];
    const az = positions[ia + 2];
    
    const bx = positions[ib];
    const by = positions[ib + 1];
    const bz = positions[ib + 2];
    
    const cx = positions[ic];
    const cy = positions[ic + 1];
    const cz = positions[ic + 2];
    
    // Edge vectors
    const e1x = bx - ax;
    const e1y = by - ay;
    const e1z = bz - az;
    
    const e2x = cx - ax;
    const e2y = cy - ay;
    const e2z = cz - az;
    
    // Cross product
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    
    // Add to vertex normals
    normals[ia] += nx;
    normals[ia + 1] += ny;
    normals[ia + 2] += nz;
    
    normals[ib] += nx;
    normals[ib + 1] += ny;
    normals[ib + 2] += nz;
    
    normals[ic] += nx;
    normals[ic + 1] += ny;
    normals[ic + 2] += nz;
  }
  
  // Normalize
  for (let i = 0; i < normals.length; i += 3) {
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];
    
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
    
    if (length > 0) {
      normals[i] = nx / length;
      normals[i + 1] = ny / length;
      normals[i + 2] = nz / length;
    } else {
      normals[i] = 0;
      normals[i + 1] = 1;
      normals[i + 2] = 0;
    }
  }
}

/**
 * Create Three.js mesh from terrain data
 */
export function createTerrainMesh(meshData: TerrainMeshData): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  
  geometry.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(meshData.colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
  
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: false,
    roughness: 0.9,
    metalness: 0.1,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  
  return mesh;
}
