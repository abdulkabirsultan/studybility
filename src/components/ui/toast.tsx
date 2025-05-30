'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { setGlobalToast } from '../ToastInitializer';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    message: string,
    type: ToastType = 'info',
    duration = 5000
  ): string => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Set the global toast function
  useEffect(() => {
    setGlobalToast(addToast);
    return () => setGlobalToast(null);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className='fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2 max-w-md w-full'>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div
      className={cn(
        'p-4 rounded-lg shadow-md flex items-start justify-between transition-all duration-300 ease-in-out',
        'transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-5',
        {
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200':
            toast.type === 'info',
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200':
            toast.type === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200':
            toast.type === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200':
            toast.type === 'error',
        }
      )}
      role='alert'
    >
      <div className='mr-2 flex-1'>{toast.message}</div>
      <button
        onClick={onClose}
        className={cn(
          'p-1 rounded-full hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2',
          {
            'hover:bg-blue-200 focus:ring-blue-500': toast.type === 'info',
            'hover:bg-green-200 focus:ring-green-500': toast.type === 'success',
            'hover:bg-yellow-200 focus:ring-yellow-500':
              toast.type === 'warning',
            'hover:bg-red-200 focus:ring-red-500': toast.type === 'error',
          }
        )}
        aria-label='Close notification'
      >
        <X size={14} />
      </button>
    </div>
  );
}
