'use client';

import React, { useState } from 'react';
import { Account } from '@/lib/firebase/firebase-types';
import { QuestService } from '@/lib/services/quest-service';
import { QuestSystem } from './QuestSystem';
import { BadgeEmblem } from '@/components/ui/badges/BadgeEmblem';
import { Tooltip } from '../Tooltip';
import { AnimatedGiftBox } from './AnimatedGiftBox';
import Image from 'next/image';

interface QuestAndReferralSectionProps {
  account: Account | null;
  onQuestComplete?: (questId: string, rewards: any) => void;
  refreshAccountData?: () => Promise<void>;
}

export const QuestAndReferralSection: React.FC<QuestAndReferralSectionProps> = ({
  account,
  onQuestComplete,
  refreshAccountData,
}) => {
  if (!account) {
    return (
      <div className='text-center py-16'>
        <div className='text-4xl mb-4'>🔒</div>
        <h3 className='text-xl font-semibold text-white mb-2'>Connect Your Wallet</h3>
        <p className='text-white/70'>
          Connect your Stellar wallet to access quests and earn rewards
        </p>
        <br />
        <Tooltip content='Complete The Top 5 Badges to Unlock Nexus Quests' position='bottom'>
          <div className='flex justify-center mb-6'>
            <AnimatedGiftBox size='lg' />
          </div>
        </Tooltip>
      </div>
    );
  }

  const isQuestSystemUnlocked = QuestService.isQuestSystemUnlocked(account);

  if (!isQuestSystemUnlocked) {
    return (
      <div className='text-center py-16'>
        <div className='text-6xl mb-6'>🔒</div>
        <h3 className='text-2xl font-bold text-white mb-4'>Quest System Locked</h3>
        <p className='text-white/70 mb-6 max-w-2xl mx-auto'>
          Complete the main demos and earn the top 5 badges to unlock the quest system!
        </p>

        {/* Progress Indicator */}
        <div className='bg-white/10 rounded-xl p-6 max-w-md mx-auto'>
          <h4 className='text-lg font-semibold text-white mb-4'>Required Badges</h4>
          <div className='space-y-3'>
            {[
              { id: 'welcome_explorer', name: 'Welcome Explorer' },
              { id: 'escrow_expert', name: 'Escrow Expert' },
              { id: 'trust_guardian', name: 'Trust Guardian' },
              { id: 'stellar_champion', name: 'Stellar Champion' },
              { id: 'nexus_master', name: 'Nexus Master' },
            ].map(badge => {
              // Handle both array and object formats for badgesEarned
              let badgesEarnedArray: string[] = [];
              if (Array.isArray(account.badgesEarned)) {
                badgesEarnedArray = account.badgesEarned;
              } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
                badgesEarnedArray = Object.values(account.badgesEarned);
              }

              const hasBadge = badgesEarnedArray.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    hasBadge
                      ? 'bg-green-500/20 border border-green-400/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className='flex items-center justify-center w-8 h-8'>
                    <BadgeEmblem
                      id={badge.id}
                      size='sm'
                      className={hasBadge ? 'text-green-400' : 'text-white/50'}
                    />
                  </div>
                  <div className='flex-1'>
                    <div className={`font-medium ${hasBadge ? 'text-green-300' : 'text-white/70'}`}>
                      {badge.name}
                    </div>
                  </div>
                  <div className={`text-2xl ${hasBadge ? 'text-green-400' : 'text-white/30'}`}>
                    {hasBadge ? '✅' : '⏳'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className='mt-4 pt-4 border-t border-white/10'>
            <div className='text-sm text-white/60 text-center'>
              Progress:{' '}
              {
                [
                  'welcome_explorer',
                  'escrow_expert',
                  'trust_guardian',
                  'stellar_champion',
                  'nexus_master',
                ].filter(badgeId => {
                  let badgesEarnedArray: string[] = [];
                  if (Array.isArray(account.badgesEarned)) {
                    badgesEarnedArray = account.badgesEarned;
                  } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
                    badgesEarnedArray = Object.values(account.badgesEarned);
                  }
                  return badgesEarnedArray.includes(badgeId);
                }).length
              }
              /5 badges earned
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has earned the Quest Master badge
  let badgesEarnedArray: string[] = [];
  if (Array.isArray(account.badgesEarned)) {
    badgesEarnedArray = account.badgesEarned;
  } else if (account.badgesEarned && typeof account.badgesEarned === 'object') {
    badgesEarnedArray = Object.values(account.badgesEarned);
  }
  const hasQuestMasterBadge = badgesEarnedArray.includes('quest_master');

  return (
    <div className='space-y-6'>
      <QuestSystem
        account={account}
        onQuestComplete={onQuestComplete}
        refreshAccountData={refreshAccountData}
      />

      {/* Quest Master Congratulations Message */}
      {hasQuestMasterBadge && (
        <div className='relative overflow-hidden bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-400/50 rounded-2xl p-8 shadow-2xl'>
          {/* Animated background effects */}
          <div className='absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-400/10 animate-pulse'></div>

          <div className='relative z-10 text-center'>
            {/* Main Message */}
            <h2 className='text-3xl font-bold text-white mb-3 drop-shadow-lg'>
              Congratulations, Quest Master!
            </h2>

            <p className='text-lg text-white/90 mb-2 max-w-2xl mx-auto'>
              You've successfully completed the entire Nexus Experience journey!
            </p>

            <p className='text-base text-white/80 mb-6 max-w-2xl mx-auto'>
              Thank you for exploring our demos, mastering trustless work concepts, and engaging
              with the community. You're now equipped with the knowledge to build amazing Web3
              applications!
            </p>

            {/* Call to Action - 3 Columns */}
            <div className='mb-4'>
              <h3 className='text-2xl font-bold text-white mb-4 text-center'>🚀 Ready to Build?</h3>

              <div className='grid md:grid-cols-3 gap-4'>
                {/* Box 1: Starter Kits */}
                <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30 hover:border-green-400/50 transition-all duration-300 flex flex-col relative'>
                  {/* Coming Soon Badge */}
                  <div className='absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                    Coming Soon
                  </div>

                  <div className='text-center mb-3'>
                    <div className='text-4xl mb-2 flex justify-center items-center'>
                      <Image
                        src='/images/icons/docs.png'
                        alt='Nexus Starter Kits'
                        width={50}
                        height={50}
                        style={{ width: 'auto', height: 'auto' }}
                        className='rounded-full'
                      />
                    </div>
                    <h4 className='text-lg font-bold text-white mb-2'>Nexus Starter Kits</h4>
                    <p className='text-white/80 text-sm mb-4 flex-1'>
                      Download comprehensive templates to build trustless work applications on
                      Stellar blockchain
                    </p>
                  </div>
                  <a
                    href='/docs'
                    className='mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm'
                  >
                    <span>Explore Kits</span>
                    <span>→</span>
                  </a>
                </div>

                {/* Box 2: Referral Card */}
                <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 flex flex-col'>
                  <div className='text-center mb-3'>
                    <div className='text-4xl mb-2 flex justify-center items-center'>
                      <Image
                        src='/images/icons/demos.png'
                        alt='Share & Invite'
                        width={50}
                        height={50}
                        style={{ width: 'auto', height: 'auto' }}
                        className='rounded-full'
                      />
                    </div>
                    <h4 className='text-lg font-bold text-white mb-2'>Share & Invite</h4>
                    <p className='text-white/80 text-sm mb-4 flex-1'>
                      Download your custom referral card and invite friends to join the Nexus
                      Experience
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Dispatch custom event to open user dropdown and referral center
                      window.dispatchEvent(new CustomEvent('openReferralCenter'));
                    }}
                    className='mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm'
                  >
                    <span>Open Referral Center</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Box 3: Web3 Playground */}
                <div className='bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 flex flex-col'>
                  <div className='text-center mb-3'>
                    <div className='text-4xl mb-2 flex justify-center items-center'>
                      <Image
                        src='/images/icons/console.png'
                        alt='Web3 Playground'
                        width={50}
                        height={50}
                        style={{ width: 'auto', height: 'auto' }}
                        className='rounded-full'
                      />
                    </div>
                    <h4 className='text-lg font-bold text-white mb-2'>Web3 Playground</h4>
                    <p className='text-white/80 text-sm mb-4 flex-1'>
                      Explore interactive Web3 games and challenges to level up your blockchain
                      skills
                    </p>
                  </div>
                  <a
                    href='/mini-games'
                    className='mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm'
                  >
                    <span>Play Now</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <p className='text-xs text-white/60'>
              Continue exploring demos, invite friends, and keep building! The Web3 journey never
              ends. 🌟
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
