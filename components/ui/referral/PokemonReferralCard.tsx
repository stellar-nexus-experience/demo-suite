'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Account } from '@/lib/firebase/firebase-types';
import { useToast } from '@/contexts/ui/ToastContext';
import { BadgeEmblem } from '@/components/ui/badges/BadgeEmblem';
import { UserAvatar } from '@/components/ui/navigation/UserAvatar';
import { leaderboardService } from '@/lib/services/leaderboard-service';
import { UserAccount } from '@/utils/types/account';

interface PokemonReferralCardProps {
  account: UserAccount | Account | null;
  className?: string;
}

export const PokemonReferralCard: React.FC<PokemonReferralCardProps> = ({
  account,
  className = '',
}) => {
  const { addToast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(0); // 0: explorer, 1: mid-level, 2: expert
  const [selectedLayout, setSelectedLayout] = useState(0); // 0: classic, 1: modern, 2: minimal
  const [userRanking, setUserRanking] = useState<number | undefined>(undefined);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!account) {
    return null;
  }

  // Fetch actual user ranking from leaderboard
  useEffect(() => {
    const fetchRanking = async () => {
      if (account.walletAddress) {
        try {
          const rank = await leaderboardService.getUserRank(account.walletAddress);
          setUserRanking(rank);
        } catch (error) {
          // Error fetching user ranking
        }
      }
    };

    fetchRanking();
  }, [account.walletAddress]);

  // Generate referral code from account data
  const referralCode = account.walletAddress
    ? account.walletAddress.slice(-8).toUpperCase()
    : 'NEXUS001';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  // Get user level and ranking
  const userLevel = Math.floor((account.experience || 0) / 1000) + 1;

  // Use actual ranking from leaderboard, default to rank 1 if not loaded yet
  const currentRanking = userRanking || 1;

  // Define ranking themes - Gold for 1st, Silver for 2nd, Bronze for 3rd
  const rankingThemes = {
    1: {
      // Gold
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
      border: '#FFD700',
      text: '#000000',
      shadow: 'shadow-yellow-500/50',
      glow: 'from-yellow-400/50 to-orange-400/50',
    },
    2: {
      // Silver
      background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #808080 100%)',
      border: '#C0C0C0',
      text: '#000000',
      shadow: 'shadow-gray-400/50',
      glow: 'from-gray-300/50 to-gray-500/50',
    },
    3: {
      // Bronze
      background: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 50%, #8B4513 100%)',
      border: '#CD7F32',
      text: '#FFFFFF',
      shadow: 'shadow-orange-600/50',
      glow: 'from-orange-400/50 to-red-600/50',
    },
    default: {
      // Default theme for ranks 4+
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      border: '#8b5cf6',
      text: '#FFFFFF',
      shadow: 'shadow-purple-500/50',
      glow: 'from-purple-400/50 to-pink-400/50',
    },
  };

  // Get theme based on ranking, use default for ranks 4+
  const currentTheme =
    currentRanking <= 3
      ? rankingThemes[currentRanking as keyof typeof rankingThemes]
      : rankingThemes.default;

  // Define background options
  const backgroundOptions = [
    {
      id: 0,
      name: 'Trustless Scout',
      level: 1,
      image: '/images/games/escrow-puzzle-master.png',
      available: true,
    },
    {
      id: 1,
      name: 'Blockchain Explorer',
      level: 2,
      image: '/images/games/defi-trading-arena.png',
      available: userLevel >= 2,
    },
    {
      id: 2,
      name: 'Stellar Expert',
      level: 3,
      image: '/images/games/web3-basics-adventure.png',
      available: userLevel >= 3,
    },
  ];

  // Define layout options
  const layoutOptions = [
    {
      id: 0,
      name: 'Classic',
      level: 1,
      description: 'Traditional 2-column layout',
      available: true,
    },
    {
      id: 1,
      name: 'Modern',
      level: 2,
      description: 'Centered single-column layout',
      available: userLevel >= 2,
    },
    {
      id: 2,
      name: 'Minimal',
      level: 3,
      description: 'Clean minimal design',
      available: userLevel >= 3,
    },
  ];

  const currentBackground = backgroundOptions[selectedBackground];
  const currentLayout = layoutOptions[selectedLayout];

  // Get earned badges for display
  // First try badgesEarned (array of badge ID strings) - this is the standard field
  // If that doesn't exist, extract badge IDs from badges array (NFTBadge objects)
  let earnedBadges: string[] = [];

  if ((account as any).badgesEarned !== undefined) {
    // Handle badgesEarned (array of badge ID strings)
    if (Array.isArray((account as any).badgesEarned)) {
      earnedBadges = (account as any).badgesEarned;
    } else if ((account as any).badgesEarned && typeof (account as any).badgesEarned === 'object') {
      earnedBadges = Object.values((account as any).badgesEarned);
    }
  } else if ((account as any).badges) {
    // Extract badge IDs from badges array (NFTBadge objects)
    if (Array.isArray((account as any).badges)) {
      earnedBadges = (account as any).badges.map((badge: any) => badge.id);
    } else if (typeof (account as any).badges === 'object') {
      earnedBadges = Object.values((account as any).badges).map((badge: any) => badge.id || badge);
    }
  }

  const handleShare = async (platform: 'twitter' | 'discord' | 'linkedin' | 'copy') => {
    setIsSharing(true);
    try {
      const text = `🚀 Join me on Stellar Nexus Experience! Master Trustless Work on Stellar blockchain and earn badges! 🏆`;
      const url = referralLink;
      const hashtags = 'StellarNexus,TrustlessWork,Web3,Blockchain';

      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`,
            '_blank'
          );
          break;
        case 'discord':
          const discordMessage = `🎴 **Check out my Stellar Nexus Card!**\n\n**${account.displayName || 'Nexus Explorer'}** - Level ${userLevel}\n\n🏆 Total Points: ${account.totalPoints || 0}\n⚡ Experience: ${account.experience || 0}\n🎖️ Badges: ${earnedBadges.length}\n\n${text}\n\n👉 Join using my referral code: **${referralCode}**\n${url}\n\nShare your card in 🎴|nexus-cards too!`;

          await navigator.clipboard.writeText(discordMessage);
          addToast({
            type: 'success',
            title: '💬 Discord Message Copied!',
            message: 'Paste it in the 🎴|nexus-cards channel!',
            duration: 3000,
          });
          break;
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            '_blank'
          );
          break;
        case 'copy':
          await navigator.clipboard.writeText(`${text} ${url}`);
          addToast({
            type: 'success',
            title: '📋 Copied!',
            message: 'Referral link copied to clipboard!',
            duration: 2000,
          });
          break;
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Share Failed',
        message: 'Failed to share referral link. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Container - 2 Column Grid */}
      <div className='grid grid-cols-2 gap-6 items-start'>
        {/* Left Column - Pokemon Style Nexus Card */}
        <div className='flex justify-center'>
          <div className='relative'>
            {/* Ranking Medal */}
            {userRanking && (
              <div className='absolute -top-4 left-1/2 transform -translate-x-1/2 z-30'>
                <div
                  className={`relative w-10 h-10 rounded-full border-4 shadow-2xl ${currentRanking === 1
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300'
                    : currentRanking === 2
                      ? 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-200'
                      : currentRanking === 3
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-300'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-400'
                    }`}
                >
                  {/* Medal Number */}
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span
                      className={`${currentRanking > 9 ? 'text-sm' : 'text-lg'} font-bold ${currentRanking === 1
                        ? 'text-yellow-900'
                        : currentRanking === 2
                          ? 'text-gray-800'
                          : currentRanking === 3
                            ? 'text-orange-900'
                            : 'text-white'
                        }`}
                    >
                      #{currentRanking}
                    </span>
                  </div>

                  {/* Medal Glow Effect */}
                  <div
                    className={`absolute inset-0 rounded-full blur-lg opacity-50 ${currentRanking === 1
                      ? 'bg-yellow-400'
                      : currentRanking === 2
                        ? 'bg-gray-300'
                        : currentRanking === 3
                          ? 'bg-orange-400'
                          : 'bg-purple-500'
                      }`}
                  ></div>

                  {/* Animated Ring */}
                  <div
                    className={`absolute -inset-2 rounded-full border-2 animate-ping opacity-75 ${currentRanking === 1
                      ? 'border-yellow-400'
                      : currentRanking === 2
                        ? 'border-gray-300'
                        : currentRanking === 3
                          ? 'border-orange-400'
                          : 'border-purple-400'
                      }`}
                  ></div>
                </div>
              </div>
            )}

            {/* Pokemon Style Nexus Card */}
            <div
              ref={cardRef}
              className={`relative w-80 h-[430px] rounded-2xl border-4 shadow-2xl overflow-hidden ${currentTheme.shadow}`}
              style={{
                background: (currentTheme as any).background || '',
                borderColor: currentTheme.border,
              }}
            >
              {/* Character Background Image */}
              <div className='absolute inset-0'>
                <img
                  src={currentBackground.image}
                  alt={`${currentBackground.name} Background`}
                  className='w-full h-full object-cover'
                />
                {/* Background Overlay for Better Text Readability */}
                <div className='absolute inset-0 bg-black/40'></div>
              </div>

              <br />

              {/* Top Section - Dynamic Layout */}
              <div className='relative z-10 p-4'>
                {currentLayout.id === 0 && (
                  /* Classic Layout - 2 Column Grid */
                  <div
                    className='grid grid-cols-2 gap-4 items-start'
                    style={{ marginBottom: '-25px' }}
                  >
                    {/* Left Column - Nexus Card Info */}
                    <div className='flex flex-col items-center'>
                      <div className='text-center mb-3'>
                        <div className='text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'>
                          NEXUS CARD
                        </div>
                        {/* Badge Name */}
                        <div className='mt-2 bg-gradient-to-r from-yellow-400/90 to-orange-400/90 text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-yellow-300 shadow-lg'>
                          {currentBackground.name}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Account Info */}
                    <div className='flex flex-col items-center'>
                      <div className='text-center mb-3'>
                        <div className='text-sm font-bold text-white'>ACCOUNT INFO</div>
                      </div>

                      {/* Avatar */}
                      <div className='relative mb-3'>
                        <div className='scale-125'>
                          <UserAvatar size='lg' showStatus={false} />
                        </div>
                        <div className='absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5'>
                          <div className='text-xs font-bold' style={{ color: 'black' }}>
                            Lv.{userLevel}
                          </div>
                        </div>
                      </div>

                      {/* Name and Ranking */}
                      <div className='text-center'>
                        <div className='text-sm font-bold text-white'>
                          {account.displayName || 'Nexus Explorer'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentLayout.id === 1 && (
                  /* Modern Layout - Profile Card Style */
                  <div className='flex flex-col h-full'>
                    {/* Top Section - Card Type and Badge */}
                    <br />
                    <div className='flex justify-center items-start mb-4'>
                      <div className='text-sm font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'>
                        NEXUS CARD
                      </div>
                    </div>

                    {/* Center Section - Avatar and Name */}
                    <div className='flex flex-col items-center mb-6'>
                      {/* Avatar */}
                      <div className='relative mb-3'>
                        <div className='scale-125'>
                          <UserAvatar size='lg' showStatus={false} />
                        </div>
                        <div className='absolute -bottom-1 -right-1 bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center'>
                          <div className='text-sm font-bold text-white'>{userLevel}</div>
                        </div>
                      </div>

                      {/* Name and Title */}
                      <div className='text-center'>
                        <div className='text-lg font-bold text-white mb-1'>
                          {account.displayName || 'Nexus Explorer'}
                        </div>
                        {/* Badge Name */}
                        <div className='inline-block bg-gradient-to-r from-yellow-400/90 to-orange-400/90 text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-yellow-300 shadow-lg'>
                          {currentBackground.name}
                        </div>
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className='flex-1 mb-4'>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <div className='flex justify-between items-center'>
                          <span className='text-yellow-400 font-semibold'>XP</span>
                          <span className='text-white font-bold'>{account.experience || 0}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-yellow-400 font-semibold'>POINTS</span>
                          <span className='text-white font-bold'>{account.totalPoints || 0}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-yellow-400 font-semibold'>REFERRALS</span>
                          <span className='text-white font-bold'>0</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-yellow-400 font-semibold'>BADGES</span>
                          <span className='text-white font-bold'>{earnedBadges.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges Section */}
                    {earnedBadges.length > 0 && (
                      <div className='flex flex-wrap justify-center gap-2 mt-4'>
                        {earnedBadges.slice(0, 6).map((badgeId, index) => (
                          <div key={index} className='w-6 h-6'>
                            <BadgeEmblem
                              id={badgeId as string}
                              size='sm'
                              className='w-full h-full'
                            />
                          </div>
                        ))}
                        {earnedBadges.length > 6 && (
                          <div className='w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center'>
                            <span className='text-xs font-bold text-white'>
                              +{earnedBadges.length - 6}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentLayout.id === 2 && (
                  /* Minimal Layout - Clean Design */
                  <div className='flex flex-col items-center text-center space-y-2 -mb-10'>
                    <div className='text-xs font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'>
                      NEXUS CARD
                    </div>

                    {/* Avatar */}
                    <div className='relative'>
                      <div className='scale-110'>
                        <UserAvatar size='md' showStatus={false} />
                      </div>
                      <div className='absolute -bottom-1 -right-1 bg-white rounded-full px-1 py-0.5'>
                        <div className='text-xs font-bold' style={{ color: 'black' }}>
                          {userLevel}
                        </div>
                      </div>
                    </div>

                    <div className='text-base font-bold text-white'>
                      {account.displayName || 'Nexus Explorer'}
                    </div>
                    <div className='text-xs text-white/70'>{account.totalPoints || 0} pts</div>
                    {/* Badge Name */}
                    <div className='inline-block bg-gradient-to-r from-yellow-400/90 to-orange-400/90 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-yellow-300 shadow-lg'>
                      {currentBackground.name}
                    </div>
                  </div>
                )}

                <br />
                <br />
                <br />

                {/* Earned Badges - Only for Classic and Minimal layouts */}
                {currentLayout.id !== 1 && earnedBadges.length > 0 && (
                  <div className='relative z-10 px-6 mb-4'>
                    <div className='bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/30'>
                      {/* <div
                        className='text-center text-sm font-bold mb-2'
                        style={{ color: currentTheme.text }}
                      >
                        Earned Badges ({earnedBadges.length})
                      </div> */}
                      <div className='flex flex-wrap justify-center gap-2'>
                        {earnedBadges.slice(0, 5).map((badgeId, index) => (
                          <div key={index} className='w-6 h-6'>
                            <BadgeEmblem
                              id={badgeId as string}
                              size='sm'
                              className='w-full h-full'
                            />
                          </div>
                        ))}
                        {earnedBadges.length > 6 && (
                          <div
                            className='w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold'
                            style={{ color: currentTheme.text }}
                          >
                            +{earnedBadges.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats and Referral Code - Only for Classic and Minimal layouts */}
                {currentLayout.id !== 1 && (
                  <div className='relative z-10 px-6 mb-4 space-y-3'>
                    {/* Stats */}
                    <div className='bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/30'>
                      <div className='grid grid-cols-3 gap-2 text-sm'>
                        <div className='text-center'>
                          <div className='font-bold text-lg text-white'>
                            {account.totalPoints || 0}
                          </div>
                          <div className='text-xs text-white/80'>Points</div>
                        </div>
                        <div className='text-center'>
                          <div className='font-bold text-lg text-white'>
                            {account.experience || 0}
                          </div>
                          <div className='text-xs text-white/80'>Experience</div>
                        </div>
                        <div className='text-center'>
                          <div className='font-bold text-lg text-white'>{earnedBadges.length}</div>
                          <div className='text-xs text-white/80'>Badges</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <br />
                {currentLayout.id === 0 && <br />}

                {/* Footer */}
                <div className='absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-sm rounded-b-2xl'>
                  <div className='text-center text-xs text-white'>
                    <div className='font-bold mb-1'>Join the Nexus Experience!</div>
                    <div className='opacity-80'>Master Trustless Work on Stellar</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column - Layout, Background & Form Selection Rows */}
        <div className='space-y-6'>
          {/* Layout Selection Row */}
          <div>
            <p className='text-white/80 text-sm font-bold mb-3 text-center'>Card Layout</p>
            <div className='grid grid-cols-3 gap-2'>
              {layoutOptions.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => option.available && setSelectedLayout(index)}
                  disabled={!option.available}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedLayout === index
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-105'
                    : option.available
                      ? 'border-white/30 hover:border-white/60 hover:scale-105'
                      : 'border-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  title={
                    option.available
                      ? `${option.name} - ${option.description}`
                      : `Locked - Requires Level ${option.level}`
                  }
                >
                  {/* Layout Preview */}
                  <div className='aspect-square relative bg-gradient-to-br from-gray-800 to-gray-900 p-2'>
                    {option.id === 0 && (
                      /* Classic Layout Preview */
                      <div className='w-full h-full flex flex-col space-y-1'>
                        <div className='h-2 bg-white/60 rounded'></div>
                        <div className='flex-1 grid grid-cols-2 gap-1'>
                          <div className='bg-white/40 rounded'></div>
                          <div className='bg-white/40 rounded'></div>
                        </div>
                      </div>
                    )}
                    {option.id === 1 && (
                      /* Modern Layout Preview */
                      <div className='w-full h-full flex flex-col items-center justify-center space-y-1'>
                        <div className='w-3/4 h-2 bg-white/60 rounded'></div>
                        <div className='w-2/3 h-2 bg-white/40 rounded'></div>
                        <div className='w-1/2 h-2 bg-white/40 rounded'></div>
                      </div>
                    )}
                    {option.id === 2 && (
                      /* Minimal Layout Preview */
                      <div className='w-full h-full flex flex-col items-center justify-center space-y-1'>
                        <div className='w-1/2 h-1 bg-white/40 rounded'></div>
                        <div className='w-2/3 h-1 bg-white/60 rounded'></div>
                        <div className='w-1/2 h-1 bg-white/40 rounded'></div>
                      </div>
                    )}

                    {/* Overlay for locked layouts */}
                    {!option.available && (
                      <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
                        <div className='text-center'>
                          <div className='text-white text-xs font-bold'>🔒</div>
                          <div className='text-white text-xs'>Level {option.level}</div>
                        </div>
                      </div>
                    )}

                    {/* Selected indicator */}
                    {selectedLayout === index && (
                      <div className='absolute inset-0 bg-yellow-400/20 flex items-center justify-center'>
                        <div className='w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-4 h-4 text-black'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layout Info */}
                  <div className='absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-1'>
                    <div
                      className={`text-xs font-bold text-center ${option.available ? 'text-white' : 'text-gray-400'
                        }`}
                    >
                      {option.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Background Selection Row */}
          <div>
            <p className='text-white/80 text-sm font-bold mb-3 text-center'>Background Themes</p>
            <div className='grid grid-cols-3 gap-2'>
              {backgroundOptions.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => option.available && setSelectedBackground(index)}
                  disabled={!option.available}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedBackground === index
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 scale-105'
                    : option.available
                      ? 'border-white/30 hover:border-white/60 hover:scale-105'
                      : 'border-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  title={
                    option.available
                      ? `${option.name} Background`
                      : `Locked - Requires Level ${option.level}`
                  }
                >
                  {/* Background Image */}
                  <div className='aspect-square relative'>
                    <img
                      src={option.image}
                      alt={`${option.name} Background`}
                      className={`w-full h-full object-cover transition-all duration-300 ${option.available ? '' : 'grayscale brightness-50'
                        }`}
                    />

                    {/* Overlay for locked backgrounds */}
                    {!option.available && (
                      <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
                        <div className='text-center'>
                          <div className='text-white text-xs font-bold'>🔒</div>
                          <div className='text-white text-xs'>Level {option.level}</div>
                        </div>
                      </div>
                    )}

                    {/* Selected indicator */}
                    {selectedBackground === index && (
                      <div className='absolute inset-0 bg-yellow-400/20 flex items-center justify-center'>
                        <div className='w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-4 h-4 text-black'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Background Info */}
                  <div className='absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-1'>
                    <div
                      className={`text-xs font-bold text-center ${option.available ? 'text-white' : 'text-gray-400'
                        }`}
                    >
                      {option.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Social Sharing Buttons */}
          <div className='mt-6'>
            <p className='text-white/60 text-xs text-center mb-3'>
              Share your Nexus Experience on social media
            </p>
            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={() => handleShare('twitter')}
                disabled={isSharing}
                className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-1 shadow-lg hover:shadow-blue-500/50'
              >
                <span>🐦</span>
                <span className='text-xs'>Twitter</span>
              </button>
              <button
                onClick={() => handleShare('discord')}
                disabled={isSharing}
                className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-1 shadow-lg hover:shadow-indigo-500/50'
              >
                <span>💬</span>
                <span className='text-xs'>Discord</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                disabled={isSharing}
                className='bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-1 shadow-lg hover:shadow-blue-700/50'
              >
                <span>💼</span>
                <span className='text-xs'>LinkedIn</span>
              </button>
              <button
                onClick={() => handleShare('copy')}
                disabled={isSharing}
                className='bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-1 shadow-lg hover:shadow-gray-500/50'
              >
                <span>📋</span>
                <span className='text-xs'>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonReferralCard;
