'use client';

import { useState } from 'react';
import styles from './today.module.css';

interface Habit {
  id: number;
  name: string;
  completed: boolean;
}

interface Task {
  id: number;
  time: string;
  text: string;
  completed: boolean;
}

const mockHabits: Habit[] = [
  { id: 1, name: 'morning sauna', completed: true },
  { id: 2, name: 'deep work block', completed: true },
  { id: 3, name: 'read 30 mins', completed: false },
  { id: 4, name: 'zero sugar', completed: false },
];

const mockTasks: Task[] = [
  { id: 1, time: '09:00', text: 'Review Q1 strategy document', completed: false },
  { id: 2, time: '11:30', text: 'Team sync with engineering', completed: false },
  { id: 3, time: '14:00', text: 'Client proposal draft', completed: false },
  { id: 4, time: '07:00', text: 'Morning workout session', completed: true },
];

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [taskTime, setTaskTime] = useState('');
  const [taskText, setTaskText] = useState('');

  const toggleHabit = (id: number) => {
    setHabits(habits.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = () => {
    if (taskText.trim()) {
      const newTask: Task = {
        id: Date.now(),
        time: taskTime || '00:00',
        text: taskText,
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setTaskTime('');
      setTaskText('');
    }
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  const activeHabits = habits.filter((h) => !h.completed).length;

  const getCurrentDate = () => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

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
              <span className={styles.sealText}>Day Not Sealed</span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            {/* Stat 1 */}
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Operator Score</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>2/2</span>
                <span className={styles.statPercent}>100%</span>
              </div>
              <div className={styles.statBar}>
                <div className={styles.statBarFill} style={{ width: '100%' }}></div>
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
                <input
                  type="checkbox"
                  className={styles.habitCheckbox}
                  checked={habit.completed}
                  onChange={() => toggleHabit(habit.id)}
                />
                <div className={`${styles.habitContent} ${habit.completed ? styles.habitCompleted : ''}`}>
                  <div className={styles.habitCircle}>
                    {habit.completed && (
                      <svg className={styles.checkIcon} viewBox="0 0 448 512" fill="currentColor">
                        <path d="M438.6 105.4c12.5-12.5 12.5-32.8 0-45.3l-256-256c-12.5-12.5-32.8-12.5-45.3 0l-256 256c-12.5 12.5-12.5 32.8 0 45.3l256 256c12.5 12.5 32.8 12.5 45.3 0l256-256zM382.6 246.6L234.6 398.6c-12.5 12.5-32.8 12.5-45.3 0l-96-96c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 306.7 337.4 201.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z" />
                      </svg>
                    )}
                  </div>
                  <span className={styles.habitName}>{habit.name}</span>
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
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearCompleted}
            >
              Clear Completed
            </button>
          </div>

          {/* Add Task Input */}
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

          {/* Task List */}
          <div className={styles.tasksList}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}
              >
                <button
                  type="button"
                  className={styles.taskCheckbox}
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  <svg className={styles.checkIcon} viewBox="0 0 448 512" fill="currentColor" style={{ opacity: task.completed ? 1 : 0 }}>
                    <path d="M438.6 105.4c12.5-12.5 12.5-32.8 0-45.3l-256-256c-12.5-12.5-32.8-12.5-45.3 0l-256 256c-12.5 12.5-12.5 32.8 0 45.3l256 256c12.5 12.5 32.8 12.5 45.3 0l256-256zM382.6 246.6L234.6 398.6c-12.5 12.5-32.8 12.5-45.3 0l-96-96c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 306.7 337.4 201.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z" />
                  </svg>
                </button>
                <span className={styles.taskTime}>{task.time}</span>
                <span className={styles.taskText}>{task.text}</span>
                <button
                  type="button"
                  className={styles.taskDelete}
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  <svg className={styles.icon} viewBox="0 0 384 512" fill="currentColor">
                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer / Quote */}
      <div className={styles.footer}>
        <p className={styles.footerQuote}>&quot;Discipline is destiny.&quot;</p>
      </div>
    </div>
  );
}
