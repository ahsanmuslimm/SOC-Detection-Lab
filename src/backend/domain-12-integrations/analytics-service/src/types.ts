/**
 * Analytics Service - Type Definitions
 * Real-time analytics, aggregations, and reporting
 */

/**
 * Analytics event
 */
export interface IAnalyticsEvent {
  eventId: string;
  timestamp: Date;
  source: string;
  category: string;
  action: string;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Event aggregation
 */
export interface IEventAggregation {
  aggregationId: string;
  startTime: Date;
  endTime: Date;
  category: string;
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  eventsByAction: Record<string, number>;
  eventsBySource: Record<string, number>;
  metadata?: Record<string, any>;
}

/**
 * Metric definition
 */
export interface IMetricDefinition {
  metricId: string;
  name: string;
  description?: string;
  category: string;
  type: 'gauge' | 'counter' | 'histogram' | 'summary';
  unit?: string;
  aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count';
  retentionDays: number;
  enabled: boolean;
}

/**
 * Metric data point
 */
export interface IMetricDataPoint {
  pointId: string;
  metricId: string;
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
  tags?: string[];
}

/**
 * Analytics query
 */
export interface IAnalyticsQuery {
  queryId: string;
  name: string;
  description?: string;
  type: 'events' | 'metrics' | 'timeseries' | 'comparison' | 'trend';
  filters: IAnalyticsFilter[];
  groupBy?: string[];
  orderBy?: IOrderBy[];
  limit?: number;
  timeRange: ITimeRange;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Analytics filter
 */
export interface IAnalyticsFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex' | 'between';
  value?: any;
  values?: any[];
}

/**
 * Order by
 */
export interface IOrderBy {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Time range
 */
export interface ITimeRange {
  startTime: Date;
  endTime: Date;
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

/**
 * Analytics result
 */
export interface IAnalyticsResult {
  resultId: string;
  queryId: string;
  data: any[];
  rowCount: number;
  columnCount: number;
  executionTime: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Dashboard
 */
export interface IDashboard {
  dashboardId: string;
  name: string;
  description?: string;
  widgets: IWidget[];
  layout?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  isPublic: boolean;
}

/**
 * Widget
 */
export interface IWidget {
  widgetId: string;
  dashboardId: string;
  type: 'line' | 'bar' | 'pie' | 'table' | 'gauge' | 'heatmap' | 'scatter' | 'card';
  queryId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config?: Record<string, any>;
}

/**
 * Report
 */
export interface IReport {
  reportId: string;
  name: string;
  description?: string;
  type: 'executive' | 'detailed' | 'custom';
  sections: IReportSection[];
  schedule?: IReportSchedule;
  recipients?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Report section
 */
export interface IReportSection {
  sectionId: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'narrative' | 'metric';
  queryId?: string;
  content?: string;
  order: number;
}

/**
 * Report schedule
 */
export interface IReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time: string; // HH:mm format
  timezone?: string;
  enabled: boolean;
}

/**
 * Analytics trend
 */
export interface IAnalyticsTrend {
  trendId: string;
  metric: string;
  period: string;
  previousValue: number;
  currentValue: number;
  change: number;
  changePercentage: number;
  direction: 'up' | 'down' | 'stable';
  timestamp: Date;
}

/**
 * Funnel analysis
 */
export interface IFunnelAnalysis {
  funnelId: string;
  name: string;
  steps: IFunnelStep[];
  totalStarts: number;
  conversionRate: number;
  timestamp: Date;
}

/**
 * Funnel step
 */
export interface IFunnelStep {
  stepId: string;
  name: string;
  order: number;
  count: number;
  dropoff: number;
  conversionRate: number;
}

/**
 * Cohort analysis
 */
export interface ICohortAnalysis {
  cohortId: string;
  name: string;
  cohorts: ICohort[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cohort
 */
export interface ICohort {
  cohortId: string;
  name: string;
  startDate: Date;
  members: number;
  retention: Record<string, number>; // day -> retention %
}

/**
 * Heatmap data
 */
export interface IHeatmapData {
  heatmapId: string;
  metric: string;
  data: Array<{
    x: string;
    y: string;
    value: number;
  }>;
  timestamp: Date;
}

/**
 * Analytics alert
 */
export interface IAnalyticsAlert {
  alertId: string;
  name: string;
  metric: string;
  condition: 'exceeds' | 'below' | 'change' | 'anomaly';
  threshold?: number;
  changeThreshold?: number;
  enabled: boolean;
  recipients: string[];
  createdAt: Date;
  lastTriggered?: Date;
}

/**
 * Alert notification
 */
export interface IAlertNotification {
  notificationId: string;
  alertId: string;
  timestamp: Date;
  value: number;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

/**
 * Analytics session
 */
export interface IAnalyticsSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  eventCount: number;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * User journey
 */
export interface IUserJourney {
  journeyId: string;
  userId: string;
  steps: IJourneyStep[];
  startTime: Date;
  endTime: Date;
  duration: number;
  conversionFlag: boolean;
}

/**
 * Journey step
 */
export interface IJourneyStep {
  stepId: string;
  timestamp: Date;
  action: string;
  category: string;
  data: Record<string, any>;
}

/**
 * Real-time metric
 */
export interface IRealTimeMetric {
  metricId: string;
  name: string;
  currentValue: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  timestamp: Date;
  unit?: string;
}

/**
 * Metric comparison
 */
export interface IMetricComparison {
  comparisonId: string;
  metric1: string;
  metric2: string;
  period1: ITimeRange;
  period2: ITimeRange;
  value1: number;
  value2: number;
  difference: number;
  percentDifference: number;
  timestamp: Date;
}

/**
 * Analytics service configuration
 */
export interface IAnalyticsServiceConfig {
  maxEvents: number;
  maxQueries: number;
  maxDashboards: number;
  eventRetentionDays: number;
  metricRetentionDays: number;
  enableRealTime: boolean;
  enableAnomalyDetection: boolean;
  enableForecasting: boolean;
  enableAudit: boolean;
  maxAuditEntries: number;
  enableMetrics: boolean;
  cleanupIntervalMs: number;
  batchSize: number;
  queryTimeoutMs: number;
}

/**
 * Analytics listener
 */
export type AnalyticsListener = (event: IAnalyticsEventLog) => Promise<void> | void;

/**
 * Analytics event log
 */
export interface IAnalyticsEventLog {
  logId: string;
  timestamp: Date;
  type: 'event-tracked' | 'query-executed' | 'alert-triggered' | 'report-generated' | 'anomaly-detected';
  details?: Record<string, any>;
}

/**
 * Anomaly detection result
 */
export interface IAnomalyDetectionResult {
  anomalyId: string;
  metric: string;
  timestamp: Date;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  explanation?: string;
}

/**
 * Forecast
 */
export interface IForecast {
  forecastId: string;
  metric: string;
  startDate: Date;
  endDate: Date;
  predictions: Array<{
    timestamp: Date;
    value: number;
    confidence: number;
  }>;
  accuracy?: number;
}

/**
 * Analytics health check
 */
export interface IAnalyticsHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  eventCount: number;
  queryQueueSize: number;
  activeQueries: number;
  lastEventTime?: Date;
  processingLatency: number;
}

/**
 * Analytics statistics
 */
export interface IAnalyticsStatistics {
  totalEvents: number;
  totalQueries: number;
  totalDashboards: number;
  averageQueryTime: number;
  eventProcessingRate: number;
  metricsTracked: number;
  dashboardsCreated: number;
  reportsGenerated: number;
}
