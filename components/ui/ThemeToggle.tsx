'use client';

import React from 'react';
import { useTheme } from '@/contexts/ui/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className='relative p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300 group'
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className='relative w-6 h-6'>
        {/* Sun Icon */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-75'
          }`}
        >
          <svg viewBox='0 0 24 24' fill='none' className='w-full h-full text-yellow-400'>
            <circle cx='12' cy='12' r='5' fill='currentColor' />
            <path
              d='M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            />
          </svg>
        </div>

        {/* Moon Icon */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-75'
          }`}
        >
          <svg viewBox='0 0 24 24' fill='none' className='w-full h-full text-blue-300'>
            <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' fill='currentColor' />
          </svg>
        </div>

        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            theme === 'light'
              ? 'bg-yellow-400/20 shadow-lg shadow-yellow-400/30'
              : 'bg-blue-400/20 shadow-lg shadow-blue-400/30'
          }`}
        />
      </div>

      {/* Tooltip */}
      <div className='absolute -top-12 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap'>
        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      </div>
    </button>
  );
};
