'use client';

import React, { useState, useEffect } from 'react';
import { PlatformStats, UserEngagementMetrics } from '../types';
import { AnalyticsService } from '../services/analyticsService';
import { useTheme } from '@/contexts/ui/ThemeContext';

interface PlatformAnalyticsProps {
  className?: string;
}

export const PlatformAnalytics: React.FC<PlatformAnalyticsProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes progressAnimation {
        0% {
          stroke-dashoffset: 283;
        }
        100% {
          stroke-dashoffset: var(--target-offset);
        }
      }
      
      @keyframes barFill {
        0% {
          width: 0%;
        }
        100% {
          width: var(--target-width);
        }
      }
      
      .progress-bar {
        animation: barFill 1.5s ease-in-out forwards;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, engagement] = await Promise.all([
        AnalyticsService.getPlatformStats(),
        AnalyticsService.getUserEngagementMetrics(),
      ]);

      setPlatformStats(stats);
      setUserEngagement(engagement);
    } catch (err) {
      console.error('Error loading platform analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white/5 rounded-lg border border-white/20 ${className}`}>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 bg-white/10 rounded w-1/3'></div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='h-20 bg-white/10 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white/5 rounded-lg border border-white/20 ${className}`}>
        <div className='text-center'>
          <p className='text-red-400 mb-4'>{error}</p>
          <button
            onClick={loadAnalytics}
            className='px-4 py-2 bg-blue-500/20 border border-blue-400/50 text-blue-300 rounded-lg hover:bg-blue-500/30'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!platformStats || !userEngagement) {
    return (
      <div
        className={`p-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-white/20'} rounded-lg border ${className}`}
      >
        <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>
          No analytics data available
        </p>
      </div>
    );
  }

  const getThemeClasses = () => {
    if (theme === 'light') {
      return {
        container:
          'p-6 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-2xl',
        card: 'p-4 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-xl border border-gray-200/30 hover:from-gray-50 hover:to-gray-100 shadow-lg',
        text: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        border: 'border-gray-200/30',
        hover: 'hover:from-gray-50 hover:to-gray-100',
      };
    } else {
      return {
        container:
          'p-6 bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl',
        card: 'p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-white/20 hover:from-slate-700/60 hover:to-slate-800/60 shadow-lg',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
        border: 'border-white/20',
        hover: 'hover:from-slate-700/60 hover:to-slate-800/60',
      };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Platform Overview */}
      <div className={themeClasses.container}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Platform Overview</h2>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <StatCard
            title='Total Users'
            value={platformStats.totalUsers.toLocaleString()}
            icon='👥'
            color='blue'
          />
          <StatCard
            title='Demos Completed'
            value={platformStats.totalDemosCompleted.toLocaleString()}
            icon='🎮'
            color='green'
          />
          <StatCard
            title='Total Feedback'
            value={platformStats.totalFeedback.toLocaleString()}
            icon='💬'
            color='purple'
          />
          <StatCard
            title='Badges Earned'
            value={platformStats.totalBadgesEarned.toLocaleString()}
            icon='🏆'
            color='yellow'
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className={themeClasses.container}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Performance Metrics</h2>

        {/* Visual Charts Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          {/* Rating Distribution Chart */}
          <div className={themeClasses.card}>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-4 flex items-center`}>
              <span className='mr-2'>⭐</span>
              Rating Distribution
            </h3>
            <div className='space-y-3'>
              {[5, 4, 3, 2, 1].map(rating => {
                const percentage = Math.random() * 100; // Placeholder - would use real data
                const isCurrentRating = rating === Math.round(platformStats.averageRating);
                return (
                  <div key={rating} className='flex items-center space-x-3'>
                    <div className='w-8 text-center'>
                      <span
                        className={`text-sm font-medium ${isCurrentRating ? 'text-yellow-400' : themeClasses.textMuted}`}
                      >
                        {rating}
                      </span>
                    </div>
                    <div className='flex-1'>
                      <div
                        className={`w-full h-3 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-full overflow-hidden`}
                      >
                        <div
                          className={`h-full rounded-full progress-bar ${
                            isCurrentRating
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : 'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}
                          style={
                            {
                              '--target-width': `${percentage}%`,
                              animationDelay: `${rating * 200}ms`,
                            } as React.CSSProperties
                          }
                        ></div>
                      </div>
                    </div>
                    <div className='w-12 text-right'>
                      <span className={`text-xs ${themeClasses.textMuted}`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className={`mt-4 p-3 ${theme === 'light' ? 'bg-gray-100/80' : 'bg-gray-700/50'} rounded-lg`}
            >
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                <span className='text-yellow-400 font-medium'>
                  Average: {platformStats.averageRating.toFixed(1)}/5
                </span>
              </p>
            </div>
          </div>

          {/* Completion Time Chart */}
          <div className={themeClasses.card}>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-4 flex items-center`}>
              <span className='mr-2'>⏱️</span>
              Completion Time Trends
            </h3>
            <div className='space-y-4'>
              {/* Time Range Bars */}
              {[
                { label: '0-5 min', value: 25, color: 'from-green-400 to-green-600' },
                { label: '5-15 min', value: 45, color: 'from-blue-400 to-blue-600' },
                { label: '15-30 min', value: 20, color: 'from-yellow-400 to-yellow-600' },
                { label: '30+ min', value: 10, color: 'from-red-400 to-red-600' },
              ].map((range, index) => (
                <div key={range.label} className='space-y-1'>
                  <div className='flex justify-between text-sm'>
                    <span className={themeClasses.textSecondary}>{range.label}</span>
                    <span className={themeClasses.textMuted}>{range.value}%</span>
                  </div>
                  <div
                    className={`w-full h-2 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} rounded-full overflow-hidden`}
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${range.color} progress-bar`}
                      style={
                        {
                          '--target-width': `${range.value}%`,
                          animationDelay: `${index * 300}ms`,
                        } as React.CSSProperties
                      }
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div
              className={`mt-4 p-3 ${theme === 'light' ? 'bg-gray-100/80' : 'bg-gray-700/50'} rounded-lg`}
            >
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                <span className='text-blue-400 font-medium'>
                  Average: {platformStats.averageCompletionTime.toFixed(1)} min
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Circular Progress Charts */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <CircularProgressCard
            title='Completion Rate'
            value={platformStats.completionRate * 100}
            color='green'
            icon='🎯'
            suffix='%'
          />
          <CircularProgressCard
            title='Feedback Rate'
            value={platformStats.feedbackRate * 100}
            color='purple'
            icon='📊'
            suffix='%'
          />
          <CircularProgressCard
            title='User Retention'
            value={85} // Placeholder - would use real data
            color='blue'
            icon='👥'
            suffix='%'
          />
          <CircularProgressCard
            title='Satisfaction'
            value={(platformStats.averageRating / 5) * 100}
            color='yellow'
            icon='😊'
            suffix='%'
          />
        </div>
      </div>

      {/* Top Performing Users */}
      <div className={themeClasses.container}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Top Performing Users</h2>

        <div className='space-y-3'>
          {userEngagement.topPerformingUsers.slice(0, 5).map((user, index) => (
            <div
              key={user.userId}
              className={`flex items-center justify-between p-3 ${themeClasses.card}`}
            >
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-sm font-bold text-black'>
                  {index + 1}
                </div>
                <div>
                  <p className={`${themeClasses.text} font-medium`}>{user.displayName}</p>
                  {/* <p className={`${themeClasses.textMuted} text-sm`}>Level {user.level}</p> */}
                </div>
              </div>
              <div className='text-right'>
                <p className={`${themeClasses.text} font-medium`}>
                  {user.totalPoints.toLocaleString()} pts /{(user.experience || 0).toLocaleString()}{' '}
                  XP
                </p>
                <p className={`${themeClasses.textMuted} text-sm`}>
                  {user.demosCompleted} demos, {user.badgesEarned} badges
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const { theme } = useTheme();

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
  };

  const themeClasses =
    theme === 'light'
      ? {
          container:
            'p-4 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg hover:from-gray-50 hover:to-gray-100 transition-colors',
          text: 'text-gray-800',
          textSecondary: 'text-gray-600',
        }
      : {
          container:
            'p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:from-slate-700/60 hover:to-slate-800/60 transition-colors',
          text: 'text-white',
          textSecondary: 'text-gray-300',
        };

  return (
    <div className={themeClasses.container}>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-2xl'>{icon}</span>
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClasses[color]}`}></div>
      </div>
      <p className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{value}</p>
      <p className={`text-sm ${themeClasses.textSecondary}`}>{title}</p>
    </div>
  );
};

interface CircularProgressCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  icon: string;
  suffix?: string;
}

const CircularProgressCard: React.FC<CircularProgressCardProps> = ({
  title,
  value,
  color,
  icon,
  suffix = '',
}) => {
  const { theme } = useTheme();

  const colorClasses = {
    blue: 'stroke-blue-400',
    green: 'stroke-green-400',
    purple: 'stroke-purple-400',
    yellow: 'stroke-yellow-400',
    red: 'stroke-red-400',
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div
      className={`p-4 ${theme === 'light' ? 'bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-xl border border-gray-200/30 hover:from-gray-50 hover:to-gray-100 shadow-lg' : 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-xl border border-white/20 hover:from-slate-700/60 hover:to-slate-800/60 shadow-lg'} transition-colors`}
    >
      <div className='flex flex-col items-center'>
        <div className='relative w-20 h-20 mb-3'>
          <svg className='w-20 h-20 transform -rotate-90' viewBox='0 0 100 100'>
            {/* Background circle */}
            <circle
              cx='50'
              cy='50'
              r='45'
              stroke='currentColor'
              strokeWidth='8'
              fill='none'
              className={theme === 'light' ? 'text-gray-300' : 'text-gray-700'}
            />
            {/* Progress circle */}
            <circle
              cx='50'
              cy='50'
              r='45'
              stroke='currentColor'
              strokeWidth='8'
              fill='none'
              strokeLinecap='round'
              className={colorClasses[color]}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out',
                animation: 'progressAnimation 1.5s ease-in-out',
              }}
            />
          </svg>
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-lg'>{icon}</span>
          </div>
        </div>
        <div className='text-center'>
          <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            {value.toFixed(1)}
            {suffix}
          </p>
          <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
            {title}
          </p>
        </div>
      </div>
    </div>
  );
};
