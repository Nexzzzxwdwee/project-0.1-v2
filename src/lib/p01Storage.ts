/**
 * localStorage utilities with p01: prefix for Project 0.1
 * All keys are prefixed with "p01:" for clean export/reset capability
 */

export const P01_PREFIX = 'p01:';

/**
 * List all localStorage keys matching the prefix
 */
export function listKeys(prefix: string = P01_PREFIX): string[] {
  if (typeof window === 'undefined') return [];
  
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Get JSON value from localStorage, return fallback if not found or invalid
 */
export function getJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Set JSON value to localStorage
 */
export function setJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set localStorage key "${key}":`, error);
  }
}

/**
 * Remove key from localStorage
 */
export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
  }
}

