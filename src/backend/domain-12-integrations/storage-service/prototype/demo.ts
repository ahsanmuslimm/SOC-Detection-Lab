/**
 * Storage Service - Demo Scenarios
 * Real-world usage patterns and integration examples
 */

import { createStorageService, IStorageServiceConfig, IStorageEvent } from '../src/index';

const config: IStorageServiceConfig = {
  maxBuckets: 100,
  maxObjectsPerBucket: 10000,
  maxObjectSize: 5242880,
  maxBucketSize: 1073741824,
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

/**
 * Demo 1: Basic Bucket Management
 */
async function demo1_BasicBucketManagement(): Promise<void> {
  console.log('\n=== Demo 1: Basic Bucket Management ===\n');

  // Create buckets
  const documentsBucketId = service.createBucket({
    name: 'documents',
    description: 'Store company documents',
    region: 'us-east-1',
    encryption: 'AES256',
    versioningEnabled: true,
    publicRead: false,
    corsEnabled: true,
    lifecycleEnabled: true,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  const imagesBucketId = service.createBucket({
    name: 'images',
    description: 'Store product images',
    region: 'us-west-2',
    encryption: 'KMS',
    versioningEnabled: false,
    publicRead: true,
    corsEnabled: true,
    lifecycleEnabled: false,
    maxObjectSize: 10485760,
    maxBucketSize: 10737418240,
  });

  console.log(`Created documents bucket: ${documentsBucketId}`);
  console.log(`Created images bucket: ${imagesBucketId}`);

  // List buckets
  const buckets = service.listBuckets();
  console.log(`\nTotal buckets: ${buckets.length}`);
  buckets.forEach((bucket) => {
    console.log(`  - ${bucket.name} (${bucket.region}, versioning: ${bucket.versioningEnabled})`);
  });

  // Get bucket info
  const docBucket = service.getBucket(documentsBucketId);
  console.log(`\nDocuments bucket info:`);
  console.log(`  Name: ${docBucket?.name}`);
  console.log(`  Region: ${docBucket?.region}`);
  console.log(`  Encryption: ${docBucket?.encryption}`);
  console.log(`  Max size: ${docBucket?.maxBucketSize} bytes`);
}

/**
 * Demo 2: Document Storage and Retrieval
 */
async function demo2_DocumentStorageAndRetrieval(): Promise<void> {
  console.log('\n=== Demo 2: Document Storage and Retrieval ===\n');

  const bucketId = service.createBucket({
    name: 'company-docs',
    region: 'us-east-1',
    encryption: 'AES256',
    versioningEnabled: true,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  // Store documents
  const doc1Id = service.putObject(bucketId, 'policies/security-policy.pdf', 'PDF content here', {
    metadata: { department: 'security', year: 2024 },
    tags: { classification: 'internal', version: '1.0' },
  });

  const doc2Id = service.putObject(bucketId, 'procedures/onboarding.md', '# Onboarding Procedure', {
    metadata: { department: 'hr', author: 'alice@company.com' },
    tags: { classification: 'public' },
  });

  const doc3Id = service.putObject(bucketId, 'contracts/vendor-agreement.docx', 'Contract content', {
    metadata: { department: 'legal', status: 'signed' },
  });

  console.log('Stored documents:');
  console.log(`  - security-policy.pdf: ${doc1Id}`);
  console.log(`  - onboarding.md: ${doc2Id}`);
  console.log(`  - vendor-agreement.docx: ${doc3Id}`);

  // Retrieve documents
  const doc1 = service.getObject(bucketId, doc1Id);
  console.log(`\nRetrieved document 1:`);
  console.log(`  Key: ${doc1?.key}`);
  console.log(`  Size: ${doc1?.size} bytes`);
  console.log(`  MIME Type: ${doc1?.mimeType}`);

  // Retrieve by key
  const onboarding = service.getObjectByKey(bucketId, 'procedures/onboarding.md');
  console.log(`\nRetrieved onboarding by key:`);
  console.log(`  Key: ${onboarding?.key}`);
  console.log(`  Tags: ${JSON.stringify(onboarding?.tags)}`);

  // List documents
  const allDocs = service.listObjects(bucketId);
  console.log(`\nAll documents in bucket: ${allDocs.length}`);
  allDocs.forEach((doc) => {
    console.log(`  - ${doc.key} (${doc.size} bytes)`);
  });

  // List by prefix
  const policies = service.listObjects(bucketId, 'policies/');
  console.log(`\nPolicies folder: ${policies.length} documents`);
  policies.forEach((doc) => {
    console.log(`  - ${doc.key}`);
  });
}

/**
 * Demo 3: Search and Filter
 */
async function demo3_SearchAndFilter(): Promise<void> {
  console.log('\n=== Demo 3: Search and Filter ===\n');

  const bucketId = service.createBucket({
    name: 'media-library',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: false,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 52428800,
    maxBucketSize: 1073741824,
  });

  // Add images
  service.putObject(bucketId, 'photos/product-1.png', 'PNG image data', {
    metadata: { type: 'product', category: 'electronics' },
  });

  service.putObject(bucketId, 'photos/product-2.jpg', 'JPG image data', {
    metadata: { type: 'product', category: 'apparel' },
  });

  service.putObject(bucketId, 'logos/company-logo.svg', 'SVG logo', {
    metadata: { type: 'logo', category: 'branding' },
  });

  service.putObject(bucketId, 'logos/trademark.png', 'PNG trademark', {
    metadata: { type: 'logo', category: 'branding' },
  });

  // Search by prefix
  console.log('Search results - photos by prefix:');
  const photos = service.searchObjects(bucketId, { prefix: 'photos/' });
  console.log(`  Found: ${photos.length} items`);
  photos.forEach((photo) => console.log(`    - ${photo.key}`));

  // Search by MIME type
  console.log('\nSearch results - PNG images by MIME type:');
  const pngs = service.searchObjects(bucketId, { mimeType: 'image/png' });
  console.log(`  Found: ${pngs.length} items`);
  pngs.forEach((png) => console.log(`    - ${png.key}`));

  // Search with multiple criteria
  console.log('\nSearch results - logos (branding category):');
  const logos = service.searchObjects(bucketId, {
    prefix: 'logos/',
  });
  console.log(`  Found: ${logos.length} items`);
  logos.forEach((logo) => {
    console.log(`    - ${logo.key} (${logo.mimeType})`);
  });
}

/**
 * Demo 4: Versioning
 */
async function demo4_Versioning(): Promise<void> {
  console.log('\n=== Demo 4: Versioning ===\n');

  const bucketId = service.createBucket({
    name: 'versioned-storage',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: true,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  // Create initial version
  console.log('Creating versions of configuration file:');
  const v1Id = service.putObject(bucketId, 'config.json', '{"version": 1, "debug": false}');
  console.log(`  Version 1: ${v1Id}`);

  // Update - creates new version
  const v2Id = service.putObject(bucketId, 'config.json', '{"version": 2, "debug": true}');
  console.log(`  Version 2: ${v2Id}`);

  // Another update
  const v3Id = service.putObject(bucketId, 'config.json', '{"version": 3, "debug": true, "logging": "verbose"}');
  console.log(`  Version 3: ${v3Id}`);

  // Get all versions
  const versions = service.getObjectVersions(bucketId, v1Id);
  console.log(`\nTotal versions tracked: ${versions.length}`);
  versions.forEach((version, index) => {
    console.log(`  Version ${index + 1}: ${version.versionId} (latest: ${version.isLatest})`);
  });

  // Latest version
  const latest = service.getObject(bucketId, v1Id);
  console.log(`\nLatest version content:`);
  console.log(`  MIME Type: ${latest?.mimeType}`);
  console.log(`  Size: ${latest?.size} bytes`);
}

/**
 * Demo 5: Copy and Move Operations
 */
async function demo5_CopyAndMove(): Promise<void> {
  console.log('\n=== Demo 5: Copy and Move Operations ===\n');

  const bucketId = service.createBucket({
    name: 'file-operations',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: false,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  // Create source file
  const sourceId = service.putObject(bucketId, 'reports/Q1-summary.pdf', 'Q1 Report Data');
  console.log(`Created source file: Q1-summary.pdf (${sourceId})`);

  // Copy file
  const copiedId = service.copyObject(bucketId, {
    sourceKey: 'reports/Q1-summary.pdf',
    destinationKey: 'archive/Q1-summary-backup.pdf',
  });
  console.log(`Copied to archive: Q1-summary-backup.pdf (${copiedId})`);

  // Verify both exist
  const source = service.getObjectByKey(bucketId, 'reports/Q1-summary.pdf');
  const backup = service.getObjectByKey(bucketId, 'archive/Q1-summary-backup.pdf');

  console.log(`\nVerification:`);
  console.log(`  Original exists: ${source !== null}`);
  console.log(`  Backup exists: ${backup !== null}`);
  console.log(`  Same content: ${source?.size === backup?.size}`);

  // List all files
  const allFiles = service.listObjects(bucketId);
  console.log(`\nTotal files in bucket: ${allFiles.length}`);
}

/**
 * Demo 6: Soft Delete and Trash
 */
async function demo6_SoftDeleteAndTrash(): Promise<void> {
  console.log('\n=== Demo 6: Soft Delete and Trash ===\n');

  const bucketId = service.createBucket({
    name: 'trash-demo',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: false,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  // Create files
  const file1Id = service.putObject(bucketId, 'important.doc', 'Important document');
  const file2Id = service.putObject(bucketId, 'temp.txt', 'Temporary file');

  console.log('Initial files:');
  let files = service.listObjects(bucketId);
  console.log(`  Count: ${files.length}`);

  // Soft delete
  console.log('\nSoft deleting temp.txt...');
  service.deleteObject(bucketId, file2Id, false);

  files = service.listObjects(bucketId);
  console.log(`  Files in bucket: ${files.length}`);

  // Check trash
  const trash = service.getTrash(bucketId);
  console.log(`  Files in trash: ${trash?.totalItems}`);
  console.log(`  Trash size: ${trash?.totalSize} bytes`);

  // Restore
  console.log('\nRestoring temp.txt from trash...');
  service.restoreObject(bucketId, file2Id);

  files = service.listObjects(bucketId);
  console.log(`  Files in bucket: ${files.length}`);
  console.log(`  Files in trash: ${service.getTrash(bucketId)?.totalItems}`);

  // Permanent delete
  console.log('\nPermanent delete of important.doc...');
  service.deleteObject(bucketId, file1Id, true);

  files = service.listObjects(bucketId);
  console.log(`  Final file count: ${files.length}`);
}

/**
 * Demo 7: Storage Statistics
 */
async function demo7_StorageStatistics(): Promise<void> {
  console.log('\n=== Demo 7: Storage Statistics ===\n');

  const bucketId = service.createBucket({
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

  // Add various files
  console.log('Adding files...');
  service.putObject(bucketId, 'data.json', '{"key": "value"}');
  service.putObject(bucketId, 'image.png', 'PNG binary data');
  service.putObject(bucketId, 'document.pdf', 'PDF document');
  service.putObject(bucketId, 'config.xml', '<config></config>');

  // Get statistics
  const stats = service.getStats(bucketId);
  console.log(`\nStorage Statistics:`);
  console.log(`  Total objects: ${stats?.totalObjects}`);
  console.log(`  Total size: ${stats?.totalSize} bytes`);
  console.log(`  Average object size: ${stats?.averageObjectSize} bytes`);

  // Get capacity
  const capacity = service.getCapacity(bucketId);
  console.log(`\nBucket Capacity:`);
  console.log(`  Max capacity: ${capacity?.maxBucketSize} bytes (${(capacity?.maxBucketSize! / 1073741824).toFixed(2)} GB)`);
  console.log(`  Used: ${capacity?.currentSize} bytes`);
  console.log(`  Utilization: ${capacity?.utilizationPercentage?.toFixed(2)}%`);
  console.log(`  Remaining: ${capacity?.remainingCapacity} bytes`);

  // Get metadata
  const files = service.listObjects(bucketId);
  console.log(`\nFile Metadata:`);
  files.slice(0, 2).forEach((file) => {
    const meta = service.getMetadata(bucketId, file.objectId);
    console.log(`  ${meta?.key}:`);
    console.log(`    Size: ${meta?.size} bytes`);
    console.log(`    MIME Type: ${meta?.mimeType}`);
    console.log(`    Created: ${meta?.createdAt?.toISOString()}`);
  });
}

/**
 * Demo 8: Batch Operations
 */
async function demo8_BatchOperations(): Promise<void> {
  console.log('\n=== Demo 8: Batch Operations ===\n');

  const bucketId = service.createBucket({
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

  // Create files for batch operation
  console.log('Creating batch of files:');
  const fileNames = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];
  fileNames.forEach((name) => {
    service.putObject(bucketId, name, `Content of ${name}`);
  });
  console.log(`  Created ${fileNames.length} files`);

  // Batch delete
  console.log('\nPerforming batch delete:');
  const deleteResult = service.batchDelete(bucketId, {
    keys: ['file1.txt', 'file2.txt', 'file3.txt'],
  });

  console.log(`  Successful: ${deleteResult.successCount}`);
  console.log(`  Failed: ${deleteResult.failureCount}`);

  // Verify
  const remaining = service.listObjects(bucketId);
  console.log(`  Remaining files: ${remaining.length}`);
}

/**
 * Demo 9: Health Check
 */
async function demo9_HealthCheck(): Promise<void> {
  console.log('\n=== Demo 9: Health Check ===\n');

  // Create multiple buckets
  const bucket1Id = service.createBucket({
    name: 'health-check-1',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: false,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  const bucket2Id = service.createBucket({
    name: 'health-check-2',
    region: 'us-west-2',
    encryption: 'AES256',
    versioningEnabled: true,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  // Add some data
  service.putObject(bucket1Id, 'test1.txt', 'Test data');
  service.putObject(bucket2Id, 'test2.txt', 'Test data');

  // Perform health check
  const health = await service.performHealthCheck();
  console.log(`Overall Storage Health: ${health.status}`);
  console.log(`Checked at: ${health.timestamp.toISOString()}`);

  console.log('\nBucket Details:');
  health.buckets.forEach((bucket) => {
    console.log(`  ${bucket.name}:`);
    console.log(`    Status: ${bucket.status}`);
    console.log(`    Objects: ${bucket.objectCount}`);
    console.log(`    Total Size: ${bucket.totalSize} bytes`);
    console.log(`    Utilization: ${bucket.utilizationPercentage?.toFixed(2)}%`);
  });
}

/**
 * Demo 10: Event Listeners
 */
async function demo10_EventListeners(): Promise<void> {
  console.log('\n=== Demo 10: Event Listeners ===\n');

  const events: IStorageEvent[] = [];

  // Register event listener
  service.onEvent(async (event) => {
    events.push(event);
    console.log(`Event: ${event.type}`);
    if (event.key) console.log(`  Key: ${event.key}`);
    if (event.size) console.log(`  Size: ${event.size} bytes`);
  });

  const bucketId = service.createBucket({
    name: 'event-demo',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: false,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 5242880,
    maxBucketSize: 1073741824,
  });

  console.log('\nCreating and modifying objects...');
  const objId = service.putObject(bucketId, 'tracked-file.txt', 'Tracked content');
  service.deleteObject(bucketId, objId, false);

  console.log(`\nTotal events captured: ${events.length}`);
  console.log('Event types:');
  const eventTypes = new Set(events.map((e) => e.type));
  eventTypes.forEach((type) => {
    const count = events.filter((e) => e.type === type).length;
    console.log(`  - ${type}: ${count}`);
  });
}

/**
 * Demo 11: Error Handling
 */
async function demo11_ErrorHandling(): Promise<void> {
  console.log('\n=== Demo 11: Error Handling ===\n');

  const bucketId = service.createBucket({
    name: 'error-demo',
    region: 'us-east-1',
    encryption: 'none',
    versioningEnabled: false,
    publicRead: false,
    corsEnabled: false,
    lifecycleEnabled: false,
    maxObjectSize: 1000, // Small max size for demo
    maxBucketSize: 1073741824,
  });

  // Try to store oversized object
  console.log('Attempting to store oversized object...');
  try {
    service.putObject(bucketId, 'huge-file.bin', 'x'.repeat(2000));
    console.log('  ERROR: Should have thrown exception!');
  } catch (error) {
    console.log(`  ✓ Caught expected error: ${(error as Error).message}`);
  }

  // Try to get non-existent object
  console.log('\nAttempting to get non-existent object...');
  const missing = service.getObject(bucketId, 'non-existent-id');
  console.log(`  ✓ Returned: ${missing === null ? 'null (as expected)' : 'object'}`);

  // Try to delete non-existent bucket
  console.log('\nAttempting to delete non-existent bucket...');
  const deleted = service.deleteBucket('non-existent-bucket-id');
  console.log(`  ✓ Result: ${deleted} (false as expected)`);
}

/**
 * Demo 12: Complete Workflow
 */
async function demo12_CompleteWorkflow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Workflow ===\n');

  console.log('Setting up content management system...');

  // Create buckets
  const contentBucket = service.createBucket({
    name: 'cms-content',
    region: 'us-east-1',
    encryption: 'AES256',
    versioningEnabled: true,
    publicRead: false,
    corsEnabled: true,
    lifecycleEnabled: true,
    maxObjectSize: 10485760,
    maxBucketSize: 10737418240,
  });

  console.log('✓ Created content bucket');

  // Upload content
  service.putObject(contentBucket, 'blog/post-1.md', '# Blog Post 1\n\nContent here', {
    metadata: { author: 'alice', published: true },
  });

  service.putObject(contentBucket, 'blog/post-2.md', '# Blog Post 2\n\nMore content', {
    metadata: { author: 'bob', published: false },
  });

  service.putObject(contentBucket, 'media/logo.png', 'PNG binary');
  service.putObject(contentBucket, 'media/icon.svg', 'SVG data');

  console.log('✓ Uploaded content');

  // Organize and search
  const blogPosts = service.searchObjects(contentBucket, { prefix: 'blog/' });
  console.log(`✓ Found ${blogPosts.length} blog posts`);

  const media = service.searchObjects(contentBucket, { prefix: 'media/' });
  console.log(`✓ Found ${media.length} media files`);

  // Get statistics
  const stats = service.getStats(contentBucket);
  console.log(`✓ Storage stats: ${stats?.totalObjects} objects, ${stats?.totalSize} bytes`);

  // Health check
  const health = await service.performHealthCheck();
  console.log(`✓ System health: ${health.status}`);

  console.log('\n✓ Complete workflow executed successfully!');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    STORAGE SERVICE - DEMO SCENARIOS    ║');
  console.log('╚════════════════════════════════════════╝');

  await demo1_BasicBucketManagement();
  await demo2_DocumentStorageAndRetrieval();
  await demo3_SearchAndFilter();
  await demo4_Versioning();
  await demo5_CopyAndMove();
  await demo6_SoftDeleteAndTrash();
  await demo7_StorageStatistics();
  await demo8_BatchOperations();
  await demo9_HealthCheck();
  await demo10_EventListeners();
  await demo11_ErrorHandling();
  await demo12_CompleteWorkflow();

  service.stop();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         ALL DEMOS COMPLETED            ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Execute
runAllDemos().catch(console.error);
