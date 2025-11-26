// Analytics data types and interfaces

export interface PlatformStats {
  totalUsers: number;
  totalAccounts: number;
  totalDemosCompleted: number;
  totalFeedback: number;
  totalBadgesEarned: number;
  totalPointsEarned: number;
  averageRating: number;
  averageCompletionTime: number;
  activeUsersLast30Days: number;
  newUsersLast7Days: number;
  completionRate: number;
  feedbackRate: number;
}

export interface AccountAnalytics {
  userId: string;
  displayName: string;
  walletAddress: string;
  level: number;
  experience: number;
  totalPoints: number;
  demosCompleted: string[];
  badgesEarned: string[];
  clappedDemos: string[];
  createdAt: Date;
  lastLoginAt: Date;
  totalFeedback: number;
  averageRating: number;
  completionTime: number;
  engagementScore: number;
  isActive: boolean;
  daysSinceLastLogin: number;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageRating: number;
  averageCompletionTime: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  recommendationRate: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  feedbackByDemo: {
    [demoId: string]: {
      demoName: string;
      totalFeedback: number;
      averageRating: number;
      averageCompletionTime: number;
      recommendationRate: number;
    };
  };
  recentFeedback: {
    id: string;
    userId: string;
    demoId: string;
    demoName: string;
    rating: number;
    feedback: string;
    difficulty: string;
    wouldRecommend: boolean;
    completionTime: number;
    timestamp: Date;
  }[];
  feedbackTrends: {
    date: string;
    count: number;
    averageRating: number;
  }[];
}

export interface DemoAnalytics {
  demoId: string;
  demoName: string;
  totalCompletions: number;
  totalClaps: number;
  totalRatings: number;
  averageRating: number;
  averageCompletionTime: number;
  completionRate: number;
  clapRate: number;
  feedbackCount: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  completionTrends: {
    date: string;
    completions: number;
  }[];
  topUsers: {
    userId: string;
    displayName: string;
    completionTime: number;
    rating: number;
  }[];
}

export interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  averageDemosPerUser: number;
  averageFeedbackPerUser: number;
  userRetentionRate: number;
  engagementScore: number;
  topPerformingUsers: {
    userId: string;
    displayName: string;
    level: number;
    experience: number;
    totalPoints: number;
    demosCompleted: number;
    badgesEarned: number;
  }[];
}

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  demoId?: string;
  userId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number;
  hasFeedback?: boolean;
  isActive?: boolean;
}

export interface AnalyticsTimeRange {
  label: string;
  value: '7d' | '30d' | '90d' | '1y' | 'all';
  startDate: Date;
  endDate: Date;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsDashboard {
  platformStats: PlatformStats;
  userEngagement: UserEngagementMetrics;
  feedbackAnalytics: FeedbackAnalytics;
  demoAnalytics: DemoAnalytics[];
  recentActivity: {
    type: 'demo_completion' | 'feedback_submission' | 'badge_earned' | 'user_registration';
    userId: string;
    displayName: string;
    description: string;
    timestamp: Date;
    metadata?: any;
  }[];
}

// Export types for use in components
export type AnalyticsView = 'overview' | 'users' | 'feedback' | 'demos' | 'engagement';
export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'all';
export type SortField =
  | 'createdAt'
  | 'lastLoginAt'
  | 'totalPoints'
  | 'level'
  | 'demosCompleted'
  | 'rating'
  | 'displayName';
export type SortOrder = 'asc' | 'desc';
