# Storage Service

Enterprise-grade file and blob storage with versioning, lifecycle policies, access control, and multi-region support.

## Overview

The Storage Service provides a robust, scalable file and blob storage system designed for enterprise applications. It supports bucket management, versioning, soft delete with trash recovery, lifecycle policies, search and filtering, batch operations, comprehensive statistics, health monitoring, and event-driven architecture.

**Key Features:**
- Multiple bucket management with regional deployment
- Object versioning with latest version tracking
- Soft delete with trash recovery and retention policies
- Copy and move operations
- Prefix-based and tag-based search
- Batch delete operations
- Storage statistics and capacity tracking
- Health monitoring and diagnostics
- Event-driven architecture with listeners
- MIME type detection and metadata
- Configurable encryption (AES256, KMS, none)
- CORS support for web access
- Audit trail for all operations
- TTL-based automatic cleanup
- Storage tier management (STANDARD, INFREQUENT_ACCESS, GLACIER, DEEP_ARCHIVE)

## Architecture

### Core Components

1. **Bucket Manager**: Creates and manages storage buckets
2. **Object Store**: Handles object storage and retrieval
3. **Version Manager**: Tracks object versions and maintains version history
4. **Trash Manager**: Manages soft-deleted objects and recovery
5. **Search Engine**: Enables prefix and metadata-based search
6. **Statistics Collector**: Tracks storage metrics and capacity
7. **Event Emitter**: Publishes storage events to listeners
8. **Health Monitor**: Tracks storage system health
9. **Cleanup Engine**: Manages TTL expiration and trash purging
10. **Audit Logger**: Records all storage operations

### Data Flow

```
Bucket Creation
    ↓
Object Upload
    ↓
Metadata & Versioning (if enabled)
    ↓
Encryption (if configured)
    ↓
Storage
    ↓
Event Emission
    ↓
Statistics Update
```

## API Reference

### Creating the Service

```typescript
import { createStorageService, IStorageServiceConfig } from '@storage-service';

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

const service = createStorageService(config);
```

### Bucket Management

#### Create Bucket

```typescript
const bucketId = service.createBucket({
  name: 'my-bucket',
  description: 'My storage bucket',
  region: 'us-east-1',
  encryption: 'AES256',
  versioningEnabled: true,
  publicRead: false,
  corsEnabled: true,
  lifecycleEnabled: true,
  maxObjectSize: 5242880,
  maxBucketSize: 1073741824,
});
```

#### List Buckets

```typescript
const buckets = service.listBuckets();
buckets.forEach(bucket => {
  console.log(`${bucket.name} in ${bucket.region}`);
});
```

#### Get Bucket Info

```typescript
const bucket = service.getBucket(bucketId);
```

#### Delete Bucket

```typescript
service.deleteBucket(bucketId, false); // false = require empty
service.deleteBucket(bucketId, true);  // true = force delete
```

### Object Operations

#### Put Object

```typescript
// Simple put
const objectId = service.putObject(bucketId, 'file.txt', 'Content');

// Put with metadata and tags
const objectId = service.putObject(bucketId, 'document.pdf', pdfBuffer, {
  metadata: { department: 'finance', year: 2024 },
  tags: { classification: 'confidential', archived: 'false' },
});
```

#### Get Object

```typescript
// By object ID
const object = service.getObject(bucketId, objectId);

// By key
const object = service.getObjectByKey(bucketId, 'file.txt');
```

#### List Objects

```typescript
// List all
const allObjects = service.listObjects(bucketId);

// List with prefix
const reportObjects = service.listObjects(bucketId, 'reports/');
```

#### Delete Object

```typescript
// Soft delete (to trash)
service.deleteObject(bucketId, objectId, false);

// Permanent delete
service.deleteObject(bucketId, objectId, true);
```

#### Copy Object

```typescript
const newObjectId = service.copyObject(bucketId, {
  sourceKey: 'original.txt',
  destinationKey: 'backup/original.txt',
  metadata: { copied: true },
});
```

### Search and Filter

```typescript
// By prefix
const results = service.searchObjects(bucketId, { prefix: 'logs/' });

// By MIME type
const pdfs = service.searchObjects(bucketId, { mimeType: 'application/pdf' });

// By size range
const large = service.searchObjects(bucketId, { minSize: 1000000, maxSize: 10000000 });

// By date range
const recent = service.searchObjects(bucketId, {
  createdAfter: new Date('2024-01-01'),
  createdBefore: new Date('2024-12-31'),
});

// Combined search
const results = service.searchObjects(bucketId, {
  prefix: 'archive/',
  mimeType: 'application/pdf',
  minSize: 1024,
  createdBefore: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
});
```

### Versioning

```typescript
// Get all versions of an object
const versions = service.getObjectVersions(bucketId, objectId);

versions.forEach(version => {
  console.log(`Version: ${version.versionId}, Latest: ${version.isLatest}`);
});
```

### Trash and Recovery

```typescript
// Get trash info
const trash = service.getTrash(bucketId);
console.log(`Items in trash: ${trash?.totalItems}`);
console.log(`Trash size: ${trash?.totalSize} bytes`);

// Restore from trash
service.restoreObject(bucketId, objectId);

// Empty trash
const purged = service.emptyTrash(bucketId);
console.log(`Purged ${purged} items`);
```

### Statistics and Capacity

```typescript
// Get storage stats
const stats = service.getStats(bucketId);
console.log(`Objects: ${stats?.totalObjects}`);
console.log(`Total size: ${stats?.totalSize} bytes`);
console.log(`Average object size: ${stats?.averageObjectSize} bytes`);

// Get capacity info
const capacity = service.getCapacity(bucketId);
console.log(`Utilization: ${capacity?.utilizationPercentage}%`);
console.log(`Remaining: ${capacity?.remainingCapacity} bytes`);

// Get object metadata
const metadata = service.getMetadata(bucketId, objectId);
console.log(`MIME Type: ${metadata?.mimeType}`);
console.log(`Encrypted: ${metadata?.isEncrypted}`);
```

### Batch Operations

```typescript
// Batch delete
const result = service.batchDelete(bucketId, {
  keys: ['file1.txt', 'file2.txt', 'file3.txt'],
});

console.log(`Successful: ${result.successCount}`);
console.log(`Failed: ${result.failureCount}`);
```

### Health Check

```typescript
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);

health.buckets.forEach(bucket => {
  console.log(`${bucket.name}: ${bucket.status}`);
  console.log(`  Objects: ${bucket.objectCount}`);
  console.log(`  Utilization: ${bucket.utilizationPercentage}%`);
});
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Event: ${event.type}`);
  
  switch (event.type) {
    case 'object-created':
      console.log(`Created: ${event.key} (${event.size} bytes)`);
      break;
    case 'object-deleted':
      console.log(`Deleted: ${event.key}`);
      break;
    case 'object-restored':
      console.log(`Restored: ${event.key}`);
      break;
    case 'bucket-created':
      console.log(`Bucket created: ${event.bucketId}`);
      break;
  }
});
```

## Configuration

### IStorageServiceConfig

```typescript
interface IStorageServiceConfig {
  maxBuckets: number;               // Maximum number of buckets
  maxObjectsPerBucket: number;      // Max objects per bucket
  maxObjectSize: number;            // Max object size (bytes)
  maxBucketSize: number;            // Max bucket size (bytes)
  enableVersioning: boolean;        // Enable versioning
  enableLifecycle: boolean;         // Enable lifecycle policies
  enableEncryption: boolean;        // Enable encryption
  enableAccessControl: boolean;     // Enable ACLs
  enableMetrics: boolean;           // Collect metrics
  enableAudit: boolean;             // Log all operations
  maxAuditEntries: number;          // Audit log size limit
  enableReplication: boolean;       // Enable replication
  retentionDays: number;            // Trash retention days
  cleanupIntervalMs: number;        // Cleanup frequency
  enableCors: boolean;              // Enable CORS
  corsOrigins: string[];            // CORS origins
}
```

### Storage Tiers

| Tier | Description | Use Case |
|------|-------------|----------|
| **STANDARD** | Hot storage, immediate access | Active data, frequent access |
| **INFREQUENT_ACCESS** | Occasional access | Backups, logs, archives |
| **GLACIER** | Infrequent access, slow retrieval | Long-term archives |
| **DEEP_ARCHIVE** | Rare access, retrieval takes hours | Compliance, historical records |

### Encryption Options

- **AES256**: Server-side encryption with AES-256
- **KMS**: Key management service encryption
- **none**: No encryption

## Usage Examples

### Example 1: Document Management System

```typescript
// Create bucket for documents
const docBucketId = service.createBucket({
  name: 'company-documents',
  region: 'us-east-1',
  encryption: 'AES256',
  versioningEnabled: true,
  publicRead: false,
  corsEnabled: true,
  lifecycleEnabled: true,
  maxObjectSize: 52428800, // 50 MB
  maxBucketSize: 107374182400, // 100 GB
});

// Upload documents
service.putObject(docBucketId, 'policies/security.pdf', policyContent, {
  metadata: { department: 'security', version: '1.0' },
  tags: { classification: 'internal', year: '2024' },
});

// Search policies
const policies = service.searchObjects(docBucketId, {
  prefix: 'policies/',
  mimeType: 'application/pdf',
});

// Get statistics
const stats = service.getStats(docBucketId);
console.log(`Total documents: ${stats?.totalObjects}`);
```

### Example 2: Media Library

```typescript
// Create media bucket
const mediaBucketId = service.createBucket({
  name: 'media-library',
  region: 'us-west-2',
  encryption: 'none',
  versioningEnabled: false,
  publicRead: true,
  corsEnabled: true,
  lifecycleEnabled: false,
  maxObjectSize: 104857600, // 100 MB
  maxBucketSize: 1099511627776, // 1 TB
});

// Upload images
service.putObject(mediaBucketId, 'images/product1.jpg', jpgBuffer);
service.putObject(mediaBucketId, 'images/product2.png', pngBuffer);

// Search by MIME type
const images = service.searchObjects(mediaBucketId, {
  prefix: 'images/',
  mimeType: 'image/jpeg',
});

// Get media stats
const capacity = service.getCapacity(mediaBucketId);
console.log(`Used: ${(capacity?.currentSize / 1073741824).toFixed(2)} GB`);
console.log(`Available: ${(capacity?.remainingCapacity / 1073741824).toFixed(2)} GB`);
```

### Example 3: Backup and Archive

```typescript
// Create backup bucket with versioning
const backupBucketId = service.createBucket({
  name: 'backups',
  region: 'us-east-1',
  encryption: 'AES256',
  versioningEnabled: true,
  publicRead: false,
  corsEnabled: false,
  lifecycleEnabled: true,
  maxObjectSize: 5242880000, // 5 GB
  maxBucketSize: 10995116277760, // 10 TB
});

// Upload backup
const backupId = service.putObject(backupBucketId, 'db-backup-2024-01-15.tar.gz', backupData);

// Create restore point
service.copyObject(backupBucketId, {
  sourceKey: 'db-backup-2024-01-15.tar.gz',
  destinationKey: 'archive/db-backup-2024-01-15.tar.gz',
});

// Get versions
const versions = service.getObjectVersions(backupBucketId, backupId);
console.log(`Total versions: ${versions.length}`);
```

### Example 4: Trash Recovery

```typescript
// Accidentally delete file
const objectId = service.putObject(bucketId, 'important.doc', content);
service.deleteObject(bucketId, objectId, false);

// Check trash
const trash = service.getTrash(bucketId);
console.log(`Items in trash: ${trash?.totalItems}`);

// Recover from trash
service.restoreObject(bucketId, objectId);

// Verify recovery
const recovered = service.getObject(bucketId, objectId);
console.log(`Recovered: ${recovered !== null}`);
```

## Performance Considerations

### Object Sizing

- Recommended max object size: 5-100 MB
- Larger objects should use multipart upload
- Small objects: batch operations recommended

### Bucket Organization

- Use prefixes for logical organization
- Separate hot and cold data
- Consider regional distribution

### Versioning Impact

- Enables recovery and auditing
- Increases storage overhead
- Recommended for critical data

### Search Optimization

- Use prefixes before full scans
- Limit search result sets
- Cache frequent searches

## Best Practices

1. **Bucket Design**: Use descriptive names and organize by region/department
2. **Versioning**: Enable for critical data, disable for transient storage
3. **Encryption**: Use for sensitive data, especially PII
4. **Access Control**: Enable ACLs for sensitive data
5. **Trash Policy**: Set appropriate retention periods
6. **Monitoring**: Track storage usage and utilization regularly
7. **Cleanup**: Archive or delete old data periodically
8. **Metadata**: Use consistent metadata for searchability
9. **Tags**: Tag objects for organization and lifecycle policies
10. **Backup**: Maintain separate backup buckets for critical data

## Error Handling

Service handles:
- Bucket not found (returns null/false)
- Object size exceeded (throws error)
- Bucket capacity exceeded (throws error)
- Non-empty bucket deletion (throws error without force)
- Oversized objects (rejects on put)
- Invalid configurations (validation errors)

## Lifecycle Management

```typescript
// Create service
const service = createStorageService(config);

// Create buckets and store objects
const bucketId = service.createBucket({...});
const objectId = service.putObject(bucketId, 'file.txt', content);

// Use service
const object = service.getObject(bucketId, objectId);

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- storage-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- storage-service/demo.ts
```

## Dependencies

- **Built-in**: Node.js Buffer for binary data
- **Optional**: Cloud storage adapters (S3, GCS, Azure Blob)

## See Also

- [Cache Service](../cache-service/README.md) - Caching for frequent access
- [Audit Service](../audit-service/README.md) - Audit trail management
- [Logging Service](../logging-service/README.md) - Storage logging
- [Metrics Service](../metrics-service/README.md) - Storage metrics

## Version

1.0.0

## License

See repository LICENSE file
