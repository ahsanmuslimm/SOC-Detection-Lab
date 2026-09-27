/**
 * Cache Client - Demo/Prototype
 * Demonstrates caching operations, TTL, and performance tracking
 */

import { createCacheClient } from '../src/main';
import type { ICacheConfig } from '../src/types';

console.log('=== Cache Client - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. Cache Configuration');
console.log('----------------------');

const config: ICacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  database: parseInt(process.env.REDIS_DB || '0'),
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000,
  keepAlive: 30000,
};

console.log('Redis Configuration:');
console.log(`  Host: ${config.host}:${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  Connect timeout: ${config.connectTimeout}ms`);
console.log();

// ============================================================
// 2. Client Creation
// ============================================================
console.log('2. Client Creation');
console.log('------------------');

const client = createCacheClient(config);
console.log('✓ Cache client created');
console.log(`  Connected: ${client.isConnected_()}`);
console.log();

// ============================================================
// 3. Basic Cache Operations
// ============================================================
console.log('3. Basic Cache Operations');
console.log('------------------------');

const basicOps = [
  'Set value (no TTL)',
  'Set value with TTL',
  'Get value',
  'Delete value',
  'Check if exists',
  'Get TTL remaining',
];

console.log('Basic Operations:');
basicOps.forEach((op, idx) => {
  console.log(`  ${idx + 1}. ${op}`);
});
console.log();

// ============================================================
// 4. Set Operations Examples
// ============================================================
console.log('4. Set Operations');
console.log('-----------------');

const setExamples = `
// Simple set
await client.set('user:123', { id: '123', name: 'John', email: 'john@example.com' });

// Set with expiration (1 hour)
await client.setWithTTL('session:abc', { userId: '123', loginTime: Date.now() }, 3600);

// Set only if not exists (NX)
await client.set('lock:resource', 'locked', { nx: true });

// Set only if exists (XX)
await client.set('cache:data', newData, { xx: true });

// Multiple sets (pipeline)
await client.mset({
  'key1': 'value1',
  'key2': 'value2',
  'key3': 'value3',
});
`;

console.log(setExamples);
console.log();

// ============================================================
// 5. Get Operations Examples
// ============================================================
console.log('5. Get Operations');
console.log('-----------------');

const getExamples = `
// Simple get
const user = await client.get('user:123');

// Get with type safety
interface CachedUser {
  id: string;
  name: string;
  email: string;
}
const user = await client.get<CachedUser>('user:123');

// Multiple gets
const [user, session, config] = await client.mget([
  'user:123',
  'session:abc',
  'config:app'
]);

// Get or miss
const cached = await client.get('data:key');
if (!cached) {
  // Data not in cache, fetch from source
  const data = await fetchFromDatabase();
  await client.set('data:key', data, { ex: 300 });
}
`;

console.log(getExamples);
console.log();

// ============================================================
// 6. TTL Management
// ============================================================
console.log('6. TTL Management');
console.log('-----------------');

const ttlExamples = `
// Set with different TTLs
await client.setWithTTL('short-lived', data, 60);      // 1 minute
await client.setWithTTL('medium-lived', data, 3600);   // 1 hour
await client.setWithTTL('long-lived', data, 86400);    // 1 day

// Check remaining TTL
const ttl = await client.getTTL('session:abc');
console.log(\`Expires in \${ttl} seconds\`);

// Common TTL patterns:
// - Sessions: 1800s (30 minutes)
// - API responses: 300-600s (5-10 minutes)
// - User data: 3600s (1 hour)
// - Configuration: 86400s (1 day)
// - Analytics: 604800s (1 week)
`;

console.log(ttlExamples);
console.log();

// ============================================================
// 7. Delete Operations
// ============================================================
console.log('7. Delete Operations');
console.log('--------------------');

const deleteExamples = `
// Delete single key
await client.delete('user:123');

// Delete by pattern (all user cache)
const deleted = await client.deletePattern('user:*');
console.log(\`Deleted \${deleted} keys\`);

// Clear entire cache
await client.clear();

// Selective cache invalidation
const patterns = [
  'cache:alerts:*',
  'cache:cases:*',
  'temp:*'
];
for (const pattern of patterns) {
  await client.deletePattern(pattern);
}
`;

console.log(deleteExamples);
console.log();

// ============================================================
// 8. Batch Operations
// ============================================================
console.log('8. Batch Operations');
console.log('-------------------');

console.log(`
// Execute multiple operations
const result = await client.batch([
  { op: 'set', key: 'key1', value: 'val1', ttl: 300 },
  { op: 'set', key: 'key2', value: 'val2', ttl: 300 },
  { op: 'set', key: 'key3', value: 'val3', ttl: 300 },
  { op: 'get', key: 'key1' },
  { op: 'get', key: 'key2' },
  { op: 'delete', key: 'old:key' },
]);

console.log(\`Succeeded: \${result.succeeded}\`);
console.log(\`Failed: \${result.failed}\`);
`);
console.log();

// ============================================================
// 9. Counter Operations
// ============================================================
console.log('9. Counter Operations');
console.log('---------------------');

console.log(`
// Rate limiting example
async function rateLimit(userId: string, limit: number = 10, window: number = 60) {
  const key = \`rate:\${userId}\`;
  const current = await client.increment(key);
  
  if (current === 1) {
    // First request, set expiration
    await client.setWithTTL(key, current, window);
  }
  
  return current <= limit;  // Allow if under limit
}

// View count example
async function incrementViewCount(pageId: string) {
  return await client.increment(\`views:\${pageId}\`);
}

// Analytics counter
const views = await client.increment('page:analytics:views');
const clicks = await client.increment('page:analytics:clicks');
const conversions = await client.increment('page:analytics:conversions');
`);
console.log();

// ============================================================
// 10. Performance & Statistics
// ============================================================
console.log('10. Cache Performance');
console.log('---------------------');

let eventCount = 0;

// Monitor cache performance
client.onCache((event) => {
  eventCount++;
  console.log(`[Cache] ${event.operation}: ${event.duration}ms - ${event.hit ? 'HIT' : 'MISS'}`);
});

console.log('✓ Cache listener registered');
console.log();

// ============================================================
// 11. Common Cache Patterns
// ============================================================
console.log('11. Common Cache Patterns');
console.log('------------------------');

const patterns = `
// Cache-Aside Pattern (Lazy Loading)
async function getUserProfile(userId: string) {
  const cached = await client.get(\`user:\${userId}\`);
  if (cached) return cached;  // Cache hit
  
  const profile = await db.getUser(userId);
  await client.set(\`user:\${userId}\`, profile, { ex: 3600 });
  return profile;
}

// Write-Through Pattern
async function updateUserProfile(userId: string, data: any) {
  await db.updateUser(userId, data);           // Update DB
  await client.set(\`user:\${userId}\`, data); // Update cache
}

// Write-Behind Pattern
async function cacheChange(userId: string, data: any) {
  await client.set(\`user:\${userId}\`, data);  // Update cache
  queue.enqueue(() => db.updateUser(userId, data)); // Queue DB write
}

// Cache Stampede Prevention
async function getWithLock(key: string) {
  const cached = await client.get(key);
  if (cached) return cached;
  
  const lock = await client.set(\`lock:\${key}\`, '1', { nx: true, ex: 5 });
  if (!lock) {
    // Another process is fetching, wait and retry
    await sleep(100);
    return getWithLock(key);
  }
  
  try {
    const data = await fetchData(key);
    await client.set(key, data, { ex: 300 });
    return data;
  } finally {
    await client.delete(\`lock:\${key}\`);
  }
}
`;

console.log(patterns);
console.log();

// ============================================================
// 12. Database Operations
// ============================================================
console.log('12. Database Operations');
console.log('----------------------');

console.log(`
// Health check
await client.ping();  // Returns 'PONG'

// Get server info
const info = await client.info();
console.log(\`Redis version: \${info.redis_version}\`);
console.log(\`Connected clients: \${info.connected_clients}\`);
console.log(\`Memory used: \${info.used_memory} bytes\`);

// Database size
const size = await client.dbSize();
console.log(\`Total keys: \${size}\`);

// Flush operations
await client.flushDb();   // Clear current database
await client.flushAll();  // Clear all databases
`);
console.log();

// ============================================================
// 13. Key Scanning
// ============================================================
console.log('13. Key Scanning');
console.log('----------------');

console.log(`
// Get keys by pattern
const alertKeys = await client.keys('alert:*');
console.log(\`Found \${alertKeys.length} alert keys\`);

// Scan with cursor (for large datasets)
let cursor = '0';
let allKeys = [];

do {
  const result = await client.scan(cursor, 'user:*');
  allKeys.push(...result.keys);
  cursor = result.cursor;
} while (result.hasMore);

console.log(\`Total user keys: \${allKeys.length}\`);
`);
console.log();

// ============================================================
// 14. Statistics & Monitoring
// ============================================================
console.log('14. Cache Statistics');
console.log('--------------------');

const stats = client.getStats();
console.log('Cache Performance Metrics:');
console.log(`  Hits: ${stats.hits}`);
console.log(`  Misses: ${stats.misses}`);
console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`  Sets: ${stats.sets}`);
console.log(`  Deletes: ${stats.deletes}`);
console.log(`  Errors: ${stats.errors}`);
console.log();

// ============================================================
// 15. Feature Summary
// ============================================================
console.log('15. Feature Summary');
console.log('-------------------');

const features = {
  'Basic Operations': ['Set', 'Get', 'Delete', 'Exists'],
  'TTL Management': ['Set with TTL', 'Get TTL', 'Expire keys'],
  'Batch Operations': ['Multi set', 'Multi get', 'Batch execute'],
  'Counters': ['Increment', 'Decrement'],
  'Strings': ['Append', 'Get length'],
  'Scanning': ['Keys by pattern', 'Cursor scan'],
  'Database': ['Database size', 'Flush', 'Info'],
  'Monitoring': ['Cache statistics', 'Hit rate', 'Event listeners'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log(`\nTotal cache events: ${eventCount}`);
console.log(`Connection status: ${client.isConnected_() ? 'Connected' : 'Not connected'}`);
console.log(`Cache stats: ${JSON.stringify(client.getStats(), null, 2)}`);
