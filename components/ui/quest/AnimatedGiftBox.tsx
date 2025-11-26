'use client';

import React, { useState } from 'react';

interface AnimatedGiftBoxProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedGiftBox: React.FC<AnimatedGiftBoxProps> = ({
  size = 'lg',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div
      className={`relative cursor-pointer group ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Gift Box Container */}
      <div className='relative w-full h-full'>
        {/* Gift Box Base */}
        <div className='absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110'>
          <svg viewBox='0 0 100 100' className='w-full h-full drop-shadow-lg'>
            {/* Gift Box Base */}
            <rect
              x='20'
              y='30'
              width='60'
              height='50'
              fill='#e74c3c'
              stroke='#c0392b'
              strokeWidth='2'
              rx='4'
              className='transition-all duration-300 group-hover:fill-red-400'
            />

            {/* Gift Box Lid */}
            <rect
              x='15'
              y='20'
              width='70'
              height='20'
              fill='#e74c3c'
              stroke='#c0392b'
              strokeWidth='2'
              rx='4'
              className='transition-all duration-500 ease-out group-hover:translate-y-[-10px] group-hover:fill-red-400'
              style={{
                transformOrigin: '50% 100%',
                transform: isOpen ? 'translateY(-15px) rotateX(-20deg)' : 'translateY(0)',
              }}
            />

            {/* Bow Ribbon - Vertical */}
            <rect
              x='48'
              y='10'
              width='4'
              height='30'
              fill='#f39c12'
              rx='2'
              className='transition-all duration-300'
            />

            {/* Bow Ribbon - Horizontal */}
            <rect
              x='35'
              y='25'
              width='30'
              height='4'
              fill='#f39c12'
              rx='2'
              className='transition-all duration-300'
            />

            {/* Bow Center */}
            <circle cx='50' cy='27' r='4' fill='#e67e22' />

            {/* Bow Loops */}
            <ellipse
              cx='42'
              cy='25'
              rx='6'
              ry='8'
              fill='#f39c12'
              className='transition-all duration-300'
            />
            <ellipse
              cx='58'
              cy='25'
              rx='6'
              ry='8'
              fill='#f39c12'
              className='transition-all duration-300'
            />
          </svg>
        </div>

        {/* Rewards Content - Shows when hovered */}
        <div
          className={`absolute inset-0 transition-all duration-500 ease-out ${
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
        >
          {/* Glowing Background */}
          <div className='absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-orange-400/30 to-red-400/20 rounded-full blur-lg animate-pulse'></div>

          {/* Rewards Items */}
          <div className='relative w-full h-full flex flex-col items-center justify-center space-y-1'>
            {/* Tech Icons */}
            <div className='flex space-x-1 mb-2'>
              <div className='text-lg animate-bounce' style={{ animationDelay: '0.1s' }}>
                ⚡
              </div>
              <div className='text-lg animate-bounce' style={{ animationDelay: '0.2s' }}>
                🔗
              </div>
              <div className='text-lg animate-bounce' style={{ animationDelay: '0.3s' }}>
                💎
              </div>
            </div>

            {/* Rewards Text */}
            <div className='text-xs font-bold text-white text-center leading-tight'>
              <div className='text-yellow-300'>XP</div>
              <div className='text-purple-300'>NFTs</div>
              <div className='text-cyan-300'>Tokens</div>
            </div>

            {/* Web3 Icons */}
            <div className='flex space-x-1 mt-2'>
              <div className='text-sm animate-pulse'>🌐</div>
              <div className='text-sm animate-pulse' style={{ animationDelay: '0.2s' }}>
                🚀
              </div>
              <div className='text-sm animate-pulse' style={{ animationDelay: '0.4s' }}>
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Sparkle Effects */}
        <div className='absolute inset-0 pointer-events-none'>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-yellow-300 rounded-full transition-all duration-700 ${
                isOpen ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: `${20 + i * 10}%`,
                top: `${20 + i * 8}%`,
                animationDelay: `${i * 0.1}s`,
                animation: isOpen ? 'sparkle 1.5s ease-in-out infinite' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Custom Sparkle Animation */}
      <style jsx>{`
        @keyframes sparkle {
          0%,
          100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
