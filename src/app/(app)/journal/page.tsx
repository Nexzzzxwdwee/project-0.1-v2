'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateId,
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  setActiveEntryId as persistActiveEntryId,
} from '@/lib/presets';
import type { JournalEntry } from '@/lib/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TimeTracker from './TimeTracker';
import styles from './journal.module.css';

type EditorTab = 'journal' | 'time';

/**
 * Get today's date as YYYY-MM-DD
 */
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for long display (e.g., "Monday, Jan 20, 2025")
 */
function formatDateLong(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format date for short display (e.g., "Jan 20")
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Create preview text from content (first 80 chars, collapsed whitespace)
 */
function previewText(content: string): string {
  const collapsed = content.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= 80) return collapsed;
  return collapsed.substring(0, 80) + '...';
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((word) => word.length > 0).length;
}


export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showEntriesList, setShowEntriesList] = useState(true);
  const [activeTab, setActiveTab] = useState<EditorTab>('journal');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingEntryRef = useRef<JournalEntry | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data on mount (after hydration)
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedEntries = await getJournalEntries();
        const today = getTodayDateString();

        // Ensure an entry for today exists, then default to it. This keeps the
        // journal (and its Time Tracker) opening on today, so time logged from
        // the Today page's Time Log — which always writes to today's date —
        // shows up here instead of being hidden behind a past-day entry.
        let todayEntry = loadedEntries.find((e) => e.date === today);
        if (!todayEntry) {
          const now = Date.now();
          todayEntry = {
            id: generateId(),
            createdAt: now,
            updatedAt: now,
            date: today,
            content: '',
          };
          loadedEntries.push(todayEntry);
          await saveJournalEntry(todayEntry);
        }

        // Sort entries by updatedAt descending (newest first)
        loadedEntries.sort((a, b) => b.updatedAt - a.updatedAt);
        setEntries(loadedEntries);

        // Default the active entry to today's entry.
        await persistActiveEntryId(todayEntry.id);
        setActiveEntryId(todayEntry.id);
      } catch (error) {
        console.error('Failed to load journal entries:', error);
      }
    };

    loadData();
  }, []);

  // Get active entry
  const activeEntry = entries.find((e) => e.id === activeEntryId) || null;

  // Filter entries by search
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return entry.content.toLowerCase().includes(query) || entry.date.includes(query);
  });

  // Update entry content with debounced save
  const updateEntryContent = useCallback(
    (entryId: string, newContent: string) => {
      setEntries((prev) => {
        const updated = prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, content: newContent, updatedAt: Date.now() }
            : entry
        );
        // Stash the changed entry for the debounced save (avoids a stale closure).
        pendingEntryRef.current = updated.find((e) => e.id === entryId) ?? null;
        // Re-sort by updatedAt descending
        updated.sort((a, b) => b.updatedAt - a.updatedAt);
        return updated;
      });

      setSaveStatus('saving');

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Persist only the changed entry — no read-all, no full-collection rewrite.
      debounceTimerRef.current = setTimeout(async () => {
        debounceTimerRef.current = null;
        const toSave = pendingEntryRef.current;
        if (!toSave) {
          setSaveStatus('saved');
          return;
        }
        try {
          await saveJournalEntry(toSave);
        } catch (error) {
          console.error('Failed to save journal entry:', error);
        }
        setSaveStatus('saved');
      }, 600);
    },
    []
  );

  // Handle content change
  const handleContentChange = (newContent: string) => {
    if (!activeEntryId) return;
    updateEntryContent(activeEntryId, newContent);
  };

  // Create new entry
  const handleNewEntry = async () => {
    try {

      const today = getTodayDateString();
      const now = Date.now();
      const newEntry: JournalEntry = {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        date: today,
        content: '',
      };

      const updated = [newEntry, ...entries];
      await saveJournalEntry(newEntry);
      setEntries(updated);
      await persistActiveEntryId(newEntry.id);
      setActiveEntryId(newEntry.id);

      // Focus textarea after a brief delay
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  // Delete entry
  const handleDeleteEntry = async () => {
    if (!activeEntryId) return;
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false);
    if (!activeEntryId) return;

    try {

      const updated = entries.filter((e) => e.id !== activeEntryId);
      await deleteJournalEntry(activeEntryId);

      // Select next entry (prefer next in list, or previous, or null)
      let nextId: string | null = null;
      const currentIndex = filteredEntries.findIndex((e) => e.id === activeEntryId);
      if (currentIndex >= 0) {
        if (currentIndex < filteredEntries.length - 1) {
          nextId = filteredEntries[currentIndex + 1].id;
        } else if (currentIndex > 0) {
          nextId = filteredEntries[currentIndex - 1].id;
        } else if (updated.length > 0) {
          nextId = updated[0].id;
        }
      }

      setEntries(updated);
      if (nextId) {
        await persistActiveEntryId(nextId);
        setActiveEntryId(nextId);
      } else {
        await persistActiveEntryId(null);
        setActiveEntryId(null);
      }
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Save active entry ID to storage when it changes
  useEffect(() => {
    const saveActive = async () => {
      try {
  
        await persistActiveEntryId(activeEntryId);
      } catch (error) {
        console.error('Failed to save active entry:', error);
      }
    };
    saveActive();
  }, [activeEntryId]);

  // Word count for active entry
  const wordCount = activeEntry ? countWords(activeEntry.content) : 0;

  return (
    <div className={styles.page}>
      <ConfirmModal
        open={deleteConfirmOpen}
        title="Delete entry"
        message="Delete this entry? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
      {/* Mobile toggle button */}
      <div className={styles.mobileToggle}>
        <button
          type="button"
          onClick={() => setShowEntriesList(!showEntriesList)}
          className={styles.mobileToggleButton}
          aria-label={showEntriesList ? 'Hide entries' : 'Show entries'}
        >
          <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
            <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
          </svg>
          Entries
        </button>
      </div>

      <div className={styles.layout}>
        {/* Entries Sidebar */}
        <aside
          className={`${styles.sidebar} ${showEntriesList ? styles.sidebarVisible : styles.sidebarHidden}`}
        >
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}><span className={styles.titleGradient}>Journal</span></h1>
            <button
              type="button"
              onClick={handleNewEntry}
              className={styles.newEntryButton}
              aria-label="New entry"
            >
              <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z" />
              </svg>
              New Entry
            </button>
          </div>

          {/* Search */}
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Entries List */}
          <div className={styles.entriesList}>
            {filteredEntries.length === 0 ? (
              <div className={styles.emptyEntries}>
                <p className={styles.emptyEntriesText}>
                  {searchQuery ? 'No entries match your search.' : 'No entries yet.'}
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isActive = entry.id === activeEntryId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setActiveEntryId(entry.id);
                    }}
                    className={`${styles.entryRow} ${isActive ? styles.entryRowActive : ''}`}
                  >
                    <div className={styles.entryRowContent}>
                      <div className={styles.entryRowDate}>{formatDateShort(entry.date)}</div>
                      <div className={styles.entryRowPreview}>
                        {entry.content.trim() ? previewText(entry.content) : '(Empty entry)'}
                      </div>
                      {entry.content.trim() && (
                        <div className={styles.entryRowWordCount}>
                          {countWords(entry.content)} {countWords(entry.content) === 1 ? 'word' : 'words'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Editor Panel */}
        <main className={styles.editor}>
          {activeEntry ? (
            <>
              {/* Editor Header */}
              <header className={styles.editorHeader}>
                <div>
                  <h2 className={styles.editorTitle}>{formatDateLong(activeEntry.date)}</h2>
                  <div className={styles.saveStatus}>
                    <div
                      className={`${styles.saveDot} ${saveStatus === 'saving' ? styles.saveDotPulse : styles.saveDotSaved}`}
                    ></div>
                    <span className={styles.saveText}>
                      {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  className={styles.deleteButton}
                  aria-label="Delete entry"
                >
                  <svg className={styles.icon} viewBox="0 0 448 512" fill="currentColor">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                  </svg>
                  Delete
                </button>
              </header>

              {/* Tabs */}
              <div className={styles.tabBar} role="tablist" aria-label="Journal mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'journal'}
                  className={`${styles.tab} ${activeTab === 'journal' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('journal')}
                >
                  Journal
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'time'}
                  className={`${styles.tab} ${activeTab === 'time' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('time')}
                >
                  Time Tracker
                </button>
              </div>

              {activeTab === 'journal' ? (
                <>
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={activeEntry.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className={styles.textarea}
                    spellCheck={true}
                  />

                  {/* Footer */}
                  <footer className={styles.editorFooter}>
                    <div className={styles.wordCount}>
                      {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </div>
                  </footer>
                </>
              ) : (
                <TimeTracker
                  date={activeEntry.date}
                  onSaveStatusChange={setSaveStatus}
                />
              )}
            </>
          ) : (
            <div className={styles.emptyEditor}>
              <p className={styles.emptyEditorText}>Select an entry to edit, or create a new one.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
