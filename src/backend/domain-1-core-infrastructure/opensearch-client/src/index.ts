/**
 * OpenSearch Client - Public API
 */

export { OpenSearchClient, createOpenSearchClient } from './main';

export type {
  IOpenSearchConfig,
  IIndexConfig,
  IIndexMappings,
  IFieldMapping,
  IDocument,
  ISearchQuery,
  IHighlight,
  ISearchResult,
  IBulkOperation,
  IBulkResponse,
  IIndexStats,
  IAlias,
  ITemplate,
  ISearchOptions,
  IIndexOptions,
  IUpdateRequest,
  IClusterHealth,
  IIndexHealth,
  SearchListener,
  ISearchStats,
  IQueryBuilderResult,
  IAggregationBucket,
  IReindexRequest,
  IPipeline,
} from './types';
