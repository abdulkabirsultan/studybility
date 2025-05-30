'use client';

import {
  BookOpenIcon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  SendIcon,
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useProgressStats } from '@/hooks/useLocal';
import { useChat } from '@/hooks/useChat';
import { useSpeechToText, useTextToSpeech } from '@/hooks/useSpeech';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Message } from '@/types';
import { showToast } from './ToastInitializer';

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

// Loading indicator component - memoized to prevent rerendering
const LoadingIndicator = memo(() => (
  <div className='flex gap-3 p-4'>
    <div className='h-8 w-8 rounded-full bg-green-500 flex items-center justify-center'>
      <MessageSquareIcon size={16} className='text-white' />
    </div>
    <div className='bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3'>
      <div className='flex gap-1'>
        <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse'></div>
        <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100'></div>
        <div className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200'></div>
      </div>
    </div>
  </div>
));
LoadingIndicator.displayName = 'LoadingIndicator';

// Memoized example prompt button
const ExamplePromptButton = memo(
  ({
    prompt,
    onClick,
  }: {
    prompt: string;
    onClick: (prompt: string) => void;
  }) => (
    <button
      onClick={() => onClick(prompt)}
      className='p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
    >
      <span className='text-sm text-gray-600 dark:text-gray-300'>{prompt}</span>
    </button>
  )
);
ExamplePromptButton.displayName = 'ExamplePromptButton';

// Welcome Screen component - memoized to prevent rerendering
const WelcomeScreen = memo(
  ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => (
    <div className='flex-grow flex items-center justify-center pb-4'>
      <div className='max-w-2xl text-center'>
        <BookOpenIcon size={48} className='mx-auto mb-4 text-gray-400' />
        <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
          Welcome to StudyBilit, your AI Study Buddy!
        </h2>
        <p className='text-gray-600 dark:text-gray-400 mb-6'>
          I&apos;m here to help you learn in a way that works best for you. Ask
          me anything, and I&apos;ll break it down into simple,
          easy-to-understand explanations.
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto'>
          {examplePrompts.map((prompt, index) => (
            <ExamplePromptButton
              key={index}
              prompt={prompt}
              onClick={onPromptClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
);
WelcomeScreen.displayName = 'WelcomeScreen';

// Error display component - memoized to prevent rerendering
const ErrorDisplay = memo(({ error }: { error: string }) => (
  <div className='p-4 my-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 rounded-r-lg text-red-700 dark:text-red-400 flex items-start'>
    <div className='mr-3 flex-shrink-0 mt-0.5'>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='h-5 w-5'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
          fillRule='evenodd'
          d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
          clipRule='evenodd'
        />
      </svg>
    </div>
    <div className='flex-1'>
      <p className='font-medium'>Error</p>
      <p className='text-sm mt-1'>{error}</p>
    </div>
  </div>
));
ErrorDisplay.displayName = 'ErrorDisplay';

// Message List component - memoized to prevent full rerendering
const MessageList = memo(
  ({
    messages,
    onBookmark,
    onSpeak,
    isSpeaking,
  }: {
    messages: Message[];
    onBookmark: (messageId: string) => void;
    onSpeak: (text: string) => void;
    isSpeaking: boolean;
  }) => (
    <>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onBookmark={onBookmark}
          onSpeak={onSpeak}
          isSpeaking={isSpeaking}
        />
      ))}
    </>
  )
);
MessageList.displayName = 'MessageList';
export default function ChatBox() {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // State
  const [input, setInput] = useState('');
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Hooks
  const { preferences } = usePreferences();
  const [progressStats] = useProgressStats();

  const {
    currentSession,
    isLoading,
    error,
    createNewSession,
    sendMessage,
    toggleMessageBookmark,
  } = useChat();

  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported: sttSupported,
    error: speechError,
    isOnline,
  } = useSpeechToText();

  // Memoized event handlers to prevent recreation on render
  const handlePromptClick = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, []);

  const handleSpeechToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      // If we're currently speaking text, stop that first
      if (isSpeaking) {
        stopSpeaking();
      }
      startListening();
      // Clear input when starting to listen
      setInput('');
    }
  }, [isListening, stopListening, isSpeaking, stopSpeaking, startListening]);

  const handleMessageSpeak = useCallback(
    (text: string) => {
      if (isSpeaking) {
        stopSpeaking();
      } else {
        // If we're currently listening to speech, stop that first
        if (isListening) {
          stopListening();
        }
        speak(text);
      }
    },
    [isSpeaking, stopSpeaking, isListening, stopListening, speak]
  );

  const handleSubmit = useCallback(
    (
      e:
        | React.FormEvent<HTMLFormElement>
        | React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      try {
        sendMessage(
          input,
          preferences.defaultSubject,
          preferences.defaultDifficulty
        );
        setInput('');
      } catch (err) {
        showToast('Failed to send message. Please try again.', {
          type: 'error',
        });
      }
    },
    [
      input,
      isLoading,
      sendMessage,
      preferences.defaultSubject,
      preferences.defaultDifficulty,
    ]
  );

  // Optimized effects with dependencies

  // Scroll to bottom when messages change - using requestAnimationFrame for better performance
  useEffect(() => {
    if (messagesEndRef.current && currentSession?.messages?.length) {
      // Use requestAnimationFrame to ensure smooth scrolling after DOM updates
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [currentSession?.messages?.length]); // Only depend on the length for better performance

  // Apply font size from preferences - only when needed
  useEffect(() => {
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px',
    };
    document.documentElement.style.fontSize = fontSizes[preferences.fontSize];
  }, [preferences.fontSize]);

  // Apply theme from preferences - only when needed
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Handle speech-to-text transcript efficiently
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Display error toast when there's an error
  useEffect(() => {
    if (error) {
      // Use the toast system for displaying errors
      showToast(error, {
        type: 'error',
        duration: 5000,
      });
    }
  }, [error]);

  // Handle speech errors
  useEffect(() => {
    if (speechError) {
      showToast('Speech recognition error. Please try again.', {
        type: 'warning',
        duration: 5000,
      });
    }
  }, [speechError]);

  // Create a new session if none exists - run only once
  useEffect(() => {
    if (!currentSession) {
      createNewSession(
        preferences.defaultSubject,
        preferences.defaultDifficulty
      );
    }
  }, [
    currentSession,
    createNewSession,
    preferences.defaultSubject,
    preferences.defaultDifficulty,
  ]);

  // Main render
  return (
    <div className='flex-1 h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900'>
      {/* Error Toast - Only shown when there's an error */}
      {errorToast && (
        <div className='fixed top-4 right-4 z-50 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-lg shadow-md animate-in slide-in-from-top-5 fade-in duration-300'>
          {errorToast}
        </div>
      )}

      {/* Chat Messages Area */}
      <div className='flex-1 overflow-y-auto px-4 py-2'>
        <div className='max-w-3xl mx-auto h-full flex flex-col'>
          {currentSession?.messages?.length ? (
            // Display chat messages - use memoized components
            <>
              <MessageList
                messages={currentSession.messages}
                onBookmark={toggleMessageBookmark}
                onSpeak={handleMessageSpeak}
                isSpeaking={isSpeaking}
              />

              {isLoading && <LoadingIndicator />}

              {error && <ErrorDisplay error={error} />}
            </>
          ) : (
            // Welcome content - use memoized component
            <WelcomeScreen onPromptClick={handlePromptClick} />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className='border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800'>
        <div className='max-w-3xl mx-auto'>
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
              {preferences.enableSpeechToText && (
                <button
                  type='button'
                  onClick={
                    sttSupported
                      ? handleSpeechToggle
                      : () =>
                          showToast(
                            'Speech recognition is not supported in your browser',
                            { type: 'warning' }
                          )
                  }
                  className={cn(
                    'absolute right-3 top-3 p-2 rounded-lg transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : !sttSupported
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : !isOnline
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                  )}
                  aria-label={
                    !sttSupported
                      ? 'Speech recognition not supported'
                      : !isOnline
                      ? 'Network offline - speech unavailable'
                      : isListening
                      ? 'Stop listening'
                      : 'Start voice input'
                  }
                  title={
                    !sttSupported
                      ? 'Speech recognition not supported in this browser'
                      : !isOnline
                      ? 'Network connection required for speech recognition'
                      : isListening
                      ? 'Stop listening'
                      : 'Start voice input'
                  }
                  disabled={!sttSupported || !isOnline}
                >
                  {isListening ? (
                    <MicOffIcon size={16} />
                  ) : (
                    <MicIcon size={16} />
                  )}
                </button>
              )}
            </div>
            <button
              type='submit'
              disabled={!input.trim() || isLoading}
              className={cn(
                'px-4 py-3 rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                (!input.trim() || isLoading) &&
                  'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
              aria-label='Send message'
            >
              <SendIcon size={16} />
            </button>
          </form>
        </div>

        {/* Speech Recognition Status - only show when active */}
        {isListening && (
          <div className='mt-2 text-sm text-blue-600 dark:text-blue-400'>
            🎤{' '}
            {isOnline
              ? 'Listening... Speak now!'
              : 'Waiting for network connection...'}
          </div>
        )}
      </div>
    </div>
  );
}
