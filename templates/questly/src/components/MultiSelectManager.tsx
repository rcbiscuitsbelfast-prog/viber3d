/**
 * MultiSelectManager - Handles multi-select and bulk operations
 * Phase 4.3 - Asset Placement System
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface SelectableEntity {
  id: string;
  object: THREE.Object3D;
  type: 'manual-asset' | 'building-area' | 'quest-marker' | 'npc';
}

export function useMultiSelect() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const selectionBoxRef = useRef<{ start: THREE.Vector2; end: THREE.Vector2 } | null>(null);

  /**
   * Select a single entity
   */
  const selectEntity = useCallback((id: string, addToSelection: boolean = false) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (addToSelection) {
        newSet.add(id);
      } else {
        return new Set([id]);
      }
      return newSet;
    });
  }, []);

  /**
   * Deselect an entity
   */
  const deselectEntity = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  /**
   * Toggle selection
   */
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Select all entities
   */
  const selectAll = useCallback((entityIds: string[]) => {
    setSelectedIds(new Set(entityIds));
  }, []);

  /**
   * Start box selection
   */
  const startBoxSelection = useCallback((start: THREE.Vector2) => {
    selectionBoxRef.current = { start, end: start };
    setIsMultiSelectMode(true);
  }, []);

  /**
   * Update box selection
   */
  const updateBoxSelection = useCallback((end: THREE.Vector2) => {
    if (selectionBoxRef.current) {
      selectionBoxRef.current.end = end;
    }
  }, []);

  /**
   * End box selection and select entities in box
   */
  const endBoxSelection = useCallback((entities: SelectableEntity[], camera: THREE.Camera) => {
    if (!selectionBoxRef.current) return;

    const { start, end } = selectionBoxRef.current;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const selected: string[] = [];

    entities.forEach((entity) => {
      const vector = new THREE.Vector3();
      entity.object.getWorldPosition(vector);
      vector.project(camera);

      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        selected.push(entity.id);
      }
    });

    setSelectedIds(new Set(selected));
    setIsMultiSelectMode(false);
    selectionBoxRef.current = null;
  }, []);

  /**
   * Bulk operations
   */
  const bulkDelete = useCallback((entities: SelectableEntity[], onDelete: (id: string) => void) => {
    selectedIds.forEach((id) => {
      onDelete(id);
    });
    clearSelection();
  }, [selectedIds, clearSelection]);

  const bulkMove = useCallback((delta: THREE.Vector3) => {
    // This would be handled by the placement system
    // Just return the delta for the caller to apply
    return delta;
  }, []);

  const bulkRotate = useCallback((angle: number) => {
    // Return rotation angle for caller to apply
    return angle;
  }, []);

  const bulkScale = useCallback((factor: number) => {
    // Return scale factor for caller to apply
    return factor;
  }, []);

  return {
    selectedIds,
    isMultiSelectMode,
    selectionBox: selectionBoxRef.current,
    selectEntity,
    deselectEntity,
    toggleSelection,
    clearSelection,
    selectAll,
    startBoxSelection,
    updateBoxSelection,
    endBoxSelection,
    bulkDelete,
    bulkMove,
    bulkRotate,
    bulkScale,
  };
}
