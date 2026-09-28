/**
 * Storage Service - Unit Tests
 */

import { StorageService, createStorageService, IStorageServiceConfig, IStorageEvent } from '../../src/index';

describe('Storage Service', () => {
  let service: StorageService;

  const config: IStorageServiceConfig = {
    maxBuckets: 100,
    maxObjectsPerBucket: 10000,
    maxObjectSize: 5242880, // 5 MB
    maxBucketSize: 1073741824, // 1 GB
    enableVersioning: true,
    enableLifecycle: true,
    enableEncryption: true,
    enableAccessControl: true,
    enableMetrics: true,
    enableAudit: true,
    maxAuditEntries: 10000,
    enableReplication: false,
    retentionDays: 7,
    cleanupIntervalMs: 60000,
    enableCors: true,
    corsOrigins: ['*'],
  };

  beforeEach(() => {
    service = createStorageService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Bucket Operations', () => {
    test('should create bucket successfully', () => {
      const bucketId = service.createBucket({
        name: 'test-bucket',
        description: 'Test bucket',
        region: 'us-east-1',
        encryption: 'AES256',
        versioningEnabled: true,
        publicRead: false,
        corsEnabled: true,
        lifecycleEnabled: true,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      expect(bucketId).toBeDefined();
      expect(bucketId).toMatch(/^b_/);

      const bucket = service.getBucket(bucketId);
      expect(bucket).toBeDefined();
      expect(bucket?.name).toBe('test-bucket');
      expect(bucket?.region).toBe('us-east-1');
      expect(bucket?.versioningEnabled).toBe(true);
    });

    test('should list all buckets', () => {
      const bucket1Id = service.createBucket({
        name: 'bucket1',
        region: 'us-east-1',
        encryption: 'AES256',
        versioningEnabled: true,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      const bucket2Id = service.createBucket({
        name: 'bucket2',
        region: 'us-west-2',
        encryption: 'KMS',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      const buckets = service.listBuckets();
      expect(buckets.length).toBe(2);
      expect(buckets.map((b) => b.bucketId)).toContain(bucket1Id);
      expect(buckets.map((b) => b.bucketId)).toContain(bucket2Id);
    });

    test('should delete empty bucket', () => {
      const bucketId = service.createBucket({
        name: 'empty-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      const deleted = service.deleteBucket(bucketId);
      expect(deleted).toBe(true);
      expect(service.getBucket(bucketId)).toBeNull();
    });

    test('should fail to delete non-empty bucket without force', () => {
      const bucketId = service.createBucket({
        name: 'non-empty-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      service.putObject(bucketId, 'test.txt', 'Hello World');

      expect(() => {
        service.deleteBucket(bucketId, false);
      }).toThrow();
    });

    test('should throw error when bucket limit exceeded', () => {
      const smallConfig: IStorageServiceConfig = { ...config, maxBuckets: 1 };
      const smallService = createStorageService(smallConfig);

      smallService.createBucket({
        name: 'bucket1',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      expect(() => {
        smallService.createBucket({
          name: 'bucket2',
          region: 'us-east-1',
          encryption: 'none',
          versioningEnabled: false,
          publicRead: false,
          corsEnabled: false,
          lifecycleEnabled: false,
          maxObjectSize: 5242880,
          maxBucketSize: 1073741824,
        });
      }).toThrow();

      smallService.stop();
    });
  });

  describe('Object Operations', () => {
    let bucketId: string;

    beforeEach(() => {
      bucketId = service.createBucket({
        name: 'test-bucket',
        region: 'us-east-1',
        encryption: 'AES256',
        versioningEnabled: true,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });
    });

    test('should put object successfully', () => {
      const objectId = service.putObject(bucketId, 'test.txt', 'Hello World');

      expect(objectId).toBeDefined();
      expect(objectId).toMatch(/^obj_/);

      const object = service.getObject(bucketId, objectId);
      expect(object).toBeDefined();
      expect(object?.key).toBe('test.txt');
      expect(object?.size).toBe(11);
    });

    test('should get object by key', () => {
      service.putObject(bucketId, 'document.pdf', Buffer.from('PDF content'));

      const object = service.getObjectByKey(bucketId, 'document.pdf');
      expect(object).toBeDefined();
      expect(object?.key).toBe('document.pdf');
      expect(object?.mimeType).toBe('application/pdf');
    });

    test('should list objects', () => {
      service.putObject(bucketId, 'file1.txt', 'Content 1');
      service.putObject(bucketId, 'file2.txt', 'Content 2');
      service.putObject(bucketId, 'file3.json', 'Content 3');

      const objects = service.listObjects(bucketId);
      expect(objects.length).toBe(3);
    });

    test('should list objects with prefix', () => {
      service.putObject(bucketId, 'logs/app.log', 'App logs');
      service.putObject(bucketId, 'logs/error.log', 'Error logs');
      service.putObject(bucketId, 'data/file.json', 'Data');

      const logObjects = service.listObjects(bucketId, 'logs/');
      expect(logObjects.length).toBe(2);
      expect(logObjects.every((o) => o.key.startsWith('logs/'))).toBe(true);
    });

    test('should delete object soft delete', () => {
      const objectId = service.putObject(bucketId, 'temp.txt', 'Temporary');

      const deleted = service.deleteObject(bucketId, objectId, false);
      expect(deleted).toBe(true);

      const object = service.getObject(bucketId, objectId);
      expect(object).toBeNull();
    });

    test('should delete object permanent', () => {
      const objectId = service.putObject(bucketId, 'permanent.txt', 'Content');

      const deleted = service.deleteObject(bucketId, objectId, true);
      expect(deleted).toBe(true);

      const object = service.getObject(bucketId, objectId);
      expect(object).toBeNull();
    });

    test('should copy object', () => {
      const sourceId = service.putObject(bucketId, 'source.txt', 'Source content');

      const destId = service.copyObject(bucketId, {
        sourceKey: 'source.txt',
        destinationKey: 'destination.txt',
      });

      expect(destId).toBeDefined();
      expect(destId).not.toBe(sourceId);

      const dest = service.getObjectByKey(bucketId, 'destination.txt');
      expect(dest?.key).toBe('destination.txt');
    });

    test('should throw error for oversized object', () => {
      const smallConfig: IStorageServiceConfig = { ...config, maxObjectSize: 100 };
      const smallService = createStorageService(smallConfig);

      const bucketId = smallService.createBucket({
        name: 'small-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 100,
        maxBucketSize: 1073741824,
      });

      expect(() => {
        smallService.putObject(bucketId, 'huge.bin', 'x'.repeat(200));
      }).toThrow();

      smallService.stop();
    });
  });

  describe('Search and Filter', () => {
    let bucketId: string;

    beforeEach(() => {
      bucketId = service.createBucket({
        name: 'search-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      service.putObject(bucketId, 'image1.png', 'PNG data', { metadata: { size: 'large' } });
      service.putObject(bucketId, 'image2.jpg', 'JPG data', { metadata: { size: 'small' } });
      service.putObject(bucketId, 'doc.pdf', 'PDF data', { metadata: { size: 'medium' } });
    });

    test('should search by prefix', () => {
      const results = service.searchObjects(bucketId, { prefix: 'image' });
      expect(results.length).toBe(2);
      expect(results.every((o) => o.key.startsWith('image'))).toBe(true);
    });

    test('should search by mime type', () => {
      const results = service.searchObjects(bucketId, { mimeType: 'image/png' });
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('image1.png');
    });

    test('should search by size range', () => {
      service.putObject(bucketId, 'large.bin', 'x'.repeat(1000));
      service.putObject(bucketId, 'small.txt', 'y');

      const results = service.searchObjects(bucketId, { minSize: 10, maxSize: 500 });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Versioning', () => {
    let bucketId: string;

    beforeEach(() => {
      bucketId = service.createBucket({
        name: 'versioned-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: true,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });
    });

    test('should track object versions', () => {
      const objectId = service.putObject(bucketId, 'versioned.txt', 'Version 1');
      service.putObject(bucketId, 'versioned.txt', 'Version 2');
      service.putObject(bucketId, 'versioned.txt', 'Version 3');

      const versions = service.getObjectVersions(bucketId, objectId);
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.some((v) => v.isLatest)).toBe(true);
    });
  });

  describe('Trash and Restore', () => {
    let bucketId: string;

    beforeEach(() => {
      bucketId = service.createBucket({
        name: 'trash-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });
    });

    test('should move deleted object to trash', () => {
      const objectId = service.putObject(bucketId, 'trash.txt', 'To be deleted');
      service.deleteObject(bucketId, objectId, false);

      const trash = service.getTrash(bucketId);
      expect(trash?.totalItems).toBe(1);
      expect(trash?.items.some((i) => i.objectId === objectId)).toBe(true);
    });

    test('should restore object from trash', () => {
      const objectId = service.putObject(bucketId, 'restore.txt', 'Restore me');
      service.deleteObject(bucketId, objectId, false);

      const restored = service.restoreObject(bucketId, objectId);
      expect(restored).toBe(true);

      const object = service.getObject(bucketId, objectId);
      expect(object?.isDeleted).toBe(false);
    });

    test('should empty trash', () => {
      service.putObject(bucketId, 'file1.txt', 'Content 1');
      service.putObject(bucketId, 'file2.txt', 'Content 2');

      const objs = service.listObjects(bucketId);
      objs.forEach((obj) => service.deleteObject(bucketId, obj.objectId, false));

      const trash = service.getTrash(bucketId);
      expect(trash?.totalItems).toBe(2);

      const purged = service.emptyTrash(bucketId);
      expect(purged).toBe(2);
      expect(service.getTrash(bucketId)?.totalItems).toBe(0);
    });
  });

  describe('Statistics', () => {
    let bucketId: string;

    beforeEach(() => {
      bucketId = service.createBucket({
        name: 'stats-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });
    });

    test('should track storage stats', () => {
      service.putObject(bucketId, 'file1.txt', 'Content 1');
      service.putObject(bucketId, 'file2.txt', 'Content 2');

      const stats = service.getStats(bucketId);
      expect(stats?.totalObjects).toBe(2);
      expect(stats?.totalSize).toBeGreaterThan(0);
    });

    test('should get capacity info', () => {
      service.putObject(bucketId, 'file.txt', 'x'.repeat(100));

      const capacity = service.getCapacity(bucketId);
      expect(capacity?.utilizationPercentage).toBeGreaterThan(0);
      expect(capacity?.remainingCapacity).toBeLessThan(capacity?.maxBucketSize!);
    });

    test('should get object metadata', () => {
      const objectId = service.putObject(bucketId, 'meta.json', '{"key": "value"}');

      const metadata = service.getMetadata(bucketId, objectId);
      expect(metadata?.objectId).toBe(objectId);
      expect(metadata?.mimeType).toBe('application/json');
      expect(metadata?.isEncrypted).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    let bucketId: string;

    beforeEach(() => {
      bucketId = service.createBucket({
        name: 'batch-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });
    });

    test('should batch delete objects', () => {
      service.putObject(bucketId, 'file1.txt', 'Content 1');
      service.putObject(bucketId, 'file2.txt', 'Content 2');
      service.putObject(bucketId, 'file3.txt', 'Content 3');

      const result = service.batchDelete(bucketId, {
        keys: ['file1.txt', 'file2.txt', 'file3.txt'],
      });

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
    });
  });

  describe('Health Check', () => {
    test('should perform health check', async () => {
      const bucketId = service.createBucket({
        name: 'health-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      service.putObject(bucketId, 'test.txt', 'Health check');

      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
      expect(health.buckets.length).toBeGreaterThan(0);
      expect(health.buckets[0].name).toBe('health-bucket');
    });
  });

  describe('Event Listeners', () => {
    test('should emit storage events', () => {
      const events: IStorageEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      const bucketId = service.createBucket({
        name: 'event-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      service.putObject(bucketId, 'event.txt', 'Event test');

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'bucket-created')).toBe(true);
      expect(events.some((e) => e.type === 'object-created')).toBe(true);
    });

    test('should emit delete event', () => {
      const events: IStorageEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      const bucketId = service.createBucket({
        name: 'delete-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      const objectId = service.putObject(bucketId, 'delete.txt', 'Delete me');
      service.deleteObject(bucketId, objectId);

      const deleteEvents = events.filter((e) => e.type === 'object-deleted');
      expect(deleteEvents.length).toBeGreaterThan(0);
    });

    test('should emit restore event', () => {
      const events: IStorageEvent[] = [];

      service.onEvent(async (event) => {
        events.push(event);
      });

      const bucketId = service.createBucket({
        name: 'restore-bucket',
        region: 'us-east-1',
        encryption: 'none',
        versioningEnabled: false,
        publicRead: false,
        corsEnabled: false,
        lifecycleEnabled: false,
        maxObjectSize: 5242880,
        maxBucketSize: 1073741824,
      });

      const objectId = service.putObject(bucketId, 'restore.txt', 'Restore');
      service.deleteObject(bucketId, objectId, false);
      service.restoreObject(bucketId, objectId);

      const restoreEvents = events.filter((e) => e.type === 'object-restored');
      expect(restoreEvents.length).toBeGreaterThan(0);
    });
  });
});
