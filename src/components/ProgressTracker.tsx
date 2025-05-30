'use client';

import { useState, useEffect } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import {
  TrendingUp,
  MessageCircle,
  Clock,
  BookOpen,
  Target,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';

interface ProgressTrackerProps {
  stats: any;
  className?: string;
}

export function ProgressTracker({ stats, className }: ProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch by ensuring component only renders on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If not mounted (during server render), return a placeholder with same height
  if (!isMounted) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border p-4 animate-pulse',
          className
        )}
      >
        <div className='flex items-center justify-between mb-4'>
          <div className='h-5 bg-gray-200 dark:bg-gray-700 rounded w-40'></div>
          <div className='flex gap-2'>
            <div className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded'></div>
            <div className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded'></div>
          </div>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-4'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='h-20 bg-gray-200 dark:bg-gray-700 rounded'
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const exportProgress = () => {
    const progressData = {
      exportDate: new Date().toISOString(),
      ...stats,
      summary: {
        totalSessions: stats.totalSessions,
        totalMessages: stats.totalMessages,
        timeSpent: formatDuration(stats.timeSpent),
        topicsCount: stats.topicsExplored.length,
        subjectsCount: stats.favoriteSubjects.length,
      },
    };

    const blob = new Blob([JSON.stringify(progressData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-progress-${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progressCards = [
    {
      icon: MessageCircle,
      label: 'Total Messages',
      value: stats.totalMessages,
      color: 'text-blue-500',
    },
    {
      icon: BookOpen,
      label: 'Study Sessions',
      value: stats.totalSessions,
      color: 'text-green-500',
    },
    {
      icon: Clock,
      label: 'Time Spent',
      value: formatDuration(stats.timeSpent),
      color: 'text-purple-500',
    },
    {
      icon: Target,
      label: 'Topics Explored',
      value: stats.topicsExplored.length,
      color: 'text-orange-500',
    },
    {
      icon: Award,
      label: 'Streak Days',
      value: stats.streakDays,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border p-4',
        className
      )}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <TrendingUp size={20} className='text-blue-500' />
          <h3 className='font-semibold text-lg'>Learning Progress</h3>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={exportProgress}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            title='Export progress data'
            aria-label='Export your learning progress data'
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? 'Collapse progress details'
                : 'Expand progress details'
            }
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress Cards Grid */}
      <div className='grid grid-cols-2 md:grid-cols-3  gap-4 mb-4'>
        {progressCards.map((card, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg border bg-gray-50 dark:bg-gray-700/50',
              'text-center transition-transform hover:scale-105'
            )}
          >
            <card.icon size={24} className={cn('mx-auto mb-2', card.color)} />
            <div className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              {card.value}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-400'>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stats (Expandable) */}
      {isExpanded && (
        <div className='space-y-4 pt-4 border-t'>
          {/* Favorite Subjects */}
          {stats.favoriteSubjects.length > 0 && (
            <div>
              <h4 className='font-medium mb-2 flex items-center gap-2'>
                <BookOpen size={16} />
                Favorite Subjects
              </h4>
              <div className='flex flex-wrap gap-2'>
                {stats.favoriteSubjects
                  .slice(0, 6)
                  .map((subject: string, index: number) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs'
                    >
                      {subject}
                    </span>
                  ))}
                {stats.favoriteSubjects.length > 6 && (
                  <span className='px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs'>
                    +{stats.favoriteSubjects.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recent Topics */}
          {stats.topicsExplored.length > 0 && (
            <div>
              <h4 className='font-medium mb-2 flex items-center gap-2'>
                <Target size={16} />
                Recent Topics
              </h4>
              <div className='flex flex-wrap gap-2'>
                {stats.topicsExplored
                  .slice(-8)
                  .map((topic: string, index: number) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs'
                    >
                      {topic}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Study Streak */}
          <div className='flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg'>
            <div className='flex items-center gap-2'>
              <Calendar size={16} className='text-yellow-600' />
              <span className='font-medium'>Study Streak</span>
            </div>
            <div className='text-right'>
              <div className='text-2xl font-bold text-yellow-600'>
                {stats.streakDays}
              </div>
              <div className='text-xs text-gray-600 dark:text-gray-400'>
                {stats.streakDays === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center'>
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              {getMotivationalMessage(stats)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getMotivationalMessage(stats: any): string {
  const messages = [
    `Great job! You've had ${stats.totalSessions} study sessions. Keep up the excellent work!`,
    `Amazing! You've explored ${stats.topicsExplored.length} different topics. Your curiosity is inspiring!`,
    `Fantastic! You've spent ${stats.timeSpent} minutes learning. Every minute counts!`,
    `Wonderful! You've exchanged ${stats.totalMessages} messages. Learning through conversation is powerful!`,
    `Outstanding! Your ${stats.streakDays}-day study streak shows real dedication!`,
  ];

  if (stats.totalSessions === 0) {
    return "Welcome to your learning journey! Every expert was once a beginner. You've got this! 🌟";
  }

  if (stats.streakDays >= 7) {
    return "Incredible! A 7+ day streak shows amazing commitment. You're building excellent learning habits! 🔥";
  }

  if (stats.topicsExplored.length >= 10) {
    return "Wow! You're exploring so many topics. Your diverse learning approach is fantastic! 🚀";
  }

  return messages[Math.floor(Math.random() * messages.length)];
}
