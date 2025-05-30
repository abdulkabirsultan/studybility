'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Settings,
  X,
  BookOpen,
  BarChart3,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Subject, DifficultyLevel } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
  className?: string;
}

const subjects: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: '🔢',
    description: 'Algebra, geometry, calculus, and more',
    color: 'blue',
  },
  {
    id: 'science',
    name: 'Science',
    icon: '🔬',
    description: 'Biology, chemistry, physics',
    color: 'green',
  },
  {
    id: 'history',
    name: 'History',
    icon: '📚',
    description: 'World history, events, and timelines',
    color: 'yellow',
  },
  {
    id: 'language',
    name: 'Language Arts',
    icon: '📝',
    description: 'Grammar, writing, literature',
    color: 'purple',
  },
  {
    id: 'computer',
    name: 'Computer Science',
    icon: '💻',
    description: 'Programming, algorithms, technology',
    color: 'indigo',
  },
  {
    id: 'art',
    name: 'Arts',
    icon: '🎨',
    description: 'Visual arts, music, creative subjects',
    color: 'pink',
  },
  {
    id: 'social',
    name: 'Social Studies',
    icon: '🌍',
    description: 'Geography, civics, culture',
    color: 'cyan',
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📖',
    description: 'Any other subject',
    color: 'gray',
  },
];

const difficulties = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Simple explanations, basic concepts',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Moderate complexity, building on basics',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Complex topics, detailed explanations',
  },
];

export function SettingsPanel({
  isOpen,
  onClose,
  onClearAllData,
  onExportData,
  onImportData,
  className,
}: SettingsPanelProps) {
  const { preferences, setPreferences } = usePreferences();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const updatePreference = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImportData(data);
        setImportError(null);
      } catch (error) {
        setImportError(
          'Invalid file format. Please select a valid backup file.'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    onClearAllData();
    setShowClearConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50' onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900',
          'border-l border-gray-200 dark:border-gray-700',
          'overflow-y-auto shadow-xl',
          'animate-in slide-in-from-right duration-300',
          className
        )}
      >
        {/* Header */}
        <div className='sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Settings size={20} />
              <h2 className='text-lg font-semibold'>Settings</h2>
            </div>
            <button
              onClick={onClose}
              className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label='Close settings'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='p-4 space-y-6'>
          {/* Default Subject */}
          <section>
            <h3 className='flex items-center gap-2 text-md font-medium mb-3'>
              <BookOpen size={16} />
              Default Subject
            </h3>
            <div className='grid grid-cols-2 gap-2'>
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => updatePreference('defaultSubject', subject.id)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    preferences.defaultSubject === subject.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-lg'>{subject.icon}</span>
                    <span className='font-medium text-sm'>{subject.name}</span>
                  </div>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>
                    {subject.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Default Difficulty */}
          <section>
            <h3 className='flex items-center gap-2 text-md font-medium mb-3'>
              <BarChart3 size={16} />
              Default Difficulty Level
            </h3>
            <div className='space-y-2'>
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.value}
                  onClick={() =>
                    updatePreference('defaultDifficulty', difficulty.value)
                  }
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    preferences.defaultDifficulty === difficulty.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className='font-medium mb-1'>{difficulty.label}</div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {difficulty.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Data Management */}
          <section>
            <h3 className='text-md font-medium mb-3'>Data Management</h3>
            <div className='space-y-3'>
              {/* Export Data */}
              <button
                onClick={onExportData}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border',
                  'border-gray-200 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'transition-colors'
                )}
              >
                <Download size={16} className='text-blue-500' />
                <div className='text-left'>
                  <div className='font-medium'>Export Data</div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    Download your chat history and preferences
                  </div>
                </div>
              </button>

              {/* Import Data */}
              <label
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border cursor-pointer',
                  'border-gray-200 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'focus-within:ring-2 focus-within:ring-blue-500',
                  'transition-colors'
                )}
              >
                <Upload size={16} className='text-green-500' />
                <div className='text-left'>
                  <div className='font-medium'>Import Data</div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    Restore from a backup file
                  </div>
                </div>
                <input
                  type='file'
                  accept='.json'
                  onChange={handleFileImport}
                  className='sr-only'
                />
              </label>

              {importError && (
                <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                  <div className='flex items-center gap-2 text-red-800 dark:text-red-200'>
                    <AlertTriangle size={16} />
                    <span className='text-sm'>{importError}</span>
                  </div>
                </div>
              )}

              {/* Reset to Defaults */}
              <button
                onClick={() => {
                  const defaultPrefs = {
                    fontSize: 'medium',
                    highContrast: false,
                    speechRate: 1,
                    voiceIndex: 0,
                    enableSpeechToText: true,
                    enableTextToSpeech: true,
                    defaultSubject: '',
                    defaultDifficulty: 'beginner',
                    theme: 'light',
                    reducedMotion: false,
                    announceMessages: true,
                    keyboardShortcuts: true,
                    focusIndicators: true,
                  };
                  setPreferences(defaultPrefs);
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border',
                  'border-gray-200 dark:border-gray-700',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'transition-colors'
                )}
              >
                <RotateCcw size={16} className='text-orange-500' />
                <div className='text-left'>
                  <div className='font-medium'>Reset to Defaults</div>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    Restore original settings
                  </div>
                </div>
              </button>

              {/* Clear All Data */}
              <div className='pt-2 border-t border-gray-200 dark:border-gray-700'>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border',
                      'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
                      'hover:bg-red-50 dark:hover:bg-red-900/20',
                      'focus:outline-none focus:ring-2 focus:ring-red-500',
                      'transition-colors'
                    )}
                  >
                    <Trash2 size={16} />
                    <div className='text-left'>
                      <div className='font-medium'>Clear All Data</div>
                      <div className='text-sm opacity-75'>
                        Delete all chat history and progress
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className='space-y-2'>
                    <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                      <div className='flex items-center gap-2 text-red-800 dark:text-red-200 mb-2'>
                        <AlertTriangle size={16} />
                        <span className='font-medium'>Are you sure?</span>
                      </div>
                      <p className='text-sm text-red-700 dark:text-red-300 mb-3'>
                        This will permanently delete all your chat history,
                        progress, and settings. This action cannot be undone.
                      </p>
                      <div className='flex gap-2'>
                        <button
                          onClick={handleClearData}
                          className='flex-1 px-3 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                        >
                          Yes, Delete All
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className='flex-1 px-3 py-2 border border-gray-300 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
