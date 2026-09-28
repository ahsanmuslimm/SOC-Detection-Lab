/**
 * Configuration Service - Unit Tests
 * Comprehensive test coverage for configuration management, validation, and snapshots
 */

import {
  ConfigurationService,
  createConfigurationService,
  IConfigServiceConfig,
  IConfigProfile,
  IConfigScope,
  IConfigOverride,
  IValidationRule,
  ConfigListener,
  IConfigChange,
} from '../../src/index';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(() => {
    const config: IConfigServiceConfig = {
      environment: 'test',
      hostname: 'test-host',
      region: 'us-east-1',
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
    service = createConfigurationService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Configuration Setting and Getting', () => {
    test('should set configuration and return ID', () => {
      const configId = service.setConfig('app.name', 'SOC Lab');
      expect(configId).toBeDefined();
      expect(typeof configId).toBe('string');
    });

    test('should retrieve configuration by key', () => {
      service.setConfig('database.host', 'localhost');
      const value = service.getConfig('database.host');
      expect(value).toBe('localhost');
    });

    test('should support different value types', () => {
      service.setConfig('string_val', 'text');
      service.setConfig('number_val', 42);
      service.setConfig('boolean_val', true);
      service.setConfig('object_val', { nested: 'value' });
      service.setConfig('array_val', [1, 2, 3]);

      expect(service.getConfig('string_val')).toBe('text');
      expect(service.getConfig('number_val')).toBe(42);
      expect(service.getConfig('boolean_val')).toBe(true);
      expect(service.getConfig('array_val')).toEqual([1, 2, 3]);
    });

    test('should mark configuration as secret', () => {
      const configId = service.setConfig('api.key', 'secret-key', { secret: true });
      expect(configId).toBeDefined();
    });

    test('should mark configuration as encrypted', () => {
      const configId = service.setConfig('db.password', 'pass123', { encrypted: true });
      expect(configId).toBeDefined();
    });

    test('should handle non-existent configuration gracefully', () => {
      const value = service.getConfig('nonexistent.key');
      expect(value).toBeNull();
    });

    test('should support context-based resolution', () => {
      service.setConfig('app.timeout', 5000);
      const value = service.getConfig('app.timeout', {
        environment: 'test',
        hostname: 'test-host',
      });
      expect(value).toBe(5000);
    });
  });

  describe('Profiles', () => {
    test('should create profile and return ID', () => {
      const profileId = service.createProfile({
        name: 'production',
        environment: 'production',
        isDefault: false,
        settings: { app: { timeout: 10000 } },
      });

      expect(profileId).toBeDefined();
      expect(typeof profileId).toBe('string');
    });

    test('should retrieve profile by ID', () => {
      const profileId = service.createProfile({
        name: 'staging',
        environment: 'staging',
        isDefault: false,
        settings: { app: { timeout: 7500 } },
      });

      const profile = service.getProfile(profileId);
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('staging');
      expect(profile?.environment).toBe('staging');
    });

    test('should update profile', () => {
      const profileId = service.createProfile({
        name: 'dev',
        environment: 'development',
        isDefault: true,
        settings: {},
      });

      const updated = service.updateProfile(profileId, {
        isDefault: false,
        settings: { debug: true },
      });

      expect(updated).toBe(true);

      const profile = service.getProfile(profileId);
      expect(profile?.isDefault).toBe(false);
    });

    test('should delete profile', () => {
      const profileId = service.createProfile({
        name: 'temp',
        environment: 'test',
        isDefault: false,
        settings: {},
      });

      const deleted = service.deleteProfile(profileId);
      expect(deleted).toBe(true);

      const retrieved = service.getProfile(profileId);
      expect(retrieved).toBeNull();
    });

    test('should return false for non-existent profile operations', () => {
      const updated = service.updateProfile('nonexistent', {});
      expect(updated).toBe(false);

      const deleted = service.deleteProfile('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('Scopes', () => {
    test('should create scope and return ID', () => {
      const scopeId = service.createScope({
        name: 'auth',
        namespace: 'security',
        settings: { timeout: 3600 },
      });

      expect(scopeId).toBeDefined();
      expect(typeof scopeId).toBe('string');
    });

    test('should retrieve scope by ID', () => {
      const scopeId = service.createScope({
        name: 'database',
        namespace: 'persistence',
        settings: { pool_size: 10 },
      });

      const scope = service.getScope(scopeId);
      expect(scope).toBeDefined();
      expect(scope?.name).toBe('database');
    });

    test('should update scope', () => {
      const scopeId = service.createScope({
        name: 'cache',
        namespace: 'performance',
        settings: {},
      });

      const updated = service.updateScope(scopeId, {
        settings: { ttl: 300 },
      });

      expect(updated).toBe(true);

      const scope = service.getScope(scopeId);
      expect(scope?.settings.ttl).toBe(300);
    });
  });

  describe('Overrides', () => {
    test('should add override and return ID', () => {
      const overrideId = service.addOverride({
        path: 'app.timeout',
        value: 20000,
        priority: 100,
        enabled: true,
      });

      expect(overrideId).toBeDefined();
      expect(typeof overrideId).toBe('string');
    });

    test('should retrieve override by ID', () => {
      const overrideId = service.addOverride({
        path: 'db.maxConnections',
        value: 50,
        priority: 100,
        enabled: true,
      });

      const override = service.getOverride(overrideId);
      expect(override).toBeDefined();
      expect(override?.path).toBe('db.maxConnections');
      expect(override?.value).toBe(50);
    });

    test('should remove override', () => {
      const overrideId = service.addOverride({
        path: 'feature.flag',
        value: true,
        priority: 100,
        enabled: true,
      });

      const removed = service.removeOverride(overrideId);
      expect(removed).toBe(true);

      const retrieved = service.getOverride(overrideId);
      expect(retrieved).toBeNull();
    });

    test('should support conditional overrides', () => {
      const overrideId = service.addOverride({
        path: 'app.timeout',
        value: 15000,
        condition: {
          environment: 'production',
          region: 'us-west-2',
        },
        priority: 100,
        enabled: true,
      });

      expect(overrideId).toBeDefined();
    });
  });

  describe('Validation', () => {
    test('should validate required fields', () => {
      const rules: IValidationRule[] = [
        {
          path: 'app.name',
          type: 'required',
          required: true,
        },
      ];

      const result = service.validateConfig({}, rules);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
    });

    test('should validate type correctness', () => {
      const rules: IValidationRule[] = [
        {
          path: 'port',
          type: 'type',
        },
      ];

      const result = service.validateConfig(
        { port: 'not-a-number' },
        rules
      );

      expect(result.valid).toBe(false);
    });

    test('should validate pattern matching', () => {
      const rules: IValidationRule[] = [
        {
          path: 'email',
          type: 'pattern',
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
        },
      ];

      const result1 = service.validateConfig(
        { email: 'invalid-email' },
        rules
      );
      expect(result1.valid).toBe(false);

      const result2 = service.validateConfig(
        { email: 'user@example.com' },
        rules
      );
      expect(result2.valid).toBe(true);
    });

    test('should validate range constraints', () => {
      const rules: IValidationRule[] = [
        {
          path: 'severity',
          type: 'range',
          min: 0,
          max: 10,
        },
      ];

      const result1 = service.validateConfig({ severity: 15 }, rules);
      expect(result1.valid).toBe(false);

      const result2 = service.validateConfig({ severity: 5 }, rules);
      expect(result2.valid).toBe(true);
    });

    test('should validate enum values', () => {
      const rules: IValidationRule[] = [
        {
          path: 'environment',
          type: 'enum',
          enum: ['dev', 'staging', 'prod'],
        },
      ];

      const result1 = service.validateConfig(
        { environment: 'invalid' },
        rules
      );
      expect(result1.valid).toBe(false);

      const result2 = service.validateConfig(
        { environment: 'prod' },
        rules
      );
      expect(result2.valid).toBe(true);
    });

    test('should validate with custom validator', () => {
      const rules: IValidationRule[] = [
        {
          path: 'threshold',
          type: 'custom',
          customValidator: (val) => (val as number) > 0,
        },
      ];

      const result1 = service.validateConfig({ threshold: 0 }, rules);
      expect(result1.valid).toBe(false);

      const result2 = service.validateConfig({ threshold: 50 }, rules);
      expect(result2.valid).toBe(true);
    });
  });

  describe('Snapshots', () => {
    test('should create snapshot and return ID', () => {
      service.setConfig('app.version', '1.0.0');
      service.setConfig('app.name', 'SOC Lab');

      const snapshotId = service.createSnapshot('Initial snapshot');
      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe('string');
    });

    test('should retrieve snapshot by ID', () => {
      service.setConfig('db.host', 'localhost');

      const snapshotId = service.createSnapshot();
      const snapshot = service.getSnapshot(snapshotId);

      expect(snapshot).toBeDefined();
      expect(snapshot?.config['db.host']).toBe('localhost');
    });

    test('should restore from snapshot', () => {
      service.setConfig('setting1', 'value1');
      service.setConfig('setting2', 'value2');

      const snapshotId = service.createSnapshot();

      service.setConfig('setting1', 'changed');
      const changed = service.getConfig('setting1');
      expect(changed).toBe('changed');

      const restored = service.restoreSnapshot(snapshotId);
      expect(restored).toBe(true);

      const restored1 = service.getConfig('setting1');
      expect(restored1).toBe('value1');
    });

    test('should compare snapshots', () => {
      service.setConfig('config1', 'value1');
      const snap1 = service.createSnapshot();

      service.setConfig('config1', 'changed');
      service.setConfig('config2', 'new');
      const snap2 = service.createSnapshot();

      const comparison = service.compareSnapshots(snap1, snap2);

      expect(comparison).toBeDefined();
      expect(comparison?.differences.length).toBeGreaterThan(0);
    });

    test('should return null for non-existent snapshot comparison', () => {
      const comparison = service.compareSnapshots('nonexistent1', 'nonexistent2');
      expect(comparison).toBeNull();
    });
  });

  describe('Watchers', () => {
    test('should watch configuration pattern', (done) => {
      let changeDetected = false;

      const watchId = service.watchConfig('app.*', async (change: IConfigChange) => {
        changeDetected = true;
      });

      expect(watchId).toBeDefined();

      service.setConfig('app.timeout', 5000);

      setTimeout(() => {
        expect(changeDetected).toBe(true);
        done();
      }, 100);
    });

    test('should unwatch configuration pattern', () => {
      const watchId = service.watchConfig('db.*', async () => {});

      const removed = service.unwatch(watchId);
      expect(removed).toBe(true);
    });
  });

  describe('Configuration Statistics', () => {
    test('should track statistics', () => {
      service.setConfig('metric1', 100);
      service.setConfig('metric2', 'value');

      const stats = service.getStats();

      expect(stats.totalValues).toBeGreaterThan(0);
      expect(stats.totalKeys).toBeGreaterThanOrEqual(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    test('should track encrypted configurations', () => {
      service.setConfig('secret', 'value', { encrypted: true });

      const stats = service.getStats();

      expect(stats.encryptedCount).toBeGreaterThan(0);
    });

    test('should track secret configurations', () => {
      service.setConfig('api_key', 'key123', { secret: true });

      const stats = service.getStats();

      expect(stats.secretCount).toBeGreaterThan(0);
    });

    test('should track profile count', () => {
      service.createProfile({
        name: 'prod',
        environment: 'production',
        isDefault: false,
        settings: {},
      });

      const stats = service.getStats();

      expect(stats.profileCount).toBeGreaterThan(0);
    });
  });

  describe('Health Checks', () => {
    test('should perform health check', async () => {
      const health = await service.performHealthCheck();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(health.checks)).toBe(true);
    });

    test('should include store health in checks', async () => {
      service.setConfig('test', 'value');

      const health = await service.performHealthCheck();

      const storeCheck = health.checks.find((c) => c.name === 'Configuration Store');
      expect(storeCheck).toBeDefined();
    });

    test('should include cache health in checks', async () => {
      const health = await service.performHealthCheck();

      const cacheCheck = health.checks.find((c) => c.name === 'Cache Health');
      expect(cacheCheck).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    test('should register change listener', (done) => {
      let changeReceived = false;

      const listener: ConfigListener = async (change: IConfigChange) => {
        changeReceived = true;
      };

      service.onChange(listener);
      service.setConfig('test_key', 'test_value');

      setTimeout(() => {
        expect(changeReceived).toBe(true);
        done();
      }, 100);
    });

    test('should support chaining listeners', () => {
      const listener1: ConfigListener = async () => {};
      const listener2: ConfigListener = async () => {};

      const result = service.onChange(listener1).onChange(listener2);

      expect(result).toBe(service);
    });

    test('should handle listener errors gracefully', (done) => {
      const errorListener: ConfigListener = async () => {
        throw new Error('Listener error');
      };

      expect(() => {
        service.onChange(errorListener);
        service.setConfig('error_key', 'value');
      }).not.toThrow();

      done();
    });
  });

  describe('Service Lifecycle', () => {
    test('should stop service without errors', () => {
      expect(() => {
        service.stop();
      }).not.toThrow();
    });

    test('should handle multiple stop calls gracefully', () => {
      expect(() => {
        service.stop();
        service.stop();
      }).not.toThrow();
    });

    test('should continue accepting configurations after creation', () => {
      const id1 = service.setConfig('config1', 'value1');
      const id2 = service.setConfig('config2', 'value2');

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should manage complete configuration workflow', async () => {
      // Create configurations
      service.setConfig('app.name', 'SOC Lab');
      service.setConfig('app.version', '1.0.0');
      service.setConfig('db.host', 'localhost');
      service.setConfig('db.port', 5432);

      // Create profile
      const profileId = service.createProfile({
        name: 'production',
        environment: 'production',
        isDefault: false,
        settings: { app: { timeout: 10000 } },
      });

      // Create scope
      const scopeId = service.createScope({
        name: 'database',
        namespace: 'persistence',
        settings: { pool_size: 20 },
      });

      // Create snapshot
      const snapshotId = service.createSnapshot('Baseline');

      // Add override
      const overrideId = service.addOverride({
        path: 'app.timeout',
        value: 15000,
        priority: 100,
        enabled: true,
      });

      // Verify setup
      expect(service.getConfig('app.name')).toBe('SOC Lab');
      expect(service.getProfile(profileId)).toBeDefined();
      expect(service.getScope(scopeId)).toBeDefined();
      expect(service.getSnapshot(snapshotId)).toBeDefined();
      expect(service.getOverride(overrideId)).toBeDefined();

      // Check statistics
      const stats = service.getStats();
      expect(stats.totalValues).toBeGreaterThan(0);

      // Perform health check
      const health = await service.performHealthCheck();
      expect(health.status).toBeDefined();
    });

    test('should handle configuration updates with history', () => {
      let changeCount = 0;

      service.onChange(async () => {
        changeCount++;
      });

      service.setConfig('key1', 'value1');
      service.setConfig('key1', 'value2');
      service.setConfig('key1', 'value3');

      setTimeout(() => {
        expect(changeCount).toBeGreaterThanOrEqual(3);
      }, 100);
    });

    test('should apply and validate configurations', () => {
      const rules: IValidationRule[] = [
        {
          path: 'app.name',
          type: 'required',
          required: true,
        },
        {
          path: 'app.timeout',
          type: 'range',
          min: 100,
          max: 60000,
        },
      ];

      const config = {
        app: { name: 'Test', timeout: 5000 },
      };

      const result = service.validateConfig(config, rules);
      expect(result.valid).toBe(true);
    });
  });
});
