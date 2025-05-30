'use client';
import { cn, formatTimestamp, truncateText } from '@/lib/utils';
import {
  PlusIcon,
  SettingsIcon,
  MessageSquareIcon,
  TrashIcon,
  Menu,
  X,
  Pencil,
} from 'lucide-react';
import { useProgressStats } from '@/hooks/useLocal';
import { useChat } from '@/hooks/useChat';
import { useState, useEffect, useRef } from 'react';
import { AccessibilityControls } from './AccessibilityControls';
import { DifficultyLevel } from '@/types';
import { ProgressTracker } from './ProgressTracker';
import { SettingsPanel } from './SettingsPanel';
import { usePreferences } from '@/contexts/PreferencesContext';

export default function ChatSidebar() {
  const { preferences, setPreferences } = usePreferences();
  const [showSettings, setShowSettings] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>('beginner');
  const [progressStats, setProgressStats] = useProgressStats();

  const subjects = [
    { id: 'math', name: 'Mathematics', icon: '🔢' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'history', name: 'History', icon: '📚' },
    { id: 'language', name: 'Language Arts', icon: '📝' },
    { id: 'computer', name: 'Computer Science', icon: '💻' },
    { id: 'art', name: 'Arts', icon: '🎨' },
    { id: 'social', name: 'Social Studies', icon: '🌍' },
    { id: 'other', name: 'Other', icon: '📖' },
  ];
  const {
    sessions,
    currentSession,
    currentSessionId,
    createNewSession,
    loadSession,
    clearAllSessions,
    setError,
    deleteSession,
    updateSessionTitle,
  } = useChat();

  const handleExportData = () => {
    const data = {
      sessions,
      preferences,
      progressStats,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studypal-backup-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: {
    sessions?: unknown[];
    preferences?: unknown;
    progressStats?: unknown;
    exportDate?: string;
  }) => {
    try {
      if (data.preferences)
        setPreferences(data.preferences as typeof preferences);
      if (data.progressStats)
        setProgressStats(data.progressStats as typeof progressStats);
      // Note: Sessions would need to be handled by the chat hook
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  // Handle click outside to close chat history drawer
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatHistoryRef.current &&
        !chatHistoryRef.current.contains(event.target as Node) &&
        showChatHistory
      ) {
        setShowChatHistory(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatHistory]);

  // Handle session title edit
  const startEditingSession = (
    id: string,
    title: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setSessionTitle(title);
  };

  const saveSessionTitle = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    updateSessionTitle(id, sessionTitle);
    setEditingSessionId(null);
  };

  return (
    <section
      className={cn(
        'flex h-full bg-gray-50 dark:bg-gray-900',
        preferences.highContrast && 'contrast-more',
        preferences.reducedMotion && 'motion-reduce'
      )}
    >
      {/* Chat History Drawer - Slides in from left */}
      <div
        ref={chatHistoryRef}
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out transform',
          showChatHistory ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='font-bold text-lg'>Chat History</h2>
          <button
            onClick={() => setShowChatHistory(false)}
            className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700'
            aria-label='Close chat history'
          >
            <X size={20} />
          </button>
        </div>

        <div className='overflow-y-auto p-3 h-full pb-20'>
          {sessions && sessions.length > 0 ? (
            <div className='space-y-1'>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    loadSession(session.id);
                    setShowChatHistory(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer group',
                    session.id === currentSessionId
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <MessageSquareIcon
                    size={18}
                    className={
                      session.id === currentSessionId
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  />

                  {editingSessionId === session.id ? (
                    <form
                      onSubmit={(e) => saveSessionTitle(session.id, e)}
                      className='flex-1 min-w-0'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type='text'
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        className='w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700'
                        autoFocus
                        onBlur={() => setEditingSessionId(null)}
                      />
                    </form>
                  ) : (
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-medium truncate'>
                        {truncateText(session.title, 30)}
                      </h3>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {formatTimestamp(session.updatedAt)}
                      </p>
                    </div>
                  )}

                  <div className='flex items-center'>
                    <button
                      onClick={(e) =>
                        startEditingSession(session.id, session.title, e)
                      }
                      className='p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity mr-1'
                      aria-label='Edit chat name'
                    >
                      <Pencil
                        size={14}
                        className='text-gray-500 dark:text-gray-400'
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className='p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity'
                      aria-label='Delete chat'
                    >
                      <TrashIcon
                        size={14}
                        className='text-gray-500 dark:text-gray-400'
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
              No chat history yet
            </div>
          )}
        </div>

        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'>
          <button
            onClick={() => {
              createNewSession();
              setShowChatHistory(false);
            }}
            className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
          >
            <PlusIcon size={16} />
            New Chat
          </button>
        </div>
      </div>

      {/* Main Sidebar */}
      <div className='w-80 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col'>
        {/* Header */}
        <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <button
                onClick={() => setShowChatHistory(true)}
                className='p-2 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='Show chat history'
              >
                <Menu size={20} />
              </button>
              <button
                onClick={() => createNewSession()}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                aria-label='New chat'
              >
                <PlusIcon size={20} />
              </button>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label='Open settings'
            >
              <SettingsIcon size={20} />
            </button>
          </div>

          {currentSession && (
            <h1 className='font-bold text-lg text-center text-gray-900 dark:text-gray-100 truncate'>
              {currentSession.title || 'New Conversation'}
            </h1>
          )}
        </div>

        {/* Progress Tracker */}
        <div className='overflow-y-auto p-4 flex-1'>
          <h2 className='font-medium text-sm text-gray-700 dark:text-gray-300 mb-2'>
            Progress
          </h2>
          <ProgressTracker stats={progressStats} className='mb-4' />
        </div>
        {/* Accessibility Controls */}
        <div className='sticky bottom-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative z-10'>
          <AccessibilityControls />
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onClearAllData={clearAllSessions}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
      </div>
    </section>
  );
}
