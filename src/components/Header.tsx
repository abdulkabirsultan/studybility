import React from 'react';
import { ModeToggle } from './mode-toggle';
import Logo from './Logo';
export default function Header() {
  return (
    <header className='flex h-16 w-full bg-white dark:bg-gray-800 px-10 items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700'>
      <Logo />
      <ModeToggle />
    </header>
  );
}
