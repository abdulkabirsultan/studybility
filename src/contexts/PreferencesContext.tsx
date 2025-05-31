'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserPreferences } from '@/hooks/useLocal';

// Define the type for our preferences
type UserPreferences = {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  speechRate: number;
  voiceIndex: number;
  enableSpeechToText: boolean;
  enableTextToSpeech: boolean;
  defaultSubject: string;
  defaultDifficulty: 'beginner' | 'intermediate' | 'advanced';
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  announceMessages: boolean;
  keyboardShortcuts: boolean;
  focusIndicators: boolean;
};

// Create the context with initial undefined value
type PreferencesContextType = {
  preferences: UserPreferences;
  setPreferences: any;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

// Provider component that wraps parts of our app that need access to preferences
export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Use the same hook that individual components were using
  const [preferences, setPreferences] = useUserPreferences();

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

// Custom hook to use the preferences context
export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }

  return context;
}
