import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { create3DText } from './create3DText';
import { resolveAssetPath } from '@/lib/paths';

// Stable default references to prevent unnecessary re-renders
const DEFAULT_POSITION: [number, number, number] = [0, 0, 0];
const DEFAULT_ROTATION: [number, number, number] = [0, 0, 0];
const DEFAULT_TEXTURE_REPEAT: [number, number] = [1, 1];

export interface Font3DTextProps {
  text: string;
  position?: [number, number, number];
  color?: string;
  height?: number;
  bevelSize?: number;
  bevelThickness?: number;
  bevelSegments?: number;
  bevelOffset?: number;
  curveSegments?: number;
  size?: number;
  bevelEnabled?: boolean;
  rotation?: [number, number, number];
  fontUrl?: string;
  textureUrl?: string;
  bumpMapUrl?: string;
  roughnessMapUrl?: string;
  textureRepeat?: [number, number];
  materialType?: 'standard' | 'toon';
  gradientMapUrl?: string;
  edgeColor?: string;
  outlineEnabled?: boolean;
  outlineColor?: string;
  outlineThickness?: number;
  outlineOffset?: number;
  [key: string]: any;
}

export const Font3DText = React.memo(function Font3DTextComponent(props: Font3DTextProps) {
  const {
    text,
    position = DEFAULT_POSITION,
    color = '#FFD700',
    height = 0.1,
    bevelSize = 0.02,
    bevelThickness = 0.03,
    bevelSegments = 5,
    bevelOffset = 0,
    curveSegments = 12,
    size = 1.2,
    bevelEnabled = false,
    rotation = DEFAULT_ROTATION,
    fontUrl = resolveAssetPath('/fonts/gentilis_regular.typeface.json'),
    textureUrl,
    bumpMapUrl,
    roughnessMapUrl,
    textureRepeat = DEFAULT_TEXTURE_REPEAT,
    materialType = 'standard',
    gradientMapUrl,
    edgeColor,
    outlineEnabled = false,
    outlineColor = '#111111',
    outlineThickness = 0.035,
    outlineOffset = 0.02,
    ...rest
  } = props;
  const meshRef = useRef<THREE.Mesh>(null);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const [outlineMesh, setOutlineMesh] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    let mounted = true;
    // Debug: log all geometry params
    console.log('[Font3DText] params:', {
      text,
      size,
      height,
      curveSegments,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      bevelOffset,
      fontUrl
    });
    const loadTexture = (url?: string) => {
      if (!url) return Promise.resolve(null);
      const loader = new THREE.TextureLoader();
      return new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
    };

    const loadMaterial = async () => {
      const [map, bumpMap, roughnessMap, gradientMap] = await Promise.all([
        loadTexture(textureUrl),
        loadTexture(bumpMapUrl),
        loadTexture(roughnessMapUrl),
        loadTexture(gradientMapUrl)
      ]);

      const textures = [map, bumpMap, roughnessMap].filter(Boolean) as THREE.Texture[];
      textures.forEach((tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(textureRepeat[0], textureRepeat[1]);
        tex.needsUpdate = true;
      });

      if (gradientMap) {
        gradientMap.minFilter = THREE.NearestFilter;
        gradientMap.magFilter = THREE.NearestFilter;
      }

      let frontMaterial: THREE.Material;
      if (materialType === 'toon') {
        frontMaterial = new THREE.MeshToonMaterial({
          color,
          map: map || undefined,
          gradientMap: gradientMap || undefined
        });
      } else {
        const materialProps: any = {
          color,
          metalness: 0.2,
          roughness: 0.9,
        };
        
        // Only add texture properties if they exist
        if (map) materialProps.map = map;
        if (bumpMap) {
          materialProps.bumpMap = bumpMap;
          materialProps.bumpScale = 0.06;
        }
        if (roughnessMap) materialProps.roughnessMap = roughnessMap;
        
        frontMaterial = new THREE.MeshStandardMaterial(materialProps);
      }

      // If edgeColor is specified, create a material array
      if (edgeColor) {
        const edgeMaterial = materialType === 'toon' 
          ? new THREE.MeshToonMaterial({ color: edgeColor, gradientMap: gradientMap || undefined })
          : new THREE.MeshBasicMaterial({ color: edgeColor });
        return [frontMaterial, edgeMaterial];
      }

      return frontMaterial;
    };

    loadMaterial().then((material) =>
      create3DText({
        text,
        fontUrl,
        size,
        height,
        curveSegments,
        bevelEnabled,
        bevelThickness,
        bevelSize,
        bevelSegments,
        bevelOffset,
        material
      })
    ).then((createdMesh) => {
      console.log('[Font3DText] Successfully created mesh for text:', text);
      if (mounted) {
        // Log bounding box after mesh creation
        createdMesh.geometry.computeBoundingBox();
        if (createdMesh.geometry.boundingBox) {
          const sizeVec = new THREE.Vector3();
          createdMesh.geometry.boundingBox.getSize(sizeVec);
          console.log('[Font3DText] mesh bounding box size:', sizeVec, 'height param:', height);
          // --- Normalize Z scale so bounding box Z matches height param ---
          if (sizeVec.z !== 0 && Math.abs(sizeVec.z - height) > 1e-6) {
            const scaleZ = height / sizeVec.z;
            createdMesh.scale.set(1, 1, scaleZ);
            // Recompute bounding box after scaling for debug
            const scaledBox = new THREE.Box3().setFromObject(createdMesh);
            const scaledSize = new THREE.Vector3();
            scaledBox.getSize(scaledSize);
            console.log('[Font3DText] normalized bounding box size:', scaledSize, 'target height:', height);
          }
        }
        setMesh(createdMesh);

        if (outlineEnabled) {
          const outlineMat = new THREE.MeshBasicMaterial({
            color: outlineColor,
            side: THREE.BackSide
          });
          const outline = new THREE.Mesh(createdMesh.geometry, outlineMat);
          outline.position.set(0, 0, 0);
          outline.rotation.copy(createdMesh.rotation);
          outline.scale.copy(createdMesh.scale).multiplyScalar(1 + outlineThickness);
          setOutlineMesh(outline);
        } else {
          setOutlineMesh(null);
        }
      }
    }).catch((error) => {
      console.error('[Font3DText] Error loading font or creating text:', error);
      console.error('[Font3DText] Font URL was:', fontUrl);
    });
    return () => {
      mounted = false;
      // Clean up geometries, materials, and textures to prevent memory leaks
      // ===== GPU MEMORY CLEANUP (Feb 6, 2026) =====
      const disposeTextures = (material: THREE.Material) => {
        const mat = material as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.dispose();
        if (mat.normalMap) mat.normalMap.dispose();
        if (mat.roughnessMap) mat.roughnessMap.dispose();
        if (mat.metalnessMap) mat.metalnessMap.dispose();
        if (mat.bumpMap) mat.bumpMap.dispose();
        if (mat.aoMap) mat.aoMap.dispose();
        if (mat.emissiveMap) mat.emissiveMap.dispose();
      };

      if (mesh) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => {
              disposeTextures(m);
              m.dispose();
            });
          } else {
            disposeTextures(mesh.material);
            mesh.material.dispose();
          }
        }
      }
      if (outlineMesh) {
        if (outlineMesh.geometry) {
          outlineMesh.geometry.dispose();
        }
        if (outlineMesh.material) {
          if (Array.isArray(outlineMesh.material)) {
            outlineMesh.material.forEach(m => {
              disposeTextures(m);
              m.dispose();
            });
          } else {
            disposeTextures(outlineMesh.material);
            outlineMesh.material.dispose();
          }
        }
      }
    };
  }, [text, color, size, height, curveSegments, bevelEnabled, bevelThickness, bevelSize, bevelSegments, bevelOffset, fontUrl, textureUrl, bumpMapUrl, roughnessMapUrl, textureRepeat, materialType, gradientMapUrl, edgeColor, outlineEnabled, outlineColor, outlineThickness, outlineOffset]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);

  if (!mesh) return null;
  return (
    <group position={position} {...rest}>
      {outlineMesh && <primitive object={outlineMesh} />}
      <primitive object={mesh} ref={meshRef} />
    </group>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if these critical props change
  return (
    prevProps.text === nextProps.text &&
    prevProps.fontUrl === nextProps.fontUrl &&
    prevProps.color === nextProps.color &&
    prevProps.size === nextProps.size &&
    prevProps.height === nextProps.height &&
    prevProps.materialType === nextProps.materialType &&
    prevProps.outlineEnabled === nextProps.outlineEnabled &&
    // Compare array props by reference (now using stable defaults)
    prevProps.position === nextProps.position &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.textureRepeat === nextProps.textureRepeat
  );
});
