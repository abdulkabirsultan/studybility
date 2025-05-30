'use client';
import { cn } from '@/lib/utils';
import { PlusIcon, SettingsIcon } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatBox from './ChatBox';
import { PreferencesProvider } from '@/contexts/PreferencesContext';

export default function Chat() {
  return (
    <PreferencesProvider>
      <article className='flex h-full overflow-hidden'>
        <ChatSidebar />
        <ChatBox />
      </article>
    </PreferencesProvider>
  );
}
