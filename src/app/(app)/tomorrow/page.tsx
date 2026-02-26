'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './tomorrow.module.css';
import TimePicker from '@/components/ui/TimePicker';
import {
  generateId,
  getActivePresetId,
  getDayPlan,
  getPresets,
  saveDayPlan,
  type DayPlan,
  type DayPlanItem,
} from '@/lib/presets';
import { onAuthReady } from '@/lib/supabase/browser';

const formatTime = (time: string | undefined): string => {
  if (!time) return '';
  const match12h = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12h) {
    const h = parseInt(match12h[1], 10);
    const m = parseInt(match12h[2], 10);
    const period = match12h[3].toUpperCase();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const hour12 = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const getTomorrowDateString = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLong = (dateString: string): string => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const extractTasks = (plan: DayPlan): DayPlanItem[] =>
  plan.items.filter((item) => item.kind === 'task');

const buildPlanWithTasks = (plan: DayPlan, tasks: DayPlanItem[]): DayPlan => {
  const nonTasks = plan.items.filter((item) => item.kind !== 'task');
  return {
    ...plan,
    items: [...nonTasks, ...tasks],
  };
};

export default function TomorrowPage() {
  const tomorrowDate = useMemo(() => getTomorrowDateString(), []);
  const [tasks, setTasks] = useState<DayPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskText, setTaskText] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');

  const planRef = useRef<DayPlan | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const setPlanState = useCallback((nextPlan: DayPlan) => {
    planRef.current = nextPlan;
    setTasks(extractTasks(nextPlan));
  }, []);

  const enqueueSave = useCallback((nextPlan: DayPlan) => {
    setSaving(true);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await saveDayPlan(nextPlan);
        } catch (saveError) {
          console.error('Failed to save tomorrow plan:', saveError);
          setError('Failed to save tasks. Please try again.');
        }
      })
      .finally(() => {
        setSaving(false);
      });
  }, []);

  const updateTasks = useCallback((updater: (prev: DayPlanItem[]) => DayPlanItem[]) => {
    setTasks((prev) => {
      const nextTasks = updater(prev);
      const currentPlan = planRef.current;
      if (currentPlan) {
        const nextPlan = buildPlanWithTasks(currentPlan, nextTasks);
        planRef.current = nextPlan;
        enqueueSave(nextPlan);
      }
      return nextTasks;
    });
  }, [enqueueSave]);

  const seedFromPreset = useCallback(async (existingPlan: DayPlan) => {
    const existingTasks = existingPlan.items.filter((item) => item.kind === 'task');
    const existingHabits = existingPlan.items.filter((item) => item.kind === 'habit');
    const needsTasks = existingTasks.length === 0;
    const needsHabits = existingHabits.length === 0;

    if (!needsTasks && !needsHabits) {
      return { plan: existingPlan, seeded: false };
    }

    const activePresetId = await getActivePresetId();
    if (!activePresetId) {
      return { plan: existingPlan, seeded: false };
    }

    const presets = await getPresets();
    const preset = presets[activePresetId];
    if (!preset) {
      return { plan: existingPlan, seeded: false };
    }

    const now = Date.now();
    const seededHabits: DayPlanItem[] = needsHabits
      ? preset.habits.map((habit) => ({
          id: generateId(),
          kind: 'habit',
          text: habit.text,
          completed: false,
          source: 'preset',
          presetId: preset.id,
          presetItemId: habit.id,
          userEdited: false,
          createdAt: now,
        }))
      : existingHabits;

    const seededTasks: DayPlanItem[] = needsTasks
      ? preset.tasks.map((task) => ({
          id: generateId(),
          kind: 'task',
          text: task.text,
          time: task.time || '',
          completed: false,
          source: 'preset',
          presetId: preset.id,
          presetItemId: task.id,
          userEdited: false,
          createdAt: now,
        }))
      : existingTasks;

    if (seededHabits.length === 0 && seededTasks.length === 0) {
      return { plan: existingPlan, seeded: false };
    }

    return {
      plan: {
        ...existingPlan,
        activePresetId: existingPlan.activePresetId ?? preset.id,
        presetUpdatedAt: preset.updatedAt,
        items: [...seededHabits, ...seededTasks],
      },
      seeded: true,
    };
  }, []);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    setEditingId(null);
    try {
      const existingPlan = await getDayPlan(tomorrowDate);
      const { plan: seededPlan, seeded } = await seedFromPreset(existingPlan);
      setPlanState(seededPlan);
      if (seeded) {
        enqueueSave(seededPlan);
      }
    } catch (loadError) {
      console.error('Failed to load tomorrow plan:', loadError);
      setError('Failed to load plan for tomorrow.');
    } finally {
      setLoading(false);
    }
  }, [enqueueSave, seedFromPreset, setPlanState, tomorrowDate]);

  useEffect(() => {
    loadData();
    const unsubscribe = onAuthReady(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  const handleAddTask = () => {
    const text = taskText.trim();
    if (!text || loading) return;
    const newTask: DayPlanItem = {
      id: generateId(),
      kind: 'task',
      text,
      time: taskTime || '',
      completed: false,
      source: 'manual',
      presetId: null,
      presetItemId: null,
      userEdited: false,
      createdAt: Date.now(),
    };
    updateTasks((prev) => [...prev, newTask]);
    setTaskText('');
    setTaskTime('');
  };

  const handleDeleteTask = (id: string) => {
    updateTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const startEdit = (task: DayPlanItem) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditTime(task.time ? formatTime(task.time) : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditTime('');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const nextText = editText.trim();
    if (!nextText) return;
    updateTasks((prev) =>
      prev.map((task) =>
        task.id === editingId
          ? {
              ...task,
              text: nextText,
              time: editTime,
              userEdited: true,
            }
          : task
      )
    );
    cancelEdit();
  };

  const longDate = formatDateLong(tomorrowDate);

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid}></div>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Tomorrow</h1>
            <p className={styles.subtitle}>Plan tasks for {longDate}</p>
            <p className={styles.subtleNote}>
              Habits carry over from your preset automatically.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.badge}>Tasks only</span>
            {saving && <span className={styles.saving}>Saving...</span>}
          </div>
        </header>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tasks</h2>

          <form
            className={styles.addForm}
            onSubmit={(event) => {
              event.preventDefault();
              handleAddTask();
            }}
          >
            <input
              className={styles.addInput}
              type="text"
              placeholder="Add a task for tomorrow"
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              disabled={loading}
            />
            <div className={styles.timeField}>
              <TimePicker
                value={taskTime}
                onChange={setTaskTime}
                className={styles.timePicker}
                placeholder="No time"
              />
              {taskTime && (
                <button
                  type="button"
                  className={styles.clearTimeButton}
                  onClick={() => setTaskTime('')}
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="submit"
              className={styles.addButton}
              disabled={loading || !taskText.trim()}
            >
              Add
            </button>
          </form>

          {loading && <div className={styles.loadingState}>Loading tasks...</div>}
          {!loading && tasks.length === 0 && (
            <div className={styles.emptyState}>No tasks planned yet.</div>
          )}

          {!loading && tasks.length > 0 && (
            <ul className={styles.taskList}>
              {tasks.map((task) => {
                const isEditing = editingId === task.id;
                return (
                  <li key={task.id} className={styles.taskCard}>
                    <div className={styles.taskMain}>
                      <span className={styles.taskText}>{task.text}</span>
                      <span className={styles.taskTime}>
                        {task.time ? formatTime(task.time) : 'No time'}
                      </span>
                    </div>
                    <div className={styles.taskActions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => startEdit(task)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>

                    {isEditing && (
                      <div className={styles.editRow}>
                        <input
                          className={styles.editInput}
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                        />
                        <div className={styles.editTimeField}>
                          <TimePicker
                            value={editTime}
                            onChange={setEditTime}
                            className={styles.editTimePicker}
                            placeholder="No time"
                          />
                          {editTime && (
                            <button
                              type="button"
                              className={styles.clearTimeButton}
                              onClick={() => setEditTime('')}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className={styles.editActions}>
                          <button
                            type="button"
                            className={styles.saveButton}
                            onClick={saveEdit}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
