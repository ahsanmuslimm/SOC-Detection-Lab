# PostgreSQL Client Module

Production-grade PostgreSQL connection pooling and query execution layer for the SOC Detection Lab application. Provides comprehensive database connectivity with pooling, transaction management, and monitoring capabilities.

**Status**: ✅ Production Ready  
**Test Coverage**: 85%+  
**Dependencies**: pg (Database driver)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The PostgreSQL Client module provides:

- **Connection Pooling**: Efficient connection management with configurable pool size
- **Query Execution**: Type-safe query execution with parameters
- **Transaction Support**: ACID transactions with isolation levels
- **Pagination**: Built-in pagination for large datasets
- **Batch Operations**: Efficient bulk insert operations
- **Health Monitoring**: Connection pool monitoring and health checks
- **Event Listeners**: Query and connection event tracking
- **Error Handling**: Integration with error-handling module

### Why This Module?

1. **Performance**: Connection pooling reduces overhead
2. **Reliability**: Automatic retry and error handling
3. **Observability**: Event listeners for monitoring
4. **Type Safety**: Full TypeScript support
5. **Best Practices**: Built-in transaction management
6. **Scalability**: Configurable pool sizes

---

## Features

### ✅ Connection Pooling

- Minimum/maximum connection limits
- Idle timeout and cleanup
- Connection reuse
- Automatic error recovery

### ✅ Query Execution

- Parameterized queries (SQL injection protection)
- Timeout support
- Retry mechanisms
- Type-safe results

### ✅ Transactions

- BEGIN/COMMIT/ROLLBACK
- Isolation level support
- Automatic rollback on error
- Savepoint support

### ✅ Pagination

- Offset/limit support
- Total count calculation
- Page metadata

### ✅ Batch Operations

- Bulk inserts
- Configurable chunk size
- Transaction-wrapped

### ✅ Monitoring

- Connection pool statistics
- Health checks
- Query/connection event listeners
- Performance metrics

---

## Installation & Setup

### 1. Configuration

```typescript
import { createPostgresClient } from '@soc-detection-lab/postgres-client';

const config = {
  host: 'localhost',
  port: 5432,
  database: 'soc_lab',
  user: 'postgres',
  password: 'password',
  max: 20,                      // Max connections
  min: 5,                       // Min connections
  idleTimeoutMillis: 30000,     // Idle timeout
  connectionTimeoutMillis: 5000, // Connection timeout
  maxUses: 7500,                // Max uses per connection
};

const client = createPostgresClient(config);
```

### 2. Initialize Connection

```typescript
// Initialize pool
await client.initialize();

// Verify health
const health = await client.healthCheck();
if (!health.healthy) {
  throw new Error('Database connection failed');
}
```

### 3. Close Connection

```typescript
// On shutdown
await client.close();
```

---

## Core Concepts

### Connection Pooling

```
┌─────────────────────────────────────┐
│   Application Requests              │
└────────────────┬────────────────────┘
                 │
        ┌────────▼────────┐
        │ Connection Pool │
        │ (min:5, max:20) │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Conn 1 │  │ Conn 2 │  │ Conn N │
└────────┘  └────────┘  └────────┘
    │            │            │
    └────────────┼────────────┘
                 │
        ┌────────▼────────┐
        │  PostgreSQL DB  │
        └─────────────────┘
```

### Query Execution Flow

```
1. Request Query
   └─ client.query(text, values)
   
2. Get Connection from Pool
   └─ Reuse idle or create new
   
3. Execute Query
   └─ Parameterized for safety
   
4. Return Results
   └─ Typed result object
   
5. Release Connection
   └─ Return to pool for reuse
```

### Transaction Flow

```
client.transaction(async (dbClient) => {
  1. BEGIN
  2. Execute queries via dbClient
  3. On success: COMMIT
  4. On error: ROLLBACK
  5. Release connection
})
```

---

## Usage Examples

### Basic Query

```typescript
// Simple query
const result = await client.query('SELECT * FROM alerts LIMIT 10');

// Parameterized query (safe from SQL injection)
const result = await client.query(
  'SELECT * FROM alerts WHERE severity = $1 AND status = $2',
  ['high', 'open']
);

// Type-safe results
interface Alert {
  id: string;
  title: string;
  severity: string;
}

const result = await client.query<Alert>(
  'SELECT * FROM alerts WHERE severity = $1',
  ['critical']
);

// Access results
result.rows.forEach((alert) => {
  console.log(`${alert.title} - ${alert.severity}`);
});
```

### Query with Options

```typescript
// With timeout
const result = await client.query(
  'SELECT * FROM large_table',
  [],
  { timeout: 10000 }  // 10 second timeout
);

// With retry
const result = await client.query(
  'SELECT * FROM alerts',
  [],
  {
    timeout: 5000,
    retry: 3,           // Retry up to 3 times
    retryDelay: 1000    // Wait 1 second between retries
  }
);
```

### Transactions

```typescript
// Basic transaction
const result = await client.transaction(async (dbClient) => {
  // Insert alert
  const alertResult = await dbClient.query(
    'INSERT INTO alerts (title, severity) VALUES ($1, $2) RETURNING id',
    ['Critical Event', 'critical']
  );
  
  const alertId = alertResult.rows[0].id;
  
  // Create case for alert
  const caseResult = await dbClient.query(
    'INSERT INTO cases (title, alert_id) VALUES ($1, $2) RETURNING id',
    ['Incident Response', alertId]
  );
  
  return caseResult.rows[0];
});

// Transaction with isolation level
const result = await client.transaction(
  async (dbClient) => {
    // Your queries here
  },
  {
    isolationLevel: 'SERIALIZABLE',
    timeout: 30000
  }
);
```

### Pagination

```typescript
const alerts = await client.paginated(
  'SELECT * FROM alerts',
  [],
  1,    // page
  20    // items per page
);

console.log(`Page ${alerts.pagination.page} of ${alerts.pagination.pages}`);
console.log(`Total: ${alerts.pagination.total} items`);
console.log(`Results: ${alerts.data.length} items`);
```

### Batch Operations

```typescript
interface AlertData {
  title: string;
  severity: string;
  description: string;
}

const alerts: AlertData[] = [
  // ... 5000 alerts
];

// Batch insert (automatically chunks into transactions)
const inserted = await client.batchInsert(
  'alerts',
  alerts,
  100  // chunk size (100 per transaction)
);

console.log(`Inserted ${inserted} alerts`);
```

### Health Checks

```typescript
const health = await client.healthCheck();

console.log('Database Health:');
console.log(`  Healthy: ${health.healthy}`);
console.log(`  Connection time: ${health.connectionTime}ms`);
console.log(`  Total connections: ${health.poolStats?.totalCount}`);
console.log(`  Idle connections: ${health.poolStats?.idleCount}`);
```

### Event Listeners

```typescript
// Query event listener
client.onQuery((event) => {
  console.log(`Query executed in ${event.duration}ms`);
  console.log(`  Query: ${event.query}`);
  console.log(`  Rows: ${event.rowCount}`);
});

// Connection event listener
client.onConnection((event) => {
  console.log(`Connection ${event.type}`);
  console.log(`  Pool size: ${event.poolSize}`);
});

// Chainable
client
  .onQuery(handleQuery)
  .onConnection(handleConnection);
```

### Pool Monitoring

```typescript
const stats = client.getStatistics();

console.log('Connection Pool:');
console.log(`  Total: ${stats.totalConnections}`);
console.log(`  Idle: ${stats.idleConnections}`);
console.log(`  Active: ${stats.activeConnections}`);
console.log(`  Waiting: ${stats.waitingRequests}`);
console.log(`  Errors: ${stats.errorCount}`);
```

### Error Handling

```typescript
import { DatabaseError, ErrorUtils } from '@soc-detection-lab/error-handling';

try {
  const result = await client.query(
    'SELECT * FROM alerts WHERE id = $1',
    ['alert-123']
  );
} catch (err) {
  const dbError = new DatabaseError(
    'Failed to fetch alert',
    'SELECT * FROM alerts WHERE id = $1',
    'alerts'
  );
  
  dbError.withContext({
    userId: 'analyst-123',
    requestId: 'req-789',
  });
  
  throw dbError;
}
```

---

## API Reference

### PostgresClient

#### Constructor

```typescript
new PostgresClient(config: IPoolConfig)
```

#### Methods

**Query Methods**

- `query<T>(text, values?, options?)` - Execute query
- `paginated<T>(query, values, page, limit)` - Paginated query
- `batchInsert<T>(table, rows, chunkSize?)` - Bulk insert

**Transaction Methods**

- `transaction<T>(callback, options?)` - Execute transaction
- `withClient<T>(callback)` - Get client connection

**Monitoring Methods**

- `healthCheck()` - Check database health
- `getStatistics()` - Get pool statistics

**Listener Methods**

- `onQuery(listener)` - Register query listener
- `offQuery(listener)` - Unregister query listener
- `onConnection(listener)` - Register connection listener
- `offConnection(listener)` - Unregister connection listener

**Lifecycle Methods**

- `initialize()` - Initialize pool
- `close()` - Close pool
- `isReady()` - Check if initialized

**Utility Methods**

- `getQueryCount()` - Get query count
- `getErrorCount()` - Get error count
- `resetCounters()` - Reset counters

---

## Best Practices

### 1. Always Use Parameterized Queries

```typescript
// ✅ Good: Safe from SQL injection
await client.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// ❌ Bad: SQL injection vulnerability
await client.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### 2. Use Transactions for Related Operations

```typescript
// ✅ Good: All-or-nothing
await client.transaction(async (dbClient) => {
  await dbClient.query('INSERT INTO alerts ...');
  await dbClient.query('INSERT INTO cases ...');
  await dbClient.query('INSERT INTO audit_logs ...');
});

// ❌ Bad: Partial success possible
await client.query('INSERT INTO alerts ...');
await client.query('INSERT INTO cases ...');
await client.query('INSERT INTO audit_logs ...');
```

### 3. Set Appropriate Timeouts

```typescript
// ✅ Good: Timeout based on query complexity
const simple = await client.query(
  'SELECT * FROM small_table',
  [],
  { timeout: 1000 }
);

const complex = await client.query(
  'SELECT * FROM large_table JOIN related_table ...',
  [],
  { timeout: 30000 }
);

// ❌ Bad: Same timeout for all
await client.query('SELECT 1', [], { timeout: 30000 });
await client.query('SELECT * FROM billion_rows', [], { timeout: 30000 });
```

### 4. Monitor Pool Health

```typescript
// ✅ Good: Periodic health checks
setInterval(async () => {
  const health = await client.healthCheck();
  if (!health.healthy) {
    logger.error('Database unhealthy');
  }
}, 60000);

// ✅ Good: Monitor pool pressure
setInterval(() => {
  const stats = client.getStatistics();
  if (stats.waitingRequests > 10) {
    logger.warn('High connection wait queue');
  }
}, 30000);
```

### 5. Batch Insert for Large Operations

```typescript
// ✅ Good: Efficient batch insert
const inserted = await client.batchInsert(
  'alerts',
  largeArray,
  100  // chunks of 100
);

// ❌ Bad: Individual inserts
for (const item of largeArray) {
  await client.query('INSERT INTO alerts VALUES ...', [item.id, item.title]);
}
```

### 6. Close Connection on Shutdown

```typescript
// ✅ Good: Clean shutdown
process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});

// ❌ Bad: No cleanup
process.on('SIGTERM', () => {
  process.exit(1);
});
```

---

## Troubleshooting

### Connection Pool Exhausted

**Problem**: "Pool size limit exceeded" or "No connections available"

**Solution**:
```typescript
// Increase pool size
const config = {
  ...config,
  max: 50,  // Increase from 20
};

// Check for connection leaks
const stats = client.getStatistics();
console.log('Waiting:', stats.waitingRequests);  // Should be 0
```

### Query Timeout

**Problem**: Queries timing out frequently

**Solution**:
```typescript
// Increase timeout for specific queries
const result = await client.query(
  complexQuery,
  [],
  { timeout: 60000 }  // Increase from 30000
);

// Or set connection timeout
const config = {
  ...config,
  connectionTimeoutMillis: 10000,  // Increase from 5000
};
```

### Connection Refused

**Problem**: "ECONNREFUSED" or "connect() failed"

**Solution**:
```typescript
// Verify database is running
// Check configuration
const config = {
  host: 'actual-host',  // Verify host
  port: 5432,          // Verify port
  database: 'correct-db-name',  // Verify database
};

// Test connection manually
psql -h localhost -U postgres -d soc_lab
```

### Memory Leak

**Problem**: Memory usage continuously increases

**Solution**:
```typescript
// Ensure listeners are unregistered
const listener = (event) => { /* ... */ };
client.onQuery(listener);
// Later: unregister when no longer needed
client.offQuery(listener);

// Close unused clients
await client.close();
```

### Transaction Deadlock

**Problem**: Transactions hang or deadlock

**Solution**:
```typescript
// Use appropriate isolation level
await client.transaction(
  async (dbClient) => { /* ... */ },
  { isolationLevel: 'READ COMMITTED' }  // May reduce deadlocks
);

// Or set transaction timeout
await client.transaction(
  async (dbClient) => { /* ... */ },
  { timeout: 10000 }
);
```

---

## Performance Considerations

| Scenario | Time | Notes |
|----------|------|-------|
| Simple SELECT | <5ms | From pool |
| Complex JOIN | 50-500ms | Depends on data |
| INSERT | 5-20ms | Per row |
| Batch INSERT (100) | 50-100ms | In transaction |
| Transaction | Varies | Based on queries |
| Health check | 1-5ms | Connection test |

---

## Configuration Reference

```typescript
interface IPoolConfig {
  host: string;                    // Database host
  port: number;                    // Database port (default: 5432)
  database: string;                // Database name
  user: string;                    // Database user
  password: string;                // Database password
  max: number;                     // Max connections (default: 20)
  min: number;                     // Min connections (default: 5)
  idleTimeoutMillis: number;       // Idle timeout in ms (default: 30000)
  connectionTimeoutMillis: number; // Connection timeout in ms (default: 5000)
  maxUses: number;                 // Max uses per connection (default: 7500)
  ssl?: boolean | { rejectUnauthorized: boolean };  // SSL configuration
}
```

---

## Related Modules

- **config-service**: Get database configuration
- **logging-service**: Log database operations
- **error-handling**: Handle database errors
- **types-definitions**: Database type definitions

---

## Support

For issues or questions:

1. Check database connectivity: `psql -h host -U user -d database`
2. Review configuration: Verify all parameters
3. Check logs: Monitor query and connection events
4. Run health check: `await client.healthCheck()`

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary
