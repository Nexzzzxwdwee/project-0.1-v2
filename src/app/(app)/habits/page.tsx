'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './habits.module.css';

interface Habit {
  id: number;
  name: string;
  completed: boolean;
}

interface Task {
  id: number;
  text: string;
  time: string; // HH:MM format
  completed: boolean;
}

const mockHabitsByPreset: Record<'default' | 'trading' | 'recovery', Habit[]> = {
  default: [
    { id: 1, name: 'morning sauna', completed: true },
    { id: 2, name: 'deep work block', completed: true },
    { id: 3, name: 'read 30 mins', completed: false },
    { id: 4, name: 'zero sugar', completed: false },
  ],
  trading: [
    { id: 101, name: 'market prep', completed: false },
    { id: 102, name: 'trading journal', completed: false },
    { id: 103, name: 'no news check', completed: false },
  ],
  recovery: [
    { id: 201, name: 'light walk', completed: false },
    { id: 202, name: 'meditation', completed: false },
    { id: 203, name: 'early sleep', completed: false },
  ],
};

const mockTasksByPreset: Record<'default' | 'trading' | 'recovery', Task[]> = {
  default: [
    { id: 1, text: 'email client reports', time: '09:00', completed: true },
    { id: 2, text: 'team standup meeting', time: '14:00', completed: false },
    { id: 3, text: 'review quarterly goals', time: '16:30', completed: false },
  ],
  trading: [
    { id: 101, text: 'pre-market analysis', time: '08:00', completed: false },
    { id: 102, text: 'trade review session', time: '15:00', completed: false },
  ],
  recovery: [
    { id: 201, text: 'gentle yoga', time: '10:00', completed: false },
  ],
};

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string; // HH:MM format
  onChange: (time: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Parse 24h format to 12h format
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const hour24 = hours || 9;
      const hour12 = hour24 % 12 || 12;
      setHour(hour12);
      setMinute(minutes || 0);
      setAmpm(hour24 >= 12 ? 'PM' : 'AM');
    } else {
      setHour(9);
      setMinute(0);
      setAmpm('AM');
    }
  }, [value]);

  // Convert 12h format to 24h format
  const to24h = (h: number, m: number, period: 'AM' | 'PM'): string => {
    let hour24 = h;
    if (period === 'PM' && h !== 12) hour24 = h + 12;
    if (period === 'AM' && h === 12) hour24 = 0;
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleSet = () => {
    const time24 = to24h(hour, minute, ampm);
    onChange(time24);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Reset to current value
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      const hour24 = hours || 9;
      const hour12 = hour24 % 12 || 12;
      setHour(hour12);
      setMinute(minutes || 0);
      setAmpm(hour24 >= 12 ? 'PM' : 'AM');
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayValue = value ? formatTime(value) : '--:--';

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={styles.timePickerWrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.timePickerTrigger} ${className || ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select time"
      >
        <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
          <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
        </svg>
        <span className={styles.timePickerValue}>{displayValue}</span>
      </button>

      {isOpen && (
        <>
          <div className={styles.timePickerOverlay} onClick={handleCancel}></div>
          <div ref={popoverRef} className={styles.timePickerPopover}>
            <div className={styles.timePickerHeader}>
              <h3 className={styles.timePickerTitle}>Select Time</h3>
            </div>

            <div className={styles.timePickerBody}>
              <div className={styles.timePickerColumn}>
                <label className={styles.timePickerLabel}>Hour</label>
                <div className={styles.timePickerScroll}>
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`${styles.timePickerOption} ${hour === h ? styles.timePickerOptionActive : ''}`}
                      onClick={() => setHour(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.timePickerColumn}>
                <label className={styles.timePickerLabel}>Minute</label>
                <div className={styles.timePickerScroll}>
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.timePickerOption} ${minute === m ? styles.timePickerOptionActive : ''}`}
                      onClick={() => setMinute(m)}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.timePickerColumn}>
                <label className={styles.timePickerLabel}>Period</label>
                <div className={styles.timePickerScroll}>
                  <button
                    type="button"
                    className={`${styles.timePickerOption} ${ampm === 'AM' ? styles.timePickerOptionActive : ''}`}
                    onClick={() => setAmpm('AM')}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`${styles.timePickerOption} ${ampm === 'PM' ? styles.timePickerOptionActive : ''}`}
                    onClick={() => setAmpm('PM')}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.timePickerFooter}>
              <button
                type="button"
                className={styles.timePickerCancel}
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.timePickerSet}
                onClick={handleSet}
              >
                Set
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function HabitsPage() {
  const [activePreset, setActivePreset] = useState<'default' | 'trading' | 'recovery'>('default');
  const [habits, setHabits] = useState<Habit[]>(mockHabitsByPreset.default);
  const [tasks, setTasks] = useState<Task[]>(mockTasksByPreset.default);
  const [newHabitInput, setNewHabitInput] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const handlePresetChange = (preset: 'default' | 'trading' | 'recovery') => {
    setActivePreset(preset);
    setHabits(mockHabitsByPreset[preset]);
    setTasks(mockTasksByPreset[preset]);
  };

  const toggleHabit = (id: number) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  const addHabit = () => {
    if (newHabitInput.trim()) {
      const newHabit: Habit = {
        id: Date.now(),
        name: newHabitInput.trim(),
        completed: false,
      };
      setHabits([...habits, newHabit]);
      setNewHabitInput('');
    }
  };

  const deleteHabit = (id: number) => {
    setHabits(habits.filter((h) => h.id !== id));
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: Task = {
        id: Date.now(),
        text: newTaskText.trim(),
        time: newTaskTime || '09:00',
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskText('');
      setNewTaskTime('');
    }
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const editTask = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newText = prompt('Task name:', task.text) || task.text;
    const newTime = prompt('Time (HH:MM):', task.time) || task.time;

    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, text: newText, time: newTime }
          : t
      )
    );
  };

  const activeHabitsCount = habits.filter((h) => !h.completed).length;
  const tasksCount = tasks.length;

  return (
    <div className={styles.page}>
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
          <button
            type="button"
            className={`${styles.presetButton} ${activePreset === 'default' ? styles.presetButtonActive : ''}`}
            onClick={() => handlePresetChange('default')}
          >
            Default
          </button>
          <button
            type="button"
            className={`${styles.presetButton} ${activePreset === 'trading' ? styles.presetButtonActive : ''}`}
            onClick={() => handlePresetChange('trading')}
          >
            Trading Day
          </button>
          <button
            type="button"
            className={`${styles.presetButton} ${activePreset === 'recovery' ? styles.presetButtonActive : ''}`}
            onClick={() => handlePresetChange('recovery')}
          >
            Recovery
          </button>
        </div>

        {/* Preset Actions */}
        <div className={styles.presetActions}>
          <button type="button" className={styles.actionButton}>
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>
            New Preset
          </button>
          <button type="button" className={styles.actionButton}>
            <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
              <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
            </svg>
            Rename
          </button>
          <button type="button" className={`${styles.actionButton} ${styles.actionButtonDelete}`}>
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
    </div>
  );
}
