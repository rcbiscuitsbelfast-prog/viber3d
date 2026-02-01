// Utility to load a typeface JSON font and create 3D text geometry at runtime in Three.js
// Usage: import create3DText from './create3DText';
// Example: const mesh = await create3DText('Hello', '/fonts/helvetiker_regular.typeface.json');


import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export async function loadFontJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load(url, resolve, undefined, reject);
  });
}

export async function create3DText({
  text,
  fontUrl,
  size = 1,
  height = 0.2,
  curveSegments = 12,
  bevelEnabled = true,
  bevelThickness = 0.03,
  bevelSize = 0.02,
  bevelOffset = 0,
  bevelSegments = 5,
  material = new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 1, roughness: 0.3 })
}: {
  text: string;
  fontUrl: string;
  size?: number;
  height?: number;
  curveSegments?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelOffset?: number;
  bevelSegments?: number;
  material?: THREE.Material;
}): Promise<THREE.Mesh> {
  const font = await loadFontJson(fontUrl);
  const geometry = new TextGeometry(text, {
    font,
    size,
    height,
    curveSegments,
    bevelEnabled,
    bevelThickness,
    bevelSize,
    bevelOffset,
    bevelSegments
  });
  // Manual centering without scaling
  geometry.computeBoundingBox();
  if (geometry.boundingBox) {
    const offset = geometry.boundingBox.getCenter(new THREE.Vector3()).negate();
    geometry.translate(offset.x, offset.y, offset.z);
    // Debug: log bounding box dimensions
    const sizeVec = new THREE.Vector3();
    geometry.boundingBox.getSize(sizeVec);
    console.log('[create3DText] bounding box size:', sizeVec, 'height param:', height);
  }
  return new THREE.Mesh(geometry, material);
}
