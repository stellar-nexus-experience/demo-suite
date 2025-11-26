// Analytics service for fetching and processing analytics data
import {
  accountService,
  demoStatsService,
  mandatoryFeedbackService,
} from '@/lib/firebase/firebase-service';
import {
  PlatformStats,
  AccountAnalytics,
  FeedbackAnalytics,
  DemoAnalytics,
  UserEngagementMetrics,
  AnalyticsFilters,
  AnalyticsTimeRange,
  AnalyticsDashboard,
} from '../types';

export class AnalyticsService {
  // Get platform-wide statistics
  static async getPlatformStats(filters?: AnalyticsFilters): Promise<PlatformStats> {
    try {
      // Get all accounts
      const accounts = await this.getAllAccounts();

      // Get all demo stats
      const demoStats = await demoStatsService.getAllDemoStats();

      // Get all feedback
      const allFeedback = await this.getAllFeedback();

      // Calculate totals
      const totalUsers = accounts.length;
      const totalAccounts = accounts.length;
      const totalDemosCompleted = accounts.reduce((sum, account) => {
        const demosCompleted = Array.isArray(account.demosCompleted)
          ? account.demosCompleted
          : Object.values(account.demosCompleted || {});
        return sum + demosCompleted.length;
      }, 0);

      const totalFeedback = allFeedback.length;
      const totalBadgesEarned = accounts.reduce((sum, account) => {
        const badgesEarned = Array.isArray(account.badgesEarned)
          ? account.badgesEarned
          : Object.values(account.badgesEarned || {});
        return sum + badgesEarned.length;
      }, 0);

      const totalPointsEarned = accounts.reduce((sum, account) => sum + account.totalPoints, 0);

      // Calculate averages
      const averageRating =
        allFeedback.length > 0
          ? allFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / allFeedback.length
          : 0;

      const averageCompletionTime =
        allFeedback.length > 0
          ? allFeedback.reduce((sum, feedback) => sum + feedback.completionTime, 0) /
            allFeedback.length
          : 0;

      // Calculate active users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsersLast30Days = accounts.filter(
        account => account.lastLoginAt && account.lastLoginAt >= thirtyDaysAgo
      ).length;

      // Calculate new users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newUsersLast7Days = accounts.filter(
        account => account.createdAt && account.createdAt >= sevenDaysAgo
      ).length;

      // Calculate rates
      const completionRate = totalUsers > 0 ? totalDemosCompleted / totalUsers : 0;
      const feedbackRate = totalDemosCompleted > 0 ? totalFeedback / totalDemosCompleted : 0;

      return {
        totalUsers,
        totalAccounts,
        totalDemosCompleted,
        totalFeedback,
        totalBadgesEarned,
        totalPointsEarned,
        averageRating,
        averageCompletionTime,
        activeUsersLast30Days,
        newUsersLast7Days,
        completionRate,
        feedbackRate,
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  }

  // Get account analytics
  static async getAccountAnalytics(filters?: AnalyticsFilters): Promise<AccountAnalytics[]> {
    try {
      const accounts = await this.getAllAccounts();
      const allFeedback = await this.getAllFeedback();

      const accountAnalytics: AccountAnalytics[] = [];

      for (const account of accounts) {
        // Get feedback for this user
        const userFeedback = allFeedback.filter(
          feedback => feedback.userId === account.walletAddress
        );

        // Calculate metrics
        const totalFeedback = userFeedback.length;
        const averageRating =
          userFeedback.length > 0
            ? userFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / userFeedback.length
            : 0;

        const completionTime =
          userFeedback.length > 0
            ? userFeedback.reduce((sum, feedback) => sum + feedback.completionTime, 0) /
              userFeedback.length
            : 0;

        // Calculate engagement score (0-100)
        const demosCompleted = Array.isArray(account.demosCompleted)
          ? account.demosCompleted
          : (Object.values(account.demosCompleted || {}) as string[]);
        const badgesEarned = Array.isArray(account.badgesEarned)
          ? account.badgesEarned
          : (Object.values(account.badgesEarned || {}) as string[]);

        const engagementScore = Math.min(
          100,
          demosCompleted.length * 20 +
            badgesEarned.length * 10 +
            totalFeedback * 5 +
            account.level * 2
        );

        // Check if user is active (logged in within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const isActive = account.lastLoginAt && account.lastLoginAt >= sevenDaysAgo;

        // Calculate days since last login
        const daysSinceLastLogin = account.lastLoginAt
          ? Math.floor(
              (new Date().getTime() - account.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0;

        accountAnalytics.push({
          userId: account.walletAddress,
          displayName: account.displayName,
          walletAddress: account.walletAddress,
          level: account.level,
          experience: account.experience,
          totalPoints: account.totalPoints,
          demosCompleted: demosCompleted,
          badgesEarned: badgesEarned,
          clappedDemos: Array.isArray(account.clappedDemos)
            ? account.clappedDemos
            : (Object.values(account.clappedDemos || {}) as string[]),
          createdAt: account.createdAt,
          lastLoginAt: account.lastLoginAt,
          totalFeedback,
          averageRating,
          completionTime,
          engagementScore,
          isActive,
          daysSinceLastLogin,
        });
      }

      return accountAnalytics;
    } catch (error) {
      console.error('Error fetching account analytics:', error);
      throw error;
    }
  }

  // Get feedback analytics
  static async getFeedbackAnalytics(filters?: AnalyticsFilters): Promise<FeedbackAnalytics> {
    try {
      const allFeedback = await this.getAllFeedback();

      // Calculate basic stats
      const totalFeedback = allFeedback.length;
      const averageRating =
        allFeedback.length > 0
          ? allFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) / allFeedback.length
          : 0;

      const averageCompletionTime =
        allFeedback.length > 0
          ? allFeedback.reduce((sum, feedback) => sum + feedback.completionTime, 0) /
            allFeedback.length
          : 0;

      // Calculate difficulty distribution
      const difficultyDistribution = {
        easy: allFeedback.filter(f => f.difficulty === 'easy').length,
        medium: allFeedback.filter(f => f.difficulty === 'medium').length,
        hard: allFeedback.filter(f => f.difficulty === 'hard').length,
      };

      // Calculate recommendation rate
      const recommendations = allFeedback.filter(f => f.wouldRecommend).length;
      const recommendationRate =
        allFeedback.length > 0 ? (recommendations / allFeedback.length) * 100 : 0;

      // Calculate rating distribution
      const ratingDistribution = {
        1: allFeedback.filter(f => f.rating === 1).length,
        2: allFeedback.filter(f => f.rating === 2).length,
        3: allFeedback.filter(f => f.rating === 3).length,
        4: allFeedback.filter(f => f.rating === 4).length,
        5: allFeedback.filter(f => f.rating === 5).length,
      };

      // Group feedback by demo
      const feedbackByDemo: { [demoId: string]: any } = {};
      allFeedback.forEach(feedback => {
        if (!feedbackByDemo[feedback.demoId]) {
          feedbackByDemo[feedback.demoId] = {
            demoName: feedback.demoName,
            totalFeedback: 0,
            totalRating: 0,
            totalCompletionTime: 0,
            recommendations: 0,
          };
        }

        feedbackByDemo[feedback.demoId].totalFeedback++;
        feedbackByDemo[feedback.demoId].totalRating += feedback.rating;
        feedbackByDemo[feedback.demoId].totalCompletionTime += feedback.completionTime;
        if (feedback.wouldRecommend) {
          feedbackByDemo[feedback.demoId].recommendations++;
        }
      });

      // Calculate averages for each demo
      Object.keys(feedbackByDemo).forEach(demoId => {
        const demo = feedbackByDemo[demoId];
        demo.averageRating = demo.totalRating / demo.totalFeedback;
        demo.averageCompletionTime = demo.totalCompletionTime / demo.totalFeedback;
        demo.recommendationRate = (demo.recommendations / demo.totalFeedback) * 100;
      });

      // Get recent feedback (last 50)
      const recentFeedback = allFeedback
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50);

      // Calculate feedback trends (last 30 days)
      const feedbackTrends = this.calculateFeedbackTrends(allFeedback);

      return {
        totalFeedback,
        averageRating,
        averageCompletionTime,
        difficultyDistribution,
        recommendationRate,
        ratingDistribution,
        feedbackByDemo,
        recentFeedback,
        feedbackTrends,
      };
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
      throw error;
    }
  }

  // Get demo analytics
  static async getDemoAnalytics(filters?: AnalyticsFilters): Promise<DemoAnalytics[]> {
    try {
      const demoStats = await demoStatsService.getAllDemoStats();
      const allFeedback = await this.getAllFeedback();
      const accounts = await this.getAllAccounts();

      const demoAnalytics: DemoAnalytics[] = [];

      for (const demoStat of demoStats) {
        // Get feedback for this demo
        const demoFeedback = allFeedback.filter(feedback => feedback.demoId === demoStat.demoId);

        // Calculate completion rate
        const totalUsers = accounts.length;
        const completionRate = totalUsers > 0 ? (demoStat.totalCompletions / totalUsers) * 100 : 0;

        // Calculate clap rate
        const clapRate =
          demoStat.totalCompletions > 0
            ? (demoStat.totalClaps / demoStat.totalCompletions) * 100
            : 0;

        // Calculate difficulty breakdown
        const difficultyBreakdown = {
          easy: demoFeedback.filter(f => f.difficulty === 'easy').length,
          medium: demoFeedback.filter(f => f.difficulty === 'medium').length,
          hard: demoFeedback.filter(f => f.difficulty === 'hard').length,
        };

        // Calculate rating breakdown
        const ratingBreakdown = {
          1: demoFeedback.filter(f => f.rating === 1).length,
          2: demoFeedback.filter(f => f.rating === 2).length,
          3: demoFeedback.filter(f => f.rating === 3).length,
          4: demoFeedback.filter(f => f.rating === 4).length,
          5: demoFeedback.filter(f => f.rating === 5).length,
        };

        // Calculate completion trends
        const completionTrends = this.calculateCompletionTrends(demoFeedback);

        // Get top users for this demo
        const topUsers = demoFeedback
          .sort((a, b) => a.completionTime - b.completionTime)
          .slice(0, 10)
          .map(feedback => {
            const account = accounts.find(acc => acc.walletAddress === feedback.userId);
            return {
              userId: feedback.userId,
              displayName: account?.displayName || 'Anonymous',
              completionTime: feedback.completionTime,
              rating: feedback.rating,
            };
          });

        demoAnalytics.push({
          demoId: demoStat.demoId,
          demoName: demoStat.demoName,
          totalCompletions: demoStat.totalCompletions,
          totalClaps: demoStat.totalClaps,
          totalRatings: demoStat.totalRatings,
          averageRating: demoStat.averageRating,
          averageCompletionTime: demoStat.averageCompletionTime,
          completionRate,
          clapRate,
          feedbackCount: demoFeedback.length,
          difficultyBreakdown,
          ratingBreakdown,
          completionTrends,
          topUsers,
        });
      }

      return demoAnalytics;
    } catch (error) {
      console.error('Error fetching demo analytics:', error);
      throw error;
    }
  }

  // Get user engagement metrics
  static async getUserEngagementMetrics(
    filters?: AnalyticsFilters
  ): Promise<UserEngagementMetrics> {
    try {
      const accounts = await this.getAllAccounts();
      const allFeedback = await this.getAllFeedback();

      const totalUsers = accounts.length;

      // Calculate active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = accounts.filter(
        account => account.lastLoginAt && account.lastLoginAt >= sevenDaysAgo
      ).length;

      // Calculate new users (last 7 days)
      const newUsers = accounts.filter(
        account => account.createdAt && account.createdAt >= sevenDaysAgo
      ).length;

      // Calculate returning users (active but not new)
      const returningUsers = activeUsers - newUsers;

      // Calculate averages
      const averageDemosPerUser =
        totalUsers > 0
          ? accounts.reduce((sum, account) => {
              const demosCompleted = Array.isArray(account.demosCompleted)
                ? account.demosCompleted
                : Object.values(account.demosCompleted || {});
              return sum + demosCompleted.length;
            }, 0) / totalUsers
          : 0;

      const averageFeedbackPerUser = totalUsers > 0 ? allFeedback.length / totalUsers : 0;

      // Calculate user retention rate (users who completed at least one demo)
      const usersWithCompletions = accounts.filter(account => {
        const demosCompleted = Array.isArray(account.demosCompleted)
          ? account.demosCompleted
          : Object.values(account.demosCompleted || {});
        return demosCompleted.length > 0;
      }).length;

      const userRetentionRate = totalUsers > 0 ? (usersWithCompletions / totalUsers) * 100 : 0;

      // Calculate overall engagement score
      const totalEngagement = accounts.reduce((sum, account) => {
        const demosCompleted = Array.isArray(account.demosCompleted)
          ? account.demosCompleted
          : Object.values(account.demosCompleted || {});
        const badgesEarned = Array.isArray(account.badgesEarned)
          ? account.badgesEarned
          : Object.values(account.badgesEarned || {});
        const userFeedback = allFeedback.filter(f => f.userId === account.walletAddress);

        return (
          sum + demosCompleted.length * 20 + badgesEarned.length * 10 + userFeedback.length * 5
        );
      }, 0);

      const engagementScore = totalUsers > 0 ? totalEngagement / totalUsers : 0;

      // Get top performing users
      const topPerformingUsers = accounts
        .map(account => {
          const demosCompleted = Array.isArray(account.demosCompleted)
            ? account.demosCompleted
            : Object.values(account.demosCompleted || {});
          const badgesEarned = Array.isArray(account.badgesEarned)
            ? account.badgesEarned
            : Object.values(account.badgesEarned || {});

          return {
            userId: account.walletAddress,
            displayName: account.displayName,
            level: account.level,
            experience: account.experience,
            totalPoints: account.totalPoints,
            demosCompleted: demosCompleted.length,
            badgesEarned: badgesEarned.length,
          };
        })
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10);

      return {
        totalUsers,
        activeUsers,
        newUsers,
        returningUsers,
        averageSessionDuration: 0, // Would need session tracking
        averageDemosPerUser,
        averageFeedbackPerUser,
        userRetentionRate,
        engagementScore,
        topPerformingUsers,
      };
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      throw error;
    }
  }

  // Get complete analytics dashboard
  static async getAnalyticsDashboard(filters?: AnalyticsFilters): Promise<AnalyticsDashboard> {
    try {
      const [platformStats, userEngagement, feedbackAnalytics, demoAnalytics] = await Promise.all([
        this.getPlatformStats(filters),
        this.getUserEngagementMetrics(filters),
        this.getFeedbackAnalytics(filters),
        this.getDemoAnalytics(filters),
      ]);

      // Get recent activity
      const recentActivity = await this.getRecentActivity();

      return {
        platformStats,
        userEngagement,
        feedbackAnalytics,
        demoAnalytics,
        recentActivity,
      };
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private static async getAllAccounts() {
    try {
      return await accountService.getAllAccounts();
    } catch (error) {
      console.error('Error fetching all accounts:', error);
      return [];
    }
  }

  private static async getAllFeedback() {
    try {
      return await mandatoryFeedbackService.getRecentFeedback(1000); // Get last 1000 feedback entries
    } catch (error) {
      console.error('Error fetching all feedback:', error);
      return [];
    }
  }

  private static calculateFeedbackTrends(feedback: any[]): any[] {
    const trends: any[] = [];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayFeedback = feedback.filter(f => {
        const feedbackDate = new Date(f.timestamp);
        return feedbackDate.toISOString().split('T')[0] === dateStr;
      });

      trends.unshift({
        date: dateStr,
        count: dayFeedback.length,
        averageRating:
          dayFeedback.length > 0
            ? dayFeedback.reduce((sum, f) => sum + f.rating, 0) / dayFeedback.length
            : 0,
      });
    }

    return trends;
  }

  private static calculateCompletionTrends(feedback: any[]): any[] {
    const trends: any[] = [];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCompletions = feedback.filter(f => {
        const feedbackDate = new Date(f.timestamp);
        return feedbackDate.toISOString().split('T')[0] === dateStr;
      }).length;

      trends.unshift({
        date: dateStr,
        completions: dayCompletions,
      });
    }

    return trends;
  }

  private static async getRecentActivity() {
    // This would combine recent demo completions, feedback submissions, badge earnings, etc.
    // For now, return empty array
    return [];
  }
}
