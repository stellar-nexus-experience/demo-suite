'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  characterPosition: 'left' | 'right';
  highlightElement?: boolean;
  image?: string;
  imageAlt?: string;
}

interface OnboardingOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  // currentDemo prop removed as unused
}

export const OnboardingOverlay = ({ isActive, onComplete }: OnboardingOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  // Removed unused highlightedElement state
  const [activeTab, setActiveTab] = useState('wallet-setup');
  const [ttsEnabled, setIsTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayTimeout, setAutoPlayTimeout] = useState<NodeJS.Timeout | null>(null);

  // Text-to-Speech functionality
  const speakMessage = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1.4;
    utterance.volume = 0.9;

    // Try to use a male voice
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(
      voice =>
        voice.name.includes('Alex') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('Google') ||
        voice.name.includes('Male') ||
        voice.name.includes('David') ||
        voice.name.includes('Tom') ||
        voice.name.includes('Mark') ||
        voice.name.includes('James') ||
        voice.name.includes('John') ||
        voice.name.includes('Michael')
    );
    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle TTS on/off
  const toggleTts = () => {
    if (ttsEnabled) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsTtsEnabled(!ttsEnabled);
  };

  // Auto-play functionality
  const startAutoPlay = () => {
    if (isAutoPlaying) {
      // Stop auto-play
      setIsAutoPlaying(false);
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
        setAutoPlayTimeout(null);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Start auto-play
    setIsAutoPlaying(true);
    setIsTtsEnabled(true); // Enable TTS for auto-play

    const autoPlayNext = () => {
      const currentSteps = getOnboardingSteps(activeTab);

      if (currentStep < currentSteps.length - 1) {
        // Move to next step in current tab
        const nextStepIndex = currentStep + 1;
        setCurrentStep(nextStepIndex);
        const step = currentSteps[nextStepIndex];

        // Speak the step
        speakMessage(`${step.title}. ${step.description}`);

        // Schedule next auto-play
        const timeout = setTimeout(autoPlayNext, 8000); // 8 seconds per step
        setAutoPlayTimeout(timeout);
      } else {
        // Move to next tab
        const currentTabIndex = demoTabs.findIndex(tab => tab.id === activeTab);
        if (currentTabIndex < demoTabs.length - 1) {
          const nextTab = demoTabs[currentTabIndex + 1];
          setActiveTab(nextTab.id);
          setCurrentStep(0);

          // Get first step of new tab
          const newSteps = getOnboardingSteps(nextTab.id);
          if (newSteps.length > 0) {
            const firstStep = newSteps[0];
            speakMessage(`${firstStep.title}. ${firstStep.description}`);

            // Schedule next auto-play
            const timeout = setTimeout(autoPlayNext, 8000);
            setAutoPlayTimeout(timeout);
          }
        } else {
          // Auto-play completed
          setIsAutoPlaying(false);
          setAutoPlayTimeout(null);
        }
      }
    };

    // Start with current step
    const currentSteps = getOnboardingSteps(activeTab);
    if (currentSteps.length > 0) {
      const step = currentSteps[currentStep];
      speakMessage(`${step.title}. ${step.description}`);

      // Schedule next auto-play
      const timeout = setTimeout(autoPlayNext, 8000);
      setAutoPlayTimeout(timeout);
    }
  };

  // Demo-specific onboarding steps
  const getOnboardingSteps = (demoId: string): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Trustless Work! 🎉',
        description:
          "I'm your guide to exploring escrow-powered work on Stellar blockchain. Let me show you around!",
        target: 'body',
        position: 'top',
        characterPosition: 'right',
      },
    ];

    switch (demoId) {
      case 'wallet-setup':
        return [
          ...baseSteps,
          {
            id: 'install-freighter',
            title: 'Step 1: Install Freighter Wallet 🦎',
            description:
              'First, install the Freighter browser extension. Go to freighter.app and click "Install Extension" for your browser (Chrome, Firefox, or Safari).',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Freighter wallet installation page',
          },
          {
            id: 'create-wallet',
            title: 'Step 2: Create New Wallet 🔑',
            description:
              'Open Freighter and click "Create New Wallet". Choose a strong password and write down your 24-word recovery phrase in a safe place. Never share this phrase!',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Freighter wallet creation screen',
          },
          {
            id: 'verify-phrase',
            title: 'Step 3: Verify Recovery Phrase ✅',
            description:
              'Freighter will ask you to verify your recovery phrase. Click the words in the correct order to confirm you have them written down correctly.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Recovery phrase verification screen',
          },
          {
            id: 'switch-testnet',
            title: 'Step 4: Switch to Testnet 🧪',
            description:
              'In Freighter settings, switch to "Testnet" network. This allows you to use free test tokens without spending real money.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Freighter testnet settings',
          },
          {
            id: 'fund-wallet',
            title: 'Step 5: Fund with XLM Testnet 💰',
            description:
              'Go to the Stellar Testnet Friendbot at https://friendbot.stellar.org/ and enter your wallet address to receive 10,000 free XLM testnet tokens.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Stellar Friendbot funding page',
          },
          {
            id: 'verify-balance',
            title: 'Step 6: Verify Your Balance 💳',
            description:
              'Check your Freighter wallet to confirm you received the testnet XLM. You should see around 10,000 XLM in your balance.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Freighter wallet balance display',
          },
          {
            id: 'connect-to-app',
            title: 'Step 7: Connect to Our App 🔗',
            description:
              'Now you can connect your Freighter wallet to our application. Click the "Connect Wallet" button and approve the connection in Freighter.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Wallet connection interface',
          },
          {
            id: 'wallet-ready',
            title: '🎉 Wallet Setup Complete!',
            description:
              'Congratulations! Your Stellar wallet is now ready for trustless work. You can now explore our demos and experience the power of blockchain escrow systems.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Wallet setup completion celebration',
          },
        ];

      case 'mainnet-migration':
        return [
          ...baseSteps,
          {
            id: 'understand-mainnet',
            title: 'Step 1: Understanding Mainnet vs Testnet 🌐',
            description:
              "Testnet uses fake money for learning. Mainnet uses real XLM and real value. Only migrate when you're confident and ready to use real funds.",
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Testnet vs Mainnet comparison',
          },
          {
            id: 'backup-wallet',
            title: 'Step 2: Backup Your Wallet 📋',
            description:
              'Before migrating, ensure you have your 24-word recovery phrase safely stored. This is your only way to recover your wallet if something goes wrong.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Wallet backup security reminder',
          },
          {
            id: 'get-real-xlm',
            title: 'Step 3: Get Real XLM 💎',
            description:
              'Purchase XLM from exchanges like Coinbase, Binance, or Kraken. Transfer them to your Freighter wallet address. Start with small amounts for testing.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'XLM purchase on cryptocurrency exchange',
          },
          {
            id: 'switch-mainnet',
            title: 'Step 4: Switch to Mainnet 🚀',
            description:
              'In Freighter settings, switch from "Testnet" to "Mainnet". This connects you to the real Stellar network where transactions have real value.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Freighter mainnet settings',
          },
          {
            id: 'verify-mainnet-balance',
            title: 'Step 5: Verify Mainnet Balance 💰',
            description:
              'Check that your real XLM appears in your Freighter wallet. You should see your purchased XLM in the mainnet balance.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Mainnet wallet balance verification',
          },
          {
            id: 'test-small-transaction',
            title: 'Step 6: Test Small Transaction 🧪',
            description:
              'Make a small test transaction to ensure everything works correctly. Send a small amount of XLM to another address to verify the setup.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Small test transaction example',
          },
          {
            id: 'connect-mainnet-app',
            title: 'Step 7: Connect Mainnet to App 🔗',
            description:
              'Connect your mainnet wallet to our application. Be aware that all transactions will now use real XLM with real value.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Mainnet wallet connection to app',
          },
          {
            id: 'mainnet-ready',
            title: '🚀 Mainnet Migration Complete!',
            description:
              "You're now on the real Stellar network! Use real XLM for trustless work transactions. Remember to always double-check amounts before confirming transactions.",
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Mainnet migration completion',
          },
        ];

      case 'tech-tree':
        return [
          ...baseSteps,
          {
            id: 'tech-tree-overview',
            title: 'Step 1: Trustless Work Tech Tree 🌳',
            description:
              'Explore the comprehensive tech tree that shows all available trustless work technologies, from basic escrow to advanced smart contracts and DeFi integrations.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Trustless Work Tech Tree overview',
          },
          {
            id: 'tech-tree-navigation',
            title: 'Step 2: Navigate the Tech Tree 🗺️',
            description:
              'Click on different branches to explore technologies. Each node represents a specific feature or capability you can learn and implement.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Tech Tree navigation interface',
          },
          {
            id: 'tech-tree-levels',
            title: 'Step 3: Technology Levels 📊',
            description:
              'Technologies are organized by complexity levels: Basic, Intermediate, Advanced, and Expert. Start with basic concepts and progress to advanced implementations.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Technology complexity levels',
          },
          {
            id: 'tech-tree-progress',
            title: 'Step 4: Track Your Progress 🎯',
            description:
              "See which technologies you've mastered and which ones are still locked. Complete demos and quests to unlock new branches of the tech tree.",
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Tech Tree progress tracking',
          },
          {
            id: 'tech-tree-resources',
            title: 'Step 5: Access Resources 📚',
            description:
              'Each technology node provides documentation, code examples, and tutorials. Use the tech tree as your learning roadmap for trustless work mastery.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Tech Tree learning resources',
          },
          {
            id: 'tech-tree-ready',
            title: '🌳 Tech Tree Explorer Ready!',
            description:
              "You're now ready to explore the Trustless Work Tech Tree! Use it as your guide to learn new technologies and track your progress in the ecosystem.",
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Tech Tree exploration ready',
          },
        ];

      case 'hello-milestone':
        return [
          ...baseSteps,
          {
            id: 'connect-wallet',
            title: 'Step 1: Connect Your Wallet 🔗',
            description:
              'First, you need to connect your Stellar wallet to interact with the demos. Click the "Connect Wallet" button above.',
            target: '.wallet-connect-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Connect wallet button in demo',
          },
          {
            id: 'select-demo',
            title: 'Step 2: Choose Your Demo 🎯',
            description:
              'You\'re currently in the "Baby Steps to Riches" demo. This teaches you the basics of escrow flow.',
            target: '.demo-card[data-demo-id="hello-milestone"]',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Baby Steps to Riches demo interface',
          },
          {
            id: 'initialize-escrow',
            title: 'Step 3: Initialize Escrow 📝',
            description:
              'Click "Initialize Escrow" to create a new escrow contract. This sets up the basic structure for your trustless work.',
            target: '.initialize-escrow-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Initialize escrow button and form',
          },
          {
            id: 'fund-escrow',
            title: 'Step 4: Fund the Escrow 💰',
            description:
              'Once initialized, fund your escrow with USDC. This locks the funds until work is completed and approved.',
            target: '.fund-escrow-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Fund escrow transaction interface',
          },
          {
            id: 'complete-milestone',
            title: 'Step 5: Complete Milestone ✅',
            description:
              'Signal that your work is done by clicking "Complete Milestone". This moves the escrow to the approval phase.',
            target: '.complete-milestone-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Complete milestone button and confirmation',
          },
          {
            id: 'approve-work',
            title: 'Step 6: Approve the Work 👍',
            description:
              'As the client, approve the completed work. This triggers the automatic fund release.',
            target: '.approve-milestone-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Approve milestone interface',
          },
          {
            id: 'release-funds',
            title: 'Step 7: Funds Released! 🎊',
            description:
              "Congratulations! The funds are automatically released to the worker. You've completed your first trustless work flow!",
            target: '.release-funds-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Funds released success screen',
          },
          {
            id: 'completion-requirements',
            title: '🎯 Demo Completion Requirements',
            description:
              'To complete this demo successfully, you need to: 1) Initialize escrow, 2) Fund escrow, 3) Complete milestone, 4) Approve milestone, 5) Release funds. Complete all steps to see the success box!',
            target: 'body',
            position: 'top',
            characterPosition: 'right',
          },
        ];

      case 'dispute-resolution':
        return [
          ...baseSteps,
          {
            id: 'connect-wallet',
            title: 'Step 1: Connect Your Wallet 🔗',
            description:
              'Connect your Stellar wallet to experience the full dispute resolution workflow.',
            target: '.wallet-connect-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'select-demo',
            title: 'Step 2: Drama Queen Escrow 👑',
            description:
              'This demo showcases the complete dispute resolution and arbitration system.',
            target: '.demo-card[data-demo-id="dispute-resolution"]',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'initialize-escrow',
            title: 'Step 3: Initialize Escrow 📝',
            description: 'Create an escrow contract that includes dispute resolution mechanisms.',
            target: '.initialize-escrow-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'fund-escrow',
            title: 'Step 4: Fund Escrow 💰',
            description:
              'Deposit funds into the escrow contract. Disputes can arise during milestone completion.',
            target: '.fund-escrow-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'complete-milestones',
            title: 'Step 5: Complete Milestones ✅',
            description:
              'Mark milestones as complete. Workers can raise disputes if they disagree with the status.',
            target: '.complete-milestone-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'raise-disputes',
            title: 'Step 6: Raise Disputes ⚖️',
            description:
              'Workers can raise disputes if they disagree with milestone status or need arbitration.',
            target: '.raise-dispute-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'resolve-disputes',
            title: 'Step 7: Resolve Disputes 🧑‍⚖️',
            description:
              'Act as an arbitrator to resolve disputes and make fair decisions based on evidence.',
            target: '.resolve-dispute-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'release-funds',
            title: 'Step 8: Release Funds 🎊',
            description: 'Once all disputes are resolved, release the funds to complete the demo!',
            target: '.release-funds-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'completion-requirements',
            title: '🎯 Demo Completion Requirements',
            description:
              'To complete this demo successfully, you need to: 1) Initialize escrow, 2) Fund escrow, 3) Complete milestones, 4) Raise disputes, 5) Resolve disputes as arbitrator, 6) Release funds. Complete all steps to see the success box!',
            target: 'body',
            position: 'top',
            characterPosition: 'right',
          },
        ];

      case 'micro-marketplace':
        return [
          ...baseSteps,
          {
            id: 'connect-wallet',
            title: 'Step 1: Connect Your Wallet 🔗',
            description:
              'Connect your Stellar wallet to access the micro-task marketplace with built-in escrow.',
            target: '.wallet-connect-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'select-demo',
            title: 'Step 2: Gig Economy Madness 🛒',
            description:
              'This demo shows how micro-tasks can be managed with escrow protection for both clients and workers.',
            target: '.demo-card[data-demo-id="micro-marketplace"]',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'post-tasks',
            title: 'Step 3: Post Tasks 📋',
            description: 'As a client, post micro-tasks that workers can browse and accept.',
            target: '.post-task-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'browse-tasks',
            title: 'Step 4: Browse Tasks 🔍',
            description:
              'As a worker, browse available tasks and accept ones that match your skills.',
            target: '.browse-tasks-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'complete-tasks',
            title: 'Step 5: Complete Tasks ✅',
            description: 'Complete accepted tasks and submit them for approval.',
            target: '.complete-task-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'approve-tasks',
            title: 'Step 6: Approve Tasks 👍',
            description: 'As a client, review and approve completed tasks to release escrow funds.',
            target: '.approve-task-button',
            position: 'bottom',
            characterPosition: 'right',
            highlightElement: true,
          },
          {
            id: 'release-funds',
            title: 'Step 7: Release Funds 🎊',
            description: 'Release funds to workers for completed tasks and complete the demo!',
            target: '.release-funds-button',
            position: 'top',
            characterPosition: 'left',
            highlightElement: true,
          },
          {
            id: 'completion-requirements',
            title: '🎯 Demo Completion Requirements',
            description:
              'To complete this demo successfully, you need to: 1) Post at least 1 task, 2) Complete at least 3 tasks, 3) Get all tasks approved. Complete all steps to see the success box!',
            target: 'body',
            position: 'top',
            characterPosition: 'right',
          },
        ];

      case 'quest-system':
        return [
          ...baseSteps,
          {
            id: 'quest-overview',
            title: 'Step 1: Quest System Overview 🎯',
            description:
              'Complete quests to earn XP, unlock badges, and level up your Nexus Prime. Each quest teaches you different aspects of trustless work systems.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Quest system overview interface',
          },
          {
            id: 'daily-quests',
            title: 'Step 2: Daily Quests 📅',
            description:
              'Complete daily quests like connecting your wallet, exploring demos, or completing milestones. These give you consistent XP and keep you engaged.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Daily quest interface',
          },
          {
            id: 'achievement-badges',
            title: 'Step 3: Achievement Badges 🏆',
            description:
              'Earn special badges for completing milestones, mastering demos, or helping others. Badges showcase your expertise and unlock special rewards.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Achievement badges collection',
          },
          {
            id: 'xp-system',
            title: 'Step 4: XP and Leveling ⭐',
            description:
              'Gain XP from completing quests and activities. Level up to unlock new features, get priority support, and access exclusive content.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'XP and leveling system',
          },
          {
            id: 'quest-rewards',
            title: 'Step 5: Quest Rewards 🎁',
            description:
              'Claim rewards for completed quests including XLM tokens, exclusive NFTs, early access to features, and special recognition in the community.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Quest rewards interface',
          },
          {
            id: 'quest-completion',
            title: '🎉 Quest Master!',
            description:
              "You're now ready to embark on your quest journey! Complete quests regularly to maximize your XP gains and unlock all available badges.",
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Quest completion celebration',
          },
        ];

      case 'nexus-account':
        return [
          ...baseSteps,
          {
            id: 'nexus-prime-intro',
            title: 'Step 1: Meet Nexus Prime 🤖',
            description:
              'Nexus Prime is your AI companion that evolves as you progress. Help it reach its final form by completing activities and earning XP.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Prime introduction',
          },
          {
            id: 'nexus-evolution',
            title: 'Step 2: Evolution Stages 🦋',
            description:
              'Nexus Prime evolves through stages: Basic → Advanced → Expert → Master → Final Form. Each stage unlocks new abilities and features.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Prime evolution stages',
          },
          {
            id: 'nexus-features',
            title: 'Step 3: Nexus Features ⚡',
            description:
              'Unlock features like advanced analytics, personalized recommendations, priority support, and exclusive access to new demos and features.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Prime features showcase',
          },
          {
            id: 'nexus-customization',
            title: 'Step 4: Customize Nexus 🎨',
            description:
              'Personalize your Nexus Prime with different avatars, themes, and behaviors. Make it truly yours as it grows with your expertise.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Prime customization options',
          },
          {
            id: 'nexus-final-form',
            title: 'Step 5: Final Form Unlock 🚀',
            description:
              'Reach the ultimate Nexus Prime form by mastering all demos, completing quests, and contributing to the community. The final form is legendary!',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Prime final form',
          },
          {
            id: 'nexus-complete',
            title: '🌟 Nexus Prime Ready!',
            description:
              'Your Nexus Prime is ready to evolve! Start completing activities to help it grow and unlock its full potential as your trustless work companion.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Prime ready to evolve',
          },
        ];

      case 'referral-center':
        return [
          ...baseSteps,
          {
            id: 'referral-overview',
            title: 'Step 1: Referral System Overview 👥',
            description:
              'Invite friends to join the trustless work revolution! Earn XP, badges, and rewards for each successful referral. Help build the community.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Referral system overview',
          },
          {
            id: 'nexus-card',
            title: 'Step 2: Nexus Pokemon Card 🃏',
            description:
              'Get your unique Nexus Pokemon-style card! Share it with friends to show off your achievements and level. Each card is unique and collectible.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Nexus Pokemon-style card',
          },
          {
            id: 'email-invites',
            title: 'Step 3: Email Invitations 📧',
            description:
              'Send personalized email invitations to friends. Customize your message and track who opens and clicks your invites. Make it personal!',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Email invitation interface',
          },
          {
            id: 'referral-tracking',
            title: 'Step 4: Track Referrals 📊',
            description:
              'Monitor your referral success with detailed analytics. See who joined, their progress, and your earnings. Optimize your referral strategy.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Referral tracking dashboard',
          },
          {
            id: 'referral-rewards',
            title: 'Step 5: Referral Rewards 🎁',
            description:
              'Earn rewards for successful referrals including XLM tokens, exclusive badges, early access to features, and special recognition.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Referral rewards system',
          },
          {
            id: 'referral-success',
            title: '🎉 Referral Master!',
            description:
              "You're ready to start referring friends! Share your Nexus card, send invitations, and help grow the trustless work community.",
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Referral system ready',
          },
        ];

      case 'leaderboard':
        return [
          ...baseSteps,
          {
            id: 'leaderboard-overview',
            title: 'Step 1: Global Leaderboard 🌍',
            description:
              'Compete with users worldwide on the global leaderboard! Rankings are based on XP, completed quests, referrals, and community contributions.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Global leaderboard interface',
          },
          {
            id: 'ranking-system',
            title: 'Step 2: Ranking System 🏅',
            description:
              'Climb the ranks from Rookie to Legend! Your rank is determined by total XP, quest completion rate, referral success, and community engagement.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Ranking system explanation',
          },
          {
            id: 'leaderboard-features',
            title: 'Step 3: Leaderboard Features ⭐',
            description:
              "View top performers, filter by region, see your progress, and compare with friends. Get inspired by the community's achievements.",
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Leaderboard features showcase',
          },
          {
            id: 'leaderboard-rewards',
            title: 'Step 4: Leaderboard Rewards 🏆',
            description:
              'Top performers get exclusive rewards including special badges, XLM tokens, early access to features, and recognition in the community.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Leaderboard rewards system',
          },
          {
            id: 'community-competition',
            title: 'Step 5: Community Competition 🤝',
            description:
              'Participate in community challenges, team competitions, and special events. Work together to achieve common goals and earn group rewards.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Community competition interface',
          },
          {
            id: 'leaderboard-ready',
            title: '🚀 Ready to Compete!',
            description:
              "You're ready to climb the leaderboard! Complete quests, refer friends, and engage with the community to maximize your ranking.",
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Leaderboard competition ready',
          },
        ];

      case 'starters':
        return [
          ...baseSteps,
          {
            id: 'choose-starter',
            title: 'Step 1: Choose Your Starter Kit 🛠️',
            description:
              'Select from our pre-built starter templates: Basic Escrow, Multi-Milestone Project, or Marketplace Integration. Each comes with documentation and examples.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Available starter kit templates',
          },
          {
            id: 'basic-escrow',
            title: 'Step 2: Basic Escrow Starter 📦',
            description:
              'Start with our Basic Escrow template. It includes a simple escrow contract, milestone management, and automatic fund release. Perfect for learning the fundamentals.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Basic escrow starter template',
          },
          {
            id: 'multi-milestone',
            title: 'Step 3: Multi-Milestone Starter 🎯',
            description:
              'For complex projects, use our Multi-Milestone starter. It supports multiple deliverables, progressive payments, and milestone dependencies.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Multi-milestone project starter',
          },
          {
            id: 'marketplace-integration',
            title: 'Step 4: Marketplace Integration 🏪',
            description:
              'Build a complete marketplace with our integration starter. Includes task posting, worker matching, escrow automation, and dispute resolution.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Marketplace integration starter',
          },
          {
            id: 'development-setup',
            title: 'Step 5: Development Environment ⚙️',
            description:
              'Set up your development environment with Stellar SDK, smart contract tools, and testing frameworks. We provide Docker containers for easy setup.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Development environment setup',
          },
          {
            id: 'testing-guide',
            title: 'Step 6: Testing Your Contracts 🧪',
            description:
              'Learn how to test your escrow contracts using our testing suite. Includes unit tests, integration tests, and simulation tools for different scenarios.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Smart contract testing interface',
          },
          {
            id: 'deployment-guide',
            title: 'Step 7: Deploy to Stellar 🚀',
            description:
              'Deploy your contracts to Stellar testnet first, then mainnet. We provide step-by-step deployment guides and monitoring tools.',
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Stellar deployment process',
          },
          {
            id: 'community-support',
            title: 'Step 8: Join Our Community 👥',
            description:
              'Connect with other developers in our Discord community. Get help, share projects, and contribute to the trustless work ecosystem.',
            target: 'body',
            position: 'bottom',
            characterPosition: 'right',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Discord community interface',
          },
          {
            id: 'starters-complete',
            title: '🎉 Ready to Build!',
            description:
              "You're now equipped with all the tools and knowledge to build your own trustless work applications. Start with our starter kits and customize them for your needs!",
            target: 'body',
            position: 'top',
            characterPosition: 'left',
            image: '/images/tutorial/placeholder.svg',
            imageAlt: 'Ready to build celebration',
          },
        ];

      default:
        return baseSteps;
    }
  };

  const steps = getOnboardingSteps(activeTab);

  // Demo tabs configuration
  const demoTabs = [
    {
      id: 'wallet-setup',
      title: '1. Wallet Setup',
      icon: '🦎',
      color: 'from-green-500 to-emerald-400',
    },
    {
      id: 'tech-tree',
      title: '2. Tech Tree',
      icon: '🌳',
      color: 'from-emerald-500 to-green-400',
    },
    {
      id: 'hello-milestone',
      title: '3. Baby Steps',
      icon: '🎮',
      color: 'from-brand-500 to-brand-400',
    },
    {
      id: 'dispute-resolution',
      title: '4. Drama Queen',
      icon: '👑',
      color: 'from-warning-500 to-warning-400',
    },
    {
      id: 'micro-marketplace',
      title: '5. Gig Economy',
      icon: '🛒',
      color: 'from-accent-500 to-accent-400',
    },
    {
      id: 'quest-system',
      title: '6. Quest System',
      icon: '🎯',
      color: 'from-yellow-500 to-orange-400',
    },
    {
      id: 'nexus-account',
      title: '7. Nexus Account',
      icon: '🤖',
      color: 'from-indigo-500 to-purple-400',
    },
    {
      id: 'referral-center',
      title: '8. Referral Center',
      icon: '👥',
      color: 'from-pink-500 to-rose-400',
    },
    {
      id: 'leaderboard',
      title: '9. Leaderboard',
      icon: '🏆',
      color: 'from-amber-500 to-yellow-400',
    },
    {
      id: 'starters',
      title: '10. Starters',
      icon: '🛠️',
      color: 'from-purple-500 to-pink-400',
    },
    {
      id: 'mainnet-migration',
      title: '11. Mainnet Migration',
      icon: '🚀',
      color: 'from-blue-500 to-cyan-400',
    },
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentStep(0);
    // Speak the new demo description (only if TTS is enabled)
    const newSteps = getOnboardingSteps(tabId);
    if (newSteps.length > 0 && ttsEnabled) {
      speakMessage(`Welcome to ${newSteps[0].title}. ${newSteps[0].description}`);
    }
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      const step = steps[nextStepIndex];
      if (ttsEnabled) {
        speakMessage(`${step.title}. ${step.description}`);
      }
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      const step = steps[prevStepIndex];
      if (ttsEnabled) {
        speakMessage(`${step.title}. ${step.description}`);
      }
    }
  };

  // Auto-speak current step (only if TTS is enabled)
  useEffect(() => {
    if (isActive && steps.length > 0 && ttsEnabled) {
      const step = steps[currentStep];
      speakMessage(`${step.title}. ${step.description}`);
    }
  }, [currentStep, activeTab, isActive, ttsEnabled, speakMessage, steps]);

  // Cleanup TTS and auto-play on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (autoPlayTimeout) {
        clearTimeout(autoPlayTimeout);
      }
    };
  }, [autoPlayTimeout]);

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='bg-gradient-to-r from-brand-500/20 to-accent-500/20 p-6 border-b border-white/20'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='bg-transparent flex items-center justify-center border-2 border-white/20 rounded-full'>
                <Image
                  src='/images/character/nexus-prime-chat.png'
                  alt='Trustless Work'
                  width={50}
                  height={50}
                  className='rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20'
                  style={{ height: 'auto' }}
                />
              </div>
              <h2 className='text-2xl font-bold text-white'>Tutorial</h2>
            </div>

            {/* TTS Controls */}
            <div className='flex items-center space-x-2'>
              <button
                onClick={toggleTts}
                className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm ${
                  ttsEnabled
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-400/50 text-green-300'
                    : 'bg-gradient-to-r from-red-500/20 to-pink-600/20 border border-red-400/50 text-red-300'
                }`}
                title={ttsEnabled ? 'Disable Voice' : 'Enable Voice'}
              >
                {ttsEnabled ? '🔊 ON' : '🔇 OFF'}
              </button>
              <button
                onClick={() =>
                  speakMessage(`${currentStepData.title}. ${currentStepData.description}`)
                }
                disabled={!ttsEnabled || isSpeaking}
                className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm ${
                  !ttsEnabled || isSpeaking
                    ? 'bg-gray-500/20 text-gray-400 border border-gray-400/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-400/50 text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-indigo-600/30'
                }`}
                title={
                  !ttsEnabled
                    ? 'Voice is disabled'
                    : isSpeaking
                      ? 'Already speaking'
                      : 'Replay current step'
                }
              >
                {isSpeaking ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={startAutoPlay}
                className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm ${
                  isAutoPlaying
                    ? 'bg-gradient-to-r from-orange-500/20 to-red-600/20 border border-orange-400/50 text-orange-300'
                    : 'bg-gradient-to-r from-purple-500/20 to-indigo-600/20 border border-purple-400/50 text-purple-300'
                }`}
                title={isAutoPlaying ? 'Stop Auto-Play' : 'Start Auto-Play All Tabs'}
              >
                {isAutoPlaying ? '⏹️ STOP' : '▶️ AUTO'}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Tabs */}
        <div className='bg-white/5 p-4 border-b border-white/10'>
          <div className='flex flex-wrap gap-2'>
            {demoTabs.map(tab => {
              // All main demos are now available in the tutorial
              const isDisabled = false;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && handleTabChange(tab.id)}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center space-x-2 relative ${
                    isDisabled
                      ? 'bg-gray-600/20 border-gray-600/30 text-gray-400 cursor-not-allowed blur-sm opacity-50'
                      : activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white border-white/50 shadow-lg`
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                  }`}
                  title={isDisabled ? 'Complete the first demo to unlock this tutorial' : ''}
                >
                  <span className='text-lg'>{tab.icon}</span>
                  <span className='font-medium'>{tab.title}</span>
                  {isDisabled && (
                    <span className='absolute -top-1 -right-1 text-xs bg-gray-600 text-gray-300 px-1 rounded-full'>
                      🔒
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className='mt-2 text-center'>
            <p className='text-xs text-gray-400'>
              💡 Start with wallet setup, explore the tech tree, then demos and community features,
              migrate to mainnet when ready
            </p>
          </div>
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          <div className='flex flex-col lg:flex-row gap-6 mb-6'>
            {/* Text Content */}
            <div className='flex-1 text-center lg:text-left'>
              <h3 className='text-xl font-bold text-white mb-2'>{currentStepData.title}</h3>
              <p className='text-white/80 leading-relaxed'>{currentStepData.description}</p>
            </div>

            {/* Image Content */}
            {currentStepData.image && (
              <div className='flex-shrink-0 w-full lg:w-80'>
                <div className='relative bg-white/5 rounded-lg p-4 border border-white/10'>
                  <Image
                    src={currentStepData.image}
                    alt={currentStepData.imageAlt || 'Tutorial step illustration'}
                    width={320}
                    height={240}
                    className='w-full h-auto rounded-lg shadow-lg'
                    onError={e => {
                      // Fallback to placeholder if image doesn't exist
                      e.currentTarget.src = '/images/tutorial/placeholder.svg';
                    }}
                  />
                  <div className='absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded'>
                    Step {currentStep + 1}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step Progress */}
          <div className='mb-6'>
            <div className='flex items-center justify-between text-sm text-white/60 mb-2'>
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
            </div>
            <div className='w-full bg-white/10 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-brand-500 to-accent-500 h-2 rounded-full transition-all duration-500'
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Navigation */}
          <div className='flex items-center justify-between'>
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                currentStep === 0
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white hover:scale-105'
              }`}
            >
              ← Previous
            </button>

            <button
              onClick={nextStep}
              className='px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105'
            >
              {currentStep === steps.length - 1 ? 'Complete Tutorial' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className='p-4 border-t border-white/10 text-center'>
          <button
            onClick={onComplete}
            className='px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all duration-300 hover:border-white/40'
          >
            Close Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};
