/**
 * UndoRedoManager - State management for undo/redo functionality
 * Phase 4.2 - Builder UI Enhancements
 */

import type { WorldState } from '../world/WorldExporter';

export interface HistoryState {
  state: WorldState;
  timestamp: number;
  description?: string;
}

export class UndoRedoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  /**
   * Add a new state to history
   */
  pushState(state: WorldState, description?: string): void {
    // Remove any states after current index (when undoing then making new changes)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.history.push({
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      timestamp: Date.now(),
      description,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex = this.history.length - 1;
    }
  }

  /**
   * Undo - go back one state
   */
  undo(): WorldState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return this.getCurrentState();
  }

  /**
   * Redo - go forward one state
   */
  redo(): WorldState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return this.getCurrentState();
  }

  /**
   * Get current state
   */
  getCurrentState(): WorldState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex].state)); // Deep clone
    }
    return null;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Get history info
   */
  getHistoryInfo(): { total: number; current: number; canUndo: boolean; canRedo: boolean } {
    return {
      total: this.history.length,
      current: this.currentIndex + 1,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }
}
