# Configuration Service

Hierarchical, multi-environment configuration management with validation, encryption, snapshots, and real-time change tracking.

## Overview

The Configuration Service provides enterprise-grade configuration management supporting multiple environments, profiles, scopes, overrides, validation rules, and change history. It handles secrets securely, supports configuration snapshots for rollback, and provides watchers and listeners for reactive configuration updates.

**Key Features:**
- Hierarchical configuration organization (profiles, scopes, namespaces)
- Environment-specific configuration profiles (dev, staging, prod)
- Configuration overrides with conditional rules
- Real-time configuration validation with custom rules
- Configuration snapshots and comparison
- Change history and audit tracking
- Watchers for reactive configuration updates
- Support for secrets and encrypted configurations
- In-memory caching with TTL
- Health checks and statistics
- Event-driven change notifications
- Secret rotation policies
- Graceful configuration merging strategies

## Architecture

### Core Components

1. **Configuration Store**: In-memory storage for configurations
2. **Profile Manager**: Manages environment-specific profiles
3. **Scope Manager**: Organizes configurations into namespaces
4. **Override Engine**: Applies conditional overrides based on context
5. **Validator**: Validates configurations against rules
6. **Snapshot Manager**: Creates and restores configuration snapshots
7. **Watcher System**: Monitors configuration changes
8. **Change Tracker**: Records all configuration modifications
9. **Cache Layer**: Caches resolved configurations with TTL
10. **Encryption Handler**: Manages encrypted sensitive configurations

### Data Flow

```
Configuration Request
    ↓
Cache Lookup
    ↓
Override Matching (conditional)
    ↓
Scope Resolution
    ↓
Profile Selection
    ↓
Direct Config
    ↓
Merge Results
    ↓
Cache & Return
```

## API Reference

### Creating the Service

```typescript
import { createConfigurationService, IConfigServiceConfig } from '@config-service';

const config: IConfigServiceConfig = {
  environment: 'production',
  hostname: 'prod-server',
  region: 'us-west-2',
  enableValidation: true,
  enableEncryption: true,
  mergingStrategy: 'deep',
  cacheTTL: 30000,
  maxCacheSize: 1000,
  enableHistoryTracking: true,
  maxHistoryEntries: 100,
  enableNotifications: true,
  retentionDays: 30,
};

const service = createConfigurationService(config);
```

### Basic Configuration Operations

#### Setting Configuration

```typescript
// Simple string configuration
service.setConfig('app.name', 'SOC Lab');

// Numeric configuration
service.setConfig('app.port', 3000);

// Complex object
service.setConfig('database', {
  host: 'localhost',
  port: 5432,
  pool: { min: 5, max: 20 },
});

// Mark as secret
service.setConfig('api.key', 'secret-key-xyz', { secret: true });

// Mark for encryption
service.setConfig('db.password', 'password123', { encrypted: true });
```

#### Getting Configuration

```typescript
// Retrieve by key
const appName = service.getConfig('app.name');

// With resolution context
const timeout = service.getConfig('app.timeout', {
  environment: 'production',
  hostname: 'prod-1',
  region: 'us-west-2',
});
```

### Profiles

```typescript
// Create environment profile
const profileId = service.createProfile({
  name: 'production',
  environment: 'production',
  isDefault: false,
  settings: {
    app: { timeout: 30000, debug: false },
    db: { maxConnections: 100 },
  },
});

// Retrieve profile
const profile = service.getProfile(profileId);

// Update profile
service.updateProfile(profileId, {
  settings: { app: { timeout: 45000 } },
});

// Delete profile
service.deleteProfile(profileId);
```

### Scopes

```typescript
// Create scope
const scopeId = service.createScope({
  name: 'database',
  namespace: 'persistence',
  settings: {
    poolSize: 20,
    idleTimeout: 30000,
    queryTimeout: 5000,
  },
});

// Retrieve scope
const scope = service.getScope(scopeId);

// Update scope
service.updateScope(scopeId, {
  settings: { poolSize: 50 },
});
```

### Overrides

```typescript
// Add conditional override
const overrideId = service.addOverride({
  path: 'app.timeout',
  value: 60000,
  condition: {
    environment: 'production',
    region: 'us-west-2',
  },
  priority: 100,
  enabled: true,
  reason: 'Higher timeout for stability',
});

// Retrieve override
const override = service.getOverride(overrideId);

// Remove override
service.removeOverride(overrideId);
```

### Validation

```typescript
const rules: IValidationRule[] = [
  {
    path: 'app.name',
    type: 'required',
    required: true,
  },
  {
    path: 'app.port',
    type: 'range',
    min: 1024,
    max: 65535,
  },
  {
    path: 'environment',
    type: 'enum',
    enum: ['dev', 'staging', 'prod'],
  },
  {
    path: 'email',
    type: 'pattern',
    pattern: '^[^@]+@[^@]+\\.[^@]+$',
  },
];

const result = service.validateConfig({
  app: { name: 'SOC Lab', port: 3000 },
  environment: 'prod',
  email: 'admin@example.com',
}, rules);

if (!result.valid) {
  result.errors.forEach(err => {
    console.error(`${err.path}: ${err.message}`);
  });
}
```

### Snapshots

```typescript
// Create snapshot
const snapshotId = service.createSnapshot('Baseline v1.0.0');

// Retrieve snapshot
const snapshot = service.getSnapshot(snapshotId);

// Restore from snapshot
service.restoreSnapshot(snapshotId);

// Compare snapshots
const comparison = service.compareSnapshots(snapshot1Id, snapshot2Id);

comparison?.differences.forEach(diff => {
  console.log(`${diff.path}: ${diff.value1} → ${diff.value2} (${diff.type})`);
});
```

### Watchers

```typescript
// Watch pattern
const watchId = service.watchConfig('app.*', async (change) => {
  console.log(`Configuration changed: ${change.path}`);
});

// Unwatch
service.unwatch(watchId);
```

### Event Listeners

```typescript
service.onChange(async (change) => {
  console.log(`Action: ${change.action}`);
  console.log(`Path: ${change.path}`);
  console.log(`Value: ${change.newValue}`);
});
```

### Statistics and Health

```typescript
// Get statistics
const stats = service.getStats();
console.log(`Total configurations: ${stats.totalValues}`);
console.log(`Secret count: ${stats.secretCount}`);
console.log(`Encrypted count: ${stats.encryptedCount}`);

// Health check
const health = await service.performHealthCheck();
console.log(`Status: ${health.status}`);
health.checks.forEach(check => {
  console.log(`  ${check.name}: ${check.status}`);
});
```

## Configuration Types

### ConfigValueType

Configuration values can be:
- String: `"value"`
- Number: `42`, `3.14`
- Boolean: `true`, `false`
- null: `null`
- Object: `{ key: value }`
- Array: `[1, 2, 3]`

### Validation Rule Types

- **required**: Field must be present
- **type**: Value must be specific type
- **pattern**: String must match regex
- **range**: Number must be in min/max range
- **enum**: Value must be in allowed list
- **custom**: Custom validation function
- **nested**: Validate nested objects

### Merge Strategies

- **deep**: Deep merge configurations
- **shallow**: Shallow merge
- **replace**: Replace entire configuration
- **array-append**: Append array values

### Resolution Context

```typescript
interface IResolutionContext {
  environment: 'development' | 'staging' | 'production' | 'test';
  hostname?: string;
  region?: string;
  serviceId?: string;
  userId?: string;
  custom?: Record<string, any>;
}
```

## Usage Examples

### Example 1: Multi-Environment Setup

```typescript
const service = createConfigurationService(config);

// Base configurations
service.setConfig('app.name', 'SOC Lab');
service.setConfig('app.version', '1.0.0');

// Environment-specific profiles
const devProfile = service.createProfile({
  name: 'development',
  environment: 'development',
  isDefault: true,
  settings: { debug: true, cache: false },
});

const prodProfile = service.createProfile({
  name: 'production',
  environment: 'production',
  isDefault: false,
  settings: { debug: false, cache: true },
});

// Get configuration for environment
const debugMode = service.getConfig('debug', {
  environment: 'development',
});
```

### Example 2: Secrets Management

```typescript
// Set secret configurations
service.setConfig('database.password', 'secure-password', {
  secret: true,
  encrypted: true,
});

service.setConfig('api.key', 'api-key-xyz', {
  secret: true,
  encrypted: true,
});

// Retrieve (transparently decrypts)
const dbPassword = service.getConfig('database.password');
const apiKey = service.getConfig('api.key');
```

### Example 3: Configuration Validation

```typescript
const rules: IValidationRule[] = [
  { path: 'app.name', type: 'required', required: true },
  { path: 'app.port', type: 'range', min: 1024, max: 65535 },
  { path: 'log.level', type: 'enum', enum: ['debug', 'info', 'warn', 'error'] },
];

const appConfig = {
  app: { name: 'MyApp', port: 3000 },
  log: { level: 'info' },
};

const result = service.validateConfig(appConfig, rules);

if (result.valid) {
  console.log('Configuration is valid');
} else {
  result.errors.forEach(err => console.error(err.message));
}
```

### Example 4: Conditional Overrides

```typescript
// Default timeout
service.setConfig('timeout', 5000);

// Override for production
service.addOverride({
  path: 'timeout',
  value: 30000,
  condition: { environment: 'production' },
  priority: 100,
  enabled: true,
});

// Override for specific region
service.addOverride({
  path: 'timeout',
  value: 60000,
  condition: { region: 'us-west-2', environment: 'production' },
  priority: 200, // Higher priority
  enabled: true,
});

// Resolve with context
const timeout = service.getConfig('timeout', {
  environment: 'production',
  region: 'us-west-2',
}); // Returns 60000 (highest priority match)
```

## Performance Characteristics

### Operations Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Set config | O(1) | Direct map insertion |
| Get config | O(1) | Cache hit, O(n) cache miss |
| Create profile | O(1) | Map insertion |
| Add override | O(n) | Matching overrides in resolution |
| Validate | O(n*m) | n configs, m rules |
| Snapshot create | O(n) | Where n = config count |
| Snapshot compare | O(n log n) | Sorting differences |

### Caching

- **TTL**: Configurable (default 30 seconds)
- **Max size**: Configurable (default 1000 entries)
- **Invalidation**: On configuration change
- **Hit rate**: Depends on access patterns

## Best Practices

1. **Use Profiles for Environments**: Keep environment-specific configs separate
2. **Organize with Scopes**: Group related configurations logically
3. **Set Appropriate Priorities**: Higher priority overrides take precedence
4. **Validate Early**: Validate configurations at startup
5. **Use Snapshots**: Create snapshots before major changes
6. **Encrypt Secrets**: Always mark sensitive data as encrypted
7. **Monitor Changes**: Use watchers for critical configuration changes
8. **Document Rules**: Document validation rules and constraints
9. **Cache TTL**: Balance freshness vs performance
10. **Audit Trail**: Enable history tracking for compliance

## Error Handling

Service automatically handles:
- Invalid configuration values (defaults to null)
- Non-existent configurations (returns null)
- Validation errors (returns detailed error info)
- Missing environment profiles (uses defaults)
- Snapshot restore failures (validates first)

## Lifecycle Management

```typescript
// Create service
const service = createConfigurationService(config);

// Use service for all configuration needs
const value = service.getConfig('key');

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- configuration-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- configuration-service/demo.ts
```

## Dependencies

- **Built-in**: No external dependencies
- **Crypto**: Node.js crypto module for encryption

## See Also

- [Logging Service](../logging-service/README.md) - Structured logging
- [Metrics Service](../metrics-service/README.md) - Metrics collection
- [Audit Service](../audit-service/README.md) - Audit trail tracking
- [Environment Setup](../../docs/SETUP.md) - Environment configuration

## Version

1.0.0

## License

See repository LICENSE file
