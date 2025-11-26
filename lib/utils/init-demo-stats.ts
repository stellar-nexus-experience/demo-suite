// Utility to initialize demo stats for existing demos
// This can be called once to set up the demo_stats collection

import { demoStatsService } from '../firebase/firebase-service';

export const initializeAllDemoStats = async () => {
  const demos = [
    { id: 'hello-milestone', name: 'Baby Steps to Riches' },
    { id: 'dispute-resolution', name: 'Drama Queen Escrow' },
    { id: 'micro-marketplace', name: 'Gig Economy Madness' },
    { id: 'nexus-master', name: 'Nexus Master Achievement' },
  ];

  for (const demo of demos) {
    try {
      await demoStatsService.initializeDemoStats(demo.id, demo.name);
    } catch (error) {
      // Failed to initialize stats
    }
  }
};

// Function to check and display current demo stats
export const checkDemoStats = async () => {
  try {
    const stats = await demoStatsService.getAllDemoStats();
    return stats;
  } catch (error) {
    return [];
  }
};

// Call this function to initialize demo stats
// initializeAllDemoStats().catch(console.error);

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).initializeAllDemoStats = initializeAllDemoStats;
  (window as any).checkDemoStats = checkDemoStats;
}
