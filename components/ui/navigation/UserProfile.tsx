'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { getAllBadges } from '@/lib/firebase/firebase-types';
import { Badge3D, Badge3DStyles } from '@/components/ui/badges/Badge3D';
import Image from 'next/image';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, signOut, getUserStats } = useAuth();
  const { account } = useFirebase();
  const { badges } = useFirebase();
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'progress'>('stats');

  if (!isOpen || (!user && !account)) return null;

  // Use Firebase account data
  const stats = getUserStats();
  const level = account ? Math.floor((account.experience || 0) / 1000) + 1 : stats.level;
  const expProgress = account
    ? {
        current: (account.experience || 0) % 1000,
        next: 1000,
      }
    : null;
  const mainDemoProgress = account
    ? { completed: account.demosCompleted.length, total: 3 }
    : { completed: stats.totalDemosCompleted, total: 4 };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getLevelProgress = () => {
    if (account && expProgress) {
      return (expProgress.current / expProgress.next) * 100;
    }
    // For stats-based calculation, use modulo to get XP within current level
    const expInCurrentLevel = stats.experience % 1000;
    return (expInCurrentLevel / 1000) * 100;
  };

  const expPercentage =
    account && expProgress ? (expProgress.current / expProgress.next) * 100 : getLevelProgress();

  return (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      {/* Animated background */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute top-1/4 left-1/4 w-32 h-32 bg-brand-400/20 rounded-full animate-ping'></div>
        <div
          className='absolute top-1/3 right-1/4 w-24 h-24 bg-accent-400/20 rounded-full animate-ping'
          style={{ animationDelay: '0.5s' }}
        ></div>
        <div
          className='absolute bottom-1/3 left-1/3 w-28 h-28 bg-brand-500/20 rounded-full animate-ping'
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className='relative z-10 w-full max-w-2xl mx-4'>
        {/* Modal content */}
        <div className='bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden'>
          {/* Header */}
          <div className='relative p-6 border-b border-white/10'>
            <div className='absolute inset-0 bg-gradient-to-r from-brand-500/10 via-accent-500/15 to-brand-400/10'></div>

            <div className='relative z-10 flex items-center space-x-4'>
              {/* Avatar */}
              <div className='relative'>
                <Image
                  src='/images/logo/logoicon.png'
                  alt='User Avatar'
                  width={48}
                  height={48}
                  className='rounded-full border-2 border-brand-400'
                />
                <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-neutral-900'></div>
              </div>

              {/* User info */}
              <div className='flex-1'>
                <h2 className='text-xl font-bold text-white'>
                  {account?.displayName ||
                    (user ? user.customName || user.username : null) ||
                    (account
                      ? `${account.walletAddress.slice(0, 6)}...${account.walletAddress.slice(-4)}`
                      : 'Guest User')}
                </h2>
                <p className='text-white/70 text-sm'>
                  Level {level} • {account ? account.experience : stats.experience} XP
                </p>
                <p className='text-brand-300 text-xs font-mono'>
                  {user
                    ? `${user.walletAddress.slice(0, 12)}...${user.walletAddress.slice(-8)}`
                    : account
                      ? `${account.walletAddress.slice(0, 12)}...${account.walletAddress.slice(-8)}`
                      : 'No wallet connected'}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className='p-2 text-white/60 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className='flex border-b border-white/10'>
            {[
              { id: 'stats', label: '📊 Stats', icon: '📊' },
              { id: 'badges', label: '🏆 Badges', icon: '🏆' },
              { id: 'progress', label: '📈 Progress', icon: '📈' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-brand-300 border-b-2 border-brand-400 bg-white/5'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className='p-6'>
            {activeTab === 'stats' && (
              <div className='space-y-6'>
                {/* Level Progress */}
                <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-white font-semibold'>Level Progress</h3>
                    <span className='text-brand-300 text-sm'>Level {level}</span>
                  </div>
                  <div className='w-full bg-white/10 rounded-full h-3'>
                    <div
                      className='bg-gradient-to-r from-brand-500 to-accent-500 h-3 rounded-full transition-all duration-500'
                      style={{ width: `${expPercentage}%` }}
                    ></div>
                  </div>
                  <p className='text-white/70 text-xs mt-2'>
                    {account && expProgress
                      ? `${expProgress.current} / ${expProgress.next} XP`
                      : `${stats.experience} XP • Next level at ${stats.level * 500} XP`}
                  </p>
                </div>

                {/* Stats Grid - Consistent with RewardsSidebar */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='bg-white/5 rounded-lg p-4 border border-white/10 text-center'>
                    <div className='text-2xl font-bold text-green-300'>
                      {account ? account.totalPoints : stats.experience}
                    </div>
                    <div className='text-white/70 text-sm'>Total Points</div>
                  </div>
                  <div className='bg-white/5 rounded-lg p-4 border border-white/10 text-center'>
                    <div className='text-2xl font-bold text-yellow-300'>
                      {mainDemoProgress.completed} / {mainDemoProgress.total}
                    </div>
                    <div className='text-white/70 text-sm'>Demos Completed</div>
                  </div>
                  <div className='bg-white/5 rounded-lg p-4 border border-white/10 text-center'>
                    <div className='text-2xl font-bold text-indigo-300'>
                      {account ? account.badgesEarned.length : stats.badgesEarned}
                    </div>
                    <div className='text-white/70 text-sm'>Badges Earned</div>
                  </div>
                  <div className='bg-white/5 rounded-lg p-4 border border-white/10 text-center'>
                    <div className='text-2xl font-bold text-accent-300'>
                      {stats.totalTimeSpent ? formatTime(stats.totalTimeSpent) : '0m'}
                    </div>
                    <div className='text-white/70 text-sm'>Time Spent</div>
                  </div>
                </div>

                {/* Recent Badges - Consistent with RewardsSidebar */}
                <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
                  <h3 className='text-white font-semibold mb-3'>Recent Badges</h3>
                  <div className='space-y-2'>
                    {account &&
                      account.badgesEarned.slice(-3).map(badgeId => (
                        <div
                          key={badgeId}
                          className='flex items-center space-x-3 p-2 bg-black/20 rounded-lg'
                        >
                          <div className='w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-sm'>
                            🏆
                          </div>
                          <div className='flex-1'>
                            <div className='text-sm font-medium text-white'>
                              {badgeId.replace('_', ' ')}
                            </div>
                            <div className='text-xs text-gray-400'>Badge earned</div>
                          </div>
                          <div className='text-xs text-gray-300'>+10 pts</div>
                        </div>
                      ))}
                    {(!account || account.badgesEarned.length === 0) && (
                      <div className='text-center text-gray-400 py-4'>
                        Complete demos to earn badges!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div className='space-y-4'>
                {(() => {
                  // Only show badges if account exists (consistent with RewardsSidebar)
                  if (!account) {
                    return (
                      <div className='text-center py-8'>
                        <div className='text-4xl mb-4'>🏆</div>
                        <h3 className='text-white font-semibold mb-2'>Connect Account</h3>
                        <p className='text-white/70 text-sm'>
                          Connect your wallet to view your badges.
                        </p>
                      </div>
                    );
                  }

                  // Use exact same logic as RewardsSidebar
                  const earnedBadgeNames = account.badgesEarned;
                  const availableBadges = badges.length > 0 ? badges : getAllBadges();
                  const badgesWithStatus = availableBadges.map(badge => ({
                    ...badge,
                    createdAt: new Date(), // Add createdAt to make it a complete Badge
                    isEarned: earnedBadgeNames.includes(badge.name),
                    earnedAt: earnedBadgeNames.includes(badge.id)
                      ? new Date().toISOString()
                      : new Date().toISOString(),
                    rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
                    category: badge.category as 'demo' | 'milestone' | 'achievement' | 'special',
                  }));

                  const earnedCount = earnedBadgeNames.length;
                  const totalCount = availableBadges.length;

                  return (
                    <div className='space-y-4'>
                      {/* Badge Progress - Identical to RewardsSidebar */}
                      <div className='text-center mb-4'>
                        <div className='text-2xl font-bold text-white'>
                          {earnedCount} / {totalCount}
                        </div>
                        <div className='text-sm text-gray-400'>Badges Collected</div>
                        <div className='w-full bg-gray-700 rounded-full h-2 mt-2'>
                          <div
                            className='bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500'
                            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* 3D Badge Grid */}
                      <div className='grid grid-cols-1 gap-4 max-h-80 overflow-y-auto'>
                        {badgesWithStatus.map(badge => (
                          <Badge3D key={badge.id} badge={badge} size='md' compact={false} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className='space-y-4'>
                {(() => {
                  if (!account) {
                    return (
                      <div className='text-center py-8'>
                        <div className='text-4xl mb-4'>📈</div>
                        <h3 className='text-white font-semibold mb-2'>Connect Account</h3>
                        <p className='text-white/70 text-sm'>
                          Connect your wallet to view your demo progress.
                        </p>
                      </div>
                    );
                  }

                  // Only show the 4 main demos (same as used in demo completion counting)
                  const mainDemos = [
                    'hello-milestone',
                    'milestone-voting',
                    'dispute-resolution',
                    'micro-task-marketplace',
                  ];
                  const demoProgress = {}; // Demo progress not available in current Account structure

                  return (
                    <div className='space-y-3'>
                      {mainDemos
                        .map(demoId => {
                          const isCompleted = (() => {
                            if (!account.demosCompleted) return false;

                            // Handle both array and object formats for demosCompleted
                            if (Array.isArray(account.demosCompleted)) {
                              return account.demosCompleted.includes(demoId);
                            } else if (typeof account.demosCompleted === 'object') {
                              return Object.values(account.demosCompleted).includes(demoId);
                            }

                            return false;
                          })();
                          const pointsEarned = 0; // Not available in current structure

                          return (
                            <div
                              key={demoId}
                              className='bg-white/5 rounded-lg p-4 border border-white/10'
                            >
                              <div className='flex items-center justify-between mb-2'>
                                <h4 className='text-white font-semibold'>
                                  {demoId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    isCompleted
                                      ? 'bg-green-500/20 text-green-300'
                                      : 'bg-blue-500/20 text-blue-300'
                                  }`}
                                >
                                  {isCompleted ? 'Completed' : 'Available'}
                                </span>
                              </div>
                              <div className='flex items-center space-x-4 text-sm text-white/70'>
                                {pointsEarned > 0 && <span>Points: {pointsEarned}</span>}
                              </div>
                              {isCompleted && (
                                <p className='text-white/60 text-xs mt-2'>
                                  Completed: {new Date().toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='px-6 py-4 bg-white/5 border-t border-white/10'>
            <div className='flex items-center justify-between'>
              <div className='text-white/60 text-xs'>
                Member since{' '}
                {new Date(
                  account ? account.createdAt : user ? user.createdAt : new Date()
                ).toLocaleDateString()}
              </div>
              {user && (
                <button
                  onClick={signOut}
                  className='px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-all duration-200 text-sm'
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Badge3DStyles />
    </div>
  );
};
