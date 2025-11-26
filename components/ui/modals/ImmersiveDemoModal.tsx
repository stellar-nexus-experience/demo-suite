'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { useToast } from '@/contexts/ui/ToastContext';
import { useTransactionHistory } from '@/contexts/data/TransactionContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import { API_ENDPOINTS } from '@/utils/constants/api';
import Image from 'next/image';

interface ImmersiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: string;
  demoTitle: string;
  demoDescription: string;
  estimatedTime: number; // in minutes
  demoColor: string; // Demo color gradient (e.g., 'from-brand-500 to-brand-400')
  children: React.ReactNode;
  onDemoComplete?: (demoId: string, demoName: string, completionTime: number) => void;
}

// Progress tracking context
interface ProgressContextType {
  updateProgress: (interaction: string) => void;
  markStepCompleted: (stepName: string) => void;
}

const ProgressContext = React.createContext<ProgressContextType | null>(null);

// Export the context and hook for use in demo components
export const useImmersiveProgress = () => {
  const context = React.useContext(ProgressContext);
  if (!context) {
    return { updateProgress: () => {}, markStepCompleted: () => {} };
  }
  return context;
};

// Calculate meaningful progress based on steps and time
const calculateProgress = (
  completedSteps: string[],
  totalSteps: string[],
  elapsedTime: number,
  estimatedTime: number
): number => {
  const stepProgress = (completedSteps.length / totalSteps.length) * 60; // 60% from steps
  const timeProgress = Math.min((elapsedTime / (estimatedTime * 60)) * 40, 40); // 40% from time
  return Math.min(stepProgress + timeProgress, 100);
};

interface FeedbackData {
  rating: number;
  comment: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wouldRecommend: boolean;
}

export const ImmersiveDemoModal = ({
  isOpen,
  onClose,
  demoId,
  demoTitle,
  demoDescription,
  estimatedTime,
  demoColor,
  children,
  onDemoComplete,
}: ImmersiveDemoModalProps) => {
  const { isConnected, walletData } = useGlobalWallet();
  const { addToast } = useToast();
  const { getTransactionsByDemo } = useTransactionHistory();
  const { submitMandatoryFeedback } = useFirebase();

  const [currentStep, setCurrentStep] = useState<'warning' | 'demo' | 'feedback'>('warning');
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [demoSteps, setDemoSteps] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    comment: '',
    difficulty: 'medium',
    wouldRecommend: true,
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isCompletingDemo, setIsCompletingDemo] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(true); // Always show by default
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Get transactions for this demo
  const demoTransactions = getTransactionsByDemo(demoId);

  // Get demo steps based on demo ID
  const getDemoSteps = (demoId: string): string[] => {
    const steps = {
      'hello-milestone': [
        'Initialize Escrow',
        'Fund Escrow',
        'Complete Milestone',
        'Approve Milestone',
        'Release Funds',
      ],
      'dispute-resolution': [
        'Initialize Escrow',
        'Fund Escrow',
        'Complete Milestone',
        'Raise Dispute',
        'Resolve Dispute',
        'Release Funds',
      ],
      'micro-marketplace': [
        'Post Task',
        'Accept Task #1',
        'Complete Work #1',
        'Accept Task #2',
        'Complete Work #2',
        'Accept Task #3',
      ],
      'milestone-voting': [
        'Initialize Escrow',
        'Fund Escrow',
        'Complete Milestone',
        'Vote on Milestone',
        'Release Funds',
      ],
    };
    return (
      steps[demoId as keyof typeof steps] || ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5']
    );
  };

  // Function to mark a demo step as completed
  const markStepCompleted = (stepName: string) => {
    if (!completedSteps.includes(stepName)) {
      setCompletedSteps(prev => [...prev, stepName]);
      setCurrentDemoStep(prev => prev + 1);
    }
  };

  // Function to detect demo interactions and update progress
  const updateDemoProgress = (interaction: string) => {
    // Map interactions to demo steps
    const interactionMap: Record<string, string> = {
      escrow_initialized: 'Initialize Escrow',
      escrow_funded: 'Fund Escrow',
      milestone_completed: 'Complete Milestone',
      milestone_approved: 'Approve Milestone',
      funds_released: 'Release Funds',
      dispute_raised: 'Raise Dispute',
      dispute_resolved: 'Resolve Dispute',
      task_posted: 'Post Task',
      task_accepted: 'Accept Task #1',
      work_completed: 'Complete Work #1',
      task_accepted_2: 'Accept Task #2',
      work_completed_2: 'Complete Work #2',
      task_accepted_3: 'Accept Task #3',
      voting_completed: 'Vote on Milestone',
    };

    const stepName = interactionMap[interaction];
    if (stepName) {
      markStepCompleted(stepName);
    }
  };

  // Initialize demo steps when demo starts
  useEffect(() => {
    if (currentStep === 'demo') {
      const steps = getDemoSteps(demoId);
      setDemoSteps(steps);
      setCompletedSteps([]);
      setCurrentDemoStep(0);
    }
  }, [currentStep, demoId]);

  // Progress tracking
  useEffect(() => {
    if (currentStep === 'demo' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);

        // Calculate meaningful progress based on steps and time
        const progressPercent = calculateProgress(
          completedSteps,
          demoSteps,
          elapsed,
          estimatedTime
        );
        setProgress(progressPercent);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentStep, startTime, estimatedTime, completedSteps, demoSteps]);

  // Keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleCloseClick();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentStep]);

  const handleStartDemo = async () => {
    setCurrentStep('demo');
    setStartTime(new Date());
    setProgress(0);
    setShowTransactionHistory(true); // Ensure transaction sidebar is always visible

    // Track demo start - now handled by FirebaseContext
    if (isConnected && walletData?.publicKey) {
      // Demo tracking is now handled by FirebaseContext
    }

    // Open wallet sidebar for better UX
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('toggleWalletSidebar'));
      // Auto-expand the sidebar when opening
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('expandWalletSidebar'));
      }, 100);
    }, 500);

    addToast({
      type: 'success',
      title: '🚀 Demo Started!',
      message: `You're now in immersive mode. Click "Live Transactions" to toggle the sidebar!`,
      duration: 4000,
    });
  };

  const handleCompleteDemo = async () => {
    // Prevent multiple simultaneous calls
    if (isCompletingDemo) {
      return;
    }

    try {
      setIsCompletingDemo(true);

      const completionTimeMinutes = Math.max(1, Math.round(elapsedTime / 60));

      // Demo completion tracking is now handled by FirebaseContext
      if (isConnected && walletData?.publicKey) {
        // Demo completion with wallet connected
      } else {
        // Demo completion without wallet
      }

      // Call the external feedback handler if provided
      if (onDemoComplete) {
        onDemoComplete(demoId, demoTitle, completionTimeMinutes);
        // Close the demo modal after completion
        handleCloseModal();
      } else {
        // Fallback to internal feedback system
        setCurrentStep('feedback');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Demo Completion Failed',
        message: 'Failed to complete demo. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsCompletingDemo(false);
    }
  };

  const handleCloseClick = () => {
    if (currentStep === 'demo') {
      // Show confirmation dialog during demo
      setShowCloseConfirmation(true);
    } else {
      // Direct close for warning and feedback screens
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    onClose();
    setCurrentStep('warning');
    setProgress(0);
    setStartTime(null);
    setElapsedTime(0);
    setShowCloseConfirmation(false);
    setFeedback({
      rating: 0,
      comment: '',
      difficulty: 'medium',
      wouldRecommend: true,
    });
  };

  const handleSubmitFeedback = async () => {
    if (feedback.rating === 0) {
      addToast({
        type: 'warning',
        title: '⚠️ Rating Required',
        message: 'Please provide a rating before submitting feedback.',
        duration: 3000,
      });
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      // Submit mandatory feedback to separate collection
      if (isConnected && walletData?.publicKey) {
        await submitMandatoryFeedback({
          demoId,
          demoName: demoTitle,
          rating: feedback.rating,
          feedback: feedback.comment.trim() || 'No specific feedback provided',
          difficulty: feedback.difficulty,
          wouldRecommend: feedback.wouldRecommend,
          completionTime: Math.round(elapsedTime / 60), // Convert seconds to minutes
        });
      }

      // Save feedback to localStorage as backup
      const existingFeedback = JSON.parse(localStorage.getItem('demoFeedback') || '{}');
      existingFeedback[demoId] = {
        ...feedback,
        timestamp: new Date().toISOString(),
        elapsedTime,
        demoTitle,
      };
      localStorage.setItem('demoFeedback', JSON.stringify(existingFeedback));

      addToast({
        type: 'success',
        title: '✅ Feedback Submitted!',
        message: 'Thank you for your valuable feedback!',
        duration: 3000,
      });

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setCurrentStep('warning');
        setProgress(0);
        setStartTime(null);
        setElapsedTime(0);
        setFeedback({
          rating: 0,
          comment: '',
          difficulty: 'medium',
          wouldRecommend: true,
        });
      }, 2000);
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Submission Failed',
        message: 'Failed to submit feedback. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTransactionTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Utility function to get color classes based on demo color
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'from-brand-500 to-brand-400':
        return {
          mainGradient: 'from-brand-500 to-brand-400',
          bgGradient: 'from-brand-900/20 via-brand-800/20 to-brand-900/20',
          headerGradient: 'from-brand-500/20 to-brand-400/20',
          borderColor: 'border-brand-400/30',
          textColor: 'text-brand-300',
          accentColor: 'text-brand-400',
          buttonGradient: 'from-brand-500 to-brand-400',
          buttonHover: 'hover:from-brand-600 hover:to-brand-500',
          progressGradient: 'from-brand-500 to-brand-400',
          sidebarGradient: 'from-brand-500/10 to-brand-400/10',
        };
      case 'from-success-500 to-success-400':
        return {
          mainGradient: 'from-success-500 to-success-400',
          bgGradient: 'from-success-900/20 via-success-800/20 to-success-900/20',
          headerGradient: 'from-success-500/20 to-success-400/20',
          borderColor: 'border-success-400/30',
          textColor: 'text-success-300',
          accentColor: 'text-success-400',
          buttonGradient: 'from-success-500 to-success-400',
          buttonHover: 'hover:from-success-600 hover:to-success-500',
          progressGradient: 'from-success-500 to-success-400',
          sidebarGradient: 'from-success-500/10 to-success-400/10',
        };
      case 'from-warning-500 to-warning-400':
        return {
          mainGradient: 'from-warning-500 to-warning-400',
          bgGradient: 'from-warning-900/20 via-warning-800/20 to-warning-900/20',
          headerGradient: 'from-warning-500/20 to-warning-400/20',
          borderColor: 'border-warning-400/30',
          textColor: 'text-warning-300',
          accentColor: 'text-warning-400',
          buttonGradient: 'from-warning-500 to-warning-400',
          buttonHover: 'hover:from-warning-600 hover:to-warning-500',
          progressGradient: 'from-warning-500 to-warning-400',
          sidebarGradient: 'from-warning-500/10 to-warning-400/10',
        };
      case 'from-accent-500 to-accent-400':
        return {
          mainGradient: 'from-accent-500 to-accent-400',
          bgGradient: 'from-accent-900/20 via-accent-800/20 to-accent-900/20',
          headerGradient: 'from-accent-500/20 to-accent-400/20',
          borderColor: 'border-accent-400/30',
          textColor: 'text-accent-300',
          accentColor: 'text-accent-400',
          buttonGradient: 'from-accent-500 to-accent-400',
          buttonHover: 'hover:from-accent-600 hover:to-accent-500',
          progressGradient: 'from-accent-500 to-accent-400',
          sidebarGradient: 'from-accent-500/10 to-accent-400/10',
        };
      default:
        return {
          mainGradient: 'from-brand-500 to-brand-400',
          bgGradient: 'from-brand-900/20 via-brand-800/20 to-brand-900/20',
          headerGradient: 'from-brand-500/20 to-brand-400/20',
          borderColor: 'border-brand-400/30',
          textColor: 'text-brand-300',
          accentColor: 'text-brand-400',
          buttonGradient: 'from-brand-500 to-brand-400',
          buttonHover: 'hover:from-brand-600 hover:to-brand-500',
          progressGradient: 'from-brand-500 to-brand-400',
          sidebarGradient: 'from-brand-500/10 to-brand-400/10',
        };
    }
  };

  const colorClasses = getColorClasses(demoColor);

  const getTransactionStatusIcon = (status: string, type: string) => {
    if (status === 'pending') return '⏳';
    if (status === 'success') {
      switch (type) {
        case 'escrow':
          return '🔒';
        case 'milestone':
          return '🎯';
        case 'fund':
          return '💰';
        case 'approve':
          return '✅';
        case 'release':
          return '🎉';
        case 'dispute':
          return '⚖️';
        default:
          return '✅';
      }
    }
    if (status === 'failed') return '❌';
    return '❓';
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4'>
      <div
        className={`bg-gradient-to-br ${colorClasses.bgGradient} border ${colorClasses.borderColor} rounded-lg sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${colorClasses.headerGradient} border-b ${colorClasses.borderColor} p-3 sm:p-6 flex-shrink-0`}
        >
          <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0'>
            <div className='flex items-center space-x-2 sm:space-x-4 w-full lg:w-auto'>
              <Image
                src='/images/logo/logoicon.png'
                alt='Stellar Nexus'
                width={32}
                height={32}
                className='animate-pulse sm:w-10 sm:h-10'
              />
              <div className='flex-1 min-w-0'>
                <h2 className='text-base sm:text-xl font-bold text-white truncate'>{demoTitle}</h2>
                <p className={`${colorClasses.textColor} text-xs sm:text-sm truncate`}>
                  {demoDescription}
                </p>
              </div>
            </div>

            {/* Enhanced Progress Bar and Transaction Status */}
            {currentStep === 'demo' && (
              <div className='flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 w-full lg:w-auto'>
                {/* Progress Info - Mobile: Full width, Desktop: Auto */}
                <div className='flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto'>
                  <div className='text-xs sm:text-sm text-white/70 whitespace-nowrap'>
                    {formatTime(elapsedTime)}
                  </div>
                  <div className='flex-1 min-w-[80px] sm:w-32 lg:w-40 h-2 bg-white/10 rounded-full overflow-hidden'>
                    <div
                      className={`h-full bg-gradient-to-r ${colorClasses.progressGradient} transition-all duration-300`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className='text-xs sm:text-sm text-white/70 whitespace-nowrap hidden sm:inline'>
                    {estimatedTime} mins
                  </div>
                  <div className='hidden sm:inline text-white/70'>|</div>
                  <div
                    className={`text-xs sm:text-sm flex items-center space-x-1 whitespace-nowrap ${
                      completedSteps.length === 0
                        ? 'text-gray-400'
                        : completedSteps.length === demoSteps.length
                          ? 'text-green-400'
                          : 'text-brand-300'
                    }`}
                  >
                    {completedSteps.length === demoSteps.length ? (
                      <>
                        <span className='font-semibold text-green-300'>
                          ({completedSteps.length}/{demoSteps.length})
                        </span>
                        <span className='text-green-400'>✅</span>
                      </>
                    ) : (
                      <>
                        <span className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current mr-1'></span>
                        <span>
                          ({completedSteps.length}/{demoSteps.length})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Transaction Status Indicator and Account Explorer */}
                <div className='flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto'>
                  <button
                    onClick={() => setShowTransactionHistory(!showTransactionHistory)}
                    className='flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 border border-green-400/30 rounded-lg hover:bg-green-500/30 transition-all duration-300 cursor-pointer text-xs sm:text-sm'
                    title={
                      showTransactionHistory
                        ? 'Hide transaction sidebar'
                        : 'Show transaction sidebar'
                    }
                  >
                    <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse'></div>
                    <span className='font-medium text-green-300'>
                      📊 <span className='hidden sm:inline'>Live </span>Txns (
                      {demoTransactions.length})
                    </span>
                  </button>

                  {/* Account Explorer Button */}
                  {isConnected && walletData?.publicKey && (
                    <button
                      onClick={() => {
                        const isTestnet =
                          walletData?.network === 'TESTNET' || !walletData?.isMainnet;
                        const networkSuffix = isTestnet ? 'testnet' : 'public';
                        const explorerUrl = `${API_ENDPOINTS.STELLAR_EXPERT.BASE_URL}/${networkSuffix}/account/${walletData.publicKey}`;
                        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                        addToast({
                          type: 'info',
                          title: '🌐 Account Explorer',
                          message:
                            'Opening your wallet on Stellar Expert - view your balance, transactions, and assets',
                          duration: 4000,
                        });
                      }}
                      className='px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-all duration-300 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm'
                      title='View account on Stellar Explorer'
                    >
                      <span>🌐</span>
                      <span className='font-medium hidden sm:inline'>Account Explorer</span>
                      <span className='font-medium sm:hidden'>Explorer</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={handleCloseClick}
              className={`transition-colors p-1.5 sm:p-2 rounded-lg absolute top-3 right-3 lg:relative lg:top-0 lg:right-0 z-10 ${
                currentStep === 'demo'
                  ? 'text-white/70 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-400/30'
                  : 'text-white/70 hover:text-white'
              }`}
              title={
                currentStep === 'demo' ? 'Exit demo (will ask for confirmation)' : 'Close modal'
              }
            >
              <svg
                className='w-5 h-5 sm:w-6 sm:h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
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

        {/* Content */}
        <div className='flex flex-col lg:flex-row flex-1 overflow-hidden'>
          {/* Main Content */}
          <div
            className={`p-3 sm:p-6 overflow-y-auto ${currentStep === 'demo' ? 'flex-1' : 'w-full'}`}
          >
            {currentStep === 'warning' && (
              <div className='text-center space-y-4 sm:space-y-6'>
                <div className='text-4xl sm:text-6xl mb-2 sm:mb-4'>⚠️</div>
                <h3 className='text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-4'>
                  Immersive Demo Experience
                </h3>

                <div className='bg-white/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20'>
                  <h4
                    className={`text-base sm:text-lg font-semibold ${colorClasses.textColor} mb-3 sm:mb-4`}
                  >
                    What to Expect:
                  </h4>
                  <ul className='text-white/80 space-y-2 text-left text-sm sm:text-base'>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>⏱️</span>
                      <span>
                        Estimated time: <strong>{estimatedTime} minutes</strong>
                      </span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>🎯</span>
                      <span>Full attention required - no distractions</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>📊</span>
                      <span>Progress tracking throughout the experience</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>💬</span>
                      <span>Mandatory feedback collection at the end</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>🔐</span>
                      <span>Wallet sidebar will open for additional tracking</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>📊</span>
                      <span>Toggle transaction sidebar for real-time blockchain tracking</span>
                    </li>
                    <li className='flex items-center space-x-2'>
                      <span className={colorClasses.accentColor}>🔔</span>
                      <span>Toast notifications for important updates</span>
                    </li>
                  </ul>
                </div>

                {!isConnected && (
                  <div className='bg-yellow-500/20 border border-yellow-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4'>
                    <p className='text-yellow-300 text-sm sm:text-base'>
                      🔗 <strong>Wallet Required:</strong> Please connect your Stellar wallet to
                      start the demo
                    </p>
                  </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4'>
                  <button
                    onClick={onClose}
                    className='px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors text-sm sm:text-base'
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleStartDemo}
                    disabled={!isConnected}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r ${colorClasses.buttonGradient} ${colorClasses.buttonHover} text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base`}
                  >
                    Start Immersive Demo
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'demo' && (
              <div className='space-y-3 sm:space-y-4'>
                {/* Transaction Tracking Info */}
                <div className='bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4'>
                  <div className='flex items-center space-x-2 sm:space-x-3'>
                    <span className='text-xl sm:text-2xl'>📊</span>
                    <div>
                      <h4 className='text-green-300 font-semibold text-sm sm:text-base'>
                        Live Transaction Tracking
                      </h4>
                      <p className='text-white/70 text-xs sm:text-sm'>
                        Watch your transactions appear in real-time{' '}
                        <span className='hidden lg:inline'>on the right sidebar </span>with direct
                        blockchain explorer links
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Content */}
                <div className=''>
                  <ProgressContext.Provider
                    value={{ updateProgress: updateDemoProgress, markStepCompleted }}
                  >
                    {children}
                  </ProgressContext.Provider>
                </div>

                {/* Complete Demo Button */}
                <div className='text-center'>
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCompleteDemo();
                    }}
                    disabled={isCompletingDemo || completedSteps.length < demoSteps.length}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r ${colorClasses.buttonGradient} ${colorClasses.buttonHover} text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 cursor-pointer relative z-10 text-sm sm:text-base ${
                      isCompletingDemo || completedSteps.length < demoSteps.length
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    style={{ pointerEvents: 'auto' }}
                    type='button'
                  >
                    {isCompletingDemo ? (
                      <div className='flex items-center justify-center space-x-2'>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        <span className='hidden sm:inline'>Completing Demo...</span>
                        <span className='sm:hidden'>Completing...</span>
                      </div>
                    ) : completedSteps.length < demoSteps.length ? (
                      <div className='flex items-center justify-center space-x-2'>
                        <span>⏳ Complete Steps First</span>
                      </div>
                    ) : (
                      '🎉 Complete Demo'
                    )}
                  </button>
                  <p className='text-xs text-white/50 mt-2 px-2'>
                    {isCompletingDemo
                      ? 'Processing demo completion...'
                      : completedSteps.length < demoSteps.length
                        ? `Complete all ${demoSteps.length} steps to enable demo completion`
                        : 'Click to complete the demo and provide feedback'}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'feedback' && (
              <div className='space-y-4 sm:space-y-6'>
                <div className='text-center'>
                  <div className='text-4xl sm:text-6xl mb-3 sm:mb-4'>🎉</div>
                  <h3 className='text-xl sm:text-2xl font-bold text-white mb-2'>Demo Completed!</h3>
                  <p className='text-white/70 text-sm sm:text-base'>
                    Time taken: {formatTime(elapsedTime)}
                  </p>
                </div>

                {/* Rating */}
                <div className='space-y-3'>
                  <label className='block text-white font-semibold text-sm sm:text-base'>
                    How would you rate this demo experience? 🤔
                  </label>
                  <div className='flex justify-center space-x-2'>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFeedback(prev => ({ ...prev, rating }))}
                        className={`text-3xl transition-all duration-200 hover:scale-110 ${
                          feedback.rating >= rating ? 'text-yellow-400' : 'text-white/30'
                        }`}
                      >
                        {feedback.rating >= rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                  <p className='text-center text-white/60 text-sm'>
                    {feedback.rating === 0 && 'Click to rate'}
                    {feedback.rating === 1 && 'Poor'}
                    {feedback.rating === 2 && 'Fair'}
                    {feedback.rating === 3 && 'Good'}
                    {feedback.rating === 4 && 'Very Good'}
                    {feedback.rating === 5 && 'Excellent!'}
                  </p>
                </div>

                {/* Difficulty */}
                <div className='space-y-3'>
                  <label className='block text-white font-semibold text-sm sm:text-base'>
                    How difficult was this demo? 🧠
                  </label>
                  <div className='flex justify-center space-x-3'>
                    {[
                      { value: 'easy', label: 'Easy', emoji: '😊' },
                      { value: 'medium', label: 'Medium', emoji: '🤔' },
                      { value: 'hard', label: 'Hard', emoji: '😅' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setFeedback(prev => ({ ...prev, difficulty: option.value as any }))
                        }
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          feedback.difficulty === option.value
                            ? `${colorClasses.textColor.replace('text-', 'bg-').replace('-300', '-500')}/20 ${colorClasses.borderColor.replace('border-', 'border-').replace('-400/30', '-400/50')} ${colorClasses.textColor}`
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className='text-2xl mb-1'>{option.emoji}</div>
                        <div className='text-sm'>{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Would Recommend */}
                <div className='space-y-3'>
                  <label className='block text-white font-semibold text-sm sm:text-base'>
                    Would you recommend this demo to others? 💭
                  </label>
                  <div className='flex justify-center space-x-4'>
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: true }))}
                      className={`px-6 py-3 rounded-lg border transition-all duration-200 ${
                        feedback.wouldRecommend
                          ? 'bg-green-500/20 border-green-400/50 text-green-300'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className='text-2xl mb-1'>👍</div>
                      <div className='text-sm'>Yes!</div>
                    </button>
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, wouldRecommend: false }))}
                      className={`px-6 py-3 rounded-lg border transition-all duration-200 ${
                        !feedback.wouldRecommend
                          ? 'bg-red-500/20 border-red-400/50 text-red-300'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className='text-2xl mb-1'>👎</div>
                      <div className='text-sm'>No</div>
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div className='space-y-3'>
                  <label className='block text-white font-semibold text-sm sm:text-base'>
                    Any additional comments? 💬
                  </label>
                  <textarea
                    value={feedback.comment}
                    onChange={e => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder='Share your thoughts about the demo experience...'
                    className='w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-brand-400/50 resize-none text-sm sm:text-base'
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <div className='text-center'>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback || feedback.rating === 0}
                    className={`px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r ${colorClasses.buttonGradient} ${colorClasses.buttonHover} text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base`}
                  >
                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transaction History Sidebar - Toggleable and Responsive */}
          {currentStep === 'demo' && showTransactionHistory && (
            <div
              className={`w-full lg:w-80 max-h-64 lg:max-h-none bg-gradient-to-b from-neutral-800/50 to-neutral-900/50 border-t lg:border-t-0 lg:border-l ${colorClasses.borderColor} flex flex-col`}
            >
              {/* Sidebar Header */}
              <div
                className={`p-3 sm:p-4 border-b ${colorClasses.borderColor} bg-gradient-to-r ${colorClasses.sidebarGradient}`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2 sm:space-x-3'>
                    <div className='w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse'></div>
                    <div>
                      <h3 className='text-base sm:text-lg font-semibold text-white flex items-center space-x-2'>
                        <span>📊 Live Transactions</span>
                      </h3>
                      <p className='text-xs sm:text-sm text-green-300 mt-0.5 sm:mt-1'>
                        Real-time blockchain tracking
                      </p>
                    </div>
                  </div>
                  {/* Close Button */}
                  <button
                    onClick={() => setShowTransactionHistory(false)}
                    className='text-white/70 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-400/30 p-1 sm:p-1.5 rounded-lg transition-all duration-300'
                    title='Hide transaction sidebar'
                  >
                    <svg
                      className='w-4 h-4 sm:w-5 sm:h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
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

              {/* Transaction List */}
              <div className='flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3'>
                {demoTransactions.length === 0 ? (
                  <div className='text-center py-4 sm:py-8'>
                    <div className='text-3xl sm:text-4xl mb-2 sm:mb-3'>📝</div>
                    <p className='text-white/60 text-xs sm:text-sm'>No transactions yet</p>
                    <p className='text-white/40 text-xs mt-1 px-2'>
                      Transactions will appear here as you interact with the demo
                    </p>
                  </div>
                ) : (
                  demoTransactions.map((transaction, index) => (
                    <div
                      key={transaction.hash}
                      className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 ${
                        transaction.status === 'success'
                          ? 'bg-green-500/10 border-green-400/30'
                          : transaction.status === 'failed'
                            ? 'bg-red-500/10 border-red-400/30'
                            : 'bg-yellow-500/10 border-yellow-400/30'
                      }`}
                    >
                      <div className='flex items-start space-x-2 sm:space-x-3'>
                        <div className='text-base sm:text-lg flex-shrink-0'>
                          {getTransactionStatusIcon(transaction.status, transaction.type)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between'>
                            <h4 className='text-xs sm:text-sm font-medium text-white capitalize'>
                              {transaction.type}
                            </h4>
                            <span className='text-[10px] sm:text-xs text-white/60 whitespace-nowrap ml-1'>
                              {formatTransactionTime(transaction.timestamp)}
                            </span>
                          </div>
                          <p className='text-[10px] sm:text-xs text-white/70 mt-0.5 sm:mt-1 truncate'>
                            {transaction.message}
                          </p>
                          {transaction.amount && (
                            <p className='text-[10px] sm:text-xs text-brand-300 mt-0.5 sm:mt-1'>
                              {transaction.amount} {transaction.asset || 'XLM'}
                            </p>
                          )}
                          <div className='flex items-center justify-between mt-1 sm:mt-2 gap-1'>
                            <div className='flex items-center space-x-1 sm:space-x-2 flex-wrap'>
                              <span
                                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                                  transaction.status === 'success'
                                    ? 'bg-green-500/20 text-green-300'
                                    : transaction.status === 'failed'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-yellow-500/20 text-yellow-300'
                                }`}
                              >
                                {transaction.status}
                              </span>
                              <span className='text-[10px] sm:text-xs text-white/50 font-mono whitespace-nowrap'>
                                {transaction.hash.slice(0, 6)}...
                              </span>
                              {transaction.message.includes('(Simulated for demo)') && (
                                <span className='text-[10px] sm:text-xs text-yellow-400 bg-yellow-400/20 px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap'>
                                  🎭
                                </span>
                              )}
                            </div>

                            {/* Explorer Links for successful real transactions only */}
                            {transaction.status === 'success' &&
                              !transaction.hash.startsWith('mock_') &&
                              !transaction.hash.startsWith('init_failed_') &&
                              !transaction.hash.startsWith('fund_failed_') &&
                              !transaction.hash.startsWith('complete_failed_') &&
                              !transaction.hash.startsWith('approve_failed_') &&
                              !transaction.hash.startsWith('release_failed_') &&
                              !transaction.hash.startsWith('fund_') &&
                              !transaction.hash.startsWith('complete_') &&
                              !transaction.hash.startsWith('approve_') &&
                              !transaction.hash.startsWith('release_') &&
                              !transaction.message.includes('(Simulated for demo)') && (
                                <div className='flex space-x-1 flex-shrink-0'>
                                  {transaction && transaction.hash && (
                                    <button
                                      onClick={() => {
                                        // 🚩 CORRECCIÓN CRÍTICA: Usa ?? '' para manejar null/undefined como string vacío
                                        const finalUrl = transaction.stellarExpertUrl ?? '';

                                        console.log('HASH en el Modal:', transaction.hash);
                                        console.log('URL EXPERT en el Modal:', finalUrl); // Mostrará '' si está vacío

                                        // 1. Verificar si la URL REAL está presente (si no es una cadena vacía)
                                        if (finalUrl) {
                                          window.open(finalUrl, '_blank', 'noopener,noreferrer');
                                          // ... (Mostrar toast de éxito) ...
                                        } else {
                                          // 2. Si es una cadena vacía (aún no sincronizada), muestra el toast de error
                                          addToast({
                                            type: 'error',
                                            title: 'URL Not Yet Synced',
                                            message:
                                              'Explorer link not yet available. Please wait a moment.',
                                          });
                                        }
                                      }}
                                    >
                                      🌐
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(transaction.hash);
                                      addToast({
                                        type: 'success',
                                        title: '📋 Hash Copied',
                                        message: 'Transaction hash copied!',
                                        duration: 2000,
                                      });
                                    }}
                                    className='px-1 sm:px-1.5 py-0.5 sm:py-1 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded text-xs hover:bg-blue-500/30 transition-all duration-300'
                                    title='Copy transaction hash'
                                  >
                                    📋
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sidebar Footer */}
              <div
                className={`p-2 sm:p-4 border-t ${colorClasses.borderColor} bg-gradient-to-r from-neutral-800/50 to-neutral-900/50`}
              >
                <div className='text-[10px] sm:text-xs text-white/50 space-y-1 sm:space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span>💡 Real-time tracking</span>
                    <span className='font-mono'>{demoTransactions.length} txns</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span>🌐 Explorer links</span>
                    <span className='text-green-400'>Available</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Confirmation Dialog */}
        {showCloseConfirmation && (
          <div className='absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4'>
            <div className='bg-gradient-to-br from-neutral-800 to-neutral-900 border border-red-400/30 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6'>
              <div className='text-center space-y-3 sm:space-y-4'>
                <div className='text-3xl sm:text-4xl'>⚠️</div>
                <h3 className='text-lg sm:text-xl font-bold text-white'>Exit Demo?</h3>
                <p className='text-white/70 text-xs sm:text-sm leading-relaxed'>
                  You're currently in the middle of a demo. If you exit now, your progress will be
                  lost and you'll need to start over.
                </p>

                {/* Enhanced Progress indicator */}
                <div className='bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10'>
                  <div className='flex items-center justify-between mb-2 sm:mb-3'>
                    <div className='text-xs sm:text-sm font-medium text-white'>
                      Current Progress
                    </div>
                    <div className='text-xs sm:text-sm font-bold text-brand-300'>
                      {Math.round(progress)}%
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='w-full h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden mb-2 sm:mb-3'>
                    <div
                      className={`h-full bg-gradient-to-r ${colorClasses.progressGradient} transition-all duration-500 ease-out`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  {/* Progress Details */}
                  <div className='grid grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs'>
                    <div className='bg-white/5 rounded-lg p-2 border border-white/5'>
                      <div className='text-white/60 mb-1'>Steps Completed</div>
                      <div className='text-white font-semibold'>
                        {completedSteps.length} / {demoSteps.length}
                      </div>
                    </div>
                    <div className='bg-white/5 rounded-lg p-2 border border-white/5'>
                      <div className='text-white/60 mb-1'>Time Spent</div>
                      <div className='text-white font-semibold'>{formatTime(elapsedTime)}</div>
                    </div>
                  </div>

                  {/* Completed Steps List */}
                  {completedSteps.length > 0 && (
                    <div className='mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10'>
                      <div className='text-[10px] sm:text-xs text-white/60 mb-1 sm:mb-2'>
                        Completed Steps:
                      </div>
                      <div className='space-y-1 max-h-20 sm:max-h-24 overflow-y-auto'>
                        {completedSteps.map((step, index) => (
                          <div key={step} className='flex items-center space-x-2'>
                            <div className='w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full flex-shrink-0'></div>
                            <span className='text-[10px] sm:text-xs text-green-300'>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remaining Steps */}
                  {demoSteps.filter(step => !completedSteps.includes(step)).length > 0 && (
                    <div className='mt-2'>
                      <div className='text-[10px] sm:text-xs text-white/60 mb-1 sm:mb-2'>
                        Remaining Steps:
                      </div>
                      <div className='space-y-1'>
                        {demoSteps
                          .filter(step => !completedSteps.includes(step))
                          .slice(0, 3)
                          .map((step, index) => (
                            <div key={step} className='flex items-center space-x-2'>
                              <div className='w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/30 rounded-full flex-shrink-0'></div>
                              <span className='text-[10px] sm:text-xs text-white/60'>{step}</span>
                            </div>
                          ))}
                        {demoSteps.filter(step => !completedSteps.includes(step)).length > 3 && (
                          <div className='text-[10px] sm:text-xs text-white/40 ml-3'>
                            +{demoSteps.filter(step => !completedSteps.includes(step)).length - 3}{' '}
                            more steps
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                  <button
                    onClick={() => setShowCloseConfirmation(false)}
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r ${colorClasses.buttonGradient} ${colorClasses.buttonHover} text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base`}
                  >
                    Continue Demo
                  </button>
                  <button
                    onClick={() => {
                      // Ask the demo to refund if applicable, then close
                      window.dispatchEvent(new CustomEvent('demoRefundNow'));
                      handleCloseModal();
                    }}
                    className='flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 hover:border-green-400/50 text-green-300 hover:text-green-200 font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base'
                  >
                    Refund Now & Exit
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className='flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 hover:border-red-400/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base'
                  >
                    Exit Anyway
                  </button>
                </div>

                <p className='text-[10px] sm:text-xs text-white/50'>
                  💡 You can always restart the demo later from the demos page
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
