/**
 * Search Service - Public API Exports
 * Full-text search with indexing, filtering, aggregation, and relevance ranking
 */

export { SearchService, createSearchService } from './main';
export type {
  SearchIndexType,
  SearchOperator,
  SortOrder,
  AggregationType,
  RankingAlgorithm,
  HighlightType,
  ISearchDocument,
  ISearchFieldConfig,
  ISearchIndexConfig,
  ISearchQuery,
  ISearchFilter,
  ISearchAggregation,
  ISearchResult,
  ISearchResponse,
  ISearchStats,
  ISearchHealthCheck,
  SearchListener,
  ISearchEvent,
  ISearchAnalyzerConfig,
  ISearchSuggestion,
  ISearchFacet,
  ISearchBoostRule,
  ISearchRankingProfile,
  ISearchIndexMapping,
  ISearchBulkOperation,
  ISearchCursor,
  ISearchTermFrequency,
  ISearchAnalytics,
  ISearchServiceConfig,
  ISearchCacheEntry,
  ISearchAuditEntry,
  ISearchPerformanceMetrics,
  ISearchSyncStatus,
} from './types';
