/**
 * Database Client - Demo Scenarios
 *
 * Practical examples showing how to use the database client
 * for common operations in the SOC Detection Lab platform.
 */

import { createDatabase, getDatabase, setDatabase } from '../src/index';
import type { IDatabase, IPoolClient } from '../src/types';

/**
 * Demo 1: Basic Connection and Simple Queries
 */
async function demo1_BasicConnection(): Promise<void> {
  console.log('\n=== Demo 1: Basic Connection ===\n');

  const db = createDatabase({
    host: 'localhost',
    port: 5432,
    database: 'soc_lab',
    user: 'soc_admin',
    password: 'SecurePassword123!',
    max: 10
  });

  // Check connection
  const health = await db.healthCheck();
  console.log('Database Health:', {
    status: health.status,
    responseTime: `${health.responseTime}ms`,
    poolStats: health.poolStats
  });

  // Simple query
  const result = await db.query('SELECT NOW() as current_time');
  console.log('Current Database Time:', result.rows[0]);

  await db.close();
}

/**
 * Demo 2: Parameterized Queries (Safe from SQL Injection)
 */
async function demo2_ParameterizedQueries(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 2: Parameterized Queries ===\n');

  // Fetch user by ID (safe from injection)
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const userResult = await db.queryOne(
    'SELECT id, username, email, role_id, created_at FROM users WHERE id = $1',
    [userId]
  );
  console.log('User Found:', userResult);

  // Fetch multiple users with filters
  const status = 'active';
  const limit = 10;
  const users = await db.queryMany(
    'SELECT id, username, email, role_id FROM users WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
    [status, limit]
  );
  console.log(`Found ${users.length} active users`);

  // Complex query with multiple parameters
  const roleId = 'admin-role-id';
  const daysAgo = 7;
  const recentLogins = await db.queryMany(
    `SELECT u.id, u.username, COUNT(l.id) as login_count
     FROM users u
     LEFT JOIN user_sessions l ON u.id = l.user_id AND l.created_at > NOW() - INTERVAL '${daysAgo} days'
     WHERE u.role_id = $1
     GROUP BY u.id, u.username
     ORDER BY login_count DESC`,
    [roleId]
  );
  console.log('Users with recent login activity:', recentLogins.length);
}

/**
 * Demo 3: Transactions - Atomic Operations
 */
async function demo3_Transactions(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 3: Transactions ===\n');

  try {
    // Transfer permission between roles (requires atomicity)
    const result = await db.transaction(async (client: IPoolClient) => {
      // Remove permission from old role
      await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1 AND permission = $2',
        ['old-role-id', 'alert:acknowledge']
      );

      // Add permission to new role
      await client.query(
        'INSERT INTO role_permissions (role_id, permission) VALUES ($1, $2)',
        ['new-role-id', 'alert:acknowledge']
      );

      // Log the change
      await client.query(
        `INSERT INTO audit_logs (actor, action, resource, status) 
         VALUES ($1, $2, $3, $4)`,
        ['admin-user', 'permission_reassigned', 'permission:alert:acknowledge', 'success']
      );

      return { success: true, message: 'Permission transferred atomically' };
    });

    console.log('Transaction Result:', result);
  } catch (error: any) {
    console.error('Transaction failed:', error.message);
  }
}

/**
 * Demo 4: Batch Insert - Efficient Bulk Loading
 */
async function demo4_BatchInsert(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 4: Batch Insert ===\n');

  // Generate sample alert data
  const alerts = Array.from({ length: 5000 }, (_, i) => ({
    id: `alert-${i}`,
    title: `Alert ${i}`,
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    status: 'open',
    created_at: new Date().toISOString()
  }));

  if ('batchInsert' in db) {
    console.log(`Inserting ${alerts.length} alerts...`);
    const startTime = Date.now();

    const inserted = await (db as any).batchInsert('alerts', alerts, 1000);

    const duration = Date.now() - startTime;
    console.log(`Inserted ${inserted} records in ${duration}ms`);
    console.log(`Performance: ${(alerts.length / (duration / 1000)).toFixed(0)} records/sec`);
  }
}

/**
 * Demo 5: Error Handling
 */
async function demo5_ErrorHandling(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 5: Error Handling ===\n');

  // Unique constraint violation
  try {
    await db.query(
      'INSERT INTO users (username, email) VALUES ($1, $2)',
      ['duplicate-user', 'duplicate@example.com']
    );
    // Second insert with same username
    await db.query(
      'INSERT INTO users (username, email) VALUES ($1, $2)',
      ['duplicate-user', 'another@example.com']
    );
  } catch (error: any) {
    console.log('Caught Unique Violation:', error.message);
  }

  // Foreign key constraint
  try {
    await db.query(
      'INSERT INTO user_sessions (user_id) VALUES ($1)',
      ['non-existent-user']
    );
  } catch (error: any) {
    console.log('Caught Foreign Key Violation:', error.message);
  }

  // SQL syntax error
  try {
    await db.query('SELECT * FORM users'); // Typo: FORM instead of FROM
  } catch (error: any) {
    console.log('Caught Syntax Error:', error.message);
  }
}

/**
 * Demo 6: Complex Query with JOIN and Aggregation
 */
async function demo6_ComplexQueries(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 6: Complex Queries ===\n');

  // Get alert statistics by severity
  const alertStats = await db.queryMany(
    `SELECT 
       severity,
       COUNT(*) as total,
       COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged,
       COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
       AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time_seconds
     FROM alerts
     WHERE created_at > NOW() - INTERVAL '7 days'
     GROUP BY severity
     ORDER BY total DESC`
  );

  console.log('Alert Statistics (Last 7 Days):');
  alertStats.forEach((stat: any) => {
    console.log(
      `  ${stat.severity}: ${stat.total} total, ${stat.open} open, ${stat.acknowledged} acknowledged`
    );
  });

  // Get detection rules with most recent detections
  const activeRules = await db.queryMany(
    `SELECT 
       r.id, r.name, r.severity,
       COUNT(d.id) as detection_count,
       MAX(d.created_at) as last_detection
     FROM detection_rules r
     LEFT JOIN detections d ON r.id = d.rule_id AND d.created_at > NOW() - INTERVAL '24 hours'
     WHERE r.status = 'active'
     GROUP BY r.id, r.name, r.severity
     HAVING COUNT(d.id) > 0
     ORDER BY detection_count DESC
     LIMIT 10`
  );

  console.log('Top 10 Rules with Recent Detections:');
  activeRules.forEach((rule: any) => {
    console.log(`  ${rule.name}: ${rule.detection_count} detections (${rule.severity})`);
  });
}

/**
 * Demo 7: Pool Management and Metrics
 */
async function demo7_PoolManagement(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 7: Pool Management ===\n');

  // Get current pool statistics
  const stats = db.getPoolStats();
  console.log('Connection Pool Stats:', {
    totalConnections: stats.totalConnections,
    availableConnections: stats.availableConnections,
    waitingQueue: stats.waitingQueue,
    idleConnections: stats.idleConnections
  });

  // Run multiple queries and monitor pool
  console.log('\nRunning 5 queries...');
  const queryPromises = Array.from({ length: 5 }, (_, i) =>
    db.query(`SELECT $1::int as query_number, NOW() as executed_at`, [i])
  );

  await Promise.all(queryPromises);

  // Get metrics if available
  if ('getMetrics' in db) {
    const metrics = (db as any).getMetrics();
    console.log('Query Metrics:', {
      totalQueries: metrics.totalQueries,
      totalTime: `${metrics.totalTime}ms`,
      averageTime: `${metrics.averageTime.toFixed(2)}ms`,
      errors: metrics.errors
    });
  }

  // Final pool state
  const finalStats = db.getPoolStats();
  console.log('Final Pool Stats:', finalStats);
}

/**
 * Demo 8: Singleton Pattern for Application-wide Access
 */
async function demo8_SingletonPattern(): Promise<void> {
  console.log('\n=== Demo 8: Singleton Pattern ===\n');

  // Initialize once
  const config = {
    host: 'localhost',
    port: 5432,
    database: 'soc_lab',
    user: 'soc_admin',
    password: 'SecurePassword123!'
  };

  const db1 = getDatabase(config);
  console.log('Database instance 1 created');

  // Get same instance throughout application
  const db2 = getDatabase();
  console.log('Database instance 2 retrieved');

  // Verify they're the same instance
  console.log('Same instance?', db1 === db2);

  // Can be used anywhere without re-initialization
  const health = await db2.healthCheck();
  console.log('Health check via second reference:', health.status);
}

/**
 * Demo 9: Event Listeners
 */
async function demo9_EventListeners(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 9: Event Listeners ===\n');

  let queryCount = 0;
  let totalTime = 0;

  // Listen to queries
  db.on('query', (sql: string, duration: number) => {
    queryCount++;
    totalTime += duration;
    if (duration > 100) {
      console.log(`Slow query (${duration}ms): ${sql.substring(0, 60)}...`);
    }
  });

  // Listen to errors
  db.on('error', (error: Error) => {
    console.log(`Database error: ${error.message}`);
  });

  // Run some queries
  await db.query('SELECT 1');
  await db.query('SELECT 2');
  await db.query('SELECT 3');

  console.log(`Executed ${queryCount} queries in ${totalTime}ms`);
}

/**
 * Demo 10: Health Checks and Monitoring
 */
async function demo10_HealthChecks(db: IDatabase): Promise<void> {
  console.log('\n=== Demo 10: Health Checks ===\n');

  // Single health check
  let health = await db.healthCheck();
  console.log('Initial Health Check:', {
    status: health.status,
    responseTime: `${health.responseTime}ms`,
    message: health.message
  });

  // Periodic health monitoring (simulate)
  console.log('\nMonitoring health over time...');
  for (let i = 0; i < 3; i++) {
    health = await db.healthCheck();
    console.log(`Check ${i + 1}: ${health.status} (${health.responseTime}ms)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Alert if degraded
  if (health.status === 'degraded') {
    console.warn('⚠️  Database is degraded! Consider adding more connections.');
  } else if (health.status === 'unhealthy') {
    console.error('❌ Database is unhealthy! Check connection parameters.');
  }
}

/**
 * Main Demo Runner
 */
export async function runAllDemos(): Promise<void> {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Database Client - Demo Scenarios     ║');
  console.log('╚════════════════════════════════════════╝');

  const config = {
    host: 'localhost',
    port: 5432,
    database: 'soc_lab',
    user: 'soc_admin',
    password: 'SecurePassword123!',
    max: 20
  };

  const db = createDatabase(config);

  try {
    // Note: Demos 1-10 would run with actual database
    // This is pseudocode showing usage patterns

    console.log('\n✓ Database Client initialized');
    console.log('✓ Type-safe connection pooling');
    console.log('✓ Transaction support with rollback');
    console.log('✓ Batch operations for bulk inserts');
    console.log('✓ Event listeners for monitoring');
    console.log('✓ Health checks and metrics');
    console.log('✓ Singleton pattern for app-wide access');
    console.log('✓ Comprehensive error handling');

    // Verify connection
    const health = await db.healthCheck();
    if (health.status !== 'unhealthy') {
      console.log('\n✓ Successfully connected to PostgreSQL');
    }
  } catch (error: any) {
    console.error('Demo error:', error.message);
  } finally {
    await db.close();
  }
}

// Export individual demos for selective execution
export {
  demo1_BasicConnection,
  demo2_ParameterizedQueries,
  demo3_Transactions,
  demo4_BatchInsert,
  demo5_ErrorHandling,
  demo6_ComplexQueries,
  demo7_PoolManagement,
  demo8_SingletonPattern,
  demo9_EventListeners,
  demo10_HealthChecks
};
