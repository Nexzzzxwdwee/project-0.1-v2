/**
 * Preset and Day Plan management utilities
 */

import { P01_PREFIX, getJSON, setJSON, listKeys } from './p01Storage';
import { getStorage } from './storage';

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
  rankKey: string; // Current rank key
  xpToNext: number; // XP needed for next rank
  bestStreak: number; // All-time best streak
  currentStreak: number; // Current active streak
  lastSealedDate: string | null; // YYYY-MM-DD of last sealed day
  updatedAt: number; // Timestamp
  activePresetId?: PresetId | null; // Active preset ID (stored in user_progress for Supabase)
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
 * Get all presets from storage
 * If missing, initialize from mock data
 */
export async function getPresets(): Promise<Record<PresetId, Preset>> {
  const storage = getStorage();
  const presets = await storage.getPresets();
  
  // If empty, initialize from mock data
  if (Object.keys(presets).length === 0) {
    const initialized = initializePresetsFromMock();
    await savePresets(initialized);
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
 * Save presets to storage
 */
export async function savePresets(record: Record<PresetId, Preset>): Promise<void> {
  const storage = getStorage();
  await storage.savePresets(record);
}

/**
 * Get day plan for a specific date
 */
export async function getDayPlan(date: string): Promise<DayPlan> {
  const storage = getStorage();
  const plan = await storage.getDayPlan(date);
  
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
 * Save day plan to storage
 */
export async function saveDayPlan(plan: DayPlan): Promise<void> {
  const storage = getStorage();
  await storage.saveDayPlan(plan);
}

/**
 * Get active preset ID from storage
 */
export async function getActivePresetId(): Promise<PresetId | null> {
  const storage = getStorage();
  return await storage.getActivePresetId();
}

/**
 * Set active preset ID in storage
 */
export async function setActivePresetId(presetId: PresetId): Promise<void> {
  const storage = getStorage();
  await storage.setActivePresetId(presetId);
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
export async function getDayPlansReferencingPreset(presetId: PresetId): Promise<DayPlan[]> {
  const storage = getStorage();
  const dates = await storage.listDayPlanDates();
  const plans: DayPlan[] = [];

  for (const date of dates) {
    const plan = await storage.getDayPlan(date);
    if (plan.activePresetId === presetId) {
      plans.push(plan);
    }
  }

  return plans;
}

/**
 * Update activePresetId in all day plans that reference a deleted preset
 */
export async function updateDayPlansPresetReference(
  oldPresetId: PresetId,
  newPresetId: PresetId
): Promise<void> {
  const plans = await getDayPlansReferencingPreset(oldPresetId);
  for (const plan of plans) {
    const updated = { ...plan, activePresetId: newPresetId };
    await saveDayPlan(updated);
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
export async function getDaySummary(date: string): Promise<DaySummary | null> {
  const storage = getStorage();
  return await storage.getDaySummary(date);
}

/**
 * Save day summary to storage
 */
export async function saveDaySummary(summary: DaySummary): Promise<void> {
  const storage = getStorage();
  await storage.saveDaySummary(summary);
}

/**
 * Get all sealed day summaries (READ-ONLY)
 * Returns summaries sorted by date descending (newest first)
 */
export async function getAllSealedDaySummaries(): Promise<DaySummary[]> {
  if (typeof window === 'undefined') return [];
  
  const storage = getStorage();
  return await storage.getAllSealedDaySummaries();
}

/**
 * Calculate streak of consecutive sealed days with 100% operator score
 * Scans backward from today (or provided date)
 */
export async function getStreak(today?: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  
  const todayDate = today || (() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  })();
  
  let streak = 0;
  let currentDate = todayDate;
  
  while (true) {
    const summary = await getDaySummary(currentDate);
    
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
 * Get user progress from storage
 */
export async function getUserProgress(): Promise<UserProgress | null> {
  const storage = getStorage();
  return await storage.getUserProgress();
}

/**
 * Save user progress to storage
 */
export async function saveUserProgress(progress: UserProgress): Promise<void> {
  const storage = getStorage();
  await storage.saveUserProgress(progress);
}

/**
 * Update user progress using an updater function
 */
export async function updateUserProgress(updater: (prev: UserProgress) => UserProgress): Promise<void> {
  const storage = getStorage();
  await storage.updateUserProgress(updater);
}

