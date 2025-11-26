'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Badge } from '@/contexts/auth/AuthContext';
import { BadgeEarnedAnimation } from '@/components/ui/badges/BadgeEarnedAnimation';

// Extend Badge interface to include earningPoints
interface BadgeWithPoints extends Badge {
  earningPoints: number;
}

interface BadgeAnimationState {
  badge: BadgeWithPoints;
  points?: number;
}

interface BadgeAnimationContextType {
  showBadgeAnimation: (badge: Badge, points?: number) => void;
  isAnimationVisible: boolean;
}

const BadgeAnimationContext = createContext<BadgeAnimationContextType | undefined>(undefined);

export const useBadgeAnimation = () => {
  const context = useContext(BadgeAnimationContext);
  if (!context) {
    // During SSR or if provider is missing, return a no-op function
    return {
      showBadgeAnimation: () => {
        // Badge animation skipped - provider not found
      },
      isAnimationVisible: false,
    };
  }
  return context;
};

interface BadgeAnimationProviderProps {
  children: ReactNode;
}

export const BadgeAnimationProvider: React.FC<BadgeAnimationProviderProps> = ({ children }) => {
  const [animationState, setAnimationState] = useState<BadgeAnimationState | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showBadgeAnimation = (badge: Badge, points?: number) => {
    // Create a BadgeWithPoints by adding the earningPoints property
    const badgeWithPoints: BadgeWithPoints = {
      ...badge,
      earningPoints: points || 0,
    };
    setAnimationState({ badge: badgeWithPoints, points });
    setIsVisible(true);
  };

  const handleAnimationComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      setAnimationState(null);
    }, 100);
  };

  return (
    <BadgeAnimationContext.Provider
      value={{
        showBadgeAnimation,
        isAnimationVisible: isVisible,
      }}
    >
      {children}

      {/* Badge Animation Overlay */}
      {animationState && (
        <BadgeEarnedAnimation
          badge={animationState.badge}
          isVisible={isVisible}
          onComplete={handleAnimationComplete}
          points={animationState.points}
        />
      )}
    </BadgeAnimationContext.Provider>
  );
};

export default BadgeAnimationProvider;
