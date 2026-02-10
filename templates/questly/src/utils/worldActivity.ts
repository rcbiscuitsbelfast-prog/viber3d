export type WorldEventType = 'played' | 'deleted' | 'reported';

export interface WorldActivity {
  worldId: string;
  plays: number;
  lastPlayedAt?: number;
  deletedAt?: number;
  reportedAt?: number;
}

const ACTIVITY_KEY = 'questly_world_activity';

function loadActivityMap(): Record<string, WorldActivity> {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, WorldActivity>;
  } catch (error) {
    console.warn('[WorldActivity] Failed to parse activity map:', error);
    return {};
  }
}

function saveActivityMap(activity: Record<string, WorldActivity>) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
}

export function getWorldActivity(worldId: string): WorldActivity | null {
  const activity = loadActivityMap();
  return activity[worldId] || null;
}

export function recordWorldEvent(worldId: string, event: WorldEventType): WorldActivity {
  const activityMap = loadActivityMap();
  const current = activityMap[worldId] || { worldId, plays: 0 };

  if (event === 'played') {
    current.plays += 1;
    current.lastPlayedAt = Date.now();
  }
  if (event === 'deleted') {
    current.deletedAt = Date.now();
  }
  if (event === 'reported') {
    current.reportedAt = Date.now();
  }

  activityMap[worldId] = current;
  saveActivityMap(activityMap);
  return current;
}

export function listWorldActivity(): Record<string, WorldActivity> {
  return loadActivityMap();
}
