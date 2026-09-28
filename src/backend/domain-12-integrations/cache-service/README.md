# Cache Service

High-performance in-memory caching with advanced eviction policies, compression, TTL management, and real-time metrics.

## Overview

The Cache Service provides a robust, high-performance in-memory cache with sophisticated features including multiple eviction policies (LRU, LFU, FIFO, TTL), automatic compression, TTL-based expiration, bulk operations, pattern-based invalidation, and comprehensive metrics and health monitoring.

**Key Features:**
- Multiple eviction policies (LRU, LFU, FIFO, TTL, ARC, W-TinyLFU)
- Automatic data compression (gzip, brotli, deflate, lz4)
- TTL-based expiration with automatic cleanup
- Bulk operations (get/set/delete multiple)
- Pattern-based key invalidation
- Entry metadata tracking (size, access count, creation time)
- Cache statistics and performance metrics
- Event-driven architecture with listeners
- Health checks and monitoring
- Memory usage tracking
- Average access time analysis
- Configurable write strategies (write-through, write-back, write-around)
- Support for custom invalidation patterns

## Architecture

### Core Components

1. **Cache Store**: In-memory Map-based storage with fixed size limits
2. **Eviction Engine**: Implements multiple eviction policies
3. **Compression Manager**: Handles data compression/decompression
4. **TTL Manager**: Tracks and expires entries automatically
5. **Metadata Tracker**: Maintains entry metadata and statistics
6. **Event Emitter**: Publishes cache events to listeners
7. **Metrics Collector**: Collects performance metrics
8. **Health Monitor**: Tracks cache health status

### Data Flow

```
Cache Request
    ↓
Size/Count Check
    ↓
Eviction Check (if needed)
    ↓
Compression/Decompression
    ↓
TTL Validation
    ↓
Metadata Update
    ↓
Event Emission
    ↓
Return Value
```

## API Reference

### Creating the Service

```typescript
import { createCacheService, ICacheServiceConfig } from '@cache-service';

const config: ICacheServiceConfig = {
  maxSize: 10485760, // 10 MB
  maxEntries: 10000,
  defaultTTL: 3600000, // 1 hour
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
```

### Basic Operations

#### Set Value

```typescript
// Simple set
service.set('key', 'value');

// Set with TTL
service.set('session', { token: 'abc123' }, { ttl: 300000 });

// Set with tags
service.set('user:1', { id: 1, name: 'Alice' }, { tags: ['user', 'active'] });
```

#### Get Value

```typescript
// Retrieve value
const value = service.get('key');

// Returns null if not found or expired
const missing = service.get('nonexistent');
```

#### Check Existence

```typescript
const exists = service.has('key');
```

#### Delete Value

```typescript
const deleted = service.delete('key');
```

#### Clear All

```typescript
service.clear();
```

### Bulk Operations

```typescript
// Get multiple
const results = service.getMultiple(['key1', 'key2', 'key3']);

// Set multiple
const entries = [
  { key: 'a', value: 1 },
  { key: 'b', value: 2 },
];
const successCount = service.setMultiple(entries);

// Delete multiple
const deleteCount = service.deleteMultiple(['key1', 'key2']);
```

### Pattern-Based Operations

```typescript
// Delete by pattern
service.deleteByPattern('session:.*');

// Invalidate by pattern
service.invalidateByPattern('cache:expired:.*', 'lazy');
```

### Metadata

```typescript
// Get entry metadata
const meta = service.getMetadata('key');

if (meta) {
  console.log(`Size: ${meta.size} bytes`);
  console.log(`Accessed: ${meta.accessCount} times`);
  console.log(`Created: ${meta.createdAt}`);
}

// Get all metadata
const allMeta = service.getAllMetadata();
```

### Statistics

```typescript
// Get cache statistics
const stats = service.getStats();
console.log(`Hits: ${stats.hits}`);
console.log(`Misses: ${stats.misses}`);
console.log(`Hit rate: ${(stats.hitRate * 100)}%`);

// Get performance metrics
const metrics = service.getMetrics();
console.log(`Memory usage: ${metrics.memoryUtilization}%`);
console.log(`Get time: ${metrics.operationTime.get}ms`);
```

### Size and Count

```typescript
const count = service.getCount();      // Number of entries
const size = service.getSize();        // Total size in bytes
```

### Health Check

```typescript
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);
health.checks.forEach(check => {
  console.log(`${check.name}: ${check.status}`);
});
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Event: ${event.type} on ${event.key}`);
  console.log(`Duration: ${event.duration}ms`);
});
```

## Configuration

### ICacheServiceConfig

```typescript
interface ICacheServiceConfig {
  maxSize: number;                      // Maximum size in bytes
  maxEntries: number;                   // Maximum number of entries
  defaultTTL: number;                   // Default TTL in milliseconds
  evictionPolicy: EvictionPolicy;       // Which policy to use
  enableCompression: boolean;           // Enable data compression
  compressionAlgorithm: CompressionAlgorithm;
  compressionThreshold: number;         // Min size to compress
  writeStrategy: WriteStrategy;
  invalidationStrategy: InvalidationStrategy;
  enableMetrics: boolean;
  enableStatistics: boolean;
  cleanupInterval: number;              // Cleanup frequency
  enableAudit: boolean;
  maxAuditEntries: number;
  enableReplication: boolean;
}
```

### Eviction Policies

| Policy | Description | Best For |
|--------|-------------|----------|
| **LRU** | Least Recently Used | General purpose caching |
| **LFU** | Least Frequently Used | Hot/cold data separation |
| **FIFO** | First In, First Out | Time-based expiration |
| **TTL** | Time To Live | Automatic expiration |
| **ARC** | Adaptive Replacement Cache | Adaptive workloads |
| **W-TinyLFU** | Weighted Tiny LFU | Advanced scenarios |

### Write Strategies

- **write-through**: Write to cache, then to persistent storage
- **write-back**: Write to cache, async write to storage
- **write-around**: Write to storage, cache misses on read

## Usage Examples

### Example 1: Session Caching

```typescript
const service = createCacheService(config);

// Store user session
service.set('session:user1', {
  userId: 'user1',
  token: 'abc123',
  permissions: ['read', 'write'],
}, { ttl: 3600000 }); // 1 hour

// Retrieve session
const session = service.get('session:user1');

// Invalidate sessions
service.deleteByPattern('session:.*');
```

### Example 2: API Response Caching

```typescript
// Cache API responses
service.set('api:users:list', {
  data: [...],
  timestamp: Date.now(),
}, { ttl: 300000 }); // 5 minutes

// Large response gets compressed automatically
service.set('api:report:full', largeReportData);

// Check cache before API call
const cached = service.get('api:users:list');
if (cached) {
  return cached; // Return cached response
}
```

### Example 3: Multi-Level Caching

```typescript
// L1: User cache (short TTL)
service.set('user:1', userData, { ttl: 300000 });

// L2: Config cache (long TTL)
service.set('config:db', dbConfig, { ttl: 3600000 });

// L3: Session cache (custom TTL)
service.set('session:abc', sessionData, { ttl: 1800000 });

// Monitor cache health
const health = await service.performHealthCheck();
if (health.status === 'degraded') {
  console.warn('Cache degraded');
}
```

### Example 4: Metrics and Monitoring

```typescript
// Listen to cache events
service.onEvent(async (event) => {
  if (event.type === 'evict') {
    console.log('Cache eviction occurred');
  }
});

// Collect metrics
setInterval(() => {
  const stats = service.getStats();
  const metrics = service.getMetrics();

  console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`Memory: ${metrics.memoryUtilization.toFixed(2)}%`);
  console.log(`Entries: ${stats.entryCount}`);
}, 60000);
```

## Performance Characteristics

### Operation Complexity

| Operation | Time | Notes |
|-----------|------|-------|
| Set | O(1) | Average case |
| Get | O(1) | Average case |
| Delete | O(1) | Average case |
| Clear | O(n) | Where n = entry count |
| Evict | O(n log n) | LRU sorting |
| Compress | O(m) | Where m = value size |

### Memory Usage

- Uncompressed: Actual size of serialized values
- Compressed: 20-50% of original (depends on data)
- Metadata: ~100 bytes per entry

### Cache Efficiency

- **Hit Rate Target**: 70-90% for optimal performance
- **Compression Ratio**: 20-80% savings for compressible data
- **Eviction Overhead**: Minimal for LRU/FIFO policies

## Best Practices

1. **Choose Right Policy**: LRU for general purpose, LFU for hot/cold separation
2. **Set Appropriate TTLs**: Short for session data, long for static content
3. **Enable Compression**: For values > 1KB, especially JSON/text
4. **Monitor Metrics**: Track hit rate and memory usage regularly
5. **Use Patterns Wisely**: Avoid overly broad patterns
6. **Handle Evictions**: Listen for eviction events if critical
7. **Size Appropriately**: Set maxSize based on available memory
8. **Batch Operations**: Use bulk operations for multiple entries
9. **Audit Trail**: Enable for debugging and monitoring
10. **Cleanup Interval**: Balance between freshness and overhead

## Error Handling

Service automatically handles:
- Invalid values (returns false on set)
- Oversized entries (not cached)
- Expired entries (returns null)
- Eviction on capacity (automatic cleanup)
- Compression failures (stores uncompressed)

## Lifecycle Management

```typescript
// Create service
const service = createCacheService(config);

// Use service
service.set('key', 'value');

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- cache-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- cache-service/demo.ts
```

## Dependencies

- **Built-in**: Node.js zlib for compression
- **Optional**: Redis adapter for distributed caching

## See Also

- [Configuration Service](../configuration-service/README.md) - Configuration management
- [Metrics Service](../metrics-service/README.md) - Metrics collection
- [Logging Service](../logging-service/README.md) - Structured logging
- [Performance Tuning Guide](../../docs/PERFORMANCE.md) - Cache optimization

## Version

1.0.0

## License

See repository LICENSE file
