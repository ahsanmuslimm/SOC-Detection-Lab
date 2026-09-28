/**
 * Analytics Service - Main Implementation
 * Real-time analytics, aggregations, and reporting
 */

import {
  IAnalyticsEvent,
  IEventAggregation,
  IMetricDefinition,
  IMetricDataPoint,
  IAnalyticsQuery,
  IAnalyticsResult,
  IDashboard,
  IWidget,
  IReport,
  IAnalyticsTrend,
  IFunnelAnalysis,
  ICohortAnalysis,
  IAnalyticsAlert,
  IAlertNotification,
  IRealTimeMetric,
  IAnalyticsHealthCheck,
  IAnalyticsStatistics,
  IAnalyticsEventLog,
  AnalyticsListener,
  IAnomalyDetectionResult,
  IAnalyticsServiceConfig,
  IUserJourney,
  IJourneyStep,
} from './types';

/**
 * Analytics Service - Enterprise real-time analytics
 */
export class AnalyticsService {
  private events: Map<string, IAnalyticsEvent>;
  private queries: Map<string, IAnalyticsQuery>;
  private dashboards: Map<string, IDashboard>;
  private reports: Map<string, IReport>;
  private metrics: Map<string, IMetricDataPoint[]>;
  private metricDefinitions: Map<string, IMetricDefinition>;
  private alerts: Map<string, IAnalyticsAlert>;
  private journeys: Map<string, IUserJourney>;
  private listeners: AnalyticsListener[];
  private config: IAnalyticsServiceConfig;
  private eventQueue: IAnalyticsEvent[];
  private cleanupInterval: NodeJS.Timer | null = null;
  private statistics: IAnalyticsStatistics;

  constructor(config: IAnalyticsServiceConfig) {
    this.config = this.validateConfig(config);
    this.events = new Map();
    this.queries = new Map();
    this.dashboards = new Map();
    this.reports = new Map();
    this.metrics = new Map();
    this.metricDefinitions = new Map();
    this.alerts = new Map();
    this.journeys = new Map();
    this.listeners = [];
    this.eventQueue = [];

    this.statistics = {
      totalEvents: 0,
      totalQueries: 0,
      totalDashboards: 0,
      averageQueryTime: 0,
      eventProcessingRate: 0,
      metricsTracked: 0,
      dashboardsCreated: 0,
      reportsGenerated: 0,
    };

    this.startCleanupInterval();
  }

  private validateConfig(config: IAnalyticsServiceConfig): IAnalyticsServiceConfig {
    if (config.maxEvents <= 0) {
      throw new Error('maxEvents must be greater than 0');
    }
    if (config.queryTimeoutMs <= 0) {
      throw new Error('queryTimeoutMs must be greater than 0');
    }
    return config;
  }

  public trackEvent(event: Omit<IAnalyticsEvent, 'eventId'>): string {
    const eventId = this.generateEventId();

    const fullEvent: IAnalyticsEvent = {
      ...event,
      eventId,
    };

    if (this.events.size >= this.config.maxEvents) {
      const firstKey = this.events.keys().next().value;
      this.events.delete(firstKey);
    }

    this.events.set(eventId, fullEvent);
    this.eventQueue.push(fullEvent);
    this.statistics.totalEvents++;

    this.emitLog({
      logId: this.generateLogId(),
      timestamp: new Date(),
      type: 'event-tracked',
      details: { eventId, category: event.category, action: event.action },
    });

    return eventId;
  }

  public getEvent(eventId: string): IAnalyticsEvent | null {
    return this.events.get(eventId) || null;
  }

  public listEvents(category?: string, limit?: number): IAnalyticsEvent[] {
    let events = Array.from(this.events.values());

    if (category) {
      events = events.filter((e) => e.category === category);
    }

    if (limit) {
      events = events.slice(-limit);
    }

    return events;
  }

  public aggregateEvents(startTime: Date, endTime: Date, category: string): IEventAggregation {
    const aggregationId = this.generateAggregationId();

    const filtered = Array.from(this.events.values()).filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime && e.category === category
    );

    const eventsByAction: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};
    const users = new Set<string>();
    const sessions = new Set<string>();

    for (const event of filtered) {
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;

      if (event.userId) users.add(event.userId);
      if (event.sessionId) sessions.add(event.sessionId);
    }

    return {
      aggregationId,
      startTime,
      endTime,
      category,
      totalEvents: filtered.length,
      uniqueUsers: users.size,
      uniqueSessions: sessions.size,
      eventsByAction,
      eventsBySource,
    };
  }

  public defineMetric(metric: Omit<IMetricDefinition, 'metricId'>): string {
    const metricId = this.generateMetricId();

    const fullMetric: IMetricDefinition = {
      ...metric,
      metricId,
    };

    this.metricDefinitions.set(metricId, fullMetric);
    this.statistics.metricsTracked++;

    return metricId;
  }

  public recordMetric(metricId: string, value: number, labels?: Record<string, string>): string {
    const metric = this.metricDefinitions.get(metricId);
    if (!metric) {
      throw new Error(`Metric ${metricId} not found`);
    }

    const pointId = this.generatePointId();

    const dataPoint: IMetricDataPoint = {
      pointId,
      metricId,
      timestamp: new Date(),
      value,
      labels,
    };

    if (!this.metrics.has(metricId)) {
      this.metrics.set(metricId, []);
    }

    const points = this.metrics.get(metricId)!;
    points.push(dataPoint);

    // Keep only recent data
    const cutoff = Date.now() - metric.retentionDays * 24 * 60 * 60 * 1000;
    const filtered = points.filter((p) => p.timestamp.getTime() > cutoff);
    this.metrics.set(metricId, filtered);

    return pointId;
  }

  public createQuery(query: Omit<IAnalyticsQuery, 'queryId' | 'createdAt' | 'updatedAt'>): string {
    const queryId = this.generateQueryId();

    const fullQuery: IAnalyticsQuery = {
      ...query,
      queryId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.queries.size >= this.config.maxQueries) {
      throw new Error('Maximum query limit reached');
    }

    this.queries.set(queryId, fullQuery);
    this.statistics.totalQueries++;

    return queryId;
  }

  public executeQuery(queryId: string): IAnalyticsResult {
    const query = this.queries.get(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    const startTime = Date.now();

    // Execute query (simplified)
    const data = this.queryData(query);

    const executionTime = Date.now() - startTime;

    const result: IAnalyticsResult = {
      resultId: this.generateResultId(),
      queryId,
      data,
      rowCount: data.length,
      columnCount: Object.keys(data[0] || {}).length,
      executionTime,
      timestamp: new Date(),
    };

    this.emitLog({
      logId: this.generateLogId(),
      timestamp: new Date(),
      type: 'query-executed',
      details: { queryId, rowCount: data.length, executionTime },
    });

    return result;
  }

  private queryData(query: IAnalyticsQuery): any[] {
    // Simplified query execution
    let data: any[] = [];

    if (query.type === 'events') {
      data = Array.from(this.events.values())
        .filter((e) => e.timestamp >= query.timeRange.startTime && e.timestamp <= query.timeRange.endTime)
        .map((e) => ({
          timestamp: e.timestamp,
          category: e.category,
          action: e.action,
          source: e.source,
          userId: e.userId,
        }));
    }

    if (query.limit) {
      data = data.slice(0, query.limit);
    }

    return data;
  }

  public createDashboard(dashboard: Omit<IDashboard, 'dashboardId' | 'createdAt' | 'updatedAt'>): string {
    const dashboardId = this.generateDashboardId();

    const fullDashboard: IDashboard = {
      ...dashboard,
      dashboardId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.dashboards.size >= this.config.maxDashboards) {
      throw new Error('Maximum dashboard limit reached');
    }

    this.dashboards.set(dashboardId, fullDashboard);
    this.statistics.dashboardsCreated++;

    return dashboardId;
  }

  public getDashboard(dashboardId: string): IDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  public listDashboards(): IDashboard[] {
    return Array.from(this.dashboards.values());
  }

  public deleteDashboard(dashboardId: string): boolean {
    return this.dashboards.delete(dashboardId);
  }

  public addWidget(dashboardId: string, widget: Omit<IWidget, 'widgetId' | 'dashboardId'>): string {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widgetId = this.generateWidgetId();

    const fullWidget: IWidget = {
      ...widget,
      widgetId,
      dashboardId,
    };

    dashboard.widgets.push(fullWidget);

    return widgetId;
  }

  public createReport(report: Omit<IReport, 'reportId' | 'createdAt' | 'updatedAt'>): string {
    const reportId = this.generateReportId();

    const fullReport: IReport = {
      ...report,
      reportId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reports.set(reportId, fullReport);
    this.statistics.reportsGenerated++;

    return reportId;
  }

  public getReport(reportId: string): IReport | null {
    return this.reports.get(reportId) || null;
  }

  public listReports(): IReport[] {
    return Array.from(this.reports.values());
  }

  public createAlert(alert: Omit<IAnalyticsAlert, 'alertId' | 'createdAt'>): string {
    const alertId = this.generateAlertId();

    const fullAlert: IAnalyticsAlert = {
      ...alert,
      alertId,
      createdAt: new Date(),
    };

    this.alerts.set(alertId, fullAlert);

    return alertId;
  }

  public getAlert(alertId: string): IAnalyticsAlert | null {
    return this.alerts.get(alertId) || null;
  }

  public listAlerts(): IAnalyticsAlert[] {
    return Array.from(this.alerts.values());
  }

  public trackJourney(journey: Omit<IUserJourney, 'journeyId'>): string {
    const journeyId = this.generateJourneyId();

    const fullJourney: IUserJourney = {
      ...journey,
      journeyId,
    };

    this.journeys.set(journeyId, fullJourney);

    return journeyId;
  }

  public getJourney(journeyId: string): IUserJourney | null {
    return this.journeys.get(journeyId) || null;
  }

  public getRealTimeMetrics(): IRealTimeMetric[] {
    const metrics: IRealTimeMetric[] = [];

    for (const [metricId, definition] of this.metricDefinitions) {
      const points = this.metrics.get(metricId) || [];
      if (points.length > 0) {
        const latest = points[points.length - 1];
        const previous = points.length > 1 ? points[points.length - 2] : undefined;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (previous) {
          if (latest.value > previous.value) trend = 'up';
          else if (latest.value < previous.value) trend = 'down';
        }

        metrics.push({
          metricId,
          name: definition.name,
          currentValue: latest.value,
          previousValue: previous?.value,
          trend,
          timestamp: latest.timestamp,
          unit: definition.unit,
        });
      }
    }

    return metrics;
  }

  public detectAnomalies(): IAnomalyDetectionResult[] {
    const anomalies: IAnomalyDetectionResult[] = [];

    // Simplified anomaly detection
    for (const [metricId, points] of this.metrics) {
      if (points.length > 10) {
        const recent = points.slice(-10);
        const avg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
        const latest = recent[recent.length - 1];

        const deviation = Math.abs(latest.value - avg) / avg;
        if (deviation > 0.5) {
          anomalies.push({
            anomalyId: this.generateAnomalyId(),
            metric: metricId,
            timestamp: latest.timestamp,
            expectedValue: avg,
            actualValue: latest.value,
            deviation,
            severity: deviation > 1 ? 'high' : 'medium',
          });

          this.emitLog({
            logId: this.generateLogId(),
            timestamp: new Date(),
            type: 'anomaly-detected',
            details: { metricId, expectedValue: avg, actualValue: latest.value },
          });
        }
      }
    }

    return anomalies;
  }

  public async performHealthCheck(): Promise<IAnalyticsHealthCheck> {
    const recentEvents = Array.from(this.events.values()).filter(
      (e) => e.timestamp.getTime() > Date.now() - 60 * 1000
    );

    const lastEvent = Array.from(this.events.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const status =
      this.eventQueue.length > 1000 || this.statistics.totalEvents > this.config.maxEvents ? 'degraded' : 'healthy';

    return {
      status: status as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(),
      eventCount: this.events.size,
      queryQueueSize: this.eventQueue.length,
      activeQueries: this.queries.size,
      lastEventTime: lastEvent?.timestamp,
      processingLatency: recentEvents.length > 0 ? Date.now() - recentEvents[0].timestamp.getTime() : 0,
    };
  }

  public getStatistics(): IAnalyticsStatistics {
    return { ...this.statistics };
  }

  public onAnalyticsEvent(listener: AnalyticsListener): this {
    this.listeners.push(listener);
    return this;
  }

  private async emitLog(log: IAnalyticsEventLog): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await Promise.resolve(listener(log));
      } catch (error) {
        console.error('Error in analytics listener:', error);
      }
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalMs);
  }

  private cleanup(): void {
    const now = Date.now();

    // Clean expired events
    const eventCutoff = now - this.config.eventRetentionDays * 24 * 60 * 60 * 1000;
    const eventsToDelete: string[] = [];

    for (const [eventId, event] of this.events) {
      if (event.timestamp.getTime() < eventCutoff) {
        eventsToDelete.push(eventId);
      }
    }

    eventsToDelete.forEach((id) => this.events.delete(id));

    // Clean expired metrics
    for (const [metricId, points] of this.metrics) {
      const definition = this.metricDefinitions.get(metricId);
      if (definition) {
        const metricCutoff = now - definition.retentionDays * 24 * 60 * 60 * 1000;
        const filtered = points.filter((p) => p.timestamp.getTime() > metricCutoff);
        this.metrics.set(metricId, filtered);
      }
    }
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAggregationId(): string {
    return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMetricId(): string {
    return `met_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePointId(): string {
    return `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQueryId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResultId(): string {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDashboardId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWidgetId(): string {
    return `wid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJourneyId(): string {
    return `jrn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createAnalyticsService(config: IAnalyticsServiceConfig): AnalyticsService {
  return new AnalyticsService(config);
}
