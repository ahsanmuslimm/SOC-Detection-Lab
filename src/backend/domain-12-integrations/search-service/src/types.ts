/**
 * Search Service - Type Definitions
 * Full-text search with indexing, filtering, aggregation, and relevance ranking
 */

/**
 * Search index type
 */
export type SearchIndexType = 'text' | 'numeric' | 'date' | 'keyword' | 'boolean' | 'geo';

/**
 * Search operator
 */
export type SearchOperator = 'AND' | 'OR' | 'NOT' | 'PHRASE' | 'WILDCARD' | 'RANGE' | 'FUZZY';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Aggregation type
 */
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'cardinality' | 'terms' | 'date_histogram' | 'range' | 'percentiles';

/**
 * Relevance ranking algorithm
 */
export type RankingAlgorithm = 'BM25' | 'TF-IDF' | 'LMD' | 'vector' | 'custom';

/**
 * Highlight fragment type
 */
export type HighlightType = 'unified' | 'plain' | 'postings';

/**
 * Search document
 */
export interface ISearchDocument<T = any> {
  id: string;
  content: T;
  fields?: Record<string, any>;
  timestamp: Date;
  version: number;
  indexed: boolean;
  metadata?: Record<string, any>;
}

/**
 * Search field configuration
 */
export interface ISearchFieldConfig {
  name: string;
  type: SearchIndexType;
  indexed: boolean;
  stored: boolean;
  analyzer?: string;
  boost?: number;
  fields?: ISearchFieldConfig[];
}

/**
 * Search index configuration
 */
export interface ISearchIndexConfig {
  indexId: string;
  name: string;
  description?: string;
  fields: ISearchFieldConfig[];
  analyzer: 'standard' | 'simple' | 'whitespace' | 'stop' | 'custom';
  tokenizer: 'standard' | 'keyword' | 'whitespace' | 'pattern';
  rankingAlgorithm: RankingAlgorithm;
  enableHighlighting: boolean;
  enableAggregation: boolean;
  enableFacets: boolean;
  maxResultSize: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Search query
 */
export interface ISearchQuery {
  text?: string;
  operator?: SearchOperator;
  filters?: ISearchFilter[];
  facets?: string[];
  aggregations?: ISearchAggregation[];
  sort?: Array<{
    field: string;
    order: SortOrder;
  }>;
  highlight?: {
    enabled: boolean;
    fields?: string[];
    fragmentSize?: number;
    type?: HighlightType;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  boost?: Record<string, number>;
  fuzzy?: {
    enabled: boolean;
    maxEdits: number;
  };
  spelling?: {
    enabled: boolean;
    maxSuggestions: number;
  };
}

/**
 * Search filter
 */
export interface ISearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists' | 'range';
  value?: any;
  values?: any[];
  range?: {
    min?: any;
    max?: any;
    inclusive?: boolean;
  };
}

/**
 * Search aggregation
 */
export interface ISearchAggregation {
  name: string;
  type: AggregationType;
  field?: string;
  size?: number;
  intervals?: string;
  ranges?: Array<{
    from?: number;
    to?: number;
  }>;
  percentiles?: number[];
}

/**
 * Search result
 */
export interface ISearchResult<T = any> {
  id: string;
  source: T;
  score: number;
  highlight?: Record<string, string[]>;
  fields?: Record<string, any>;
  sortValues?: any[];
}

/**
 * Search response
 */
export interface ISearchResponse<T = any> {
  responseId: string;
  timestamp: Date;
  totalHits: number;
  duration: number;
  results: ISearchResult<T>[];
  aggregations?: Record<string, any>;
  facets?: Record<string, Array<{
    value: string;
    count: number;
  }>>;
  suggestions?: string[];
  nextPage?: number;
  totalPages: number;
}

/**
 * Search statistics
 */
export interface ISearchStats {
  totalIndexes: number;
  totalDocuments: number;
  totalSearches: number;
  averageSearchTime: number;
  successfulSearches: number;
  failedSearches: number;
  emptyResults: number;
  indexSize: number;
  lastUpdated: Date;
}

/**
 * Search health check
 */
export interface ISearchHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  indexes: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    documentCount: number;
    indexSize: number;
  }>;
}

/**
 * Search listener
 */
export type SearchListener = (event: ISearchEvent) => Promise<void> | void;

/**
 * Search event
 */
export interface ISearchEvent {
  eventId: string;
  timestamp: Date;
  type: 'index' | 'search' | 'update' | 'delete' | 'reindex' | 'error';
  indexId?: string;
  documentId?: string;
  query?: string;
  resultCount?: number;
  duration?: number;
  error?: string;
}

/**
 * Search analyzer configuration
 */
export interface ISearchAnalyzerConfig {
  name: string;
  tokenizer: string;
  filters?: string[];
  charFilters?: string[];
}

/**
 * Search suggestion
 */
export interface ISearchSuggestion {
  text: string;
  score: number;
  frequency: number;
}

/**
 * Search facet
 */
export interface ISearchFacet {
  field: string;
  values: Array<{
    value: any;
    count: number;
    percentage?: number;
  }>;
}

/**
 * Search boost rule
 */
export interface ISearchBoostRule {
  ruleId: string;
  name: string;
  condition: (doc: ISearchDocument) => boolean;
  boostFactor: number;
  enabled: boolean;
  createdAt: Date;
}

/**
 * Search ranking profile
 */
export interface ISearchRankingProfile {
  profileId: string;
  name: string;
  algorithm: RankingAlgorithm;
  boostRules?: ISearchBoostRule[];
  fieldWeights?: Record<string, number>;
  createdAt: Date;
}

/**
 * Search index mapping
 */
export interface ISearchIndexMapping {
  mappingId: string;
  indexId: string;
  properties: Record<string, {
    type: SearchIndexType;
    analyzer?: string;
    index?: boolean;
    store?: boolean;
  }>;
  createdAt: Date;
}

/**
 * Search bulk operation
 */
export interface ISearchBulkOperation {
  operationId: string;
  timestamp: Date;
  type: 'index' | 'update' | 'delete';
  documentCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  errors?: Array<{
    documentId: string;
    error: string;
  }>;
}

/**
 * Search cursor
 */
export interface ISearchCursor {
  cursorId: string;
  indexId: string;
  query: ISearchQuery;
  batchSize: number;
  position: number;
  totalResults: number;
  hasMore: boolean;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Search term frequency
 */
export interface ISearchTermFrequency {
  term: string;
  frequency: number;
  documentFrequency: number;
  inverseDocumentFrequency: number;
}

/**
 * Search analytics
 */
export interface ISearchAnalytics {
  analyticsId: string;
  timestamp: Date;
  period: string;
  totalSearches: number;
  averageResults: number;
  topQueries: Array<{
    query: string;
    count: number;
  }>;
  searchesByStatus: Record<string, number>;
  averageResponseTime: number;
}

/**
 * Search service configuration
 */
export interface ISearchServiceConfig {
  maxIndexes: number;
  maxDocumentsPerIndex: number;
  defaultAnalyzer: string;
  defaultRankingAlgorithm: RankingAlgorithm;
  enableHighlighting: boolean;
  enableAggregation: boolean;
  enableFaceting: boolean;
  maxResultsPerQuery: number;
  queryTimeout: number;
  indexingBatchSize: number;
  enableMetrics: boolean;
  enableAnalytics: boolean;
  retentionDays: number;
  maxIndexSize: number;
}

/**
 * Search cache entry
 */
export interface ISearchCacheEntry {
  cacheId: string;
  queryHash: string;
  results: ISearchResponse;
  timestamp: Date;
  expiresAt: Date;
  hitCount: number;
}

/**
 * Search audit entry
 */
export interface ISearchAuditEntry {
  auditId: string;
  timestamp: Date;
  action: 'index' | 'search' | 'update' | 'delete';
  indexId?: string;
  documentId?: string;
  userId?: string;
  ipAddress?: string;
  status: 'success' | 'failure';
}

/**
 * Search performance metrics
 */
export interface ISearchPerformanceMetrics {
  timestamp: Date;
  indexingTime: number;
  searchTime: number;
  aggregationTime: number;
  highlightingTime: number;
  totalTime: number;
  documentsIndexed: number;
  searchesExecuted: number;
}

/**
 * Search sync status
 */
export interface ISearchSyncStatus {
  syncId: string;
  indexId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  documentsProcessed: number;
  totalDocuments: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}
