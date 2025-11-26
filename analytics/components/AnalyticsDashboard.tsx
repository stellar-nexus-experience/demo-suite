'use client';

import React, { useState, useEffect } from 'react';
import { PlatformAnalytics } from './PlatformAnalytics';
import { AccountAnalytics } from './AccountAnalytics';
import { FeedbackAnalytics } from './FeedbackAnalytics';
import { AnalyticsView } from '../types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/contexts/ui/ThemeContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ViewConfig {
  id: AnalyticsView;
  label: string;
  icon: string;
  comingSoon?: boolean;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const views: ViewConfig[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'feedback', label: 'Feedback', icon: '💬' },
    { id: 'demos', label: 'Demos', icon: '🎮', comingSoon: true },
    { id: 'engagement', label: 'Engagement', icon: '⚡', comingSoon: true },
  ];

  const getThemeClasses = () => {
    if (theme === 'light') {
      return {
        container:
          'p-6 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-2xl',
        headerContainer:
          'p-6 bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-2xl',
        text: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
      };
    } else {
      return {
        container:
          'p-6 bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl',
        headerContainer:
          'p-6 bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
      };
    }
  };

  const themeClasses = getThemeClasses();

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <PlatformAnalytics />;
      case 'users':
        return <AccountAnalytics />;
      case 'feedback':
        return <FeedbackAnalytics />;
      case 'demos':
        return (
          <div className={themeClasses.container}>
            <h2 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>Demo Analytics</h2>
            <p className={themeClasses.textSecondary}>Demo analytics coming soon...</p>
          </div>
        );
      case 'engagement':
        return (
          <div className={themeClasses.container}>
            <h2 className={`text-xl font-semibold ${themeClasses.text} mb-4`}>
              Engagement Analytics
            </h2>
            <p className={themeClasses.textSecondary}>Engagement analytics coming soon...</p>
          </div>
        );
      default:
        return <PlatformAnalytics />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={themeClasses.headerContainer}>
        <div className='flex items-center justify-between'>
          <div>
            <div
              className='flex items-center space-x-2 cursor-pointer'
              onClick={() => router.push('/')}
            >
              <Image src='/images/logo/logoicon.png' alt='Nexus Logo' width={100} height={100} />
              <Image src='/images/logo/iconletter.png' alt='Nexus Logo' width={100} height={100} />
            </div>
            <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Analytics Dashboard</h1>
            <p className={`${themeClasses.textMuted} mt-1`}>Platform insights and user analytics</p>
          </div>
          <div className='flex items-center space-x-4'>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={themeClasses.container}>
        <div className='flex flex-wrap gap-2'>
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 rounded-lg transition-colors relative ${
                activeView === view.id
                  ? theme === 'light'
                    ? 'bg-blue-500/20 border border-blue-400/50 text-blue-600'
                    : 'bg-blue-500/20 border border-blue-400/50 text-blue-300'
                  : theme === 'light'
                    ? 'bg-gray-100/50 border border-gray-200/50 text-gray-600 hover:bg-gray-200/50'
                    : 'bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className='mr-2'>{view.icon}</span>
              {view.label}
              {view.comingSoon && (
                <div
                  className={`absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 ${
                    theme === 'light' ? 'border-white' : 'border-gray-900'
                  } animate-pulse shadow-lg`}
                >
                  Soon
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='min-h-[600px]'>
        {loading ? (
          <div className={themeClasses.container}>
            <div className='animate-pulse space-y-4'>
              <div
                className={`h-6 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} rounded w-1/3`}
              ></div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-20 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} rounded`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          renderActiveView()
        )}
      </div>
    </div>
  );
};
