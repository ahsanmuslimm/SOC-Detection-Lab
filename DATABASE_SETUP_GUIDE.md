# Database Setup Guide - Phase 1, Week 2

Quick reference for setting up PostgreSQL and running database migrations.

## Prerequisites

- PostgreSQL 15+ installed
- psql command-line tool
- Node.js 18+
- npm packages installed (`npm install`)

## Installation

### macOS (Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify installation
postgres --version
```

### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt-get update

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Verify installation
sudo -u postgres psql --version
```

### Windows

1. Download from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow wizard
3. During setup, set password for `postgres` user
4. PostgreSQL will start as Windows service automatically
5. Verify: Open `psql` from Start menu

## Create Database and User

```bash
# Connect as postgres user (macOS/Linux)
psql -U postgres

# Or on Windows, open pgAdmin or use psql directly

# Create database
CREATE DATABASE soc_lab;

# Create user
CREATE USER soc_admin WITH PASSWORD 'SecurePassword123!';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE soc_lab TO soc_admin;

# Connect to database and grant schema privileges
\c soc_lab
GRANT ALL ON SCHEMA public TO soc_admin;

# Verify
\du  # List users
\l   # List databases
```

## Configuration

### Create .env file

```bash
# In project root
cp .env.example .env

# Edit .env with your database credentials
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=soc_lab
DATABASE_USER=soc_admin
DATABASE_PASSWORD=SecurePassword123!
DATABASE_POOL_SIZE=10
```

## Run Migrations

### Option 1: Using npm script (if configured)

```bash
# Run pending migrations
npm run db:migrate

# Rollback last batch
npm run db:rollback

# Seed initial data
npm run db:seed
```

### Option 2: Using psql directly

```bash
# Run migration
psql -U soc_admin -d soc_lab -f database/migrations/001_init_schema.sql

# Run seed data
psql -U soc_admin -d soc_lab -f database/seeds/001_seed_initial_data.sql

# Verify schema
psql -U soc_admin -d soc_lab -c "\dt"  # List tables
```

### Option 3: Manual step-by-step

```bash
# Connect to database
psql -U soc_admin -d soc_lab

# In psql prompt:

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  -- ... (see full schema in migrations/001_init_schema.sql)
);

-- ... (create remaining tables from migration file)

-- Insert seed data
INSERT INTO roles (name, permissions) VALUES (
  'SOC_ANALYST',
  '["alert:read", "alert:acknowledge"]'::jsonb
);
-- ... (see full seed data in seeds/001_seed_initial_data.sql)
```

## Verify Installation

```bash
# Connect to database
psql -U soc_admin -d soc_lab

# In psql:

-- Check tables
\dt

-- Expected output:
-- public | alerts              | table | soc_admin
-- public | audit_logs          | table | soc_admin
-- public | cases               | table | soc_admin
-- public | detections          | table | soc_admin
-- public | detection_rules     | table | soc_admin
-- public | evidence            | table | soc_admin
-- public | integration_logs    | table | soc_admin
-- public | investigations      | table | soc_admin
-- public | metrics             | table | soc_admin
-- public | notifications       | table | soc_admin
-- public | reports             | table | soc_admin
-- public | roles               | table | soc_admin
-- public | system_config       | table | soc_admin
-- public | user_sessions       | table | soc_admin
-- public | users               | table | soc_admin

-- Check users
SELECT * FROM roles;

-- Expected: 5 roles (SOC_ANALYST, DETECTION_ENGINEER, SOC_MANAGER, ADMIN, VIEWER)

SELECT COUNT(*) FROM users;

-- Expected: 6 demo users

SELECT COUNT(*) FROM alerts;

-- Expected: 3 demo alerts

-- Check indexes
\di

-- Expected: 30+ indexes created

-- Check triggers
\dy

-- Expected: 3 triggers for timestamp updates
```

## Initialize from Code

### Using Database Client

```typescript
import { createDatabaseWithCheck } from './database-client/src/index';

async function initializeDatabase() {
  const db = await createDatabaseWithCheck({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
  });

  console.log('✓ Database connected');

  // Verify schema
  const tables = await db.queryMany(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  
  console.log(`✓ Found ${tables.length} tables`);

  // Check data
  const userCount = await db.queryOne(
    'SELECT COUNT(*) as count FROM users'
  );
  
  console.log(`✓ Found ${userCount.count} users`);

  await db.close();
}

initializeDatabase().catch(console.error);
```

## Test Connection

### Using psql

```bash
# Connection test
psql -U soc_admin -d soc_lab -c "SELECT NOW();"

# Should output current timestamp:
# 2024-01-15 14:23:45.123456+00:00
```

### Using Node.js

```typescript
import { createDatabase } from './database-client/src/index';

const db = createDatabase({
  host: 'localhost',
  port: 5432,
  database: 'soc_lab',
  user: 'soc_admin',
  password: 'SecurePassword123!'
});

// Test connection
db.query('SELECT NOW() as timestamp')
  .then(result => {
    console.log('✓ Connected:', result.rows[0]);
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ Connection failed:', error.message);
    process.exit(1);
  });
```

## Troubleshooting

### "FATAL: database does not exist"

**Problem**: Database not created

**Solution**:
```bash
psql -U postgres -c "CREATE DATABASE soc_lab;"
```

### "FATAL: role 'soc_admin' does not exist"

**Problem**: User not created

**Solution**:
```bash
psql -U postgres -c "CREATE USER soc_admin WITH PASSWORD 'SecurePassword123!';"
psql -U postgres -d soc_lab -c "GRANT ALL PRIVILEGES ON DATABASE soc_lab TO soc_admin;"
```

### "FATAL: Ident authentication failed"

**Problem**: PostgreSQL authentication issue (Linux)

**Solution**: Edit `/etc/postgresql/15/main/pg_hba.conf` and change:
```
# From:
local   all             all                                     peer

# To:
local   all             all                                     md5
```

Then restart:
```bash
sudo systemctl restart postgresql
```

### "Connection refused at 127.0.0.1:5432"

**Problem**: PostgreSQL not running

**Solution**:
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Windows - Use Services app or:
net start postgresql-x64-15
```

### "Too many connections"

**Problem**: Connection pool exhausted

**Solution**: Reduce pool size in .env:
```bash
DATABASE_POOL_SIZE=5
```

Or increase PostgreSQL max_connections in postgresql.conf:
```
max_connections = 200
```

## Backup and Restore

### Backup Database

```bash
# Full backup
pg_dump -U soc_admin -d soc_lab > soc_lab_backup.sql

# Compressed backup
pg_dump -U soc_admin -d soc_lab | gzip > soc_lab_backup.sql.gz

# With verbose output
pg_dump -U soc_admin -d soc_lab -v > soc_lab_backup_verbose.sql
```

### Restore Database

```bash
# From SQL file
psql -U soc_admin -d soc_lab < soc_lab_backup.sql

# From compressed file
gunzip -c soc_lab_backup.sql.gz | psql -U soc_admin -d soc_lab

# Create fresh and restore
dropdb -U postgres soc_lab
createdb -U postgres soc_lab
psql -U soc_admin -d soc_lab < soc_lab_backup.sql
```

## Performance Tuning

### PostgreSQL Configuration (postgresql.conf)

```ini
# Shared memory - typically 25% of system RAM
shared_buffers = 256MB

# Working memory - total for all operations
work_mem = 16MB

# Effective cache size - typically 50-75% of system RAM
effective_cache_size = 1GB

# Maintenance - tune for VACUUM and CREATE INDEX
maintenance_work_mem = 64MB

# Connection pooling
max_connections = 100

# Logging slow queries
log_min_duration_statement = 1000  # 1 second
```

### Database Client Pool Configuration

```typescript
const db = createDatabase({
  host: 'localhost',
  database: 'soc_lab',
  user: 'soc_admin',
  password: 'SecurePassword123!',
  
  // Connection pooling
  max: 20,                        // Max connections in pool
  idleTimeoutMillis: 30000,      // 30 seconds
  connectionTimeoutMillis: 5000   // 5 seconds
});
```

## Common Commands

```bash
# Connect to database
psql -U soc_admin -d soc_lab

# In psql prompt:

# List databases
\l

# Connect to database
\c soc_lab

# List tables
\dt

# List indexes
\di

# List triggers
\dy

# Check table structure
\d users

# Check table size
SELECT pg_size_pretty(pg_total_relation_size('users'));

# Check all tables sizes
SELECT 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Count rows in all tables
SELECT 
  schemaname, 
  tablename, 
  n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;

# Check slow queries
SELECT 
  query, 
  mean_exec_time, 
  calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

# Exit psql
\q
```

## Next Steps

1. **Initialize Database** - Run migrations and seed data
2. **Verify Connection** - Test with database client
3. **Check Schema** - List tables and verify structure
4. **Review Data** - Query roles, users, sample data
5. **Monitor Performance** - Check connection pool stats
6. **Setup Backups** - Configure automated backups

## Security Considerations

### Change Default Passwords

```bash
psql -U postgres -c "ALTER USER soc_admin WITH PASSWORD 'NewSecurePassword123!';"
```

### Restrict Network Access

```bash
# In pg_hba.conf:
# Only allow local connections
local   soc_lab         soc_admin                               md5
host    soc_lab         soc_admin    127.0.0.1/32              md5
host    soc_lab         soc_admin    ::1/128                   md5

# Do NOT allow remote connections in dev/test
# For production, use VPN or secured network
```

### Encrypt Connection

```bash
# In postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### Enable Audit Logging

```bash
# In postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'all'
log_min_duration_statement = 0
```

## Additional Resources

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [pgAdmin Web Interface](https://www.pgadmin.org/)
- [Database Client README](./src/backend/domain-1-core-infrastructure/database-client/README.md)
- [Schema Migration File](./database/migrations/001_init_schema.sql)
- [Seed Data File](./database/seeds/001_seed_initial_data.sql)

---

**Last Updated**: January 2024
**Phase**: 1, Week 2
**Status**: Production Ready ✅
