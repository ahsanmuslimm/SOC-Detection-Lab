/**
 * Storage Service - Main Implementation
 * File/blob storage with versioning, lifecycle policies, and access control
 */

import {
  IStorageObject,
  IStorageBucket,
  IStorageObjectVersion,
  ILifecyclePolicy,
  IStorageACL,
  IGrant,
  IUploadSession,
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
  IStorageSearchOptions,
  IObjectMetadata,
  IBatchDeleteOptions,
  IStorageOperationResult,
  IStorageCapacityInfo,
  IStorageTrash,
} from './types';

/**
 * Storage Service - Enterprise-grade file/blob storage
 */
export class StorageService {
  private buckets: Map<string, IStorageBucket>;
  private objects: Map<string, Map<string, IStorageObject>>;
  private versions: Map<string, IStorageObjectVersion[]>;
  private acls: Map<string, IStorageACL>;
  private uploadSessions: Map<string, IUploadSession>;
  private trash: Map<string, IStorageTrash>;
  private listeners: StorageListener[];
  private stats: Map<string, IStorageStats>;
  private metrics: IStorageMetrics[];
  private auditLog: IStorageAuditEntry[];
  private config: IStorageServiceConfig;
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(config: IStorageServiceConfig) {
    this.config = this.validateConfig(config);
    this.buckets = new Map();
    this.objects = new Map();
    this.versions = new Map();
    this.acls = new Map();
    this.uploadSessions = new Map();
    this.trash = new Map();
    this.listeners = [];
    this.stats = new Map();
    this.metrics = [];
    this.auditLog = [];

    this.startCleanupInterval();
  }

  private validateConfig(config: IStorageServiceConfig): IStorageServiceConfig {
    if (config.maxBuckets <= 0) {
      throw new Error('maxBuckets must be greater than 0');
    }
    if (config.maxObjectSize <= 0) {
      throw new Error('maxObjectSize must be greater than 0');
    }
    return config;
  }

  public createBucket(config: Omit<IStorageBucket, 'bucketId' | 'createdAt' | 'updatedAt'>): string {
    if (this.buckets.size >= this.config.maxBuckets) {
      throw new Error('Maximum bucket limit reached');
    }

    const bucketId = this.generateBucketId();
    const bucket: IStorageBucket = {
      ...config,
      bucketId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.buckets.set(bucketId, bucket);
    this.objects.set(bucketId, new Map());
    this.trash.set(bucketId, {
      trashId: this.generateTrashId(),
      bucketId,
      items: [],
      totalItems: 0,
      totalSize: 0,
      retentionDays: 30,
      purgeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    this.stats.set(bucketId, this.initializeStats(bucketId));

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'bucket-created',
      bucketId,
      details: { bucketName: bucket.name },
    });

    this.auditLog.push({
      auditId: this.generateAuditId(),
      timestamp: new Date(),
      action: 'put',
      bucketId,
      status: 'success',
      details: { action: 'create_bucket', bucketName: bucket.name },
    });

    return bucketId;
  }

  public getBucket(bucketId: string): IStorageBucket | null {
    return this.buckets.get(bucketId) || null;
  }

  public listBuckets(): IStorageBucket[] {
    return Array.from(this.buckets.values());
  }

  public deleteBucket(bucketId: string, force: boolean = false): boolean {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) return false;

    const objects = this.objects.get(bucketId);
    if (objects && objects.size > 0 && !force) {
      throw new Error('Bucket is not empty');
    }

    this.buckets.delete(bucketId);
    this.objects.delete(bucketId);
    this.versions.delete(bucketId);
    this.trash.delete(bucketId);
    this.stats.delete(bucketId);

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'bucket-deleted',
      bucketId,
      details: { bucketName: bucket.name },
    });

    return true;
  }

  public putObject(bucketId: string, key: string, content: Buffer | string, options?: { metadata?: Record<string, any>; tags?: Record<string, string> }): string {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) {
      throw new Error(`Bucket ${bucketId} not found`);
    }

    const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;
    const contentSize = contentBuffer.length;

    if (contentSize > this.config.maxObjectSize) {
      throw new Error('Object size exceeds maximum');
    }

    const bucketObjects = this.objects.get(bucketId)!;
    if (bucketObjects.size >= this.config.maxObjectsPerBucket) {
      throw new Error('Bucket object limit reached');
    }

    const objectId = this.generateObjectId();
    const etag = this.generateETag();
    const mimeType = this.getMimeType(key);

    const storageObject: IStorageObject = {
      objectId,
      bucketId,
      key,
      size: contentSize,
      mimeType,
      etag,
      content: contentBuffer,
      metadata: options?.metadata,
      tags: options?.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };

    bucketObjects.set(objectId, storageObject);

    if (bucket.versioningEnabled) {
      const version: IStorageObjectVersion = {
        versionId: this.generateVersionId(),
        objectId,
        bucketId,
        key,
        size: contentSize,
        mimeType,
        etag,
        createdAt: new Date(),
        isLatest: true,
        metadata: options?.metadata,
      };

      const versions = this.versions.get(bucketId) || [];
      versions.forEach((v) => {
        if (v.objectId === objectId) {
          v.isLatest = false;
        }
      });
      versions.push(version);
      this.versions.set(bucketId, versions);
    }

    const bucketStats = this.stats.get(bucketId)!;
    bucketStats.totalObjects++;
    bucketStats.totalSize += contentSize;

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'object-created',
      bucketId,
      objectId,
      key,
      size: contentSize,
    });

    this.auditLog.push({
      auditId: this.generateAuditId(),
      timestamp: new Date(),
      action: 'put',
      bucketId,
      objectId,
      key,
      status: 'success',
      details: { size: contentSize, mimeType },
    });

    return objectId;
  }

  public getObject(bucketId: string, objectId: string, options?: IDownloadOptions): IStorageObject | null {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) return null;

    const bucketObjects = this.objects.get(bucketId);
    if (!bucketObjects) return null;

    const object = bucketObjects.get(objectId);
    if (!object || object.isDeleted) return null;

    this.auditLog.push({
      auditId: this.generateAuditId(),
      timestamp: new Date(),
      action: 'get',
      bucketId,
      objectId,
      key: object.key,
      status: 'success',
    });

    return object;
  }

  public getObjectByKey(bucketId: string, key: string): IStorageObject | null {
    const bucketObjects = this.objects.get(bucketId);
    if (!bucketObjects) return null;

    for (const [, object] of bucketObjects) {
      if (object.key === key && !object.isDeleted) {
        return object;
      }
    }

    return null;
  }

  public deleteObject(bucketId: string, objectId: string, permanent: boolean = false): boolean {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) return false;

    const bucketObjects = this.objects.get(bucketId);
    if (!bucketObjects) return false;

    const object = bucketObjects.get(objectId);
    if (!object) return false;

    if (permanent) {
      bucketObjects.delete(objectId);

      const bucketStats = this.stats.get(bucketId);
      if (bucketStats) {
        bucketStats.totalObjects--;
        bucketStats.totalSize -= object.size;
      }
    } else {
      object.isDeleted = true;

      const trash = this.trash.get(bucketId);
      if (trash) {
        trash.items.push({
          objectId,
          key: object.key,
          deletedAt: new Date(),
          originalSize: object.size,
        });
        trash.totalItems++;
        trash.totalSize += object.size;
      }
    }

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'object-deleted',
      bucketId,
      objectId,
      key: object.key,
    });

    this.auditLog.push({
      auditId: this.generateAuditId(),
      timestamp: new Date(),
      action: 'delete',
      bucketId,
      objectId,
      key: object.key,
      status: 'success',
    });

    return true;
  }

  public copyObject(bucketId: string, options: ICopyOptions): string {
    const source = this.getObjectByKey(bucketId, options.sourceKey);
    if (!source) {
      throw new Error('Source object not found');
    }

    const objectId = this.putObject(bucketId, options.destinationKey, source.content || Buffer.alloc(0), {
      metadata: options.metadata || source.metadata,
    });

    this.auditLog.push({
      auditId: this.generateAuditId(),
      timestamp: new Date(),
      action: 'put',
      bucketId,
      key: options.destinationKey,
      status: 'success',
      details: { sourceKey: options.sourceKey },
    });

    return objectId;
  }

  public listObjects(bucketId: string, prefix?: string): IStorageObject[] {
    const bucketObjects = this.objects.get(bucketId);
    if (!bucketObjects) return [];

    const objects: IStorageObject[] = [];
    for (const [, object] of bucketObjects) {
      if (!object.isDeleted && (!prefix || object.key.startsWith(prefix))) {
        objects.push(object);
      }
    }

    return objects.sort((a, b) => a.key.localeCompare(b.key));
  }

  public searchObjects(bucketId: string, options: IStorageSearchOptions): IStorageObject[] {
    const bucketObjects = this.objects.get(bucketId);
    if (!bucketObjects) return [];

    const results: IStorageObject[] = [];

    for (const [, object] of bucketObjects) {
      if (object.isDeleted) continue;

      if (options.prefix && !object.key.startsWith(options.prefix)) continue;
      if (options.mimeType && object.mimeType !== options.mimeType) continue;
      if (options.minSize && object.size < options.minSize) continue;
      if (options.maxSize && object.size > options.maxSize) continue;
      if (options.createdAfter && object.createdAt < options.createdAfter) continue;
      if (options.createdBefore && object.createdAt > options.createdBefore) continue;

      if (options.tags) {
        if (!object.tags) continue;
        const tagsMatch = Object.entries(options.tags).every(([key, value]) => object.tags?.[key] === value);
        if (!tagsMatch) continue;
      }

      results.push(object);
    }

    return results;
  }

  public restoreObject(bucketId: string, objectId: string): boolean {
    const bucketObjects = this.objects.get(bucketId);
    if (!bucketObjects) return false;

    const object = bucketObjects.get(objectId);
    if (!object) return false;

    object.isDeleted = false;

    const trash = this.trash.get(bucketId);
    if (trash) {
      trash.items = trash.items.filter((item) => item.objectId !== objectId);
      trash.totalItems--;
    }

    this.emitEvent({
      eventId: this.generateEventId(),
      timestamp: new Date(),
      type: 'object-restored',
      bucketId,
      objectId,
      key: object.key,
    });

    this.auditLog.push({
      auditId: this.generateAuditId(),
      timestamp: new Date(),
      action: 'restore',
      bucketId,
      objectId,
      key: object.key,
      status: 'success',
    });

    return true;
  }

  public batchDelete(bucketId: string, options: IBatchDeleteOptions): IBatchOperationResult {
    const result: IBatchOperationResult = {
      successCount: 0,
      failureCount: 0,
      objectIds: [],
      errors: [],
    };

    for (const key of options.keys) {
      try {
        const object = this.getObjectByKey(bucketId, key);
        if (object) {
          this.deleteObject(bucketId, object.objectId);
          result.objectIds.push(object.objectId);
          result.successCount++;
        }
      } catch (error) {
        result.failureCount++;
        result.errors?.push({
          key,
          error: (error as Error).message,
        });
      }
    }

    return result;
  }

  public getObjectVersions(bucketId: string, objectId: string): IStorageObjectVersion[] {
    const versions = this.versions.get(bucketId) || [];
    return versions.filter((v) => v.objectId === objectId);
  }

  public getTrash(bucketId: string): IStorageTrash | null {
    return this.trash.get(bucketId) || null;
  }

  public emptyTrash(bucketId: string): number {
    const trash = this.trash.get(bucketId);
    if (!trash) return 0;

    const itemCount = trash.totalItems;
    trash.items = [];
    trash.totalItems = 0;
    trash.totalSize = 0;

    return itemCount;
  }

  public getStats(bucketId: string): IStorageStats | null {
    return this.stats.get(bucketId) || null;
  }

  public getCapacity(bucketId: string): IStorageCapacityInfo | null {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) return null;

    const stats = this.stats.get(bucketId);
    if (!stats) return null;

    return {
      bucketId,
      maxBucketSize: bucket.maxBucketSize,
      currentSize: stats.totalSize,
      maxObjectSize: bucket.maxObjectSize,
      utilizationPercentage: (stats.totalSize / bucket.maxBucketSize) * 100,
      remainingCapacity: bucket.maxBucketSize - stats.totalSize,
    };
  }

  public getMetadata(bucketId: string, objectId: string): IObjectMetadata | null {
    const object = this.getObject(bucketId, objectId);
    if (!object) return null;

    return {
      objectId: object.objectId,
      key: object.key,
      size: object.size,
      mimeType: object.mimeType,
      etag: object.etag,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt,
      storageClass: 'STANDARD',
      isEncrypted: false,
      isPublic: false,
    };
  }

  public async performHealthCheck(): Promise<IStorageHealthCheck> {
    const buckets = Array.from(this.buckets.values()).map((bucket) => {
      const bucketObjects = this.objects.get(bucket.bucketId);
      const stats = this.stats.get(bucket.bucketId);

      const capacity = this.getCapacity(bucket.bucketId);
      const utilizationPercentage = capacity?.utilizationPercentage ?? 0;
      const status = utilizationPercentage > 90 ? 'degraded' : 'healthy';

      return {
        name: bucket.name,
        status: status as 'healthy' | 'degraded' | 'unhealthy',
        objectCount: bucketObjects?.size ?? 0,
        totalSize: stats?.totalSize ?? 0,
        utilizationPercentage,
      };
    });

    const overallStatus = buckets.some((b) => b.status === 'unhealthy') ? 'unhealthy' : buckets.some((b) => b.status === 'degraded') ? 'degraded' : 'healthy';

    return {
      status: overallStatus as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(),
      buckets,
    };
  }

  public onEvent(listener: StorageListener): this {
    this.listeners.push(listener);
    return this;
  }

  private initializeStats(bucketId: string): IStorageStats {
    return {
      bucketId,
      totalObjects: 0,
      totalSize: 0,
      totalVersions: 0,
      averageObjectSize: 0,
      largestObjectSize: 0,
      oldestObjectDate: new Date(),
      newestObjectDate: new Date(),
      objectsByMimeType: {},
      objectsByTier: {},
      updatedAt: new Date(),
    };
  }

  private async emitEvent(event: Omit<IStorageEvent, 'eventId'>): Promise<void> {
    const fullEvent: IStorageEvent = {
      eventId: this.generateEventId(),
      ...event,
    };

    for (const listener of this.listeners) {
      try {
        await Promise.resolve(listener(fullEvent));
      } catch (error) {
        console.error('Error in storage listener:', error);
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

    for (const [bucketId, trash] of this.trash) {
      const expiredItems = trash.items.filter((item) => now - item.deletedAt.getTime() > trash.retentionDays * 24 * 60 * 60 * 1000);

      for (const item of expiredItems) {
        const bucketObjects = this.objects.get(bucketId);
        if (bucketObjects) {
          bucketObjects.delete(item.objectId);
        }
      }

      trash.items = trash.items.filter((item) => !expiredItems.includes(item));
    }
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private generateBucketId(): string {
    return `b_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateObjectId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateETag(): string {
    return `"${Math.random().toString(36).substr(2, 16)}"`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTrashId(): string {
    return `trash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMimeType(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      json: 'application/json',
      xml: 'application/xml',
      csv: 'text/csv',
      txt: 'text/plain',
      html: 'text/html',
      js: 'application/javascript',
      ts: 'application/typescript',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      zip: 'application/zip',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

export function createStorageService(config: IStorageServiceConfig): StorageService {
  return new StorageService(config);
}
