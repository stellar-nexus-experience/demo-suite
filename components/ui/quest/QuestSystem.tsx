'use client';

import React, { useState, useEffect } from 'react';
import { Quest, Account, getBadgeById } from '@/lib/firebase/firebase-types';
import { QuestService } from '@/lib/services/quest-service';
import { BadgeEmblem } from '@/components/ui/badges/BadgeEmblem';
import { getBadgeIcon, BADGE_SIZES } from '@/utils/constants/badges/assets';
import { useBadgeAnimation } from '@/contexts/ui/BadgeAnimationContext';

interface QuestSystemProps {
  account: Account | null;
  onQuestComplete?: (questId: string, rewards: any) => void;
  refreshAccountData?: () => Promise<void>;
}

export const QuestSystem: React.FC<QuestSystemProps> = ({
  account,
  onQuestComplete,
  refreshAccountData,
}) => {
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [questProgress, setQuestProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { showBadgeAnimation } = useBadgeAnimation();

  useEffect(() => {
    if (account) {
      loadQuestData();
    }
  }, [account]);

  const loadQuestData = () => {
    if (!account) return;

    const available = QuestService.getAvailableQuests(account);
    const completed = QuestService.getCompletedQuests(account);
    const progress = account.questProgress || {};

    setAvailableQuests(available);
    setCompletedQuests(completed);
    setQuestProgress(progress);
    setIsLoading(false);
  };

  const handleQuestComplete = async (quest: Quest) => {
    if (!account) return;

    try {
      const result = await QuestService.completeQuest(account, quest.id);

      if (result.success) {
        // Update local state immediately
        setCompletedQuests(prev => [...prev, quest.id]);

        // Remove from available quests (since it's now completed)
        setAvailableQuests(prev => prev.filter(q => q.id !== quest.id));

        // Show badge animation if quest rewards a badge
        if (quest.rewards.badgeId) {
          const badge = getBadgeById(quest.rewards.badgeId);
          if (badge) {
            // Create a Badge object with required properties
            const badgeForAnimation = {
              id: badge.id,
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              earnedAt: new Date().toISOString(),
              rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
              category: badge.category as 'demo' | 'milestone' | 'achievement' | 'special',
            };
            showBadgeAnimation(badgeForAnimation, badge.earningPoints);
          }
        }

        // Notify parent component
        if (onQuestComplete) {
          onQuestComplete(quest.id, result.rewards);
        }

        // Refresh account data to sync with Firebase
        if (refreshAccountData) {
          await refreshAccountData();
        }
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const getQuestStatus = (quest: Quest) => {
    if (completedQuests.includes(quest.id)) {
      return 'completed';
    }

    if (quest.requirements.count && quest.requirements.count > 1) {
      const progress = questProgress[quest.id] || 0;
      return progress >= quest.requirements.count ? 'ready' : 'in-progress';
    }

    // For manual verification quests, they are ready to be completed
    if (quest.requirements.verification === 'manual') {
      return 'ready';
    }

    return 'available';
  };

  const getQuestProgress = (quest: Quest) => {
    if (quest.requirements.count && quest.requirements.count > 1) {
      const progress = questProgress[quest.id] || 0;
      return { current: progress, total: quest.requirements.count };
    }
    return null;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'social':
        return '📱';
      case 'referral':
        return '👥';
      case 'community':
        return '🌟';
      case 'engagement':
        return '💬';
      default:
        return '🎯';
    }
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return '👥';
      case 'post':
        return '📝';
      case 'join':
        return '🚀';
      case 'refer':
        return '🎁';
      case 'complete':
        return '✅';
      default:
        return '🎯';
    }
  };

  const filteredQuests =
    selectedCategory === 'all'
      ? availableQuests
      : availableQuests.filter(quest => quest.category === selectedCategory);

  const categories = ['all', 'social', 'referral', 'community', 'engagement'];

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400'></div>
        <span className='ml-2 text-white/70'>Loading quests...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <p className='text-white/70'>
          Complete <span className='text-brand-200 font-semibold'>Nexus Quests</span> to earn XP,
          points, and special badges!
        </p>
      </div>

      {/* Quest Stats */}
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        <div className='bg-white/10 rounded-lg p-4 text-center'>
          <div className='text-2xl font-bold text-blue-400'>{availableQuests.length}</div>
          <div className='text-sm text-white/70'>Available</div>
        </div>
        <div className='bg-white/10 rounded-lg p-4 text-center'>
          <div className='text-2xl font-bold text-green-400'>{completedQuests.length}</div>
          <div className='text-sm text-white/70'>Completed</div>
        </div>
        <div className='bg-white/10 rounded-lg p-4 text-center col-span-2 md:col-span-1'>
          <div className='text-2xl font-bold text-purple-400'>
            <p>Nexus Quest Master</p>
          </div>
          <div className='text-sm text-white/70'>
            {completedQuests.length === 4 ? (
              <p>Thank you for your participation!</p>
            ) : (
              <p>Complete the full quest line will be highly apprecited!</p>
            )}
          </div>
        </div>
      </div>

      {/* Quest List - Compact Grid Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {filteredQuests.length === 0 ? (
          <div className='col-span-full text-center py-8'>
            <div className='text-4xl mb-4'>🔒</div>
            <h3 className='text-lg font-semibold text-white mb-2'>No Quests Available</h3>
            <p className='text-white/70'>
              Complete the main demos and earn the top 5 badges to unlock quests!
            </p>
          </div>
        ) : (
          filteredQuests.map(quest => {
            const status = getQuestStatus(quest);
            const progress = getQuestProgress(quest);
            const isCompleted = status === 'completed';
            const isReady = status === 'ready';
            const isInProgress = status === 'in-progress';

            return (
              <div
                key={quest.id}
                className={`bg-gradient-to-br from-white/10 to-white/5 rounded-lg p-4 border transition-all duration-300 hover:scale-[1.02] relative ${
                  isCompleted
                    ? 'border-green-400/50 bg-green-500/10 shadow-green-400/20 shadow-lg'
                    : isReady
                      ? 'border-yellow-400/50 bg-yellow-500/10'
                      : isInProgress
                        ? 'border-blue-400/50 bg-blue-500/10'
                        : 'border-white/20 hover:border-white/30'
                }`}
              >
                {/* Completion Overlay */}
                {isCompleted && (
                  <div className='absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10'>
                    <div className='text-center'>
                      <div className='flex items-center justify-center gap-2 text-green-400 text-sm font-medium mb-2'>
                        <span className='text-lg'>✅</span>
                        <span>Quest Completed!</span>
                      </div>
                      {quest.rewards.badgeId && (
                        <div className='flex items-center justify-center gap-2 text-yellow-300 text-xs mb-2'>
                          <BadgeEmblem id={quest.rewards.badgeId} size='sm' className='w-4 h-4' />
                          <span>Badge Earned!</span>
                        </div>
                      )}
                      <div className='flex items-center justify-center gap-3 text-xs text-green-300'>
                        <span>+{quest.rewards.experience} XP</span>
                        <span>+{quest.rewards.points} pts</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Quest Header - Compact */}
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <div className='text-xl'>{getQuestTypeIcon(quest.type)}</div>
                    <div>
                      <h3
                        className={`text-sm font-semibold leading-tight ${isCompleted ? 'text-green-300' : 'text-white'}`}
                      >
                        {quest.title}
                      </h3>
                      <div className='flex items-center gap-1 text-xs text-white/60'>
                        <span>{getCategoryIcon(quest.category)}</span>
                        <span className='capitalize'>{quest.category}</span>
                        {quest.isRepeatable && (
                          <span className='bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded text-xs ml-1'>
                            ↻
                          </span>
                        )}
                        {isCompleted && (
                          <span className='bg-green-500/20 text-green-300 px-1 py-0.5 rounded text-xs ml-1'>
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className='text-right'>
                    {isCompleted ? (
                      <div className='flex flex-col items-center gap-1'>
                        <div className='text-green-400 text-lg'>✅</div>
                        <div className='text-xs text-green-300 font-medium'>DONE</div>
                      </div>
                    ) : isReady ? (
                      <div className='text-yellow-400 text-lg'>🎁</div>
                    ) : isInProgress ? (
                      <div className='text-blue-400 text-lg'>⏳</div>
                    ) : (
                      <div className='text-white/60 text-lg'>🎯</div>
                    )}
                  </div>
                </div>

                {/* Quest Description - Compact */}
                <p className='text-xs text-white/70 mb-3 line-clamp-2'>{quest.description}</p>

                {/* Requirements - Compact */}
                <div className='bg-black/20 rounded p-2 mb-3'>
                  <div className='text-xs font-medium text-white/90 mb-1'>Task:</div>
                  <div className='text-xs text-white/70'>{quest.requirements.action}</div>
                  {quest.requirements.target && (
                    <div className='text-xs text-blue-300 mt-1'>
                      {quest.requirements.target.includes(' and ') ? (
                        // Handle multiple links
                        <div className='space-y-1'>
                          {quest.requirements.target.split(' and ').map((link, index) => (
                            <a
                              key={index}
                              href={link.trim()}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-400 hover:text-blue-300 underline block'
                            >
                              {link.trim()}
                            </a>
                          ))}
                        </div>
                      ) : quest.requirements.target.startsWith('http') ? (
                        <a
                          href={quest.requirements.target}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-400 hover:text-blue-300 underline truncate block'
                        >
                          {quest.requirements.target}
                        </a>
                      ) : (
                        <span className='truncate block'>{quest.requirements.target}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar - Compact */}
                {progress && (
                  <div className='mb-3'>
                    <div className='flex justify-between text-xs text-white/70 mb-1'>
                      <span>Progress</span>
                      <span>
                        {progress.current}/{progress.total}
                      </span>
                    </div>
                    <div className='w-full bg-white/20 rounded-full h-1.5'>
                      <div
                        className='bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300'
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Rewards - Compact */}
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-white/70'>Rewards:</span>
                    <span className='text-xs font-medium text-blue-400'>
                      +{quest.rewards.experience} XP
                    </span>
                    <span className='text-xs font-medium text-purple-400'>
                      +{quest.rewards.points} pts
                    </span>
                  </div>
                  {quest.rewards.badgeId && (
                    <div className='flex items-center gap-1'>
                      <BadgeEmblem id={quest.rewards.badgeId} size='sm' className='w-4 h-4' />
                      <div className='text-xs text-yellow-300'>
                        {(() => {
                          const badge = getBadgeById(quest.rewards.badgeId);
                          return badge ? `${badge.name} (+${badge.earningPoints} pts)` : '';
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Compact */}
                <div className='space-y-2'>
                  {isCompleted ? (
                    <hr />
                  ) : isReady ? (
                    <button
                      onClick={() => handleQuestComplete(quest)}
                      className='w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105'
                    >
                      Claim Reward
                    </button>
                  ) : quest.requirements.verification === 'manual' ? (
                    <div className='space-y-1'>
                      {quest.requirements.target && quest.requirements.target.includes(' and ') ? (
                        // Handle multiple links
                        <div className='space-y-1'>
                          {quest.requirements.target.split(' and ').map((link, index) => (
                            <a
                              key={index}
                              href={link.trim()}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='block w-full px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-medium rounded transition-all duration-200 hover:scale-105 text-center'
                            >
                              🔗 Open {index === 0 ? 'Trustless Work' : 'Stellar'}
                            </a>
                          ))}
                        </div>
                      ) : quest.requirements.target &&
                        quest.requirements.target.startsWith('http') ? (
                        <a
                          href={quest.requirements.target}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='block w-full px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-medium rounded transition-all duration-200 hover:scale-105 text-center'
                        >
                          🔗 Open Link
                        </a>
                      ) : null}
                      <button
                        onClick={() => handleQuestComplete(quest)}
                        className='w-full px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs font-medium rounded transition-all duration-200 hover:scale-105'
                      >
                        ✓ Mark Complete
                      </button>
                    </div>
                  ) : (
                    <div className='text-center text-white/60 text-xs py-2'>
                      <div className='text-lg mb-1'>⏳</div>
                      <div>In Progress</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
