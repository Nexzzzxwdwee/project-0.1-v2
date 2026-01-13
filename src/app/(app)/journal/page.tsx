'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './journal.module.css';

interface JournalEntry {
  date: string; // ISO string
  content: string;
}

const mockEntries: JournalEntry[] = [
  {
    date: '2025-01-08',
    content: 'Today was productive. Focused on deep work and completed all major tasks.',
  },
  {
    date: '2025-01-07',
    content: 'Started the week strong. Morning routine was solid.',
  },
  {
    date: '2025-01-06',
    content: 'Reflecting on progress. Need to maintain consistency.',
  },
  {
    date: '2025-01-05',
    content: 'Good day overall. Need to focus more on deep work.',
  },
  {
    date: '2025-01-04',
    content: 'Productive morning session. Afternoon was slower.',
  },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function JournalPage() {
  const [entryIndex, setEntryIndex] = useState(0);
  const [content, setContent] = useState(mockEntries[0].content);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentEntry = mockEntries[entryIndex];
  const totalEntries = mockEntries.length;

  // Update content when entry changes
  useEffect(() => {
    setContent(currentEntry.content);
    setSaveStatus('saved');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [entryIndex, currentEntry.content]);

  // Handle content change with debounced auto-save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveStatus('saving');

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      debounceTimerRef.current = null;
    }, 600);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handlePrevious = () => {
    if (entryIndex > 0) {
      setEntryIndex(entryIndex - 1);
    }
  };

  const handleNext = () => {
    if (entryIndex < totalEntries - 1) {
      setEntryIndex(entryIndex + 1);
    }
  };

  const isFirstEntry = entryIndex === 0;
  const isLastEntry = entryIndex === totalEntries - 1;

  // Calculate stats (mock data)
  const totalWords = mockEntries.reduce((sum, entry) => sum + entry.content.split(/\s+/).length, 0);
  const wordsThisMonth = totalWords; // Simplified

  return (
    <div className={styles.page}>
      {/* Background Grid Effect */}
      <div className={styles.bgGrid}></div>
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <h1 className={styles.title}>Journal</h1>
          <p className={styles.subtitle}>Write freely. This is not scored.</p>
          <div className={styles.debugStamp}>JOURNAL_UI_NEW_KOMPOSO</div>
          <div className={styles.dateRow}>
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H64C28.7 64 0 92.7 0 128v16 48V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V192 144 128c0-35.3-28.7-64-64-64H344V24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H152V24zM48 192H400V448c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192z" />
            </svg>
            <span className={styles.dateText}>{formatDate(currentEntry.date)}</span>
          </div>
        </header>

        {/* Journal Entry Section */}
        <section className={styles.entrySection}>
          <div className={styles.textareaCard}>
            <textarea
              id="journal-textarea"
              className={styles.textarea}
              placeholder="What mattered today?"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              spellCheck={true}
            />

            {/* Auto-save indicator */}
            <div className={styles.autoSaveRow}>
              <span className={styles.autoSaveLabel}>Auto-saving</span>
              <div className={styles.autoSaveStatus}>
                <div
                  className={`${styles.saveDot} ${saveStatus === 'saving' ? styles.saveDotPulse : styles.saveDotSaved}`}
                ></div>
                <span className={styles.saveText}>{saveStatus === 'saving' ? 'Saving…' : 'Saved'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Entry Navigation */}
        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.navButton}
            onClick={handlePrevious}
            disabled={isFirstEntry}
            aria-label="Previous entry"
          >
            <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
              <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
            </svg>
            Previous
          </button>
          <span className={styles.navLabel}>
            {totalEntries === 1 ? '1 entry' : `${entryIndex + 1} / ${totalEntries} entries`}
          </span>
          <button
            type="button"
            className={styles.navButton}
            onClick={handleNext}
            disabled={isLastEntry}
            aria-label="Next entry"
          >
            Next
            <svg className={styles.icon} viewBox="0 0 320 512" fill="currentColor">
              <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
            </svg>
          </button>
        </div>

        {/* Add Entry Button */}
        <div className={styles.addEntrySection}>
          <button type="button" className={styles.addEntryButton}>
            <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
            </svg>
            Add Entry
          </button>
        </div>

        {/* Entries List Section */}
        <section className={styles.entriesListSection}>
          <div className={styles.entriesListHeader}>
            <h2 className={styles.entriesListTitle}>Today&apos;s Entries</h2>
            <p className={styles.entriesListSubtitle}>{totalEntries} entries</p>
          </div>

          {/* Entries Container */}
          <div className={styles.entriesContainer}>
            {mockEntries.map((entry, index) => (
              <div key={entry.date} className={styles.entryCard}>
                <div className={styles.entryCardHeader}>
                  <span className={styles.entryCardDate}>{formatDate(entry.date)}</span>
                  {index === entryIndex && <span className={styles.entryCardActive}>Current</span>}
                </div>
                <p className={styles.entryCardContent}>{entry.content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Journal OS Section */}
        <section className={styles.journalOsSection}>
          <div className={styles.journalOsHeader}>
            <h2 className={styles.journalOsTitle}>Journal OS</h2>
            <p className={styles.journalOsSubtitle}>Your personal journaling operating system</p>
          </div>

          {/* Journal OS Grid */}
          <div className={styles.journalOsGrid}>
            {/* Entries Card */}
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div>
                  <h3 className={styles.statCardTitle}>Entries</h3>
                  <p className={styles.statCardDescription}>Total journal entries</p>
                </div>
                <svg className={styles.statCardIcon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H384h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V384c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H384 96zm0 384H352v64H96c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16zm16 48H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16s7.2-16 16-16z" />
                </svg>
              </div>
              <div className={styles.statCardValue}>{totalEntries}</div>
              <p className={styles.statCardSubtext}>+{totalEntries} this month</p>
            </div>

            {/* Streak Card */}
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div>
                  <h3 className={styles.statCardTitle}>Streak</h3>
                  <p className={styles.statCardDescription}>Consecutive days</p>
                </div>
                <svg className={styles.statCardIcon} viewBox="0 0 448 512" fill="currentColor">
                  <path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z" />
                </svg>
              </div>
              <div className={styles.statCardValue}>5</div>
              <p className={styles.statCardSubtext}>Keep it going!</p>
            </div>

            {/* Words Card */}
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div>
                  <h3 className={styles.statCardTitle}>Words</h3>
                  <p className={styles.statCardDescription}>Total words written</p>
                </div>
                <svg className={styles.statCardIcon} viewBox="0 0 512 512" fill="currentColor">
                  <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
                </svg>
              </div>
              <div className={styles.statCardValue}>{totalWords}</div>
              <p className={styles.statCardSubtext}>+{wordsThisMonth} this month</p>
            </div>

            {/* Mood Card */}
            <div className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <div>
                  <h3 className={styles.statCardTitle}>Mood</h3>
                  <p className={styles.statCardDescription}>Average mood</p>
                </div>
                <svg className={styles.statCardIcon} viewBox="0 0 512 512" fill="currentColor">
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM164.1 325.5C182 346.2 212.6 368 256 368s74-21.8 91.9-42.5c5.8-6.7 15.9-7.4 22.6-1.6s7.4 15.9 1.6 22.6C349.8 372.1 311.1 400 256 400s-93.8-27.9-116.1-53.5c-5.8-6.7-5.1-16.8 1.6-22.6s16.8-5.1 22.6 1.6zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
                </svg>
              </div>
              <div className={styles.statCardValue}>—</div>
              <p className={styles.statCardSubtext}>Based on entries</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button type="button" className={styles.actionButton}>
              <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
              </svg>
              Export Entries
            </button>
            <button type="button" className={styles.actionButton}>
              <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                <path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z" />
              </svg>
              View Analytics
            </button>
            <button type="button" className={styles.actionButton}>
              <svg className={styles.icon} viewBox="0 0 512 512" fill="currentColor">
                <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
              </svg>
              Settings
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
