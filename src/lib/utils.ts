import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID for messages and sessions
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Sanitize text for speech synthesis
 */
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/[*_~`]/g, '') // Remove markdown formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/\n+/g, '. ') // Convert line breaks to pauses
    .trim();
}

/**
 * Extract keywords from text for progress tracking
 */
export function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'cannot',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'me',
    'him',
    'her',
    'us',
    'them',
    'my',
    'your',
    'his',
    'her',
    'its',
    'our',
    'their',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords
}

/**
 * Check if browser supports speech synthesis
 */
export function supportsSpeechSynthesis(): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return false;
    }

    // Check for native support
    const hasSupport =
      'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

    if (hasSupport) {
      console.log('Browser has speech synthesis support');
      return true;
    }

    // If we're here, no support
    console.log('Browser does not support speech synthesis');
    return false;
  } catch (error) {
    console.error('Error checking speech synthesis support:', error);
    return false;
  }
}

/**
 * Check if browser supports speech recognition
 */
export function supportsSpeechRecognition(): boolean {
  try {
    // First check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return false;
    }

    // Check for native support
    const hasNativeSupport =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

    if (hasNativeSupport) {
      console.log('Browser has native speech recognition support');
      return true;
    }

    // If we're here, no native support
    console.log('Browser does not support speech recognition');
    return false;
  } catch (error) {
    console.error('Error checking speech recognition support:', error);
    return false;
  }
}

/**
 * Get available speech synthesis voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!supportsSpeechSynthesis()) return [];
  return speechSynthesis.getVoices();
}

/**
 * Convert minutes to human readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
