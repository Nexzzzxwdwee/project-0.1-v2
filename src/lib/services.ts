/**
 * Service functions — business logic extracted from page components.
 */

import {
  getPresets,
  savePresets,
  setActivePresetId,
  getDayPlan,
  saveDayPlan,
  saveDaySummary,
  getStreak,
  getUserProgress,
  saveUserProgress,
  updateUserProgress,
  mergePresetIntoDayPlan,
  generateId,
  normalizeText,
  getTodayDateString,
  type DayPlan,
  type DaySummary,
  type DayStatus,
  type Preset,
  type PresetId,
  type PresetItem,
  type UserProgress,
  createDefaultUserProgress,
} from './presets';
import { computeRankFields } from './ranks';

// ---------------------------------------------------------------------------
// Seal Day
// ---------------------------------------------------------------------------

export interface SealDayResult {
  updatedPlan: DayPlan;
  summary: DaySummary;
  streak: number;
}

/**
 * Seal the current day: compute metrics, persist summary, update XP & streak.
 * Returns the updated plan, summary, and new streak value.
 */
export async function sealDay(dayPlan: DayPlan): Promise<SealDayResult> {
  const today = getTodayDateString();

  const updatedPlan: DayPlan = { ...dayPlan, isSealed: true };

  // Operator metrics (preset habits only)
  const operatorHabits = dayPlan.items.filter(
    (item) => item.source === 'preset' && item.kind === 'habit'
  );
  const operatorTotal = operatorHabits.length;
  const operatorDone = operatorHabits.filter((i) => i.completed).length;
  const operatorPct =
    operatorTotal === 0 ? 0 : Math.round((operatorDone / operatorTotal) * 100);

  // Total score metrics
  const habits = dayPlan.items.filter((i) => i.kind === 'habit');
  const tasks = dayPlan.items.filter((i) => i.kind === 'task');
  const habitsTotal = habits.length;
  const habitsDone = habits.filter((h) => h.completed).length;
  const habitsPct =
    habitsTotal === 0 ? 0 : Math.round((habitsDone / habitsTotal) * 100);
  const tasksTotal = tasks.length;
  const tasksDone = tasks.filter((t) => t.completed).length;
  const tasksDenominator = Math.min(tasksTotal, 2);
  const tasksNumerator = Math.min(tasksDone, 2);
  const tasksPctCapped =
    tasksDenominator === 0
      ? 0
      : Math.round((tasksNumerator / tasksDenominator) * 100);
  const totalScorePct = Math.round(habitsPct * 0.7 + tasksPctCapped * 0.3);

  // Status
  let status: DayStatus;
  if (operatorPct === 100) status = 'Unbroken';
  else if (operatorPct >= 70) status = 'Elite';
  else if (operatorPct >= 1) status = 'Strong';
  else status = 'Building';

  const xpEarned = totalScorePct;

  const summary: DaySummary = {
    date: today,
    operatorPct,
    operatorTotal,
    operatorDone,
    isSealed: true,
    sealedAt: Date.now(),
    totalScorePct,
    habitsPct,
    tasksPctCapped,
    habitsTotal,
    habitsDone,
    tasksTotal,
    tasksDone,
    status,
    xpEarned,
  };

  await saveDaySummary(summary);
  await saveDayPlan(updatedPlan);

  const streak = await getStreak();

  await updateUserProgress((prev) => {
    const newXp = prev.xp + xpEarned;
    const { rank, xpToNext } = computeRankFields(newXp);
    return {
      ...prev,
      xp: newXp,
      rank,
      xpToNext,
      lastSealedDate: today,
      bestStreak: Math.max(prev.bestStreak, streak),
      currentStreak: streak,
      updatedAt: Date.now(),
    };
  });

  return { updatedPlan, summary, streak };
}

// ---------------------------------------------------------------------------
// Onboarding Initialization
// ---------------------------------------------------------------------------

export interface OnboardingInput {
  habitTexts: string[];
  taskTexts: string[];
}

/**
 * Create (or update) the default preset from onboarding input,
 * initialize today's day plan, and ensure user progress exists.
 * Returns the preset ID used.
 */
export async function initializeFromOnboarding(
  input: OnboardingInput
): Promise<PresetId> {
  const habits: PresetItem[] = input.habitTexts
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((text) => ({ id: generateId(), text }));

  const tasks: PresetItem[] = input.taskTexts
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((text) => ({ id: generateId(), text }));

  if (habits.length === 0 && tasks.length === 0) {
    throw new Error('Please add at least one habit or task.');
  }

  const allPresets = await getPresets();
  const presetId: PresetId = 'default';
  const presetName = 'Default';

  if (allPresets[presetId]) {
    const existing = allPresets[presetId];
    allPresets[presetId] = {
      ...existing,
      name: presetName,
      habits: habits.map((h) => {
        const match = existing.habits.find(
          (eh) => normalizeText(eh.text) === normalizeText(h.text)
        );
        return match || h;
      }),
      tasks: tasks.map((t) => {
        const match = existing.tasks.find(
          (et) => normalizeText(et.text) === normalizeText(t.text)
        );
        return match || t;
      }),
      updatedAt: Date.now(),
    };
  } else {
    allPresets[presetId] = {
      id: presetId,
      name: presetName,
      habits,
      tasks,
      updatedAt: Date.now(),
    };
  }

  await savePresets(allPresets);
  await setActivePresetId(presetId);

  // Initialize today's day plan
  const today = getTodayDateString();
  const emptyPlan: DayPlan = {
    date: today,
    activePresetId: null,
    presetUpdatedAt: null,
    items: [],
    archived: [],
    isSealed: false,
  };

  const merged = mergePresetIntoDayPlan(allPresets[presetId], emptyPlan, {
    keepCompletion: false,
    keepManual: true,
  });
  merged.activePresetId = presetId;
  await saveDayPlan(merged);

  // Ensure user progress exists
  const existing = await getUserProgress();
  if (!existing) {
    await saveUserProgress(createDefaultUserProgress());
  }

  return presetId;
}

// ---------------------------------------------------------------------------
// Commit Preset (habits page auto-save)
// ---------------------------------------------------------------------------

interface HabitInput {
  id: string;
  name: string;
}

interface TaskInput {
  id: string;
  text: string;
  time: string;
}

/**
 * Persist edited habits/tasks back to the preset in storage.
 * Returns the updated presets record, or null if the save was skipped
 * (empty guard to prevent overwriting server data with empty local state).
 */
export async function commitPreset(
  presetId: PresetId,
  habits: HabitInput[],
  tasks: TaskInput[]
): Promise<Record<PresetId, Preset> | null> {
  const allPresets = await getPresets();
  if (Object.keys(allPresets).length === 0) return null;
  if (!allPresets[presetId]) return null;

  const current = allPresets[presetId];

  // Guard: never overwrite non-empty preset with empty state
  if (
    habits.length === 0 &&
    tasks.length === 0 &&
    ((current.habits?.length || 0) > 0 || (current.tasks?.length || 0) > 0)
  ) {
    return null;
  }

  const updatedPreset: Preset = {
    ...current,
    habits: habits.map((h) => {
      const original = current.habits.find((o) => o.id === h.id);
      return { ...(original || {}), id: h.id, text: h.name };
    }),
    tasks: tasks.map((t) => {
      const original = current.tasks.find((o) => o.id === t.id);
      return { ...(original || {}), id: t.id, text: t.text, time: t.time };
    }),
    updatedAt: Date.now(),
  };

  const updatedPresets = { ...allPresets, [presetId]: updatedPreset };
  await savePresets(updatedPresets);
  return updatedPresets;
}
