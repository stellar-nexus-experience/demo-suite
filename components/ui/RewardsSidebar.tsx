'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { getAllBadges } from '@/lib/firebase/firebase-types';
import { Badge3D, Badge3DStyles } from '@/components/ui/badges/Badge3D';
import { Tooltip } from '@/components/ui/Tooltip';
import { getBadgeColors, BADGE_COLORS } from '@/utils/constants/badges/assets';
import { TransactionList } from './transactions/TransactionList';
import { useTransactionHistory } from '@/contexts/data/TransactionContext';

interface RewardsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RewardsSidebar: React.FC<RewardsDropdownProps> = ({ isOpen, onClose }) => {
  const { account, badges } = useFirebase();
  const { transactions, isLoading, refreshTransactions } = useTransactionHistory();
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'transactions'>('overview');
  const [isMainAchievementsCollapsed, setIsMainAchievementsCollapsed] = useState(false);
  const [isNexusBadgesCollapsed, setIsNexusBadgesCollapsed] = useState(false);
  const [isExtraBadgesCollapsed, setIsExtraBadgesCollapsed] = useState(false);
  const [selectedCharacterPhase, setSelectedCharacterPhase] = useState(0); // 0: baby, 1: teen, 2: adult
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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


  // Helper functions for badge styling using centralized assets
  const getRarityColor = (rarity: string) => {
    const colors = BADGE_COLORS[rarity as keyof typeof BADGE_COLORS] || BADGE_COLORS.common;
    return colors.primary;
  };

  const getRarityTextColor = (rarity: string) => {
    const colors = BADGE_COLORS[rarity as keyof typeof BADGE_COLORS] || BADGE_COLORS.common;
    return colors.text;
  };

  const AVAILABLE_BADGES = badges.length > 0 ? badges : getAllBadges();

  // Only show when account exists - consistent with UserProfile
  // Note: Early return moved to after all hooks to avoid React hooks order violation

  // Ensure we have safe defaults for all data
  const safeAccount = {
    ...account,
    level: account?.level || 1,
    experience: account?.experience || 0,
    totalPoints: account?.totalPoints || 0,
    badgesEarned: (() => {
      if (Array.isArray(account?.badgesEarned)) {
        return account.badgesEarned;
      } else if (account?.badgesEarned && typeof account.badgesEarned === 'object') {
        // Convert object to array (Firebase sometimes stores arrays as objects)
        return Object.values(account.badgesEarned);
      }
      return [];
    })(),
    demosCompleted: (() => {
      if (Array.isArray(account?.demosCompleted)) {
        return account.demosCompleted;
      } else if (account?.demosCompleted && typeof account.demosCompleted === 'object') {
        // Convert object to array
        return Object.values(account.demosCompleted);
      }
      return [];
    })(),
  };

  // Initialize missing variables and functions
  const safePointsTransactions: any[] = []; // TODO: Implement points transactions

  // Helper functions for level and progress calculations
  const getLevel = () => {
    const currentExp = safeAccount.experience || 0;
    // Calculate level based on total XP: Level 1 = 0-999 XP, Level 2 = 1000-1999 XP, etc.
    return Math.floor(currentExp / 1000) + 1;
  };

  const getExperienceProgress = () => {
    const currentLevel = getLevel();
    const currentExp = safeAccount.experience || 0;
    
    // Calculate XP within current level (0-1000 for each level)
    const expInCurrentLevel = currentExp % 1000;
    
    return {
      current: expInCurrentLevel,
      next: 1000, // Each level requires 1000 XP
    };
  };

  const getMainDemoProgress = () => {
    const completedDemos = safeAccount.demosCompleted;
    let completedArray: string[] = [];

    if (Array.isArray(completedDemos)) {
      completedArray = completedDemos as string[];
    } else if (completedDemos && typeof completedDemos === 'object') {
      completedArray = Object.values(completedDemos) as string[];
    }

    // Filter out nexus-master from the count since it's not a real demo
    const mainDemosCompleted = completedArray.filter(demoId =>
      ['hello-milestone', 'dispute-resolution', 'micro-marketplace'].includes(demoId)
    );

    return {
      completed: mainDemosCompleted.length,
      total: 3, // Total number of main demos
    };
  };

  const level = getLevel();
  const expProgress = getExperienceProgress();
  const expPercentage = (expProgress.current / expProgress.next) * 100;
  const mainDemoProgress = getMainDemoProgress();

  // Character phase logic
  const getAvailableCharacterPhases = () => {
    const phases = [
      { id: 0, name: 'Trustless Scout', image: '/images/character/baby.png', minLevel: 1 },
      { id: 1, name: 'Blockchain Explorer', image: '/images/character/teen.png', minLevel: 5 },
      { id: 2, name: 'Stellar Expert', image: '/images/character/nexus-prime-chat.png', minLevel: 10 }
    ];
    return phases.filter(phase => level >= phase.minLevel);
  };

  const availablePhases = getAvailableCharacterPhases();
  const currentPhase = availablePhases[selectedCharacterPhase] || availablePhases[0];

  // Auto-select character phase based on level
  useEffect(() => {
    // Find the highest available phase based on current level
    const phases = [
      { id: 0, name: 'Trustless Scout', image: '/images/character/baby.png', minLevel: 1 },
      { id: 1, name: 'Blockchain Explorer', image: '/images/character/teen.png', minLevel: 5 },
      { id: 2, name: 'Stellar Expert', image: '/images/character/nexus-prime-chat.png', minLevel: 10 }
    ];
    
    // Find the highest phase the user has unlocked
    const unlockedPhases = phases.filter(phase => level >= phase.minLevel);
    const highestUnlockedPhase = unlockedPhases[unlockedPhases.length - 1];
    
    if (highestUnlockedPhase) {
      // Set the selected phase to the highest unlocked phase
      const phaseIndex = phases.findIndex(phase => phase.id === highestUnlockedPhase.id);
      if (phaseIndex !== -1) {
        setSelectedCharacterPhase(phaseIndex);
      }
    }
  }, [level]);

  const handlePreviousPhase = () => {
    setSelectedCharacterPhase(prev => {
      const newPhase = prev > 0 ? prev - 1 : availablePhases.length - 1;
      // Add visual feedback when changing phases
      return newPhase;
    });
  };

  const handleNextPhase = () => {
    setSelectedCharacterPhase(prev => {
      const newPhase = prev < availablePhases.length - 1 ? prev + 1 : 0;
      // Add visual feedback when changing phases
      return newPhase;
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'badges', label: 'Badges', icon: '🏆' },
    { id: 'transactions', label: 'History', icon: '📜' },
  ];

  const renderOverview = () => (
    <div className='space-y-6'>
      {/* Unified Character & Level Progress */}
      <div className='bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-indigo-400/30 relative overflow-hidden'>
        {/* Background Effects */}
        <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5'></div>
        <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-2xl'></div>
        <div className='absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-xl'></div>

        <div className='relative z-10 flex items-center gap-6'>
          {/* Character Avatar with Navigation */}
          <div className='flex-shrink-0'>
            <div className='relative'>
              {/* Navigation Arrows */}
              {availablePhases.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousPhase}
                    className='absolute -left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 border border-white/30 transition-all duration-200 hover:scale-110'
                    title={`Previous phase (${availablePhases[selectedCharacterPhase > 0 ? selectedCharacterPhase - 1 : availablePhases.length - 1]?.name})`}
                  >
                    <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextPhase}
                    className='absolute -right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 border border-white/30 transition-all duration-200 hover:scale-110'
                    title={`Next phase (${availablePhases[selectedCharacterPhase < availablePhases.length - 1 ? selectedCharacterPhase + 1 : 0]?.name})`}
                  >
                    <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                  </button>
                </>
              )}

              {/* Character Display */}
              {currentPhase && (
                <img
                  key={currentPhase.id} // Force re-render when phase changes
                  src={currentPhase.image}
                  alt={`${currentPhase.name} Character`}
                  className='w-32 h-32 object-cover drop-shadow-2xl rounded-full border-2 border-purple-400/30 transition-all duration-300 hover:scale-105'
                  style={{
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                  onError={(e) => {
                    console.warn('Image failed to load:', currentPhase.image);
                  }}
                />
              )}

              {/* Phase Indicator */}
              {availablePhases.length > 1 && (
                <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20'>
                  <div className='flex items-center gap-1'>
                    {availablePhases.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                          index === selectedCharacterPhase ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Glow Effect */}
              <div className='absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-lg scale-110'></div>
            </div>
            
            {/* Badge Display for Current Phase */}
            <div className='mt-3 flex flex-col items-center'>
              <div className='text-xs text-gray-400 mb-1'>Current Badge</div>
              <div className={`
                w-36 px-4 py-2 rounded-lg border-2 shadow-lg transition-all duration-300
                ${selectedCharacterPhase === 0 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50' : 
                  selectedCharacterPhase === 1 ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-400/50' : 
                  'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50'}
              `}>
                <div className='flex items-center gap-2'>
                  <span className='text-2xl'>
                    {selectedCharacterPhase === 0 ? '🌱' : selectedCharacterPhase === 1 ? '🚀' : '⭐'}
                  </span>
                  <div className='text-center'>
                    <div className={`text-sm font-bold transition-colors duration-300
                      ${selectedCharacterPhase === 0 ? 'text-green-300' : 
                        selectedCharacterPhase === 1 ? 'text-blue-300' : 
                        'text-purple-300'}
                    `}>
                      {currentPhase?.name || 'Trustless Scout'}
                    </div>
                    <div className='text-xs text-gray-400'>
                      {selectedCharacterPhase === 0 ? 'Level 1+' : selectedCharacterPhase === 1 ? 'Level 5+' : 'Level 10+'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress Info */}
          <div className='flex-1 min-w-0'>
            <div className='mb-4'>
              <h3 className='text-2xl font-bold text-white mb-1'>Lvl: {level}</h3>
              <p className='text-sm text-gray-300'>
                {expProgress.current} / {expProgress.next} XP
              </p>
            </div>

            {/* XP to Next Level */}
            <p className='text-xs text-gray-400'>
              <span className='text-brand-300 font-bold'>
                {expProgress.next - expProgress.current} XP
              </span>{' '}
              to next level!
            </p>
          </div>
        </div>

        {/* Full Width XP Progress Bar at Bottom */}
        <div className='relative z-10 mt-6'>
          <div className='w-full bg-gray-700/50 rounded-full h-6 border border-gray-600/30 overflow-hidden'>
            <div
              className='bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 h-6 rounded-full transition-all duration-700 ease-out relative'
              style={{ width: `${expPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse'></div>
            </div>
          </div>
          
          {/* Motivational Message */}
          <div className='mt-3 text-center'>
            <p className='text-xs text-gray-400 flex items-center justify-center gap-2'>
              {level < 5 ? (
                <>
                  <span className='text-purple-400 animate-pulse'>✨</span>
                  <span>Help <span className='text-purple-300 font-semibold'>Nexus Prime</span> evolve to Blockchain Explorer form! (Reach Level 5)</span>
                  <span className='text-purple-400 animate-pulse'>✨</span>
                </>
              ) : level < 10 ? (
                <>
                  <span className='text-blue-400 animate-pulse'>🌟</span>
                  <span>Keep going! Help <span className='text-blue-300 font-semibold'>Nexus Prime</span> reach Stellar Expert form! (Reach Level 10)</span>
                  <span className='text-blue-400 animate-pulse'>🌟</span>
                </>
              ) : (
                <>
                  <span className='text-cyan-400 animate-pulse'>👑</span>
                  <span><span className='text-cyan-300 font-semibold'>Nexus Prime</span> has reached Stellar Expert form! Keep earning XP to master the universe!</span>
                  <span className='text-cyan-400 animate-pulse'>👑</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Points Summary */}
      <div className='grid grid-cols-3 gap-3'>
        <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-400/30'>
          <div className='text-xl font-bold text-green-400'>{account?.totalPoints || 0}</div>
          <div className='text-xs text-gray-300'>Total Points</div>
        </div>
        <div className='bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-400/30'>
          <div className='text-xl font-bold text-yellow-400'>
            {mainDemoProgress?.completed ?? 0} / {mainDemoProgress?.total ?? 3}
          </div>
          <div className='text-xs text-gray-300'>Demos Completed</div>
        </div>
        <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-400/30'>
          <div className='text-xl font-bold text-purple-400'>
            {safeAccount.badgesEarned?.length || 0} / 9
          </div>
          <div className='text-xs text-gray-300'>Badges Earned</div>
        </div>
      </div>

      {/* Achievement Guide */}
      <div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-400/20 mt-4'>
        <h4 className='text-sm font-semibold text-blue-300 mb-2'>🎯 Top Achievements Guide</h4>
        <div className='text-xs text-gray-300 space-y-1'>
          <div>
            • <span>Account Creation</span> → Welcome Explorer
          </div>
          <div>
            • <span className='text-blue-300'>Complete Demo 1</span> → Escrow Expert
          </div>
          <div>
            • <span className='text-blue-300'>Complete Demo 2</span> → Trust Guardian
          </div>
          <div>
            • <span className='text-blue-300'>Complete Demo 3</span> → Stellar Champion
          </div>
          <div>
            • <span className='text-purple-300'>Complete Demos 1, 2, 3 </span> → Nexus Master
          </div>
        </div>
      </div>
    </div>
  );

  const renderBadges = () => {
    try {
      // Check which badges are earned by the user (using badgesEarned array)
      const earnedBadgeIds: string[] = Array.isArray(safeAccount.badgesEarned)
        ? (safeAccount.badgesEarned as string[])
        : [];

      const badgesWithStatus =
        AVAILABLE_BADGES?.map(badge => ({
          ...badge,
          createdAt: new Date(), // Add createdAt to make it a complete Badge
          isEarned: earnedBadgeIds.includes(badge.id),
          earnedAt: earnedBadgeIds.includes(badge.id)
            ? new Date().toISOString()
            : new Date().toISOString(),
          rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
          category: badge.category as 'demo' | 'milestone' | 'achievement' | 'special',
        })) || [];

      // Filter to only count the 3 main demo badges (exclude welcome_explorer and nexus_master)
      const mainDemoBadges =
        AVAILABLE_BADGES?.filter(badge =>
          ['escrow_expert', 'trust_guardian', 'stellar_champion'].includes(badge.id)
        ) || [];

      const earnedMainBadges = earnedBadgeIds.filter(badgeId =>
        ['escrow_expert', 'trust_guardian', 'stellar_champion'].includes(badgeId)
      );

      const earnedCount = earnedMainBadges.length;
      const totalCount = mainDemoBadges.length; // Should be 3
      const isAllMainBadgesEarned = earnedCount === 3; // All 3 main demo badges

      // Separate badges into categories
      const topBadges = ['welcome_explorer', 'escrow_expert', 'trust_guardian', 'stellar_champion', 'nexus_master'];
      const extraBadges = ['social_butterfly', 'hashtag_hero', 'discord_warrior', 'quest_master'];
      
      const earnedTopBadges = earnedBadgeIds.filter(id => topBadges.includes(id));
      const earnedExtraBadges = earnedBadgeIds.filter(id => extraBadges.includes(id));
      const allEarnedBadges = earnedBadgeIds.length;
      const allTotalBadges = AVAILABLE_BADGES.length;

      return (
        <div className='space-y-4'>
          {/* Top Badges Progress */}
          <div className='text-center mb-4'>
            <div className='flex items-center justify-center space-x-2 mb-2'>
              <div className='text-2xl font-bold text-white'>
                {earnedTopBadges.length} / {topBadges.length}
              </div>
              {earnedTopBadges.length === topBadges.length && (
                <div className='text-green-400 text-xl'>✅</div>
              )}
            </div>
            <div className='text-sm text-gray-400'>Top Badges</div>
            <div className='w-full bg-gray-700 rounded-full h-2 mt-2'>
              <div
                className='bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500'
                style={{ width: `${(earnedTopBadges.length / topBadges.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Completion Celebration */}
          {isAllMainBadgesEarned && (
            <div className='bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30 mb-4'>
              <div className='text-center'>
                <div className='text-4xl mb-2'>🎉</div>
                <div className='text-lg font-bold text-purple-300 mb-1'>Congratulations!</div>
                <div className='text-sm text-purple-200'>
                  You've completed the full Stellar Nexus Experience flow!
                </div>
                <div className='text-xs text-purple-300/80 mt-2'>
                  You've completed all 3 main demos and mastered the platform.
                </div>
              </div>
            </div>
          )}

          {/* Nexus Badges Section */}
          <div className='space-y-3'>
            <div
              className='flex items-center space-x-2 mb-3 cursor-pointer hover:bg-gray-800/30 rounded-lg p-2 transition-colors'
              onClick={e => {
                e.stopPropagation();
                setIsNexusBadgesCollapsed(!isNexusBadgesCollapsed);
              }}
            >
              <div className='w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full'></div>
              <h3 className='text-lg font-semibold text-white'>Nexus Badges</h3>
              <div className='bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2 py-1 rounded-full text-xs text-purple-300 border border-purple-400/30'>
                {
                  earnedBadgeIds.filter(badgeId =>
                    ['welcome_explorer', 'nexus_master'].includes(badgeId)
                  ).length
                }{' '}
                / 2
              </div>
              <div className='ml-auto'>
                {isNexusBadgesCollapsed ? (
                  <span className='text-gray-400 text-lg'>▶</span>
                ) : (
                  <span className='text-gray-400 text-lg'>▼</span>
                )}
              </div>
            </div>

            {!isNexusBadgesCollapsed && (
              <div className='space-y-2'>
                {badgesWithStatus
                  .filter(badge => ['welcome_explorer', 'nexus_master'].includes(badge.id))
                  .map(badge => (
                    <div key={badge.id} className='relative'>
                      <Tooltip
                        content={
                          <div className='text-center'>
                            <div className='text-lg font-bold text-white mb-1'>{badge.name}</div>
                            <div className='text-sm text-gray-300 mb-2'>{badge.description}</div>
                            <div className='text-xs text-cyan-300'>{badge.earningPoints} pts</div>
                          </div>
                        }
                        position='top'
                      >
                        <div>
                          <Badge3D badge={badge} size='sm' compact={true} />
                          {/* Nexus Badge Indicator */}
                          <div className='absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full border border-white/20'></div>
                        </div>
                      </Tooltip>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Demo Badges Section */}
          <div className='space-y-3'>
            <div
              className='flex items-center space-x-2 mb-3 cursor-pointer hover:bg-gray-800/30 rounded-lg p-2 transition-colors'
              onClick={e => {
                e.stopPropagation();
                setIsMainAchievementsCollapsed(!isMainAchievementsCollapsed);
              }}
            >
              <div className='w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full'></div>
              <h3 className='text-lg font-semibold text-white'>Demo Badges</h3>
              <div className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-2 py-1 rounded-full text-xs text-blue-300 border border-blue-400/30'>
                {earnedCount} / {totalCount}
              </div>
              <div className='ml-auto'>
                {isMainAchievementsCollapsed ? (
                  <span className='text-gray-400 text-lg'>▶</span>
                ) : (
                  <span className='text-gray-400 text-lg'>▼</span>
                )}
              </div>
            </div>

            {!isMainAchievementsCollapsed && (
              <div className='space-y-2'>
                {badgesWithStatus
                  .filter(badge =>
                    ['escrow_expert', 'trust_guardian', 'stellar_champion'].includes(badge.id)
                  )
                  .map(badge => (
                    <div key={badge.id} className='relative'>
                      <Tooltip
                        content={
                          <div className='text-center'>
                            <div className='text-lg font-bold text-white mb-1'>{badge.name}</div>
                            <div className='text-sm text-gray-300 mb-2'>{badge.description}</div>
                            <div className='text-xs text-cyan-300'>{badge.earningPoints} pts</div>
                          </div>
                        }
                        position='top'
                      >
                        <div>
                          <Badge3D badge={badge} size='sm' compact={true} />
                          {/* Demo Badge Indicator */}
                          <div className='absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border border-white/20'></div>
                        </div>
                      </Tooltip>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <hr className='my-4' />

          {/* All Badges Progress */}
          <div className='text-center mb-4'>
            <div className='text-lg font-bold text-white'>
              {allEarnedBadges} / {allTotalBadges}
            </div>
            <div className='text-sm text-gray-400'>Total Badges</div>
            <div className='w-full bg-gray-700 rounded-full h-1.5 mt-2'>
              <div
                className='bg-gradient-to-r from-blue-400 to-purple-500 h-1.5 rounded-full transition-all duration-500'
                style={{ width: `${(allEarnedBadges / allTotalBadges) * 100}%` }}
              />
            </div>
          </div>

          {/* Extra Badges Section */}
          <div className='space-y-3'>
            <div
              className='flex items-center space-x-2 mb-3 cursor-pointer hover:bg-gray-800/30 rounded-lg p-2 transition-colors'
              onClick={e => {
                e.stopPropagation();
                setIsExtraBadgesCollapsed(!isExtraBadgesCollapsed);
              }}
            >
              <div className='w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full'></div>
              <h3 className='text-lg font-semibold text-white'>Extra Badges</h3>
              <div className='bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-2 py-1 rounded-full text-xs text-green-300 border border-green-400/30'>
                {earnedExtraBadges.length} / {extraBadges.length}
              </div>
              <div className='ml-auto'>
                {isExtraBadgesCollapsed ? (
                  <span className='text-gray-400 text-lg'>▶</span>
                ) : (
                  <span className='text-gray-400 text-lg'>▼</span>
                )}
              </div>
            </div>

            {!isExtraBadgesCollapsed && (
              <div className='space-y-2'>
                {badgesWithStatus
                  .filter(badge => extraBadges.includes(badge.id))
                  .map(badge => (
                    <div key={badge.id} className='relative'>
                      <Tooltip
                        content={
                          <div className='text-center'>
                            <div className='text-lg font-bold text-white mb-1'>{badge.name}</div>
                            <div className='text-sm text-gray-300 mb-2'>{badge.description}</div>
                            <div className='text-xs text-cyan-300'>{badge.earningPoints} pts</div>
                          </div>
                        }
                        position='top'
                      >
                        <div>
                          <Badge3D badge={badge} size='sm' compact={true} />
                          {/* Extra Badge Indicator */}
                          <div className='absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border border-white/20'></div>
                        </div>
                      </Tooltip>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className='text-center py-8 text-red-400'>
          <div className='text-4xl mb-2'>⚠️</div>
          <div className='text-sm'>Error loading badges</div>
          <div className='text-xs mt-2 text-red-300'>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      );
    }
  };

  const renderTransactions = () => (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-lg font-semibold text-white'>Transaction History</div>
          <div className='text-sm text-gray-400'>{transactions.length} session transactions</div>
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            refreshTransactions();
          }}
          disabled={isLoading}
          className='px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50'
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Session Info Banner */}
      <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-3'>
        <div className='flex items-center space-x-2 mb-1'>
          <span className='text-blue-400 text-sm'>ℹ️</span>
          <span className='text-blue-300 text-sm font-medium'>Live Session Data</span>
        </div>
        <p className='text-blue-200/80 text-xs'>
          Transactions shown here are from your current browsing session and reset when you refresh
          the page.
        </p>
      </div>

      <div className='max-h-96 overflow-y-auto'>
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          showFilters={true}
          emptyMessage='No transactions in this session yet. Your demo interactions will appear here.'
        />
      </div>
    </div>
  );

  // Leaderboard functionality removed

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'badges':
        return renderBadges();
      case 'transactions':
        return renderTransactions();
      // Leaderboard functionality removed
      default:
        return renderOverview();
    }
  };

  // Early return if not open or no account to prevent unnecessary rendering
  if (!isOpen || !account) return null;

  return (
    <>
      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          onClick={e => e.stopPropagation()}
          className='absolute -right-20 mt-2 w-80 bg-black/80 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh]'
        >
          {/* Enhanced background blur overlay */}
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-3xl'></div>
          <div className='absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20'></div>

          {/* Header */}
          <div className='relative z-10 flex items-center justify-between p-4 border-b border-white/10'>
            <h2 className='text-xl font-bold text-white'>Nexus Account</h2>
            <button
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              className='text-gray-400 hover:text-white transition-colors'
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className='relative z-10 flex border-b border-white/10'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={e => {
                  e.stopPropagation();
                  setActiveTab(tab.id as any);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white bg-white/10 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className='flex flex-col items-center space-y-1'>
                  <span className='text-lg'>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className='relative z-10 p-4 overflow-y-auto max-h-[60vh]'>{renderContent()}</div>
        </div>
      )}
      <Badge3DStyles />
    </>
  );
};
