/**
 * Preset and Day Plan management utilities
 */

import { P01_PREFIX, getJSON, setJSON, listKeys } from './p01Storage';

export type PresetId = string; // 'default' | 'trading' | 'recovery' but allow any string

export interface PresetItem {
  id: string; // Stable presetItemId
  text: string;
  time?: string; // For tasks only
}

export interface Preset {
  id: PresetId;
  name: string;
  habits: PresetItem[];
  tasks: PresetItem[];
  updatedAt: number; // Timestamp when preset was last modified
}

export interface DayPlanItem {
  id: string; // Stable ID
  kind: 'habit' | 'task';
  text: string;
  time?: string; // For tasks only
  completed: boolean;
  source: 'preset' | 'manual';
  presetId: PresetId | null;
  presetItemId: string | null; // Stable ID from preset for matching
  userEdited: boolean; // true if user manually edited text/time
  createdAt: number; // Timestamp when item was created
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  activePresetId: PresetId | null;
  presetUpdatedAt: number | null; // Last applied preset.updatedAt
  items: DayPlanItem[];
  archived: DayPlanItem[]; // Items removed from preset
  isSealed: boolean;
}

export type DayStatus = 'Building' | 'Strong' | 'Elite' | 'Unbroken';

export interface DaySummary {
  date: string; // YYYY-MM-DD
  operatorPct: number; // 0-100 (habits only)
  operatorTotal: number;
  operatorDone: number;
  isSealed: boolean;
  sealedAt: number | null;
  // Total Score fields (0-100 integers)
  totalScorePct: number; // 0-100
  habitsPct: number; // 0-100
  tasksPctCapped: number; // 0-100
  habitsTotal: number;
  habitsDone: number;
  tasksTotal: number;
  tasksDone: number;
  status: DayStatus;
  xpEarned: number; // Placeholder: equals totalScorePct
}

export interface UserProgress {
  xp: number; // Total accumulated XP
  rank: string; // Current rank name
  xpToNext: number; // XP needed for next rank
  bestStreak: number; // All-time best streak
  currentStreak: number; // Current active streak
  lastSealedDate: string | null; // YYYY-MM-DD of last sealed day
  updatedAt: number; // Timestamp
}

/**
 * Generate a stable ID
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalize text for matching (lowercase, trim, collapse spaces)
 */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Initialize presets from mock data structure
 * This is used when localStorage is empty
 */
function initializePresetsFromMock(): Record<PresetId, Preset> {
  const now = Date.now();
  return {
    default: {
      id: 'default',
      name: 'Default',
      habits: [
        { id: generateId(), text: 'morning sauna' },
        { id: generateId(), text: 'deep work block' },
        { id: generateId(), text: 'read 30 mins' },
        { id: generateId(), text: 'zero sugar' },
      ],
      tasks: [
        { id: generateId(), text: 'email client reports', time: '09:00' },
        { id: generateId(), text: 'team standup meeting', time: '14:00' },
        { id: generateId(), text: 'review quarterly goals', time: '16:30' },
      ],
      updatedAt: now,
    },
    trading: {
      id: 'trading',
      name: 'Trading Day',
      habits: [
        { id: generateId(), text: 'market prep' },
        { id: generateId(), text: 'trading journal' },
        { id: generateId(), text: 'no news check' },
      ],
      tasks: [
        { id: generateId(), text: 'pre-market analysis', time: '08:00' },
        { id: generateId(), text: 'trade review session', time: '15:00' },
      ],
      updatedAt: now,
    },
    recovery: {
      id: 'recovery',
      name: 'Recovery',
      habits: [
        { id: generateId(), text: 'light walk' },
        { id: generateId(), text: 'meditation' },
        { id: generateId(), text: 'early sleep' },
      ],
      tasks: [
        { id: generateId(), text: 'gentle yoga', time: '10:00' },
      ],
      updatedAt: now,
    },
  };
}

/**
 * Get all presets from localStorage
 * If missing, initialize from mock data
 */
export function getPresets(): Record<PresetId, Preset> {
  const presets = getJSON<Record<PresetId, Preset>>(
    `${P01_PREFIX}presets`,
    {}
  );
  
  // If empty, initialize from mock data
  if (Object.keys(presets).length === 0) {
    const initialized = initializePresetsFromMock();
    savePresets(initialized);
    return initialized;
  }
  
  // Ensure all preset items have IDs (only generate if missing - preserve existing IDs)
  const normalized: Record<PresetId, Preset> = {};
  for (const [id, preset] of Object.entries(presets)) {
    normalized[id] = {
      ...preset,
      habits: preset.habits.map((h) => {
        // Preserve existing ID - only generate if truly missing
        if (h.id && h.id.trim().length > 0) {
          return h; // Keep original object to preserve ID
        }
        return {
          ...h,
          id: generateId(),
        };
      }),
      tasks: preset.tasks.map((t) => {
        // Preserve existing ID - only generate if truly missing
        if (t.id && t.id.trim().length > 0) {
          return t; // Keep original object to preserve ID
        }
        return {
          ...t,
          id: generateId(),
        };
      }),
    };
  }
  
  return normalized;
}

/**
 * Save presets to localStorage
 */
export function savePresets(record: Record<PresetId, Preset>): void {
  setJSON(`${P01_PREFIX}presets`, record);
}

/**
 * Get day plan for a specific date
 */
export function getDayPlan(date: string): DayPlan {
  const plan = getJSON<DayPlan>(
    `${P01_PREFIX}dayplan:${date}`,
    {
      date,
      activePresetId: null,
      presetUpdatedAt: null,
      items: [],
      archived: [],
      isSealed: false,
    }
  );
  
  // Ensure date matches
  if (plan.date !== date) {
    return {
      date,
      activePresetId: null,
      presetUpdatedAt: null,
      items: [],
      archived: [],
      isSealed: false,
    };
  }
  
  return plan;
}

/**
 * Save day plan to localStorage
 */
export function saveDayPlan(plan: DayPlan): void {
  setJSON(`${P01_PREFIX}dayplan:${plan.date}`, plan);
}

/**
 * Get active preset ID from localStorage
 */
export function getActivePresetId(): PresetId | null {
  return getJSON<PresetId | null>(`${P01_PREFIX}activePresetId`, null);
}

/**
 * Set active preset ID in localStorage
 */
export function setActivePresetId(presetId: PresetId): void {
  setJSON(`${P01_PREFIX}activePresetId`, presetId);
}

/**
 * Generate a unique preset name with auto-suffix if duplicate exists
 */
export function generateUniquePresetName(
  baseName: string,
  existingPresets: Record<PresetId, Preset>
): string {
  const existingNames = Object.values(existingPresets).map((p) => p.name.toLowerCase());
  let candidate = baseName;
  let suffix = 1;

  while (existingNames.includes(candidate.toLowerCase())) {
    suffix++;
    candidate = `${baseName} (${suffix})`;
  }

  return candidate;
}

/**
 * Get all day plan dates that reference a specific preset
 */
export function getDayPlansReferencingPreset(presetId: PresetId): DayPlan[] {
  const dayPlanKeys = listKeys(`${P01_PREFIX}dayplan:`);
  const plans: DayPlan[] = [];

  for (const key of dayPlanKeys) {
    const plan = getJSON<DayPlan | null>(key, null);
    if (plan && plan.activePresetId === presetId) {
      plans.push(plan);
    }
  }

  return plans;
}

/**
 * Update activePresetId in all day plans that reference a deleted preset
 */
export function updateDayPlansPresetReference(
  oldPresetId: PresetId,
  newPresetId: PresetId
): void {
  const plans = getDayPlansReferencingPreset(oldPresetId);
  for (const plan of plans) {
    const updated = { ...plan, activePresetId: newPresetId };
    saveDayPlan(updated);
  }
}

/**
 * Merge preset into day plan
 */
export function mergePresetIntoDayPlan(
  preset: Preset,
  plan: DayPlan,
  options: { keepCompletion: boolean; keepManual: boolean }
): DayPlan {
  const { keepCompletion, keepManual } = options;
  
  // A) Build lookup of existing plan.items where source="preset"
  //    by presetItemId first, fallback to normalized text + kind
  const itemMap = new Map<string, DayPlanItem>();
  const textMap = new Map<string, DayPlanItem>(); // normalized text + kind -> item
  
  for (const item of plan.items) {
    if (item.source === 'preset') {
      if (item.presetItemId) {
        itemMap.set(item.presetItemId, item);
      }
      // Also index by normalized text for fallback matching
      const textKey = `${normalizeText(item.text)}|${item.kind}`;
      textMap.set(textKey, item);
    }
  }
  
  // B) Process each preset habit/task
  const newItems: DayPlanItem[] = [];
  const processedItemIds = new Set<string>();
  
  // Process habits
  for (const presetHabit of preset.habits) {
    let matchedItem: DayPlanItem | undefined;
    
    // Try to match by presetItemId first
    if (presetHabit.id && itemMap.has(presetHabit.id)) {
      matchedItem = itemMap.get(presetHabit.id);
    } else {
      // Fallback: match by normalized text + kind
      const textKey = `${normalizeText(presetHabit.text)}|habit`;
      matchedItem = textMap.get(textKey);
    }
    
    if (matchedItem) {
      // Update existing item
      processedItemIds.add(matchedItem.id);
      newItems.push({
        ...matchedItem,
        presetId: preset.id,
        presetItemId: presetHabit.id,
        completed: keepCompletion ? matchedItem.completed : false,
        text: matchedItem.userEdited ? matchedItem.text : presetHabit.text,
        // time doesn't apply to habits
      });
    } else {
      // Add new item
      newItems.push({
        id: generateId(),
        kind: 'habit',
        text: presetHabit.text,
        completed: false,
        source: 'preset',
        presetId: preset.id,
        presetItemId: presetHabit.id,
        userEdited: false,
        createdAt: Date.now(),
      });
    }
  }
  
  // Process tasks
  for (const presetTask of preset.tasks) {
    let matchedItem: DayPlanItem | undefined;
    
    // Try to match by presetItemId first
    if (presetTask.id && itemMap.has(presetTask.id)) {
      matchedItem = itemMap.get(presetTask.id);
    } else {
      // Fallback: match by normalized text + kind
      const textKey = `${normalizeText(presetTask.text)}|task`;
      matchedItem = textMap.get(textKey);
    }
    
    if (matchedItem) {
      // Update existing item
      processedItemIds.add(matchedItem.id);
      newItems.push({
        ...matchedItem,
        presetId: preset.id,
        presetItemId: presetTask.id,
        completed: keepCompletion ? matchedItem.completed : false,
        text: matchedItem.userEdited ? matchedItem.text : presetTask.text,
        time: matchedItem.userEdited ? matchedItem.time : presetTask.time,
      });
    } else {
      // Add new item
      newItems.push({
        id: generateId(),
        kind: 'task',
        text: presetTask.text,
        time: presetTask.time,
        completed: false,
        source: 'preset',
        presetId: preset.id,
        presetItemId: presetTask.id,
        userEdited: false,
        createdAt: Date.now(),
      });
    }
  }
  
  // C) Move items with source="preset" that are no longer in preset to archived
  const archived = [...plan.archived];
  for (const item of plan.items) {
    if (item.source === 'preset' && !processedItemIds.has(item.id)) {
      archived.push(item);
    }
  }
  
  // D) Keep manual items if keepManual=true
  if (keepManual) {
    for (const item of plan.items) {
      if (item.source === 'manual') {
        newItems.push(item);
      }
    }
  }
  
  // E) Update plan metadata
  return {
    ...plan,
    activePresetId: preset.id,
    presetUpdatedAt: preset.updatedAt,
    items: newItems,
    archived,
  };
}

/**
 * Add or subtract days from a YYYY-MM-DD date string
 */
function addDays(dateStr: string, delta: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get day summary for a specific date
 */
export function getDaySummary(date: string): DaySummary | null {
  return getJSON<DaySummary | null>(`${P01_PREFIX}daySummary:${date}`, null);
}

/**
 * Save day summary to localStorage
 */
export function saveDaySummary(summary: DaySummary): void {
  setJSON(`${P01_PREFIX}daySummary:${summary.date}`, summary);
}

/**
 * Calculate streak of consecutive sealed days with 100% operator score
 * Scans backward from today (or provided date)
 */
export function getStreak(today?: string): number {
  if (typeof window === 'undefined') return 0;
  
  const todayDate = today || (() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  })();
  
  let streak = 0;
  let currentDate = todayDate;
  
  while (true) {
    const summary = getDaySummary(currentDate);
    
    if (
      summary &&
      summary.isSealed &&
      summary.operatorTotal > 0 &&
      summary.operatorPct === 100
    ) {
      streak++;
      // Move to previous day
      currentDate = addDays(currentDate, -1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Get user progress from localStorage
 */
export function getUserProgress(): UserProgress | null {
  return getJSON<UserProgress | null>(`${P01_PREFIX}userProgress`, null);
}

/**
 * Save user progress to localStorage
 */
export function saveUserProgress(progress: UserProgress): void {
  setJSON(`${P01_PREFIX}userProgress`, progress);
}

/**
 * Update user progress using an updater function
 */
export function updateUserProgress(updater: (prev: UserProgress) => UserProgress): void {
  const current = getUserProgress();
  if (!current) {
    // Initialize with default values
    const defaultProgress: UserProgress = {
      xp: 0,
      rank: 'Novice',
      xpToNext: 100,
      bestStreak: 0,
      currentStreak: 0,
      lastSealedDate: null,
      updatedAt: Date.now(),
    };
    saveUserProgress(updater(defaultProgress));
  } else {
    saveUserProgress(updater(current));
  }
}

