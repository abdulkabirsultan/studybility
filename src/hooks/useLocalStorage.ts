'use client';

import { useState, useEffect } from 'react';
import { ChatSession, Message, ProgressStats } from '@/types';

/**
 * Custom hook for managing localStorage with TypeScript support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Function to remove the value from localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Get value from localStorage on component mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      // If error, return initial value
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

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
  return useLocalStorage<ChatSession[]>('studypal_sessions', []);
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
