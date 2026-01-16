'use client';

import { useState, useEffect } from 'react';
import { generateId } from '@/lib/presets';
import { P01_PREFIX, getJSON, setJSON } from '@/lib/p01Storage';
import styles from './goals.module.css';

export interface Goal {
  id: string;
  text: string;
  tag?: string;
  createdAt: number;
  updatedAt: number;
  done: boolean;
  doneAt: number | null;
}

/**
 * Get goals from localStorage
 */
function getGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  return getJSON<Goal[]>(`${P01_PREFIX}goals`, []);
}

/**
 * Save goals to localStorage
 */
function saveGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  setJSON(`${P01_PREFIX}goals`, goals);
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalTag, setNewGoalTag] = useState('');
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // Load goals on mount (after hydration)
  useEffect(() => {
    const loadedGoals = getGoals();
    setGoals(loadedGoals);
  }, []);

  // Separate active and completed goals, sorted
  const activeGoals = goals
    .filter((g) => !g.done)
    .sort((a, b) => b.updatedAt - a.updatedAt); // Newest updatedAt first

  const completedGoals = goals
    .filter((g) => g.done)
    .sort((a, b) => {
      // Most recent doneAt first, fallback to updatedAt
      const aTime = a.doneAt || a.updatedAt;
      const bTime = b.doneAt || b.updatedAt;
      return bTime - aTime;
    });

  // Save goals helper
  const updateGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  // Add new goal
  const handleAddGoal = () => {
    const text = newGoalText.trim();
    if (!text) return;

    const now = Date.now();
    const newGoal: Goal = {
      id: generateId(),
      text,
      tag: newGoalTag.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      done: false,
      doneAt: null,
    };

    const updated = [...goals, newGoal];
    updateGoals(updated);
    setNewGoalText('');
    setNewGoalTag('');
  };

  // Toggle done status
  const handleToggleDone = (id: string) => {
    const updated = goals.map((goal) => {
      if (goal.id === id) {
        const isNowDone = !goal.done;
        return {
          ...goal,
          done: isNowDone,
          doneAt: isNowDone ? Date.now() : null,
          updatedAt: Date.now(),
        };
      }
      return goal;
    });
    updateGoals(updated);
  };

  // Delete goal
  const handleDeleteGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    if (!confirm(`Delete "${goal.text}"? This cannot be undone.`)) {
      return;
    }

    const updated = goals.filter((g) => g.id !== id);
    updateGoals(updated);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid}></div>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Goals</h1>
            <p className={styles.subtitle}>Set targets. Execute. Track progress.</p>
          </div>
          <div className={styles.activeBadge}>
            <span>{activeGoals.length} Active</span>
          </div>
        </header>

        {/* Active Goals Section */}
        {activeGoals.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Active Goals</h2>
            <div className={styles.goalsList}>
              {activeGoals.map((goal) => (
                <div key={goal.id} className={styles.goalCard}>
                  <div className={styles.goalContent}>
                    <div className={styles.goalHeader}>
                      <h3 className={styles.goalTitle}>{goal.text}</h3>
                      {goal.tag && (
                        <span className={styles.tagPill} title={goal.tag}>
                          {goal.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.goalActions}>
                    <button
                      type="button"
                      className={styles.doneButton}
                      onClick={() => handleToggleDone(goal.id)}
                      aria-label={`Mark "${goal.text}" as done`}
                    >
                      DONE
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDeleteGoal(goal.id)}
                      aria-label={`Delete "${goal.text}"`}
                    >
                      <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeGoals.length === 0 && (
          <section className={styles.section}>
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No active goals yet.</p>
            </div>
          </section>
        )}

        {/* Add Goal Section */}
        <section className={styles.section}>
          <div className={styles.addGoalCard}>
            <h2 className={styles.addGoalTitle}>Create New Goal</h2>
            <div className={styles.addGoalForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="goal-text" className={styles.visuallyHidden}>
                  Goal text
                </label>
                <input
                  id="goal-text"
                  type="text"
                  className={styles.goalInput}
                  placeholder="Enter goal..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGoal();
                    }
                  }}
                  aria-label="Goal text (required)"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="goal-tag" className={styles.visuallyHidden}>
                  Tag (optional)
                </label>
                <input
                  id="goal-tag"
                  type="text"
                  className={styles.goalInput}
                  placeholder="Tag (optional)"
                  value={newGoalTag}
                  onChange={(e) => setNewGoalTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGoal();
                    }
                  }}
                  aria-label="Tag (optional)"
                />
              </div>
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddGoal}
                aria-label="Add goal"
              >
                <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <section className={styles.section}>
            <button
              type="button"
              className={styles.completedToggle}
              onClick={() => setCompletedExpanded(!completedExpanded)}
              aria-expanded={completedExpanded}
              aria-label={completedExpanded ? 'Collapse completed goals' : 'Expand completed goals'}
            >
              <h2 className={styles.sectionTitle}>Completed</h2>
              <span className={styles.completedCount}>({completedGoals.length})</span>
              <svg
                className={`${styles.toggleIcon} ${completedExpanded ? styles.toggleIconExpanded : ''}`}
                viewBox="0 0 320 512"
                fill="currentColor"
              >
                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
              </svg>
            </button>
            {completedExpanded && (
              <div className={styles.goalsList}>
                {completedGoals.map((goal) => (
                  <div key={goal.id} className={`${styles.goalCard} ${styles.goalCardCompleted}`}>
                    <div className={styles.goalContent}>
                      <div className={styles.goalHeader}>
                        <h3 className={styles.goalTitle}>{goal.text}</h3>
                        {goal.tag && (
                          <span className={styles.tagPill} title={goal.tag}>
                            {goal.tag}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.goalActions}>
                      <button
                        type="button"
                        className={styles.restoreButton}
                        onClick={() => handleToggleDone(goal.id)}
                        aria-label={`Restore "${goal.text}" to active goals`}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteGoal(goal.id)}
                        aria-label={`Delete "${goal.text}"`}
                      >
                        <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                          <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {completedGoals.length === 0 && completedExpanded && (
          <section className={styles.section}>
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No completed goals yet.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
