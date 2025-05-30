'use client';

import { useEffect } from 'react';

/**
 * Global toast function type definition
 */
type ToastType = 'info' | 'success' | 'warning' | 'error';
type ToastFunction = (
  message: string,
  options?: { type?: ToastType; duration?: number }
) => void;

// Global toast function that can be accessed outside of React components
let globalToast: ToastFunction | null = null;

/**
 * Set the global toast function
 */
export function setGlobalToast(toastFn: ToastFunction | null) {
  globalToast = toastFn;
}

/**
 * Get the global toast function (for use in non-React contexts)
 */
export function getGlobalToast(): ToastFunction | null {
  return globalToast;
}

/**
 * Show a toast message using the global toast function
 */
export function showToast(
  message: string,
  options?: { type?: ToastType; duration?: number }
) {
  if (globalToast) {
    globalToast(message, options);
  } else if (typeof window !== 'undefined') {
    // Fallback to console if toast system isn't available
    console.warn('Toast system not initialized:', message);
  }
}

/**
 * Component that initializes the global toast function
 * This should be included once at the top level of your app
 */
export default function ToastInitializer() {
  useEffect(() => {
    // Add toast function to window for global access
    if (typeof window !== 'undefined') {
      window.toast = (
        message: string,
        options?: { type?: ToastType; duration?: number }
      ) => {
        if (globalToast) {
          globalToast(message, options);
        }
      };
    }

    return () => {
      // Clean up on unmount
      if (typeof window !== 'undefined' && 'toast' in window) {
        delete (window as any).toast;
      }
    };
  }, []);

  return null; // This component doesn't render anything
}

// Add type definition for the global toast function
declare global {
  interface Window {
    toast?: (
      message: string,
      options?: { type?: ToastType; duration?: number }
    ) => void;
  }
}
