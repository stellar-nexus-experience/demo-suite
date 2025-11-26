'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signup' | 'signin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const { signUp, signIn, initializeUserWithFirebase, isLoading, error } = useAuth();
  const { walletData, isConnected } = useGlobalWallet();
  const { initializeAccount } = useFirebase();
  const [currentMode, setCurrentMode] = useState<'signup' | 'signin'>(mode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBenefitsExpanded, setIsBenefitsExpanded] = useState(false);

  // Random username suggestions
  const usernameSuggestions = [
    // Crypto & Blockchain Heroes
    'CryptoExplorer',
    'BlockchainNinja',
    'StellarWarrior',
    'DeFiMaster',
    'Web3Wizard',
    'NexusGuardian',
    'TrustlessHero',
    'EscrowExpert',
    'CryptoVoyager',
    'StellarPilot',
    'DeFiAdventurer',
    'BlockchainPioneer',
    'Web3Explorer',
    'CryptoNavigator',
    'StellarSage',
    'TrustlessTrailblazer',
    'EscrowEnthusiast',
    'DeFiDynamo',
    'CryptoChampion',
    'StellarStar',

    // Tech & Innovation
    'CodeCrusader',
    'TechTitan',
    'DigitalDragon',
    'CyberSage',
    'QuantumQuasar',
    'NeuralNexus',
    'DataDynamo',
    'CloudCommander',
    'ByteBender',
    'PixelPioneer',
    'AlgorithmAce',
    'BinaryBard',
    'CircuitSage',
    'LogicLegend',
    'SyntaxSorcerer',
    'FrameworkFalcon',
    'ProtocolPhoenix',
    'SystemSage',
    'NetworkNinja',
    'InterfaceIcon',

    // Stellar & Space Theme
    'StellarSovereign',
    'CosmicCoder',
    'GalaxyGuardian',
    'NebulaNavigator',
    'OrbitOracle',
    'AsteroidAce',
    'CometCommander',
    'MeteorMaster',
    'PlanetPilot',
    'SolarSage',
    'LunarLegend',
    'MarsMariner',
    'JupiterJuggernaut',
    'SaturnSage',
    'UranusUnicorn',
    'NeptuneNavigator',
    'PlutoPioneer',
    'VenusVoyager',
    'MercuryMaster',
    'EarthExplorer',

    // DeFi & Finance
    'YieldYogi',
    'LiquidityLord',
    'SwapSage',
    'PoolPioneer',
    'FarmFalcon',
    'StakeSovereign',
    'BorrowBard',
    'LendLegend',
    'MintMaster',
    'BurnBender',
    'TokenTitan',
    'CoinCommander',
    'AssetAce',
    'PortfolioPhoenix',
    'TradeTrailblazer',
    'MarketMariner',
    'PricePilot',
    'VolumeVoyager',
    'SpreadSage',
    'MarginMaster',

    // Gaming & Adventure
    'QuestQuasar',
    'DungeonDragon',
    'LootLegend',
    'RaidRanger',
    'GuildGuardian',
    'ClanCommander',
    'BattleBard',
    'WarriorWizard',
    'KnightNinja',
    'PaladinPilot',
    'MageMariner',
    'RogueRanger',
    'BardBender',
    'ClericCrusader',
    'MonkMaster',
    'BarbarianBard',
    'SorcererSage',
    'WarlockWizard',
    'DruidDynamo',
    'RangerRocket',

    // Nature & Elements
    'FireFalcon',
    'WaterWizard',
    'EarthExplorer',
    'AirAce',
    'LightningLegend',
    'ThunderTitan',
    'StormSage',
    'WindWanderer',
    'IceIcon',
    'FlameFighter',
    'ForestFalcon',
    'MountainMaster',
    'RiverRanger',
    'OceanOracle',
    'DesertDragon',
    'ValleyVoyager',
    'CanyonCommander',
    'PeakPioneer',
    'SummitSage',
    'CliffCrusader',

    // Mystical & Magic
    'CrystalCrusader',
    'EnchantmentExpert',
    'SpellSage',
    'RuneRanger',
    'GlyphGuardian',
    'MysticMariner',
    'ArcaneAce',
    'EtherealExplorer',
    'CelestialSage',
    'DivineDragon',
    'SacredSorcerer',
    'BlessedBard',
    'CursedCommander',
    'HexedHero',
    'CharmedChampion',
    'EnchantedEagle',
    'MagicalMage',
    'WitchWizard',
    'WarlockWarrior',
    'SorcererSage',

    // Modern & Urban
    'CyberSage',
    'NeonNinja',
    'PixelPioneer',
    'DigitalDragon',
    'VirtualVoyager',
    'HologramHero',
    'MatrixMaster',
    'GridGuardian',
    'NodeNavigator',
    'LinkLegend',
    'StreamSage',
    'CloudCommander',
    'ServerSorcerer',
    'DatabaseDragon',
    'CacheCrusader',
    'APIArchitect',
    'SDKSage',
    'FrameworkFalcon',
    'LibraryLegend',
    'ModuleMaster',

    // Creative & Artistic
    'ArtisanAce',
    'CreatorCrusader',
    'DesignDragon',
    'CanvasCommander',
    'PalettePilot',
    'BrushBard',
    'SketchSage',
    'DoodleDynamo',
    'PaintPioneer',
    'InkIcon',
    'PixelPainter',
    'VectorVoyager',
    'RasterRanger',
    'GraphicGuardian',
    'LogoLegend',
    'BrandBard',
    'IdentityIcon',
    'StyleSage',
    'AestheticAce',
    'VisualVoyager',

    // Professional & Business
    'ExecutiveExplorer',
    'ManagerMaster',
    'DirectorDragon',
    'CEOCommander',
    'CTOCrusader',
    'CFOChief',
    'COOCaptain',
    'VPVictor',
    'DirectorDynamo',
    'LeadLegend',
    'SeniorSage',
    'PrincipalPilot',
    'ArchitectAce',
    'EngineerEagle',
    'DeveloperDragon',
    'AnalystAce',
    'ConsultantCrusader',
    'AdvisorArchitect',
    'StrategistSage',
    'PlannerPioneer',
  ];

  // Reset form when mode changes
  useEffect(() => {
    setCurrentMode(mode);
    setFormData({ username: '', email: '' });
  }, [mode]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletData?.publicKey) return;

    setIsSubmitting(true);
    try {
      if (currentMode === 'signup') {
        // Use Firebase initialization for new users
        await initializeAccount(formData.username, formData.email);
        onClose();
      } else {
        await signIn(walletData.publicKey);
        onClose();
      }
    } catch (err) {
      console.error('Error in signIn:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setCurrentMode(currentMode === 'signup' ? 'signin' : 'signup');
    setFormData({ username: '', email: '' });
  };

  const generateRandomUsername = () => {
    const randomIndex = Math.floor(Math.random() * usernameSuggestions.length);
    const randomSuggestion = usernameSuggestions[randomIndex];
    setFormData({ ...formData, username: randomSuggestion });
  };

  return (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={e => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
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
        <div
          className='absolute bottom-1/4 right-1/3 w-20 h-20 bg-accent-500/20 rounded-full animate-ping'
          style={{ animationDelay: '1.5s' }}
        ></div>
      </div>

      <div className='relative z-10 w-full max-w-md mx-4'>
        {/* Modal content */}
        <div className='bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900 rounded-2xl border border-white/20 shadow-2xl overflow-hidden'>
          {/* Header */}
          <div className='relative p-6 border-b border-white/10'>
            {/* Background effects */}
            <div className='absolute inset-0 bg-gradient-to-r from-brand-500/10 via-accent-500/15 to-brand-400/10'></div>
            <div className='absolute inset-0'>
              <div className='absolute top-2 left-1/4 w-1 h-1 bg-brand-400 rounded-full animate-ping opacity-70'></div>
              <div
                className='absolute top-4 right-1/3 w-1 h-1 bg-accent-400 rounded-full animate-ping opacity-80'
                style={{ animationDelay: '0.5s' }}
              ></div>
            </div>

            <div className='relative z-10 text-center'>
              {/* Title */}
              <h2 className='text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 mb-2'>
                {currentMode === 'signup' ? '🚀 Create Account' : '🔑 Sign In'}
              </h2>
              <p className='text-white/70 text-sm'>
                {currentMode === 'signup'
                  ? 'Join the Nexus Experience and unlock your potential!'
                  : 'Welcome back to your Nexus journey!'}
              </p>
            </div>
          </div>

          {/* Wallet info */}
          {isConnected && walletData?.publicKey && (
            <div className='px-6 py-4 bg-white/5 border-b border-white/10'>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                <div className='flex-1'>
                  <p className='text-white/80 text-sm'>Connected Wallet</p>
                  <p className='text-brand-300 text-xs font-mono'>
                    {walletData.publicKey.slice(0, 12)}...{walletData.publicKey.slice(-8)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='p-6 space-y-4'>
            {currentMode === 'signup' && (
              <>
                {/* Username field */}
                <div>
                  <label className='block text-white/80 text-sm font-medium mb-2'>
                    Username (Optional)
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      placeholder='Choose a cool username'
                      className='w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300'
                    />
                    <button
                      type='button'
                      onClick={generateRandomUsername}
                      className='absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 hover:text-brand-200 rounded text-xs font-medium transition-all duration-200 hover:scale-105'
                      title='Generate random username'
                    >
                      🎲
                    </button>
                  </div>
                  <p className='text-white/60 text-xs mt-1'>
                    Leave empty to auto-generate: User_{walletData?.publicKey.slice(-6)}
                  </p>
                </div>

                {/* Email field */}
                <div>
                  <label className='block text-white/80 text-sm font-medium mb-2'>
                    Email (Optional)
                  </label>
                  <input
                    type='email'
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder='your@email.com'
                    className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300'
                  />
                  <p className='text-white/60 text-xs mt-1'>
                    For notifications and rewards (optional)
                  </p>
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <div className='p-3 bg-red-500/20 border border-red-500/30 rounded-lg'>
                <p className='text-red-300 text-sm'>{error}</p>
              </div>
            )}

            {/* Benefits for signup */}
            {currentMode === 'signup' && (
              <div className='bg-white/5 rounded-lg border border-white/10 overflow-hidden'>
                <button
                  type='button'
                  onClick={() => setIsBenefitsExpanded(!isBenefitsExpanded)}
                  className='w-full px-4 py-3 flex items-center justify-between text-white font-semibold text-sm hover:bg-white/5 transition-colors duration-200'
                >
                  <span className='flex items-center space-x-2'>
                    <span>🎁</span>
                    <span>What you'll get:</span>
                  </span>
                  <span
                    className={`transform transition-transform duration-200 ${isBenefitsExpanded ? 'rotate-180' : 'rotate-0'}`}
                  >
                    ▼
                  </span>
                </button>
                {isBenefitsExpanded && (
                  <div className='px-4 pb-4 space-y-2 text-xs text-white/70 animate-fadeIn'>
                    <div className='flex items-center space-x-2'>
                      <span>📊</span>
                      <span>Track your demo progress</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span>🏆</span>
                      <span>Earn exclusive NFT badges</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span>⭐</span>
                      <span>Unlock special rewards</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <span>📈</span>
                      <span>Level up and gain XP</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className='space-y-3'>
              {/* Submit button */}
              <button
                type='submit'
                disabled={!isConnected || isSubmitting || isLoading}
                className='w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
              >
                {isSubmitting || isLoading ? (
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                    <span>
                      {currentMode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center justify-center space-x-2'>
                    <span>{currentMode === 'signup' ? '✨ Create Account' : '🔑 Sign In'}</span>
                  </div>
                )}
              </button>

              {/* Switch mode button */}
              <button
                type='button'
                onClick={switchMode}
                className='w-full px-4 py-2 text-white/70 hover:text-white text-sm transition-colors duration-200'
              >
                {currentMode === 'signup'
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className='px-6 py-4 bg-white/5 border-t border-white/10'>
            <div className='text-center'>
              <p className='text-white/60 text-xs'>
                By {currentMode === 'signup' ? 'creating an account' : 'signing in'}, you agree to
                our terms of service
              </p>
              <div className='flex items-center justify-center space-x-4 mt-2 text-xs text-white/50'>
                <span>🔒 Secure</span>
                <span>⚡ Fast</span>
                <span>🎯 Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 z-20 p-2 text-white/60 hover:text-white/80 hover:bg-white/10 rounded-lg transition-all duration-200'
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
  );
};
