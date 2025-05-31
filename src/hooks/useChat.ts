'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Message, ChatSession, DifficultyLevel } from '@/types';
import { generateId, extractKeywords, debounce } from '@/lib/utils';
import { useChatSessions, useProgressStats } from './useLocal';

// Constants for better maintenance
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Custom hook for managing chat functionality with enhanced error prevention
 * and optimized performance.
 */
export function useChat() {
  // Get sessions and progress stats from localStorage hooks
  const [sessions, setSessions] = useChatSessions();
  const [progressStats, setProgressStats] = useProgressStats();

  // Local state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const sessionStartTime = useRef<number>(Date.now());
  const isMounted = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Safe memoization with fallback and proper type checking
  const currentSession = useMemo(() => {
    if (!sessions || !Array.isArray(sessions) || !currentSessionId) {
      return null;
    }

    const session = sessions.find(
      (session) => session && session.id === currentSessionId
    );

    if (session) {
      // Ensure messages is always an array
      if (!Array.isArray(session.messages)) {
        return {
          ...session,
          messages: [],
        };
      }

      // Return a new object to avoid reference issues
      return {
        ...session,
        messages: [...session.messages],
      };
    }

    return null;
  }, [sessions, currentSessionId]);

  // Initialize component mount status
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;

      // Clean up any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear any pending timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // Handle session time tracking with better error prevention
  useEffect(() => {
    // Save current session ID to avoid closure issues
    const sessionId = currentSessionId;
    const startTime = sessionStartTime.current;

    return () => {
      try {
        if (sessionId && isMounted.current && startTime) {
          const timeSpent = Math.floor((Date.now() - startTime) / (1000 * 60));

          // Only update if there's actual time spent and we're not in an unmounting state
          if (timeSpent > 0 && document.visibilityState !== 'hidden') {
            // Use a more stable way to update progress stats
            const currentStats = JSON.parse(
              localStorage.getItem('progressStats') || '{}'
            );
            const updatedStats = {
              ...currentStats,
              timeSpent: (currentStats?.timeSpent || 0) + timeSpent,
              lastActiveDate: new Date().toISOString().split('T')[0],
            };
            localStorage.setItem('progressStats', JSON.stringify(updatedStats));
          }
        }
      } catch (err) {
        // Silently handle errors during cleanup
      }
    };
  }, [currentSessionId]);

  // Create a new chat session with defensive coding
  const createNewSession = useCallback(
    (subject?: string, difficulty?: DifficultyLevel): ChatSession => {
      try {
        const timestamp = Date.now();
        const sessionId = generateId();

        const newSession: ChatSession = {
          id: sessionId,
          title: 'New Chat',
          messages: [],
          createdAt: timestamp,
          updatedAt: timestamp,
          subject,
          difficulty,
        };

        // Safe update using functional pattern
        setSessions((prevSessions: ChatSession[]) => {
          // Handle case where prevSessions might be null/undefined
          const safeSessionsList = Array.isArray(prevSessions)
            ? prevSessions
            : [];
          return [newSession, ...safeSessionsList];
        });

        setCurrentSessionId(sessionId);
        sessionStartTime.current = timestamp;

        // Safe progress stats update with defensive coding
        setProgressStats((prev) => {
          const safePrev = prev || {
            totalSessions: 0,
            totalMessages: 0,
            timeSpent: 0,
            topicsExplored: [],
            favoriteSubjects: [],
            streakDays: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
          };

          return {
            ...safePrev,
            totalSessions: (safePrev.totalSessions || 0) + 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
          };
        });

        return newSession;
      } catch (err) {
        console.error('Error creating new session:', err);
        setError('Failed to create a new chat session');

        // Return a fallback session to prevent runtime errors
        return {
          id: generateId(),
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          subject,
          difficulty,
        };
      }
    },
    [setSessions, setProgressStats]
  );

  // Retry mechanism for API calls
  const retryApiCall = useCallback(
    async (
      requestFn: () => Promise<Response>,
      maxRetries: number = MAX_RETRIES
    ): Promise<Response> => {
      let lastError: Error | null = null;
      let attempts = 0;

      while (attempts <= maxRetries) {
        try {
          const response = await requestFn();
          return response;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          attempts++;

          if (attempts <= maxRetries) {
            // Exponential backoff
            const delay = RETRY_DELAY * Math.pow(2, attempts - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError || new Error('Failed after multiple attempts');
    },
    []
  );

  // Send a message with comprehensive error handling and state management
  const sendMessage = useCallback(
    async (
      content: string,
      subject?: string,
      difficulty?: DifficultyLevel
    ): Promise<void> => {
      // Input validation
      if (!content?.trim()) {
        console.warn('Attempted to send empty message');
        return;
      }

      // Reset retry count
      setRetryCount(0);

      // Clean up any previous pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      try {
        // Prepare session ID with defensive null checking
        let sessionId = currentSessionId;
        let sessionMessages: Message[] = [];

        if (currentSession && Array.isArray(currentSession.messages)) {
          sessionMessages = [...currentSession.messages]; // Create a copy to avoid reference issues
        } else {
          const newSession = createNewSession(subject, difficulty);
          sessionId = newSession.id;
          sessionMessages = [];

          // Wait a small amount of time to ensure the session is created in state
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Create user message
        const timestamp = Date.now();
        const messageId = generateId();

        const userMessage: Message = {
          id: messageId,
          content: content.trim(),
          role: 'user',
          timestamp,
        };

        // Optimistically add user message to session first
        const updatedMessages = [...sessionMessages, userMessage];

        // Add user message to session safely using functional state update
        setSessions((prevSessions: ChatSession[]) => {
          if (!Array.isArray(prevSessions)) {
            return [
              {
                id: sessionId as string,
                title:
                  content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                messages: [userMessage],
                createdAt: timestamp,
                updatedAt: timestamp,
                subject,
                difficulty,
              },
            ];
          }

          // Check if the session exists
          const sessionExists = prevSessions.some((s) => s.id === sessionId);

          if (!sessionExists) {
            return [
              {
                id: sessionId as string,
                title:
                  content.slice(0, 50) + (content.length > 50 ? '...' : ''),
                messages: [userMessage],
                createdAt: timestamp,
                updatedAt: timestamp,
                subject,
                difficulty,
              },
              ...prevSessions,
            ];
          }

          const updatedSessions = prevSessions.map((session) => {
            if (session?.id === sessionId) {
              const updatedMessages = [
                ...(Array.isArray(session.messages) ? session.messages : []),
                userMessage,
              ];

              return {
                ...session,
                messages: updatedMessages,
                updatedAt: timestamp,
                // Set title to first message if this is the first message
                title:
                  !session.messages || session.messages.length === 0
                    ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
                    : session.title,
              };
            }
            return session;
          });

          return updatedSessions;
        });

        // Update UI state
        setIsLoading(true);
        setError(null);

        // Setup API call with timeout
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const timeoutId = setTimeout(() => {
          if (controller && !controller.signal.aborted) {
            controller.abort('Request timeout');
          }
        }, API_TIMEOUT);

        timeoutIdRef.current = timeoutId; // Execute API call with retry logic
        try {
          const makeRequest = () =>
            fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: updatedMessages, // Use the local variable with both session messages and user message
                subject,
                difficulty,
              }),
              signal: controller.signal,
            });

          const response = await retryApiCall(makeRequest);

          // Clear timeout since request completed
          clearTimeout(timeoutId);
          timeoutIdRef.current = null;

          if (!response.ok) {
            // Get error details if available
            let errorMessage = `Server error: ${response.status}`;
            try {
              const errorData = await response.json();
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (parseError) {
              // Ignore JSON parsing errors
            }

            throw new Error(errorMessage);
          }

          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            throw new Error('Failed to parse server response');
          }

          if (data.error) {
            throw new Error(data.error);
          }

          if (!data.message) {
            throw new Error('Response missing message content');
          }

          // Create assistant message
          const assistantMessage: Message = {
            id: generateId(),
            content: data.message,
            role: 'assistant',
            timestamp: Date.now(),
          };

          // Add assistant message to session with defensive update
          setSessions((prevSessions: ChatSession[]) => {
            if (!Array.isArray(prevSessions)) {
              return [];
            }

            // Check if the session exists
            const sessionExists = prevSessions.some((s) => s.id === sessionId);
            if (!sessionExists) {
              return prevSessions;
            }

            return prevSessions.map((session) => {
              if (session?.id === sessionId) {
                // Get existing messages safely
                const existingMessages = Array.isArray(session.messages)
                  ? session.messages
                  : [];

                // Check if the user message is already in the session
                const hasUserMessage = existingMessages.some(
                  (msg) =>
                    msg.id === userMessage.id ||
                    (msg.role === 'user' && msg.content === userMessage.content)
                );

                // Create updated messages - ensure user message is included before assistant message
                const updatedMessages = [
                  ...existingMessages,
                  // Only add the user message if it's not already there
                  ...(hasUserMessage ? [] : [userMessage]),
                  assistantMessage,
                ];

                return {
                  ...session,
                  messages: updatedMessages,
                  updatedAt: Date.now(),
                };
              }
              return session;
            });
          });

          // Update progress stats safely
          try {
            const keywords = extractKeywords(content);

            setProgressStats((prev) => {
              const safePrev = prev || {
                totalSessions: 0,
                totalMessages: 0,
                timeSpent: 0,
                topicsExplored: [],
                favoriteSubjects: [],
                streakDays: 0,
                lastActiveDate: new Date().toISOString().split('T')[0],
              };

              return {
                ...safePrev,
                totalMessages: (safePrev.totalMessages || 0) + 2, // user + assistant
                topicsExplored: [
                  ...new Set([...(safePrev.topicsExplored || []), ...keywords]),
                ],
                favoriteSubjects: subject
                  ? [
                      ...new Set([
                        ...(safePrev.favoriteSubjects || []),
                        subject,
                      ]),
                    ]
                  : safePrev.favoriteSubjects || [],
                lastActiveDate: new Date().toISOString().split('T')[0],
              };
            });
          } catch (statsError) {
            // Don't fail the whole operation for stats update errors
          }
        } catch (apiError) {
          // Clear timeout if it's still active
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }

          // Set error message with defensive string conversion
          const errorMessage =
            apiError instanceof Error
              ? apiError.message
              : String(apiError) || 'Failed to get response';

          setError(errorMessage);

          // Add error message to chat for better UX
          const errorAssistantMessage: Message = {
            id: generateId(),
            content:
              'I apologize, but I encountered an error. Please try again or rephrase your question.',
            role: 'assistant',
            timestamp: Date.now(),
            isError: true,
          };

          setSessions((prevSessions: ChatSession[]) => {
            if (!Array.isArray(prevSessions)) return [];

            return prevSessions.map((session) => {
              if (session?.id === sessionId) {
                // Make sure we don't lose the user message when adding the error
                const existingMessages = Array.isArray(session.messages)
                  ? session.messages
                  : [];

                // Check if the user message is already in the session
                const hasUserMessage = existingMessages.some(
                  (msg) =>
                    msg.id === userMessage.id ||
                    (msg.role === 'user' && msg.content === userMessage.content)
                );

                return {
                  ...session,
                  messages: [
                    ...existingMessages,
                    // Only add the user message if it's not already there
                    ...(hasUserMessage ? [] : [userMessage]),
                    errorAssistantMessage,
                  ],
                  updatedAt: Date.now(),
                };
              }
              return session;
            });
          });

          // Check for network errors and notify the user appropriately
          if (
            apiError instanceof TypeError &&
            apiError.message.includes('network')
          ) {
            setError('Network error. Please check your internet connection.');
          }
        }
      } catch (unexpectedError) {
        // Handle unexpected errors to prevent app crashes
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        // Clean up resources
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      currentSessionId,
      currentSession,
      setSessions,
      setProgressStats,
      createNewSession,
      retryApiCall,
    ]
  );

  // Debounced version of sendMessage for UI responsiveness
  const debouncedSendMessage = useMemo(
    () => debounce(sendMessage, 300),
    [sendMessage]
  );

  // Delete a session with safety checks
  const deleteSession = useCallback(
    (sessionId: string) => {
      if (!sessionId) return;

      setSessions((prev: ChatSession[]) => {
        if (!Array.isArray(prev)) return [];
        return prev.filter((session) => session?.id !== sessionId);
      });

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    },
    [setSessions, currentSessionId]
  );

  // Load a session with validation
  const loadSession = useCallback(
    (sessionId: string) => {
      if (!sessionId) {
        return;
      }

      // Verify session exists before setting
      const sessionExists =
        Array.isArray(sessions) &&
        sessions.some((session) => session?.id === sessionId);

      if (sessionExists) {
        setCurrentSessionId(sessionId);
        sessionStartTime.current = Date.now();
      } else {
        setError(`Session not found`);
      }
    },
    [sessions]
  );

  // Bookmark a message with defensive coding
  const toggleMessageBookmark = useCallback(
    (messageId: string) => {
      if (!messageId) return;

      setSessions((prev: ChatSession[]) => {
        if (!Array.isArray(prev)) return [];

        return prev.map((session) => {
          if (!session || !Array.isArray(session.messages)) return session;

          return {
            ...session,
            messages: session.messages.map((message) => {
              if (message?.id === messageId) {
                return { ...message, isBookmarked: !message.isBookmarked };
              }
              return message;
            }),
          };
        });
      });
    },
    [setSessions]
  );

  // Clear all sessions with confirmation
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSessionId(null);

    // Reset session time tracking
    sessionStartTime.current = Date.now();
  }, [setSessions]);

  // Update session title
  const updateSessionTitle = useCallback(
    (sessionId: string, newTitle: string): void => {
      if (!sessionId || !newTitle.trim()) return;

      setSessions((prevSessions) => {
        // Handle case where prevSessions might be null/undefined
        const safeSessionsList = Array.isArray(prevSessions)
          ? prevSessions
          : [];

        return safeSessionsList.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              title: newTitle.trim(),
              updatedAt: Date.now(),
            };
          }
          return session;
        });
      });
    },
    [setSessions]
  );

  return {
    sessions,
    currentSession,
    currentSessionId,
    isLoading,
    error,
    createNewSession,
    sendMessage,
    debouncedSendMessage, // New debounced version
    deleteSession,
    loadSession,
    toggleMessageBookmark,
    clearAllSessions,
    setError,
    retryCount,
    updateSessionTitle, // Expose the update function
  };
}
