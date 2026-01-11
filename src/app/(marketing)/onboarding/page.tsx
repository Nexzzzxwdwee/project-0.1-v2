'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

// Mock data
const mockHabits = [
  { id: 1, name: 'Hydration drink (1L)', checked: true },
  { id: 2, name: 'No phone first hour', checked: true },
  { id: 3, name: 'Deep work block (90m)', checked: true },
  { id: 4, name: 'Gym / Movement', checked: true },
  { id: 5, name: 'Content Creation', checked: false },
  { id: 6, name: 'Evening Shutdown', checked: false },
];

const mockTasks = [
  { id: 1, name: 'Trading plan / Market review', checked: false },
  { id: 2, name: 'Backtesting / Study block', checked: false },
  { id: 3, name: 'Content output', checked: false },
];

export default function OnboardingPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/today');
  };

  return (
    <main className={styles.mainContent}>
      {/* Background Elements */}
      <div className={styles.bgGrid}></div>
      <div className={styles.bgGradientTop}></div>
      <div className={styles.bgGradientBottom}></div>

      {/* Main Container */}
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.statusBadge}>
            <div className={styles.statusDot}></div>
            <span className={styles.statusText}>System Initialization</span>
          </div>

          <h1 className={styles.title}>
            Define Your <br className={styles.titleBreak} />
            <span className={styles.titleGradient}>Non-Negotiables</span>
          </h1>

          <p className={styles.subtitle}>
            These are the actions you commit to executing every day. They form the baseline of your performance.
          </p>
        </header>

        {/* Form Container */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Section 1: Habits */}
          <section className={`${styles.section} ${styles.animateEnter} ${styles.delay100}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg className={styles.icon} viewBox="0 0 576 512" fill="currentColor">
                  <path d="M264.5 5.2c14.9-6.9 32.1-6.9 47 0l218.6 101c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 149.8C37.4 145.8 32 137.3 32 128s5.4-17.9 13.9-21.8L264.5 5.2zM476.9 209.6l53.2 24.6c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 277.8C37.4 273.8 32 265.3 32 256s5.4-17.9 13.9-21.8l53.2-24.6 152 70.2c23.4 10.8 50.4 10.8 73.8 0l152-70.2zm-152 198.2l152-70.2 53.2 24.6c8.5 3.9 13.9 12.4 13.9 21.8s-5.4 17.9-13.9 21.8l-218.6 101c-14.9 6.9-32.1 6.9-47 0L45.9 405.8C37.4 401.8 32 393.3 32 384s5.4-17.9 13.9-21.8l53.2-24.6 152 70.2c23.4 10.8 50.4 10.8 73.8 0z" />
                </svg>
                Daily Habits
              </h2>
              <span className={styles.sectionLabel}>Protocol 1.0</span>
            </div>

            <div className={styles.habitsList}>
              {mockHabits.map((habit, index) => (
                <div key={habit.id} className={styles.habitItem}>
                  <div className={styles.habitInputGroup}>
                    <label className={styles.habitLabel}>Habit {String(index + 1).padStart(2, '0')}</label>
                    <input
                      type="text"
                      defaultValue={habit.name}
                      className={styles.habitInput}
                      placeholder="Enter habit name..."
                    />
                    <div className={styles.inputBorder}></div>
                  </div>
                  <div className={styles.habitActions}>
                    <input
                      type="checkbox"
                      id={`habit-${habit.id}`}
                      className={styles.checkboxCustom}
                      defaultChecked={habit.checked}
                    />
                    <button
                      type="button"
                      className={styles.deleteButton}
                      aria-label="Delete habit"
                    >
                      <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className={styles.addButton} onClick={() => {}}>
              <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
              </svg>
              Add Custom Habit
            </button>
          </section>

          {/* Section 2: Tasks */}
          <section className={`${styles.section} ${styles.animateEnter} ${styles.delay200}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <svg className={`${styles.icon} ${styles.iconYellow}`} viewBox="0 0 512 512" fill="currentColor">
                  <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
                </svg>
                Daily Tasks
              </h2>
              <span className={styles.sectionLabel}>Output</span>
            </div>

            <div className={styles.tasksList}>
              {mockTasks.map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <input
                    type="checkbox"
                    className={styles.checkboxCustom}
                    id={`task-${task.id}`}
                    defaultChecked={task.checked}
                  />
                  <span className={styles.taskText}>{task.name}</span>
                  <button
                    type="button"
                    className={styles.taskDeleteButton}
                    aria-label="Delete task"
                  >
                    <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                      <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className={styles.addTaskButton} onClick={() => {}}>
              <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
              </svg>
              Add Custom Task
            </button>
          </section>

          {/* Section 3: Rules Reminder */}
          <section className={`${styles.section} ${styles.animateEnter} ${styles.delay300}`}>
            <div className={styles.rulesCard}>
              <div className={styles.rulesAccent}></div>
              <div className={styles.rulesContent}>
                <div className={styles.rulesQuote}>
                  <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                    <path d="M0 216C0 149.7 53.7 96 120 96h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V320 288 216zm256 0c0-66.3 53.7-120 120-120h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H320c-35.3 0-64-28.7-64-64V320 288 216z" />
                  </svg>
                </div>
                <div className={styles.rulesText}>
                  <p className={styles.rulesTextMain}>
                    Non-negotiables are tracked daily. They are meant to be simple and repeatable.
                  </p>
                  <p className={styles.rulesTextSub}>
                    You can adjust them later, but consistency matters more than intensity. Do not break the chain.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer / Action */}
          <div className={`${styles.footer} ${styles.animateEnter} ${styles.delay400}`}>
            <div className={styles.footerBlur}></div>
            <button type="submit" className={styles.submitButton}>
              <span className={styles.submitButtonInner}>
                <span className={styles.submitButtonText}>Save & Initialize</span>
                <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
                </svg>
              </span>
            </button>
            <p className={styles.footerHint}>Press Enter to confirm</p>
          </div>
        </form>
      </div>
    </main>
  );
}

