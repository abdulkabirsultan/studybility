'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Type,
  Contrast,
  Volume2,
  Mic,
  Settings,
  Moon,
  Sun,
  Minus,
  Plus,
  Keyboard,
  Eye,
  X,
} from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

interface AccessibilityControlsProps {
  className?: string;
}

export function AccessibilityControls({
  className,
}: AccessibilityControlsProps) {
  const { preferences, setPreferences } = usePreferences();
  const [isExpanded, setIsExpanded] = useState(false);

  const fontSizes = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xl: '20px',
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Accessibility Button */}
      <button
        onClick={toggleExpanded}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm w-full',
          'bg-white dark:bg-gray-800',
          'border-gray-200 dark:border-gray-700',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'transition-colors'
        )}
        aria-label='Accessibility settings'
        aria-expanded={isExpanded}
      >
        <Eye size={16} />
        <span>Accessibility</span>
      </button>

      {/* Backdrop when panel is open */}
      {isExpanded && (
        <div
          className='fixed inset-0 bg-black/20 z-40'
          onClick={() => setIsExpanded(false)}
          aria-hidden='true'
        />
      )}

      {/* Accessibility Panel */}
      {isExpanded && (
        <div
          className={cn(
            'fixed left-0 right-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-lg border bg-white p-4 shadow-lg',
            'dark:bg-gray-800 dark:border-gray-700',
            'animate-in slide-in-from-bottom duration-200',
            'max-h-[80vh] overflow-y-auto'
          )}
          role='dialog'
          aria-label='Accessibility settings panel'
        >
          <div className='space-y-4'>
            {/* Panel Title */}
            <div className='flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700 mb-4'>
              <h3 className='text-lg font-semibold'>Accessibility Settings</h3>
              <button
                onClick={toggleExpanded}
                className='p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='Close accessibility panel'
              >
                <X size={18} />
              </button>
            </div>

            {/* Font Size */}
            <div>
              <label className='block text-sm font-medium mb-2'>
                <Type size={16} className='inline mr-2' />
                Font Size
              </label>
              <div className='flex gap-2'>
                {Object.entries(fontSizes).map(([size, value]) => (
                  <button
                    key={size}
                    onClick={() => updatePreference('fontSize', size)}
                    className={cn(
                      'px-3 py-2 rounded text-sm border transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      preferences.fontSize === size
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    )}
                    style={{ fontSize: value }}
                    aria-pressed={preferences.fontSize === size}
                  >
                    {size === 'xl'
                      ? 'XL'
                      : size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div>
              <label className='block text-sm font-medium mb-2'>
                {preferences.theme === 'dark' ? (
                  <Moon size={16} className='inline mr-2' />
                ) : (
                  <Sun size={16} className='inline mr-2' />
                )}
                Theme
              </label>
              <button
                onClick={() =>
                  updatePreference(
                    'theme',
                    preferences.theme === 'light' ? 'dark' : 'light'
                  )
                }
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded border transition-colors',
                  'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                  'hover:bg-gray-100 dark:hover:bg-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              >
                {preferences.theme === 'dark' ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}
                Switch to {preferences.theme === 'light' ? 'Dark' : 'Light'}{' '}
                Mode
              </button>
            </div>

            {/* High Contrast */}
            <div>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preferences.highContrast}
                  onChange={(e) =>
                    updatePreference('highContrast', e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Contrast size={16} />
                <span className='text-sm font-medium'>High Contrast Mode</span>
              </label>
            </div>

            {/* Speech Rate */}
            <div>
              <label className='block text-sm font-medium mb-2'>
                <Volume2 size={16} className='inline mr-2' />
                Speech Rate: {preferences.speechRate}x
              </label>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() =>
                    updatePreference(
                      'speechRate',
                      Math.max(0.5, preferences.speechRate - 0.1)
                    )
                  }
                  className='p-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Decrease speech rate'
                >
                  <Minus size={14} />
                </button>
                <input
                  type='range'
                  min='0.5'
                  max='2'
                  step='0.1'
                  value={preferences.speechRate}
                  onChange={(e) =>
                    updatePreference('speechRate', parseFloat(e.target.value))
                  }
                  className='flex-1'
                  aria-label='Speech rate slider'
                />
                <button
                  onClick={() =>
                    updatePreference(
                      'speechRate',
                      Math.min(2, preferences.speechRate + 0.1)
                    )
                  }
                  className='p-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='Increase speech rate'
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Speech Features */}
            <div className='space-y-2'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preferences.enableTextToSpeech}
                  onChange={(e) =>
                    updatePreference('enableTextToSpeech', e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Volume2 size={16} />
                <span className='text-sm font-medium'>Text-to-Speech</span>
              </label>

              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preferences.enableSpeechToText}
                  onChange={(e) =>
                    updatePreference('enableSpeechToText', e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Mic size={16} />
                <span className='text-sm font-medium'>Speech-to-Text</span>
              </label>
            </div>

            {/* Accessibility Features */}
            <div className='space-y-2'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preferences.announceMessages}
                  onChange={(e) =>
                    updatePreference('announceMessages', e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Volume2 size={16} />
                <span className='text-sm font-medium'>
                  Announce New Messages
                </span>
              </label>

              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preferences.keyboardShortcuts}
                  onChange={(e) =>
                    updatePreference('keyboardShortcuts', e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Keyboard size={16} />
                <span className='text-sm font-medium'>Keyboard Shortcuts</span>
              </label>

              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={preferences.reducedMotion}
                  onChange={(e) =>
                    updatePreference('reducedMotion', e.target.checked)
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <Settings size={16} />
                <span className='text-sm font-medium'>Reduced Motion</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
