'use client';

import { useState } from 'react';
import styles from './goals.module.css';

interface Goal {
  id: number;
  title: string;
  category: string;
  progress: number; // 0-100
  done: boolean;
}

const mockGoals: Goal[] = [
  { id: 1, title: 'Reach $10k monthly trading profit', category: 'Trading', progress: 65, done: false },
  { id: 2, title: 'Complete 30-day fitness challenge', category: 'Health', progress: 80, done: false },
  { id: 3, title: 'Publish 12 blog posts this quarter', category: 'Content', progress: 42, done: false },
  { id: 4, title: 'Launch new product feature', category: 'Business', progress: 100, done: true },
  { id: 5, title: 'Read 24 books this year', category: 'Personal', progress: 35, done: false },
];

// Known categories for color coding
const knownCategories = ['Trading', 'Health', 'Content', 'Business', 'Personal'];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategoryText, setNewGoalCategoryText] = useState('');
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [focusedGoalId, setFocusedGoalId] = useState<number | null>(null);
  const [completingGoalId, setCompletingGoalId] = useState<number | null>(null);

  const activeGoals = goals.filter((g) => !g.done);
  const completedGoals = goals.filter((g) => g.done);

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      const categoryText = newGoalCategoryText.trim();
      const category = categoryText || 'General';
      
      const newGoal: Goal = {
        id: Date.now(),
        title: newGoalTitle.trim(),
        category: category,
        progress: 0,
        done: false,
      };
      setGoals([...goals, newGoal]);
      setNewGoalTitle('');
      setNewGoalCategoryText('');
    }
  };

  const handleMarkDone = (id: number) => {
    setCompletingGoalId(id);
    setTimeout(() => {
      setGoals(goals.map((g) => (g.id === id ? { ...g, done: true, progress: 100 } : g)));
      setCompletingGoalId(null);
    }, 300);
  };

  const handleRestore = (id: number) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, done: false } : g)));
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Trading: '#22c55e',
      Health: '#3b82f6',
      Content: '#a855f7',
      Business: '#f59e0b',
      Personal: '#ef4444',
    };
    // Return known category color, or neutral color for unknown categories
    return colors[category] || '#44403c';
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
            <div className={styles.goalsList}>
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`${styles.goalCard} ${focusedGoalId === goal.id ? styles.goalCardFocused : ''} ${completingGoalId === goal.id ? styles.goalCardCompleting : ''}`}
                  onClick={() => setFocusedGoalId(focusedGoalId === goal.id ? null : goal.id)}
                  onBlur={() => setFocusedGoalId(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Focus on goal: ${goal.title}`}
                >
                  <div className={styles.goalContent}>
                    <div className={styles.goalHeader}>
                      <h3 className={styles.goalTitle}>{goal.title}</h3>
                      <span
                        className={`${styles.categoryPill} ${knownCategories.includes(goal.category) ? '' : styles.categoryPillUnknown}`}
                        style={{ '--category-color': getCategoryColor(goal.category) } as React.CSSProperties}
                      >
                        {goal.category}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${styles.doneButton} ${completingGoalId === goal.id ? styles.doneButtonPulsing : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkDone(goal.id);
                    }}
                    aria-label={`Mark "${goal.title}" as done`}
                  >
                    DONE
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeGoals.length === 0 && (
          <section className={styles.section}>
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>No active goals. Add one below to get started.</p>
            </div>
          </section>
        )}

        {/* Add Goal Section */}
        <section className={styles.section}>
          <div className={styles.addGoalCard}>
            <h2 className={styles.addGoalTitle}>Create New Goal</h2>
            <div className={styles.addGoalForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="goal-title" className={styles.visuallyHidden}>
                  Goal title
                </label>
                <input
                  id="goal-title"
                  type="text"
                  className={styles.goalInput}
                  placeholder="Enter goal title..."
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGoal();
                    }
                  }}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="goal-category" className={styles.visuallyHidden}>
                  Category
                </label>
                <input
                  id="goal-category"
                  type="text"
                  className={styles.goalInput}
                  placeholder="Category (optional)"
                  value={newGoalCategoryText}
                  onChange={(e) => setNewGoalCategoryText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGoal();
                    }
                  }}
                  aria-label="Category (optional)"
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
                        <h3 className={styles.goalTitle}>{goal.title}</h3>
                        <span
                          className={`${styles.categoryPill} ${knownCategories.includes(goal.category) ? '' : styles.categoryPillUnknown}`}
                          style={{ '--category-color': getCategoryColor(goal.category) } as React.CSSProperties}
                        >
                          {goal.category}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.restoreButton}
                      onClick={() => handleRestore(goal.id)}
                      aria-label={`Restore "${goal.title}" to active goals`}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
