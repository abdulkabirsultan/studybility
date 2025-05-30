'use client';

import { ChatSession, Message, ProgressStats } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A custom React hook for safely using localStorage with type safety,
 * optimized to avoid SSR-related errors and runtime issues.
 *
 * @param key The key to use in localStorage
 * @param initialValue The initial value to use if no value is found in localStorage
 * @returns A tuple of [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Create a ref to track if the component is mounted
  const isMounted = useRef(false);

  // Function to safely get the initial value
  const getInitialValue = (): T => {
    // Only attempt to get from localStorage in browser environment
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from localStorage
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue if nothing stored
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Initialize state with lazy initializer function to avoid
  // repeated localStorage access on re-renders
  const [storedValue, setStoredValue] = useState<T>(getInitialValue);

  // Synchronize with localStorage whenever stored value changes
  useEffect(() => {
    // Skip the first render (SSR phase)
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // Only update localStorage in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Validation for chat sessions if the key is studypal_sessions
        if (key === 'studypal_sessions' && Array.isArray(storedValue)) {
          // Validate that each session has required fields
          const validSessions = storedValue.filter((session) => {
            const isValid =
              session &&
              typeof session === 'object' &&
              typeof session.id === 'string' &&
              Array.isArray(session.messages);

            if (!isValid) {
              console.warn('Filtered out invalid session:', session);
            }
            return isValid;
          });

          if (validSessions.length !== storedValue.length) {
            console.warn(
              `Filtered out ${
                storedValue.length - validSessions.length
              } invalid sessions`
            );
            // If we filtered out sessions, update the state
            setStoredValue(validSessions as any);
            return; // Don't save yet, let the next effect cycle handle it
          }
        }

        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  // Update value in state and localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Skip unnecessary updates if the value hasn't changed
        if (JSON.stringify(valueToStore) === JSON.stringify(storedValue)) {
          return;
        }

        // Save state - localStorage sync happens in the useEffect
        setStoredValue(valueToStore);

        // Immediately attempt to save to localStorage if possible
        if (typeof window !== 'undefined' && isMounted.current) {
          try {
            localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (storageError) {
            // Check if it's a quota exceeded error
            if (
              storageError instanceof DOMException &&
              (storageError.code === 22 ||
                storageError.name === 'QuotaExceededError')
            ) {
              handleQuotaExceeded(key, valueToStore);
            } else {
              console.error(
                `Error in immediate localStorage save for "${key}":`,
                storageError
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error in setValue for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from state and localStorage
  const removeValue = () => {
    try {
      // Reset to initial value
      setStoredValue(initialValue);

      // Remove from localStorage in browser environment
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences() {
  const defaultPreferences = {
    fontSize: 'medium' as const,
    highContrast: false,
    speechRate: 1,
    voiceIndex: 0,
    enableSpeechToText: true,
    enableTextToSpeech: true,
    defaultSubject: '',
    defaultDifficulty: 'beginner' as const,
    theme: 'light' as 'light' | 'dark',
    reducedMotion: false,
    announceMessages: true,
    keyboardShortcuts: true,
    focusIndicators: true,
  };

  return useLocalStorage('studypal_preferences', defaultPreferences);
}

/**
 * Hook for managing chat sessions
 */
export function useChatSessions() {
  const hook = useLocalStorage<ChatSession[]>('studypal_sessions', []);
  return hook;
}

/**
 * Hook for managing progress stats
 */
export function useProgressStats() {
  const defaultStats: ProgressStats = {
    totalSessions: 0,
    totalMessages: 0,
    timeSpent: 0,
    topicsExplored: [],
    favoriteSubjects: [],
    streakDays: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
  };

  return useLocalStorage<ProgressStats>('studypal_progress', defaultStats);
}

/**
 * Hook for managing bookmarked messages
 */
export function useBookmarks() {
  return useLocalStorage<Message[]>('studypal_bookmarks', []);
}

/**
 * Check if localStorage is available and has quota
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test_storage__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Handle localStorage quota exceeded error
 */
function handleQuotaExceeded(key: string, value: any): void {
  try {
    console.warn('LocalStorage quota exceeded, attempting to clear old data');

    // For chat sessions, keep only the 10 most recent
    if (
      key === 'studypal_sessions' &&
      Array.isArray(value) &&
      value.length > 10
    ) {
      // Sort by updated date and keep only the 10 most recent
      const sortedSessions = [...value].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      const trimmedSessions = sortedSessions.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(trimmedSessions));
      console.log(`Reduced sessions from ${value.length} to 10`);
      return;
    }

    // If not sessions or other fallbacks failed, clear all non-essential data
    localStorage.removeItem('studypal_progress');
    console.log('Cleared progress data to make room');
  } catch (e) {
    console.error('Failed to recover from quota exceeded:', e);
  }
}
