'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Send,
  Mic,
  MicOff,
  Plus,
  MessageSquare,
  BookOpen,
  Settings as SettingsIcon,
} from 'lucide-react';
import { DifficultyLevel } from '@/types';
import { MessageBubble } from './MessageBubble';
import { AccessibilityControls } from './AccessibilityControls';
import { ProgressTracker } from './ProgressTracker';
import { SettingsPanel } from './SettingsPanel';
import { useChat } from '@/hooks/useChat';
import { useUserPreferences, useProgressStats } from '@/hooks/useLocalStorage';
import { useTextToSpeech, useSpeechToText } from '@/hooks/useSpeech';

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

const examplePrompts = [
  'Can you help me understand fractions?',
  'Explain photosynthesis in simple terms',
  'What caused World War II?',
  'How do I write a good essay?',
  'What is a variable in programming?',
  'Tell me about the solar system',
];

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>('beginner');
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [preferences, setPreferences] = useUserPreferences();
  const [progressStats, setProgressStats] = useProgressStats();

  const {
    sessions,
    currentSession,
    isLoading,
    error,
    createNewSession,
    sendMessage,
    toggleMessageBookmark,
    clearAllSessions,
    setError,
  } = useChat();

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: sttSupported,
  } = useSpeechToText();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Apply font size from preferences
  useEffect(() => {
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px',
    };
    document.documentElement.style.fontSize = fontSizes[preferences.fontSize];
  }, [preferences.fontSize]);

  // Apply theme from preferences
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Handle speech-to-text transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput('');
    resetTranscript();

    await sendMessage(
      messageContent,
      selectedSubject || preferences.defaultSubject,
      selectedDifficulty || preferences.defaultDifficulty
    );
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleSpeechToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleMessageSpeak = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(text);
    }
  };

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

  return (
    <div
      className={cn(
        'flex h-screen bg-gray-50 dark:bg-gray-900',
        preferences.highContrast && 'contrast-more',
        preferences.reducedMotion && 'motion-reduce'
      )}
    >
      {/* Sidebar */}
      <div className='w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col'>
        {/* Header */}
        <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between mb-4'>
            <h1 className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              AI Study Buddy
            </h1>
            <button
              onClick={() => setShowSettings(true)}
              className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-label='Open settings'
            >
              <SettingsIcon size={20} />
            </button>
          </div>

          <button
            onClick={() => createNewSession()}
            className='w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Quick Settings */}
        <div className='p-4 space-y-4 border-b border-gray-200 dark:border-gray-700'>
          {/* Subject Selection */}
          <div>
            <label className='block text-sm font-medium mb-2'>Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>Select subject...</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.icon} {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className='block text-sm font-medium mb-2'>Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) =>
                setSelectedDifficulty(e.target.value as DifficultyLevel)
              }
              className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='beginner'>🌱 Beginner</option>
              <option value='intermediate'>🌿 Intermediate</option>
              <option value='advanced'>🌳 Advanced</option>
            </select>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className='flex-1 overflow-y-auto p-4'>
          <ProgressTracker stats={progressStats} />
        </div>

        {/* Accessibility Controls */}
        <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
          <AccessibilityControls
            preferences={preferences}
            onUpdatePreferences={setPreferences}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Chat Messages */}
        <div className='flex-1 overflow-y-auto'>
          {currentSession?.messages.length === 0 && (
            <div className='h-full flex items-center justify-center p-8'>
              <div className='max-w-2xl text-center'>
                <BookOpen size={48} className='mx-auto mb-4 text-gray-400' />
                <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
                  Welcome to AI Study Buddy!
                </h2>
                <p className='text-gray-600 dark:text-gray-400 mb-6'>
                  I&apos;m here to help you learn in a way that works best for
                  you. Ask me anything, and I&apos;ll break it down into simple,
                  easy-to-understand explanations.
                </p>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto'>
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className='p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <span className='text-sm text-gray-600 dark:text-gray-300'>
                        {prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentSession?.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onToggleBookmark={toggleMessageBookmark}
              onSpeak={handleMessageSpeak}
              isSpeaking={isSpeaking}
            />
          ))}

          {isLoading && (
            <div className='flex gap-3 p-4'>
              <div className='h-8 w-8 rounded-full bg-green-500 flex items-center justify-center'>
                <MessageSquare size={16} className='text-white' />
              </div>
              <div className='bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3'>
                <div className='flex gap-1'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200'></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className='mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <div className='flex items-center justify-between'>
              <span className='text-red-800 dark:text-red-200 text-sm'>
                {error}
              </span>
              <button
                onClick={() => setError(null)}
                className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className='border-t border-gray-200 dark:border-gray-700 p-4'>
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <div className='flex-1 relative'>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... I'm here to help you learn!"
                className='w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                rows={1}
                style={{ minHeight: '52px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              {/* Speech-to-Text Button */}
              {sttSupported && preferences.enableSpeechToText && (
                <button
                  type='button'
                  onClick={handleSpeechToggle}
                  className={cn(
                    'absolute right-3 top-3 p-2 rounded-lg transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                  )}
                  aria-label={
                    isListening ? 'Stop listening' : 'Start voice input'
                  }
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
            </div>

            <button
              type='submit'
              disabled={!input.trim() || isLoading}
              className={cn(
                'px-4 py-3 rounded-lg transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                input.trim() && !isLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
              aria-label='Send message'
            >
              <Send size={16} />
            </button>
          </form>

          {isListening && (
            <div className='mt-2 text-sm text-blue-600 dark:text-blue-400'>
              🎤 Listening... Speak now!
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        onClearAllData={clearAllSessions}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />
    </div>
  );
}
