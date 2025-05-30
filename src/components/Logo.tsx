import React from 'react';

export default function Logo() {
  return (
    <div className='flex items-center'>
      <h1 className={'text-2xl font-bold'}>
        <span className=' bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent'>
          Study
        </span>
        <span className='text-foreground'>Bility</span>
      </h1>
    </div>
  );
}
