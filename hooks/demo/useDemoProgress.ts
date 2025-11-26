'use client';

import { useAuth } from '@/contexts/auth/AuthContext';
import { useCallback } from 'react';

export interface DemoStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface DemoProgressData {
  demoId: string;
  demoName: string;
  steps: DemoStep[];
  currentStep: number;
  totalSteps: number;
  startTime: number;
  completed: boolean;
  completedAt?: string;
  score?: number;
}

export const useDemoProgress = (
  demoId: string,
  demoName: string,
  steps: Omit<DemoStep, 'completed' | 'completedAt'>[]
) => {
  const { user, updateDemoProgress, addBadge, isAuthenticated } = useAuth();

  // Initialize demo progress
  const initializeProgress = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const existingProgress = user.demoProgress[demoId];
    if (!existingProgress) {
      const progressData = {
        completed: false,
        stepsCompleted: 0,
        totalSteps: steps.length,
        timeSpent: 0,
      };
      updateDemoProgress(demoId, progressData);
    }
  }, [demoId, steps.length, user, updateDemoProgress, isAuthenticated]);

  // Complete a step
  const completeStep = useCallback(
    async (stepId: string) => {
      if (!isAuthenticated || !user) return;

      const existingProgress = user.demoProgress[demoId];
      if (!existingProgress) {
        await updateDemoProgress(demoId, {
          completed: false,
          stepsCompleted: 1,
          totalSteps: steps.length,
          timeSpent: 0,
        });
      } else {
        const newStepsCompleted = Math.min(existingProgress.stepsCompleted + 1, steps.length);
        const isCompleted = newStepsCompleted === steps.length;

        await updateDemoProgress(demoId, {
          stepsCompleted: newStepsCompleted,
          completed: isCompleted,
          completedAt: isCompleted ? new Date().toISOString() : undefined,
        });

        // Add completion badge if demo is completed
        if (isCompleted) {
          await addBadge({
            id:
              demoId === 'hello-milestone'
                ? 'escrow_expert'
                : demoId === 'dispute-resolution'
                  ? 'trust_guardian'
                  : demoId === 'micro-marketplace'
                    ? 'stellar_champion'
                    : 'escrow_expert',
            name: `${demoName} Master`,
            description: `Completed the ${demoName} demo successfully`,
            icon: '🏆',
            rarity: 'common',
            category: 'demo',
          });
        }
      }
    },
    [demoId, demoName, steps.length, user, updateDemoProgress, addBadge, isAuthenticated]
  );

  // Update time spent
  const updateTimeSpent = useCallback(
    async (timeSpent: number) => {
      if (!isAuthenticated || !user) return;

      const existingProgress = user.demoProgress[demoId];
      if (existingProgress) {
        await updateDemoProgress(demoId, {
          timeSpent: existingProgress.timeSpent + timeSpent,
        });
      }
    },
    [demoId, user, updateDemoProgress, isAuthenticated]
  );

  // Get current progress
  const getCurrentProgress = useCallback(() => {
    if (!isAuthenticated || !user) {
      return {
        demoId,
        demoName,
        steps: steps.map(step => ({ ...step, completed: false })),
        currentStep: 0,
        totalSteps: steps.length,
        startTime: Date.now(),
        completed: false,
      };
    }

    const existingProgress = user.demoProgress[demoId];
    if (!existingProgress) {
      return {
        demoId,
        demoName,
        steps: steps.map(step => ({ ...step, completed: false })),
        currentStep: 0,
        totalSteps: steps.length,
        startTime: Date.now(),
        completed: false,
      };
    }

    return {
      demoId,
      demoName,
      steps: steps.map((step, index) => ({
        ...step,
        completed: index < existingProgress.stepsCompleted,
        completedAt:
          index < existingProgress.stepsCompleted ? existingProgress.completedAt : undefined,
      })),
      currentStep: existingProgress.stepsCompleted,
      totalSteps: existingProgress.totalSteps,
      startTime: Date.now(),
      completed: existingProgress.completed,
      completedAt: existingProgress.completedAt,
      score: existingProgress.score,
    };
  }, [demoId, demoName, steps, user, isAuthenticated]);

  // Check if demo is completed
  const isDemoCompleted = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    return user.demoProgress[demoId]?.completed || false;
  }, [demoId, user, isAuthenticated]);

  // Get completion percentage
  const getCompletionPercentage = useCallback(() => {
    if (!isAuthenticated || !user) return 0;
    const progress = user.demoProgress[demoId];
    if (!progress) return 0;
    return Math.round((progress.stepsCompleted / progress.totalSteps) * 100);
  }, [demoId, user, isAuthenticated]);

  return {
    initializeProgress,
    completeStep,
    updateTimeSpent,
    getCurrentProgress,
    isDemoCompleted,
    getCompletionPercentage,
    isAuthenticated,
  };
};
