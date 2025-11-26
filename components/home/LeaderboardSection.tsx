'use client';

import { Tooltip } from '@/components/ui/Tooltip';

interface LeaderboardSectionProps {
  onOpenLeaderboard: () => void;
}

export const LeaderboardSection = ({ onOpenLeaderboard }: LeaderboardSectionProps) => {
  return (
    <div data-leaderboard-section>
      {/* Leaderboard Button - Centered between Tutorial and Footer */}
      <div className='text-center mb-12 mt-20'>
        <h3 className='text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 mb-6 drop-shadow-2xl'>
          🏆 Global Leaderboard
        </h3>
        <p className='text-white/70'>
          See the top performers and compete for the Nexus Global Leaderboard!
        </p>
      </div>

      <div className='flex justify-center items-center px-4 mb-24'>
        <div className='relative animate-pulse hover:animate-none cursor-pointer'>
          {/* Pulsing Ring Animation */}
          <div className='absolute -inset-4 rounded-2xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-lg animate-ping opacity-75'></div>
          <div className='absolute -inset-2 rounded-xl bg-gradient-to-r from-purple-400/40 to-pink-400/40 blur-md animate-pulse opacity-60'></div>
          <div className='absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-300/50 to-pink-300/50 blur-sm animate-pulse opacity-40'></div>

          <Tooltip content='Join the Challenge!'>
            <button
              data-leaderboard-button
              onClick={onOpenLeaderboard}
              className='relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-white/20 hover:border-white/40 flex items-center space-x-3 hover:animate-none'
            >
              <span className='text-xl'>🏆 &nbsp;</span>
              <span>See the top performers</span>
              <span className='text-xl'>&nbsp;→</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
