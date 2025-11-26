# Analytics System

A comprehensive analytics system for tracking platform performance, user
engagement, and mandatory feedback statistics.

## Overview

The analytics system provides insights into:

- Platform-wide statistics and performance metrics
- User account analytics and engagement tracking
- Mandatory feedback analysis and trends
- Demo completion and performance metrics

## Architecture

### Components

1. **AnalyticsDashboard** - Main dashboard with tabbed navigation
2. **PlatformAnalytics** - Platform-wide statistics and overview
3. **AccountAnalytics** - User account insights and management
4. **FeedbackAnalytics** - Mandatory feedback analysis and trends

### Services

- **AnalyticsService** - Core service for fetching and processing analytics data
- **AccountService** - Extended with `getAllAccounts()` for analytics
- **MandatoryFeedbackService** - Feedback data retrieval
- **DemoStatsService** - Demo performance metrics

### Types

Comprehensive TypeScript interfaces for:

- Platform statistics
- Account analytics
- Feedback analytics
- Demo analytics
- User engagement metrics

## Features

### Platform Analytics

- Total users and accounts
- Demo completion statistics
- Badge and points tracking
- User engagement metrics
- Performance indicators

### Account Analytics

- User account management
- Engagement scoring
- Activity tracking
- Sorting and filtering
- Search functionality

### Feedback Analytics

- Rating distribution
- Difficulty analysis
- Demo-specific feedback
- Recent feedback display
- Recommendation rates

### Navigation

- Tabbed interface
- Responsive design
- Mobile-friendly navigation
- Header integration

## Usage

### Accessing Analytics

Navigate to `/analytics` or click the "Analytics" link in the header navigation.

### Dashboard Views

- **Overview** - Platform-wide statistics
- **Users** - Account analytics and management
- **Feedback** - Mandatory feedback analysis
- **Demos** - Demo performance metrics (coming soon)
- **Engagement** - User engagement insights (coming soon)

### Data Sources

- Firebase Firestore collections
- Mandatory feedback collection
- Account data
- Demo statistics
- Transaction history

## Implementation Details

### Data Flow

1. Analytics components request data from AnalyticsService
2. AnalyticsService aggregates data from multiple Firebase services
3. Data is processed and formatted for display
4. Components render analytics with loading and error states

### Performance Considerations

- Lazy loading of analytics data
- Efficient data aggregation
- Caching strategies (future enhancement)
- Pagination for large datasets

### Security

- User authentication required
- Admin-level access for sensitive analytics
- Data privacy compliance
- Secure API endpoints

## Future Enhancements

### Planned Features

- Real-time analytics updates
- Advanced filtering and search
- Export functionality
- Custom date ranges
- Chart visualizations
- Automated reporting

### Technical Improvements

- Data caching
- Performance optimization
- Error handling improvements
- Mobile responsiveness
- Accessibility enhancements

## API Reference

### AnalyticsService Methods

```typescript
// Get platform statistics
AnalyticsService.getPlatformStats(filters?: AnalyticsFilters): Promise<PlatformStats>

// Get account analytics
AnalyticsService.getAccountAnalytics(filters?: AnalyticsFilters): Promise<AccountAnalytics[]>

// Get feedback analytics
AnalyticsService.getFeedbackAnalytics(filters?: AnalyticsFilters): Promise<FeedbackAnalytics>

// Get demo analytics
AnalyticsService.getDemoAnalytics(filters?: AnalyticsFilters): Promise<DemoAnalytics[]>

// Get user engagement metrics
AnalyticsService.getUserEngagementMetrics(filters?: AnalyticsFilters): Promise<UserEngagementMetrics>

// Get complete dashboard
AnalyticsService.getAnalyticsDashboard(filters?: AnalyticsFilters): Promise<AnalyticsDashboard>
```

### Component Props

```typescript
// AnalyticsDashboard
interface AnalyticsDashboardProps {
  className?: string;
}

// PlatformAnalytics
interface PlatformAnalyticsProps {
  className?: string;
}

// AccountAnalytics
interface AccountAnalyticsProps {
  className?: string;
}

// FeedbackAnalytics
interface FeedbackAnalyticsProps {
  className?: string;
}
```

## Configuration

### Environment Variables

No additional environment variables required. Uses existing Firebase
configuration.

### Dependencies

- React 18+
- TypeScript
- Firebase SDK
- Tailwind CSS

## Troubleshooting

### Common Issues

1. **No data displayed** - Check Firebase connection and permissions
2. **Slow loading** - Consider implementing data caching
3. **Permission errors** - Verify user authentication and admin access

### Debug Mode

Enable debug logging by setting
`localStorage.setItem('analytics-debug', 'true')` in browser console.

## Contributing

### Development Setup

1. Ensure Firebase is properly configured
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Navigate to `/analytics` to test

### Code Style

- Follow existing TypeScript conventions
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for async operations

### Testing

- Test with different user roles
- Verify responsive design
- Check data accuracy
- Validate error handling

## License

Part of the Trustless Work platform. See main project license for details.
