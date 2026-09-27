/**
 * Event Pipeline Service - Main Implementation
 * Event ingestion, processing, enrichment, correlation, and distribution
 */

import {
  EventSource,
  EventPriority,
  EventStatus,
  CorrelationType,
  EnrichmentType,
  PipelineStage,
  IEventData,
  IEventContext,
  IEventEnrichment,
  IEventCorrelation,
  IPipelineEvent,
  IEventFilter,
  IEventProcessor,
  IEventEnricher,
  IEventCorrelator,
  IEventDistributor,
  IPipelineConfig,
  IPipelineStats,
  IPipelineAuditEntry,
  EventPipelineListener,
  StageListener,
  IDeduplicationRecord,
  IEventCacheEntry,
  IPipelineHealthCheck,
  IEventQuery,
  IBatchIngestionRequest,
  IEventProcessingResult,
  IPipelineBatchResult,
  IEventReplayRequest,
  IEventReplayResult,
} from './types';

/**
 * Event Pipeline Service
 * Manages event ingestion, processing, enrichment, correlation, and distribution
 */
export class EventPipeline {
  private config: IPipelineConfig;
  private eventStore: Map<string, IPipelineEvent> = new Map();
  private processors: Map<string, IEventProcessor> = new Map();
  private enrichers: Map<string, IEventEnricher> = new Map();
  private correlators: Map<string, IEventCorrelator> = new Map();
  private distributors: Map<string, IEventDistributor> = new Map();
  private filters: Map<string, IEventFilter> = new Map();
  private eventListeners: Set<EventPipelineListener> = new Set();
  private stageListeners: Set<StageListener> = new Set();
  private stats: IPipelineStats;
  private auditLog: IPipelineAuditEntry[] = [];
  private deduplicationCache: Map<string, IDeduplicationRecord> = new Map();
  private enrichmentCache: Map<string, IEventCacheEntry> = new Map();
  private eventQueue: IPipelineEvent[] = [];
  private eventHistory: IPipelineEvent[] = [];
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private processingStartTime: number = 0;

  /**
   * Constructor
   */
  constructor(config: IPipelineConfig) {
    this.config = this.validateConfig(config);
    this.stats = this.initializeStats();
    this.startCleanupInterval();
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: IPipelineConfig): IPipelineConfig {
    const ingestionConfig = config.ingestionConfig;
    if (ingestionConfig) {
      if (ingestionConfig.maxBatchSize < 1) {
        throw new Error('Max batch size must be at least 1');
      }
      if (ingestionConfig.batchTimeoutMs < 100) {
        throw new Error('Batch timeout must be at least 100ms');
      }
    }
    return config;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): IPipelineStats {
    return {
      totalEventsIngested: 0,
      eventsProcessing: 0,
      eventsEnriched: 0,
      eventsCorrelated: 0,
      eventsDistributed: 0,
      eventsArchived: 0,
      failedEvents: 0,
      averageProcessingTimeMs: 0,
      averageEnrichmentTimeMs: 0,
      averageCorrelationTimeMs: 0,
      averageDistributionTimeMs: 0,
      throughputEventsPerSecond: 0,
      eventsByPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      eventsBySource: {},
      processingErrorRate: 0,
    };
  }

  /**
   * Ingest event
   */
  public async ingestEvent(
    source: EventSource,
    data: IEventData,
    priority?: EventPriority,
    context?: Partial<IEventContext>,
  ): Promise<string> {
    const eventId = this.generateEventId();
    const timestamp = new Date();

    // Check deduplication
    if (this.config.ingestionConfig?.deduplicationEnabled) {
      const hash = this.hashEvent(data);
      const existing = this.findDuplicate(hash);
      if (existing) {
        existing.duplicateCount++;
        existing.lastSeen = timestamp;
        return existing.originalEventId;
      }
    }

    const event: IPipelineEvent = {
      eventId,
      timestamp,
      source,
      priority: priority || 'medium',
      status: 'ingested',
      data,
      context: {
        correlationId: context?.correlationId || this.generateCorrelationId(),
        traceId: context?.traceId || this.generateTraceId(),
        userId: context?.userId,
        sessionId: context?.sessionId,
        source,
        metadata: context?.metadata,
      },
      enrichments: [],
      correlations: [],
      ingestedAt: timestamp,
    };

    this.eventStore.set(eventId, event);
    this.eventQueue.push(event);
    this.stats.totalEventsIngested++;
    this.stats.eventsByPriority[event.priority]++;

    const source_key = source as keyof typeof this.stats.eventsBySource;
    if (!this.stats.eventsBySource[source_key]) {
      this.stats.eventsBySource[source_key] = 0;
    }
    this.stats.eventsBySource[source_key]++;

    await this.auditEntry(eventId, 'ingested', 'ingestion', 0);
    await this.emitStageEvent(event, 'ingestion');

    // Process event
    await this.processEvent(event);

    return eventId;
  }

  /**
   * Ingest batch events
   */
  public async ingestBatchEvents(batch: IBatchIngestionRequest): Promise<IPipelineBatchResult> {
    const batchId = this.generateBatchId();
    const results: IEventProcessingResult[] = [];
    let successCount = 0;
    let failCount = 0;

    const startTime = Date.now();

    for (const eventData of batch.events) {
      try {
        const eventId = await this.ingestEvent(
          eventData.source,
          eventData.data,
          eventData.priority,
          eventData.context,
        );

        const event = this.eventStore.get(eventId);
        if (event) {
          results.push({
            eventId,
            success: true,
            stage: 'distribution',
            startTime: event.ingestedAt,
            endTime: new Date(),
            durationMs: Date.now() - event.ingestedAt.getTime(),
          });
          successCount++;
        }
      } catch (error) {
        failCount++;
        results.push({
          eventId: 'unknown',
          success: false,
          stage: 'ingestion',
          startTime: new Date(),
          endTime: new Date(),
          durationMs: 0,
          errors: [String(error)],
        });
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      batchId,
      totalEvents: batch.events.length,
      successfulEvents: successCount,
      failedEvents: failCount,
      averageDurationMs: durationMs / batch.events.length,
      results,
    };
  }

  /**
   * Process event through pipeline
   */
  private async processEvent(event: IPipelineEvent): Promise<void> {
    let currentEvent = event;

    try {
      // Validation stage
      if (this.config.enableValidation) {
        currentEvent = await this.validateEvent(currentEvent);
      }

      // Enrichment stage
      if (this.config.enableEnrichment) {
        currentEvent = await this.enrichEvent(currentEvent);
      }

      // Correlation stage
      if (this.config.enableCorrelation) {
        currentEvent = await this.correlateEvent(currentEvent);
      }

      // Distribution stage
      if (this.config.enableDistribution) {
        await this.distributeEvent(currentEvent);
      }

      currentEvent.status = 'distributed';
      currentEvent.completedAt = new Date();
      this.stats.eventsDistributed++;

      await this.auditEntry(currentEvent.eventId, 'distributed', 'distribution', 0);
    } catch (error) {
      this.stats.failedEvents++;
      currentEvent.status = 'ingested';
      await this.auditEntry(currentEvent.eventId, 'failed', 'ingestion', 0, [String(error)]);
    }

    this.eventStore.set(currentEvent.eventId, currentEvent);
    this.eventHistory.push(currentEvent);
    await this.emitEvent(currentEvent);
  }

  /**
   * Validate event
   */
  private async validateEvent(event: IPipelineEvent): Promise<IPipelineEvent> {
    const startTime = Date.now();
    event.status = 'processing';

    // Apply filters
    for (const filter of Array.from(this.filters.values()).sort((a, b) => a.priority - b.priority)) {
      if (filter.isActive && this.matchesFilterConditions(event, filter.conditions)) {
        switch (filter.action) {
          case 'reject':
            throw new Error(`Event rejected by filter: ${filter.name}`);
          case 'transform':
            // Transform event data if needed
            break;
          case 'route':
            // Route to specific distributor
            break;
        }
      }
    }

    const duration = Date.now() - startTime;
    await this.auditEntry(event.eventId, 'validated', 'validation', duration);

    return event;
  }

  /**
   * Enrich event
   */
  private async enrichEvent(event: IPipelineEvent): Promise<IPipelineEvent> {
    const startTime = Date.now();
    event.status = 'enriched';

    const enabledEnrichers = Array.from(this.enrichers.values())
      .filter((e) => e.isActive)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, this.config.enrichmentConfig?.maxEnrichersPerEvent || 10);

    for (const enricher of enabledEnrichers) {
      try {
        const enrichments = await this.executeWithTimeout(
          enricher.handler(event),
          this.config.enrichmentConfig?.timeoutPerEnricherMs || 5000,
        );

        event.enrichments.push(...enrichments);
      } catch (error) {
        // Continue with next enricher on error
      }
    }

    this.stats.eventsEnriched++;
    const duration = Date.now() - startTime;
    this.stats.averageEnrichmentTimeMs =
      (this.stats.averageEnrichmentTimeMs * this.stats.eventsEnriched + duration) / (this.stats.eventsEnriched || 1);

    await this.auditEntry(event.eventId, 'enriched', 'enrichment', duration);
    await this.emitStageEvent(event, 'enrichment');

    return event;
  }

  /**
   * Correlate event
   */
  private async correlateEvent(event: IPipelineEvent): Promise<IPipelineEvent> {
    const startTime = Date.now();
    const timeWindow = this.config.correlationConfig?.timeWindowMs || 3600000;
    const historyWindow = this.eventHistory.filter(
      (e) => e.timestamp.getTime() > event.timestamp.getTime() - timeWindow,
    );

    const enabledCorrelators = Array.from(this.correlators.values())
      .filter((c) => c.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const correlator of enabledCorrelators) {
      try {
        const correlations = await this.executeWithTimeout(
          correlator.handler(event, historyWindow),
          10000,
        );

        event.correlations.push(...correlations);
      } catch (error) {
        // Continue with next correlator on error
      }
    }

    this.stats.eventsCorrelated++;
    const duration = Date.now() - startTime;
    this.stats.averageCorrelationTimeMs =
      (this.stats.averageCorrelationTimeMs * this.stats.eventsCorrelated + duration) /
      (this.stats.eventsCorrelated || 1);

    await this.auditEntry(event.eventId, 'correlated', 'correlation', duration);
    await this.emitStageEvent(event, 'correlation');

    return event;
  }

  /**
   * Distribute event
   */
  private async distributeEvent(event: IPipelineEvent): Promise<void> {
    const startTime = Date.now();
    const enabledDistributors = Array.from(this.distributors.values())
      .filter((d) => d.isActive)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, this.config.distributionConfig?.maxDistributorsPerEvent || 10);

    for (const distributor of enabledDistributors) {
      try {
        await this.executeWithTimeout(
          distributor.handler(event),
          this.config.distributionConfig?.timeoutPerDistributorMs || 5000,
        );
      } catch (error) {
        if (this.config.distributionConfig?.failFastMode) {
          throw error;
        }
        // Continue with next distributor on error
      }
    }

    const duration = Date.now() - startTime;
    this.stats.averageDistributionTimeMs =
      (this.stats.averageDistributionTimeMs * this.stats.eventsDistributed + duration) /
      (this.stats.eventsDistributed || 1);

    await this.auditEntry(event.eventId, 'distributed', 'distribution', duration);
    await this.emitStageEvent(event, 'distribution');
  }

  /**
   * Register processor
   */
  public registerProcessor(processor: IEventProcessor): void {
    if (this.processors.has(processor.processorId)) {
      throw new Error(`Processor ${processor.processorId} already registered`);
    }
    this.processors.set(processor.processorId, processor);
  }

  /**
   * Register enricher
   */
  public registerEnricher(enricher: IEventEnricher): void {
    if (this.enrichers.has(enricher.enricherId)) {
      throw new Error(`Enricher ${enricher.enricherId} already registered`);
    }
    this.enrichers.set(enricher.enricherId, enricher);
  }

  /**
   * Register correlator
   */
  public registerCorrelator(correlator: IEventCorrelator): void {
    if (this.correlators.has(correlator.correlatorId)) {
      throw new Error(`Correlator ${correlator.correlatorId} already registered`);
    }
    this.correlators.set(correlator.correlatorId, correlator);
  }

  /**
   * Register distributor
   */
  public registerDistributor(distributor: IEventDistributor): void {
    if (this.distributors.has(distributor.distributorId)) {
      throw new Error(`Distributor ${distributor.distributorId} already registered`);
    }
    this.distributors.set(distributor.distributorId, distributor);
  }

  /**
   * Register filter
   */
  public registerFilter(filter: IEventFilter): void {
    if (this.filters.has(filter.filterId)) {
      throw new Error(`Filter ${filter.filterId} already registered`);
    }
    this.filters.set(filter.filterId, filter);
  }

  /**
   * Get event by ID
   */
  public getEvent(eventId: string): IPipelineEvent | null {
    return this.eventStore.get(eventId) || null;
  }

  /**
   * Query events
   */
  public queryEvents(query: IEventQuery): IPipelineEvent[] {
    let results = Array.from(this.eventStore.values());

    if (query.eventId) {
      results = results.filter((e) => e.eventId === query.eventId);
    }

    if (query.sourceFilter && query.sourceFilter.length > 0) {
      results = results.filter((e) => query.sourceFilter!.includes(e.source));
    }

    if (query.priorityFilter && query.priorityFilter.length > 0) {
      results = results.filter((e) => query.priorityFilter!.includes(e.priority));
    }

    if (query.statusFilter && query.statusFilter.length > 0) {
      results = results.filter((e) => query.statusFilter!.includes(e.status));
    }

    if (query.startDate) {
      results = results.filter((e) => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter((e) => e.timestamp <= query.endDate!);
    }

    if (query.correlationId) {
      results = results.filter((e) => e.context.correlationId === query.correlationId);
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return results.slice(offset, offset + limit);
  }

  /**
   * Get statistics
   */
  public getStats(): IPipelineStats {
    this.stats.processingErrorRate =
      this.stats.totalEventsIngested > 0
        ? this.stats.failedEvents / this.stats.totalEventsIngested
        : 0;

    this.stats.throughputEventsPerSecond =
      Date.now() > this.processingStartTime
        ? this.stats.totalEventsIngested / ((Date.now() - this.processingStartTime) / 1000)
        : 0;

    return { ...this.stats };
  }

  /**
   * Get audit log
   */
  public getAuditLog(limit: number = 100): IPipelineAuditEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<IPipelineHealthCheck> {
    const checks = [
      {
        name: 'event_store',
        status: this.eventStore.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'processors_registered',
        status: this.processors.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'enrichers_registered',
        status: this.enrichers.size > 0 ? ('healthy' as const) : ('degraded' as const),
      },
      {
        name: 'queue_depth',
        status: this.eventQueue.length < 10000 ? ('healthy' as const) : ('degraded' as const),
      },
    ];

    const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
    const overallStatus =
      unhealthyCount > 0 ? ('unhealthy' as const) : ('healthy' as const);

    return {
      status: overallStatus,
      timestamp: new Date(),
      stageHealth: {
        ingestion: 'healthy',
        validation: 'healthy',
        enrichment: 'healthy',
        correlation: 'healthy',
        distribution: 'healthy',
        archive: 'healthy',
      },
      queueDepth: this.eventQueue.length,
      processingRate: this.stats.throughputEventsPerSecond,
      errorRate: this.stats.processingErrorRate,
      checks,
    };
  }

  /**
   * Add event listener
   */
  public onEvent(listener: EventPipelineListener): this {
    this.eventListeners.add(listener);
    return this;
  }

  /**
   * Remove event listener
   */
  public offEvent(listener: EventPipelineListener): this {
    this.eventListeners.delete(listener);
    return this;
  }

  /**
   * Add stage listener
   */
  public onStage(listener: StageListener): this {
    this.stageListeners.add(listener);
    return this;
  }

  /**
   * Remove stage listener
   */
  public offStage(listener: StageListener): this {
    this.stageListeners.delete(listener);
    return this;
  }

  /**
   * Emit event
   */
  private async emitEvent(event: IPipelineEvent): Promise<void> {
    for (const listener of this.eventListeners) {
      try {
        await listener(event);
      } catch (error) {
        // Silently ignore listener errors
      }
    }
  }

  /**
   * Emit stage event
   */
  private async emitStageEvent(event: IPipelineEvent, stage: PipelineStage): Promise<void> {
    for (const listener of this.stageListeners) {
      try {
        await listener(event, stage);
      } catch (error) {
        // Silently ignore listener errors
      }
    }
  }

  /**
   * Replay events
   */
  public async replayEvents(request: IEventReplayRequest): Promise<IEventReplayResult> {
    const replayId = this.generateReplayId();
    const startTime = Date.now();

    let toReplay = this.eventHistory.filter(
      (e) => e.timestamp >= request.startDate && e.timestamp <= request.endDate,
    );

    if (request.sourceFilter && request.sourceFilter.length > 0) {
      toReplay = toReplay.filter((e) => request.sourceFilter!.includes(e.source));
    }

    if (request.priorityFilter && request.priorityFilter.length > 0) {
      toReplay = toReplay.filter((e) => request.priorityFilter!.includes(e.priority));
    }

    let successCount = 0;
    let failCount = 0;

    for (const event of toReplay) {
      try {
        if (request.reprocessWithEnrichment) {
          await this.enrichEvent(event);
        }
        if (request.reprocessWithCorrelation) {
          await this.correlateEvent(event);
        }
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    const completionTime = new Date();
    const durationMs = Date.now() - startTime;

    return {
      replayId,
      totalEventsReplayed: toReplay.length,
      successfulReplays: successCount,
      failedReplays: failCount,
      startTime: new Date(startTime),
      completionTime,
      durationMs,
    };
  }

  /**
   * Archive old events
   */
  public archiveOldEvents(olderThanMs: number = 86400000): number {
    const cutoffTime = Date.now() - olderThanMs;
    let archivedCount = 0;

    for (const [eventId, event] of this.eventStore.entries()) {
      if (event.timestamp.getTime() < cutoffTime) {
        this.eventStore.delete(eventId);
        this.stats.eventsArchived++;
        archivedCount++;
      }
    }

    return archivedCount;
  }

  /**
   * Match filter conditions
   */
  private matchesFilterConditions(event: IPipelineEvent, conditions: any[]): boolean {
    if (conditions.length === 0) {
      return true;
    }

    return conditions.every((condition) => this.matchCondition(event, condition));
  }

  /**
   * Match single condition
   */
  private matchCondition(event: IPipelineEvent, condition: any): boolean {
    const value = this.getNestedValue(event.data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return condition.caseSensitive
          ? value === condition.value
          : String(value).toLowerCase() === String(condition.value).toLowerCase();
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'startsWith':
        return String(value).startsWith(String(condition.value));
      case 'endsWith':
        return String(value).endsWith(String(condition.value));
      case 'gt':
        return Number(value) > Number(condition.value);
      case 'lt':
        return Number(value) < Number(condition.value);
      case 'gte':
        return Number(value) >= Number(condition.value);
      case 'lte':
        return Number(value) <= Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'regex':
        return new RegExp(String(condition.value)).test(String(value));
      default:
        return true;
    }
  }

  /**
   * Get nested value
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let value: unknown = obj;

    for (const key of keys) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs),
      ),
    ]);
  }

  /**
   * Hash event for deduplication
   */
  private hashEvent(data: IEventData): string {
    const str = JSON.stringify(data);
    return `${str.length}_${str.charCodeAt(0)}`;
  }

  /**
   * Find duplicate event
   */
  private findDuplicate(hash: string): IDeduplicationRecord | null {
    for (const record of this.deduplicationCache.values()) {
      if (record.eventHash === hash && record.expiresAt > new Date()) {
        return record;
      }
    }
    return null;
  }

  /**
   * Audit entry
   */
  private async auditEntry(
    eventId: string,
    action: any,
    stage: PipelineStage,
    duration: number,
    errors?: string[],
  ): Promise<void> {
    if (!this.config.enableAudit) {
      return;
    }

    const entry: IPipelineAuditEntry = {
      entryId: this.generateAuditId(),
      timestamp: new Date(),
      eventId,
      action,
      stage,
      duration,
      details: errors ? { errors } : undefined,
    };

    this.auditLog.push(entry);
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.processingStartTime = Date.now();
    const interval = this.config.cleanupIntervalMs || 3600000;

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Cleanup
   */
  private cleanup(): void {
    // Clean deduplication cache
    for (const [id, record] of this.deduplicationCache.entries()) {
      if (record.expiresAt < new Date()) {
        this.deduplicationCache.delete(id);
      }
    }

    // Clean enrichment cache
    for (const [id, entry] of this.enrichmentCache.entries()) {
      if (entry.expiresAt < new Date()) {
        this.enrichmentCache.delete(id);
      }
    }

    // Archive old events
    this.archiveOldEvents();
  }

  /**
   * Stop pipeline
   */
  public stop(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }

  /**
   * Generate IDs
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReplayId(): string {
    return `replay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function
 */
export function createEventPipeline(config: IPipelineConfig): EventPipeline {
  return new EventPipeline(config);
}
