'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NexusPrime } from '@/components/layout/NexusPrime';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import Image from 'next/image';

export default function DocsPage() {
  const { isConnected } = useGlobalWallet();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'developer' | 'founder'>('developer');
  const [isLoading, setIsLoading] = useState(() => {
    // Check if this is the first time loading the page
    if (typeof window !== 'undefined') {
      const hasLoadedBefore = localStorage.getItem('docsPageLoaded');
      return !hasLoadedBefore;
    }
    return true;
  });
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Handle opening sidebar with specific tab
  const openSidebar = (tab: 'developer' | 'founder') => {
    setSidebarTab(tab);
    setIsSidebarOpen(true);
  };

  // Loading effect - only on first load
  useEffect(() => {
    if (!isLoading) return; // Skip if already loaded

    const loadingSteps = [
      { progress: 20, message: 'Loading Documentation...' },
      { progress: 40, message: 'Initializing Tech Stack...' },
      { progress: 60, message: 'Preparing Code Examples...' },
      { progress: 80, message: 'Setting up API References...' },
      { progress: 100, message: 'Documentation Ready!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setLoadingProgress(loadingSteps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          // Mark that the page has been loaded
          if (typeof window !== 'undefined') {
            localStorage.setItem('docsPageLoaded', 'true');
          }
        }, 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900'>
      <Header />

      {/* Loading Screen */}
      {isLoading && (
        <div className='fixed inset-0 z-[9999] bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900 flex items-center justify-center'>
          {/* Animated Background */}
          <div className='absolute inset-0 overflow-hidden'>
            {/* Floating Energy Orbs */}
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

            {/* Energy Grid */}
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.1)_0%,_transparent_70%)] animate-pulse'></div>
          </div>

          {/* Main Content */}
          <div className='relative z-10 text-center'>
            {/* Logo Animation */}
            <div className='mb-8 animate-bounce'>
              <Image
                src='/images/logo/logoicon.png'
                alt='STELLAR NEXUS'
                width={120}
                height={120}
                className='w-30 h-30'
              />
            </div>

            {/* Loading Text */}
            <div className='mb-8'>
              <h2 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400 mb-4'>
                Loading Documentation
              </h2>
              <p className='text-white/70 text-lg animate-pulse'>
                Preparing comprehensive technical guides...
              </p>
            </div>

            {/* Loading Bar */}
            <div className='w-80 bg-white/10 rounded-full h-3 overflow-hidden mb-6'>
              <div
                className='bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400 h-3 rounded-full transition-all duration-500'
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            {/* Loading Steps */}
            <div className='space-y-2'>
              <p className='animate-fadeInUp' style={{ animationDelay: '1s' }}>
                Loading Documentation...
              </p>
              <p className='animate-fadeInUp' style={{ animationDelay: '2s' }}>
                Initializing Tech Stack...
              </p>
              <p className='animate-fadeInUp' style={{ animationDelay: '3s' }}>
                Preparing Code Examples...
              </p>
              <p className='animate-fadeInUp' style={{ animationDelay: '4s' }}>
                Setting up API References...
              </p>
              <p className='animate-fadeInUp' style={{ animationDelay: '5s' }}>
                Documentation Ready!
              </p>
            </div>

            {/* Progress Percentage */}
            <div className='mt-6 text-white/60'>
              <span className='font-bold'>{loadingProgress}%</span> Complete
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className='relative z-10 pt-20 '>
        <div className='container mx-auto px-4'>
          <div className='max-w-6xl mx-auto'>
            {/* Page Header */}
            <div className='text-center mb-16'>
              <div className='flex justify-center mb-6'>
                <Image
                  src='/images/logo/logoicon.png'
                  alt='STELLAR NEXUS'
                  width={300}
                  height={300}
                  style={{ zIndex: -1, position: 'relative' }}
                />
              </div>

              {/* Epic Legendary Background for Title */}
              <div className='relative mb-8'>
                {/* Legendary Energy Background */}
                <div className='absolute inset-0 flex justify-center items-center pointer-events-none'>
                  {/* Primary Energy Core */}
                  <div className='relative w-[500px] h-40'>
                    {/* Inner Energy Ring */}
                    <div className='absolute inset-0 rounded-full bg-gradient-to-r from-brand-500/40 via-accent-500/50 to-brand-400/40 blur-lg scale-150'></div>

                    {/* Middle Energy Ring */}
                    <div className='absolute inset-0 rounded-full bg-gradient-to-r from-accent-500/30 via-brand-500/40 to-accent-400/30 blur-xl scale-200'></div>

                    {/* Outer Energy Ring */}
                    <div className='absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/20 via-accent-500/30 to-brand-300/20 blur-2xl scale-250'></div>
                  </div>

                  {/* Floating Energy Particles */}
                  <div className='absolute inset-0'>
                    <div className='absolute top-6 left-1/4 w-3 h-3 bg-brand-400 rounded-full animate-ping opacity-80'></div>
                    <div
                      className='absolute top-12 right-1/3 w-2 h-2 bg-accent-400 rounded-full animate-ping opacity-90'
                      style={{ animationDelay: '0.5s' }}
                    ></div>
                    <div
                      className='absolute bottom-8 left-1/3 w-2.5 h-2.5 bg-brand-300 rounded-full animate-ping opacity-70'
                      style={{ animationDelay: '1s' }}
                    ></div>
                    <div
                      className='absolute bottom-12 right-1/4 w-2 h-2 bg-accent-300 rounded-full animate-ping opacity-85'
                      style={{ animationDelay: '1.5s' }}
                    ></div>
                    <div
                      className='absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-brand-200 rounded-full animate-ping opacity-60'
                      style={{ animationDelay: '2s' }}
                    ></div>
                    <div
                      className='absolute top-1/2 right-1/6 w-2 h-2 bg-accent-200 rounded-full animate-ping opacity-75'
                      style={{ animationDelay: '2.5s' }}
                    ></div>
                  </div>

                </div>

                {/* Title with Enhanced Styling */}
                <h1
                  className='relative z-10 text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400 mb-6 drop-shadow-2xl'
                  style={{ zIndex: 1000, marginTop: '-200px' }}
                >
                  DOCS
                </h1>
              </div>

            </div>

            {/* Stellar Nexus Experience Platform Overview */}
            <div className='mb-16 relative'>
              {/* Background Effects */}
              <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                <div className='absolute top-1/2 left-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl animate-pulse'></div>
                <div className='absolute top-1/3 right-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Section Header */}
              <div className='text-center mb-12 relative z-10'>
                <div className='inline-block mb-4'>
                  <div className='flex items-center justify-center space-x-3'>
                    <h2 className='text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400'>
                      Stellar Nexus Experience
                    </h2>
                  </div>
                </div>
                <p className='text-xl text-white/80 max-w-3xl mx-auto leading-relaxed'>
                  The next-generation decentralized work platform built on Stellar blockchain,
                  empowering the future of trustless collaboration
                </p>
              </div>

              {/* Value Proposition Cards */}
              <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10'>
                {/* Decentralized Work Platform */}
                <div className='group bg-gradient-to-br from-brand-500/10 to-brand-600/10 backdrop-blur-sm border border-brand-400/30 rounded-2xl p-6 hover:border-brand-400/60 hover:shadow-xl hover:shadow-brand-500/20 transition-all duration-300 hover:-translate-y-1'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>🔐</div>
                  <h3 className='text-xl font-bold text-white mb-3'>Trustless Escrow</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Smart contract-powered escrow mechanics ensuring secure, transparent collaboration without intermediaries
                  </p>
                </div>

                {/* Stellar Integration */}
                <div className='group bg-gradient-to-br from-accent-500/10 to-accent-600/10 backdrop-blur-sm border border-accent-400/30 rounded-2xl p-6 hover:border-accent-400/60 hover:shadow-xl hover:shadow-accent-500/20 transition-all duration-300 hover:-translate-y-1'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>⚡</div>
                  <h3 className='text-xl font-bold text-white mb-3'>Lightning Fast</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Built on Stellar for 3-5 second finality and ultra-low fees, perfect for global work transactions
                  </p>
                </div>

                {/* Developer Experience */}
                <div className='group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 hover:border-purple-400/60 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>👨🏻‍💻</div>
                  <h3 className='text-xl font-bold text-white mb-3'>Developer First</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Comprehensive SDKs, starter kits, and documentation to build your own trustless work platform
                  </p>
                </div>

                {/* Community Benefits */}
                <div className='group bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 hover:border-green-400/60 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>🌐</div>
                  <h3 className='text-xl font-bold text-white mb-3'>Community Driven</h3>
                  <p className='text-white/70 text-sm leading-relaxed'>
                    Open-source, transparent, and built for the blockchain community with gamification and rewards
                  </p>
                </div>
              </div>

              {/* Key Features Showcase */}
              <div className='bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 relative z-10'>
                <h3 className='text-2xl font-bold text-white mb-6 text-center'>
                  Platform Capabilities
                </h3>
                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {/* Feature 1 */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Smart Contract Escrow</h4>
                      <p className='text-white/60 text-sm'>Automated fund management with programmable logic</p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Instant Settlements</h4>
                      <p className='text-white/60 text-sm'>3-5 second transaction finality on Stellar</p>
                    </div>
                  </div>

                  {/* Feature 3 - Multi-Signature Security with Coming Soon Badge */}
                  <div className='flex items-start space-x-3 relative'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='font-semibold text-white'>Multi-Signature Security</h4>
                        <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full'>
                          🔜 Soon
                        </span>
                      </div>
                      <p className='text-white/60 text-sm'>Enhanced protection for complex projects</p>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Global Accessibility</h4>
                      <p className='text-white/60 text-sm'>Borderless transactions, 24/7 availability</p>
                    </div>
                  </div>

                  {/* Feature 5 */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Quest & Achievement System</h4>
                      <p className='text-white/60 text-sm'>Gamified experience with rewards and badges</p>
                    </div>
                  </div>

                  {/* Feature 6 */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Referral Program</h4>
                      <p className='text-white/60 text-sm'>Earn rewards by growing the community</p>
                    </div>
                  </div>

                  {/* Feature 7 - Playground Games */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Playground Games</h4>
                      <p className='text-white/60 text-sm'>Interactive games with donation system to accelerate development</p>
                    </div>
                  </div>

                  {/* Feature 8 - Game Development Funding */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Game Development Funding</h4>
                      <p className='text-white/60 text-sm'>Support specific games through donations to speed up features</p>
                    </div>
                  </div>

                  {/* Feature 9 - Trustless Milestones */}
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold'>
                      ✓
                    </div>
                    <div>
                      <h4 className='font-semibold text-white mb-1'>Trustless Milestones</h4>
                      <p className='text-white/60 text-sm'>Create custom game challenges with escrow-backed rewards</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Architecture Section - Collapsible */}
              <details className='mt-16 group'>
                <summary className='cursor-pointer list-none'>
                  <div className='text-center mb-8 transition-all duration-300'>
                    <div className='inline-flex items-center space-x-3 bg-gradient-to-r from-brand-500/20 to-accent-500/20 px-6 py-4 rounded-xl border border-brand-400/30 hover:border-brand-400/60 hover:shadow-lg hover:shadow-brand-500/20 transition-all duration-300'>
                      <span className='text-2xl group-open:rotate-90 transition-transform duration-300'>▶</span>
                      <h3 className='text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400'>
                        🏗️ System Architecture
                      </h3>
                    </div>
                    <p className='text-md text-white/70 max-w-3xl mx-auto mt-3'>
                      Click to view comprehensive overview of the Trustless Work system architecture
                    </p>
                  </div>

                </summary>

                <div className='mt-8 space-y-8'>
                  <div className='bg-white/5 rounded-lg p-6 border border-white/20 overflow-x-auto'>
                    <div className='mermaid-diagram min-w-[800px] text-sm'>
                      <div className='text-center text-white/60 mb-6'>
                        <p className='text-lg'>Trustless Work System Architecture & Data Flow</p>
                        <p className='text-xs'>Component relationships and integration points</p>
                      </div>

                      {/* Architecture Diagram */}
                      <div className='architecture-diagram space-y-6'>
                        {/* User Layer */}
                        <div className='text-center'>
                          <div className='inline-block bg-gradient-to-r from-brand-500/30 to-accent-500/30 px-6 py-3 rounded-lg border border-brand-400/50'>
                            <div className='text-2xl mb-2'>👤</div>
                            <div className='font-semibold text-white'>User Interface Layer</div>
                            <div className='text-xs text-white/70'>React Components & Hooks</div>
                          </div>
                        </div>

                        {/* State Management Layer */}
                        <div className='text-center'>
                          <div className='inline-block bg-gradient-to-r from-success-500/30 to-success-400/30 px-6 py-3 rounded-lg border border-success-400/50'>
                            <div className='text-2xl mb-2'>⚙️</div>
                            <div className='font-semibold text-white'>State Management Layer</div>
                            <div className='text-xs text-white/70'>React Context & Hooks</div>
                          </div>
                          <div className='grid grid-cols-3 gap-3 mt-4 max-w-2xl mx-auto'>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Wallet Context</div>
                              <div className='text-xs text-white/60'>Stellar Integration</div>
                            </div>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Escrow Context</div>
                              <div className='text-xs text-white/60'>Smart Contract State</div>
                            </div>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Transaction Context</div>
                              <div className='text-xs text-white/60'>Network Operations</div>
                            </div>
                          </div>
                        </div>

                        {/* Business Logic Layer */}
                        <div className='text-center'>
                          <div className='inline-block bg-gradient-to-r from-accent-500/30 to-accent-400/30 px-6 py-3 rounded-lg border border-accent-400/50'>
                            <div className='text-2xl mb-2'>🔧</div>
                            <div className='font-semibold text-white'>Business Logic Layer</div>
                            <div className='text-xs text-white/70'>Trustless Work SDK</div>
                          </div>
                          <div className='grid grid-cols-3 gap-3 mt-4 max-w-xl mx-auto'>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Escrow Management</div>
                              <div className='text-xs text-white/60'>Contract Logic</div>
                            </div>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Wallet Operations</div>
                              <div className='text-xs text-white/60'>Key Management</div>
                            </div>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Transaction Handling</div>
                              <div className='text-xs text-white/60'>Network Operations</div>
                            </div>
                          </div>
                        </div>

                        {/* Blockchain Layer */}
                        <div className='text-center'>
                          <div className='inline-block bg-warning-500/30 to-warning-400/30 px-6 py-3 rounded-lg border border-warning-400/50'>
                            <div className='text-2xl mb-2'>🚀</div>
                            <div className='font-semibold text-white'>Blockchain Layer</div>
                            <div className='text-xs text-white/70'>Stellar Network</div>
                          </div>

                          {/* Stellar Components */}
                          <div className='grid grid-cols-2 gap-4 mt-4 max-w-lg mx-auto'>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Horizon API</div>
                              <div className='text-xs text-white/60'>Network Interface</div>
                            </div>
                            <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                              <div className='text-xs text-white/80'>Stellar SDK</div>
                              <div className='text-xs text-white/60'>Core Operations</div>
                            </div>
                          </div>

                          {/* Smart Contract Components */}
                          <div className='mt-4'>
                            <div className='text-sm text-white/70 mb-3'>Smart Contract Components</div>
                            <div className='grid grid-cols-2 gap-4 max-w-2xl mx-auto'>
                              <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                <div className='text-xs text-white/80'>Multi-Signature</div>
                                <div className='text-xs text-white/60'>Escrow Accounts</div>
                              </div>
                              <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                <div className='text-xs text-white/80'>Time Locks</div>
                                <div className='text-xs text-white/60'>Release Conditions</div>
                              </div>
                              <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                <div className='text-xs text-white/80'>Asset Management</div>
                                <div className='text-xs text-white/60'>Token Operations</div>
                              </div>
                              <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                <div className='text-xs text-white/80'>Dispute Resolution</div>
                                <div className='text-xs text-white/60'>Arbitration Logic</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Data Flow Indicators */}
                        <div className='text-center text-white/60 text-xs'>
                          <div className='flex items-center justify-center space-x-8'>
                            <div className='flex items-center space-x-2'>
                              <div className='w-3 h-3 bg-brand-400 rounded-full'></div>
                              <span>Uses</span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <div className='w-3 h-3 bg-success-400 rounded-full'></div>
                              <span>Manages State</span>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <div className='w-3 h-3 bg-accent-400 rounded-full'></div>
                              <span>Executes Logic</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </details>
            </div>

            {/* Architecture Description */}
            <div className='bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20'>
              <h3 className='text-2xl font-bold text-white mb-4'>🏛️ Architecture Overview</h3>
              <div className='grid md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-semibold text-brand-300 mb-3'>System Layers</h4>
                  <ul className='text-white/80 text-sm space-y-2'>
                    <li>
                      • <strong>UI Layer:</strong> React components with hooks and state management
                    </li>
                    <li>
                      • <strong>State Layer:</strong> React Context for global state synchronization
                    </li>
                    <li>
                      • <strong>Logic Layer:</strong> Trustless Work SDK with business logic
                    </li>
                    <li>
                      • <strong>Blockchain Layer:</strong> Stellar network integration and smart contracts
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className='font-semibold text-accent-300 mb-3'>Key Integration Points</h4>
                  <ul className='text-white/80 text-sm space-y-2'>
                    <li>
                      • <strong>UI → State:</strong> Components consume context state and dispatch actions
                    </li>
                    <li>
                      • <strong>State → Logic:</strong> Context uses SDK hooks for business operations
                    </li>
                    <li>
                      • <strong>Logic → Blockchain:</strong> SDK executes Stellar operations and contract logic
                    </li>
                    <li>
                      • <strong>Blockchain → State:</strong> Network events update application state
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* DocsSidebar Component */}
      <DocsSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        initialTab={sidebarTab}
      />

      {/* Floating Documentation Button */}
      {!isSidebarOpen && (
        <div className='fixed bottom-8 right-8 z-30 flex flex-col space-y-3'>
          <button
            onClick={() => openSidebar('developer')}
            className='group p-4 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110 relative -p-10'
            title='Open Documentation'
          >
            <span className='text-2xl'>
              <Image
                src='/images/logo/logoicon.png'
                alt='STELLAR NEXUS'
                width={54}
                height={54}
                style={{ width: 'auto', height: 'auto' }}
              />
            </span>
            {/* Tooltip */}
            <div className='absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'>
              Open Documentation
            </div>
          </button>
        </div>
      )}

      {/* Nexus Prime */}
      <NexusPrime currentPage='docs' walletConnected={isConnected} />

      <Footer />
    </div>
  );
}
