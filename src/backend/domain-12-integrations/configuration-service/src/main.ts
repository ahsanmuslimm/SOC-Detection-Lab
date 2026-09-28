/**
 * Configuration Service - Main Implementation
 * Hierarchical configuration management with validation, encryption, and history
 */

import crypto from 'crypto';

import {
  ConfigEnvironment,
  ConfigValueType,
  ConfigUpdateAction,
  MergeStrategy,
  IConfigValue,
  IValidationRule,
  IConfigProfile,
  IConfigScope,
  IConfigChange,
  IConfigOverride,
  IResolutionContext,
  IConfigSnapshot,
  IConfigComparison,
  ConfigListener,
  IConfigStats,
  IConfigHealthCheck,
  IConfigServiceConfig,
  IConfigValidationResult,
  IConfigDependency,
  IConfigWatchHandle,
  IConfigAuditEntry,
  IConfigDraft,
  IRotationPolicy,
} from './types';

/**
 * Configuration Service - Manages hierarchical configuration
 */
export class ConfigurationService {
  private config: Map<string, IConfigValue>;
  private profiles: Map<string, IConfigProfile>;
  private scopes: Map<string, IConfigScope>;
  private overrides: Map<string, IConfigOverride>;
  private changes: IConfigChange[];
  private snapshots: Map<string, IConfigSnapshot>;
  private listeners: ConfigListener[];
  private watches: Map<string, IConfigWatchHandle>;
  private audits: IConfigAuditEntry[];
  private drafts: Map<string, IConfigDraft>;
  private dependencies: Map<string, IConfigDependency>;
  private rotationPolicies: Map<string, IRotationPolicy>;
  private cache: Map<string, { value: ConfigValueType; expiry: number }>;
  private stats: IConfigStats;
  private cleanupInterval: NodeJS.Timer | null = null;
  private rotationInterval: NodeJS.Timer | null = null;
  private config_: IConfigServiceConfig;

  constructor(config: IConfigServiceConfig) {
    this.config_ = this.validateConfig(config);
    this.config = new Map();
    this.profiles = new Map();
    this.scopes = new Map();
    this.overrides = new Map();
    this.changes = [];
    this.snapshots = new Map();
    this.listeners = [];
    this.watches = new Map();
    this.audits = [];
    this.drafts = new Map();
    this.dependencies = new Map();
    this.rotationPolicies = new Map();
    this.cache = new Map();
    this.stats = this.initializeStats();

    this.startCleanupInterval();
    this.startRotationInterval();
  }

  private validateConfig(config: IConfigServiceConfig): IConfigServiceConfig {
    if (!config.environment) {
      throw new Error('Configuration environment is required');
    }
    return config;
  }

  private initializeStats(): IConfigStats {
    return {
      totalKeys: 0,
      totalValues: 0,
      encryptedCount: 0,
      secretCount: 0,
      sourceCount: 0,
      profileCount: 0,
      overrideCount: 0,
      lastUpdated: new Date(),
    };
  }

  public setConfig(key: string, value: ConfigValueType, options?: { secret?: boolean; encrypted?: boolean; source?: string }): string {
    const configId = this.generateConfigId();
    const type = this.determineType(value);

    const configValue: IConfigValue = {
      key,
      value,
      type,
      source: 'override',
      sourceLocation: options?.source,
      timestamp: new Date(),
      encrypted: options?.encrypted || false,
      secret: options?.secret || false,
    };

    this.config.set(configId, configValue);
    this.stats.totalValues++;
    this.stats.lastUpdated = new Date();

    if (options?.encrypted) {
      this.stats.encryptedCount++;
    }
    if (options?.secret) {
      this.stats.secretCount++;
    }

    this.invalidateCache(key);
    this.recordChange({
      action: 'set',
      path: key,
      newValue: value,
    });

    return configId;
  }

  public getConfig(key: string, context?: IResolutionContext): ConfigValueType {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    // Get from configuration
    const value = this.resolveConfig(key, context);

    // Cache result
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.config_.cacheTTL,
    });

    return value;
  }

  private resolveConfig(key: string, context?: IResolutionContext): ConfigValueType {
    let resolvedValue: ConfigValueType = null;

    // Check overrides first (highest priority)
    for (const override of this.overrides.values()) {
      if (this.matchesPattern(key, override.path) && this.matchesCondition(override.condition, context)) {
        return override.value;
      }
    }

    // Check scopes
    for (const scope of this.scopes.values()) {
      if (scope.settings[key] !== undefined) {
        resolvedValue = scope.settings[key];
      }
    }

    // Check profiles
    const profile = this.getProfileForContext(context);
    if (profile && profile.settings[key] !== undefined) {
      resolvedValue = profile.settings[key];
    }

    // Check direct config
    for (const configVal of this.config.values()) {
      if (configVal.key === key) {
        resolvedValue = configVal.value;
        break;
      }
    }

    return resolvedValue;
  }

  public createProfile(profile: Omit<IConfigProfile, 'createdAt' | 'updatedAt'>): string {
    const profileId = this.generateProfileId();
    const newProfile: IConfigProfile = {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(profileId, newProfile);
    this.stats.profileCount++;
    this.stats.lastUpdated = new Date();

    return profileId;
  }

  public getProfile(profileId: string): IConfigProfile | null {
    return this.profiles.get(profileId) || null;
  }

  public updateProfile(profileId: string, updates: Partial<IConfigProfile>): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) return false;

    Object.assign(profile, updates, { updatedAt: new Date() });
    this.stats.lastUpdated = new Date();
    this.invalidateAllCache();

    return true;
  }

  public deleteProfile(profileId: string): boolean {
    const deleted = this.profiles.delete(profileId);
    if (deleted) {
      this.stats.profileCount--;
      this.stats.lastUpdated = new Date();
      this.invalidateAllCache();
    }
    return deleted;
  }

  public createScope(scope: Omit<IConfigScope, 'createdAt' | 'updatedAt'>): string {
    const scopeId = this.generateScopeId();
    const newScope: IConfigScope = {
      ...scope,
      scopeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scopes.set(scopeId, newScope);
    this.stats.lastUpdated = new Date();

    return scopeId;
  }

  public getScope(scopeId: string): IConfigScope | null {
    return this.scopes.get(scopeId) || null;
  }

  public updateScope(scopeId: string, updates: Partial<IConfigScope>): boolean {
    const scope = this.scopes.get(scopeId);
    if (!scope) return false;

    Object.assign(scope, updates, { updatedAt: new Date() });
    this.stats.lastUpdated = new Date();
    this.invalidateAllCache();

    return true;
  }

  public addOverride(override: Omit<IConfigOverride, 'overrideId'>): string {
    const overrideId = this.generateOverrideId();
    const newOverride: IConfigOverride = {
      ...override,
      overrideId,
    };

    this.overrides.set(overrideId, newOverride);
    this.stats.overrideCount++;
    this.stats.lastUpdated = new Date();
    this.invalidateAllCache();

    return overrideId;
  }

  public getOverride(overrideId: string): IConfigOverride | null {
    return this.overrides.get(overrideId) || null;
  }

  public removeOverride(overrideId: string): boolean {
    const deleted = this.overrides.delete(overrideId);
    if (deleted) {
      this.stats.overrideCount--;
      this.stats.lastUpdated = new Date();
      this.invalidateAllCache();
    }
    return deleted;
  }

  public validateConfig(values: Record<string, ConfigValueType>, rules: IValidationRule[]): IConfigValidationResult {
    const errors: Array<{ path: string; rule: string; message: string }> = [];
    const warnings: Array<{ path: string; message: string }> = [];

    for (const rule of rules) {
      const value = this.getNestedValue(values, rule.path);

      if (rule.required && value === undefined) {
        errors.push({
          path: rule.path,
          rule: 'required',
          message: rule.message || `${rule.path} is required`,
        });
        continue;
      }

      if (value === undefined) continue;

      switch (rule.type) {
        case 'type':
          const expectedType = typeof value;
          if (expectedType !== rule.type) {
            errors.push({
              path: rule.path,
              rule: 'type',
              message: rule.message || `${rule.path} must be of type ${rule.type}`,
            });
          }
          break;

        case 'pattern':
          if (rule.pattern && !new RegExp(rule.pattern).test(String(value))) {
            errors.push({
              path: rule.path,
              rule: 'pattern',
              message: rule.message || `${rule.path} does not match pattern ${rule.pattern}`,
            });
          }
          break;

        case 'range':
          const num = Number(value);
          if (rule.min !== undefined && num < rule.min) {
            errors.push({
              path: rule.path,
              rule: 'range',
              message: rule.message || `${rule.path} must be >= ${rule.min}`,
            });
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push({
              path: rule.path,
              rule: 'range',
              message: rule.message || `${rule.path} must be <= ${rule.max}`,
            });
          }
          break;

        case 'enum':
          if (rule.enum && !rule.enum.includes(value)) {
            errors.push({
              path: rule.path,
              rule: 'enum',
              message: rule.message || `${rule.path} must be one of ${rule.enum.join(', ')}`,
            });
          }
          break;

        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push({
              path: rule.path,
              rule: 'custom',
              message: rule.message || `${rule.path} failed custom validation`,
            });
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public createSnapshot(description?: string): string {
    const snapshotId = this.generateSnapshotId();
    const configData: Record<string, ConfigValueType> = {};

    for (const [, value] of this.config) {
      configData[value.key] = value.value;
    }

    const snapshot: IConfigSnapshot = {
      snapshotId,
      timestamp: new Date(),
      environment: this.config_.environment,
      config: configData,
      hash: this.hashConfig(configData),
      description,
      restorable: true,
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshotId;
  }

  public getSnapshot(snapshotId: string): IConfigSnapshot | null {
    return this.snapshots.get(snapshotId) || null;
  }

  public restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot || !snapshot.restorable) return false;

    this.config.clear();
    for (const [key, value] of Object.entries(snapshot.config)) {
      this.setConfig(key, value);
    }

    this.invalidateAllCache();
    this.recordChange({
      action: 'set',
      path: `snapshot:${snapshotId}`,
      newValue: snapshotId,
    });

    return true;
  }

  public compareSnapshots(snapshot1Id: string, snapshot2Id: string): IConfigComparison | null {
    const snap1 = this.snapshots.get(snapshot1Id);
    const snap2 = this.snapshots.get(snapshot2Id);

    if (!snap1 || !snap2) return null;

    const differences: Array<{
      path: string;
      value1: ConfigValueType;
      value2: ConfigValueType;
      type: 'added' | 'removed' | 'modified';
    }> = [];

    const allKeys = new Set([...Object.keys(snap1.config), ...Object.keys(snap2.config)]);

    for (const key of allKeys) {
      const val1 = snap1.config[key];
      const val2 = snap2.config[key];

      if (val1 === undefined) {
        differences.push({ path: key, value1: val1, value2: val2, type: 'added' });
      } else if (val2 === undefined) {
        differences.push({ path: key, value1: val1, value2: val2, type: 'removed' });
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({ path: key, value1: val1, value2: val2, type: 'modified' });
      }
    }

    return {
      snapshot1Id,
      snapshot2Id,
      differences,
      timestamp: new Date(),
    };
  }

  public watchConfig(pattern: string, handler: ConfigListener): string {
    const watchId = this.generateWatchId();
    const watch: IConfigWatchHandle = {
      watchId,
      pattern,
      handler,
      active: true,
      createdAt: new Date(),
    };

    this.watches.set(watchId, watch);
    return watchId;
  }

  public unwatch(watchId: string): boolean {
    return this.watches.delete(watchId);
  }

  public getStats(): IConfigStats {
    return {
      ...this.stats,
      totalKeys: this.config.size,
    };
  }

  public async performHealthCheck(): Promise<IConfigHealthCheck> {
    const checks = [
      {
        name: 'Configuration Store',
        status: this.config.size > 0 ? 'healthy' : 'degraded' as const,
        message: `${this.config.size} configurations loaded`,
      },
      {
        name: 'Cache Health',
        status: this.cache.size < this.config_.maxCacheSize ? 'healthy' : 'degraded' as const,
        message: `Cache size: ${this.cache.size}/${this.config_.maxCacheSize}`,
      },
      {
        name: 'Change History',
        status: this.changes.length < this.config_.maxHistoryEntries ? 'healthy' : 'degraded' as const,
        message: `${this.changes.length} changes tracked`,
      },
      {
        name: 'Profiles',
        status: this.profiles.size > 0 ? 'healthy' : 'degraded' as const,
        message: `${this.profiles.size} profiles configured`,
      },
    ];

    const overallStatus = checks.every((c) => c.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date(),
      checks,
    };
  }

  public onChange(listener: ConfigListener): this {
    this.listeners.push(listener);
    return this;
  }

  private recordChange(change: Omit<IConfigChange, 'changeId' | 'timestamp' | 'approved'>): void {
    const fullChange: IConfigChange = {
      changeId: this.generateChangeId(),
      timestamp: new Date(),
      action: change.action,
      path: change.path,
      oldValue: change.oldValue,
      newValue: change.newValue,
      environment: change.environment || this.config_.environment,
      approved: false,
      reason: change.reason,
      userId: change.userId,
    };

    this.changes.push(fullChange);

    if (this.config_.enableHistoryTracking && this.changes.length > this.config_.maxHistoryEntries) {
      this.changes.shift();
    }

    this.emitChangeEvent(fullChange);
  }

  private async emitChangeEvent(change: IConfigChange): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await Promise.resolve(listener(change));
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    }

    // Also trigger watches
    for (const watch of this.watches.values()) {
      if (watch.active && this.matchesPattern(change.path, watch.pattern)) {
        try {
          await Promise.resolve(watch.handler(change));
        } catch (error) {
          console.error('Error in config watcher:', error);
        }
      }
    }
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(key);
  }

  private matchesCondition(condition?: Record<string, any>, context?: IResolutionContext): boolean {
    if (!condition || !context) return true;

    if (condition.environment && condition.environment !== context.environment) {
      return false;
    }
    if (condition.hostname && condition.hostname !== context.hostname) {
      return false;
    }
    if (condition.region && condition.region !== context.region) {
      return false;
    }

    return true;
  }

  private getProfileForContext(context?: IResolutionContext): IConfigProfile | null {
    if (!context?.environment) return null;

    for (const profile of this.profiles.values()) {
      if (profile.environment === context.environment) {
        return profile;
      }
    }

    return null;
  }

  private determineType(value: ConfigValueType): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'object';
    return typeof value as 'string' | 'number' | 'boolean' | 'object';
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private invalidateCache(key: string): void {
    for (const [cacheKey] of this.cache) {
      if (cacheKey.startsWith(key.split('.')[0])) {
        this.cache.delete(cacheKey);
      }
    }
  }

  private invalidateAllCache(): void {
    this.cache.clear();
  }

  private hashConfig(config: Record<string, ConfigValueType>): string {
    return crypto.createHash('sha256').update(JSON.stringify(config)).digest('hex');
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }

  private startRotationInterval(): void {
    this.rotationInterval = setInterval(() => {
      this.checkRotationPolicies();
    }, 300000); // Check every 5 minutes
  }

  private checkRotationPolicies(): void {
    for (const policy of this.rotationPolicies.values()) {
      if (!policy.enabled) continue;

      const nextRotation = policy.nextRotation || new Date();
      if (nextRotation <= new Date()) {
        this.rotateSecrets(policy);
      }
    }
  }

  private rotateSecrets(policy: IRotationPolicy): void {
    const nextRotation = new Date(Date.now() + policy.rotationInterval);
    policy.lastRotated = new Date();
    policy.nextRotation = nextRotation;
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  private generateConfigId(): string {
    return `cfg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProfileId(): string {
    return `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateScopeId(): string {
    return `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOverrideId(): string {
    return `over_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWatchId(): string {
    return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `chg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createConfigurationService(config: IConfigServiceConfig): ConfigurationService {
  return new ConfigurationService(config);
}
