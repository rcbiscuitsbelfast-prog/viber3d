import { create } from 'zustand';
import { Quest, Entity, Task, Trigger, Reward } from '../types/quest.types';
import * as THREE from 'three';

interface BuilderState {
  // Current quest being edited
  currentQuest: Quest | null;
  
  // Selection state
  selectedEntityId: string | null;
  
  // UI state
  isDirty: boolean;
  lastSaved: number | null;
  isAutoSaving: boolean;
  
  // View state
  viewMode: 'edit' | 'preview';
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // History for undo/redo
  history: Quest[];
  historyIndex: number;
  maxHistoryLength: number;
}

interface BuilderActions {
  // Quest management
  createNewQuest: () => void;
  loadQuest: (quest: Quest) => void;
  saveQuest: () => Promise<void>;
  updateQuestMeta: (updates: Partial<Pick<Quest, 'title' | 'templateWorld' | 'gameplayStyle'>>) => void;
  
  // Entity management
  addEntity: (entity: Omit<Entity, 'id'>) => string;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  selectEntity: (id: string | null) => void;
  duplicateEntity: (id: string) => void;
  
  // Task management
  addTask: (task: Omit<Task, 'id'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  
  // Trigger management
  addTrigger: (trigger: Omit<Trigger, 'id'>) => string;
  updateTrigger: (id: string, updates: Partial<Trigger>) => void;
  deleteTrigger: (id: string) => void;
  
  // Reward management
  updateReward: (reward: Reward) => void;
  
  // View controls
  setViewMode: (mode: 'edit' | 'preview') => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  // State management
  markDirty: () => void;
  markClean: () => void;
  resetBuilder: () => void;
}

type BuilderStore = BuilderState & BuilderActions;

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createEmptyQuest = (): Quest => ({
  id: generateId(),
  ownerId: 'temp-owner',
  title: 'Untitled Quest',
  templateWorld: 'forest',
  gameplayStyle: 'mixed',
  createdAt: Date.now(),
  expiresAt: null,
  isPremium: false,
  environment: {
    seed: Math.random() * 1000000,
    spawnPoint: new THREE.Vector3(0, 1, 0),
    ambientLight: {
      color: '#ffffff',
      intensity: 0.6,
    },
    directionalLight: {
      color: '#ffffff',
      intensity: 0.8,
      position: new THREE.Vector3(10, 20, 10),
    },
  },
  entities: [],
  tasks: [],
  triggers: [],
  reward: {
    type: 'text',
    payloadText: 'Congratulations! You completed the quest!',
    revealStyle: 'chest',
    title: 'Quest Complete!',
  },
  limits: {
    maxRecipients: 100,
  },
  analytics: {
    plays: 0,
    completions: 0,
  },
});

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  // Initial State
  currentQuest: null,
  selectedEntityId: null,
  isDirty: false,
  lastSaved: null,
  isAutoSaving: false,
  viewMode: 'edit',
  showGrid: true,
  snapToGrid: true,
  gridSize: 1,
  history: [],
  historyIndex: -1,
  maxHistoryLength: 50,

  // Quest management
  createNewQuest: () => {
    const newQuest = createEmptyQuest();
    set({
      currentQuest: newQuest,
      selectedEntityId: null,
      isDirty: false,
      lastSaved: null,
      history: [newQuest],
      historyIndex: 0,
    });
  },

  loadQuest: (quest) => {
    set({
      currentQuest: quest,
      selectedEntityId: null,
      isDirty: false,
      lastSaved: Date.now(),
      history: [quest],
      historyIndex: 0,
    });
  },

  saveQuest: async () => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({ isAutoSaving: true });

    try {
      // Save to localStorage
      localStorage.setItem(`quest-${currentQuest.id}`, JSON.stringify(currentQuest));
      
      // TODO: Save to backend/Firebase here
      
      set({
        lastSaved: Date.now(),
        isDirty: false,
        isAutoSaving: false,
      });
    } catch (error) {
      console.error('Failed to save quest:', error);
      set({ isAutoSaving: false });
    }
  },

  updateQuestMeta: (updates) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: { ...currentQuest, ...updates },
    });
    get().markDirty();
    get().pushHistory();
  },

  // Entity management
  addEntity: (entity) => {
    const { currentQuest } = get();
    if (!currentQuest) return '';

    const newEntity: Entity = {
      ...entity,
      id: generateId(),
    };

    set({
      currentQuest: {
        ...currentQuest,
        entities: [...currentQuest.entities, newEntity],
      },
      selectedEntityId: newEntity.id,
    });
    
    get().markDirty();
    get().pushHistory();
    return newEntity.id;
  },

  updateEntity: (id, updates) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        entities: currentQuest.entities.map((entity) =>
          entity.id === id ? { ...entity, ...updates } : entity
        ),
      },
    });
    
    get().markDirty();
  },

  deleteEntity: (id) => {
    const { currentQuest, selectedEntityId } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        entities: currentQuest.entities.filter((entity) => entity.id !== id),
      },
      selectedEntityId: selectedEntityId === id ? null : selectedEntityId,
    });
    
    get().markDirty();
    get().pushHistory();
  },

  selectEntity: (id) => {
    set({ selectedEntityId: id });
  },

  duplicateEntity: (id) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    const entity = currentQuest.entities.find((e) => e.id === id);
    if (!entity) return;

    const newEntity: Entity = {
      ...entity,
      id: generateId(),
      position: new THREE.Vector3(
        entity.position.x + 2,
        entity.position.y,
        entity.position.z + 2
      ),
    };

    set({
      currentQuest: {
        ...currentQuest,
        entities: [...currentQuest.entities, newEntity],
      },
      selectedEntityId: newEntity.id,
    });
    
    get().markDirty();
    get().pushHistory();
  },

  // Task management
  addTask: (task) => {
    const { currentQuest } = get();
    if (!currentQuest) return '';

    const newTask: Task = {
      ...task,
      id: generateId(),
    };

    set({
      currentQuest: {
        ...currentQuest,
        tasks: [...currentQuest.tasks, newTask],
      },
    });
    
    get().markDirty();
    get().pushHistory();
    return newTask.id;
  },

  updateTask: (id, updates) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        tasks: currentQuest.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      },
    });
    
    get().markDirty();
  },

  deleteTask: (id) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        tasks: currentQuest.tasks.filter((task) => task.id !== id),
      },
    });
    
    get().markDirty();
    get().pushHistory();
  },

  reorderTasks: (taskIds) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    const taskMap = new Map(currentQuest.tasks.map((t) => [t.id, t]));
    const reorderedTasks = taskIds
      .map((id) => taskMap.get(id))
      .filter((t): t is Task => t !== undefined)
      .map((task, index) => ({ ...task, order: index }));

    set({
      currentQuest: {
        ...currentQuest,
        tasks: reorderedTasks,
      },
    });
    
    get().markDirty();
    get().pushHistory();
  },

  // Trigger management
  addTrigger: (trigger) => {
    const { currentQuest } = get();
    if (!currentQuest) return '';

    const newTrigger: Trigger = {
      ...trigger,
      id: generateId(),
    };

    set({
      currentQuest: {
        ...currentQuest,
        triggers: [...currentQuest.triggers, newTrigger],
      },
    });
    
    get().markDirty();
    get().pushHistory();
    return newTrigger.id;
  },

  updateTrigger: (id, updates) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        triggers: currentQuest.triggers.map((trigger) =>
          trigger.id === id ? { ...trigger, ...updates } : trigger
        ),
      },
    });
    
    get().markDirty();
  },

  deleteTrigger: (id) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        triggers: currentQuest.triggers.filter((trigger) => trigger.id !== id),
      },
    });
    
    get().markDirty();
    get().pushHistory();
  },

  // Reward management
  updateReward: (reward) => {
    const { currentQuest } = get();
    if (!currentQuest) return;

    set({
      currentQuest: {
        ...currentQuest,
        reward,
      },
    });
    
    get().markDirty();
    get().pushHistory();
  },

  // View controls
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  setGridSize: (size) => {
    set({ gridSize: size });
  },

  // History
  pushHistory: () => {
    const { currentQuest, history, historyIndex, maxHistoryLength } = get();
    if (!currentQuest) return;

    // Remove any history after current index (for redo)
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add current state to history
    newHistory.push(JSON.parse(JSON.stringify(currentQuest)));
    
    // Limit history length
    if (newHistory.length > maxHistoryLength) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    set({
      currentQuest: JSON.parse(JSON.stringify(history[newIndex])),
      historyIndex: newIndex,
    });
    get().markDirty();
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    set({
      currentQuest: JSON.parse(JSON.stringify(history[newIndex])),
      historyIndex: newIndex,
    });
    get().markDirty();
  },

  // State management
  markDirty: () => {
    set({ isDirty: true });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  resetBuilder: () => {
    set({
      currentQuest: null,
      selectedEntityId: null,
      isDirty: false,
      lastSaved: null,
      isAutoSaving: false,
      viewMode: 'edit',
      history: [],
      historyIndex: -1,
    });
  },
}));

// Selector hooks
export const useCurrentBuilderQuest = () => useBuilderStore((state) => state.currentQuest);
export const useSelectedEntity = () => {
  const quest = useBuilderStore((state) => state.currentQuest);
  const selectedId = useBuilderStore((state) => state.selectedEntityId);
  return quest?.entities.find((e) => e.id === selectedId) || null;
};
export const useBuilderActions = () => useBuilderStore((state) => ({
  createNewQuest: state.createNewQuest,
  loadQuest: state.loadQuest,
  saveQuest: state.saveQuest,
  updateQuestMeta: state.updateQuestMeta,
  addEntity: state.addEntity,
  updateEntity: state.updateEntity,
  deleteEntity: state.deleteEntity,
  selectEntity: state.selectEntity,
  duplicateEntity: state.duplicateEntity,
  addTask: state.addTask,
  updateTask: state.updateTask,
  deleteTask: state.deleteTask,
  reorderTasks: state.reorderTasks,
  addTrigger: state.addTrigger,
  updateTrigger: state.updateTrigger,
  deleteTrigger: state.deleteTrigger,
  updateReward: state.updateReward,
  setViewMode: state.setViewMode,
  toggleGrid: state.toggleGrid,
  toggleSnapToGrid: state.toggleSnapToGrid,
  undo: state.undo,
  redo: state.redo,
}));
