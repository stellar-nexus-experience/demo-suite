'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { appConfig } from '@/lib/stellar/wallet-config';
import { Tooltip } from '@/components/ui/Tooltip';
import { UserDropdown } from '@/components/ui/navigation/UserDropdown';
import { RewardsSidebar } from '@/components/ui/RewardsSidebar';
import { NotificationBell } from '@/components/ui/NotificationBell';
import Image from 'next/image';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useGlobalWallet();
  const { account, isLoading } = useFirebase();

  // Ensure component is mounted before rendering client-specific content
  useEffect(() => {
    setIsMounted(true);
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

  // Listen for custom event to toggle rewards dropdown
  useEffect(() => {
    // Only add event listener after component is mounted
    if (!isMounted || typeof window === 'undefined') return;

    const handleToggleRewards = () => {
      setIsRewardsOpen(true);
    };

    window.addEventListener('toggleRewardsSidebar', handleToggleRewards);
    return () => {
      window.removeEventListener('toggleRewardsSidebar', handleToggleRewards);
    };
  }, [isMounted]);

  // Auto-open rewards sidebar only on first wallet connect (not on reconnects)
  useEffect(() => {
    // Only run after component is mounted to avoid hydration issues
    if (!isMounted) return;

    if (isConnected && account) {
      // Check if this is the first time connecting (no previous session)
      const hasConnectedBefore =
        typeof window !== 'undefined' ? localStorage.getItem('wallet-connected-before') : null;

      if (!hasConnectedBefore) {
        // First time connecting - auto-open rewards panel
        const timer = setTimeout(() => {
          setIsRewardsOpen(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('wallet-connected-before', 'true');
          }
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, account, isMounted]);

  return (
    <header
      className='bg-white/10 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/10 shadow-lg'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and App Name */}
          <div className='flex items-center space-x-1'>
            <div className='flex items-center space-x-2'>
              <a href='/' className='hover:opacity-80 transition-opacity duration-300'>
                <Image
                  src='/images/logo/iconletter.png'
                  alt='STELLAR NEXUS'
                  width={80}
                  height={24}
                  style={{ width: 'auto', height: 'auto' }}
                />
              </a>
              <span className='font-bold'>Web3 Experience</span>
              <p className='text-xs text-white/60'>v{appConfig.version}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center space-x-6'>
            {/* <a
              href='/'
              className='text-white/80 hover:text-white transition-colors flex items-center space-x-2'
            >
              <Image
                src='/images/icons/demos.png'
                alt='Demos'
                width={20}
                height={20}
                className='w-5 h-5'
                style={{ width: 'auto', height: 'auto' }}
              />
              <span>Demos</span>
            </a> */}
            {/* Only show Nexus Web3 Playground when wallet is connected */}
            {/* {isConnected && (
              <Tooltip
                position='bottom'
                content={
                  miniGamesUnlocked
                    ? 'Explore the Nexus Web3 Playground'
                    : 'Complete all demos and earn all badges to unlock the Nexus Web3 Playground'
                }
              >
                <a
                  href={miniGamesUnlocked ? '/mini-games' : '#'}
                  onClick={e => {
                    if (!miniGamesUnlocked) {
                      e.preventDefault();
                    }
                  }}
                  className={`transition-colors flex items-center space-x-2 ${
                    miniGamesUnlocked
                      ? 'text-white/80 hover:text-white cursor-pointer'
                      : 'text-white/40 cursor-not-allowed'
                  }`}
                >
                  <Image
                    src='/images/icons/console.png'
                    alt='Nexus Web3 Playground'
                    width={20}
                    height={20}
                    className={`w-5 h-5 ${miniGamesUnlocked ? '' : 'grayscale'}`}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <span>
                    {miniGamesUnlocked ? 'Nexus Web3 Playground' : 'Nexus Web3 Playground 🔒'}
                  </span>
                </a>
              </Tooltip>
            )} */}
          </nav>

          {/* Header Controls */}
          <div className='flex items-center space-x-4'>
            {/* Account Status - Show when connected - Only render after mount to prevent hydration mismatch */}
            {isMounted && isConnected && (
              <div className='flex items-center space-x-2'>
                {account ? (
                  <>
                    {/* Account Info */}
                    <div className='hidden sm:flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1'>
                      <span className='text-xs text-white/70'>Points:</span>
                      <span className='text-sm font-semibold text-green-400'>
                        {account?.totalPoints || 0}
                      </span>
                      <span className='text-xs text-white/70'>Level:</span>
                      <span className='text-sm font-semibold text-blue-400'>
                        {account ? Math.floor((account.experience || 0) / 1000) + 1 : 1}
                      </span>
                    </div>

                    {/* Rewards Button */}
                    <div className='relative'>
                      <Tooltip position='bottom' content='View Rewards & Progress'>
                        <button
                          onClick={() => setIsRewardsOpen(!isRewardsOpen)}
                          className='relative p-2 text-white/80 hover:text-white transition-colors'
                        >
                          <span className='text-xl'>🎮</span>
                          {account.totalPoints > 0 && (
                            <span className='absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                              {account.experience}
                            </span>
                          )}
                        </button>
                      </Tooltip>

                      {/* Rewards Dropdown */}
                      <RewardsSidebar
                        isOpen={isRewardsOpen}
                        onClose={() => setIsRewardsOpen(false)}
                      />
                    </div>
                  </>
                ) : isLoading ? (
                  <div className='flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span className='text-xs text-white/70'>Setting up account...</span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1'>
                    <span className='text-xs text-white/70'>No account</span>
                  </div>
                )}
              </div>
            )}

            {/* Network Indicator */}
            {/* <div className='hidden sm:flex items-center'>
              <NetworkIndicator className='scale-90' showSwitchButton={true} />
            </div> */}

            {/* Notification Bell - Only show when wallet is connected */}
            {isMounted && isConnected && <NotificationBell />}

            {/* User Dropdown - Only show when wallet is connected */}
            {isMounted && isConnected && <UserDropdown />}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='md:hidden text-white/80 hover:text-white transition-colors'
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className='md:hidden absolute top-full left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/20 shadow-xl z-50'>
          <div className='px-2 pt-2 pb-3 space-y-1'>
            <a
              href='/'
              className='block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors'
              onClick={() => setIsMenuOpen(false)}
            >
              <div className='flex items-center space-x-2'>
                <Image
                  src='/images/icons/demos.png'
                  alt='Demos'
                  width={20}
                  height={20}
                  className='w-5 h-5'
                  style={{ width: 'auto', height: 'auto' }}
                />
                <span>ESCROW ARSENAL</span>
              </div>
            </a>
            {/* Only show Nexus Web3 Playground in mobile menu when wallet is connected */}
            {isMounted && isConnected && (
              <Tooltip
                content={
                  miniGamesUnlocked
                    ? 'Explore the Nexus Web3 Playground'
                    : 'Earn the Nexus Master badge to unlock the Nexus Web3 Playground'
                }
              >
                <a
                  href={miniGamesUnlocked ? '/mini-games' : '#'}
                  onClick={e => {
                    if (!miniGamesUnlocked) {
                      e.preventDefault();
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                  className={`block px-3 py-2 rounded-md transition-colors ${miniGamesUnlocked
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-white/40 cursor-not-allowed'
                    }`}
                >
                  <div className='flex items-center space-x-2'>
                    <Image
                      src='/images/icons/console.png'
                      alt='Nexus Web3 Playground'
                      width={20}
                      height={20}
                      className={`w-5 h-5 ${miniGamesUnlocked ? '' : 'grayscale'}`}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                    <span>
                      {miniGamesUnlocked ? 'Nexus Web3 Playground' : '🔒 Nexus Web3 Playground'}
                    </span>
                  </div>
                </a>
              </Tooltip>
            )}

            <a
              href='/docs'
              className='block px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors'
              onClick={() => setIsMenuOpen(false)}
            >
              <div className='flex items-center space-x-2'>
                <Image
                  src='/images/icons/docs.png'
                  alt='Docs'
                  width={20}
                  height={20}
                  className='w-5 h-5'
                />
                <span>Nexus Starter Kits</span>
              </div>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
