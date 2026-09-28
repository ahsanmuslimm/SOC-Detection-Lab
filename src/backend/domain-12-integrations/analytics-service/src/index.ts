/**
 * Analytics Service - Public API
 */

export { AnalyticsService, createAnalyticsService } from './main';

export type {
  IAnalyticsEvent,
  IEventAggregation,
  IMetricDefinition,
  IMetricDataPoint,
  IAnalyticsQuery,
  IAnalyticsFilter,
  IOrderBy,
  ITimeRange,
  IAnalyticsResult,
  IDashboard,
  IWidget,
  IReport,
  IReportSection,
  IReportSchedule,
  IAnalyticsTrend,
  IFunnelAnalysis,
  IFunnelStep,
  ICohortAnalysis,
  ICohort,
  IHeatmapData,
  IAnalyticsAlert,
  IAlertNotification,
  IAnalyticsSession,
  IUserJourney,
  IJourneyStep,
  IRealTimeMetric,
  IMetricComparison,
  IAnalyticsServiceConfig,
  AnalyticsListener,
  IAnalyticsEventLog,
  IAnomalyDetectionResult,
  IForecast,
  IAnalyticsHealthCheck,
  IAnalyticsStatistics,
} from './types';
