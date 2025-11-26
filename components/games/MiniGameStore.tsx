'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NexusPrime } from '@/components/layout/NexusPrime';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { useToast } from '@/contexts/ui/ToastContext';
import { WalletSidebar } from '@/components/ui/wallet/WalletSidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { UserProfile } from '@/components/ui/navigation/UserProfile';
import { AccountStatusIndicator } from '@/components/ui/AccountStatusIndicator';
import { LeaderboardSection } from '@/components/home/LeaderboardSection';
import { LeaderboardSidebar } from '@/components/ui/LeaderboardSidebar';
import {
  PROMOTIONAL_BANNERS,
  GAME_CATEGORIES,
  MINI_GAMES,
  GAME_DISPLAY_CONFIG,
  DONATION_SOCIAL_LINKS,
  getProgressColor,
  getDifficultyColor,
} from '@/utils/constants';
import Image from 'next/image';

export default function MiniGameStore() {
  const { isConnected } = useGlobalWallet();
  const { account, isLoading: firebaseLoading, isInitialized } = useFirebase();
  const { addToast } = useToast();
  const [activePromo, setActivePromo] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    GAME_DISPLAY_CONFIG.DEFAULT_CATEGORY
  );
  const [searchQuery, setSearchQuery] = useState<string>(GAME_DISPLAY_CONFIG.DEFAULT_SEARCH_QUERY);
  const [showDonationModal, setShowDonationModal] = useState<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [gamesPerPage, setGamesPerPage] = useState<number>(
    GAME_DISPLAY_CONFIG.INITIAL_GAMES_PER_PAGE
  );
  const [walletSidebarOpen, setWalletSidebarOpen] = useState(false);
  const [walletExpanded, setWalletExpanded] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [leaderboardSidebarOpen, setLeaderboardSidebarOpen] = useState(false);
  // Get single feature badge for each game
  const getGameFeature = (gameId: string): string => {
    const featureMap: Record<string, string> = {
      'web3-basics-adventure': 'Web3 Basics',
      'escrow-puzzle-master': 'Escrow Systems',
      'defi-trading-arena': 'Liquidity Pools',
      'nft-creation': 'Design Tools',
    };
    return featureMap[gameId] || '';
  };

  // Listen for wallet sidebar state changes
  useEffect(() => {
    const handleWalletSidebarToggle = (event: CustomEvent) => {
      setWalletSidebarOpen(event.detail.isOpen);
      // Always ensure the sidebar is expanded when it opens
      if (event.detail.isOpen) {
        setWalletExpanded(true);
      } else {
        setWalletExpanded(event.detail.isExpanded);
      }
    };

    const handleOpenUserProfile = () => {
      setShowUserProfile(true);
    };

    const handleOpenLeaderboard = () => {
      setLeaderboardSidebarOpen(true);
    };

    window.addEventListener('walletSidebarToggle', handleWalletSidebarToggle as EventListener);
    window.addEventListener('openUserProfile', handleOpenUserProfile);
    window.addEventListener('openLeaderboard', handleOpenLeaderboard);
    return () => {
      window.removeEventListener('walletSidebarToggle', handleWalletSidebarToggle as EventListener);
      window.removeEventListener('openUserProfile', handleOpenUserProfile);
      window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
    };
  }, []);

  // Auto-rotate promotional banners
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo(prev => (prev + 1) % PROMOTIONAL_BANNERS.length);
    }, GAME_DISPLAY_CONFIG.PROMO_ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handlePlayGame = (game: any) => {
    // Navigate to the individual game page
    window.location.href = `/mini-games/${game.id}`;
  };

  const handleDonate = (game: any) => {
    setShowDonationModal(game.id);
  };

  const closeDonationModal = () => {
    setShowDonationModal(null);
  };

  const filteredGames = MINI_GAMES.filter(game => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || game.status === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const totalGames = filteredGames.length;
  const currentGames = filteredGames.slice(0, gamesPerPage);
  const hasMoreGames = gamesPerPage < totalGames;

  // Reset pagination when filters change
  useEffect(() => {
    setGamesPerPage(GAME_DISPLAY_CONFIG.INITIAL_GAMES_PER_PAGE);
  }, [selectedCategory, searchQuery]);

  const loadMoreGames = () => {
    setGamesPerPage(prev => prev + Number(GAME_DISPLAY_CONFIG.LOAD_MORE_INCREMENT));
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden'>
      {/* Header */}
      <div className='animate-fadeIn'>
        <Header />
      </div>

      {/* Main Content */}
      <main
        className={`relative z-10 pt-20 animate-fadeIn ${
          walletSidebarOpen && walletExpanded ? 'mr-96' : walletSidebarOpen ? 'mr-20' : 'mr-0'
        } ${!walletSidebarOpen ? 'pb-32' : 'pb-8'}`}
      >
        <div className='container mx-auto px-4'>
          <div className='max-w-7xl mx-auto'>
            {/* Epic Hero Section */}
            <div className='text-center mb-16 relative'>
              {/* Legendary Background Effects */}
              <div className='absolute inset-0 flex justify-center items-center pointer-events-none'>
                {/* Primary Energy Core */}
                <div className='relative w-[600px] h-48'>
                  {/* Inner Energy Ring */}
                  <div className='absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/40 via-purple-500/50 to-pink-500/40 blur-lg scale-150 animate-pulse'></div>

                  {/* Middle Energy Ring */}
                  <div
                    className='absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/40 to-cyan-400/30 blur-xl scale-200 animate-pulse'
                    style={{ animationDelay: '1s' }}
                  ></div>

                  {/* Outer Energy Ring */}
                  <div
                    className='absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 via-cyan-500/30 to-purple-300/20 blur-2xl scale-250 animate-pulse'
                    style={{ animationDelay: '2s' }}
                  ></div>
                </div>
              </div>

              {/* Logo and Title */}
              <div className='relative z-10 mb-8'>
                <div className='flex justify-center mb-6'>
                  <div className='relative'>
                    <Image
                      src='/images/logo/logoicon.png'
                      alt='Trustless Work'
                      width={300}
                      height={300}
                      className='drop-shadow-2xl animate-pulse opacity-10'
                    />
                  </div>
                </div>

                <h1
                  className='text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-2xl mb-6 animate-pulse'
                  style={{ marginTop: '-200px' }}
                >
                  NEXUS PLAYGROUND
                </h1>

                <h2 className='text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 drop-shadow-xl mb-8'>
                  WEB3 LEARNING PLATFORM
                </h2>
              </div>

              <p className='text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-8'>
                🚀 <span className='text-cyan-400 font-bold'>LEARN</span> • 🎮{' '}
                <span className='text-purple-400 font-bold'>PLAY</span> • 🏆{' '}
                <span className='text-pink-400 font-bold'>EARN</span> • 🌟{' '}
                <span className='text-yellow-400 font-bold'>BUILD</span>
              </p>

              {/* Navigation Buttons */}
              <div className='flex justify-center gap-6 mb-12'>
                <button
                  onClick={() => {
                    const bannerSection = document.getElementById('news-banner-carousel');
                    if (bannerSection) {
                      bannerSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }}
                  className='px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 border-2 border-white/20 hover:border-white/40 flex items-center space-x-3'
                >
                  <span className='text-2xl'>📰</span>
                  <span>Go To News Banner</span>
                  <span className='text-xl'>↓</span>
                </button>

                <button
                  onClick={() => {
                    if (!isConnected) {
                      // Open wallet sidebar if not connected
                      window.dispatchEvent(
                        new CustomEvent('walletSidebarToggle', {
                          detail: { isOpen: true, isExpanded: true },
                        })
                      );
                      return;
                    }

                    const filterSection = document.getElementById('filter-games-section');
                    if (filterSection) {
                      filterSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }
                  }}
                  disabled={isConnected && firebaseLoading && !isInitialized}
                  className={`px-8 py-4 font-bold rounded-xl transition-all duration-300 transform shadow-lg border-2 flex items-center space-x-3 ${
                    isConnected && firebaseLoading && !isInitialized
                      ? 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
                      : !isConnected
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white hover:scale-105 hover:shadow-yellow-500/25 border-white/20 hover:border-white/40'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:scale-105 hover:shadow-purple-500/25 border-white/20 hover:border-white/40'
                  }`}
                >
                  {isConnected && firebaseLoading && !isInitialized ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                      <span>Loading...</span>
                    </>
                  ) : !isConnected ? (
                    <>
                      <span>🔗 Connect to Explore Games</span>
                    </>
                  ) : (
                    <>
                      <span>Explore Games</span>
                      <span className='text-xl'>🔍</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Wallet Not Connected State */}
            {!isConnected && (
              <div className='text-center py-16'>
                {/* Wallet Icon */}
                <div className='inline-block mb-6'>
                  <div className='text-8xl mb-4 animate-bounce'>💼</div>
                </div>

                {/* Title */}
                <h3 className='text-2xl font-semibold text-white mb-2'>Connect Your Wallet</h3>

                {/* Description */}
                <p className='text-white/70 text-sm mb-8 max-w-md mx-auto'>
                  Connect your Stellar wallet to access the Nexus Web3 Playground, track your
                  progress, and compete on the leaderboard!
                </p>

                {/* Connect Button */}
                <button
                  onClick={() => {
                    // Dispatch wallet sidebar toggle event
                    window.dispatchEvent(
                      new CustomEvent('walletSidebarToggle', {
                        detail: { isOpen: true, isExpanded: true },
                      })
                    );
                  }}
                  className='px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 border-2 border-white/20 hover:border-white/40'
                >
                  🔗 Connect Wallet
                </button>
              </div>
            )}

            {/* Loading State */}
            {isConnected && firebaseLoading && !isInitialized && (
              <div className='text-center py-16'>
                {/* Loading Spinner */}
                <div className='inline-block'>
                  <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mb-4'></div>
                </div>

                {/* Loading Title */}
                <h3 className='text-lg font-semibold text-white mb-2'>Loading Your Account...</h3>

                {/* Loading Description */}
                <p className='text-white/70 text-sm mb-6'>
                  Preparing game library and loading your progress data
                </p>

                {/* Animated Loading Dots */}
                <div className='flex justify-center items-center space-x-2'>
                  <div className='animate-pulse bg-purple-400/30 rounded-full h-3 w-3'></div>
                  <div
                    className='animate-pulse bg-purple-400/50 rounded-full h-3 w-3'
                    style={{ animationDelay: '0.3s' }}
                  ></div>
                  <div
                    className='animate-pulse bg-purple-400/30 rounded-full h-3 w-3'
                    style={{ animationDelay: '0.6s' }}
                  ></div>
                </div>

                {/* Progress Steps */}
                <div className='mt-6 space-y-2'>
                  <div className='text-xs text-white/60'>• Loading account information</div>
                  <div className='text-xs text-white/60'>• Fetching game statistics</div>
                  <div className='text-xs text-white/60'>• Preparing game interfaces</div>
                </div>
              </div>
            )}

            {/* Main Content - Show only when wallet is connected AND account is initialized */}
            {isConnected && isInitialized && (
              <>
                {/* Featured Game Spotlight */}
                <div className='mb-16'>
                  <div className='text-center mb-8'></div>

                  <div className='relative bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl border border-yellow-400/30 rounded-3xl p-8 shadow-2xl'>
                    <div className='grid lg:grid-cols-2 gap-8 items-center'>
                      {/* Game Thumbnail */}
                      <div className='relative'>
                        <div className='relative h-80 rounded-2xl overflow-hidden'>
                          <video
                            src='/videos/infinite-runner.mp4'
                            autoPlay
                            loop
                            muted
                            playsInline
                            className='w-full h-full object-cover'
                          />
                          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent'></div>

                          {/* Featured Badge */}
                          <div className='absolute top-4 left-4'>
                            <span className='px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm rounded-full animate-pulse'>
                              ⭐ FEATURED
                            </span>
                          </div>

                          {/* Rating */}
                          <div className='absolute bottom-4 left-4 flex items-center space-x-2'>
                            <span className='text-yellow-400 text-2xl'>⭐</span>
                            <span className='text-white text-xl font-bold'>4.8</span>
                            {/* <span className='text-white/80 text-sm'>(1,247 players)</span> */}
                          </div>
                        </div>
                      </div>

                      {/* Game Info */}
                      <div className='space-y-6'>
                        <div>
                          <h3 className='text-4xl font-bold text-white mb-4'>
                            <span className='text-brand-300 text-2xl font-bold'>NEXUS</span>{' '}
                            Infinite Runner <br />{' '}
                            <span className='text-brand-300 text-2xl font-bold'></span>
                          </h3>
                          <p className='text-white/90 text-lg leading-relaxed mb-6'>
                            Embark on an epic journey through blockchain fundamentals. Learn smart
                            contracts, wallets, and DeFi while earning crypto rewards! Perfect for
                            beginners starting their web3 journey.
                          </p>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                          <div className='relative text-center p-3 bg-white/10 rounded-xl'>
                            <div className='text-2xl mb-2'>⏱️</div>
                            <div className='text-white font-semibold'>
                              <span className='text-cyan-400 font-bold'>15-20mins</span>
                            </div>
                            <div className='text-white/60 text-sm'>Duration</div>
                          </div>

                          <div className='relative text-center p-3 bg-white/10 rounded-xl'>
                            <div className='text-2xl mb-2'>🎮</div>
                            <div className='text-white font-semibold'>
                              <span className='text-white font-bold'>Lvls 5</span>
                            </div>
                            <div className='text-white/60 text-sm'>Levels</div>
                          </div>

                          <div className='relative text-center p-3 bg-white/10 rounded-xl'>
                            <span className='absolute top-2 right-2 px-2 py-1 text-xs font-bold text-black bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse'>
                              Coming Soon
                            </span>

                            <div className='text-2xl mb-2'>🏆</div>
                            <div className='text-white font-semibold'>50 XLM</div>
                            <div className='text-white/60 text-sm'>+ NFT Badge</div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            (window.location.href = '/mini-games/web3-basics-adventure')
                          }
                          className='w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25'
                        >
                          🚀 PLAY NOW - START YOUR JOURNEY!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Epic Search and Filter Section */}
                <div id='filter-games-section' className='mb-12'>
                  <div className='bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl'>
                    {/* Search Bar */}
                    <div className='mb-8'>
                      <div className='relative max-w-2xl mx-auto'>
                        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                          <div className='text-2xl'>🔍</div>
                        </div>
                        <input
                          type='text'
                          placeholder='Search for epic games, quests, or challenges...'
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className='w-full pl-16 pr-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 text-lg'
                        />
                        <div className='absolute inset-y-0 right-0 pr-4 flex items-center'>
                          <div className='text-white/60 text-sm'>
                            {filteredGames.length} games found
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Filters */}
                    <div className='flex flex-wrap justify-center gap-3'>
                      {GAME_CATEGORIES.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/25'
                              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                          }`}
                        >
                          <span className='mr-2'>{category.name.split(' ')[0]}</span>
                          {category.name.split(' ').slice(1).join(' ')}
                          <span className='ml-2 px-2 py-1 bg-white/20 rounded-full text-xs'>
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Epic Games Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16'>
                  {filteredGames.map(game => (
                    <div
                      key={game.id}
                      className={`group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ${
                        hoveredGame === game.id ? 'shadow-cyan-500/25' : 'shadow-lg'
                      }`}
                      onMouseEnter={() => setHoveredGame(game.id)}
                      onMouseLeave={() => setHoveredGame(null)}
                    >
                      {/* Game Thumbnail */}
                      <div className='relative h-48 overflow-hidden'>
                        {game.thumbnail.endsWith('.mp4') ? (
                          <video
                            src={game.thumbnail}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
                          />
                        ) : (
                          <Image
                            src={game.thumbnail}
                            alt={game.title}
                            fill
                            className='object-cover transition-transform duration-500 group-hover:scale-110'
                          />
                        )}

                        {/* Overlay Effects */}
                        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent'></div>

                        {/* Feature Badge */}
                        {getGameFeature(game.id) && (
                          <div className='absolute top-4 right-4'>
                            <span className='px-3 py-1 rounded-full text-xs font-bold text-white bg-cyan-500/80 backdrop-blur-sm'>
                              🎯 {getGameFeature(game.id)}
                            </span>
                          </div>
                        )}

                        {/* Difficulty Badge */}
                        <div className='absolute top-4 left-4'>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getDifficultyColor(game.difficulty)}`}
                          >
                            {game.difficulty}
                          </span>
                        </div>

                        {/* Rating */}
                        {game.rating > 0 && (
                          <div className='absolute bottom-4 left-4 flex items-center space-x-1'>
                            <span className='text-yellow-400 text-sm'>⭐</span>
                            <span className='text-white text-sm font-bold'>{game.rating}</span>
                          </div>
                        )}

                        {/* Players Count */}
                        {game.currentPlayers !== undefined && game.currentPlayers > 0 && (
                          <div className='absolute bottom-4 right-4'>
                            <span className='text-white/80 text-xs'>
                              👥 {game.currentPlayers.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Game Content */}
                      <div className='p-6'>
                        {/* Game Icon and Title */}
                        <div className='flex items-center mb-3'>
                          <div className='text-3xl mr-3'>{game.icon}</div>
                          <h3 className='text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300'>
                            {game.title}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className='text-white/80 text-sm mb-4 line-clamp-2'>
                          {game.shortDescription}
                        </p>

                        {/* Progress Bar for Development Games */}
                        {game.status !== 'available' && (
                          <div className='mb-4'>
                            <div className='flex justify-between text-xs text-white/60 mb-1'>
                              <span>Development Progress</span>
                              <span>{game.progress}%</span>
                            </div>
                            <div className='w-full bg-white/10 rounded-full h-2'>
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(game.progress)} transition-all duration-500`}
                                style={{ width: `${game.progress}%` }}
                              ></div>
                            </div>
                            <p className='text-xs text-white/60 mt-1'>
                              Est. Release: {game.estimatedRelease}
                            </p>
                          </div>
                        )}

                        {/* Play Button - Show for available and beta games */}
                        {(game.status === 'available' || game.status === 'beta') && (
                          <button
                            onClick={() => handlePlayGame(game)}
                            className={`w-full py-3 px-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                              game.status === 'available'
                                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg hover:shadow-cyan-500/25'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                            }`}
                          >
                            {game.status === 'available' ? '🎮 Play Now' : '🧪 Try Beta'}
                          </button>
                        )}
                      </div>

                      {/* Donate Button - Hidden for Escrow Puzzle Master */}
                      {game.status !== 'available' &&
                        game.donationGoal > 0 &&
                        game.id !== 'escrow-puzzle-master' && (
                          <div className='p-6 pt-0'>
                            <button
                              onClick={() => handleDonate(game)}
                              className='w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25 border border-purple-400/50'
                            >
                              💝 Donate to Speed Up Development
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {hasMoreGames && (
                  <div className='flex flex-col items-center space-y-4 mb-16'>
                    {/* Games Count */}
                    <div className='text-white/70 text-sm'>
                      Showing {gamesPerPage} of {totalGames} games
                    </div>

                    {/* Load More Button */}
                    <button
                      onClick={loadMoreGames}
                      className='px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 border-2 border-white/20 hover:border-white/40'
                    >
                      <span className='flex items-center space-x-2'>
                        <span>📄</span>
                        <span>Load 4 More Games</span>
                      </span>
                    </button>

                    {/* Progress Bar */}
                    <div className='w-full max-w-md bg-white/10 rounded-full h-2 overflow-hidden'>
                      <div
                        className='bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500'
                        style={{ width: `${(gamesPerPage / totalGames) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredGames.length === 0 && (
                  <div className='text-center py-16'>
                    <div className='text-8xl mb-6 animate-bounce'>🔍</div>
                    <h3 className='text-3xl font-bold text-white mb-4'>No Epic Games Found</h3>
                    <p className='text-white/70 text-lg max-w-md mx-auto'>
                      Try adjusting your search or filters to discover amazing web3 learning
                      adventures!
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Epic Promotional Banner Carousel */}
            <div id='news-banner-carousel' className='relative'>
              <div className='relative h-[350px] rounded-3xl overflow-hidden shadow-2xl -mb-[100px]'>
                {PROMOTIONAL_BANNERS.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                      index === activePromo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} opacity-90`}
                    ></div>
                    <div className='absolute inset-0 bg-black/20'></div>

                    {/* Background Image/Video */}
                    <div className='absolute inset-0'>
                      {banner.image.endsWith('.mp4') ? (
                        <video
                          src={banner.image}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className='w-full h-full object-cover opacity-30'
                        />
                      ) : (
                        <Image
                          src={banner.image}
                          alt={banner.title}
                          fill
                          className='object-cover opacity-30'
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className='relative z-10 h-full flex items-center justify-center text-center '>
                      <div className='max-w-4xl'>
                        <h3 className='text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl'>
                          {banner.title}
                        </h3>
                        <h4 className='text-2xl md:text-3xl font-semibold text-white/90 mb-4 drop-shadow-xl'>
                          {banner.subtitle}
                        </h4>
                        <p className='text-lg md:text-xl text-white/80 mb-6 max-w-2xl mx-auto drop-shadow-lg'>
                          {banner.description}
                        </p>

                        {/* Player Count */}
                        {/* <div className='mb-6 text-white/80 text-sm'>👥 {banner.players}</div> */}

                        {/* <button className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-bold text-lg rounded-2xl border-2 border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm">
                              {banner.cta} →
                            </button> */}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Navigation Dots */}
                <div className='absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3'>
                  {PROMOTIONAL_BANNERS.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePromo(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === activePromo
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Wallet Sidebar */}
      <WalletSidebar
        isOpen={walletSidebarOpen}
        onToggle={() => {
          const newOpenState = !walletSidebarOpen;
          setWalletSidebarOpen(newOpenState);
          // Always ensure it's expanded when opening
          if (newOpenState) {
            setWalletExpanded(true);
          }
        }}
        showBanner={true}
        hideFloatingButton={false}
      />

      {/* NEXUS PRIME Character */}
      <NexusPrime
        currentPage='mini-games'
        walletConnected={isConnected}
        autoOpen={false}
        showDuringLoading={false}
      />

      {/* Footer */}
      <div className='animate-fadeIn'>
        <Footer />
      </div>

      {/* Leaderboard Sidebar */}
      <LeaderboardSidebar
        isOpen={leaderboardSidebarOpen}
        onClose={() => setLeaderboardSidebarOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} />

      {/* Account Status Indicator */}
      <AccountStatusIndicator />

      {/* Toast Container */}
      <ToastContainer />

      {/* Enhanced Donation Modal with Game Info */}
      {showDonationModal && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full p-8'>
            <div className='text-center mb-6'>
              <div className='text-5xl mb-4'>🚀</div>
              <div className='flex items-center justify-center gap-3 mb-2'>
                <h3 className='text-2xl font-bold text-white'>Speed Up Game Development</h3>
              </div>
              <p className='text-white/70 text-sm'>
                Help us reach our funding goal faster and unlock exclusive rewards!
              </p>
            </div>

            {/* Game Info Section */}
            {(() => {
              const game = MINI_GAMES.find(g => g.id === showDonationModal);
              if (!game) return null;
              const donationProgress = (game.currentDonations / game.donationGoal) * 100;
              return (
                <div className='mb-6 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-400/20'>
                  <div className='text-center mb-4'>
                    <div className='text-3xl mb-2'>{game.icon}</div>
                    <h4 className='text-xl font-semibold text-white mb-2'>{game.title}</h4>

                    <div className='flex items-center justify-between text-sm text-white/80 mb-3'>
                      <span>💰 Current: ${game.currentDonations.toLocaleString()}</span>
                      <span>🎯 Goal: ${game.donationGoal.toLocaleString()}</span>
                    </div>

                    <div className='w-full bg-white/10 rounded-full h-3 mb-3'>
                      <div
                        className='h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 shadow-lg'
                        style={{
                          width: `${Math.min(donationProgress, 100)}%`,
                        }}
                      ></div>
                    </div>

                    <p className='text-sm text-purple-200 font-medium mb-2'>
                      {Math.round(donationProgress)}% funded
                    </p>

                    <p className='text-xs text-white/60'>
                      Your donation helps accelerate development and unlock exclusive features!
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Donation Form */}
            <div className='space-y-4'>
              <div>
                <label className='block text-white/80 text-sm font-medium mb-2'>
                  Donation Amount (USD){' '}
                  <span className='px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full animate-pulse'>
                    🔜 COMING SOON
                  </span>
                </label>
                <input
                  type='number'
                  placeholder='Enter amount'
                  disabled
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white/50 placeholder-white/40 cursor-not-allowed opacity-60'
                />
              </div>

              <div className='flex space-x-3'>
                <button
                  disabled
                  className='flex-1 py-3 px-4 bg-gradient-to-r from-purple-500/50 to-pink-500/50 text-white/50 font-semibold rounded-xl cursor-not-allowed opacity-60'
                >
                  💝 Donate Now
                </button>
                <button
                  onClick={closeDonationModal}
                  className='flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300'
                >
                  Cancel
                </button>
              </div>

              {/* Contact Section */}
              <div className='pt-4 border-t border-white/10'>
                <p className='text-white/70 text-sm text-center mb-3'>
                  💬 For official donation channels and inquiries:
                </p>
                <div className='flex gap-3'>
                  <a
                    href={DONATION_SOCIAL_LINKS.TELEGRAM}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2'
                  >
                    <span>💬</span>
                    <span>Telegram</span>
                  </a>
                  <a
                    href={DONATION_SOCIAL_LINKS.DISCORD}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2'
                  >
                    <span>💬</span>
                    <span>Discord</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
