/**
 * Configuration Service - Prototype Demonstrations
 * 12 comprehensive scenario demonstrations
 */

import {
  ConfigurationService,
  createConfigurationService,
  IConfigServiceConfig,
  IConfigProfile,
  IConfigScope,
  IValidationRule,
  ConfigListener,
  IConfigChange,
} from '../src/index';

/**
 * Demo 1: Basic configuration operations
 */
async function demo1_BasicConfigurationOperations(): Promise<void> {
  console.log('\n=== Demo 1: Basic Configuration Operations ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    hostname: 'localhost',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Set various configurations
  service.setConfig('app.name', 'SOC Detection Lab');
  service.setConfig('app.version', '1.0.0');
  service.setConfig('app.port', 3000);
  service.setConfig('app.debug', true);

  console.log('✓ Set 4 configurations');

  // Retrieve configurations
  const appName = service.getConfig('app.name');
  const appPort = service.getConfig('app.port');
  const debugMode = service.getConfig('app.debug');

  console.log(`✓ Retrieved configurations:`);
  console.log(`  - App name: ${appName}`);
  console.log(`  - Port: ${appPort}`);
  console.log(`  - Debug: ${debugMode}`);

  // Get statistics
  const stats = service.getStats();
  console.log(`✓ Configuration statistics:`);
  console.log(`  - Total values: ${stats.totalValues}`);
  console.log(`  - Total keys: ${stats.totalKeys}`);

  service.stop();
}

/**
 * Demo 2: Profiles for different environments
 */
async function demo2_EnvironmentProfiles(): Promise<void> {
  console.log('\n=== Demo 2: Environment Profiles ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Create environment profiles
  const devProfileId = service.createProfile({
    name: 'development',
    environment: 'development',
    isDefault: true,
    settings: {
      app: { timeout: 5000, debug: true },
      db: { maxConnections: 5 },
    },
  });

  const stagingProfileId = service.createProfile({
    name: 'staging',
    environment: 'staging',
    isDefault: false,
    settings: {
      app: { timeout: 10000, debug: false },
      db: { maxConnections: 20 },
    },
  });

  const prodProfileId = service.createProfile({
    name: 'production',
    environment: 'production',
    isDefault: false,
    settings: {
      app: { timeout: 30000, debug: false },
      db: { maxConnections: 100 },
    },
  });

  console.log(`✓ Created 3 environment profiles:`);
  console.log(`  - Development: ${devProfileId}`);
  console.log(`  - Staging: ${stagingProfileId}`);
  console.log(`  - Production: ${prodProfileId}`);

  // Retrieve profiles
  const devProfile = service.getProfile(devProfileId);
  const prodProfile = service.getProfile(prodProfileId);

  console.log(`✓ Retrieved profiles:`);
  console.log(`  - Dev app timeout: ${(devProfile?.settings.app as any)?.timeout}ms`);
  console.log(`  - Prod app timeout: ${(prodProfile?.settings.app as any)?.timeout}ms`);

  service.stop();
}

/**
 * Demo 3: Configuration scopes and namespacing
 */
async function demo3_ConfigurationScopes(): Promise<void> {
  console.log('\n=== Demo 3: Configuration Scopes ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Create scopes
  const authScopeId = service.createScope({
    name: 'authentication',
    namespace: 'security',
    settings: {
      jwtExpiry: 3600,
      refreshTokenExpiry: 604800,
      maxLoginAttempts: 5,
    },
  });

  const dbScopeId = service.createScope({
    name: 'database',
    namespace: 'persistence',
    settings: {
      poolSize: 10,
      idleTimeout: 30000,
      queryTimeout: 5000,
    },
  });

  const cacheScopeId = service.createScope({
    name: 'caching',
    namespace: 'performance',
    settings: {
      ttl: 300,
      maxEntries: 10000,
      evictionPolicy: 'LRU',
    },
  });

  console.log(`✓ Created 3 configuration scopes:`);
  console.log(`  - Auth: ${authScopeId}`);
  console.log(`  - Database: ${dbScopeId}`);
  console.log(`  - Cache: ${cacheScopeId}`);

  // Retrieve and display scopes
  const authScope = service.getScope(authScopeId);
  console.log(`✓ Auth scope settings:`);
  console.log(`  - JWT Expiry: ${authScope?.settings.jwtExpiry}s`);
  console.log(`  - Max Login Attempts: ${authScope?.settings.maxLoginAttempts}`);

  service.stop();
}

/**
 * Demo 4: Configuration overrides
 */
async function demo4_ConfigurationOverrides(): Promise<void> {
  console.log('\n=== Demo 4: Configuration Overrides ===');

  const config: IConfigServiceConfig = {
    environment: 'production',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Set base configurations
  service.setConfig('app.timeout', 5000);
  service.setConfig('db.connections', 10);

  console.log('✓ Set base configurations');

  // Add overrides
  const timeoutOverride = service.addOverride({
    path: 'app.timeout',
    value: 15000,
    condition: {
      environment: 'production',
    },
    priority: 100,
    enabled: true,
    reason: 'Increase timeout for production stability',
  });

  const connOverride = service.addOverride({
    path: 'db.connections',
    value: 50,
    condition: {
      environment: 'production',
      region: 'us-west-2',
    },
    priority: 100,
    enabled: true,
    reason: 'Higher capacity for US west region',
  });

  console.log(`✓ Added 2 configuration overrides:`);
  console.log(`  - Timeout: ${timeoutOverride}`);
  console.log(`  - Connections: ${connOverride}`);

  // Retrieve overrides
  const override1 = service.getOverride(timeoutOverride);
  const override2 = service.getOverride(connOverride);

  console.log(`✓ Retrieved overrides:`);
  console.log(`  - Override 1: ${override1?.path} = ${override1?.value}`);
  console.log(`  - Override 2: ${override2?.path} = ${override2?.value}`);

  service.stop();
}

/**
 * Demo 5: Configuration validation
 */
async function demo5_ConfigurationValidation(): Promise<void> {
  console.log('\n=== Demo 5: Configuration Validation ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Define validation rules
  const validationRules: IValidationRule[] = [
    {
      path: 'app.name',
      type: 'required',
      required: true,
      message: 'Application name is required',
    },
    {
      path: 'app.port',
      type: 'range',
      min: 1024,
      max: 65535,
      message: 'Port must be between 1024 and 65535',
    },
    {
      path: 'app.environment',
      type: 'enum',
      enum: ['development', 'staging', 'production'],
      message: 'Environment must be one of: development, staging, production',
    },
    {
      path: 'email.smtp_host',
      type: 'pattern',
      pattern: '^[a-zA-Z0-9.-]+$',
      message: 'SMTP host must be a valid hostname',
    },
  ];

  // Validate valid configuration
  const validConfig = {
    app: { name: 'SOC Lab', port: 3000, environment: 'development' },
    email: { smtp_host: 'mail.example.com' },
  };

  const validResult = service.validateConfig(validConfig, validationRules);
  console.log(`✓ Validation (valid config): ${validResult.valid ? 'PASSED' : 'FAILED'}`);

  // Validate invalid configuration
  const invalidConfig = {
    app: { port: 500, environment: 'invalid' },
  };

  const invalidResult = service.validateConfig(invalidConfig, validationRules);
  console.log(`✓ Validation (invalid config): ${invalidResult.valid ? 'PASSED' : 'FAILED'}`);
  console.log(`  - Errors: ${invalidResult.errors.length}`);
  invalidResult.errors.forEach((err) => {
    console.log(`    • ${err.path}: ${err.message}`);
  });

  service.stop();
}

/**
 * Demo 6: Configuration snapshots
 */
async function demo6_ConfigurationSnapshots(): Promise<void> {
  console.log('\n=== Demo 6: Configuration Snapshots ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Set initial configurations
  service.setConfig('version', '1.0.0');
  service.setConfig('features.newUI', false);
  service.setConfig('features.analytics', true);

  // Create snapshot
  const snapshot1 = service.createSnapshot('Version 1.0.0 baseline');
  console.log(`✓ Created snapshot 1: ${snapshot1}`);

  // Modify configurations
  service.setConfig('version', '1.1.0');
  service.setConfig('features.newUI', true);

  // Create another snapshot
  const snapshot2 = service.createSnapshot('Version 1.1.0 with new UI');
  console.log(`✓ Created snapshot 2: ${snapshot2}`);

  // Compare snapshots
  const comparison = service.compareSnapshots(snapshot1, snapshot2);
  console.log(`✓ Snapshot comparison:`);
  console.log(`  - Differences: ${comparison?.differences.length}`);
  comparison?.differences.forEach((diff) => {
    console.log(`    • ${diff.path}: ${diff.value1} → ${diff.value2} (${diff.type})`);
  });

  // Restore from snapshot
  const restored = service.restoreSnapshot(snapshot1);
  console.log(`✓ Restored from snapshot 1: ${restored}`);

  const restoredVersion = service.getConfig('version');
  console.log(`  - Version after restore: ${restoredVersion}`);

  service.stop();
}

/**
 * Demo 7: Configuration watchers
 */
async function demo7_ConfigurationWatchers(): Promise<void> {
  console.log('\n=== Demo 7: Configuration Watchers ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  let featureChanges = 0;
  let securityChanges = 0;

  // Watch feature flag changes
  service.watchConfig('features.*', async (change: IConfigChange) => {
    featureChanges++;
    console.log(`✓ Feature change detected: ${change.path}`);
  });

  // Watch security settings
  service.watchConfig('security.*', async (change: IConfigChange) => {
    securityChanges++;
    console.log(`✓ Security change detected: ${change.path}`);
  });

  console.log('✓ Set up 2 configuration watchers');

  // Trigger watched changes
  service.setConfig('features.betaUI', true);
  service.setConfig('features.darkMode', false);
  service.setConfig('security.mfaEnabled', true);

  setTimeout(() => {
    console.log(`✓ Change summary:`);
    console.log(`  - Feature changes detected: ${featureChanges}`);
    console.log(`  - Security changes detected: ${securityChanges}`);
  }, 200);

  service.stop();
}

/**
 * Demo 8: Event listeners for changes
 */
async function demo8_EventListeners(): Promise<void> {
  console.log('\n=== Demo 8: Event Listeners ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  let changeCount = 0;

  // Register change listener
  const listener: ConfigListener = async (change: IConfigChange) => {
    changeCount++;
    console.log(`✓ Change #${changeCount}: ${change.action} ${change.path}`);
  };

  service.onChange(listener);

  console.log('✓ Registered configuration change listener');

  // Make configuration changes
  service.setConfig('app.name', 'SOC Lab');
  service.setConfig('app.version', '1.0.0');
  service.setConfig('database.url', 'postgresql://localhost/soclab');

  setTimeout(() => {
    console.log(`✓ Total changes tracked: ${changeCount}`);
    service.stop();
  }, 200);
}

/**
 * Demo 9: Secrets and encrypted configurations
 */
async function demo9_SecretsAndEncryption(): Promise<void> {
  console.log('\n=== Demo 9: Secrets and Encryption ===');

  const config: IConfigServiceConfig = {
    environment: 'production',
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

  // Set regular configurations
  service.setConfig('app.name', 'SOC Lab');

  // Set secrets
  service.setConfig('database.password', 'secure-password-123', { secret: true });
  service.setConfig('api.key', 'sk_live_abc123def456', { secret: true });

  // Set encrypted configurations
  service.setConfig('encryption.masterKey', 'key-content-here', { encrypted: true });
  service.setConfig('ssl.certificate', 'cert-content-here', { encrypted: true });

  console.log('✓ Set configurations with different security levels');

  // Get statistics
  const stats = service.getStats();
  console.log(`✓ Configuration statistics:`);
  console.log(`  - Total values: ${stats.totalValues}`);
  console.log(`  - Secret count: ${stats.secretCount}`);
  console.log(`  - Encrypted count: ${stats.encryptedCount}`);

  service.stop();
}

/**
 * Demo 10: Health checks and monitoring
 */
async function demo10_HealthChecks(): Promise<void> {
  console.log('\n=== Demo 10: Health Checks ===');

  const config: IConfigServiceConfig = {
    environment: 'development',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Add some configurations
  service.setConfig('setting1', 'value1');
  service.setConfig('setting2', 'value2');

  // Create profile and scope
  service.createProfile({
    name: 'test',
    environment: 'test',
    isDefault: false,
    settings: {},
  });

  // Perform health check
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
 * Demo 11: Context-based configuration resolution
 */
async function demo11_ContextResolution(): Promise<void> {
  console.log('\n=== Demo 11: Context-Based Resolution ===');

  const config: IConfigServiceConfig = {
    environment: 'production',
    hostname: 'prod-server-1',
    region: 'us-west-2',
    enableValidation: true,
    enableEncryption: false,
    mergingStrategy: 'deep',
    cacheTTL: 30000,
    maxCacheSize: 1000,
    enableHistoryTracking: true,
    maxHistoryEntries: 100,
    enableNotifications: true,
    retentionDays: 30,
  };

  const service = createConfigurationService(config);

  // Set base configurations
  service.setConfig('timeout', 5000);
  service.setConfig('retries', 3);

  console.log('✓ Set base configurations');

  // Add overrides for specific contexts
  service.addOverride({
    path: 'timeout',
    value: 10000,
    condition: { region: 'us-west-2' },
    priority: 100,
    enabled: true,
  });

  service.addOverride({
    path: 'retries',
    value: 5,
    condition: { environment: 'production' },
    priority: 100,
    enabled: true,
  });

  console.log('✓ Added context-specific overrides');

  // Resolve configurations in different contexts
  const ctx1 = service.getConfig('timeout', {
    environment: 'production',
    region: 'us-west-2',
  });

  const ctx2 = service.getConfig('retries', {
    environment: 'production',
  });

  console.log(`✓ Context-based resolution:`);
  console.log(`  - Timeout (us-west-2): ${ctx1}ms`);
  console.log(`  - Retries (production): ${ctx2}`);

  service.stop();
}

/**
 * Demo 12: Complete integration flow
 */
async function demo12_CompleteIntegrationFlow(): Promise<void> {
  console.log('\n=== Demo 12: Complete Integration Flow ===');

  const config: IConfigServiceConfig = {
    environment: 'staging',
    hostname: 'staging-server',
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

  console.log('✓ Service initialized');

  // Set up base configurations
  service.setConfig('app.name', 'SOC Detection Lab');
  service.setConfig('app.version', '2.0.0');
  service.setConfig('app.port', 3000);

  // Create environment profiles
  const stagingProfile = service.createProfile({
    name: 'staging',
    environment: 'staging',
    isDefault: true,
    settings: { debug: true, cache: { ttl: 300 } },
  });

  // Create configuration scopes
  const dbScope = service.createScope({
    name: 'database',
    namespace: 'persistence',
    settings: { poolSize: 20, idleTimeout: 30000 },
  });

  console.log('✓ Created profiles and scopes');

  // Set secrets
  service.setConfig('db.password', 'staging-db-pass-123', { secret: true });
  service.setConfig('api.token', 'staging-token-xyz', { secret: true });

  // Create snapshot
  const snapshotId = service.createSnapshot('Staging baseline');
  console.log(`✓ Created baseline snapshot: ${snapshotId}`);

  // Register change listener
  let changeCount = 0;
  service.onChange(async () => {
    changeCount++;
  });

  // Make some changes
  service.setConfig('app.version', '2.1.0-rc1');
  service.addOverride({
    path: 'app.port',
    value: 3001,
    priority: 100,
    enabled: true,
  });

  // Validate configuration
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
  ];

  const currentConfig = {
    app: { name: 'SOC Detection Lab', port: 3001 },
  };

  const validation = service.validateConfig(currentConfig, rules);
  console.log(`✓ Configuration validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);

  // Get statistics and health
  const stats = service.getStats();
  const health = await service.performHealthCheck();

  console.log(`✓ Final statistics:`);
  console.log(`  - Total values: ${stats.totalValues}`);
  console.log(`  - Secret count: ${stats.secretCount}`);
  console.log(`  - Profile count: ${stats.profileCount}`);
  console.log(`  - Changes tracked: ${changeCount}`);

  console.log(`✓ Health status: ${health.status}`);

  service.stop();
  console.log('✓ Service stopped');
}

/**
 * Run all demos
 */
async function runAllDemos(): Promise<void> {
  console.log('════════════════════════════════════════════════════════════');
  console.log('     Configuration Service - Prototype Demonstrations');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await demo1_BasicConfigurationOperations();
    await demo2_EnvironmentProfiles();
    await demo3_ConfigurationScopes();
    await demo4_ConfigurationOverrides();
    await demo5_ConfigurationValidation();
    await demo6_ConfigurationSnapshots();
    await demo7_ConfigurationWatchers();
    await demo8_EventListeners();
    await demo9_SecretsAndEncryption();
    await demo10_HealthChecks();
    await demo11_ContextResolution();
    await demo12_CompleteIntegrationFlow();

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('          All Demos Completed Successfully');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demos:', error);
    process.exit(1);
  }
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  demo1_BasicConfigurationOperations,
  demo2_EnvironmentProfiles,
  demo3_ConfigurationScopes,
  demo4_ConfigurationOverrides,
  demo5_ConfigurationValidation,
  demo6_ConfigurationSnapshots,
  demo7_ConfigurationWatchers,
  demo8_EventListeners,
  demo9_SecretsAndEncryption,
  demo10_HealthChecks,
  demo11_ContextResolution,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
