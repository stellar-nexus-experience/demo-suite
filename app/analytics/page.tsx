'use client';

import React from 'react';
import { AnalyticsDashboard } from '@/analytics';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { ThemeProvider } from '@/contexts/ui/ThemeContext';

export default function AnalyticsPage() {
  return (
    <ThemeProvider>
      <div className='min-h-screen relative overflow-hidden'>
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Content */}
        <div className='relative z-10 container mx-auto px-4 py-8'>
          <AnalyticsDashboard />
        </div>
      </div>
    </ThemeProvider>
  );
}
