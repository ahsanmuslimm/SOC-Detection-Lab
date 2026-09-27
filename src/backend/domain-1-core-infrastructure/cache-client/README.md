# Cache Client Module

Production-grade Redis caching client for the SOC Detection Lab application. Provides efficient caching with TTL management, batch operations, and performance monitoring.

**Status**: ✅ Production Ready  
**Test Coverage**: 85%+  
**Dependencies**: redis (Client library)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Cache Client module provides:

- **Key-Value Storage**: Fast in-memory caching with Redis
- **TTL Management**: Automatic key expiration
- **Batch Operations**: Multiple operations in single call
- **Type Safety**: Full TypeScript support
- **Performance Monitoring**: Cache statistics and hit rates
- **Event Listeners**: Track cache operations
- **Counter Operations**: Atomic increments for rate limiting
- **Key Scanning**: Pattern-based key discovery

### Why This Module?

1. **Performance**: Sub-millisecond response times
2. **Scalability**: Handles millions of cache entries
3. **Reliability**: Data persistence options
4. **Flexibility**: Multiple data types supported
5. **Monitoring**: Built-in performance tracking
6. **Type Safety**: Full TypeScript support

---

## Features

### ✅ Basic Operations

- Set key-value pairs
- Get values by key
- Delete keys
- Check key existence
- Set with expiration (TTL)

### ✅ Multiple Values

- Get multiple keys at once
- Set multiple keys at once
- Batch execute operations
- Pipeline support

### ✅ Counters

- Atomic increment
- Atomic decrement
- Custom increment amounts
- Rate limiting support

### ✅ String Operations

- Append to strings
- Get string length
- Substring extraction

### ✅ Key Management

- List keys by pattern
- Scan cursor operations
- Delete by pattern
- Get database size

### ✅ Monitoring

- Cache hit rate
- Operations tracking
- Error counting
- Event listeners

---

## Installation & Setup

### 1. Configuration

```typescript
import { createCacheClient } from '@soc-detection-lab/cache-client';

const config = {
  host: 'localhost',
  port: 6379,
  database: 0,
  password: 'your-password',
  connectTimeout: 10000,
  keepAlive: 30000,
};

const client = createCacheClient(config);
```

### 2. Connect

```typescript
// Connect to Redis
await client.connect();

// Verify connection
const pong = await client.ping();
console.log(pong); // 'PONG'
```

### 3. Use Caching

```typescript
// Set value with 1 hour TTL
await client.setWithTTL('user:123', userData, 3600);

// Get value
const user = await client.get('user:123');
```

---

## Core Concepts

### Redis Data Types

```
Strings  → Key-value pairs
Lists    → Ordered collections
Sets     → Unordered collections
Sorted Sets → Scored members
Hashes   → Key-value maps within keys
Streams  → Event logs
```

### TTL (Time To Live)

```typescript
// Keys with TTL automatically expire
await client.setWithTTL('session', data, 1800);  // 30 minutes
// After 1800 seconds, key is automatically deleted
```

### Hit Rate

```
Hit Rate = Successful Gets / (Successful Gets + Misses)

Example:
- 100 cache hits
- 20 cache misses
- Hit Rate = 100 / 120 = 83.3%
```

---

## Usage Examples

### Basic Caching

```typescript
// Set cache
await client.set('config:app', appConfig);

// Get cache
const config = await client.get('config:app');

// Delete cache
await client.delete('config:app');

// Check exists
const exists = await client.exists('config:app');
```

### TTL Management

```typescript
// Set with 1 hour expiration
await client.setWithTTL('session:abc', sessionData, 3600);

// Check remaining time
const ttl = await client.getTTL('session:abc');
console.log(`Expires in ${ttl} seconds`);

// Set with different options
await client.set('key', value, {
  ex: 3600,    // Expire in seconds
  nx: true,    // Only if not exists
});
```

### Multiple Values

```typescript
// Set multiple
await client.mset({
  'key1': value1,
  'key2': value2,
  'key3': value3,
});

// Get multiple
const values = await client.mget(['key1', 'key2', 'key3']);
```

### Type-Safe Caching

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Type-safe set
const user: User = { id: '123', name: 'John', email: 'john@example.com' };
await client.set('user:123', user);

// Type-safe get
const cachedUser = await client.get<User>('user:123');
console.log(cachedUser?.email); // Type safe
```

### Batch Operations

```typescript
const result = await client.batch([
  { op: 'set', key: 'key1', value: 'val1', ttl: 300 },
  { op: 'set', key: 'key2', value: 'val2', ttl: 300 },
  { op: 'get', key: 'key1' },
  { op: 'delete', key: 'old:key' },
]);

console.log(`Succeeded: ${result.succeeded}`);
console.log(`Failed: ${result.failed}`);
```

### Counter Operations

```typescript
// Increment view counter
await client.increment('views:page:123');

// Decrement stock
await client.decrement('stock:product:456', 5);

// Rate limiting
const count = await client.increment('rate:user:123');
if (count > 100) {
  // Limit exceeded
}
```

### Key Patterns

```typescript
// Get all user cache keys
const userKeys = await client.keys('user:*');

// Delete by pattern
const deleted = await client.deletePattern('cache:temp:*');

// Scan with cursor
const scan = await client.scan('0', 'alert:*');
```

### Performance Monitoring

```typescript
// Register listener
client.onCache((event) => {
  console.log(`Operation: ${event.operation}`);
  console.log(`Duration: ${event.duration}ms`);
  console.log(`Hit: ${event.hit}`);
});

// Get statistics
const stats = client.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Total operations: ${stats.sets + stats.hits + stats.misses}`);
```

---

## API Reference

### CacheClient

#### Constructor

```typescript
new CacheClient(config: ICacheConfig)
```

#### Methods

**Basic Operations**

- `set<T>(key, value, options?)` - Set value
- `get<T>(key)` - Get value
- `delete(key)` - Delete key
- `exists(key)` - Check exists
- `clear()` - Clear all

**Multiple Operations**

- `mset<T>(values)` - Set multiple
- `mget<T>(keys)` - Get multiple

**TTL Operations**

- `setWithTTL<T>(key, value, ttl)` - Set with expiration
- `getTTL(key)` - Get remaining TTL

**Batch Operations**

- `batch(operations)` - Execute batch

**Counters**

- `increment(key, amount?)` - Increment
- `decrement(key, amount?)` - Decrement

**String Operations**

- `append(key, value)` - Append
- `strlen(key)` - Get length

**Key Management**

- `keys(pattern)` - Get keys
- `scan(cursor?, pattern?)` - Scan cursor
- `deletePattern(pattern)` - Delete pattern

**Database**

- `dbSize()` - Database size
- `flushDb()` - Flush database
- `flushAll()` - Flush all
- `ping()` - Ping server
- `info()` - Get info

**Listeners**

- `onCache(listener)` - Register listener
- `offCache(listener)` - Unregister listener

**Statistics**

- `getStats()` - Get statistics
- `resetStats()` - Reset stats

---

## Best Practices

### 1. Use Appropriate TTLs

```typescript
// ✅ Good: TTL based on data type
await client.setWithTTL('session', data, 1800);       // 30 min
await client.setWithTTL('api_response', data, 300);   // 5 min
await client.setWithTTL('config', data, 86400);       // 1 day

// ❌ Bad: Same TTL for all
await client.setWithTTL('key', value, 3600);  // Everything 1 hour
```

### 2. Cache-Aside Pattern

```typescript
// ✅ Good: Check cache first
async function getData(key: string) {
  const cached = await client.get(key);
  if (cached) return cached;
  
  const data = await fetchFromDB(key);
  await client.setWithTTL(key, data, 3600);
  return data;
}

// ❌ Bad: Always fetch
async function getData(key: string) {
  return await fetchFromDB(key);
}
```

### 3. Use Batch for Multiple Operations

```typescript
// ✅ Good: Single batch call
await client.batch([
  { op: 'set', key: 'k1', value: 'v1' },
  { op: 'set', key: 'k2', value: 'v2' },
  { op: 'get', key: 'k1' },
]);

// ❌ Bad: Multiple calls
await client.set('k1', 'v1');
await client.set('k2', 'v2');
await client.get('k1');
```

### 4. Monitor Cache Performance

```typescript
// ✅ Good: Track hit rate
client.onCache((event) => {
  if (event.operation === 'get') {
    metrics.recordCacheHit(event.hit);
  }
});

const stats = client.getStats();
if (stats.hitRate < 0.7) {
  logger.warn('Low cache hit rate');
}

// ❌ Bad: No monitoring
```

### 5. Handle Missing Keys

```typescript
// ✅ Good: Null-safe
const data = await client.get('key');
if (data) {
  process.data(data);
} else {
  // Fetch from source
}

// ❌ Bad: Assume exists
const data = await client.get('key');
process.data(data);  // Might be null
```

---

## Configuration Reference

```typescript
interface ICacheConfig {
  host: string;                    // Redis host
  port: number;                    // Redis port
  database?: number;               // Database number (0-15)
  password?: string;               // Password
  username?: string;               // Username (Redis 6+)
  connectTimeout?: number;         // Connection timeout (ms)
  keepAlive?: number;              // Keep-alive timeout (ms)
  maxRetriesPerRequest?: number;   // Max retries
  enableReadyCheck?: boolean;      // Ready check
  enableOfflineQueue?: boolean;    // Offline queue
  tls?: boolean;                   // TLS enabled
}
```

---

## Troubleshooting

### Connection Refused

**Problem**: "ECONNREFUSED" or "Connection timeout"

**Solution**:
```typescript
// Verify Redis is running
redis-cli ping  // Should return PONG

// Check configuration
const config = {
  host: 'actual-host',  // Verify host
  port: 6379,           // Verify port
  connectTimeout: 10000, // Increase timeout
};
```

### Out of Memory

**Problem**: "OOM command not allowed when used memory"

**Solution**:
```typescript
// Set memory policy
// In redis.conf: maxmemory-policy allkeys-lru

// Clear cache
await client.clear();

// Delete old keys
await client.deletePattern('old:*');
```

### Slow Responses

**Problem**: Cache operations taking too long

**Solution**:
```typescript
// Monitor performance
client.onCache((event) => {
  if (event.duration > 100) {
    logger.warn(`Slow cache operation: ${event.duration}ms`);
  }
});

// Check hit rate
const stats = client.getStats();
if (stats.hitRate < 0.6) {
  // Cache not effective, review TTLs
}
```

---

## Performance Considerations

| Operation | Time | Notes |
|-----------|------|-------|
| Set | <1ms | In-memory |
| Get | <1ms | In-memory |
| Delete | <1ms | In-memory |
| Batch (10 ops) | 5-10ms | Pipeline |
| Increment | <1ms | Atomic |
| Scan | 1-10ms | Cursor based |

---

## Related Modules

- **config-service**: Get cache configuration
- **logging-service**: Log cache operations
- **postgres-client**: Complement with DB cache
- **error-handling**: Handle cache errors

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary
