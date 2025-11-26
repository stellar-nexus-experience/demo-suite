'use client';

import React, { useState, useEffect } from 'react';
import { FeedbackAnalytics as FeedbackAnalyticsType } from '../types';
import { AnalyticsService } from '../services/analyticsService';
import { useTheme } from '@/contexts/ui/ThemeContext';

interface FeedbackAnalyticsProps {
  className?: string;
}

export const FeedbackAnalytics: React.FC<FeedbackAnalyticsProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const [feedbackData, setFeedbackData] = useState<FeedbackAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme classes
  const getThemeClasses = () => {
    if (theme === 'light') {
      return {
        container:
          'bg-gradient-to-br from-white to-gray-50 border-gray-200/50 text-gray-800 backdrop-blur-sm rounded-2xl shadow-2xl',
        card: 'bg-gradient-to-br from-white to-gray-50 border-gray-200/50 hover:from-gray-50 hover:to-gray-100 backdrop-blur-sm rounded-xl shadow-lg',
        text: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
      };
    } else {
      return {
        container:
          'bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white backdrop-blur-sm rounded-2xl shadow-2xl',
        card: 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-white/20 hover:from-slate-700/60 hover:to-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
      };
    }
  };

  const themeClasses = getThemeClasses();
  const [selectedDemo, setSelectedDemo] = useState<string>('all');

  useEffect(() => {
    loadFeedbackAnalytics();
  }, []);

  const loadFeedbackAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await AnalyticsService.getFeedbackAnalytics();
      setFeedbackData(data);
    } catch (err) {
      setError('Failed to load feedback analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${themeClasses.container} ${className}`}>
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
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${themeClasses.container} ${className}`}>
        <div className='text-center'>
          <p className='text-red-500 mb-4'>{error}</p>
          <button
            onClick={loadFeedbackAnalytics}
            className='px-4 py-2 bg-blue-500/20 border border-blue-400/50 text-blue-600 rounded-lg hover:bg-blue-500/30'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className={`p-6 ${themeClasses.container} ${className}`}>
        <p className={themeClasses.textMuted}>No feedback data available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className={`p-6 ${themeClasses.container}`}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Feedback Overview</h2>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <StatCard
            title='Total Feedback'
            value={feedbackData.totalFeedback.toLocaleString()}
            icon='💬'
            color='blue'
            theme={theme}
          />
          <StatCard
            title='Average Rating'
            value={`${feedbackData.averageRating.toFixed(1)}/5`}
            icon='⭐'
            color='yellow'
            theme={theme}
          />
          <StatCard
            title='Avg Completion Time'
            value={`${feedbackData.averageCompletionTime.toFixed(1)} min`}
            icon='⏱️'
            color='green'
            theme={theme}
          />
          <StatCard
            title='Recommendation Rate'
            value={`${feedbackData.recommendationRate.toFixed(1)}%`}
            icon='👍'
            color='purple'
            theme={theme}
          />
        </div>
      </div>

      {/* Rating Distribution */}
      <div className={`p-6 ${themeClasses.container}`}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Rating Distribution</h2>

        <div className='space-y-3'>
          {Object.entries(feedbackData.ratingDistribution).map(([rating, count]) => {
            const percentage =
              feedbackData.totalFeedback > 0 ? (count / feedbackData.totalFeedback) * 100 : 0;

            return (
              <div key={rating} className='flex items-center space-x-4'>
                <div className='w-8 text-center'>
                  <span className={`${themeClasses.text} font-medium`}>{rating}</span>
                  <span className='text-yellow-400'>⭐</span>
                </div>
                <div className='flex-1'>
                  <div
                    className={`w-full h-4 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} rounded-full overflow-hidden`}
                  >
                    <div
                      className='h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full'
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className='w-16 text-right'>
                  <span className={`${themeClasses.text} font-medium`}>{count}</span>
                  <span className={`${themeClasses.textMuted} text-sm ml-1`}>
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className={`p-6 ${themeClasses.container}`}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
          Difficulty Distribution
        </h2>

        <div className='grid grid-cols-3 gap-4'>
          {Object.entries(feedbackData.difficultyDistribution).map(([difficulty, count]) => {
            const percentage =
              feedbackData.totalFeedback > 0 ? (count / feedbackData.totalFeedback) * 100 : 0;

            const colorClasses = {
              easy: 'from-green-400 to-green-600',
              medium: 'from-yellow-400 to-yellow-600',
              hard: 'from-red-400 to-red-600',
            };

            return (
              <div key={difficulty} className={`p-4 ${themeClasses.card}`}>
                <div className='text-center'>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>{count}</p>
                  <p className={`text-sm ${themeClasses.textMuted} capitalize`}>{difficulty}</p>
                  <div
                    className={`mt-2 w-full h-2 ${theme === 'light' ? 'bg-gray-200' : 'bg-white/10'} rounded-full overflow-hidden`}
                  >
                    <div
                      className={`h-full bg-gradient-to-r ${colorClasses[difficulty as keyof typeof colorClasses]} rounded-full`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback by Demo */}
      <div className={`p-6 ${themeClasses.container}`}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Feedback by Demo</h2>

        <div className='space-y-4'>
          {Object.entries(feedbackData.feedbackByDemo).map(([demoId, demoData]) => (
            <div
              key={demoId}
              className={`p-4 ${themeClasses.card} backdrop-blur-sm rounded border`}
            >
              <div className='flex items-center justify-between mb-3'>
                <h3 className={`text-lg font-medium ${themeClasses.text}`}>{demoData.demoName}</h3>
                <span className={`text-sm ${themeClasses.textMuted}`}>
                  {demoData.totalFeedback} feedback
                </span>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-yellow-400'>
                    {demoData.averageRating.toFixed(1)}
                  </p>
                  <p className={`text-sm ${themeClasses.textMuted}`}>Avg Rating</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-green-400'>
                    {demoData.averageCompletionTime.toFixed(1)}
                  </p>
                  <p className={`text-sm ${themeClasses.textMuted}`}>Avg Time (min)</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-400'>
                    {demoData.recommendationRate.toFixed(1)}%
                  </p>
                  <p className={`text-sm ${themeClasses.textMuted}`}>Recommend</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-purple-400'>{demoData.totalFeedback}</p>
                  <p className={`text-sm ${themeClasses.textMuted}`}>Total</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Feedback */}
      <div className={`p-6 ${themeClasses.container}`}>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Recent Feedback</h2>

        <div className='space-y-3'>
          {feedbackData.recentFeedback.slice(0, 10).map(feedback => (
            <div
              key={feedback.id}
              className={`p-4 ${themeClasses.card} backdrop-blur-sm rounded border`}
            >
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <p className={`${themeClasses.text} font-medium`}>{feedback.demoName}</p>
                  <p className={`text-sm ${themeClasses.textMuted}`}>
                    {feedback.userId.slice(0, 8)}...{feedback.userId.slice(-8)}
                  </p>
                </div>
                <div className='text-right'>
                  <div className='flex items-center space-x-1'>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < feedback.rating ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <p className={`text-xs ${themeClasses.textMuted}`}>
                    {new Date(feedback.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className={`${themeClasses.textSecondary} text-sm mb-2`}>{feedback.feedback}</p>

              <div className={`flex items-center space-x-4 text-xs ${themeClasses.textMuted}`}>
                <span>Difficulty: {feedback.difficulty}</span>
                <span>Time: {feedback.completionTime} min</span>
                <span className={feedback.wouldRecommend ? 'text-green-400' : 'text-red-400'}>
                  {feedback.wouldRecommend ? '👍 Recommends' : '👎 Not recommended'}
                </span>
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
  theme: 'light' | 'dark';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, theme }) => {
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
            'bg-gradient-to-br from-white to-gray-50 border-gray-200/50 hover:from-gray-50 hover:to-gray-100 backdrop-blur-sm rounded-xl shadow-lg',
          text: 'text-gray-800',
          textSecondary: 'text-gray-600',
        }
      : {
          container:
            'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-white/20 hover:from-slate-700/60 hover:to-slate-800/60 backdrop-blur-sm rounded-xl shadow-lg',
          text: 'text-white',
          textSecondary: 'text-gray-300',
        };

  return (
    <div className={`p-4 ${themeClasses.container} transition-colors`}>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-2xl'>{icon}</span>
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClasses[color]}`}></div>
      </div>
      <p className={`text-2xl font-bold ${themeClasses.text} mb-1`}>{value}</p>
      <p className={`text-sm ${themeClasses.textSecondary}`}>{title}</p>
    </div>
  );
};
