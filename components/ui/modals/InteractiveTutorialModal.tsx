'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  icon?: string;
  completed?: boolean;
}

interface TutorialSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  steps: TutorialStep[];
}

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections?: TutorialSection[];
}

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  sections = [],
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Default tutorial sections if none provided
  const defaultSections: TutorialSection[] = [
    {
      id: 'welcome',
      title: 'Welcome to STELLAR NEXUS',
      icon: '🚀',
      color: 'from-blue-500 to-cyan-500',
      steps: [
        {
          id: 'welcome-1',
          title: 'Welcome to STELLAR NEXUS! 🚀',
          description:
            "I'm your AI Guardian, NEXUS PRIME. Let me show you around the ESCROW ARSENAL!",
          icon: '👋',
        },
        {
          id: 'welcome-2',
          title: 'What is Trustless Work? 💼',
          description:
            'Trustless work systems use blockchain technology to ensure fair payments without needing to trust intermediaries.',
          icon: '🔒',
        },
        {
          id: 'welcome-3',
          title: 'Why Stellar? ⭐',
          description:
            'Stellar provides fast, low-cost transactions perfect for escrow systems and micropayments.',
          icon: '⚡',
        },
      ],
    },
    {
      id: 'wallet-setup',
      title: 'Wallet Setup',
      icon: '🦎',
      color: 'from-green-500 to-emerald-500',
      steps: [
        {
          id: 'wallet-1',
          title: 'Install Freighter Wallet 🦎',
          description:
            "First, install the Freighter browser extension from freighter.app. It's your gateway to the Stellar network.",
          icon: '📥',
          image: '/images/tutorial/freighter-install.png',
          imageAlt: 'Freighter wallet installation',
        },
        {
          id: 'wallet-2',
          title: 'Create Your Wallet 🔑',
          description:
            'Create a new wallet with a strong password. Write down your 24-word recovery phrase and store it safely.',
          icon: '🔐',
          image: '/images/tutorial/wallet-creation.png',
          imageAlt: 'Wallet creation process',
        },
        {
          id: 'wallet-3',
          title: 'Connect to Testnet 🧪',
          description:
            'Switch to Stellar Testnet for safe testing. You can get free test XLM from the Stellar Laboratory.',
          icon: '🔗',
          image: '/images/tutorial/testnet-setup.png',
          imageAlt: 'Testnet configuration',
        },
      ],
    },
    {
      id: 'demo-exploration',
      title: 'Demo Exploration',
      icon: '🎮',
      color: 'from-purple-500 to-pink-500',
      steps: [
        {
          id: 'demo-1',
          title: 'Baby Steps Demo 🍼',
          description:
            'Start with our simplest escrow demo. Learn the basics of creating escrows and managing milestones.',
          icon: '👶',
          image: '/images/tutorial/baby-steps-demo.png',
          imageAlt: 'Baby Steps demo interface',
        },
        {
          id: 'demo-2',
          title: 'Drama Queen Escrow 👑',
          description:
            'Experience dispute resolution in action. Learn how arbitration works in trustless systems.',
          icon: '⚖️',
          image: '/images/tutorial/dispute-resolution.png',
          imageAlt: 'Dispute resolution demo',
        },
        {
          id: 'demo-3',
          title: 'Gig Economy Marketplace 🛒',
          description:
            'Explore a complete marketplace with task posting, worker matching, and automated payments.',
          icon: '🏪',
          image: '/images/tutorial/marketplace-demo.png',
          imageAlt: 'Marketplace demo interface',
        },
      ],
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      icon: '⚡',
      color: 'from-orange-500 to-red-500',
      steps: [
        {
          id: 'advanced-1',
          title: 'Quest System 🎯',
          description:
            'Complete quests to earn XP, badges, and unlock new features. Each quest teaches you something new.',
          icon: '🏆',
          image: '/images/tutorial/quest-system.png',
          imageAlt: 'Quest system interface',
        },
        {
          id: 'advanced-2',
          title: 'Referral Program 👥',
          description:
            'Invite friends and earn rewards. Build your network and help grow the trustless work community.',
          icon: '🎁',
          image: '/images/tutorial/referral-system.png',
          imageAlt: 'Referral system dashboard',
        },
        {
          id: 'advanced-3',
          title: 'Leaderboard Competition 🏅',
          description:
            'Compete with other users on the global leaderboard. Climb the ranks and earn exclusive rewards.',
          icon: '🌍',
          image: '/images/tutorial/leaderboard.png',
          imageAlt: 'Global leaderboard',
        },
      ],
    },
  ];

  const tutorialSections = sections.length > 0 ? sections : defaultSections;
  const currentSectionData = tutorialSections[currentSection];
  const currentStepData = currentSectionData?.steps[currentStep];

  // Calculate overall progress across all sections
  const totalSteps = tutorialSections.reduce((total, section) => total + section.steps.length, 0);
  const completedSteps =
    tutorialSections
      .slice(0, currentSection)
      .reduce((total, section) => total + section.steps.length, 0) + currentStep;
  const overallProgress = Math.round((completedSteps / totalSteps) * 100);

  const handleSectionChange = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setCurrentStep(0);
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const nextStep = () => {
    if (currentStep < currentSectionData.steps.length - 1) {
      handleStepChange(currentStep + 1);
    } else if (currentSection < tutorialSections.length - 1) {
      handleSectionChange(currentSection + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    } else if (currentSection > 0) {
      const prevSection = currentSection - 1;
      setCurrentSection(prevSection);
      setCurrentStep(tutorialSections[prevSection].steps.length - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          nextStep();
          break;
        case 'ArrowLeft':
          prevStep();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentStep, currentSection]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg sm:rounded-2xl border border-white/20 shadow-2xl max-w-6xl w-full max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-brand-500/20 to-accent-500/20 p-3 sm:p-6 border-b border-white/20'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full flex items-center justify-center flex-shrink-0'>
                <Image
                  src='/images/character/baby.png'
                  alt='NEXUS PRIME'
                  width={62}
                  height={62}
                  className='rounded-full'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <h2 className='text-base sm:text-2xl font-bold text-white truncate'>
                  Interactive Tutorial
                </h2>
                <p className='text-white/60 text-xs sm:text-sm line-clamp-1 sm:line-clamp-none'>
                  Learn how to be an early adopter of Web3 & the ESCROW ARSENAL step by step
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className='flex items-center space-x-2 flex-shrink-0'>
              <button
                onClick={onClose}
                className='px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105 text-xs sm:text-sm whitespace-nowrap'
              >
                ✕ <span className='hidden sm:inline'>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex flex-col lg:flex-row overflow-hidden'>
          {/* Left Sidebar - Steps Navigation - Hidden on mobile, shown on desktop */}
          <div className='hidden lg:flex lg:w-80 bg-white/5 border-r border-white/10 flex-col'>
            {/* Sections */}
            <div className='p-4 border-b border-white/10'>
              <h3 className='text-lg font-semibold text-white mb-3'>Sections</h3>
              <div className='space-y-2'>
                {tutorialSections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      currentSection === index
                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <span className='text-xl'>{section.icon}</span>
                      <div>
                        <div className='font-medium'>{section.title}</div>
                        <div className='text-xs opacity-75'>{section.steps.length} steps</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className='flex-1 p-4 overflow-y-auto'>
              <h3 className='text-lg font-semibold text-white mb-3'>Steps</h3>
              <div className='space-y-2'>
                {currentSectionData?.steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepChange(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      currentStep === index
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-cyan-300'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          currentStep === index
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {step.icon || index + 1}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-sm truncate'>{step.title}</div>
                        <div className='text-xs opacity-75 line-clamp-2'>{step.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className='flex-1 flex flex-col'>
            {/* Mobile Section Selector - Only visible on mobile */}
            <div className='lg:hidden p-3 border-b border-white/10 bg-white/5'>
              <select
                value={currentSection}
                onChange={e => handleSectionChange(Number(e.target.value))}
                className='w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-brand-400/50'
              >
                {tutorialSections.map((section, index) => (
                  <option key={section.id} value={index} className='bg-slate-900 text-white'>
                    {section.icon} {section.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Bar */}
            <div className='p-3 sm:p-4 border-b border-white/10'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-white/60 mb-2 gap-1'>
                <span className='text-[10px] sm:text-sm'>
                  Step {currentStep + 1} of {currentSectionData?.steps.length} • Section{' '}
                  {currentSection + 1} of {tutorialSections.length}
                </span>
                <span className='text-[10px] sm:text-sm font-semibold text-brand-300'>
                  {overallProgress}% Complete
                </span>
              </div>
              <div className='w-full bg-white/10 rounded-full h-1.5 sm:h-2'>
                <div
                  className='bg-gradient-to-r from-brand-500 to-accent-500 h-1.5 sm:h-2 rounded-full transition-all duration-500'
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Content */}
            <div className='flex-1 p-3 sm:p-6 overflow-y-auto'>
              {currentStepData && (
                <div className='max-w-3xl mx-auto'>
                  {/* Text Content */}
                  <div className='space-y-4 sm:space-y-6'>
                    <div>
                      <div className='flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6'>
                        <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0'>
                          {currentStepData.icon || '📚'}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='text-lg sm:text-3xl font-bold text-white line-clamp-2'>
                            {currentStepData.title}
                          </h3>
                          <p className='text-white/60 text-xs sm:text-base truncate'>
                            {tutorialSections[currentSection].title}
                          </p>
                        </div>
                      </div>
                      <p className='text-white/90 text-sm sm:text-xl leading-relaxed'>
                        {currentStepData.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className='p-3 sm:p-6 border-t border-white/10'>
              <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0 && currentSection === 0}
                  className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
                    currentStep === 0 && currentSection === 0
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white hover:scale-105'
                  }`}
                >
                  ← Previous
                </button>

                <div className='hidden lg:flex items-center space-x-4'>
                  <span className='text-brand-300 text-sm'>Use ← → arrow keys to navigate</span>
                </div>

                <button
                  onClick={nextStep}
                  className='w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 text-sm sm:text-base'
                >
                  {currentStep === currentSectionData?.steps.length - 1 &&
                  currentSection === tutorialSections.length - 1
                    ? 'Complete Tutorial'
                    : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
