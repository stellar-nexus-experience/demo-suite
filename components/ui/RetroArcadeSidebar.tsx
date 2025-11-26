'use client';

import { useState } from 'react';
import { Tooltip } from './Tooltip';

interface GameOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: string;
}

interface RetroArcadeSidebarProps {
  games: GameOption[];
  selectedGame: string;
  isFullscreen: boolean;
  onGameSelect: (gameId: string) => void;
  onFullscreenToggle: () => void;
}

export default function RetroArcadeSidebar({
  games,
  selectedGame,
  isFullscreen,
  onGameSelect,
  onFullscreenToggle,
}: RetroArcadeSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className='fixed left-4 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block'>
      <div className='relative'>
        {/* Arcade Cabinet Base */}
        <div
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-4 bg-gradient-to-r from-slate-700 to-slate-800 rounded-b-2xl transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-72'
          }`}
        ></div>
        <div
          className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-2 bg-gradient-to-r from-slate-600 to-slate-700 rounded-b-xl transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        ></div>

        {/* Main Arcade Panel */}
        <div
          className={`bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-3xl border-4 border-cyan-400 shadow-2xl shadow-cyan-400/50 p-6 relative transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-80'
          }`}
          style={{ maxHeight: isCollapsed ? '22vh' : '65vh', marginTop: '-100px' }}
        >
          {/* Arcade Screen Glow */}
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/10 via-purple-400/5 to-pink-400/10 opacity-50'></div>

          {/* Content */}
          <div className='relative z-10 h-full flex flex-col'>
            {/* Collapse/Expand Button */}
            <div className='absolute right-2 z-20 -mt-10'>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-sm rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg border-2 border-cyan-400'
                title={isCollapsed ? 'Expand Game Selector' : 'Collapse Game Selector'}
              >
                {isCollapsed ? '▶️' : '◀️'}
              </button>
            </div>

            {/* Collapsed State Indicator */}
            {isCollapsed && (
              <div className='text-center mt-8 -ml-2'>
                <div className='text-2xl mb-2'>🎮</div>
                <div className='text-cyan-400 text-xs font-bold'>Game Selector</div>
              </div>
            )}

            {/* Arcade Cabinet Header */}
            <div
              className={`text-center mb-4 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
            >
              <div className='text-4xl mb-2'>🎮</div>
              <h3 className='text-xl font-bold text-cyan-400 mb-1'>GAME SELECTOR</h3>
              <p className='text-white/60 text-sm'>Choose Your Adventure</p>
            </div>

            {/* Game List - Scrollable Container */}
            <div
              className={`flex-1 overflow-y-auto overflow-x-hidden pr-2 transition-all duration-300 ${isCollapsed ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#22d3ee #1e293b',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: rgba(30, 41, 59, 0.5);
                  border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #22d3ee;
                  border-radius: 10px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #06b6d4;
                }
              `}</style>
              <div className='space-y-3 pb-4'>
                {games.map(gameOption => (
                  <Tooltip
                    key={gameOption.id}
                    content={
                      <div>
                        <p className='text-white/90 text-sm font-medium'>{gameOption.title}</p>
                        <p className='text-cyan-300 text-xs mt-1'>{gameOption.subtitle}</p>
                        <div className='mt-2 pt-2 border-t border-white/10'>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              gameOption.status === 'available'
                                ? 'bg-green-500/20 text-green-300 border border-green-400/50'
                                : gameOption.status === 'beta'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50'
                                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50'
                            }`}
                          >
                            {gameOption.status}
                          </span>
                        </div>
                      </div>
                    }
                    position='bottom'
                  >
                    <div
                      onClick={() => onGameSelect(gameOption.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        gameOption.id === selectedGame
                          ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-400/25'
                          : 'border-white/20 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-400/5'
                      }`}
                    >
                      <div className='flex items-center space-x-3'>
                        <div className='text-2xl'>{gameOption.icon}</div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-bold text-white text-sm truncate'>
                            {gameOption.title}
                          </h4>
                          <p className='text-white/60 text-xs truncate'>{gameOption.subtitle}</p>
                        </div>
                        <div className='text-right flex-shrink-0'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              gameOption.status === 'available'
                                ? 'bg-green-500/20 text-green-300'
                                : gameOption.status === 'beta'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {gameOption.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
