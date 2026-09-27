/**
 * PostgreSQL Client - Demo/Prototype
 * Demonstrates database connection, queries, transactions, and monitoring
 */

import { PostgresClient, createPostgresClient } from '../src/main';
import type { IPoolConfig } from '../src/types';

console.log('=== PostgreSQL Client - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. Client Configuration');
console.log('----------------------');

const config: IPoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'soc_lab',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,                    // Maximum pool connections
  min: 5,                     // Minimum pool connections
  idleTimeoutMillis: 30000,   // Idle timeout
  connectionTimeoutMillis: 5000, // Connection timeout
  maxUses: 7500,              // Max uses per connection
};

console.log('Pool Configuration:');
console.log(`  Host: ${config.host}:${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  Pool size: ${config.min}-${config.max}`);
console.log(`  Idle timeout: ${config.idleTimeoutMillis}ms`);
console.log();

// ============================================================
// 2. Client Creation
// ============================================================
console.log('2. Client Creation');
console.log('------------------');

const client = createPostgresClient(config);
console.log('✓ PostgreSQL client created');
console.log(`  Ready: ${client.isReady()}`);
console.log();

// ============================================================
// 3. Connection Pool Monitoring
// ============================================================
console.log('3. Connection Pool Statistics');
console.log('-----------------------------');

const stats = client.getStatistics();
console.log('Pool Statistics:');
console.log(`  Total connections: ${stats.totalConnections}`);
console.log(`  Idle connections: ${stats.idleConnections}`);
console.log(`  Active connections: ${stats.activeConnections}`);
console.log(`  Waiting requests: ${stats.waitingRequests}`);
console.log(`  Query count: ${stats.createdConnections}`);
console.log(`  Error count: ${stats.errorCount}`);
console.log();

// ============================================================
// 4. Event Listeners
// ============================================================
console.log('4. Event Listeners');
console.log('------------------');

let queryEventCount = 0;
let connectionEventCount = 0;

// Register query listener
client.onQuery((event) => {
  queryEventCount++;
  console.log(`[Query Event] ${event.query}`);
  console.log(`  Duration: ${event.duration}ms`);
  console.log(`  Rows: ${event.rowCount}`);
});

// Register connection listener
client.onConnection((event) => {
  connectionEventCount++;
  console.log(`[Connection Event] ${event.type}`);
  console.log(`  Pool size: ${event.poolSize}`);
});

console.log('✓ Query listener registered');
console.log('✓ Connection listener registered');
console.log();

// ============================================================
// 5. Query Examples (Simulated)
// ============================================================
console.log('5. Query Examples');
console.log('-----------------');

const queryExamples = [
  {
    name: 'Simple SELECT',
    text: 'SELECT * FROM alerts LIMIT 10',
    values: undefined,
  },
  {
    name: 'SELECT with Parameters',
    text: 'SELECT * FROM alerts WHERE severity = $1 AND created_at > $2',
    values: ['high', '2024-01-01'],
  },
  {
    name: 'Aggregation',
    text: 'SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity',
    values: undefined,
  },
  {
    name: 'JOIN Query',
    text: `SELECT a.id, a.title, c.name FROM alerts a 
           LEFT JOIN cases c ON a.case_id = c.id LIMIT 5`,
    values: undefined,
  },
  {
    name: 'INSERT with RETURNING',
    text: `INSERT INTO audit_logs (user_id, action, resource) 
           VALUES ($1, $2, $3) RETURNING id, created_at`,
    values: ['user-123', 'create', 'alert-456'],
  },
];

queryExamples.forEach((example) => {
  console.log(`• ${example.name}`);
  console.log(`  Query: ${example.text.substring(0, 60)}...`);
  if (example.values) {
    console.log(`  Parameters: ${JSON.stringify(example.values)}`);
  }
});
console.log();

// ============================================================
// 6. Query Timeout Options
// ============================================================
console.log('6. Query Timeout Options');
console.log('------------------------');

const queryOptions = [
  {
    name: 'Default (30s)',
    options: {},
  },
  {
    name: 'Custom Timeout (5s)',
    options: { timeout: 5000 },
  },
  {
    name: 'With Retry (3x)',
    options: { retry: 3, retryDelay: 100 },
  },
  {
    name: 'Short Timeout + Retry',
    options: { timeout: 2000, retry: 2, retryDelay: 500 },
  },
];

queryOptions.forEach((opt) => {
  console.log(`• ${opt.name}`);
  console.log(`  Options: ${JSON.stringify(opt.options)}`);
});
console.log();

// ============================================================
// 7. Transaction Examples
// ============================================================
console.log('7. Transaction Patterns');
console.log('----------------------');

console.log('Pattern 1: Basic Transaction');
console.log(`
async function updateAlertStatus(alertId: string, status: string) {
  return await client.transaction(async (dbClient) => {
    // Get current alert
    const alert = await dbClient.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
    
    // Update alert
    await dbClient.query('UPDATE alerts SET status = $1 WHERE id = $2', [status, alertId]);
    
    // Create audit log
    await dbClient.query(
      'INSERT INTO audit_logs (action, resource_id) VALUES ($1, $2)',
      ['update_status', alertId]
    );
    
    return alert.rows[0];
  });
}
`);

console.log('Pattern 2: Transaction with Isolation Level');
console.log(`
async function createCaseWithAlerts(caseData: any) {
  return await client.transaction(
    async (dbClient) => {
      // Create case
      const caseResult = await dbClient.query(
        'INSERT INTO cases (title, description) VALUES ($1, $2) RETURNING id',
        [caseData.title, caseData.description]
      );
      
      const caseId = caseResult.rows[0].id;
      
      // Link alerts
      for (const alert of caseData.alerts) {
        await dbClient.query(
          'UPDATE alerts SET case_id = $1 WHERE id = $2',
          [caseId, alert.id]
        );
      }
      
      return caseId;
    },
    { isolationLevel: 'SERIALIZABLE' }
  );
}
`);
console.log();

// ============================================================
// 8. Pagination
// ============================================================
console.log('8. Pagination Example');
console.log('---------------------');

console.log(`
async function getAlertsPaginated(page: number = 1, limit: number = 20) {
  const query = 'SELECT * FROM alerts';
  
  const result = await client.paginated(
    query,
    [],              // parameters
    page,            // page number
    limit            // items per page
  );
  
  console.log(\`Page \${result.pagination.page} of \${result.pagination.pages}\`);
  console.log(\`Total: \${result.pagination.total} items\`);
  console.log(\`Results: \${result.data.length} items\`);
  
  return result;
}

// Usage:
// Page 1: getAlertsPaginated(1, 20)  → items 1-20
// Page 2: getAlertsPaginated(2, 20)  → items 21-40
// Page 3: getAlertsPaginated(3, 20)  → items 41-60
`);
console.log();

// ============================================================
// 9. Batch Operations
// ============================================================
console.log('9. Batch Insert Example');
console.log('----------------------');

console.log(`
async function importAlerts(alerts: Alert[]) {
  // Insert all alerts in batches of 100
  const inserted = await client.batchInsert(
    'alerts',
    alerts,
    100  // chunk size
  );
  
  console.log(\`Inserted \${inserted} alerts\`);
  return inserted;
}

// Example with 5000 alerts:
// - Batch 1: inserts 100 alerts (transaction)
// - Batch 2: inserts 100 alerts (transaction)
// - ...
// - Batch 50: inserts 100 alerts (transaction)
// Total: 5000 alerts inserted
`);
console.log();

// ============================================================
// 10. Health Checks
// ============================================================
console.log('10. Health Check Example');
console.log('------------------------');

console.log(`
async function checkDatabaseHealth() {
  const health = await client.healthCheck();
  
  console.log('Database Health:');
  console.log('  Healthy:', health.healthy);
  console.log('  Connection time:', health.connectionTime, 'ms');
  console.log('  Total connections:', health.poolStats?.totalCount);
  console.log('  Idle connections:', health.poolStats?.idleCount);
  
  return health;
}

// Response example (healthy):
// {
//   healthy: true,
//   timestamp: 2024-01-15T10:30:00Z,
//   connectionTime: 2,
//   poolStats: {
//     totalCount: 10,
//     idleCount: 8,
//     waitingCount: 0
//   }
// }

// Response example (unhealthy):
// {
//   healthy: false,
//   timestamp: 2024-01-15T10:30:00Z,
//   error: 'connect ECONNREFUSED 127.0.0.1:5432'
// }
`);
console.log();

// ============================================================
// 11. Error Handling with Error Module
// ============================================================
console.log('11. Error Handling Integration');
console.log('------------------------------');

console.log(`
import { DatabaseError, ErrorUtils } from '@soc-detection-lab/error-handling';

async function safeQuery(query: string, params: any[]) {
  try {
    const result = await client.query(query, params);
    return result;
  } catch (err) {
    // Convert to DatabaseError
    const dbError = new DatabaseError(
      'Query execution failed',
      query,
      'alerts'
    );
    
    // Add context
    dbError.withContext({
      userId: 'analyst-123',
      requestId: 'req-789',
    });
    
    // Check if retryable
    if (ErrorUtils.isRetryable(dbError)) {
      const strategy = ErrorUtils.getRecoveryStrategy(dbError);
      // Implement retry logic
    }
    
    throw dbError;
  }
}
`);
console.log();

// ============================================================
// 12. Listener Management
// ============================================================
console.log('12. Listener Management');
console.log('----------------------');

console.log('Registering Multiple Listeners:');

const queryListener1 = (event: any) => console.log('Listener 1: Query executed');
const queryListener2 = (event: any) => console.log('Listener 2: Query executed');
const connectionListener = (event: any) => console.log('Connection event:', event.type);

client
  .onQuery(queryListener1)
  .onQuery(queryListener2)
  .onConnection(connectionListener);

console.log('✓ Multiple listeners registered');
console.log('✓ Chainable API in use');
console.log();

// ============================================================
// 13. Pool Monitoring
// ============================================================
console.log('13. Pool Monitoring');
console.log('-------------------');

const monitoringExample = `
// Periodic monitoring
setInterval(() => {
  const stats = client.getStatistics();
  
  if (stats.activeConnections > stats.totalConnections * 0.8) {
    console.warn('Pool near capacity:', stats.activeConnections, '/', stats.totalConnections);
  }
  
  if (stats.errorCount > 0) {
    console.error('Database errors:', stats.errorCount);
  }
  
  console.log('Active queries:', stats.activeConnections);
  console.log('Waiting requests:', stats.waitingRequests);
}, 30000);  // Every 30 seconds
`;

console.log(monitoringExample);
console.log();

// ============================================================
// 14. Initialization Pattern
// ============================================================
console.log('14. Application Initialization');
console.log('------------------------------');

console.log(`
async function startApplication() {
  // Create client
  const client = createPostgresClient(config);
  
  // Initialize pool
  await client.initialize();
  console.log('✓ Database connected');
  
  // Verify health
  const health = await client.healthCheck();
  if (!health.healthy) {
    throw new Error('Database health check failed');
  }
  console.log('✓ Database health check passed');
  
  // Start application
  startServer(client);
}

// On shutdown
async function shutdown() {
  console.log('Closing database connections...');
  await client.close();
  console.log('✓ Database closed');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
`);
console.log();

// ============================================================
// 15. Summary
// ============================================================
console.log('15. Feature Summary');
console.log('-------------------');

const features = {
  'Connection Pooling': ['Min/Max connections', 'Idle timeout', 'Connection timeout'],
  'Query Execution': ['Parameterized queries', 'Timeout support', 'Retry support'],
  'Transactions': ['BEGIN/COMMIT/ROLLBACK', 'Isolation levels', 'Automatic rollback'],
  'Pagination': ['Offset/limit', 'Total count', 'Page calculations'],
  'Batch Operations': ['Bulk inserts', 'Configurable chunks', 'Transaction wrapped'],
  'Monitoring': ['Health checks', 'Pool statistics', 'Query/connection events'],
  'Listeners': ['Query events', 'Connection events', 'Chainable API'],
  'Error Handling': ['Works with error-handling module', 'Graceful failures', 'Error tracking'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log(`\nTotal query events: ${queryEventCount}`);
console.log(`Total connection events: ${connectionEventCount}`);
console.log(`Current pool stats: ${JSON.stringify(client.getStatistics(), null, 2)}`);
