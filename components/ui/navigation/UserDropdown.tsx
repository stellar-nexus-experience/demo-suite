'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { appConfig, stellarConfig } from '@/lib/stellar/wallet-config';
import { UserAvatar } from './UserAvatar';
import { generateFunnyName } from '@/lib/utils/funny-name-generator';
import { useToast } from '@/contexts/ui/ToastContext';
import { getAllBadges } from '@/lib/firebase/firebase-types';
import { Tooltip } from '@/components/ui/Tooltip';
import { accountService } from '@/lib/firebase/firebase-service';
import { ReferralInvitationModal } from '@/components/ui/referral';
import { ReferralBonusModal } from '@/components/ui/modals/ReferralBonusModal';
import Image from 'next/image';

export const UserDropdown = () => {
  const {
    isConnected,
    walletData,
    disconnect,
    connect,
    isFreighterAvailable,
    isLoading: walletLoading,
  } = useGlobalWallet();
  const { isAuthenticated, user, getUserStats, updateUser } = useAuth();
  const { account, refreshAccountData } = useFirebase();
  const { addToast } = useToast();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for bonus modal
  const [bonusModalData, setBonusModalData] = useState<{
    isOpen: boolean;
    referrerName: string;
    bonus: number;
    referralCode: string;
  }>({
    isOpen: false,
    referrerName: '',
    bonus: 0,
    referralCode: '',
  });

  // Listen for custom event to open dropdown and referral center
  useEffect(() => {
    const handleOpenReferralCenter = () => {
      setIsOpen(true);
      // Small delay to ensure dropdown opens first
      setTimeout(() => {
        setIsReferralModalOpen(true);
        setIsOpen(false); // Close dropdown after opening modal
      }, 100);
    };

    window.addEventListener('openReferralCenter', handleOpenReferralCenter);
    return () => window.removeEventListener('openReferralCenter', handleOpenReferralCenter);
  }, []);

  // Check if user has unlocked mini-games access (earned all 5 top badges)
  const miniGamesUnlocked = useMemo(() => {
    if (!account || !account.badgesEarned) return false;

    // Handle both array and object formats for badgesEarned (Firebase sometimes stores arrays as objects)
    let badgesEarnedArray: string[] = [];
    if (Array.isArray(account.badgesEarned)) {
      badgesEarnedArray = account.badgesEarned;
    } else if (typeof account.badgesEarned === 'object') {
      badgesEarnedArray = Object.values(account.badgesEarned);
    }

    // Check if user has earned all 5 top badges
    const topBadges = [
      'welcome_explorer',
      'escrow_expert',
      'trust_guardian',
      'stellar_champion',
      'nexus_master',
    ];
    const hasAllTopBadges = topBadges.every(badgeId => badgesEarnedArray.includes(badgeId));

    return hasAllTopBadges;
  }, [account]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate display name from wallet address or user data
  const generateDisplayName = (address: string) => {
    if (!address) return 'Guest User';
    // Use funny name generator for more engaging names
    return generateFunnyName(address);
  };

  const displayName =
    // Priority 1: Firebase account displayName (most authoritative)
    account?.displayName ||
    // Priority 2: Auth context user data
    (isAuthenticated && user ? user.customName || user.username : null) ||
    // Priority 3: localStorage for non-authenticated users
    (() => {
      if (walletData?.publicKey) {
        try {
          const profileData = localStorage.getItem(`profile_${walletData.publicKey}`);
          if (profileData) {
            const parsed = JSON.parse(profileData);
            if (parsed.customName) return parsed.customName;
          }
        } catch (error) {
          // Error loading profile
        }
      }
      return null;
    })() ||
    // Priority 4: Generated name as fallback
    generateDisplayName(walletData?.publicKey || '');
  const stats = getUserStats();

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
      setIsOpen(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Disconnect Error',
        message: 'Failed to disconnect wallet. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const copyWalletAddress = () => {
    if (walletData?.publicKey) {
      navigator.clipboard.writeText(walletData.publicKey);
      // You could add a toast notification here
    }
  };

  const handleAutoGenerate = async () => {
    if (!walletData?.publicKey) {
      addToast({
        type: 'error',
        title: 'No Wallet Connected',
        message: 'Please connect your wallet first',
        duration: 3000,
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate new funny name
      const newName = generateFunnyName(walletData.publicKey + Date.now().toString());

      // Generate new avatar seed
      const newAvatarSeed = Date.now().toString() + Math.random().toString();

      if (user) {
        // Update existing user
        await updateUser({
          customName: newName,
          avatarSeed: newAvatarSeed,
        });
      } else {
        // Store in localStorage for non-authenticated users
        const profileData = {
          customName: newName,
          avatarSeed: newAvatarSeed,
          walletAddress: walletData.publicKey,
        };
        localStorage.setItem(`profile_${walletData.publicKey}`, JSON.stringify(profileData));
      }

      // Always save to Firebase regardless of authentication status
      if (walletData?.publicKey) {
        await accountService.createOrUpdateAccount({
          id: walletData.publicKey,
          displayName: newName,
          walletAddress: walletData.publicKey,
        });

        // Refresh Firebase account data to reflect changes immediately
        await refreshAccountData();
      }

      addToast({
        type: 'success',
        title: '🎉 Profile Updated!',
        message: `Your new name is: ${newName}`,
        duration: 3000,
      });

      // Keep dropdown open to show the updated profile
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Update Failed',
        message: 'Failed to update profile. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartEditing = () => {
    setTempName(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      addToast({
        type: 'error',
        title: '❌ Invalid Name',
        message: 'Name cannot be empty',
        duration: 3000,
      });
      return;
    }

    if (!walletData?.publicKey) {
      addToast({
        type: 'error',
        title: 'No Wallet Connected',
        message: 'Please connect your wallet first',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const displayName = tempName.trim();

      if (user) {
        // Update existing user in Auth context
        await updateUser({
          customName: displayName,
        });
      } else {
        // Store in localStorage for non-authenticated users
        const profileData = {
          customName: displayName,
          walletAddress: walletData.publicKey,
        };
        localStorage.setItem(`profile_${walletData.publicKey}`, JSON.stringify(profileData));
      }

      // Always save to Firebase regardless of authentication status
      if (walletData?.publicKey) {
        await accountService.createOrUpdateAccount({
          id: walletData.publicKey,
          displayName: displayName,
          walletAddress: walletData.publicKey,
        });

        // Refresh Firebase account data to reflect changes immediately
        await refreshAccountData();
      }

      addToast({
        type: 'success',
        title: '✅ Name Saved!',
        message: `Your display name is now: ${displayName}`,
        duration: 3000,
      });

      setIsEditingName(false);
      setTempName('');
    } catch (error) {
      console.error('Error saving display name:', error);
      addToast({
        type: 'error',
        title: '❌ Save Failed',
        message: 'Failed to save name. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditing = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleShowBonusModal = (referrerName: string, bonus: number, referralCode: string) => {
    setBonusModalData({
      isOpen: true,
      referrerName,
      bonus,
      referralCode,
    });
  };

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Avatar Button */}
      <UserAvatar onClick={() => setIsOpen(!isOpen)} size='md' showStatus={true} />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-64 bg-black/80 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl z-50 overflow-hidden'>
          {/* Enhanced background blur overlay */}
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-3xl'></div>
          <div className='absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20'></div>
          {/* Header */}
          <div className='relative z-10 p-4 border-b border-white/10'>
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                {isConnected ? (
                  <Tooltip content='Click to generate random name & avatar' position='right'>
                    <button
                      onClick={handleAutoGenerate}
                      disabled={isGenerating}
                      className='cursor-pointer transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isGenerating ? (
                        <div className='relative'>
                          <UserAvatar size='lg' showStatus={false} />
                          <div className='absolute inset-0 flex items-center justify-center'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
                          </div>
                        </div>
                      ) : (
                        <UserAvatar size='lg' showStatus={false} />
                      )}
                    </button>
                  </Tooltip>
                ) : (
                  <UserAvatar size='lg' showStatus={false} />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                {isEditingName ? (
                  <div className='flex items-center space-x-2'>
                    <input
                      type='text'
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleSaveName();
                        } else if (e.key === 'Escape') {
                          handleCancelEditing();
                        }
                      }}
                      className='flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50'
                      placeholder='Enter custom name...'
                      autoFocus
                    />
                    {/* Save and Cancel buttons */}
                    <Tooltip content='Save Name' position='bottom'>
                      <button
                        onClick={handleSaveName}
                        disabled={isSaving}
                        className='p-1 text-green-400 hover:text-green-300 transition-colors duration-200 disabled:opacity-50'
                      >
                        {isSaving ? (
                          <div className='animate-spin rounded-full h-3 w-3 border-b border-white'></div>
                        ) : (
                          <span className='text-xs'>✓</span>
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip content='Cancel' position='bottom'>
                      <button
                        onClick={handleCancelEditing}
                        className='p-1 text-red-400 hover:text-red-300 transition-colors duration-200'
                      >
                        <span className='text-xs'>✕</span>
                      </button>
                    </Tooltip>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <Tooltip content={displayName} position='bottom'>
                      <h3
                        className={`text-white font-semibold text-sm truncate transition-colors duration-200 ${isConnected ? 'cursor-pointer hover:text-blue-300' : 'cursor-default'
                          }`}
                        onClick={isConnected ? handleStartEditing : undefined}
                        title={isConnected ? 'Click to edit name' : 'Connect wallet to edit name'}
                      >
                        {displayName}
                      </h3>
                    </Tooltip>
                    {/* Small edit button */}
                    {isConnected && (
                      <Tooltip content='Edit Name' position='left'>
                        <button
                          onClick={handleStartEditing}
                          className='p-1 text-white/60 hover:text-blue-300 transition-colors duration-200'
                        >
                          <span className='text-xs'>✏️</span>
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
                <p className='text-white/60 text-xs truncate'>
                  {isConnected
                    ? `${walletData?.publicKey?.slice(0, 6)}...${walletData?.publicKey?.slice(-4)}`
                    : 'Not Connected'}
                </p>
                {/* <div className='flex items-center space-x-2 mt-1'>
                  <span className='text-brand-300 text-xs'>Level {stats.level}</span>
                  <span className='text-white/50 text-xs'>|</span>
                  <span className='text-accent-300 text-xs'>
                    {stats.totalDemosCompleted} demos
                  </span>
                </div> */}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className='relative z-10 p-2'>
            {isConnected ? (
              <>
                <a
                  href='/'
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${pathname === '/'
                      ? 'text-white bg-blue-500/20 border border-blue-500/30'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <span className='text-lg'>
                    <Image
                      src='/images/icons/demos.png'
                      alt='Web3 Playground'
                      width={50}
                      height={20}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </span>
                  <span>Stellar Nexus Experience</span>
                </a>

                <Tooltip
                  content={
                    miniGamesUnlocked
                      ? 'Explore the Nexus Web3 Playground'
                      : 'Earn all 5 top badges to unlock the Nexus Web3 Playground'
                  }
                >
                  <a
                    href={miniGamesUnlocked ? '/mini-games' : '#'}
                    onClick={e => {
                      if (!miniGamesUnlocked) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm mb-2 ${!miniGamesUnlocked
                        ? 'text-white/40 cursor-not-allowed'
                        : pathname === '/mini-games'
                          ? 'text-white bg-purple-500/20 border border-purple-500/30'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <span className='text-lg'>
                      <Image
                        src='/images/icons/console.png'
                        alt='Web3 Playground'
                        width={50}
                        height={20}
                        className={miniGamesUnlocked ? '' : 'grayscale'}
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </span>
                    <span>
                      {miniGamesUnlocked ? 'Nexus Web3 Playground' : '🔒 Nexus Web3 Playground'}
                    </span>
                  </a>
                </Tooltip>

                <hr />
                {/* Quick Action Buttons */}
                <div className='space-y-2 mt-2'>
                  <button
                    onClick={() => {
                      // Dispatch custom event to open rewards dropdown
                      window.dispatchEvent(new CustomEvent('toggleRewardsSidebar'));
                      setIsOpen(false);
                    }}
                    className='w-full flex items-center space-x-3 text-brand-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 text-sm px-3 py-2'
                  >
                    <span className='text-lg'>🎮</span>
                    <span>Rewards & Progress</span>
                  </button>

                  <button
                    onClick={() => {
                      // Close the dropdown
                      setIsOpen(false);

                      // Dispatch event to open leaderboard sidebar (works on all pages)
                      window.dispatchEvent(new CustomEvent('openLeaderboard'));
                    }}
                    className='w-full flex items-center space-x-3 text-yellow-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 text-sm px-3 py-2'
                  >
                    <span className='text-lg'>🏆</span>
                    <span>Global Leaderboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsReferralModalOpen(true);
                      setIsOpen(false);
                    }}
                    className='w-full flex items-center space-x-3 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 text-sm px-3 py-2'
                  >
                    <span className='text-lg'>🎴</span>
                    <span>Referral Center</span>
                  </button>
                </div>

                <hr />

                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting || walletLoading}
                  className='w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isDisconnecting ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-red-400'></div>
                  ) : (
                    <span className='text-lg'>🔌</span>
                  )}
                  <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
              </>
            ) : (
              <p className='text-white/60 text-xs'>
                Connect your wallet to access the full features of{' '}
                <span className='font-bold'>Stellar Nexus Experience</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Referral Invitation Modal */}
      <ReferralInvitationModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        account={account}
        onAccountUpdate={refreshAccountData}
        showBonusModal={handleShowBonusModal}
      />

      {/* Referral Bonus Modal */}
      <ReferralBonusModal
        isOpen={bonusModalData.isOpen}
        onClose={() => setBonusModalData(prev => ({ ...prev, isOpen: false }))}
        referrerName={bonusModalData.referrerName}
        bonusEarned={bonusModalData.bonus}
        referralCode={bonusModalData.referralCode}
      />
    </div>
  );
};
