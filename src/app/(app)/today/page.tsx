'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './today.module.css';
import InteractiveCheckbox from '@/components/ui/InteractiveCheckbox';
import PresetSyncModal from '@/components/ui/PresetSyncModal';
import {
  getDayPlan,
  saveDayPlan,
  getPresets,
  mergePresetIntoDayPlan,
  generateId,
  type DayPlan,
  type DayPlanItem,
  type PresetId,
} from '@/lib/presets';

function formatTime(time: string | undefined): string {
  if (!time) return '--:--';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minutes || '00').padStart(2, '0')} ${ampm}`;
}

function getTodayDateString(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function TodayPage() {
  const [mounted, setMounted] = useState(false);
  const [dayPlan, setDayPlan] = useState<DayPlan>({
    date: getTodayDateString(),
    activePresetId: null,
    presetUpdatedAt: null,
    items: [],
    archived: [],
    isSealed: false,
  });
  const [presets, setPresets] = useState<Record<PresetId, any>>({});
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [pendingPresetId, setPendingPresetId] = useState<PresetId | null>(null);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskText, setTaskText] = useState('');

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load day plan and presets on mount
  useEffect(() => {
    if (!mounted) return;
    
    const today = getTodayDateString();
    const plan = getDayPlan(today);
    const loadedPresets = getPresets();
    setPresets(loadedPresets);
    
    // If no plan exists OR items.length === 0, initialize from preset
    if (plan.items.length === 0) {
      // Choose activePresetId: use stored if present, else default to first preset
      const activePresetId = plan.activePresetId || 
        (Object.keys(loadedPresets).length > 0 ? Object.keys(loadedPresets)[0] : null);
      
      if (activePresetId && loadedPresets[activePresetId]) {
        const preset = loadedPresets[activePresetId];
        const emptyPlan: DayPlan = {
          date: today,
          activePresetId: null,
          presetUpdatedAt: null,
          items: [],
          archived: [],
          isSealed: false,
        };
        
        // Merge preset into empty plan
        const merged = mergePresetIntoDayPlan(preset, emptyPlan, {
          keepCompletion: true,
          keepManual: true,
        });
        
        // Update activePresetId
        merged.activePresetId = activePresetId;
        
        setDayPlan(merged);
        saveDayPlan(merged);
      } else {
        // No presets available, just set the plan
        setDayPlan(plan);
      }
    } else {
      // Plan exists with items, just load it
      setDayPlan(plan);
    }
  }, [mounted]);

  // Save day plan whenever it changes
  const updateDayPlan = (updater: (plan: DayPlan) => DayPlan) => {
    if (dayPlan.isSealed) return; // Don't allow changes when sealed
    
    const updated = updater(dayPlan);
    setDayPlan(updated);
    saveDayPlan(updated);
  };

  const habits = dayPlan.items.filter((item) => item.kind === 'habit');
  const tasks = dayPlan.items.filter((item) => item.kind === 'task');
  const activeHabits = habits.filter((h) => !h.completed).length;

  // Calculate operator score (preset-sourced items only)
  const operatorItems = useMemo(() => {
    return dayPlan.items.filter(
      (item) => item.source === 'preset' && (item.kind === 'habit' || item.kind === 'task')
    );
  }, [dayPlan.items]);

  const operatorTotal = operatorItems.length;
  const operatorDone = operatorItems.filter((item) => item.completed).length;
  const operatorPct = operatorTotal === 0 ? 0 : Math.round((operatorDone / operatorTotal) * 100);

  const getCurrentDate = () => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const toggleItem = (id: string) => {
    updateDayPlan((plan) => ({
      ...plan,
      items: plan.items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const addTask = () => {
    if (taskText.trim() && !dayPlan.isSealed) {
      updateDayPlan((plan) => ({
        ...plan,
        items: [
          ...plan.items,
          {
            id: generateId(),
            kind: 'task',
            text: taskText.trim(),
            time: taskTime || '00:00',
            completed: false,
            source: 'manual',
            presetId: null,
            presetItemId: null,
            userEdited: false,
            createdAt: Date.now(),
          },
        ],
      }));
      setTaskTime('');
      setTaskText('');
    }
  };

  const deleteItem = (id: string) => {
    updateDayPlan((plan) => ({
      ...plan,
      items: plan.items.filter((item) => item.id !== id),
    }));
  };

  const startEdit = (item: DayPlanItem) => {
    if (dayPlan.isSealed) return;
    setEditingItemId(item.id);
    setEditText(item.text);
    setEditTime(item.time || '');
  };

  const saveEdit = () => {
    if (!editingItemId) return;
    
    updateDayPlan((plan) => ({
      ...plan,
      items: plan.items.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              text: editText.trim(),
              time: item.kind === 'task' ? editTime : item.time,
              userEdited: true,
            }
          : item
      ),
    }));
    
    setEditingItemId(null);
    setEditText('');
    setEditTime('');
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditText('');
    setEditTime('');
  };

  const handlePresetSelect = (presetId: PresetId) => {
    if (dayPlan.isSealed) return;
    const preset = presets[presetId];
    if (preset) {
      // Set pending preset and open modal
      setPendingPresetId(presetId);
      setSyncModalOpen(true);
    }
  };

  const handleSyncConfirm = (options: { keepCompletion: boolean; keepManual: boolean }) => {
    if (!pendingPresetId) return;
    
    const preset = presets[pendingPresetId];
    if (!preset) {
      setSyncModalOpen(false);
      setPendingPresetId(null);
      return;
    }
    
    // Merge the selected preset into current day plan
    const merged = mergePresetIntoDayPlan(preset, dayPlan, options);
    
    // Update activePresetId to the selected preset
    merged.activePresetId = preset.id;
    
    setDayPlan(merged);
    saveDayPlan(merged);
    setSyncModalOpen(false);
    setPendingPresetId(null);
  };

  const handleSyncCancel = () => {
    setSyncModalOpen(false);
    setPendingPresetId(null);
  };

  const restoreArchivedItem = (item: DayPlanItem) => {
    updateDayPlan((plan) => ({
      ...plan,
      archived: plan.archived.filter((a) => a.id !== item.id),
      items: [
        ...plan.items,
        {
          ...item,
          source: 'manual', // Restore as manual so it won't get auto-archived
          presetId: null,
          presetItemId: null,
        },
      ],
    }));
  };

  // Get active preset for display (only after mount to avoid hydration mismatch)
  const activePreset = mounted && dayPlan.activePresetId ? presets[dayPlan.activePresetId] : null;
  const pendingPreset = mounted && pendingPresetId ? presets[pendingPresetId] : null;

  // Don't render preset-dependent UI until mounted
  if (!mounted) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Project 0.1</h1>
            <div className={styles.dateRow}>
              <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                <path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192z" />
              </svg>
              <span className={styles.dateText}>{getCurrentDate()}</span>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header Section */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Project 0.1</h1>
          <div className={styles.dateRow}>
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192z" />
            </svg>
            <span className={styles.dateText}>{getCurrentDate()}</span>
          </div>
        </div>

        {/* User Status Card */}
        <div className={styles.rankCard}>
          <div className={styles.rankHeader}>
            <span className={styles.rankLabel}>Current Rank</span>
            <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor" style={{ color: '#eab308' }}>
              <path d="M269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2c.5 99.2 41.3 280.7 213.6 363.2c16.7 8 36.1 8 52.8 0C454.7 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2L269.4 2.9zM256 175c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24s24-10.7 24-24V199c0-13.3-10.7-24-24-24zm32 224c0 17.7-14.3 32-32 32s-32-14.3-32-32v-32c0-17.7 14.3-32 32-32s32 14.3 32 32v32z" />
            </svg>
          </div>
          <div className={styles.rankTitleRow}>
            <span className={styles.rankTitle}>Recruit</span>
            <span className={styles.rankLevel}>Lvl 4</span>
          </div>
          <div className={styles.xpBar}>
            <div className={styles.xpFill} style={{ width: '75%' }}></div>
          </div>
          <div className={styles.xpText}>
            <span>750 / 1000 XP</span>
            <span>Next: Operator</span>
          </div>
        </div>
      </header>

      {/* Daily Status Card */}
      <section className={styles.statusSection}>
        <div className={styles.statusCard}>
          <div className={styles.statusGlow}></div>
          <div className={styles.statusHeader}>
            <div>
              <div className={styles.statusBadge}>
                <div className={styles.statusDot}></div>
                <span className={styles.statusText}>Status: Elite Day</span>
              </div>
              <p className={styles.statusSubtext}>Execution is optimal. Maintain trajectory.</p>
            </div>
            <div className={styles.sealBadge}>
              <div className={styles.sealDot}></div>
              <span className={styles.sealText}>
                {dayPlan.isSealed ? 'Day Sealed' : 'Day Not Sealed'}
              </span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            {/* Stat 1 */}
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Operator Score</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{operatorDone}/{operatorTotal}</span>
                <span className={styles.statPercent}>{operatorPct}%</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: `${operatorPct}%` }}></div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Streak</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>12</span>
                <span className={styles.statUnit}>Days</span>
              </div>
              <div className={styles.streakRow}>
                <svg className={styles.icon} viewBox="0 0 384 512" fill="currentColor" style={{ color: '#eab308' }}>
                  <path d="M153.6 29.9l16-21.3C173.6 3.2 180 0 186.7 0C198.4 0 208 9.6 208 21.3V43.5c0 8.7 3.5 17 9.7 23.1L278.4 96l-9.5 7.6c-2.1 1.7-3.3 4.2-3.3 6.9v64c0 5.5 4.5 10 10 10h80c5.5 0 10-4.5 10-10v-64c0-2.7-1.2-5.2-3.3-6.9l-9.5-7.6L350.3 66.6c6.2-6.1 9.7-14.4 9.7-23.1V21.3C360 9.6 369.6 0 381.3 0c6.7 0 13.1 3.2 17.1 8.6l16 21.3c6 8 9.4 17.5 9.4 27.1V384c0 70.7-57.3 128-128 128H128C57.3 512 0 454.7 0 384V57.7c0-9.6 3.4-19.1 9.4-27.1l16-21.3C29.5 3.2 35.9 0 42.7 0C54.4 0 64 9.6 64 21.3V43.5c0 8.7 3.5 17 9.7 23.1L134.4 96l-9.5 7.6c-2.1 1.7-3.3 4.2-3.3 6.9v64c0 5.5 4.5 10 10 10h80c5.5 0 10-4.5 10-10v-64c0-2.7-1.2-5.2-3.3-6.9l-9.5-7.6L153.6 29.9z" />
                </svg>
                <span className={styles.streakText}>Unbroken</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Total Score</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>850</span>
                <span className={styles.statUnit}>pts</span>
              </div>
              <div className={styles.scoreNote}>Habits + Tasks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Preset Selector */}
      {Object.keys(presets).length > 0 && (
        <section className={styles.presetSection}>
          <div className={styles.presetSelector}>
            {Object.values(presets).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`${styles.presetPill} ${dayPlan.activePresetId === preset.id ? styles.presetPillActive : ''}`}
                onClick={() => handlePresetSelect(preset.id)}
                disabled={dayPlan.isSealed}
                title={dayPlan.isSealed ? 'Day is sealed' : `Switch to ${preset.name}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          {activePreset && (
            <button
              type="button"
              className={styles.syncButton}
              onClick={() => {
                setPendingPresetId(dayPlan.activePresetId!);
                setSyncModalOpen(true);
              }}
              disabled={dayPlan.isSealed}
              title={dayPlan.isSealed ? 'Day is sealed' : 'Sync from preset'}
            >
              Sync from Preset
            </button>
          )}
        </section>
      )}

      <div className={styles.grid}>
        {/* Habits Section */}
        <section className={styles.habitsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Habits</h2>
            <span className={styles.sectionBadge}>{activeHabits} Active</span>
          </div>

          <div className={styles.habitsList}>
            {habits.map((habit) => (
              <label key={habit.id} className={styles.habitItem}>
                <InteractiveCheckbox
                  checked={habit.completed}
                  onChange={() => toggleItem(habit.id)}
                  label={`Toggle ${habit.text}`}
                  id={`habit-${habit.id}`}
                  noLabel={true}
                  disabled={dayPlan.isSealed}
                />
                <div className={`${styles.habitContent} ${habit.completed ? styles.habitCompleted : ''}`}>
                  {editingItemId === habit.id ? (
                    <input
                      type="text"
                      className={styles.editInput}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={styles.habitName}
                      onDoubleClick={() => startEdit(habit)}
                      title={dayPlan.isSealed ? '' : 'Double-click to edit'}
                    >
                      {habit.text}
                    </span>
                  )}
                  {habit.completed && (
                    <div className={styles.habitDoneBadge}>
                      <span>DONE</span>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Tasks Section */}
        <section className={styles.tasksSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tasks</h2>
          </div>

          {/* Add Task Input */}
          {!dayPlan.isSealed && (
            <div className={styles.taskInput}>
              <input
                type="text"
                placeholder="00:00"
                className={styles.taskTimeInput}
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
              />
              <div className={styles.taskDivider}></div>
              <input
                type="text"
                placeholder="Add a new task..."
                className={styles.taskTextInput}
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTask();
                  }
                }}
              />
              <button
                type="button"
                className={styles.taskAddButton}
                onClick={addTask}
                aria-label="Add task"
              >
                <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
                </svg>
              </button>
            </div>
          )}

          {/* Task List */}
          <div className={styles.tasksList}>
            {tasks.map((task) => (
              <div
                key={task.id}
                role="button"
                tabIndex={editingItemId === task.id ? -1 : 0}
                aria-pressed={task.completed}
                aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''} ${editingItemId === task.id ? styles.taskItemEditing : ''}`}
                onClick={() => {
                  if (editingItemId !== task.id && !dayPlan.isSealed) {
                    toggleItem(task.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (editingItemId === task.id || dayPlan.isSealed) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleItem(task.id);
                  }
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <InteractiveCheckbox
                    checked={task.completed}
                    onChange={() => toggleItem(task.id)}
                    label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                    id={`task-${task.id}`}
                    disabled={dayPlan.isSealed}
                  />
                </div>
                {editingItemId === task.id ? (
                  <>
                    <input
                      type="text"
                      placeholder="00:00"
                      className={styles.editTimeInput}
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      className={styles.editTextInput}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </>
                ) : (
                  <>
                    <span className={styles.taskTime}>{formatTime(task.time)}</span>
                    <span
                      className={styles.taskText}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(task);
                      }}
                      title={dayPlan.isSealed ? '' : 'Double-click to edit'}
                    >
                      {task.text}
                    </span>
                  </>
                )}
                {!dayPlan.isSealed && (
                  <button
                    type="button"
                    className={styles.taskDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(task.id);
                    }}
                    aria-label="Delete task"
                  >
                    <svg className={styles.icon} viewBox="0 0 384 512" fill="currentColor">
                      <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Archived Section */}
      {dayPlan.archived.length > 0 && (
        <section className={styles.archivedSection}>
          <button
            type="button"
            className={styles.archivedHeader}
            onClick={() => setArchivedExpanded(!archivedExpanded)}
          >
            <h2 className={styles.archivedTitle}>Archived ({dayPlan.archived.length})</h2>
            <svg
              className={`${styles.archivedIcon} ${archivedExpanded ? styles.archivedIconExpanded : ''}`}
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path d="M201.4 342.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 274.7 86.6 137.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
            </svg>
          </button>
          {archivedExpanded && (
            <div className={styles.archivedList}>
              {dayPlan.archived.map((item) => (
                <div key={item.id} className={styles.archivedItem}>
                  <span className={styles.archivedText}>
                    {item.kind === 'task' && item.time && `${formatTime(item.time)} `}
                    {item.text}
                  </span>
                  {!dayPlan.isSealed && (
                    <button
                      type="button"
                      className={styles.restoreButton}
                      onClick={() => restoreArchivedItem(item)}
                      aria-label="Restore item"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sync Modal */}
      {pendingPreset && (
        <PresetSyncModal
          isOpen={syncModalOpen}
          presetName={pendingPreset.name}
          onConfirm={handleSyncConfirm}
          onCancel={handleSyncCancel}
        />
      )}

      {/* Footer / Quote */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Discipline is destiny.&quot;</p>
      </div>
    </div>
  );
}
