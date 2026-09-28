/**
 * Cache Service - Prototype Demonstrations
 * 12 comprehensive scenario demonstrations
 */

import {
  CacheService,
  createCacheService,
  ICacheServiceConfig,
  CacheListener,
  ICacheEvent,
} from '../src/index';

/**
 * Demo 1: Basic cache operations
 */
async function demo1_BasicCacheOperations(): Promise<void> {
  console.log('\n=== Demo 1: Basic Cache Operations ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Set values
  service.set('app:name', 'SOC Detection Lab');
  service.set('app:version', '1.0.0');
  service.set('app:port', 3000);

  console.log('✓ Set 3 cache entries');

  // Retrieve values
  const name = service.get('app:name');
  const version = service.get('app:version');
  const port = service.get('app:port');

  console.log(`✓ Retrieved values:`);
  console.log(`  - Name: ${name}`);
  console.log(`  - Version: ${version}`);
  console.log(`  - Port: ${port}`);

  // Check if exists
  const exists = service.has('app:name');
  console.log(`✓ Key exists check: ${exists}`);

  service.stop();
}

/**
 * Demo 2: Compression and large values
 */
async function demo2_CompressionAndLargeValues(): Promise<void> {
  console.log('\n=== Demo 2: Compression and Large Values ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Store small value
  service.set('small', 'x'.repeat(100));
  const smallMeta = service.getMetadata('small');

  // Store large value
  const largeData = JSON.stringify({
    data: 'x'.repeat(5000),
    nested: { info: 'y'.repeat(5000) },
  });
  service.set('large', JSON.parse(largeData));
  const largeMeta = service.getMetadata('large');

  console.log(`✓ Compression status:`);
  console.log(`  - Small value compressed: ${smallMeta?.compressed}`);
  console.log(`  - Large value compressed: ${largeMeta?.compressed}`);
  console.log(`  - Small size: ${smallMeta?.size} bytes`);
  console.log(`  - Large size: ${largeMeta?.size} bytes`);

  // Verify retrieval
  const retrievedSmall = service.get('small');
  const retrievedLarge = service.get('large');

  console.log(`✓ Retrieved values:`);
  console.log(`  - Small: ${retrievedSmall?.substring(0, 20)}...`);
  console.log(`  - Large data length: ${JSON.stringify(retrievedLarge).length}`);

  service.stop();
}

/**
 * Demo 3: TTL and expiration
 */
async function demo3_TTLAndExpiration(): Promise<void> {
  console.log('\n=== Demo 3: TTL and Expiration ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Set values with different TTLs
  service.set('session:user1', { id: 'user1', name: 'Admin' }, { ttl: 300000 }); // 5 min
  service.set('cache:data', { timestamp: Date.now() }, { ttl: 600000 }); // 10 min
  service.set('temp:request', { id: 123 }, { ttl: 60000 }); // 1 min

  console.log('✓ Set 3 entries with different TTLs');

  const sessionMeta = service.getMetadata('session:user1');
  const cacheMeta = service.getMetadata('cache:data');
  const tempMeta = service.getMetadata('temp:request');

  console.log(`✓ TTL values:`);
  console.log(`  - Session: ${sessionMeta?.ttl}ms (5 minutes)`);
  console.log(`  - Cache: ${cacheMeta?.ttl}ms (10 minutes)`);
  console.log(`  - Temp: ${tempMeta?.ttl}ms (1 minute)`);

  console.log(`✓ Expiry times:`);
  console.log(`  - Session expires: ${sessionMeta?.expiresAt?.toISOString()}`);
  console.log(`  - Cache expires: ${cacheMeta?.expiresAt?.toISOString()}`);

  service.stop();
}

/**
 * Demo 4: Eviction policies
 */
async function demo4_EvictionPolicies(): Promise<void> {
  console.log('\n=== Demo 4: Eviction Policies ===');

  const policies: Array<'LRU' | 'LFU' | 'FIFO'> = ['LRU', 'LFU', 'FIFO'];

  for (const policy of policies) {
    const config: ICacheServiceConfig = {
      maxSize: 10485760,
      maxEntries: 3,
      defaultTTL: 3600000,
      evictionPolicy: policy,
      enableCompression: false,
      compressionAlgorithm: 'gzip',
      compressionThreshold: 1024,
      writeStrategy: 'write-through',
      invalidationStrategy: 'immediate',
      enableMetrics: true,
      enableStatistics: true,
      cleanupInterval: 60000,
      enableAudit: true,
      maxAuditEntries: 1000,
      enableReplication: false,
    };

    const service = createCacheService(config);

    service.set('key1', 'value1');
    service.set('key2', 'value2');
    service.set('key3', 'value3');

    if (policy === 'LRU') {
      service.get('key1');
      service.get('key2');
    } else if (policy === 'LFU') {
      service.get('key1');
      service.get('key1');
      service.get('key2');
    }

    service.set('key4', 'value4');

    console.log(`✓ ${policy} eviction:`);
    console.log(`  - key1 exists: ${service.has('key1')}`);
    console.log(`  - key2 exists: ${service.has('key2')}`);
    console.log(`  - key3 exists: ${service.has('key3')}`);
    console.log(`  - key4 exists: ${service.has('key4')}`);

    service.stop();
  }
}

/**
 * Demo 5: Bulk operations
 */
async function demo5_BulkOperations(): Promise<void> {
  console.log('\n=== Demo 5: Bulk Operations ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Set multiple
  const entries = [
    { key: 'user:1', value: { id: 1, name: 'Alice' } },
    { key: 'user:2', value: { id: 2, name: 'Bob' } },
    { key: 'user:3', value: { id: 3, name: 'Charlie' } },
  ];

  const setCount = service.setMultiple(entries);
  console.log(`✓ Set multiple: ${setCount} entries`);

  // Get multiple
  const results = service.getMultiple(['user:1', 'user:2', 'user:4']);
  console.log(`✓ Get multiple: ${results.size} results`);
  console.log(`  - user:1: ${results.get('user:1')?.name}`);
  console.log(`  - user:2: ${results.get('user:2')?.name}`);
  console.log(`  - user:4: ${results.get('user:4')}`);

  // Delete multiple
  const deleteCount = service.deleteMultiple(['user:1', 'user:2']);
  console.log(`✓ Delete multiple: ${deleteCount} entries`);

  service.stop();
}

/**
 * Demo 6: Pattern-based operations
 */
async function demo6_PatternOperations(): Promise<void> {
  console.log('\n=== Demo 6: Pattern-Based Operations ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Set namespaced entries
  service.set('config:app:name', 'SOC Lab');
  service.set('config:app:port', 3000);
  service.set('config:db:host', 'localhost');
  service.set('config:db:port', 5432);
  service.set('session:user1', 'token123');

  console.log(`✓ Set 5 namespaced entries`);

  // Delete by pattern
  const deleted = service.deleteByPattern('config:app:.*');
  console.log(`✓ Deleted ${deleted} entries matching 'config:app:.*'`);

  // Invalidate by pattern
  service.invalidateByPattern('config:db:.*', 'immediate');
  console.log(`✓ Invalidated entries matching 'config:db:.*'`);

  console.log(`✓ Remaining entries: ${service.getCount()}`);

  service.stop();
}

/**
 * Demo 7: Cache statistics
 */
async function demo7_CacheStatistics(): Promise<void> {
  console.log('\n=== Demo 7: Cache Statistics ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Generate activity
  for (let i = 0; i < 20; i++) {
    service.set(`key:${i}`, `value:${i}`);
  }

  for (let i = 0; i < 15; i++) {
    service.get(`key:${i}`);
  }

  service.get('nonexistent1');
  service.get('nonexistent2');

  const stats = service.getStats();
  console.log(`✓ Cache statistics:`);
  console.log(`  - Hits: ${stats.hits}`);
  console.log(`  - Misses: ${stats.misses}`);
  console.log(`  - Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  - Entry count: ${stats.entryCount}`);
  console.log(`  - Total size: ${stats.totalSize} bytes`);

  const metrics = service.getMetrics();
  console.log(`✓ Performance metrics:`);
  console.log(`  - Memory: ${metrics.memoryUtilization.toFixed(2)}%`);
  console.log(`  - Get time: ${metrics.operationTime.get.toFixed(2)}ms`);
  console.log(`  - Set time: ${metrics.operationTime.set.toFixed(2)}ms`);

  service.stop();
}

/**
 * Demo 8: Cache metadata
 */
async function demo8_CacheMetadata(): Promise<void> {
  console.log('\n=== Demo 8: Cache Metadata ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  service.set('tracked:entry', 'value123', { ttl: 300000 });
  service.get('tracked:entry');
  service.get('tracked:entry');

  const metadata = service.getMetadata('tracked:entry');

  console.log(`✓ Entry metadata:`);
  console.log(`  - Key: ${metadata?.key}`);
  console.log(`  - Status: ${metadata?.status}`);
  console.log(`  - Size: ${metadata?.size} bytes`);
  console.log(`  - Access count: ${metadata?.accessCount}`);
  console.log(`  - Created: ${metadata?.createdAt.toISOString()}`);
  console.log(`  - Last accessed: ${metadata?.lastAccessedAt.toISOString()}`);
  console.log(`  - TTL: ${metadata?.ttl}ms`);
  console.log(`  - Expires: ${metadata?.expiresAt?.toISOString()}`);

  const allMetadata = service.getAllMetadata();
  console.log(`✓ Total tracked entries: ${allMetadata.size}`);

  service.stop();
}

/**
 * Demo 9: Health checks
 */
async function demo9_HealthChecks(): Promise<void> {
  console.log('\n=== Demo 9: Health Checks ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  // Generate some activity
  for (let i = 0; i < 50; i++) {
    service.set(`entry:${i}`, `data:${i}`);
    service.get(`entry:${i}`);
  }

  const health = await service.performHealthCheck();

  console.log(`✓ Health check result:`);
  console.log(`  - Status: ${health.status}`);
  console.log(`  - Timestamp: ${health.timestamp.toISOString()}`);
  console.log(`  - Checks: ${health.checks.length}`);

  health.checks.forEach((check) => {
    console.log(`    • ${check.name}: ${check.status}`);
    if (check.message) {
      console.log(`      ${check.message}`);
    }
  });

  service.stop();
}

/**
 * Demo 10: Event listeners
 */
async function demo10_EventListeners(): Promise<void> {
  console.log('\n=== Demo 10: Event Listeners ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  const events: ICacheEvent[] = [];

  const listener: CacheListener = async (event: ICacheEvent) => {
    events.push(event);
  };

  service.onEvent(listener);
  console.log('✓ Registered event listener');

  service.set('event:key1', 'value1');
  service.set('event:key2', 'value2');
  service.get('event:key1');
  service.delete('event:key1');

  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log(`✓ Events captured: ${events.length}`);
  console.log(`✓ Event types:`);
  const types = new Set(events.map((e) => e.type));
  types.forEach((type) => {
    console.log(`  - ${type}`);
  });

  service.stop();
}

/**
 * Demo 11: Size and count tracking
 */
async function demo11_SizeTracking(): Promise<void> {
  console.log('\n=== Demo 11: Size and Count Tracking ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);

  for (let i = 0; i < 10; i++) {
    service.set(`item:${i}`, { index: i, data: 'x'.repeat(100 * (i + 1)) });
  }

  const count = service.getCount();
  const size = service.getSize();

  console.log(`✓ Cache tracking:`);
  console.log(`  - Entry count: ${count}`);
  console.log(`  - Total size: ${size} bytes`);
  console.log(`  - Average entry: ${Math.round(size / count)} bytes`);

  const metadata = service.getMetadata('item:9');
  console.log(`✓ Largest entry (item:9): ${metadata?.size} bytes`);

  service.stop();
}

/**
 * Demo 12: Complete integration flow
 */
async function demo12_CompleteIntegrationFlow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Integration Flow ===');

  const config: ICacheServiceConfig = {
    maxSize: 10485760,
    maxEntries: 10000,
    defaultTTL: 3600000,
    evictionPolicy: 'LRU',
    enableCompression: true,
    compressionAlgorithm: 'gzip',
    compressionThreshold: 1024,
    writeStrategy: 'write-through',
    invalidationStrategy: 'immediate',
    enableMetrics: true,
    enableStatistics: true,
    cleanupInterval: 60000,
    enableAudit: true,
    maxAuditEntries: 1000,
    enableReplication: false,
  };

  const service = createCacheService(config);
  console.log('✓ Cache service initialized');

  // Register listener
  let eventCount = 0;
  service.onEvent(async () => {
    eventCount++;
  });

  // Set configurations
  service.set('app:config', { name: 'SOC Lab', version: '1.0.0' });
  service.set('db:pool', { min: 5, max: 20, timeout: 30000 });

  // Set with TTL
  service.set('session:user1', { id: 'user1', token: 'xyz123' }, { ttl: 300000 });

  console.log('✓ Set 3 cache entries');

  // Retrieve and verify
  const appConfig = service.get('app:config');
  const dbPool = service.get('db:pool');
  const session = service.get('session:user1');

  console.log(`✓ Retrieved values:`);
  console.log(`  - App: ${appConfig?.name} v${appConfig?.version}`);
  console.log(`  - DB pool: ${dbPool?.min}-${dbPool?.max}`);
  console.log(`  - Session: ${session?.token}`);

  // Pattern operations
  service.set('cache:data:1', 'data1');
  service.set('cache:data:2', 'data2');
  service.set('cache:meta', 'meta');

  const deleted = service.deleteByPattern('cache:data:.*');
  console.log(`✓ Deleted ${deleted} entries matching 'cache:data:.*'`);

  // Get statistics
  const stats = service.getStats();
  const metrics = service.getMetrics();
  const health = await service.performHealthCheck();

  console.log(`✓ Final statistics:`);
  console.log(`  - Entries: ${stats.entryCount}`);
  console.log(`  - Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  - Memory: ${metrics.memoryUtilization.toFixed(2)}%`);
  console.log(`  - Health: ${health.status}`);
  console.log(`  - Events: ${eventCount}`);

  service.stop();
  console.log('✓ Cache service stopped');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════');
  console.log('           Cache Service - Prototype Demonstrations');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await demo1_BasicCacheOperations();
    await demo2_CompressionAndLargeValues();
    await demo3_TTLAndExpiration();
    await demo4_EvictionPolicies();
    await demo5_BulkOperations();
    await demo6_PatternOperations();
    await demo7_CacheStatistics();
    await demo8_CacheMetadata();
    await demo9_HealthChecks();
    await demo10_EventListeners();
    await demo11_SizeTracking();
    await demo12_CompleteIntegrationFlow();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('          All Demos Completed Successfully');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllDemos().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  demo1_BasicCacheOperations,
  demo2_CompressionAndLargeValues,
  demo3_TTLAndExpiration,
  demo4_EvictionPolicies,
  demo5_BulkOperations,
  demo6_PatternOperations,
  demo7_CacheStatistics,
  demo8_CacheMetadata,
  demo9_HealthChecks,
  demo10_EventListeners,
  demo11_SizeTracking,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
