'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import {
  leaderboardService,
  LeaderboardEntry,
  LeaderboardStats,
} from '@/lib/services/leaderboard-service';

// Utility function to format wallet address
const formatWalletAddress = (address: string): string => {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface LeaderboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardSidebar: React.FC<LeaderboardSidebarProps> = ({ isOpen, onClose }) => {
  const { walletData, isConnected } = useGlobalWallet();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardStats>({
    totalUsers: 0,
    topUsers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'around'>('global');
  const [usersAroundMe, setUsersAroundMe] = useState<LeaderboardEntry[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Load leaderboard data
  useEffect(() => {
    if (isOpen) {
      loadLeaderboardData();
    }
  }, [isOpen, isConnected, walletData?.publicKey]);

  const loadLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isConnected && walletData?.publicKey) {
        // Load leaderboard with current user context
        const data = await leaderboardService.getLeaderboardWithUser(walletData.publicKey, 10);
        setLeaderboardData(data);

        // Load users around current user
        const aroundUsers = await leaderboardService.getUsersAroundUser(walletData.publicKey, 5);
        setUsersAroundMe(aroundUsers);
      } else {
        // Load global leaderboard without user context
        const topUsers = await leaderboardService.getTopUsers(10);
        setLeaderboardData({
          totalUsers: 0, // We don't have total count without user context
          topUsers,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLeaderboard = () => {
    loadLeaderboardData();
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const medalEmoji = leaderboardService.getMedalEmoji(entry.rank);
    const rankColor = leaderboardService.getRankColor(entry.rank);

    return (
      <div
        key={entry.id}
        className={`relative group transition-all duration-300 hover:scale-105 ${
          entry.isCurrentUser
            ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/50 shadow-lg shadow-purple-400/25'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
        } rounded-xl p-4 mb-3`}
      >
        {/* Current user indicator */}
        {entry.isCurrentUser && (
          <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/20'>
            👤
          </div>
        )}

        <div className='flex items-center space-x-4'>
          {/* Rank with medal */}
          <div className={`flex-shrink-0 text-center ${rankColor}`}>
            <div className='text-2xl font-bold'>{medalEmoji}</div>
            <div className='text-xs opacity-75'>Rank #{entry.rank}</div>
          </div>

          {/* User info */}
          <div className='flex-1 min-w-0'>
            <div>
              <h4 className='font-bold text-white text-sm truncate'>{entry.displayName}</h4>
              <p className='text-xs text-gray-400 truncate'>
                {formatWalletAddress(entry.walletAddress)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className='flex-shrink-0 text-right'>
            <div className='text-lg font-bold text-yellow-400'>
              {entry.totalPoints.toLocaleString()}
            </div>
            <div className='text-xs text-gray-400'>points</div>
          </div>
        </div>

        {/* Additional stats row */}
        {/* <div className='mt-3 pt-3 border-t border-white/10'>
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div>
              <div className='text-sm font-semibold text-blue-400'>Lv.{entry.level}</div>
              <div className='text-xs text-gray-400'>Level</div>
            </div>
            <div>
              <div className='text-sm font-semibold text-green-400'>{entry.demosCompleted}</div>
              <div className='text-xs text-gray-400'>Demos</div>
            </div>
            <div>
              <div className='text-sm font-semibold text-purple-400'>{entry.badgesEarned}</div>
              <div className='text-xs text-gray-400'>Badges</div>
            </div>
          </div>
        </div> */}
      </div>
    );
  };

  const renderGlobalLeaderboard = () => {
    if (isLoading) {
      return (
        <div className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='bg-white/5 rounded-xl p-4 animate-pulse'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-white/10 rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-white/10 rounded w-3/4'></div>
                  <div className='h-3 bg-white/10 rounded w-1/2'></div>
                </div>
                <div className='w-16 h-8 bg-white/10 rounded'></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>⚠️</div>
          <div className='text-red-400 mb-2'>Failed to load leaderboard</div>
          <div className='text-sm text-gray-400 mb-4'>{error}</div>
          <button
            onClick={refreshLeaderboard}
            className='px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors'
          >
            Try Again
          </button>
        </div>
      );
    }

    if (leaderboardData.topUsers.length === 0) {
      return (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>🏆</div>
          <div className='text-white mb-2'>No players yet!</div>
          <div className='text-sm text-gray-400'>
            Be the first to complete demos and earn points!
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-2'>
        {leaderboardData.topUsers.map((entry, index) => renderLeaderboardEntry(entry, index))}
      </div>
    );
  };

  const renderAroundMeLeaderboard = () => {
    if (!isConnected) {
      return (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>🔗</div>
          <div className='text-white mb-2'>Connect Wallet</div>
          <div className='text-sm text-gray-400'>Connect your wallet to see your ranking!</div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='bg-white/5 rounded-xl p-4 animate-pulse'>
              <div className='flex items-center space-x-4'>
                <div className='w-12 h-12 bg-white/10 rounded-full'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-white/10 rounded w-3/4'></div>
                  <div className='h-3 bg-white/10 rounded w-1/2'></div>
                </div>
                <div className='w-16 h-8 bg-white/10 rounded'></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (usersAroundMe.length === 0) {
      return (
        <div className='text-center py-8'>
          <div className='text-4xl mb-4'>🎯</div>
          <div className='text-white mb-2'>Finding your position...</div>
          <div className='text-sm text-gray-400'>
            Complete some demos to appear on the leaderboard!
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-2'>
        {usersAroundMe.map((entry, index) => renderLeaderboardEntry(entry, index))}
      </div>
    );
  };

  const tabs = [
    { id: 'global', label: 'Global', icon: '🌍' },
    // { id: 'around', label: 'Around Me', icon: '🎯' },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40' />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className='fixed left-0 top-0 h-full w-96 bg-black/90 backdrop-blur-2xl border-r border-white/20 shadow-2xl z-50 overflow-hidden flex flex-col'
      >
        {/* Enhanced background effects */}
        <div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5'></div>
        <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5'></div>

        {/* Header */}
        <div className='relative z-10 flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center space-x-3'>
              <span className='text-3xl'>🏆</span>
              <span>Leaderboard</span>
            </h2>
            {leaderboardData.totalUsers > 0 && (
              <p className='text-sm text-gray-400 mt-1'>
                {leaderboardData.totalUsers.toLocaleString()} players total
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors text-2xl'
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className='relative z-10 flex border-b border-white/10 flex-shrink-0'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white bg-white/10 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className='flex items-center justify-center space-x-2'>
                <span className='text-lg'>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className='relative z-10 p-6 overflow-y-auto flex-1 min-h-0 leaderboard-scrollbar'>
          {activeTab === 'global' ? renderGlobalLeaderboard() : renderAroundMeLeaderboard()}
        </div>

        {/* Footer */}
        <div className='relative z-10 p-4 border-t border-white/10 bg-black/50 flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <button
              onClick={refreshLeaderboard}
              disabled={isLoading}
              className='px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center space-x-2'
            >
              <span>{isLoading ? '⏳' : '🔄'}</span>
              <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
            </button>

            {isConnected && leaderboardData.currentUserRank && (
              <div className='text-right'>
                <div className='text-sm text-white'>Your Rank</div>
                <div className='text-lg font-bold text-purple-400'>
                  #{leaderboardData.currentUserRank}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
