'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './habits.module.css';
import {
  getPresets,
  savePresets,
  generateId,
  generateUniquePresetName,
  getDayPlansReferencingPreset,
  updateDayPlansPresetReference,
  getActivePresetId,
  setActivePresetId,
  type Preset,
  type PresetId,
} from '@/lib/presets';
import { commitPreset } from '@/lib/services';
import RenamePresetModal from '@/components/ui/RenamePresetModal';
import DeletePresetModal from '@/components/ui/DeletePresetModal';
import EditTaskModal from '@/components/ui/EditTaskModal';
import TimePicker from '@/components/ui/TimePicker';

interface Habit {
  id: string; // presetItemId
  name: string;
  completed: boolean; // UI only, not persisted in preset
}

interface Task {
  id: string; // presetItemId
  text: string;
  time: string; // HH:MM format
  completed: boolean; // UI only, not persisted in preset
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export default function HabitsPage() {
  const [presets, setPresets] = useState<Record<PresetId, Preset>>({});
  const [activePreset, setActivePreset] = useState<PresetId>('default');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newHabitInput, setNewHabitInput] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Refs to store latest habits/tasks/activePreset for commit function
  const habitsRef = useRef<Habit[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const activePresetRef = useRef<PresetId>(activePreset);
  
  // Keep refs in sync with state
  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);
  
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  
  useEffect(() => {
    activePresetRef.current = activePreset;
  }, [activePreset]);

  // Load presets on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Read activePresetId FIRST before calling getPresets() to avoid it initializing mock data
        const activePresetId = await getActivePresetId();
        const loadedPresets = await getPresets();
        setPresets(loadedPresets);
        
        const presetIds = Object.keys(loadedPresets);
        
        if (presetIds.length > 0) {
          let initialPreset: Preset | undefined;
          
          // ALWAYS prioritize activePresetId if it exists and preset exists
          // Do NOT treat "default" as special - only use it if activePresetId doesn't exist
          if (activePresetId && loadedPresets[activePresetId]) {
            initialPreset = loadedPresets[activePresetId];
          } else if (presetIds.length > 0) {
            // Fallback to first available preset (no special treatment for "default")
            initialPreset = loadedPresets[presetIds[0]];
            
            // If we have an activePresetId but preset doesn't exist, set it to the first available
            if (activePresetId && !loadedPresets[activePresetId] && initialPreset) {
              await setActivePresetId(initialPreset.id);
            }
          }
          
          if (initialPreset) {
            setActivePreset(initialPreset.id);
            loadPresetData(initialPreset);
          }
        }
        
        // Mark initial load as complete after a brief delay to avoid saving during load
        setTimeout(() => setIsInitialLoad(false), 100);
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    };
    
    loadData();
  }, []);

  // Convert PresetItem[] to Habit[]/Task[] for display
  const loadPresetData = (preset: Preset) => {
    setHabits(
      preset.habits.map((h) => ({
        id: h.id,
        name: h.text,
        completed: false, // UI only
      }))
    );
    setTasks(
      preset.tasks.map((t) => ({
        id: t.id,
        text: t.text,
        time: t.time || '09:00',
        completed: false, // UI only
      }))
    );
  };

  // Commit current preset to storage (async save)
  // Uses refs to ensure we always have the latest habits/tasks/activePreset
  const commitActivePreset = useCallback(async () => {
    try {
      const result = await commitPreset(
        activePresetRef.current,
        habitsRef.current,
        tasksRef.current
      );
      if (result) {
        setPresets(result);
      }
    } catch (error) {
      console.error('Failed to commit preset:', error);
    }
  }, []);

  // Auto-save when habits or tasks change (debounced)
  useEffect(() => {
    // Skip save during initial load, if presets haven't loaded yet, or if preset doesn't exist
    if (isInitialLoad) return;
    if (Object.keys(presets).length === 0) return;
    if (!presets[activePreset]) return;
    
    const timeoutId = setTimeout(() => {
      commitActivePreset();
    }, 300); // Debounce saves
    
    return () => clearTimeout(timeoutId);
  }, [habits, tasks, activePreset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on unmount (safety net)
  useEffect(() => {
    return () => {
      // Only commit if not initial load (prevents overwriting with empty state)
      if (!isInitialLoad) {
        commitActivePreset();
      }
    };
  }, [isInitialLoad, commitActivePreset]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePresetChange = async (presetId: PresetId) => {
    // Always save current preset before switching
    await commitActivePreset();
    
    try {
      // Load fresh presets from storage to get latest data
      const allPresets = await getPresets();
      const preset = allPresets[presetId];
      if (preset) {
        setActivePreset(presetId);
        loadPresetData(preset);
        // Update presets state to reflect any changes from storage
        setPresets(allPresets);
      }
    } catch (error) {
      console.error('Failed to change preset:', error);
    }
  };

  const toggleHabit = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  const addHabit = () => {
    if (newHabitInput.trim()) {
      const newHabit: Habit = {
        id: generateId(),
        name: newHabitInput.trim(),
        completed: false,
      };
      setHabits((prev) => [...prev, newHabit]);
      setNewHabitInput('');
    }
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: generateId(),
        text: newTaskText.trim(),
        time: newTaskTime || '09:00',
        completed: false,
      };
      setTasks((prev) => [...prev, newTask]);
      setNewTaskText('');
      setNewTaskTime('');
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  const editTask = (id: string) => setEditingTaskId(id);

  const handleEditTaskSubmit = (text: string, time: string) => {
    if (editingTaskId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTaskId ? { ...t, text, time } : t))
      );
    }
    setEditingTaskId(null);
  };

  const handleNewPreset = async () => {
    // Save current preset first before creating new one
    await commitActivePreset();
    
    try {
      // Load fresh presets
      const prevPresets = await getPresets();
      const newPresetId = `preset_${Date.now()}`;
      const uniqueName = generateUniquePresetName('New Preset', prevPresets);
      
      const newPreset: Preset = {
        id: newPresetId,
        name: uniqueName,
        habits: [],
        tasks: [],
        updatedAt: Date.now(),
      };

      const updatedPresets = {
        ...prevPresets,
        [newPresetId]: newPreset,
      };

      await savePresets(updatedPresets);
      await setActivePresetId(newPresetId);
      setActivePreset(newPresetId);
      loadPresetData(newPreset);
      setPresets(updatedPresets);
    } catch (error) {
      console.error('Failed to create new preset:', error);
    }
  };

  const handleRenamePreset = () => {
    if (!presets[activePreset]) return;
    setRenameModalOpen(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!presets[activePreset]) return;
    
    try {
      const prevPresets = await getPresets();
      const currentPreset = prevPresets[activePreset];
      if (!currentPreset) return;

      // Generate unique name if needed
      const uniqueName = generateUniquePresetName(newName, prevPresets);
      
      const updatedPreset: Preset = {
        ...currentPreset,
        name: uniqueName,
        updatedAt: Date.now(),
      };

      const updatedPresets = {
        ...prevPresets,
        [activePreset]: updatedPreset,
      };

      await savePresets(updatedPresets);
      setPresets(updatedPresets);
      setRenameModalOpen(false);
    } catch (error) {
      console.error('Failed to rename preset:', error);
    }
  };

  const handleDeletePreset = () => {
    if (!presets[activePreset]) return;
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!presets[activePreset]) return;
    
    try {
      const presetToDeleteId = activePreset;
      const currentPresets = await getPresets();
      const presetIds = Object.keys(currentPresets);
      
      // Find fallback preset
      const remainingPresets = presetIds.filter((id) => id !== presetToDeleteId);
      let fallbackPresetId: PresetId;
      
      if (remainingPresets.length > 0) {
        fallbackPresetId = remainingPresets[0];
      } else {
        // Create a default preset if none remain
        fallbackPresetId = 'default';
        const defaultPreset: Preset = {
          id: 'default',
          name: 'Default',
          habits: [],
          tasks: [],
          updatedAt: Date.now(),
        };
        
        // Update day plans that reference the deleted preset
        await updateDayPlansPresetReference(presetToDeleteId, fallbackPresetId);
        
        // Build updated presets object
        const updatedPresets = { ...currentPresets };
        delete updatedPresets[presetToDeleteId];
        updatedPresets[fallbackPresetId] = defaultPreset;
        
        // Save to storage first, then reload to ensure consistency
        await savePresets(updatedPresets);
        const reloadedPresets = await getPresets();
        
        await setActivePresetId(fallbackPresetId);
        setPresets(reloadedPresets);
        setActivePreset(fallbackPresetId);
        loadPresetData(reloadedPresets[fallbackPresetId] || defaultPreset);
        
        setDeleteModalOpen(false);
        return;
      }

      // Update day plans that reference the deleted preset
      await updateDayPlansPresetReference(presetToDeleteId, fallbackPresetId);

      // Build updated presets object
      const updatedPresets = { ...currentPresets };
      delete updatedPresets[presetToDeleteId];
      
      // Save to storage first, then reload to ensure consistency
      await savePresets(updatedPresets);
      const reloadedPresets = await getPresets();
      
      // Update active preset if needed
      await setActivePresetId(fallbackPresetId);
      
      // Update UI state with reloaded data
      setPresets(reloadedPresets);
      
      // Switch to fallback
      if (reloadedPresets[fallbackPresetId]) {
        setActivePreset(fallbackPresetId);
        loadPresetData(reloadedPresets[fallbackPresetId]);
      }
      
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert('Failed to delete preset. Please try again.');
    }
  };

  const activeHabitsCount = habits.filter((h) => !h.completed).length;
  const tasksCount = tasks.length;

  return (
    <div className={styles.page}>
      <EditTaskModal
        open={editingTaskId !== null}
        initialText={editingTask?.text || ''}
        initialTime={editingTask?.time || '09:00'}
        onSubmit={handleEditTaskSubmit}
        onCancel={() => setEditingTaskId(null)}
      />
      {/* Header Section */}
      <header className={styles.header}>
        <h1 className={styles.title}>Habits</h1>
        <p className={styles.subtitle}>Define and manage your daily non-negotiables.</p>
      </header>

      {/* Habit Presets Section */}
      <section className={styles.presetsSection}>
        <div className={styles.presetsHeader}>
          <h2 className={styles.presetsLabel}>Presets</h2>
        </div>

        <div className={styles.presetsList}>
          {Object.values(presets).map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetButton} ${activePreset === preset.id ? styles.presetButtonActive : ''}`}
              onClick={() => handlePresetChange(preset.id)}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Preset Actions */}
        <div className={styles.presetActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleNewPreset}
            aria-label="Create new preset"
          >
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>
            New Preset
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleRenamePreset}
            disabled={Object.keys(presets).length === 0}
            aria-label="Rename preset"
          >
            <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
              <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
            </svg>
            Rename
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonDelete}`}
            onClick={handleDeletePreset}
            disabled={Object.keys(presets).length === 0 || Object.keys(presets).length === 1}
            aria-label="Delete preset"
          >
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
            </svg>
            Delete
          </button>
        </div>
      </section>

      {/* Habits List Section */}
      <section className={styles.habitsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Active Habits</h2>
          <span className={styles.habitCount}>{activeHabitsCount} Active</span>
        </div>

        <div className={styles.habitsList}>
          {habits.map((habit) => (
            <div key={habit.id} className={styles.habitItem}>
              <label className={styles.habitLabel}>
                <input
                  type="checkbox"
                  className={styles.habitCheckbox}
                  checked={habit.completed}
                  onChange={() => toggleHabit(habit.id)}
                />
                <div className={`${styles.habitCircle} ${habit.completed ? styles.habitCircleChecked : ''}`}>
                  {habit.completed && (
                    <svg className={styles.checkIcon} viewBox="0 0 448 512" fill="currentColor">
                      <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                    </svg>
                  )}
                </div>
                <span className={`${styles.habitName} ${habit.completed ? styles.habitNameCompleted : ''}`}>
                  {habit.name}
                </span>
                <div className={styles.habitDoneBadge} style={{ opacity: habit.completed ? 1 : 0 }}>
                  <span>DONE</span>
                </div>
              </label>
              <div className={styles.habitActions}>
                <button
                  type="button"
                  className={styles.habitEdit}
                  aria-label="Edit habit"
                  onClick={() => {}}
                >
                  <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                    <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.habitDelete}
                  aria-label="Delete habit"
                  onClick={() => deleteHabit(habit.id)}
                >
                  <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Habit */}
        <div className={styles.addHabitForm}>
          <input
            type="text"
            placeholder="Add a new habit…"
            className={styles.addHabitInput}
            value={newHabitInput}
            onChange={(e) => setNewHabitInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addHabit();
              }
            }}
          />
          <button
            type="button"
            className={styles.addHabitButton}
            onClick={addHabit}
            aria-label="Add habit"
          >
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>
            Add
          </button>
        </div>
      </section>

      {/* Daily Tasks Section */}
      <section className={styles.tasksSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Daily Tasks</h2>
          <span className={styles.taskCount}>{tasksCount} Tasks</span>
        </div>

        <div className={styles.tasksList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <label className={styles.taskLabel}>
                <input
                  type="checkbox"
                  className={styles.taskCheckbox}
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <div className={`${styles.taskCircle} ${task.completed ? styles.taskCircleChecked : ''}`}>
                  {task.completed && (
                    <svg className={styles.checkIcon} viewBox="0 0 448 512" fill="currentColor">
                      <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                    </svg>
                  )}
                </div>
                <div className={styles.taskContent}>
                  <span className={`${styles.taskName} ${task.completed ? styles.taskNameCompleted : ''}`}>
                    {task.text}
                  </span>
                  <span className={styles.taskTime}>{formatTime(task.time)}</span>
                </div>
                <div className={styles.taskDoneBadge} style={{ opacity: task.completed ? 1 : 0 }}>
                  <span>DONE</span>
                </div>
              </label>
              <div className={styles.taskActions}>
                <button
                  type="button"
                  className={styles.taskEdit}
                  aria-label="Edit task"
                  onClick={() => editTask(task.id)}
                >
                  <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                    <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.taskDelete}
                  aria-label="Delete task"
                  onClick={() => deleteTask(task.id)}
                >
                  <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Task */}
        <div className={styles.addTaskForm}>
          <input
            type="text"
            placeholder="Add a new task…"
            className={styles.addTaskInput}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTask();
              }
            }}
          />
          <TimePicker value={newTaskTime} onChange={setNewTaskTime} className={styles.addTaskTimePicker} />
          <button
            type="button"
            className={styles.addTaskButton}
            onClick={addTask}
            aria-label="Add task"
          >
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>
            Add
          </button>
        </div>
      </section>

      {/* Modals */}
      {presets[activePreset] && (
        <>
          <RenamePresetModal
            isOpen={renameModalOpen}
            currentName={presets[activePreset].name}
            onConfirm={handleRenameConfirm}
            onCancel={() => setRenameModalOpen(false)}
          />
          <DeletePresetModal
            isOpen={deleteModalOpen}
            presetName={presets[activePreset].name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
