'use client';

import { useState, useEffect } from 'react';
import { useGlobalWallet } from '@/contexts/wallet/WalletContext';
import { useToast } from '@/contexts/ui/ToastContext';
import { useTransactionHistory } from '@/contexts/data/TransactionContext';
import { useFirebase } from '@/contexts/data/FirebaseContext';
import ConfettiAnimation from '@/components/ui/animations/ConfettiAnimation';
import { useImmersiveProgress } from '@/components/ui/modals/ImmersiveDemoModal';
import Image from 'next/image';
import {
  useFundEscrow,
  useChangeMilestoneStatus,
  useApproveMilestone,
  useReleaseFunds,
} from '@/lib/services/trustless-work/mock-trustless-work';
import { useRealInitializeEscrow } from '@/lib/services/trustless-work/real-trustless-work';
import { assetConfig } from '@/lib/stellar/wallet-config';
import { Tooltip } from '@/components/ui/Tooltip';

interface MicroTask {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  status: 'open' | 'in-progress' | 'completed' | 'approved' | 'released';
  client: string;
  worker?: string;
  deliverables?: string;
  createdAt: string;
  escrowId?: string;
}

interface TaskCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const MicroTaskMarketplaceDemo = ({
  onDemoComplete,
}: {
  onDemoComplete?: (demoId: string, demoName: string, completionTime: number) => void;
}) => {
  const { walletData, isConnected } = useGlobalWallet();
  const { addToast } = useToast();
  const { addTransaction, updateTransaction } = useTransactionHistory();
  // Demo completion tracking is now handled by FirebaseContext
  const { completeDemo } = useFirebase();
  const { updateProgress } = useImmersiveProgress();

  // Smart step tracking for micro-task marketplace
  const [tasksPosted, setTasksPosted] = useState(0);
  const [tasksAccepted, setTasksAccepted] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-tasks' | 'post-task'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    deadline: '',
  });
  // Per-task deliverable states to prevent sharing state between tasks
  const [taskDeliverables, setTaskDeliverables] = useState<Record<string, string>>({});
  const [selectedTask, setSelectedTask] = useState<MicroTask | null>(null);

  // Progress tracking for demo completion
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [postedTasks, setPostedTasks] = useState<Set<string>>(new Set());

  // Individual loading states for each task
  const [taskLoadingStates, setTaskLoadingStates] = useState<Record<string, boolean>>({});

  // Confetti animation state
  const [showConfetti, setShowConfetti] = useState(false);

  // Demo completion tracking
  const [demoStartTime, setDemoStartTime] = useState<number | null>(null);
  const [demoStarted, setDemoStarted] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Safety refund state for demo session
  const [canRefund, setCanRefund] = useState(false);

  // Listen for global refund requests (triggered by modal close)
  useEffect(() => {
    const handler = () => {
      handleRefundNow();
    };
    window.addEventListener('demoRefundNow', handler as EventListener);
    return () => window.removeEventListener('demoRefundNow', handler as EventListener);
  }, []);

  const handleRefundNow = () => {
    addToast({
      type: 'success',
      title: '🔄 Refund Completed',
      message: 'Demo funds are simulated for safety. Your wallet remains unchanged.',
      duration: 5000,
    });
    resetDemo();
    setCanRefund(false);
  };

  // Always use real blockchain transactions
  const hooks = {
    initializeEscrow: useRealInitializeEscrow().initializeEscrow,
    isLoading: useRealInitializeEscrow().isLoading,
    error: useRealInitializeEscrow().error,
    fundEscrow: useFundEscrow().fundEscrow, // Fallback to mock for now
    changeMilestoneStatus: useChangeMilestoneStatus().changeMilestoneStatus, // Fallback to mock for now
    approveMilestone: useApproveMilestone().approveMilestone, // Fallback to mock for now
    releaseFunds: useReleaseFunds().releaseFunds, // Fallback to mock for now
  };

  // Mock task categories
  const [categories] = useState<TaskCategory[]>([
    { id: 'design', name: 'Design', icon: '🎨', color: 'from-pink-500 to-rose-500' },
    { id: 'development', name: 'Development', icon: '💻', color: 'from-blue-500 to-cyan-500' },
    { id: 'writing', name: 'Writing', icon: '✍️', color: 'from-green-500 to-emerald-500' },
    { id: 'marketing', icon: '📢', name: 'Marketing', color: 'from-accent-500 to-accent-600' },
    { id: 'research', name: 'Research', icon: '🔍', color: 'from-orange-500 to-amber-500' },
  ]);

  // Helper functions for demo completion
  const canCompleteDemo = () => {
    return postedTasks.size >= 1 && completedTasks.size >= 3;
  };

  const getDemoProgress = () => {
    const totalSteps = 4; // Post 1 task + Complete 3 tasks
    const completedSteps = postedTasks.size + completedTasks.size;
    return Math.min((completedSteps / totalSteps) * 100, 100);
  };

  // Removed template task distinction - all tasks count toward completion

  // Track if demo completion has been triggered to prevent multiple calls
  const [demoCompletionTriggered, setDemoCompletionTriggered] = useState(false);

  // Check if demo can be completed and auto-complete when requirements are met
  useEffect(() => {
    const canComplete = canCompleteDemo();

    if (canComplete && !demoCompleted && !demoCompletionTriggered) {
      setDemoCompletionTriggered(true);
      setShowConfetti(true);
      setIsCompleted(true); // Mark as completed to prevent multiple executions

      // Complete the demo using the centralized account system
      const completeThisDemo = async () => {
        try {
          const score = 90; // High score for completing micro task marketplace
          const completionTimeInSeconds = demoStartTime
            ? Math.floor((Date.now() - demoStartTime) / 1000)
            : 0; // Calculate completion time in seconds
          const completionTimeInMinutes = Math.round(completionTimeInSeconds / 60);

          // Use the centralized account system for completion
          await completeDemo('micro-marketplace', score);

          // Demo completion is now handled by FirebaseContext

          // Note: Feedback modal will be triggered when user clicks "Complete Demo" button
        } catch (error) {
          addToast({
            type: 'error',
            title: '❌ Demo Completion Failed',
            message: 'Failed to complete demo. Please try again.',
            duration: 5000,
          });
        }
      };

      // Complete demo after a short delay
      setTimeout(completeThisDemo, 2000);

      // Hide confetti after animation
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [
    completedTasks,
    postedTasks,
    demoCompleted,
    demoCompletionTriggered,
    demoStartTime,
    completeDemo,
    addToast,
  ]);

  // Mock micro-tasks
  const [tasks, setTasks] = useState<MicroTask[]>([
    {
      id: 'task_1',
      title: 'Logo Design for Startup',
      description:
        'Need a modern, minimalist logo for a tech startup. Should be scalable and work well in both light and dark themes.',
      category: 'design',
      budget: '500000', // 5 USDC
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      client: 'client_wallet_address',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_2',
      title: 'React Component Library',
      description:
        'Create a reusable component library with 10+ components including buttons, forms, and navigation elements.',
      category: 'development',
      budget: '800000', // 8 USDC
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      client: 'client_wallet_address',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_3',
      title: 'Blog Post Series',
      description:
        'Write 5 blog posts about blockchain technology trends. Each post should be 800-1000 words with SEO optimization.',
      category: 'writing',
      budget: '300000', // 3 USDC
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      client: 'client_wallet_address',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_4',
      title: 'Social Media Strategy',
      description:
        'Develop a comprehensive social media strategy for a B2B SaaS company. Include content calendar and engagement tactics.',
      category: 'marketing',
      budget: '400000', // 4 USDC
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      client: 'client_wallet_address',
      createdAt: new Date().toISOString(),
    },
  ]);

  async function handlePostTask() {
    if (!walletData) {
      addToast({
        type: 'warning',
        title: '🔗 Wallet Connection Required',
        message: 'Please connect your Stellar wallet to post tasks',
        duration: 5000,
      });
      return;
    }
    if (
      !newTask.title ||
      !newTask.description ||
      !newTask.category ||
      !newTask.budget ||
      !newTask.deadline
    )
      return;

    try {
      const task: MicroTask = {
        id: `task_${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        budget: (parseInt(newTask.budget) * 100000).toString(), // Convert to USDC decimals
        deadline: newTask.deadline,
        status: 'open',
        client: walletData.publicKey,
        createdAt: new Date().toISOString(),
      };

      setTasks([...tasks, task]);

      // Track posted task for demo completion
      setPostedTasks(prev => new Set(Array.from(prev).concat(task.id)));

      addTransaction({
        hash: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        message: `Task "${task.title}" posted successfully`,
        type: 'milestone',
        demoId: 'micro-marketplace',
        amount: `${(parseInt(task.budget) / 100000).toFixed(1)} USDC`,
        asset: 'USDC',
      });

      // Track progress milestone - task posting
      const newTaskCount = tasksPosted + 1;
      setTasksPosted(newTaskCount);

      if (newTaskCount === 1) {
        updateProgress('task_posted');
      }

      addToast({
        type: 'success',
        title: '✅ Task Posted!',
        message: `"${task.title}" has been posted to the marketplace`,
        duration: 5000,
      });

      // Reset form
      setNewTask({
        title: '',
        description: '',
        category: '',
        budget: '',
        deadline: '',
      });

      setActiveTab('browse');
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Task Posting Failed',
        message: error instanceof Error ? error.message : 'Failed to post task',
        duration: 5000,
      });
    }
  }

  async function handleAcceptTask(taskId: string) {
    if (!walletData) {
      addToast({
        type: 'warning',
        title: '🔗 Wallet Connection Required',
        message: 'Please connect your Stellar wallet to accept tasks',
        duration: 5000,
      });
      return;
    }

    try {
      // Set loading state for this specific task
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));

      // Initialize escrow for the task
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Add pending transaction
      const txHash = `pending_real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      addTransaction({
        hash: txHash,
        status: 'pending',
        message: `Accepting task "${task.title}" and creating escrow...`,
        type: 'escrow',
        demoId: 'micro-marketplace',
        amount: `${(parseInt(task.budget) / 100000).toFixed(1)} USDC`,
        asset: 'USDC',
      });

      const payload = {
        escrowType: 'multi-release' as const,
        releaseMode: 'multi-release' as const,
        asset: assetConfig.defaultAsset,
        amount: task.budget,
        platformFee: assetConfig.platformFee,
        buyer: task.client,
        seller: walletData.publicKey,
        arbiter: walletData.publicKey, // For demo, same wallet
        terms: `Micro-task: ${task.title}`,
        deadline: task.deadline,
        metadata: {
          demo: 'micro-marketplace',
          description: 'Micro-task marketplace escrow',
          taskId: task.id,
          category: task.category,
        },
      };

      const result = await hooks.initializeEscrow(payload);

      // Start demo timing when first task is accepted
      if (!demoStarted) {
        setDemoStarted(true);
        setDemoStartTime(Date.now());
      }

      // Update transaction status
      updateTransaction(txHash, 'success', `Task "${task.title}" accepted and escrow created`);

      // Update task status
      const updatedTasks = tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: 'in-progress' as const,
              worker: walletData.publicKey,
              escrowId: result.contractId,
            }
          : t
      );
      setTasks(updatedTasks);

      // Track progress milestone - accept task
      const newAcceptCount = tasksAccepted + 1;
      setTasksAccepted(newAcceptCount);

      if (newAcceptCount === 1) {
        updateProgress('task_accepted');
      } else if (newAcceptCount === 2) {
        updateProgress('task_accepted_2');
      } else if (newAcceptCount === 3) {
        updateProgress('task_accepted_3');
      }

      addToast({
        type: 'success',
        title: '✅ Task Accepted!',
        message: `"${task.title}" has been accepted and escrow created`,
        duration: 5000,
      });

      // Add a random deliverable message for demo purposes
      const randomDeliverables = [
        '✅ Completed the design mockup with modern UI components and responsive layout',
        '🎨 Delivered high-quality graphics and illustrations for the project',
        '📝 Wrote comprehensive documentation and user guides',
        '🔧 Implemented the requested features with clean, maintainable code',
        '🎯 Created marketing materials and social media content',
        '📊 Analyzed data and provided detailed insights and recommendations',
        '🎬 Produced video content with professional editing and effects',
        '🔍 Conducted thorough research and compiled comprehensive findings',
        '💡 Developed innovative solutions and creative concepts',
        '⚡ Optimized performance and improved user experience',
      ];

      const randomDeliverable =
        randomDeliverables[Math.floor(Math.random() * randomDeliverables.length)];
      setTaskDeliverables(prev => ({ ...prev, [taskId]: randomDeliverable }));

      // Fund the escrow
      await handleFundEscrow(result.contractId, task.budget);
      setCanRefund(true);
    } catch (error) {
      // Update transaction status to failed
      const txHash = `failed_real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      addTransaction({
        hash: txHash,
        status: 'failed',
        message: `Failed to accept task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'escrow',
        demoId: 'micro-marketplace',
        amount: '0 USDC',
        asset: 'USDC',
      });

      addToast({
        type: 'error',
        title: '❌ Task Acceptance Failed',
        message: error instanceof Error ? error.message : 'Failed to accept task',
        duration: 5000,
      });
    } finally {
      // Clear loading state for this specific task
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
    }
  }

  async function handleFundEscrow(escrowId: string, amount: string) {
    try {
      const payload = {
        contractId: escrowId,
        amount,
        releaseMode: 'multi-release',
      };

      await hooks.fundEscrow(payload);
    } catch (error) {
      console.error('Error funding escrow:', error);
    }
  }

  async function handleSubmitDeliverable(taskId: string) {
    if (!walletData) {
      addToast({
        type: 'warning',
        title: '🔗 Wallet Connection Required',
        message: 'Please connect your Stellar wallet to submit deliverables',
        duration: 5000,
      });
      return;
    }
    const deliverable = taskDeliverables[taskId];
    if (!deliverable || !deliverable.trim()) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.escrowId) return;

      // Update task with deliverable
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: 'completed' as const, deliverables: deliverable } : t
      );
      setTasks(updatedTasks);

      addTransaction({
        hash: `submit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        message: `Deliverable submitted for "${task.title}"`,
        type: 'milestone',
        demoId: 'micro-marketplace',
        amount: `${(parseInt(task.budget) / 100000).toFixed(1)} USDC`,
        asset: 'USDC',
      });

      // Track progress milestone - complete work
      const newCompleteCount = tasksCompleted + 1;
      setTasksCompleted(newCompleteCount);

      if (newCompleteCount === 1) {
        updateProgress('work_completed');
      } else if (newCompleteCount === 2) {
        updateProgress('work_completed_2');
      }

      addToast({
        type: 'success',
        title: '✅ Deliverable Submitted!',
        message: `Work has been submitted for "${task.title}"`,
        duration: 5000,
      });

      // Track completed task for demo completion (now requires accept + submit deliverable)
      setCompletedTasks(prev => new Set(Array.from(prev).concat(taskId)));

      // Note: Milestone status change is handled by the escrow system
      // For demo purposes, we'll skip the milestone status change
      // as it requires real blockchain implementation
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit deliverable',
        duration: 5000,
      });
    }
  }

  async function handleApproveTask(taskId: string) {
    if (!walletData) {
      addToast({
        type: 'warning',
        title: '🔗 Wallet Connection Required',
        message: 'Please connect your Stellar wallet to approve tasks',
        duration: 5000,
      });
      return;
    }
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.escrowId) return;

      // Approve milestone
      const payload = {
        contractId: task.escrowId,
        milestoneId: 'release_1',
        releaseMode: 'multi-release',
      };

      await hooks.approveMilestone(payload);

      addTransaction({
        hash: `approve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        message: `Task "${task.title}" approved successfully`,
        type: 'approve',
        demoId: 'micro-marketplace',
        amount: `${(parseInt(task.budget) / 100000).toFixed(1)} USDC`,
        asset: 'USDC',
      });

      // Note: Approval tracking removed since it's not required for demo completion

      addToast({
        type: 'success',
        title: '✅ Task Approved!',
        message: `"${task.title}" has been approved`,
        duration: 5000,
      });

      // Update task status
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: 'approved' as const } : t
      );
      setTasks(updatedTasks);

      // Track completed task for demo completion
      setCompletedTasks(prev => new Set(Array.from(prev).concat(taskId)));
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Approval Failed',
        message: error instanceof Error ? error.message : 'Failed to approve task',
        duration: 5000,
      });
    }
  }

  async function handleReleaseFunds(taskId: string) {
    if (!walletData) {
      addToast({
        type: 'warning',
        title: '🔗 Wallet Connection Required',
        message: 'Please connect your Stellar wallet to release funds',
        duration: 5000,
      });
      return;
    }
    try {
      // Set loading state for this specific task
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));

      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.escrowId) return;

      // Release funds
      const payload = {
        contractId: task.escrowId,
        milestoneId: 'release_1',
        releaseMode: 'multi-release',
      };

      await hooks.releaseFunds(payload);

      addTransaction({
        hash: `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        message: `Funds released for "${task.title}"`,
        type: 'release',
        demoId: 'micro-marketplace',
        amount: `${(parseInt(task.budget) / 100000).toFixed(1)} USDC`,
        asset: 'USDC',
      });

      // Note: Payment release tracking removed since it's not required for demo completion

      addToast({
        type: 'success',
        title: '💰 Funds Released!',
        message: `Funds have been released for "${task.title}"`,
        duration: 5000,
      });

      // Update task status
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: 'released' as const } : t
      );
      setTasks(updatedTasks);

      // If no tasks remain in-progress/approved, disable refund button
      const anyActive = updatedTasks.some(t => ['in-progress', 'completed', 'approved'].includes(t.status));
      if (!anyActive) setCanRefund(false);
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Release Failed',
        message: error instanceof Error ? error.message : 'Failed to release funds',
        duration: 5000,
      });
    } finally {
      // Clear loading state for this specific task
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      // Set loading state for this specific task
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Update task status to completed
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, status: 'completed' as const } : t
      );
      setTasks(updatedTasks);

      addTransaction({
        hash: `complete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        message: `Task "${task.title}" completed successfully`,
        type: 'milestone',
        demoId: 'micro-marketplace',
        amount: `${(parseInt(task.budget) / 100000).toFixed(1)} USDC`,
        asset: 'USDC',
      });

      addToast({
        type: 'success',
        title: '✅ Task Completed!',
        message: `"${task.title}" has been completed successfully`,
        duration: 5000,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '❌ Completion Failed',
        message: error instanceof Error ? error.message : 'Failed to complete task',
        duration: 5000,
      });
    } finally {
      // Clear loading state for this specific task
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
    }
  }

  const filteredTasks = tasks.filter(
    task => selectedCategory === 'all' || task.category === selectedCategory
  );

  const myTasks = tasks.filter(
    task => task.client === walletData?.publicKey || task.worker === walletData?.publicKey
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-success-500/20 text-success-300';
      case 'in-progress':
        return 'bg-brand-500/20 text-brand-300';
      case 'completed':
        return 'bg-warning-500/20 text-warning-300';
      case 'approved':
        return 'bg-accent-500/20 text-accent-300';
      case 'released':
        return 'bg-neutral-500/20 text-neutral-300';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📋';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'from-gray-500 to-gray-600';
  };

  function resetDemo() {
    setActiveTab('browse');
    setSelectedCategory('all');
    setNewTask({
      title: '',
      description: '',
      category: '',
      budget: '',
      deadline: '',
    });
    // Clear all task deliverables
    setTaskDeliverables({});
    setSelectedTask(null);

    // Reset all tasks to open status
    const resetTasks = tasks.map(t => ({
      ...t,
      status: 'open' as const,
      worker: undefined,
      escrowId: undefined,
      deliverables: undefined,
    }));
    setTasks(resetTasks);

    // Reset progress tracking
    setCompletedTasks(new Set());
    setPostedTasks(new Set());
    setTaskDeliverables({});
    setDemoCompleted(false);

    addToast({
      type: 'warning',
      title: '🔄 Demo Reset',
      message: 'Demo has been reset. You can start over from the beginning.',
      duration: 4000,
    });
  }

  return (
    <div className='max-w-6xl mx-auto'>
      <div className='bg-gradient-to-br from-accent-500/20 to-accent-600/20 backdrop-blur-sm border border-accent-400/30 rounded-xl shadow-2xl p-8'>
        <div className='text-center mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-500'>
              🛒 Micro-Task Marketplace Demo
            </h2>
            {canRefund && (
              <button
                onClick={handleRefundNow}
                className='px-3 py-1.5 rounded-lg border border-green-400/30 text-green-200 bg-green-500/10 hover:bg-green-500/20 transition-colors text-xs sm:text-sm'
                title='Refund simulated funds and reset demo'
              >
                🔄 Refund Now
              </button>
            )}
          </div>
          <p className='text-white/80 text-lg'>
            Lightweight gig-board with escrow functionality for micro-tasks
          </p>

          {/* Wallet Connection Required Message */}
          {!isConnected && (
            <div className='mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-accent-500/20 border border-cyan-400/30 rounded-lg text-center'>
              <div className='flex items-center justify-center space-x-2 mb-3'>
                <span className='text-2xl'>🔐</span>
                <h4 className='text-lg font-semibold text-cyan-300'>Wallet Connection Required</h4>
              </div>
              <p className='text-white/80 text-sm mb-4'>
                You need to connect your Stellar wallet to post tasks, accept work, and manage
                escrow contracts.
              </p>
              <button
                onClick={() => {
                  // Dispatch custom event to open wallet sidebar
                  window.dispatchEvent(new CustomEvent('toggleWalletSidebar'));
                }}
                className='px-6 py-2 bg-gradient-to-r from-cyan-500 to-accent-600 hover:from-cyan-600 hover:to-accent-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/20 hover:border-white/40'
              >
                🔗 Connect Wallet
              </button>
            </div>
          )}
        </div>

        <div className='mb-8'>
          {/* Demo Flow Guidance */}
          <div className='mb-4 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-lg'>
            <h4 className='text-purple-300 font-semibold mb-2'>🚀 Demo Flow Guide</h4>
            <div className='text-purple-200 text-sm space-y-1'>
              <p>
                1️⃣ <strong>Post Task:</strong> Create a task as a client to complete the demo
              </p>
              <p>
                2️⃣ <strong>Browse Tasks:</strong> Accept tasks AND submit deliverables (submit 3+ to
                complete demo)
              </p>
              <p>
                3️⃣ <strong>My Tasks:</strong> View posted tasks and track progress
              </p>
            </div>
          </div>

          <div className='flex space-x-2 bg-white/5 rounded-lg p-1'>
            {(['browse', 'my-tasks', 'post-task'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-accent-500/30 text-accent-200 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab === 'browse' && '🔍 Browse Tasks'}
                {tab === 'my-tasks' && '📋 My Tasks'}
                {tab === 'post-task' && '➕ Post Task'}
              </button>
            ))}
          </div>
        </div>

        {/* Confetti Animation */}
        <ConfettiAnimation isActive={showConfetti} />

        {/* Tab Content */}
        {/* Browse Tasks Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Browse Tasks Guidance */}
            {completedTasks.size < 3 && (
              <div className='mb-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg'>
                <p className='text-yellow-300 text-sm'>
                  🎯 <strong>Demo Progress:</strong> Accept tasks AND submit deliverables for at
                  least 3 tasks to finish the demo!
                  <br />
                  <span className='text-yellow-200 float-right'>
                    Current progress: {completedTasks.size}/3 tasks completed ✅
                  </span>
                </p>
                <br />
              </div>
            )}
            {/* Tasks Grid */}
            <div className='grid md:grid-cols-2 gap-6'>
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className='p-6 bg-white/5 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-300'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <span className='text-2xl'>{getCategoryIcon(task.category)}</span>
                        <h4 className='text-lg font-semibold text-white'>{task.title}</h4>
                      </div>
                      <p className='text-white/70 text-sm mb-3'>{task.description}</p>
                      <div className='flex items-center space-x-4 text-sm'>
                        <span className='text-accent-300'>
                          {(parseInt(task.budget) / 100000).toFixed(1)} USDC
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace('-', ' ').charAt(0).toUpperCase() +
                            task.status.replace('-', ' ').slice(1)}
                        </span>
                      </div>
                      <p className='text-xs text-white/50 mt-2'>
                        Posted {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Task Actions */}
                  <div className='space-y-2'>
                    {task.status === 'open' && (
                      <Tooltip
                        content={
                          !isConnected || taskLoadingStates[task.id] ? (
                            !isConnected ? (
                              <div className='text-center'>
                                <div className='text-red-300 font-semibold mb-1'>
                                  🔌 Wallet Not Connected
                                </div>
                                <div className='text-xs text-gray-300'>
                                  Please connect your wallet to accept tasks
                                </div>
                              </div>
                            ) : (
                              <div className='text-center'>
                                <div className='text-blue-300 font-semibold mb-1'>
                                  ⏳ Processing...
                                </div>
                                <div className='text-xs text-gray-300'>
                                  Please wait for the current operation to complete
                                </div>
                              </div>
                            )
                          ) : null
                        }
                        position='top'
                      >
                        <button
                          onClick={() => handleAcceptTask(task.id)}
                          disabled={!isConnected || taskLoadingStates[task.id]}
                          className='w-full px-4 py-2 bg-accent-500/20 hover:bg-accent-500/30 border border-accent-400/30 rounded-lg text-accent-300 hover:text-accent-200 transition-colors'
                        >
                          {taskLoadingStates[task.id] ? 'Accepting...' : 'Accept Task'}
                        </button>
                      </Tooltip>
                    )}

                    {task.status === 'in-progress' && task.worker === walletData?.publicKey && (
                      <div className='space-y-2'>
                        <div className='p-3 bg-white/5 rounded-lg'>
                          <p className='text-sm text-white/70 mb-2'>Deliverable Ready:</p>
                          <p className='text-white text-sm'>
                            {taskDeliverables[task.id] || 'Preparing deliverable...'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSubmitDeliverable(task.id)}
                          disabled={!taskDeliverables[task.id] || taskLoadingStates[task.id]}
                          className='w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 hover:text-green-200 transition-colors'
                        >
                          {taskLoadingStates[task.id] ? 'Submitting...' : 'Submit Deliverable'}
                        </button>
                      </div>
                    )}

                    {task.status === 'completed' && task.client === walletData?.publicKey && (
                      <div className='space-y-2'>
                        <div className='p-3 bg-white/5 rounded-lg'>
                          <p className='text-sm text-white/70 mb-2'>Deliverable:</p>
                          <p className='text-white text-sm'>{task.deliverables}</p>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          <button
                            onClick={() => handleApproveTask(task.id)}
                            disabled={taskLoadingStates[task.id]}
                            className='px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 hover:text-green-200 transition-colors text-sm'
                          >
                            {taskLoadingStates[task.id] ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReleaseFunds(task.id)}
                            disabled={taskLoadingStates[task.id]}
                            className='px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors text-sm'
                          >
                            {taskLoadingStates[task.id] ? 'Releasing...' : 'Release Funds'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Tasks Tab */}
        {activeTab === 'my-tasks' && (
          <div>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold text-white'>My Tasks</h3>
              {postedTasks.size > 0 && (
                <div className='p-3 bg-green-500/20 border border-green-400/30 rounded-lg'>
                  <p className='text-green-300 text-sm'>
                    ✅ <strong>Great!</strong> You've posted {postedTasks.size} task
                    {postedTasks.size === 1 ? '' : 's'}. Check them out below!
                  </p>
                </div>
              )}
            </div>
            {myTasks.length === 0 ? (
              <div className='text-center py-12'>
                <div className='text-4xl mb-4'>📋</div>
                <p className='text-white/70'>
                  No tasks found. Start by browsing available tasks or posting a new one!
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {myTasks.map(task => (
                  <div key={task.id} className='p-6 bg-white/5 rounded-lg border border-white/20'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='text-lg font-semibold text-white mb-2'>{task.title}</h4>
                        <p className='text-white/70 text-sm mb-3'>{task.description}</p>
                        <div className='flex items-center space-x-4 text-sm'>
                          <span className='text-accent-300'>
                            {(parseInt(task.budget) / 100000).toFixed(1)} USDC
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}
                          >
                            {task.status.replace('-', ' ').charAt(0).toUpperCase() +
                              task.status.replace('-', ' ').slice(1)}
                          </span>
                          <span className='text-white/50'>
                            {task.client === walletData?.publicKey
                              ? '👔 Client'
                              : task.worker === walletData?.publicKey
                                ? '👷 Worker'
                                : '👤 Other'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task Actions for My Tasks */}
                    <div className='mt-4 space-y-2'>
                      {task.status === 'in-progress' && task.worker === walletData?.publicKey && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={taskLoadingStates[task.id]}
                          className='w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 hover:text-green-200 transition-colors'
                        >
                          {taskLoadingStates[task.id] ? 'Completing...' : 'Complete Task'}
                        </button>
                      )}

                      {task.status === 'completed' && task.client === walletData?.publicKey && (
                        <div className='grid grid-cols-2 gap-2'>
                          <button
                            onClick={() => handleApproveTask(task.id)}
                            disabled={taskLoadingStates[task.id]}
                            className='px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 hover:text-green-200 transition-colors text-sm'
                          >
                            {taskLoadingStates[task.id] ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReleaseFunds(task.id)}
                            disabled={taskLoadingStates[task.id]}
                            className='px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors text-sm'
                          >
                            {taskLoadingStates[task.id] ? 'Releasing...' : 'Release Funds'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Task Tab */}
        {activeTab === 'post-task' && (
          <div className='max-w-2xl mx-auto'>
            {postedTasks.size === 0 && (
              <div className='mt-2 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg'>
                <p className='text-blue-300 text-sm'>
                  💡 <strong>Demo Completion:</strong> Post at least 1 task to complete this demo!
                </p>
              </div>
            )}
            <br />
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h3 className='text-lg font-semibold text-white'>Post New Task</h3>
              </div>
              <button
                onClick={() => {
                  setNewTask({
                    title: 'Design a modern landing page',
                    description:
                      'Create a responsive landing page with modern UI/UX design, including hero section, features showcase, and contact form. Must be mobile-friendly and optimized for conversion.',
                    category: 'design',
                    budget: '150.0',
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0], // 7 days from now
                  });
                }}
                className='px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 hover:text-blue-200 transition-colors text-sm font-medium'
              >
                📝 Fill Template Data
              </button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-white/80 mb-2'>Task Title</label>
                <input
                  type='text'
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder='Enter task title...'
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent-400/50'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-white/80 mb-2'>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder='Describe the task requirements...'
                  rows={4}
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent-400/50'
                />
              </div>

              <div className='grid md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-white/80 mb-2'>Category</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent-400/50'
                  >
                    <option value='' className='text-black'>
                      Select category
                    </option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className='text-black'>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-white/80 mb-2'>
                    Budget (USDC)
                  </label>
                  <input
                    type='number'
                    value={newTask.budget}
                    onChange={e => setNewTask({ ...newTask, budget: e.target.value })}
                    placeholder='0.0'
                    step='0.1'
                    min='0.1'
                    className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent-400/50'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-white/80 mb-2'>Deadline</label>
                <input
                  type='date'
                  value={newTask.deadline}
                  onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400/50'
                />
              </div>

              <Tooltip
                content={
                  !isConnected ||
                  !newTask.title ||
                  !newTask.description ||
                  !newTask.category ||
                  !newTask.budget ||
                  !newTask.deadline ? (
                    !isConnected ? (
                      <div className='text-center'>
                        <div className='text-red-300 font-semibold mb-1'>
                          🔌 Wallet Not Connected
                        </div>
                        <div className='text-xs text-gray-300'>
                          Please connect your wallet to post tasks
                        </div>
                      </div>
                    ) : (
                      <div className='text-center'>
                        <div className='text-yellow-300 font-semibold mb-1'>
                          📝 Complete All Fields
                        </div>
                        <div className='text-xs text-gray-300'>
                          Please fill in all required fields to post a task
                        </div>
                      </div>
                    )
                  ) : null
                }
                position='top'
              >
                <button
                  onClick={handlePostTask}
                  disabled={
                    !isConnected ||
                    !newTask.title ||
                    !newTask.description ||
                    !newTask.category ||
                    !newTask.budget ||
                    !newTask.deadline
                  }
                  className='w-full px-6 py-3 bg-accent-500/20 hover:bg-accent-500/30 border border-accent-400/30 rounded-lg text-accent-300 hover:text-accent-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Post Task
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Error Display */}
        {hooks.error && (
          <div className='p-4 bg-red-500/20 border border-red-400/30 rounded-lg'>
            <h4 className='font-semibold text-red-300 mb-2'>Error Occurred</h4>
            <p className='text-red-200 text-sm'>{hooks.error?.message}</p>
          </div>
        )}

        {/* Demo Completion Success Box - Moved to bottom */}
        {canCompleteDemo() && !demoCompleted && (
          <div className='mt-8 mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg'>
            <div className='text-center'>
              <div className='flex justify-center mb-4'>
                <Image
                  src='/images/logo/logoicon.png'
                  alt='Stellar Nexus Logo'
                  width={80}
                  height={80}
                  className='animate-bounce'
                />
              </div>
              <h3 className='text-xl font-bold text-green-300 mb-2'>
                Demo Successfully Completed!
              </h3>
              <p className='text-green-200 mb-4'>
                Congratulations! You've successfully demonstrated the micro-task marketplace
                workflow:
              </p>
              <ul className='text-green-200 text-sm space-y-1 mb-6'>
                <li>✅ Posted at least 1 task</li>
                <li>✅ Completed and approved 3 tasks</li>
                <li>✅ Experienced the full escrow workflow</li>
              </ul>
              <div className='text-center'>
                <p className='text-green-200 text-sm'>
                  🎉 Demo completed automatically! Check the success box below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Instructions */}
        <div className='mt-8 p-6 bg-accent-500/10 border border-accent-400/30 rounded-lg'>
          <h3 className='text-lg font-semibold text-accent-300 mb-3'>📚 How This Demo Works</h3>
          <ul className='text-accent-200 text-sm space-y-2'>
            <li>
              • <strong>Browse Tasks:</strong> View available micro-tasks by category
            </li>
            <li>
              • <strong>Post Tasks:</strong> Clients can create new tasks with budgets and deadlines
            </li>
            <li>
              • <strong>Accept Tasks:</strong> Workers can accept tasks, automatically creating
              escrow
            </li>
            <li>
              • <strong>Submit Deliverables:</strong> Workers submit work for review
            </li>
            <li>
              • <strong>Approve & Release:</strong> Clients approve work and release funds
              automatically
            </li>
          </ul>
          <p className='text-accent-200 text-sm mt-3'>
            This demonstrates how a marketplace can integrate with Stellar escrow functionality,
            providing trustless payment processing for micro-tasks and gig work.
          </p>
        </div>
      </div>
    </div>
  );
};
