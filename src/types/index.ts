export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  isBookmarked?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  subject?: string;
  difficulty?: DifficultyLevel;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  highContrast: boolean;
  speechRate: number;
  voiceIndex: number;
  enableSpeechToText: boolean;
  enableTextToSpeech: boolean;
  defaultSubject: string;
  defaultDifficulty: DifficultyLevel;
  theme: 'light' | 'dark';
}

export interface ProgressStats {
  totalSessions: number;
  totalMessages: number;
  timeSpent: number; // in minutes
  topicsExplored: string[];
  favoriteSubjects: string[];
  streakDays: number;
  lastActiveDate: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SpeechSynthesisSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

export interface AccessibilityFeatures {
  reducedMotion: boolean;
  announceMessages: boolean;
  keyboardShortcuts: boolean;
  focusIndicators: boolean;
}

export interface AppSettings extends UserPreferences, AccessibilityFeatures {
  speechSettings: SpeechSynthesisSettings;
}
