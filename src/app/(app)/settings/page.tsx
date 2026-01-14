'use client';

import { useState } from 'react';
import styles from './settings.module.css';
import { P01_PREFIX, listKeys, getJSON } from '@/lib/p01Storage';

export default function SettingsPage() {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleExportData = () => {
    // Collect all p01: prefixed data
    const keys = listKeys(P01_PREFIX);
    const exportData: Record<string, unknown> = {};
    
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          exportData[key] = JSON.parse(value);
        } catch {
          exportData[key] = value;
        }
      }
    });

    // Create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-0.1-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (!resetConfirmOpen) {
      setResetConfirmOpen(true);
      return;
    }

    // Clear all p01: prefixed data
    const keys = listKeys(P01_PREFIX);
    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Reload page to reset state
    window.location.href = '/today';
  };

  const handleLogout = () => {
    // For now, just show alert (no auth system)
    alert('Logout functionality will be available when authentication is implemented.');
  };

  return (
    <div className={styles.page}>
      {/* Header Section */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your Project 0.1 account and data</p>
        </div>
      </header>

      {/* Settings Sections */}
      <div className={styles.sections}>
        {/* Data Management Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg className={styles.sectionIcon} viewBox="0 0 448 512" fill="currentColor">
              <path d="M96 32C43 32 0 64.5 0 104v8c0 13.3 5.9 25.1 15.2 33.5C6.2 157.1 0 178.3 0 200v8c0 13.3 5.9 25.1 15.2 33.5C6.2 269.1 0 290.3 0 312v8c0 39.5 43 72 96 72h256c53 0 96-32.5 96-72v-8c0-21.7-6.2-42.9-15.2-59.5C442.1 233.1 448 221.3 448 208v-8c0-21.7-6.2-42.9-15.2-59.5C442.1 121.1 448 109.3 448 96v-8C448 64.5 405 32 352 32H96zM224 160c35.3 0 64-17.9 64-40s-28.7-40-64-40s-64 17.9-64 40s28.7 40 64 40zm-96 96c0 22.1 28.7 40 64 40h64c35.3 0 64-17.9 64-40s-28.7-40-64-40h-64c-35.3 0-64 17.9-64 40zM224 416c-35.3 0-64-17.9-64-40s28.7-40 64-40s64 17.9 64 40s-28.7 40-64 40z" />
            </svg>
            <h2 className={styles.sectionTitle}>Data Management</h2>
          </div>

          <p className={styles.sectionDescription}>
            Export or reset your account data. These actions cannot be undone.
          </p>

          <div className={styles.actionList}>
            {/* Export Data Button */}
            <div className={styles.actionItem}>
              <div className={styles.actionContent}>
                <svg className={styles.actionIcon} viewBox="0 0 512 512" fill="currentColor">
                  <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
                </svg>
                <div>
                  <h3 className={styles.actionTitle}>Export Your Data</h3>
                  <p className={styles.actionDescription}>Download all your habits, tasks, and progress data as JSON</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className={styles.actionButton}
              >
                Export
              </button>
            </div>

            {/* Reset Data Button */}
            <div className={`${styles.actionItem} ${styles.actionItemDanger}`}>
              <div className={styles.actionContent}>
                <svg className={styles.actionIcon} viewBox="0 0 512 512" fill="currentColor">
                  <path d="M125.7 160H176c17.7 0 32-14.3 32-32s-14.3-32-32-32H48c-17.7 0-32 14.3-32 32V208c0 17.7 14.3 32 32 32s32-14.3 32-32V179.2c34.7-36.5 82.9-59.2 136-59.2c114.9 0 208 93.1 208 208s-93.1 208-208 208c-48.7 0-93.6-16.9-129.3-45.1c-13.4-11.1-33.1-9.1-44.2 4.3s-9.1 33.1 4.3 44.2C75.1 472 118.5 492 168 492c141.4 0 256-114.6 256-256S309.4 20 168 20c-55.2 0-106.2 17.9-147.3 48H125.7z" />
                </svg>
                <div>
                  <h3 className={styles.actionTitle}>Reset All Data</h3>
                  <p className={styles.actionDescription}>
                    {resetConfirmOpen
                      ? 'Are you sure? This will permanently delete all your data.'
                      : 'Clear all habits, tasks, and progress. This cannot be undone.'}
                  </p>
                </div>
              </div>
              <div className={styles.actionButtons}>
                {resetConfirmOpen && (
                  <button
                    type="button"
                    onClick={() => setResetConfirmOpen(false)}
                    className={styles.actionButton}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetData}
                  className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                >
                  {resetConfirmOpen ? 'Confirm Reset' : 'Reset'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <svg className={styles.sectionIcon} viewBox="0 0 512 512" fill="currentColor">
              <path d="M399 384.2C376.9 345.8 335.4 320 288 320H224c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a63 63 0 1 0 0-126 63 63 0 1 0 0 126z" />
            </svg>
            <h2 className={styles.sectionTitle}>Account</h2>
          </div>

          <p className={styles.sectionDescription}>Manage your account and session</p>

          <div className={styles.actionList}>
            {/* Logout Button */}
            <div className={styles.actionItem}>
              <div className={styles.actionContent}>
                <svg className={styles.actionIcon} viewBox="0 0 512 512" fill="currentColor">
                  <path d="M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224H192c-17.7 0-32 14.3-32 32s14.3 32 32 32H402.7l-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128zM160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96C43 32 0 75 0 128V384c0 53 43 96 96 96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H96c-17.7 0-32-14.3-32-32V128c0-17.7 14.3-32 32-32h64z" />
                </svg>
                <div>
                  <h3 className={styles.actionTitle}>Log Out</h3>
                  <p className={styles.actionDescription}>Sign out of your Project 0.1 account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={styles.actionButton}
              >
                Log Out
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>Project 0.1 • Settings</p>
      </div>
    </div>
  );
}
