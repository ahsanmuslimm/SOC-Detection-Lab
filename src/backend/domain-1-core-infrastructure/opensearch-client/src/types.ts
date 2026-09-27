/**
 * OpenSearch Client - Type Definitions
 * Type definitions for search operations and index management
 */

/**
 * OpenSearch connection configuration
 */
export interface IOpenSearchConfig {
  nodes: string[];
  region?: string;
  username?: string;
  password?: string;
  requestTimeout?: number;
  maxRetries?: number;
  enableDebugLogging?: boolean;
  ssl?: {
    rejectUnauthorized?: boolean;
    certificateAuthority?: string;
  };
}

/**
 * Index configuration
 */
export interface IIndexConfig {
  name: string;
  numberOfShards?: number;
  numberOfReplicas?: number;
  refreshInterval?: string;
  settings?: Record<string, unknown>;
  mappings?: IIndexMappings;
}

/**
 * Index mappings
 */
export interface IIndexMappings {
  properties: Record<string, IFieldMapping>;
  dynamic?: boolean | 'strict';
}

/**
 * Field mapping
 */
export interface IFieldMapping {
  type: string;
  analyzer?: string;
  fields?: Record<string, IFieldMapping>;
  format?: string;
  index?: boolean;
  store?: boolean;
}

/**
 * Document
 */
export interface IDocument {
  _id?: string;
  _index?: string;
  _type?: string;
  _score?: number;
  _source: Record<string, unknown>;
  highlight?: Record<string, string[]>;
  fields?: Record<string, unknown>;
}

/**
 * Search query
 */
export interface ISearchQuery {
  query?: Record<string, unknown>;
  aggs?: Record<string, unknown>;
  sort?: Array<Record<string, unknown> | string>;
  from?: number;
  size?: number;
  highlight?: IHighlight;
  _source?: string[] | boolean;
  timeout?: string;
}

/**
 * Search highlight configuration
 */
export interface IHighlight {
  fields: Record<string, Record<string, unknown>>;
  preTags?: string[];
  postTags?: string[];
  fragmentSize?: number;
  numberOfFragments?: number;
}

/**
 * Search result
 */
export interface ISearchResult<T = any> {
  hits: {
    total: {
      value: number;
      relation: 'eq' | 'gte';
    };
    hits: IDocument[];
    max_score?: number;
  };
  aggregations?: Record<string, unknown>;
  took: number;
  timed_out: boolean;
}

/**
 * Bulk operation
 */
export interface IBulkOperation<T = any> {
  index?: { _index: string; _id?: string };
  create?: { _index: string; _id?: string };
  update?: { _index: string; _id?: string };
  delete?: { _index: string; _id?: string };
  doc?: T;
  doc_as_upsert?: boolean;
}

/**
 * Bulk response
 */
export interface IBulkResponse {
  errors: boolean;
  items: Array<{
    [action: string]: {
      _index: string;
      _id: string;
      status: number;
      error?: {
        type: string;
        reason: string;
      };
    };
  }>;
  took: number;
}

/**
 * Index stats
 */
export interface IIndexStats {
  indices: Record<
    string,
    {
      primaries: {
        docs: { count: number; deleted: number };
        store: { size_in_bytes: number };
        indexing: {
          index_total: number;
          index_time_in_millis: number;
          delete_total: number;
        };
        search: {
          query_total: number;
          query_time_in_millis: number;
        };
      };
    }
  >;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
}

/**
 * Alias
 */
export interface IAlias {
  index: string;
  alias: string;
  routing?: string;
  filter?: Record<string, unknown>;
  isWriteIndex?: boolean;
}

/**
 * Template
 */
export interface ITemplate {
  name: string;
  indexPattern: string;
  settings?: Record<string, unknown>;
  mappings?: IIndexMappings;
  priority?: number;
}

/**
 * Search request options
 */
export interface ISearchOptions {
  timeout?: number;
  retryOnTimeout?: boolean;
  consistencyLevel?: 'one' | 'quorum' | 'all';
}

/**
 * Index request options
 */
export interface IIndexOptions {
  refresh?: boolean | 'wait_for';
  timeout?: number;
  version?: number;
  versionType?: 'internal' | 'external' | 'external_gte';
}

/**
 * Update request
 */
export interface IUpdateRequest<T = any> {
  doc?: Partial<T>;
  doc_as_upsert?: boolean;
  script?: {
    source: string;
    params?: Record<string, unknown>;
  };
}

/**
 * Scroll context
 */
export interface IScrollContext {
  scrollId: string;
  ttl: string;
  size: number;
  totalHits: number;
  currentIndex: number;
}

/**
 * Query builder result
 */
export interface IQueryBuilderResult {
  query: Record<string, unknown>;
  aggs?: Record<string, unknown>;
  sort?: Array<Record<string, unknown> | string>;
  timeout?: string;
}

/**
 * Index health
 */
export interface IIndexHealth {
  status: 'green' | 'yellow' | 'red';
  numberOfShards: number;
  numberOfReplicas: number;
  activePrimaryShards: number;
  activeShards: number;
  relocatingShards: number;
  initializingShards: number;
  unassignedShards: number;
}

/**
 * Cluster health
 */
export interface IClusterHealth {
  status: 'green' | 'yellow' | 'red';
  numberOfNodes: number;
  numberOfDataNodes: number;
  activePrimaryShards: number;
  activeShards: number;
  relocatingShards: number;
  initializingShards: number;
  unassignedShards: number;
  delayedUnassignedShards: number;
  numberOfPendingTasks: number;
  numberOfInFlightFetch: number;
  taskMaxWaitingTimeMillis: number;
  activeShardsPercentAsNumber: number;
  indices?: Record<string, IIndexHealth>;
}

/**
 * Search listener
 */
export type SearchListener = (stats: ISearchStats) => void;

/**
 * Index listener
 */
export type IndexListener = (stats: IIndexStats) => void;

/**
 * Search statistics
 */
export interface ISearchStats {
  query: string;
  duration: number;
  hitsCount: number;
  timestamp: Date;
  error?: string;
}

/**
 * Aggregation bucket
 */
export interface IAggregationBucket {
  key: string | number;
  doc_count: number;
  [key: string]: unknown;
}

/**
 * Reindex request
 */
export interface IReindexRequest {
  sourceIndex: string;
  destIndex: string;
  query?: Record<string, unknown>;
  script?: {
    source: string;
    params?: Record<string, unknown>;
  };
  conflicts?: 'abort' | 'proceed';
  size?: number;
}

/**
 * Pipeline (ingest)
 */
export interface IPipeline {
  name: string;
  description?: string;
  processors: Array<Record<string, unknown>>;
  onFailure?: Array<Record<string, unknown>>;
}
