/**
 * Storage Service - Public API
 */

export { StorageService, createStorageService } from './main';

export type {
  IStorageObject,
  IStorageBucket,
  IStorageObjectVersion,
  ILifecyclePolicy,
  ILifecycleRule,
  IStorageACL,
  IGrant,
  IUploadSession,
  IPart,
  IMultipartUpload,
  IStorageStats,
  IStorageHealthCheck,
  IStorageEvent,
  StorageListener,
  ICopyOptions,
  IDownloadOptions,
  IBatchOperationResult,
  IStorageMetrics,
  IStorageAuditEntry,
  IStoragePrefixList,
  ISignedUrl,
  IStorageServiceConfig,
  IRestoreOptions,
  IStorageSearchOptions,
  IObjectMetadata,
  IBatchDeleteOptions,
  IStorageOperationResult,
  IStorageCapacityInfo,
  IRestorationItem,
  IStorageTrash,
  IPresignedPostPolicy,
  StorageTier,
} from './types';
