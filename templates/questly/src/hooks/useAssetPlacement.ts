/**
 * useAssetPlacement - React hook for asset placement system
 * Phase 4.3 - Asset Placement System
 */

import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AssetPlacementSystem, type PlacementResult } from '../systems/placement/AssetPlacementSystem';

export function useAssetPlacement(terrainMesh: THREE.Mesh | null) {
  const { camera, gl } = useThree();
  const placementSystemRef = useRef<AssetPlacementSystem>(new AssetPlacementSystem());
  const isPlacingRef = useRef(false);
  const selectedAssetTypeRef = useRef<'tree' | 'rock' | 'grass' | 'bush' | null>(null);

  /**
   * Handle mouse move for raycasting
   */
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      placementSystemRef.current.setMousePosition(x, y, rect.width, rect.height);
    },
    [gl]
  );

  /**
   * Handle click to place asset
   */
  const handleClick = useCallback(
    (
      event: MouseEvent,
      onPlace: (result: PlacementResult, assetType: string) => void
    ) => {
      if (!isPlacingRef.current || !selectedAssetTypeRef.current) return;

      const result = placementSystemRef.current.raycastTerrain(camera, terrainMesh);
      if (result && result.hit) {
        onPlace(result, selectedAssetTypeRef.current);
      }
    },
    [camera, terrainMesh]
  );

  /**
   * Start placement mode
   */
  const startPlacement = useCallback((assetType: 'tree' | 'rock' | 'grass' | 'bush') => {
    isPlacingRef.current = true;
    selectedAssetTypeRef.current = assetType;
  }, []);

  /**
   * Stop placement mode
   */
  const stopPlacement = useCallback(() => {
    isPlacingRef.current = false;
    selectedAssetTypeRef.current = null;
  }, []);

  /**
   * Get current placement preview position
   */
  const getPlacementPreview = useCallback((): PlacementResult | null => {
    if (!isPlacingRef.current) return null;
    return placementSystemRef.current.raycastTerrain(camera, terrainMesh);
  }, [camera, terrainMesh]);

  /**
   * Enable/disable snap to grid
   */
  const setSnapToGrid = useCallback((enabled: boolean, gridSize: number = 1.0) => {
    placementSystemRef.current.setSnapToGrid(enabled, gridSize);
  }, []);

  /**
   * Rotate selected entity
   */
  const rotateSelected = useCallback((delta: number) => {
    placementSystemRef.current.rotateEntity(delta);
  }, []);

  /**
   * Scale selected entity
   */
  const scaleSelected = useCallback((factor: number) => {
    placementSystemRef.current.scaleEntity(factor);
  }, []);

  /**
   * Get selected entity
   */
  const getSelectedEntity = useCallback(() => {
    return placementSystemRef.current.getSelectedEntity();
  }, []);

  /**
   * Select entity
   */
  const selectEntity = useCallback((entity: THREE.Object3D | null) => {
    placementSystemRef.current.selectEntity(entity);
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    placementSystemRef.current.clearSelection();
  }, []);

  // Set up event listeners
  useEffect(() => {
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, handleMouseMove]);

  return {
    startPlacement,
    stopPlacement,
    handleClick,
    getPlacementPreview,
    setSnapToGrid,
    rotateSelected,
    scaleSelected,
    getSelectedEntity,
    selectEntity,
    clearSelection,
    isPlacing: () => isPlacingRef.current,
  };
}
