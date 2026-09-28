/**
 * Search Service - Main Implementation
 * Full-text search with indexing, filtering, aggregation, and relevance ranking
 */

import crypto from 'crypto';

import {
  ISearchDocument,
  ISearchQuery,
  ISearchFilter,
  ISearchAggregation,
  ISearchResult,
  ISearchResponse,
  ISearchStats,
  ISearchHealthCheck,
  ISearchEvent,
  SearchListener,
  ISearchAnalyzerConfig,
  ISearchRankingProfile,
  ISearchIndexConfig,
  ISearchServiceConfig,
  ISearchBulkOperation,
  ISearchAnalytics,
} from './types';

/**
 * Search Service - Full-text search with advanced features
 */
export class SearchService {
  private indexes: Map<string, Map<string, ISearchDocument>>;
  private indexConfigs: Map<string, ISearchIndexConfig>;
  private listeners: SearchListener[];
  private stats: ISearchStats;
  private queryCache: Map<string, { results: ISearchResponse; expiry: number }>;
  private rankingProfiles: Map<string, ISearchRankingProfile>;
  private analytics: ISearchAnalytics[];
  private auditLog: Array<any>;
  private config: ISearchServiceConfig;
  private indexTime: number = 0;
  private searchTime: number = 0;

  constructor(config: ISearchServiceConfig) {
    this.config = this.validateConfig(config);
    this.indexes = new Map();
    this.indexConfigs = new Map();
    this.listeners = [];
    this.stats = this.initializeStats();
    this.queryCache = new Map();
    this.rankingProfiles = new Map();
    this.analytics = [];
    this.auditLog = [];
  }

  private validateConfig(config: ISearchServiceConfig): ISearchServiceConfig {
    if (config.maxIndexes <= 0) {
      throw new Error('maxIndexes must be greater than 0');
    }
    if (config.queryTimeout <= 0) {
      throw new Error('queryTimeout must be greater than 0');
    }
    return config;
  }

  private initializeStats(): ISearchStats {
    return {
      totalIndexes: 0,
      totalDocuments: 0,
      totalSearches: 0,
      averageSearchTime: 0,
      successfulSearches: 0,
      failedSearches: 0,
      emptyResults: 0,
      indexSize: 0,
      lastUpdated: new Date(),
    };
  }

  public createIndex(config: Omit<ISearchIndexConfig, 'indexId' | 'createdAt' | 'updatedAt'>): string {
    const indexId = this.generateIndexId();

    const fullConfig: ISearchIndexConfig = {
      ...config,
      indexId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.indexConfigs.set(indexId, fullConfig);
    this.indexes.set(indexId, new Map());
    this.stats.totalIndexes++;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'index',
      indexId,
    });

    return indexId;
  }

  public getIndex(indexId: string): ISearchIndexConfig | null {
    return this.indexConfigs.get(indexId) || null;
  }

  public deleteIndex(indexId: string): boolean {
    const deleted = this.indexes.delete(indexId);
    this.indexConfigs.delete(indexId);

    if (deleted) {
      this.stats.totalIndexes--;
      this.stats.lastUpdated = new Date();
    }

    return deleted;
  }

  public indexDocument<T = any>(indexId: string, doc: Omit<ISearchDocument<T>, 'timestamp' | 'version' | 'indexed'>): string {
    const startTime = Date.now();

    const index = this.indexes.get(indexId);
    if (!index) {
      throw new Error(`Index ${indexId} not found`);
    }

    const document: ISearchDocument<T> = {
      ...doc,
      timestamp: new Date(),
      version: 1,
      indexed: true,
    };

    index.set(doc.id, document);
    this.stats.totalDocuments++;

    const duration = Date.now() - startTime;
    this.indexTime += duration;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'index',
      indexId,
      documentId: doc.id,
      duration,
    });

    return doc.id;
  }

  public getDocument<T = any>(indexId: string, documentId: string): ISearchDocument<T> | null {
    const index = this.indexes.get(indexId);
    if (!index) return null;

    return (index.get(documentId) || null) as ISearchDocument<T> | null;
  }

  public updateDocument<T = any>(indexId: string, documentId: string, content: T): boolean {
    const index = this.indexes.get(indexId);
    if (!index) return false;

    const doc = index.get(documentId);
    if (!doc) return false;

    doc.content = content;
    doc.version++;
    doc.timestamp = new Date();

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'update',
      indexId,
      documentId,
    });

    return true;
  }

  public deleteDocument(indexId: string, documentId: string): boolean {
    const index = this.indexes.get(indexId);
    if (!index) return false;

    const deleted = index.delete(documentId);
    if (deleted) {
      this.stats.totalDocuments--;
    }

    return deleted;
  }

  public search<T = any>(indexId: string, query: ISearchQuery): ISearchResponse<T> {
    const startTime = Date.now();
    const responseId = this.generateResponseId();

    try {
      // Check cache
      const cacheKey = this.generateCacheKey(indexId, query);
      const cached = this.queryCache.get(cacheKey);

      if (cached && cached.expiry > Date.now()) {
        return cached.results as ISearchResponse<T>;
      }

      const index = this.indexes.get(indexId);
      if (!index) {
        throw new Error(`Index ${indexId} not found`);
      }

      // Get all documents matching filters
      let results: ISearchResult<T>[] = Array.from(index.values()).map((doc) => ({
        id: doc.id,
        source: doc.content,
        score: this.calculateScore(doc, query),
        fields: doc.fields,
      }));

      // Apply filters
      if (query.filters && query.filters.length > 0) {
        results = results.filter((result) => this.matchesFilters(result, query.filters));
      }

      // Sort results
      if (query.sort && query.sort.length > 0) {
        results.sort((a, b) => {
          for (const sortBy of query.sort!) {
            const aVal = (a.fields?.[sortBy.field] as any) || 0;
            const bVal = (b.fields?.[sortBy.field] as any) || 0;
            const comparison = aVal > bVal ? 1 : -1;
            if (comparison !== 0) {
              return sortBy.order === 'asc' ? comparison : -comparison;
            }
          }
          return 0;
        });
      } else {
        results.sort((a, b) => b.score - a.score);
      }

      // Apply pagination
      const page = query.pagination?.page || 1;
      const pageSize = query.pagination?.pageSize || 10;
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const paginatedResults = results.slice(startIdx, endIdx);

      // Compute aggregations
      const aggregations: Record<string, any> = {};
      if (query.aggregations && query.aggregations.length > 0) {
        for (const agg of query.aggregations) {
          aggregations[agg.name] = this.computeAggregation(results, agg);
        }
      }

      // Add highlighting
      if (query.highlight?.enabled) {
        for (const result of paginatedResults) {
          result.highlight = this.generateHighlights(result, query);
        }
      }

      const duration = Date.now() - startTime;
      this.searchTime += duration;

      const response: ISearchResponse<T> = {
        responseId,
        timestamp: new Date(),
        totalHits: results.length,
        duration,
        results: paginatedResults,
        aggregations,
        totalPages: Math.ceil(results.length / pageSize),
      };

      // Cache result
      this.queryCache.set(cacheKey, {
        results: response,
        expiry: Date.now() + 300000, // 5 minutes
      });

      this.stats.totalSearches++;
      this.stats.successfulSearches++;
      this.stats.lastUpdated = new Date();

      this.emitEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        type: 'search',
        indexId,
        query: query.text,
        resultCount: response.totalHits,
        duration,
      });

      return response;
    } catch (error) {
      this.stats.failedSearches++;
      this.emitEvent({
        eventId: this.generateEventId(),
        timestamp: new Date(),
        type: 'error',
        error: (error as Error).message,
      });
      throw error;
    }
  }

  public indexBatch<T = any>(indexId: string, documents: Array<Omit<ISearchDocument<T>, 'timestamp' | 'version' | 'indexed'>>): ISearchBulkOperation {
    const operationId = this.generateOperationId();
    const startTime = Date.now();

    const operation: ISearchBulkOperation = {
      operationId,
      timestamp: new Date(),
      type: 'index',
      documentCount: documents.length,
      successCount: 0,
      failureCount: 0,
      duration: 0,
      errors: [],
    };

    for (const doc of documents) {
      try {
        this.indexDocument(indexId, doc);
        operation.successCount++;
      } catch (error) {
        operation.failureCount++;
        operation.errors?.push({
          documentId: doc.id,
          error: (error as Error).message,
        });
      }
    }

    operation.duration = Date.now() - startTime;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'index',
      indexId,
      resultCount: operation.successCount,
      duration: operation.duration,
    });

    return operation;
  }

  public getStats(): ISearchStats {
    return {
      ...this.stats,
      averageSearchTime: this.stats.totalSearches > 0 ? this.searchTime / this.stats.totalSearches : 0,
      lastUpdated: new Date(),
    };
  }

  public async performHealthCheck(): Promise<ISearchHealthCheck> {
    const indexes = Array.from(this.indexConfigs.values()).map((config) => ({
      name: config.name,
      status: this.indexes.get(config.indexId)?.size ?? 0 > 0 ? 'healthy' : 'degraded',
      documentCount: this.indexes.get(config.indexId)?.size ?? 0,
      indexSize: this.estimateIndexSize(config.indexId),
    })) as any;

    const overallStatus = indexes.every((i) => i.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(),
      indexes,
    };
  }

  public createRankingProfile(profile: Omit<ISearchRankingProfile, 'profileId' | 'createdAt'>): string {
    const profileId = this.generateProfileId();

    const fullProfile: ISearchRankingProfile = {
      ...profile,
      profileId,
      createdAt: new Date(),
    };

    this.rankingProfiles.set(profileId, fullProfile);

    return profileId;
  }

  public getRankingProfile(profileId: string): ISearchRankingProfile | null {
    return this.rankingProfiles.get(profileId) || null;
  }

  public onEvent(listener: SearchListener): this {
    this.listeners.push(listener);
    return this;
  }

  private calculateScore(doc: ISearchDocument, query: ISearchQuery): number {
    let score = 1.0;

    if (query.text) {
      const text = JSON.stringify(doc.content).toLowerCase();
      const queryText = query.text.toLowerCase();

      if (text.includes(queryText)) {
        score += 1.0;
      }

      const words = queryText.split(' ');
      for (const word of words) {
        if (text.includes(word)) {
          score += 0.5;
        }
      }
    }

    return Math.min(score, 10.0);
  }

  private matchesFilters(result: ISearchResult, filters: ISearchFilter[]): boolean {
    for (const filter of filters) {
      const value = result.fields?.[filter.field];

      switch (filter.operator) {
        case 'eq':
          if (value !== filter.value) return false;
          break;
        case 'ne':
          if (value === filter.value) return false;
          break;
        case 'gt':
          if (value <= filter.value) return false;
          break;
        case 'gte':
          if (value < filter.value) return false;
          break;
        case 'lt':
          if (value >= filter.value) return false;
          break;
        case 'lte':
          if (value > filter.value) return false;
          break;
        case 'in':
          if (!filter.values?.includes(value)) return false;
          break;
      }
    }

    return true;
  }

  private computeAggregation(results: ISearchResult[], agg: ISearchAggregation): any {
    switch (agg.type) {
      case 'count':
        return results.length;

      case 'sum':
        return results.reduce((sum, r) => sum + (Number(r.fields?.[agg.field!]) || 0), 0);

      case 'avg':
        if (results.length === 0) return 0;
        const sum = results.reduce((s, r) => s + (Number(r.fields?.[agg.field!]) || 0), 0);
        return sum / results.length;

      case 'min':
        return Math.min(...results.map((r) => Number(r.fields?.[agg.field!]) || Infinity));

      case 'max':
        return Math.max(...results.map((r) => Number(r.fields?.[agg.field!]) || -Infinity));

      case 'terms': {
        const terms: Record<string, number> = {};
        for (const result of results) {
          const term = result.fields?.[agg.field!];
          terms[term] = (terms[term] || 0) + 1;
        }
        return Object.entries(terms)
          .sort((a, b) => b[1] - a[1])
          .slice(0, agg.size || 10);
      }

      default:
        return null;
    }
  }

  private generateHighlights(result: ISearchResult, query: ISearchQuery): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};

    if (!query.text || !query.highlight?.fields) {
      return highlights;
    }

    const queryTerms = query.text.toLowerCase().split(' ');

    for (const field of query.highlight.fields) {
      const fieldValue = String(result.fields?.[field] || '');
      if (!fieldValue) continue;

      let highlighted = fieldValue;
      for (const term of queryTerms) {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<em>$1</em>');
      }

      highlights[field] = [highlighted];
    }

    return highlights;
  }

  private estimateIndexSize(indexId: string): number {
    const index = this.indexes.get(indexId);
    if (!index) return 0;

    let size = 0;
    for (const doc of index.values()) {
      size += JSON.stringify(doc).length;
    }

    return size;
  }

  private generateCacheKey(indexId: string, query: ISearchQuery): string {
    const queryStr = JSON.stringify(query);
    return crypto.createHash('md5').update(`${indexId}:${queryStr}`).digest('hex');
  }

  private async emitEvent(event: Omit<ISearchEvent, 'eventId'>): Promise<void> {
    const fullEvent: ISearchEvent = {
      eventId: this.generateEventId(),
      ...event,
    };

    for (const listener of this.listeners) {
      try {
        await Promise.resolve(listener(fullEvent));
      } catch (error) {
        console.error('Error in search listener:', error);
      }
    }
  }

  private generateIndexId(): string {
    return `idx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResponseId(): string {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProfileId(): string {
    return `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public stop(): void {
    this.queryCache.clear();
  }
}

export function createSearchService(config: ISearchServiceConfig): SearchService {
  return new SearchService(config);
}
