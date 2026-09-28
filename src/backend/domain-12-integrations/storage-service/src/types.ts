/**
 * Storage Service - Type Definitions
 * File/blob storage with lifecycle policies, versioning, and access control
 */

/**
 * Storage object
 */
export interface IStorageObject {
  objectId: string;
  bucketId: string;
  key: string;
  size: number;
  mimeType: string;
  etag: string;
  content?: Buffer | string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isDeleted: boolean;
  versionId?: string;
}

/**
 * Storage bucket
 */
export interface IStorageBucket {
  bucketId: string;
  name: string;
  description?: string;
  region: string;
  encryption: 'AES256' | 'KMS' | 'none';
  versioningEnabled: boolean;
  publicRead: boolean;
  corsEnabled: boolean;
  lifecycleEnabled: boolean;
  maxObjectSize: number;
  maxBucketSize: number;
  createdAt: Date;
  updatedAt: Date;
  arn?: string;
}

/**
 * Storage object version
 */
export interface IStorageObjectVersion {
  versionId: string;
  objectId: string;
  bucketId: string;
  key: string;
  size: number;
  mimeType: string;
  etag: string;
  createdAt: Date;
  isLatest: boolean;
  metadata?: Record<string, any>;
}

/**
 * Lifecycle policy
 */
export interface ILifecyclePolicy {
  policyId: string;
  bucketId: string;
  name: string;
  rules: ILifecycleRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lifecycle rule
 */
export interface ILifecycleRule {
  ruleId: string;
  prefix: string;
  enabled: boolean;
  tagFilters?: Record<string, string>;
  expiration?: {
    days: number;
    date?: Date;
    expireMarkedDeleteMarkers?: boolean;
  };
  transition?: {
    days: number;
    storageClass: 'STANDARD' | 'INFREQUENT_ACCESS' | 'GLACIER' | 'DEEP_ARCHIVE';
  };
  noncurrentVersionExpiration?: {
    days: number;
  };
  abortIncompleteMultipart?: {
    days: number;
  };
}

/**
 * Storage access control
 */
export interface IStorageACL {
  aclId: string;
  objectId?: string;
  bucketId?: string;
  grants: IGrant[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Grant
 */
export interface IGrant {
  grantId: string;
  grantee: {
    type: 'user' | 'group' | 'service';
    id: string;
    email?: string;
  };
  permission: 'READ' | 'WRITE' | 'FULL_CONTROL' | 'READ_ACP' | 'WRITE_ACP';
}

/**
 * Storage tier
 */
export type StorageTier = 'STANDARD' | 'INFREQUENT_ACCESS' | 'GLACIER' | 'DEEP_ARCHIVE';

/**
 * Upload session
 */
export interface IUploadSession {
  sessionId: string;
  bucketId: string;
  key: string;
  uploadId: string;
  parts: IPart[];
  totalParts: number;
  uploadedParts: number;
  status: 'active' | 'completed' | 'aborted';
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Upload part
 */
export interface IPart {
  partNumber: number;
  size: number;
  etag: string;
  uploadedAt: Date;
}

/**
 * Multipart upload
 */
export interface IMultipartUpload {
  uploadId: string;
  bucketId: string;
  key: string;
  status: 'active' | 'completed' | 'aborted';
  parts: IPart[];
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Storage statistics
 */
export interface IStorageStats {
  bucketId: string;
  totalObjects: number;
  totalSize: number;
  totalVersions: number;
  averageObjectSize: number;
  largestObjectSize: number;
  oldestObjectDate: Date;
  newestObjectDate: Date;
  objectsByMimeType: Record<string, number>;
  objectsByTier: Record<string, number>;
  updatedAt: Date;
}

/**
 * Storage health check
 */
export interface IStorageHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  buckets: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    objectCount: number;
    totalSize: number;
    utilizationPercentage: number;
  }>;
}

/**
 * Storage event
 */
export interface IStorageEvent {
  eventId: string;
  timestamp: Date;
  type: 'object-created' | 'object-updated' | 'object-deleted' | 'object-restored' | 'bucket-created' | 'bucket-deleted' | 'lifecycle-applied';
  bucketId?: string;
  objectId?: string;
  key?: string;
  size?: number;
  details?: Record<string, any>;
}

/**
 * Storage listener
 */
export type StorageListener = (event: IStorageEvent) => Promise<void> | void;

/**
 * Copy options
 */
export interface ICopyOptions {
  sourceKey: string;
  sourceBucket?: string;
  destinationKey: string;
  metadata?: Record<string, any>;
  acl?: string;
  versionId?: string;
}

/**
 * Download options
 */
export interface IDownloadOptions {
  range?: {
    start: number;
    end: number;
  };
  versionId?: string;
  ifModifiedSince?: Date;
  ifUnmodifiedSince?: Date;
  ifMatch?: string;
  ifNoneMatch?: string;
}

/**
 * Batch operation result
 */
export interface IBatchOperationResult {
  successCount: number;
  failureCount: number;
  objectIds: string[];
  errors?: Array<{
    key: string;
    error: string;
  }>;
}

/**
 * Storage metrics
 */
export interface IStorageMetrics {
  timestamp: Date;
  putRate: number;
  getRate: number;
  deleteRate: number;
  averageUploadTime: number;
  averageDownloadTime: number;
  errorRate: number;
  bandwidthUtilization: number;
}

/**
 * Storage audit entry
 */
export interface IStorageAuditEntry {
  auditId: string;
  timestamp: Date;
  action: 'put' | 'get' | 'delete' | 'restore' | 'lifecycle-apply';
  bucketId: string;
  objectId?: string;
  key?: string;
  userId?: string;
  ipAddress?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
}

/**
 * Storage prefix list
 */
export interface IStoragePrefixList {
  bucketId: string;
  prefix: string;
  commonPrefixes: string[];
  objects: IStorageObject[];
  isTruncated: boolean;
  continuationToken?: string;
}

/**
 * Signed URL
 */
export interface ISignedUrl {
  url: string;
  expiresAt: Date;
  method: 'GET' | 'PUT' | 'DELETE' | 'HEAD';
}

/**
 * Storage service configuration
 */
export interface IStorageServiceConfig {
  maxBuckets: number;
  maxObjectsPerBucket: number;
  maxObjectSize: number;
  maxBucketSize: number;
  enableVersioning: boolean;
  enableLifecycle: boolean;
  enableEncryption: boolean;
  enableAccessControl: boolean;
  enableMetrics: boolean;
  enableAudit: boolean;
  maxAuditEntries: number;
  enableReplication: boolean;
  retentionDays: number;
  cleanupIntervalMs: number;
  enableCors: boolean;
  corsOrigins: string[];
}

/**
 * Storage restore options
 */
export interface IRestoreOptions {
  versionId?: string;
  fromTrash?: boolean;
}

/**
 * Storage search options
 */
export interface IStorageSearchOptions {
  prefix?: string;
  tags?: Record<string, string>;
  mimeType?: string;
  minSize?: number;
  maxSize?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  includeDeleted?: boolean;
}

/**
 * Object metadata
 */
export interface IObjectMetadata {
  objectId: string;
  key: string;
  size: number;
  mimeType: string;
  etag: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  storageClass: StorageTier;
  isEncrypted: boolean;
  isPublic: boolean;
}

/**
 * Storage batch delete options
 */
export interface IBatchDeleteOptions {
  keys: string[];
  versionIds?: string[];
}

/**
 * Storage operation result
 */
export interface IStorageOperationResult {
  success: boolean;
  objectId?: string;
  objectKey?: string;
  size?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Storage capacity info
 */
export interface IStorageCapacityInfo {
  bucketId: string;
  maxBucketSize: number;
  currentSize: number;
  maxObjectSize: number;
  utilizationPercentage: number;
  remainingCapacity: number;
}

/**
 * Storage restoration item
 */
export interface IRestorationItem {
  objectId: string;
  key: string;
  deletedAt: Date;
  originalSize: number;
  restoredAt?: Date;
}

/**
 * Storage trash
 */
export interface IStorageTrash {
  trashId: string;
  bucketId: string;
  items: IRestorationItem[];
  totalItems: number;
  totalSize: number;
  retentionDays: number;
  purgeDate: Date;
}

/**
 * Presigned POST policy
 */
export interface IPresignedPostPolicy {
  bucketId: string;
  key: string;
  expiresAt: Date;
  formData: Record<string, string>;
  postUrl: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}
