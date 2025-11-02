'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NexusPrime } from '@/components/layout/NexusPrime';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import Image from 'next/image';

export default function DocsPage() {
  const { isConnected } = useGlobalWallet();
  const [activeTab, setActiveTab] = useState('developer'); // 'developer' or 'founder'
  const [activeSection, setActiveSection] = useState('starters');
  const [isLoading, setIsLoading] = useState(() => {
    // Check if this is the first time loading the page
    if (typeof window !== 'undefined') {
      const hasLoadedBefore = localStorage.getItem('docsPageLoaded');
      return !hasLoadedBefore;
    }
    return true;
  });
  const [loadingProgress, setLoadingProgress] = useState(0);

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

  // Developer sections
  const developerSections = [
    { id: 'starters', title: 'Starter Kits', icon: '👨🏻‍💻' },
    { id: 'vibecoding', title: 'Vibecoding Prompts', icon: '✨' },
    { id: 'architecture', title: 'System Architecture', icon: '🏗️' },
  ];

  // Founder sections
  const founderSections = [
    { id: 'trustless-work', title: 'Trustless Work Guide', icon: '🔐' },
    { id: 'stellar-guide', title: 'Stellar Guide', icon: '⭐' },
    { id: 'vibecoding', title: 'Vibecoding Guide', icon: '✨' },
  ];

  const sections = activeTab === 'developer' ? developerSections : founderSections;

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

                              {/* Energy Wave Rings */}
                              <div className='absolute inset-0'>
                                <div
                                  className='absolute inset-0 rounded-full border-2 border-brand-400/40 animate-ping scale-150'
                                  style={{ animationDuration: '4s' }}
                                ></div>
                                <div
                                  className='absolute inset-0 rounded-full border border-accent-400/30 animate-ping scale-200'
                                  style={{ animationDuration: '5s' }}
                                ></div>
                                <div
                                  className='absolute inset-0 rounded-full border border-brand-300/25 animate-ping scale-250'
                                  style={{ animationDuration: '6s' }}
                                ></div>
                              </div>

                              {/* Plasma Energy Streams */}
                              <div className='absolute inset-0'>
                                <div
                                  className='absolute left-0 top-1/2 w-1 h-24 bg-gradient-to-b from-transparent via-brand-400/50 to-transparent animate-pulse opacity-60'
                                  style={{ animationDuration: '3s' }}
                                ></div>
                                <div
                                  className='absolute right-0 top-1/2 w-1 h-20 bg-gradient-to-b from-transparent via-accent-400/50 to-transparent animate-pulse opacity-70'
                                  style={{ animationDuration: '2.5s' }}
                                ></div>
                                <div
                                  className='absolute top-0 left-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent animate-pulse opacity-50'
                                  style={{ animationDuration: '3.5s' }}
                                ></div>
                                <div
                                  className='absolute bottom-0 left-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent animate-pulse opacity-65'
                                  style={{ animationDuration: '2.8s' }}
                                ></div>
                              </div>
                            </div>

                            {/* Title with Enhanced Styling */}
                            <h1
                              className='relative z-10 text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-400 mb-6 drop-shadow-2xl'
                              style={{ zIndex: 1000, marginTop: '-200px' }}
                            >
                              Starter Kits
                            </h1>
                          </div>

                          <br />
                          <br />

                          <p className='text-xl text-white/80 max-w-3xl mx-auto'>
                            Comprehensive technical guide to building decentralized work platforms
                            on the Stellar blockchain
                          </p>

                          {/* Powered by Trustless Work */}
                          <div className='text-center mt-4'>
                            <p className='text-brand-300/70 text-sm font-medium animate-pulse'>
                              Powered by{' '}
                              <span className='text-brand-200 font-semibold'>Trustless Work</span>
                            </p>
                          </div>
                        </div>

                        {/* Developer/Founder Tabs */}
                        <div className='flex justify-center mb-8'>
                          <div className='bg-white/10 rounded-xl p-1 border border-white/20'>
                            <button
                              onClick={() => {
                                setActiveTab('developer');
                                setActiveSection('starters');
                              }}
                              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                activeTab === 'developer'
                                  ? 'bg-gradient-to-r from-brand-500 to-accent-600 text-white shadow-lg'
                                  : 'text-white/70 hover:text-white'
                              }`}
                            >
                              <span className='mr-2'>👨🏻‍💻</span>
                              Developer
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('founder');
                                setActiveSection('trustless-work');
                              }}
                              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                                activeTab === 'founder'
                                  ? 'bg-gradient-to-r from-brand-500 to-accent-600 text-white shadow-lg'
                                  : 'text-white/70 hover:text-white'
                              }`}
                            >
                              <span className='mr-2'>🚀</span>
                              Founder
                            </button>
                          </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className='flex flex-wrap justify-center gap-2 mb-12'>
                          {sections.map(section => (
                            <button
                              key={section.id}
                              onClick={() => {
                                if (section.id !== 'vibecoding') {
                                  setActiveSection(section.id);
                                }
                              }}
                              disabled={section.id === 'vibecoding'}
                              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                                activeSection === section.id
                                  ? 'bg-gradient-to-r from-brand-500 to-accent-600 text-white shadow-lg'
                                  : section.id === 'vibecoding'
                                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              <span className='mr-2'>{section.icon}</span>
                              {section.title}
                              {section.id === 'vibecoding' && (
                                <span className='absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse'>
                                  Coming Soon
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Content Sections */}
                        <div className='border border-white/20 rounded-2xl p-8'>
                          {/* Vibecoding Guide */}
                          {activeSection === 'vibecoding' && (
                            <div className='space-y-8'>
                              <div className='text-center mb-8'>
                                <h2 className='text-3xl font-bold text-white mb-4'>
                                  ✨ Vibecoding Guide
                                </h2>
                                <p className='text-lg text-white/80 max-w-3xl mx-auto'>
                                  The modern approach to building with rhythm, creativity, and flow. 
                                  Learn how to code with vibes, not just syntax.
                                </p>
                              </div>

                              <div className='grid md:grid-cols-2 gap-8'>
                                {/* Vibecoding Principles */}
                                <div className='space-y-6'>
                                  <h3 className='text-2xl font-bold text-accent-300'>
                                    🎵 Vibecoding Principles
                                  </h3>
                                  <div className='space-y-4'>
                                    <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30'>
                                      <h4 className='font-semibold text-white mb-2'>
                                        🎶 Flow State Development
                                      </h4>
                                      <p className='text-white/80 text-sm'>
                                        Enter the zone where code flows naturally, problems solve themselves, 
                                        and creativity meets technical precision.
                                      </p>
                                    </div>
                                    <div className='bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/30'>
                                      <h4 className='font-semibold text-white mb-2'>
                                        🌊 Rhythm-Based Architecture
                                      </h4>
                                      <p className='text-white/80 text-sm'>
                                        Build systems that have natural rhythm - clean patterns, 
                                        predictable flows, and harmonious data structures.
                                      </p>
                                    </div>
                                    <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30'>
                                      <h4 className='font-semibold text-white mb-2'>
                                        ✨ Creative Problem Solving
                                      </h4>
                                      <p className='text-white/80 text-sm'>
                                        Think outside the box, embrace unconventional solutions, 
                                        and let creativity guide your technical decisions.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Modern Development Practices */}
                                <div className='space-y-6'>
                                  <h3 className='text-2xl font-bold text-brand-300'>
                                    🚀 Modern Development Practices
                                  </h3>
                                  <div className='space-y-4'>
                                    <div className='bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-400/30'>
                                      <h4 className='font-semibold text-white mb-2'>
                                        🎯 Intent-Driven Code
                                      </h4>
                                      <p className='text-white/80 text-sm'>
                                        Write code that expresses intent clearly, making it self-documenting 
                                        and maintainable.
                                      </p>
                                    </div>
                                    <div className='bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-lg p-4 border border-yellow-400/30'>
                                      <h4 className='font-semibold text-white mb-2'>
                                        🔥 Hot Reloading Mindset
                                      </h4>
                                      <p className='text-white/80 text-sm'>
                                        Build with instant feedback loops, rapid iteration, 
                                        and continuous improvement cycles.
                                      </p>
                                    </div>
                                    <div className='bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg p-4 border border-indigo-400/30'>
                                      <h4 className='font-semibold text-white mb-2'>
                                        🌐 Web3-First Thinking
                                      </h4>
                                      <p className='text-white/80 text-sm'>
                                        Design for decentralization from the ground up, 
                                        embracing trustless and permissionless architectures.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Vibecoding Workflow */}
                              <div className='bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20'>
                                <h3 className='text-2xl font-bold text-white mb-6'>
                                  🎼 Vibecoding Workflow
                                </h3>
                                <div className='grid md:grid-cols-4 gap-4'>
                                  <div className='text-center p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30'>
                                    <div className='text-3xl mb-3'>🎧</div>
                                    <h4 className='font-semibold text-white mb-2'>Set the Vibe</h4>
                                    <p className='text-white/80 text-sm'>
                                      Create your perfect coding environment - music, lighting, 
                                      and tools that inspire creativity.
                                    </p>
                                  </div>
                                  <div className='text-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30'>
                                    <div className='text-3xl mb-3'>🧠</div>
                                    <h4 className='font-semibold text-white mb-2'>Mind Mapping</h4>
                                    <p className='text-white/80 text-sm'>
                                      Visualize your solution before coding. 
                                      Map out the problem space and solution architecture.
                                    </p>
                                  </div>
                                  <div className='text-center p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30'>
                                    <div className='text-3xl mb-3'>⚡</div>
                                    <h4 className='font-semibold text-white mb-2'>Rapid Prototyping</h4>
                                    <p className='text-white/80 text-sm'>
                                      Build quickly, test often, iterate fast. 
                                      Embrace the "build, break, rebuild" cycle.
                                    </p>
                                  </div>
                                  <div className='text-center p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-400/30'>
                                    <div className='text-3xl mb-3'>🎨</div>
                                    <h4 className='font-semibold text-white mb-2'>Polish & Ship</h4>
                                    <p className='text-white/80 text-sm'>
                                      Refine your creation, add the finishing touches, 
                                      and ship with confidence.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Vibecoding Tools */}
                              <div className='bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-xl p-6 border border-accent-400/30'>
                                <h3 className='text-2xl font-bold text-white mb-4'>
                                  🛠️ Vibecoding Tools & Stack
                                </h3>
                                <div className='grid md:grid-cols-3 gap-6'>
                                  <div>
                                    <h4 className='font-semibold text-accent-300 mb-3'>
                                      Development Environment
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• <strong>VS Code:</strong> With vibecoding extensions</li>
                                      <li>• <strong>Neovim:</strong> For the terminal flow state</li>
                                      <li>• <strong>WebStorm:</strong> Full-featured IDE experience</li>
                                      <li>• <strong>Cursor:</strong> AI-powered coding assistant</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className='font-semibold text-accent-300 mb-3'>
                                      Frameworks & Libraries
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• <strong>React:</strong> Component-based vibes</li>
                                      <li>• <strong>Next.js:</strong> Full-stack flow</li>
                                      <li>• <strong>TypeScript:</strong> Type-safe creativity</li>
                                      <li>• <strong>Tailwind:</strong> Utility-first styling</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className='font-semibold text-accent-300 mb-3'>
                                      Web3 & Blockchain
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• <strong>Stellar SDK:</strong> Blockchain vibes</li>
                                      <li>• <strong>Web3.js:</strong> Ethereum integration</li>
                                      <li>• <strong>Wallet Connect:</strong> Seamless connections</li>
                                      <li>• <strong>IPFS:</strong> Decentralized storage</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              {/* Vibecoding Code Example */}
                              <div className='bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-xl p-6 border border-success-400/30'>
                                <h3 className='text-2xl font-bold text-white mb-4'>
                                  💻 Vibecoding in Action
                                </h3>
                                <div className='bg-white/5 rounded-lg p-4 border border-white/20'>
                                  <pre className='text-white/80 text-sm overflow-x-auto'>
                                    {`// Vibecoding: Building with rhythm and flow
import { useVibe } from '@vibecoding/react';
import { createFlow } from '@vibecoding/core';

const VibecodingComponent = () => {
  const { vibe, setVibe, enterFlowState } = useVibe();
  
  // Set the coding vibe
  useEffect(() => {
    setVibe({
      music: 'lofi-hip-hop',
      lighting: 'warm-glow',
      energy: 'focused-creative'
    });
  }, []);

  // Create a flow state for complex operations
  const handleComplexOperation = async () => {
    await enterFlowState(async () => {
      // This code runs with enhanced focus and creativity
      const result = await createFlow()
        .step('analyze-problem', analyzeProblem)
        .step('design-solution', designSolution)
        .step('implement-code', implementCode)
        .step('test-refine', testAndRefine)
        .execute();
      
      return result;
    });
  };

  return (
    <div className="vibecoding-container">
      <h2>Current Vibe: {vibe.energy}</h2>
      <button onClick={handleComplexOperation}>
        Enter Flow State 🎵
      </button>
    </div>
  );
};

export default VibecodingComponent;`}
                                  </pre>
                                </div>
                              </div>

                              {/* Vibecoding Resources */}
                              <div className='bg-gradient-to-br from-warning-500/20 to-warning-400/20 rounded-xl p-6 border border-warning-400/30'>
                                <h3 className='text-2xl font-bold text-white mb-4'>
                                  📚 Vibecoding Resources
                                </h3>
                                <div className='grid md:grid-cols-2 gap-6'>
                                  <div>
                                    <h4 className='font-semibold text-warning-300 mb-3'>
                                      Learning Resources
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• <strong>Vibecoding Academy:</strong> Master the art of flow coding</li>
                                      <li>• <strong>Flow State Podcast:</strong> Interviews with vibecoding masters</li>
                                      <li>• <strong>Coding Playlists:</strong> Curated music for different coding moods</li>
                                      <li>• <strong>Vibe Templates:</strong> Pre-configured development environments</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className='font-semibold text-warning-300 mb-3'>
                                      Community & Tools
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• <strong>Vibecoding Discord:</strong> Connect with fellow vibe coders</li>
                                      <li>• <strong>Flow Metrics:</strong> Track your coding flow states</li>
                                      <li>• <strong>Vibe Checker:</strong> Analyze your code's vibes</li>
                                      <li>• <strong>Collaborative Sessions:</strong> Pair programming with vibes</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Founder Sections */}
                          {activeTab === 'founder' && (
                            <>
                              {/* Trustless Work Guide */}
                              {activeSection === 'trustless-work' && (
                                <div className='space-y-8'>
                                  <div className='text-center mb-8'>
                                    <h2 className='text-3xl font-bold text-white mb-4'>
                                      🔐 Trustless Work Guide
                                    </h2>
                                    <p className='text-lg text-white/80 max-w-3xl mx-auto'>
                                      Everything founders need to know about Trustless Work mechanics, 
                                      escrow systems, and building decentralized work platforms on Stellar.
                                    </p>
                                  </div>

                                  <div className='grid md:grid-cols-2 gap-8'>
                                    {/* What is Trustless Work */}
                                    <div className='space-y-6'>
                                      <h3 className='text-2xl font-bold text-brand-300'>
                                        🚀 What is Trustless Work?
                                      </h3>
                                      <div className='space-y-4'>
                                        <div className='bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-lg p-4 border border-brand-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🔐 Smart Contract Escrow
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Automated fund management with programmable logic. No intermediaries, 
                                            no trust required - just code and blockchain security.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-lg p-4 border border-success-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            ⚡ Instant Payments
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Built on Stellar's fast, low-cost network. Payments settle in 
                                            3-5 seconds with minimal fees.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-lg p-4 border border-accent-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🌐 Global Access
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Borderless transactions, no geographic restrictions, 
                                            and 24/7 availability for global teams.
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Business Benefits */}
                                    <div className='space-y-6'>
                                      <h3 className='text-2xl font-bold text-accent-300'>
                                        💼 Business Benefits
                                      </h3>
                                      <div className='space-y-4'>
                                        <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            💰 Cost Reduction
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Eliminate payment processing fees, reduce administrative overhead, 
                                            and automate financial workflows.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            ⚡ Speed & Efficiency
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Instant settlements, automated milestone tracking, 
                                            and reduced time-to-payment cycles.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🛡️ Risk Mitigation
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Built-in dispute resolution, time-locked releases, 
                                            and multi-signature security for complex projects.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Implementation Guide */}
                                  <div className='bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20'>
                                    <h3 className='text-2xl font-bold text-white mb-6'>
                                      🛠️ Getting Started
                                    </h3>
                                    <div className='grid md:grid-cols-4 gap-4'>
                                      <div className='text-center p-4 bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-lg border border-brand-400/30'>
                                        <div className='text-3xl mb-3'>1️⃣</div>
                                        <h4 className='font-semibold text-white mb-2'>Understand the Concept</h4>
                                        <p className='text-white/80 text-sm'>
                                          Learn how smart contract escrow works and its benefits for your business.
                                        </p>
                                      </div>
                                      <div className='text-center p-4 bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-lg border border-success-400/30'>
                                        <div className='text-3xl mb-3'>2️⃣</div>
                                        <h4 className='font-semibold text-white mb-2'>Choose Your Use Case</h4>
                                        <p className='text-white/80 text-sm'>
                                          Identify projects, services, or work that can benefit from escrow mechanics.
                                        </p>
                                      </div>
                                      <div className='text-center p-4 bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-lg border border-accent-400/30'>
                                        <div className='text-3xl mb-3'>3️⃣</div>
                                        <h4 className='font-semibold text-white mb-2'>Plan Your Integration</h4>
                                        <p className='text-white/80 text-sm'>
                                          Design workflows, define milestones, and plan dispute resolution processes.
                                        </p>
                                      </div>
                                      <div className='text-center p-4 bg-gradient-to-br from-warning-500/20 to-warning-400/20 rounded-lg border border-warning-400/30'>
                                        <div className='text-3xl mb-3'>4️⃣</div>
                                        <h4 className='font-semibold text-white mb-2'>Launch & Scale</h4>
                                        <p className='text-white/80 text-sm'>
                                          Deploy your solution, onboard users, and scale your trustless work platform.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Stellar Guide */}
                              {activeSection === 'stellar-guide' && (
                                <div className='space-y-8'>
                                  <div className='text-center mb-8'>
                                    <h2 className='text-3xl font-bold text-white mb-4'>
                                      ⭐ Stellar Guide
                                    </h2>
                                    <p className='text-lg text-white/80 max-w-3xl mx-auto'>
                                      Learn about Stellar blockchain, its advantages for business applications, 
                                      and how it powers Trustless Work mechanics.
                                    </p>
                                  </div>

                                  <div className='grid md:grid-cols-2 gap-8'>
                                    {/* Stellar Advantages */}
                                    <div className='space-y-6'>
                                      <h3 className='text-2xl font-bold text-brand-300'>
                                        🌟 Why Stellar?
                                      </h3>
                                      <div className='space-y-4'>
                                        <div className='bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-lg p-4 border border-brand-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            ⚡ Fast & Cheap
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            3-5 second finality with ultra-low fees (~$0.000001 per transaction). 
                                            Perfect for high-volume applications.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-lg p-4 border border-success-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🌍 Global Reach
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Built for cross-border payments with native multi-asset support 
                                            and regulatory compliance features.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-lg p-4 border border-accent-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🔄 Interoperability
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Seamless integration with traditional financial systems 
                                            and other blockchain networks.
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Business Applications */}
                                    <div className='space-y-6'>
                                      <h3 className='text-2xl font-bold text-accent-300'>
                                        💼 Business Applications
                                      </h3>
                                      <div className='space-y-4'>
                                        <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            💳 Payment Processing
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Process payments, subscriptions, and recurring transactions 
                                            with minimal fees and instant settlement.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🏦 Banking Services
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Build banking solutions, remittances, and financial services 
                                            with regulatory compliance.
                                          </p>
                                        </div>
                                        <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30'>
                                          <h4 className='font-semibold text-white mb-2'>
                                            🔐 Escrow Services
                                          </h4>
                                          <p className='text-white/80 text-sm'>
                                            Implement smart contract escrow for freelancing, 
                                            e-commerce, and service-based businesses.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Stellar Ecosystem */}
                                  <div className='bg-gradient-to-br from-warning-500/20 to-warning-400/20 rounded-xl p-6 border border-warning-400/30'>
                                    <h3 className='text-2xl font-bold text-white mb-4'>
                                      🌐 Stellar Ecosystem
                                    </h3>
                                    <div className='grid md:grid-cols-3 gap-6'>
                                      <div>
                                        <h4 className='font-semibold text-warning-300 mb-3'>
                                          Core Assets
                                        </h4>
                                        <ul className='text-white/80 text-sm space-y-2'>
                                          <li>• <strong>XLM:</strong> Native currency for fees and operations</li>
                                          <li>• <strong>USDC:</strong> USD-pegged stablecoin for stable value</li>
                                          <li>• <strong>Custom Assets:</strong> Create your own tokens</li>
                                          <li>• <strong>Anchors:</strong> Fiat currency gateways</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <h4 className='font-semibold text-warning-300 mb-3'>
                                          Development Tools
                                        </h4>
                                        <ul className='text-white/80 text-sm space-y-2'>
                                          <li>• <strong>Stellar SDK:</strong> Core development library</li>
                                          <li>• <strong>Horizon API:</strong> Blockchain data access</li>
                                          <li>• <strong>Laboratory:</strong> Testing and experimentation</li>
                                          <li>• <strong>Network Explorer:</strong> Transaction monitoring</li>
                                        </ul>
                                      </div>
                                      <div>
                                        <h4 className='font-semibold text-warning-300 mb-3'>
                                          Integration Partners
                                        </h4>
                                        <ul className='text-white/80 text-sm space-y-2'>
                                          <li>• <strong>Circle:</strong> USDC issuer and payments</li>
                                          <li>• <strong>MoneyGram:</strong> Global remittances</li>
                                          <li>• <strong>IBM:</strong> Enterprise blockchain solutions</li>
                                          <li>• <strong>Banking Partners:</strong> Traditional finance integration</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* System Architecture */}
                          {activeSection === 'architecture' && (
                            <div className='space-y-8'>
                              <div className='text-center mb-8'>
                                <h2 className='text-3xl font-bold text-white mb-4'>
                                  🏗️ System Architecture
                                </h2>
                                <p className='text-lg text-white/80'>
                                  Comprehensive overview of the Trustless Work system architecture
                                  and component relationships
                                </p>
                              </div>

                              <div className='bg-white/5 rounded-lg p-4 border border-white/20 overflow-x-auto'>
                                <div className='mermaid-diagram min-w-[800px] text-sm'>
                                  <div className='text-center text-white/60 mb-4'>
                                    <p>Trustless Work System Architecture & Data Flow</p>
                                    <p className='text-xs'>
                                      Component relationships and integration points
                                    </p>
                                  </div>

                                  {/* Architecture Diagram using Mermaid-like structure */}
                                  <div className='architecture-diagram space-y-6'>
                                    {/* User Layer */}
                                    <div className='text-center'>
                                      <div className='inline-block bg-gradient-to-r from-brand-500/30 to-accent-500/30 px-6 py-3 rounded-lg border border-brand-400/50'>
                                        <div className='text-2xl mb-2'>👤</div>
                                        <div className='font-semibold text-white'>
                                          User Interface Layer
                                        </div>
                                        <div className='text-xs text-white/70'>
                                          React Components & Hooks
                                        </div>
                                      </div>
                                    </div>

                                    {/* State Management Layer */}
                                    <div className='text-center'>
                                      <div className='inline-block bg-gradient-to-r from-success-500/30 to-success-400/30 px-6 py-3 rounded-lg border border-success-400/50'>
                                        <div className='text-2xl mb-2'>⚙️</div>
                                        <div className='font-semibold text-white'>
                                          State Management Layer
                                        </div>
                                        <div className='text-xs text-white/70'>
                                          React Context & Hooks
                                        </div>
                                      </div>
                                      <div className='grid grid-cols-3 gap-3 mt-4 max-w-2xl mx-auto'>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>
                                            Wallet Context
                                          </div>
                                          <div className='text-xs text-white/60'>
                                            Stellar Integration
                                          </div>
                                        </div>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>
                                            Escrow Context
                                          </div>
                                          <div className='text-xs text-white/60'>
                                            Smart Contract State
                                          </div>
                                        </div>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>
                                            Transaction Context
                                          </div>
                                          <div className='text-xs text-white/60'>
                                            Network Operations
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Business Logic Layer */}
                                    <div className='text-center'>
                                      <div className='inline-block bg-gradient-to-r from-accent-500/30 to-accent-400/30 px-6 py-3 rounded-lg border border-accent-400/50'>
                                        <div className='text-2xl mb-2'>🔧</div>
                                        <div className='font-semibold text-white'>
                                          Business Logic Layer
                                        </div>
                                        <div className='text-xs text-white/70'>
                                          Trustless Work SDK
                                        </div>
                                      </div>
                                      <div className='grid grid-cols-3 gap-3 mt-4 max-w-xl mx-auto'>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>
                                            Escrow Management
                                          </div>
                                          <div className='text-xs text-white/60'>
                                            Contract Logic
                                          </div>
                                        </div>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>
                                            Wallet Operations
                                          </div>
                                          <div className='text-xs text-white/60'>
                                            Key Management
                                          </div>
                                        </div>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>
                                            Transaction Handling
                                          </div>
                                          <div className='text-xs text-white/60'>
                                            Network Operations
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Blockchain Layer */}
                                    <div className='text-center'>
                                      <div className='inline-block bg-warning-500/30 to-warning-400/30 px-6 py-3 rounded-lg border border-warning-400/50'>
                                        <div className='text-2xl mb-2'>🚀</div>
                                        <div className='font-semibold text-white'>
                                          Blockchain Layer
                                        </div>
                                        <div className='text-xs text-white/70'>
                                          Stellar Network
                                        </div>
                                      </div>

                                      {/* Stellar Components */}
                                      <div className='grid grid-cols-2 gap-4 mt-4 max-w-lg mx-auto'>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>Horizon API</div>
                                          <div className='text-xs text-white/60'>
                                            Network Interface
                                          </div>
                                        </div>
                                        <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                          <div className='text-xs text-white/80'>Stellar SDK</div>
                                          <div className='text-xs text-white/60'>
                                            Core Operations
                                          </div>
                                        </div>
                                      </div>

                                      {/* Smart Contract Components */}
                                      <div className='mt-4'>
                                        <div className='text-sm text-white/70 mb-3'>
                                          Smart Contract Components
                                        </div>
                                        <div className='grid grid-cols-2 gap-4 max-w-2xl mx-auto'>
                                          <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                            <div className='text-xs text-white/80'>
                                              Multi-Signature
                                            </div>
                                            <div className='text-xs text-white/60'>
                                              Escrow Accounts
                                            </div>
                                          </div>
                                          <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                            <div className='text-xs text-white/80'>
                                              Time Locks
                                            </div>
                                            <div className='text-xs text-white/60'>
                                              Release Conditions
                                            </div>
                                          </div>
                                          <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                            <div className='text-xs text-white/80'>
                                              Asset Management
                                            </div>
                                            <div className='text-xs text-white/60'>
                                              Token Operations
                                            </div>
                                          </div>
                                          <div className='bg-white/10 px-3 py-2 rounded border border-white/20'>
                                            <div className='text-xs text-white/80'>
                                              Dispute Resolution
                                            </div>
                                            <div className='text-xs text-white/60'>
                                              Arbitration Logic
                                            </div>
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

                              {/* Architecture Description */}
                              <div className='bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20'>
                                <h3 className='text-2xl font-bold text-white mb-4'>
                                  🏛️ Architecture Overview
                                </h3>
                                <div className='grid md:grid-cols-2 gap-6'>
                                  <div>
                                    <h4 className='font-semibold text-brand-300 mb-3'>
                                      System Layers
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>
                                        • <strong>UI Layer:</strong> React components with hooks and
                                        state management
                                      </li>
                                      <li>
                                        • <strong>State Layer:</strong> React Context for global
                                        state synchronization
                                      </li>
                                      <li>
                                        • <strong>Logic Layer:</strong> Trustless Work SDK with
                                        business logic
                                      </li>
                                      <li>
                                        • <strong>Blockchain Layer:</strong> Stellar network
                                        integration and smart contracts
                                      </li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className='font-semibold text-accent-300 mb-3'>
                                      Key Integration Points
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>
                                        • <strong>UI → State:</strong> Components consume context
                                        state and dispatch actions
                                      </li>
                                      <li>
                                        • <strong>State → Logic:</strong> Context uses SDK hooks for
                                        business operations
                                      </li>
                                      <li>
                                        • <strong>Logic → Blockchain:</strong> SDK executes Stellar
                                        operations and contract logic
                                      </li>
                                      <li>
                                        • <strong>Blockchain → State:</strong> Network events update
                                        application state
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Nexus Starters */}
                          {activeSection === 'starters' && (
                            <div className='space-y-8'>
                              <div className='text-center mb-8'>
                                <h2 className='text-3xl font-bold text-white mb-4'>
                                  👨🏻‍💻 Nexus Starters
                                </h2>
                                <p className='text-lg text-white/80 max-w-2xl mx-auto'>
                                  Build on Stellar with Trustless Work — comprehensive starter kits
                                  for innovative apps using advanced escrow mechanics and enhanced
                                  Stellar integrations.
                                </p>
                              </div>

                              <div className='grid md:grid-cols-3 gap-6'>
                                {/* DeFi Starter */}
                                <div className='bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 group relative'>
                                  {/* Coming Soon Badge */}
                                  <div className='absolute top-4 right-4 z-10'>
                                    <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                                      🔜 Coming Soon
                                    </span>
                                  </div>
                                  
                                  <div className='text-center mb-4'>
                                    <div className='text-4xl mb-3 group-hover:scale-110 transition-transform duration-300'>
                                      💎
                                    </div>
                                    <h4 className='text-xl font-bold text-white mb-2'>
                                      DeFi Starter
                                    </h4>
                                    <p className='text-white/70 text-sm mb-4'>
                                      Create decentralized financial apps with escrow contracts and
                                      yield optimization.
                                    </p>
                                  </div>

                                  <div className='space-y-2 mb-4'>
                                    <div className='flex items-center text-sm text-cyan-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Yield farming protocols</span>
                                    </div>
                                    <div className='flex items-center text-sm text-cyan-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Liquidity provision</span>
                                    </div>
                                    <div className='flex items-center text-sm text-cyan-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Cross-chain bridges</span>
                                    </div>
                                    <div className='flex items-center text-sm text-cyan-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Risk management tools</span>
                                    </div>
                                  </div>

                                  <button
                                    disabled
                                    className='block w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white/50 font-semibold py-3 px-4 rounded-xl transition-all duration-300 cursor-not-allowed text-center'
                                  >
                                    💎 Explore DeFi Starter
                                  </button>
                                </div>

                                {/* Gaming Starter */}
                                <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 group relative'>
                                  {/* Coming Soon Badge */}
                                  <div className='absolute top-4 right-4 z-10'>
                                    <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                                      🔜 Coming Soon
                                    </span>
                                  </div>
                                  
                                  <div className='text-center mb-4'>
                                    <div className='text-4xl mb-3 group-hover:scale-110 transition-transform duration-300'>
                                      🎮
                                    </div>
                                    <h4 className='text-xl font-bold text-white mb-2'>
                                      Gaming Starter
                                    </h4>
                                    <p className='text-white/70 text-sm mb-4'>
                                      Build play-to-earn games with secure escrow for tournaments,
                                      rewards, and trading.
                                    </p>
                                  </div>

                                  <div className='space-y-2 mb-4'>
                                    <div className='flex items-center text-sm text-purple-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Tournament prize pools</span>
                                    </div>
                                    <div className='flex items-center text-sm text-purple-300'>
                                      <span className='mr-2'>•</span>
                                      <span>NFT marketplace integration</span>
                                    </div>
                                    <div className='flex items-center text-sm text-purple-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Cross-game asset transfers</span>
                                    </div>
                                    <div className='flex items-center text-sm text-purple-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Automated reward distribution</span>
                                    </div>
                                  </div>

                                  <button
                                    disabled
                                    className='block w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white/50 font-semibold py-3 px-4 rounded-xl transition-all duration-300 cursor-not-allowed text-center'
                                  >
                                    🎮 Explore Gaming Starter
                                  </button>
                                </div>

                                {/* Unicorn Starter */}
                                <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300 group relative'>
                                  {/* Coming Soon Badge */}
                                  <div className='absolute top-4 right-4 z-10'>
                                    <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                                      🔜 Coming Soon
                                    </span>
                                  </div>
                                  
                                  <div className='text-center mb-4'>
                                    <div className='text-4xl mb-3 group-hover:scale-110 transition-transform duration-300'>
                                      🦄
                                    </div>
                                    <h4 className='text-xl font-bold text-white mb-2'>
                                      Unicorn Starter
                                    </h4>
                                    <p className='text-white/70 text-sm mb-4'>
                                      Build "unicorn" apps with cutting-edge features and disruptive
                                      tech.
                                    </p>
                                  </div>

                                  <div className='space-y-2 mb-4'>
                                    <div className='flex items-center text-sm text-green-300'>
                                      <span className='mr-2'>•</span>
                                      <span>AI-powered features</span>
                                    </div>
                                    <div className='flex items-center text-sm text-green-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Cross-chain interoperability</span>
                                    </div>
                                    <div className='flex items-center text-sm text-green-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Advanced tokenomics</span>
                                    </div>
                                    <div className='flex items-center text-sm text-green-300'>
                                      <span className='mr-2'>•</span>
                                      <span>Revolutionary UX/UI</span>
                                    </div>
                                  </div>

                                  <button
                                    disabled
                                    className='block w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white/50 font-semibold py-3 px-4 rounded-xl transition-all duration-300 cursor-not-allowed text-center'
                                  >
                                    🦄 Explore Unicorn Starter
                                  </button>
                                </div>
                              </div>

                              <div className='bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-xl p-6 border border-brand-400/30'>
                                <h3 className='text-2xl font-bold text-white mb-4'>
                                  🚀 Getting Started
                                </h3>
                                <div className='grid md:grid-cols-2 gap-6'>
                                  <div>
                                    <h4 className='font-semibold text-brand-300 mb-3'>
                                      Quick Start
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• Clone the starter repository</li>
                                      <li>• Install dependencies with npm</li>
                                      <li>• Configure your Stellar wallet</li>
                                      <li>• Deploy to your preferred platform</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className='font-semibold text-accent-300 mb-3'>
                                      Features Included
                                    </h4>
                                    <ul className='text-white/80 text-sm space-y-2'>
                                      <li>• Pre-configured Trustless Work integration</li>
                                      <li>• Stellar wallet connection setup</li>
                                      <li>• Example escrow contracts</li>
                                      <li>• TypeScript support and documentation</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </main>

                  {/* Nexus Prime */}
                  <NexusPrime currentPage='docs' walletConnected={isConnected} />

                  <Footer />
                </div>
  );
}
