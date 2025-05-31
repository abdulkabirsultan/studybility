'use client';

import { useState, memo, useCallback } from 'react';
import { Message } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Bookmark,
  BookmarkCheck,
  Volume2,
  VolumeX,
  Copy,
  Check,
  User,
  Bot,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  onBookmark?: (messageId: string) => void;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
  className?: string;
}

// Custom comparison function to prevent unnecessary rerenders
function arePropsEqual(
  prevProps: MessageBubbleProps,
  nextProps: MessageBubbleProps
) {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isBookmarked === nextProps.message.isBookmarked &&
    prevProps.message.isError === nextProps.message.isError &&
    prevProps.isSpeaking === nextProps.isSpeaking
  );
}

// Use memo to prevent unnecessary re-renders
export const MessageBubble = memo(function MessageBubbleComponent({
  message,
  onBookmark,
  onSpeak,
  isSpeaking,
  className,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  // Add message validation
  if (!message || typeof message !== 'object') {
    return null;
  }

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isError = !!message.isError;

  // Use useCallback to prevent recreation of handler functions on each render
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silent error - don't log to console in production
    }
  }, [message.content]);

  const handleSpeak = useCallback(() => {
    if (onSpeak) {
      onSpeak(message.content);
    }
  }, [onSpeak, message.content]);

  const handleBookmark = useCallback(() => {
    if (onBookmark) {
      onBookmark(message.id);
    }
  }, [onBookmark, message.id]);

  return (
    <div
      className={cn(
        'group relative flex w-full gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
      role='article'
      aria-label={`${isUser ? 'Your' : 'AI assistant'} message`}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full',
          isUser
            ? 'bg-blue-500 text-white'
            : isError
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
        )}
        aria-hidden='true'
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            'relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
            'break-words hyphens-auto',
            isUser
              ? 'bg-blue-500 text-white'
              : isError
              ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
            'shadow-sm'
          )}
        >
          {isAssistant ? (
            <ReactMarkdown
              // className="whitespace-pre-wrap"
              rehypePlugins={[rehypeHighlight]}
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      margin: '1rem 0',
                    }}
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                      margin: '0.75rem 0',
                    }}
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 'bold',
                      margin: '0.5rem 0',
                    }}
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ marginBottom: '0.75rem' }} {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    style={{
                      paddingLeft: '1.5rem',
                      marginBottom: '1rem',
                      listStyleType: 'disc',
                    }}
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    style={{
                      paddingLeft: '1.5rem',
                      marginBottom: '1rem',
                      listStyleType: 'decimal',
                    }}
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginBottom: '0.25rem' }} {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code
                    style={{
                      display: 'block',
                      overflow: 'auto',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '0.3rem',
                      fontFamily: 'monospace',
                    }}
                    {...props}
                  />
                ),
                pre: ({ node, ...props }) => (
                  <pre
                    style={{
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '0.3rem',
                      overflow: 'auto',
                    }}
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                    {...props}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className='whitespace-pre-wrap'>{message.content}</div>
          )}
        </div>

        {/* Message Actions and Timestamp */}
        <div
          className={cn(
            'mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100',
            'focus-within:opacity-100',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Timestamp */}
          <span
            className='text-xs text-gray-500 dark:text-gray-400'
            title={new Date(message.timestamp).toLocaleString()}
          >
            {formatTimestamp(message.timestamp)}
          </span>

          {/* Action Buttons */}
          <div className='flex items-center gap-1'>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={cn(
                'rounded p-1 transition-colors',
                'hover:bg-gray-200 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              title={copied ? 'Copied!' : 'Copy message'}
              aria-label={
                copied ? 'Message copied' : 'Copy message to clipboard'
              }
            >
              {copied ? (
                <Check size={14} className='text-green-500' />
              ) : (
                <Copy size={14} className='text-gray-500' />
              )}
            </button>{' '}
            {/* Text-to-Speech Button */}
            {onSpeak && (
              <button
                onClick={handleSpeak}
                className={cn(
                  'rounded p-1 transition-colors',
                  'hover:bg-gray-200 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isSpeaking ? 'text-blue-500' : 'text-gray-500'
                )}
                title={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                aria-label={
                  isSpeaking
                    ? 'Stop speaking this message'
                    : 'Read message aloud'
                }
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
            {/* Bookmark Button (only for assistant messages) */}
            {isAssistant && onBookmark && (
              <button
                onClick={handleBookmark}
                className={cn(
                  'rounded p-1 transition-colors',
                  'hover:bg-gray-200 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  message.isBookmarked ? 'text-yellow-500' : 'text-gray-500'
                )}
                title={
                  message.isBookmarked ? 'Remove bookmark' : 'Bookmark message'
                }
                aria-label={
                  message.isBookmarked
                    ? 'Remove bookmark from this message'
                    : 'Bookmark this message'
                }
              >
                {message.isBookmarked ? (
                  <BookmarkCheck size={14} />
                ) : (
                  <Bookmark size={14} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
},
arePropsEqual);
