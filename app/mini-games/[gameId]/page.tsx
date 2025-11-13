'use client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import XboxStyleConsole from '@/components/ui/XboxStyleConsole';
import RetroArcadeSidebar from '@/components/ui/RetroArcadeSidebar';
import { LeaderboardSection } from '@/components/home/LeaderboardSection';
import { LeaderboardSidebar } from '@/components/ui/LeaderboardSidebar';
import InfiniteRunner from '@/components/games/InfiniteRunner';
import EscrowPuzzleMaster from '@/components/games/EscrowPuzzleMaster';
import Image from 'next/image';

// Game data with detailed information - synced with MiniGameStore
const gameLibrary = {
  'web3-basics-adventure': {
    id: 'web3-basics-adventure',
    title: 'NEXUS INFINITE RUNNER',
    subtitle: 'Master blockchain basics through interactive gameplay',
    description:
      'Embark on an epic journey through blockchain fundamentals. Learn smart contracts, wallets, and DeFi while earning crypto rewards!',
    icon: '🌐',
    status: 'beta',
    category: 'learning',
    difficulty: 'Beginner',
    estimatedTime: '2-3 hours',
    rewards: '50 XLM + NFT Badge',
    // currentPlayers: 1247,
    rating: 4.8,
    thumbnail: '/images/games/web3-basics-adventure.png',
    progress: 5,
    estimatedRelease: 'Beta Available',
    donationGoal: 15000,
    currentDonations: 0,
    features: [
      'Smart Contract Basics',
      'Wallet Security',
      'DeFi Fundamentals',
      'Interactive Quests',
    ],
    achievements: [
      'First Transaction',
      'Smart Contract Master',
      'DeFi Explorer',
      'Blockchain Pioneer',
    ],
    developers: [
      { name: 'Web3 Academy', role: 'Core Engine', avatar: '/images/logo/logoicon.png' },
      { name: 'Blockchain Education', role: 'Game Design', avatar: '/images/logo/logoicon.png' },
      { name: 'Crypto Learning Labs', role: 'UI/UX', avatar: '/images/logo/logoicon.png' },
    ],
    technologies: ['React', 'Solidity', 'Web3.js', 'TypeScript'],
    releaseDate: '2024',
    version: '1.0.0',
    size: '32.1 MB',
    tags: ['Adventure', 'Educational', 'Beginner', 'Crypto'],
  },
  'escrow-puzzle-master': {
    id: 'escrow-puzzle-master',
    title: 'Escrow Puzzle Master',
    subtitle: 'Master the Art of Trustless Transactions',
    description:
      'Match escrow mechanics steps in this memory puzzle game! Learn how Trustless Work escrow contracts work by matching steps with their descriptions. Complete all pairs to master the escrow flow!',
    icon: '🔐',
    status: 'beta',
    category: 'blockchain',
    difficulty: 'Intermediate',
    estimatedTime: '10-15 minutes',
    rewards: '60 XLM + Expert Badge',
    currentPlayers: 0,
    rating: 0,
    thumbnail: '/images/games/escrow-puzzle-master.png',
    progress: 30,
    estimatedRelease: 'Beta Available',
    donationGoal: 15000,
    currentDonations: 0,
    features: ['Escrow Systems', 'Trustless Transactions', 'Stellar Network', 'Memory Challenge'],
    achievements: ['Escrow Master', 'Trust Guardian', 'Stellar Expert', 'Memory Champion'],
    developers: [
      {
        name: 'Stellar Development Team',
        role: 'Core Engine',
        avatar: '/images/logo/logoicon.png',
      },
      { name: 'NEXUS Labs', role: 'Game Design', avatar: '/images/logo/logoicon.png' },
      { name: 'Blockchain Gaming Studio', role: 'UI/UX', avatar: '/images/logo/logoicon.png' },
    ],
    technologies: ['Stellar Blockchain', 'Smart Contracts', 'React Hooks', 'TypeScript'],
    releaseDate: '2024',
    version: '1.2.0',
    size: '45.2 MB',
    tags: ['Puzzle', 'Educational', 'Blockchain', 'DeFi'],
  },
  'defi-trading-arena': {
    id: 'defi-trading-arena',
    title: 'DeFi Trading Arena',
    subtitle: 'Compete in DeFi trading challenges',
    description:
      'Enter the competitive world of DeFi trading! Learn liquidity pools, yield farming, and automated market making while competing for top rankings.',
    icon: '📈',
    status: 'development',
    category: 'defi',
    difficulty: 'Advanced',
    estimatedTime: '6-8 hours',
    rewards: '200 XLM + Trading Trophy',
    currentPlayers: 0,
    rating: 0,
    thumbnail: '/images/games/defi-trading-arena.png',
    progress: 0,
    estimatedRelease: 'TBA',
    donationGoal: 15000,
    currentDonations: 0,
    features: ['Liquidity Pools', 'Yield Farming', 'AMM Strategies', 'Risk Management'],
    achievements: ['Trading Champion', 'Yield Master', 'Risk Taker', 'DeFi Legend'],
    developers: [
      { name: 'DeFi Gaming Corp', role: 'Core Engine', avatar: '/images/logo/logoicon.png' },
      { name: 'Trading Masters', role: 'Game Design', avatar: '/images/logo/logoicon.png' },
      { name: 'Financial Gaming', role: 'UI/UX', avatar: '/images/logo/logoicon.png' },
    ],
    technologies: ['Solidity', 'Web3.js', 'Uniswap SDK', 'React'],
    releaseDate: '2024',
    version: '0.9.5',
    size: '67.8 MB',
    tags: ['Trading', 'Competitive', 'Advanced', 'DeFi'],
  },
  'nft-creation': {
    id: 'nft-creation',
    title: 'NFT Creation Studio',
    subtitle: 'Create and trade unique NFTs',
    description:
      'Unleash your creativity in the NFT universe! Design, mint, and trade unique digital assets while learning the art of digital ownership.',
    icon: '🎨',
    status: 'development',
    category: 'nft',
    difficulty: 'Intermediate',
    estimatedTime: '3-4 hours',
    rewards: '75 XLM + Creator Badge',
    currentPlayers: 0,
    rating: 0,
    thumbnail: '/images/games/blank.png',
    progress: 0,
    estimatedRelease: 'TBA',
    donationGoal: 15000,
    currentDonations: 0,
    features: ['NFT Design Tools', 'Minting Process', 'Marketplace Trading', 'Royalty Systems'],
    achievements: ['Creative Genius', 'NFT Pioneer', 'Market Master', 'Digital Artist'],
    developers: [
      { name: 'NFT Gaming Studio', role: 'Core Engine', avatar: '/images/logo/logoicon.png' },
      { name: 'Digital Art Labs', role: 'Game Design', avatar: '/images/logo/logoicon.png' },
      { name: 'Creative Technologies', role: 'UI/UX', avatar: '/images/logo/logoicon.png' },
    ],
    technologies: ['Solidity', 'IPFS', 'Web3.js', 'React'],
    releaseDate: '2024',
    version: '0.8.2',
    size: '52.3 MB',
    tags: ['NFT', 'Creative', 'Intermediate', 'Digital Art'],
  },
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.gameId as string;
  const game = gameLibrary[gameId as keyof typeof gameLibrary];

  const [loadingState, setLoadingState] = useState<'initializing' | 'loading' | 'ready' | 'error'>(
    'initializing'
  );
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [selectedGame, setSelectedGame] = useState(gameId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leaderboardSidebarOpen, setLeaderboardSidebarOpen] = useState(false);

  useEffect(() => {
    if (!game) {
      setLoadingState('error');
      return;
    }

    // Simulate epic arcade machine boot sequence
    const bootSequence = async () => {
      setLoadingState('initializing');

      // Initializing phase
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingState('loading');

      // Loading progress simulation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setLoadingState('ready');
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
    };

    bootSequence();
  }, [game]);

  // Full-screen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleGameSelect = (newGameId: string) => {
    setSelectedGame(newGameId);
    setShowGameSelector(false);
    router.push(`/mini-games/${newGameId}`);
  };

  const handleFullscreenToggle = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  // Removed unused handlePlayGame function

  if (!game) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-8xl mb-6'>❌</div>
          <h1 className='text-4xl font-bold text-white mb-4'>Game Not Found</h1>
          <p className='text-white/70 mb-8'>The requested game could not be loaded.</p>
          <button
            onClick={() => router.push('/mini-games')}
            className='px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all duration-300'
          >
            ← Back to Gaming Station
          </button>
        </div>
      </div>
    );
  }

  // Prepare games data for sidebar
  const sidebarGames = Object.values(gameLibrary || {}).map(game => ({
    id: game.id,
    title: game.title,
    subtitle: game.subtitle,
    icon: game.icon,
    status: game.status,
  }));

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden'>
      <Header />

      {/* Floating Back Button */}
      <button
        onClick={() => router.push('/mini-games')}
        className='fixed top-24 left-4 z-50 group bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-2 border-cyan-400/30 hover:border-cyan-400 text-white px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/50 flex items-center gap-2'
        aria-label='Back to Arcade'
      >
        <svg 
          className='w-5 h-5 md:w-5 md:h-5 transform group-hover:-translate-x-1 transition-transform duration-300' 
          fill='none' 
          stroke='currentColor' 
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
        <span className='font-bold text-xs md:text-sm hidden sm:inline'>Back to Nexus Playground</span>
        <span className='font-bold text-xs sm:hidden'>Back</span>
      </button>

      {/* Main Content */}
      <main className='relative z-10 pt-20 pb-32'>
        <div className='container mx-auto px-4'>
          <div className='max-w-7xl mx-auto'>
            {/* Retro Arcade Sidebar */}
            <RetroArcadeSidebar
              games={sidebarGames}
              selectedGame={selectedGame}
              isFullscreen={isFullscreen}
              onGameSelect={handleGameSelect}
              onFullscreenToggle={handleFullscreenToggle}
            />

            {/* Mobile Game Selector Button */}
            <div className='lg:hidden text-center mb-8'>
              <button
                onClick={() => setShowGameSelector(!showGameSelector)}
                className='px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg'
              >
                🎯 Select Game
              </button>
            </div>

            {/* Game Selector Modal */}
            {showGameSelector && (
              <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
                <div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full p-8 max-h-[80vh] overflow-y-auto'>
                  <div className='text-center mb-6'>
                    <h2 className='text-3xl font-bold text-white mb-2'>🎮 Game Library</h2>
                    <p className='text-white/70'>Select your next adventure</p>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {Object.values(gameLibrary || {}).map(gameOption => (
                      <div
                        key={gameOption.id}
                        onClick={() => handleGameSelect(gameOption.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          gameOption.id === selectedGame
                            ? 'border-cyan-400 bg-cyan-500/10'
                            : 'border-white/20 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5'
                        }`}
                      >
                        <div className='text-center'>
                          <div className='text-4xl mb-2'>{gameOption.icon}</div>
                          <h3 className='font-bold text-white mb-1'>{gameOption.title}</h3>
                          <p className='text-white/70 text-sm mb-2'>{gameOption.subtitle}</p>
                          <div className='flex items-center justify-center space-x-2 text-xs'>
                            <span
                              className={`px-2 py-1 rounded-full ${
                                gameOption.status === 'available'
                                  ? 'bg-green-500/20 text-green-300'
                                  : gameOption.status === 'beta'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-yellow-500/20 text-yellow-300'
                              }`}
                            >
                              {gameOption.status}
                            </span>
                            <span className='text-white/60'>⭐ {gameOption.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='text-center mt-6'>
                    <button
                      onClick={() => setShowGameSelector(false)}
                      className='px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300'
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EPIC XBOX-STYLE LOADING CONSOLE */}
            <XboxStyleConsole
              loadingState={loadingState}
              loadingProgress={loadingProgress}
              gameTitle={game.title}
            />

            {/* Game Ready Screen */}
            {loadingState === 'ready' && (
              <>
                {/* Beta/Available Games - Show Actual Game */}
                {(game.status === 'beta' || game.status === 'available') && (
                  <>
                    <div className='mt-10'>
                      {/* Game Container */}
                      <div className='relative' style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                        {gameId === 'web3-basics-adventure' ? (
                          <InfiniteRunner gameId={gameId} gameTitle={game.title} embedded={true} />
                        ) : gameId === 'escrow-puzzle-master' ? (
                          <EscrowPuzzleMaster />
                        ) : null}
                      </div>
                    </div>
                  </>
                )}

                {/* Development Games - Show Info Screen (old behavior) */}
                {game.status === 'development' && (
                  <div className='space-y-8 mt-10 mb-20'>
                    {/* Game Header */}
                    <div className='text-center'>
                      <h1 className='text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4'>
                        {game.title}
                      </h1>

                      <h2 className='text-2xl md:text-3xl font-semibold text-white/90 mb-6'>
                        {game.subtitle}
                      </h2>

                      <p className='text-lg text-white/80 max-w-3xl mx-auto leading-relaxed'>
                        {game.description}
                      </p>
                    </div>

                    {/* Game Information Grid */}
                    <div className='grid md:grid-cols-2 gap-8'>
                      {/* Game Details */}
                      <div className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8'>
                        <h3 className='text-2xl font-bold text-white mb-6'>🎮 Game Details</h3>

                        <div className='space-y-4'>
                          <div className='flex justify-between items-center p-3 bg-white/5 rounded-xl'>
                            <span className='text-white/70'>Difficulty:</span>
                            <span className='text-white font-semibold'>{game.difficulty}</span>
                          </div>

                          <div className='flex justify-between items-center p-3 bg-white/5 rounded-xl'>
                            <span className='text-white/70'>Duration:</span>
                            <span className='text-white font-semibold'>{game.estimatedTime}</span>
                          </div>

                          <div className='flex justify-between items-center p-3 bg-white/5 rounded-xl'>
                            <span className='text-white/70'>Rewards:</span>
                            <span className='text-white font-semibold'>{game.rewards}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technologies & Features */}
                      <div className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8'>
                        <h3 className='text-2xl font-bold text-white mb-6'>⚡ Technologies</h3>

                        <div className='space-y-4'>
                          <div>
                            <h4 className='text-white/80 font-semibold mb-2'>Core Technologies:</h4>
                            <div className='flex flex-wrap gap-2'>
                              {game.technologies.map((tech, index) => (
                                <span
                                  key={index}
                                  className='px-3 py-1 bg-cyan-500/20 text-cyan-300 text-sm rounded-full border border-cyan-400/30'
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className='text-white/80 font-semibold mb-2'>Key Features:</h4>
                            <div className='flex flex-wrap gap-2'>
                              {game.features.map((feature, index) => (
                                <span
                                  key={index}
                                  className='px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-400/30'
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Development Team */}
                    <div
                      className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8'
                      style={{ marginBottom: '-100px' }}
                    >
                      <h3 className='text-2xl font-bold text-white mb-6 text-center'>
                        👨‍💻 Development Team
                      </h3>

                      <div className='grid md:grid-cols-3 gap-6'>
                        {game.developers.map((dev, index) => (
                          <div
                            key={index}
                            className='text-center p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300'
                          >
                            <div className='w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-cyan-400/30'>
                              <Image
                                src={dev.avatar}
                                alt={dev.name}
                                width={64}
                                height={64}
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <h4 className='text-white font-semibold mb-2'>{dev.name}</h4>
                            <p className='text-cyan-300 text-sm'>{dev.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Hide footer for beta games (where game is shown) */}
      {game.status !== 'beta' && game.status !== 'available' && <Footer />}
    </div>
  );
}
