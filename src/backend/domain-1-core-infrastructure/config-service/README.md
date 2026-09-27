# Config Service

Configuration management service that loads and validates application configuration from environment variables.

## Overview

The Config Service is a **Tier 0 (Foundation)** module that must be initialized before any other service. It:

- Loads configuration from environment variables
- Provides type-safe access to configuration
- Validates configuration values
- Masks sensitive data for logging
- Supports development, production, and test environments

## Status

- [x] Prototype: Complete
- [x] Unit tests: Complete (30+ tests, 95%+ coverage)
- [x] Integration ready: Yes
- [x] Documentation: Complete

## Features

### Type-Safe Configuration

```typescript
const config = new ConfigService();

// Access full configuration
const fullConfig = config.getConfig();

// Access configuration section
const dbConfig = config.getSection('database');

// Access by dot notation
const dbHost: unknown = config.get('database.host');
```

### Automatic Type Conversion

```typescript
// String → Number
process.env.APP_PORT = '3000';
config.getSection('app').port; // 3000 (number)

// String → Boolean
process.env.DEBUG = 'true';
config.getSection('app').debug; // true (boolean)

// Comma-separated values → Array
process.env.CORS_ORIGINS = 'http://localhost:3000,https://example.com';
config.getSection('security').corsOrigins; // ['http://localhost:3000', 'https://example.com']
```

### Configuration Sections

| Section | Purpose | Required |
|---------|---------|----------|
| `app` | Application settings | Yes |
| `database` | PostgreSQL configuration | Yes |
| `cache` | Redis cache settings | Yes |
| `search` | OpenSearch configuration | Yes |
| `security` | JWT, CORS, encryption | Yes |
| `logging` | Logging configuration | Yes |
| `monitoring` | Metrics and monitoring | Yes |

### Environment Checks

```typescript
if (config.isProduction()) {
  // Production-only logic
}

if (config.isDevelopment()) {
  // Development-only logic
}

if (config.isTest()) {
  // Test-only logic
}
```

### Sensitive Data Masking

```typescript
// Passwords and secrets are never logged
const obj = config.toObject();
// { database: { password: '***REDACTED***' }, ... }
```

## Environment Variables

### Application

```bash
NODE_ENV=development                # development | production | test
APP_NAME=SOC-Detection-Lab
APP_VERSION=1.0.0
APP_PORT=3000
APP_HOST=localhost
DEBUG=false
```

### Database (PostgreSQL)

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=soc_detection_lab
DB_USER=postgres
DB_PASSWORD=
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT=5000
```

### Cache (Redis)

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL_DEFAULT=3600
CACHE_ENABLED=true
```

### Search (OpenSearch)

```bash
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
OPENSEARCH_SCHEME=http
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=
OPENSEARCH_INDEX_PREFIX=soc-
```

### Security

```bash
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true
```

### Logging

```bash
LOG_LEVEL=info                  # debug | info | warn | error
LOG_FORMAT=json                 # json | pretty
LOG_TRANSPORT=console,file      # comma-separated
```

### Monitoring

```bash
MONITORING_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=60000
```

## Usage

### Basic Usage

```typescript
import { ConfigService } from '@backend/domain-1-core-infrastructure/config-service';

// Initialize
const configService = new ConfigService();

// Get section
const dbConfig = configService.getSection('database');
console.log(dbConfig.host);  // 'localhost'

// Get by path
const port = configService.get('app.port');

// Check environment
if (configService.isProduction()) {
  console.log('Running in production');
}
```

### With TypeScript

```typescript
import { ConfigService, type IConfig } from '@backend/domain-1-core-infrastructure/config-service';

const config = new ConfigService();
const fullConfig: IConfig = config.getConfig();

// Type-safe access
const dbHost: string = config.getSection('database').host;
```

### In Application

```typescript
// main.ts
import express from 'express';
import { ConfigService } from '@backend/domain-1-core-infrastructure/config-service';

const configService = new ConfigService();
const appConfig = configService.getSection('app');

const app = express();
app.listen(appConfig.port, appConfig.host);
```

## Validation Rules

### Development Environment
- ✅ Optional JWT_SECRET
- ✅ Optional DB_PASSWORD
- ✅ Relaxed validation

### Production Environment
- ❌ JWT_SECRET required (min 32 chars)
- ❌ DB_PASSWORD required
- ❌ Strict validation enforced

### All Environments
- ✅ Port must be 1-65535
- ✅ DB_POOL_MIN ≤ DB_POOL_MAX
- ✅ Valid numbers for numeric values

## Testing

### Run Unit Tests

```bash
npm run test:unit -- config-service
```

### Coverage

Target: **80%+** (Current: **95%+**)

Test categories:
- Loading configuration (8 tests)
- Type conversions (3 tests)
- Validation (7 tests)
- Get configuration (4 tests)
- Environment checks (3 tests)
- Object representation (2 tests)
- Configuration sections (3 tests)

### Test Environment Setup

Tests automatically:
- Save original environment
- Clear SOC variables
- Restore environment after each test

## Dependencies

**None** - This is a foundation module with zero external dependencies (except Node.js built-ins).

## Related Modules

Depends on:
- None (foundation layer)

Used by:
- All other backend services (must initialize first)

## Migration Guide

### From Manual `.env` Parsing

**Before:**
```typescript
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
```

**After:**
```typescript
const dbHost = configService.getSection('database').host;
const dbPort = configService.getSection('database').port;
```

### Adding New Configuration

1. Add to `types.ts`
2. Add loading in `main.ts`
3. Add tests to `config.test.ts`
4. Document in `.env.example`
5. Update this README

## Troubleshooting

### `Missing required configuration: KEY`

Configuration variable not found and no default provided.

**Solution**: Set environment variable or add default in code.

### `Invalid number configuration: KEY=value`

Environment variable cannot be parsed as number.

**Solution**: Ensure variable is numeric (e.g., `APP_PORT=3000` not `APP_PORT=3000abc`)

### `Invalid port: 99999`

Port number out of valid range (1-65535).

**Solution**: Use valid port number (e.g., 3000, 8080, 5432)

### `JWT_SECRET must be at least 32 characters`

Production environment requires strong JWT secret.

**Solution**: Generate 32+ character random string:
```bash
openssl rand -base64 32
```

## Performance

- **Initialization time**: <1ms
- **Configuration lookup**: <0.1ms
- **Memory footprint**: <50KB

## Security

- Passwords and secrets never logged
- Environment validation catches misconfigurations early
- Type safety prevents runtime errors
- Production mode enforces strict settings

## Changelog

### v1.0.0 (Initial)
- Complete configuration loading
- Type-safe access
- Environment validation
- Sensitive data masking
- 95%+ test coverage

## License

MIT

## Next Steps

1. Create other Tier 0 modules using this as template
2. Initialize ConfigService in application main.ts
3. Pass configuration to other services
4. Monitor configuration changes (optional)
