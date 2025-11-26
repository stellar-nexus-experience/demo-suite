'use client';

import { useEffect, useState, useCallback } from 'react';
import { Account, DemoStats } from '@/lib/firebase/firebase-types';
import { DemoCard, DEMO_CARDS } from '@/utils/constants/demos';
import { DemoCardItem } from './DemoCardItem';

interface DemoSelectorProps {
  activeDemo: string;
  setActiveDemo: (demo: string) => void;
  setShowImmersiveDemo: (show: boolean) => void;
  isConnected: boolean;
  addToast: (toast: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }) => void;
  account: Account | null;
  demoStats: DemoStats[];
  completeDemo: (demoId: string, score?: number, completionTimeMinutes?: number) => Promise<void>;
  hasBadge: (badgeId: string) => Promise<boolean>;
  hasClappedDemo: (demoId: string) => Promise<boolean>;
  clapDemo: (demoId: string) => Promise<void>;
  refreshAccountData: () => Promise<void>;
}

export const DemoSelector = ({
  activeDemo,
  setActiveDemo,
  setShowImmersiveDemo,
  isConnected,
  addToast,
  account,
  demoStats,
  completeDemo,
  hasBadge,
  hasClappedDemo,
  clapDemo,
  refreshAccountData,
}: DemoSelectorProps) => {
  // State for tracking which demos user has clapped for
  const [userClappedDemos, setUserClappedDemos] = useState<string[]>([]);

  // Load clapped demos when component mounts or account changes
  useEffect(() => {
    const loadClappedDemos = async () => {
      if (!isConnected || !account) {
        setUserClappedDemos([]);
        return;
      }

      try {
        // Extract clapped demos from account.clappedDemos
        let clappedArray: string[] = [];
        if (Array.isArray(account.clappedDemos)) {
          clappedArray = account.clappedDemos;
        } else if (account.clappedDemos && typeof account.clappedDemos === 'object') {
          clappedArray = Object.values(account.clappedDemos) as string[];
        }

        setUserClappedDemos(clappedArray);
      } catch (error) {
        // Error loading clapped demos - silently handled
        setUserClappedDemos([]);
      }
    };

    loadClappedDemos();
  }, [isConnected, account]);

  // Handle demo clapping
  const handleClapDemo = useCallback(
    async (demoId: string) => {
      // Call the backend clap function
      await clapDemo(demoId);

      // Update local state to reflect the new clap
      setUserClappedDemos(prev => [...prev, demoId]);
    },
    [clapDemo]
  );

  const handleSelectDemo = useCallback(
    (demoId: string) => {
      setActiveDemo(demoId);
      setShowImmersiveDemo(true);
    },
    [setActiveDemo, setShowImmersiveDemo]
  );

  return (
    <div className='space-y-8'>
      {/* Demo Cards */}
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-2'>
        {DEMO_CARDS.map((demo: DemoCard) => (
          <DemoCardItem
            key={demo.id}
            demo={demo}
            account={account}
            activeDemo={activeDemo}
            isConnected={isConnected}
            demoStats={demoStats.find(s => s.demoId === demo.id)}
            userClappedDemos={userClappedDemos}
            onClap={handleClapDemo}
            onSelectDemo={handleSelectDemo}
            onCompleteDemo={completeDemo}
            addToast={addToast}
            refreshAccountData={refreshAccountData}
          />
        ))}
      </div>
    </div>
  );
};
