/**
 * Configuration Service - Type Definitions
 * Hierarchical configuration management with validation and environment support
 */

/**
 * Configuration environment
 */
export type ConfigEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Configuration value type
 */
export type ConfigValueType = string | number | boolean | null | Record<string, any> | ConfigValueType[];

/**
 * Configuration source type
 */
export type ConfigSourceType = 'env' | 'file' | 'database' | 'default' | 'override';

/**
 * Configuration merge strategy
 */
export type MergeStrategy = 'deep' | 'shallow' | 'replace' | 'array-append';

/**
 * Configuration update action
 */
export type ConfigUpdateAction = 'set' | 'delete' | 'merge' | 'reset';

/**
 * Configuration validation rule type
 */
export type ValidationRuleType = 'required' | 'type' | 'pattern' | 'range' | 'enum' | 'custom' | 'nested';

/**
 * Configuration validation result
 */
export interface IConfigValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    rule: ValidationRuleType;
    message: string;
  }>;
  warnings?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Configuration value with metadata
 */
export interface IConfigValue {
  key: string;
  value: ConfigValueType;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  source: ConfigSourceType;
  sourceLocation?: string;
  timestamp: Date;
  encrypted: boolean;
  secret: boolean;
}

/**
 * Configuration validation rule
 */
export interface IValidationRule {
  path: string;
  type: ValidationRuleType;
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: ConfigValueType[];
  customValidator?: (value: ConfigValueType) => boolean;
  message?: string;
}

/**
 * Configuration profile
 */
export interface IConfigProfile {
  name: string;
  environment: ConfigEnvironment;
  description?: string;
  isDefault: boolean;
  parent?: string;
  settings: Record<string, ConfigValueType>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration scope
 */
export interface IConfigScope {
  scopeId: string;
  name: string;
  description?: string;
  namespace: string;
  parent?: string;
  children?: string[];
  settings: Record<string, ConfigValueType>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration schema
 */
export interface IConfigSchema {
  version: string;
  namespace: string;
  description?: string;
  settings: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    default?: ConfigValueType;
    required?: boolean;
    validation?: IValidationRule;
  }>;
}

/**
 * Configuration source
 */
export interface IConfigSource {
  sourceId: string;
  type: ConfigSourceType;
  location?: string;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration change
 */
export interface IConfigChange {
  changeId: string;
  timestamp: Date;
  userId?: string;
  action: ConfigUpdateAction;
  path: string;
  oldValue?: ConfigValueType;
  newValue?: ConfigValueType;
  reason?: string;
  environment?: ConfigEnvironment;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Configuration override
 */
export interface IConfigOverride {
  overrideId: string;
  path: string;
  value: ConfigValueType;
  condition?: {
    environment?: ConfigEnvironment;
    hostname?: string;
    region?: string;
    custom?: Record<string, any>;
  };
  priority: number;
  enabled: boolean;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration resolution context
 */
export interface IResolutionContext {
  environment: ConfigEnvironment;
  hostname?: string;
  region?: string;
  serviceId?: string;
  userId?: string;
  custom?: Record<string, any>;
}

/**
 * Configuration dependency
 */
export interface IConfigDependency {
  dependencyId: string;
  source: string;
  target: string;
  type: 'reference' | 'conditional' | 'transform';
  condition?: string;
  transform?: (value: ConfigValueType) => ConfigValueType;
  createdAt: Date;
}

/**
 * Configuration rotation policy
 */
export interface IRotationPolicy {
  policyId: string;
  name: string;
  description?: string;
  keyPattern: string;
  rotationInterval: number; // milliseconds
  rotationCount: number;
  lastRotated?: Date;
  nextRotation?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration snapshot
 */
export interface IConfigSnapshot {
  snapshotId: string;
  timestamp: Date;
  environment: ConfigEnvironment;
  config: Record<string, ConfigValueType>;
  hash: string;
  createdBy?: string;
  description?: string;
  restorable: boolean;
}

/**
 * Configuration comparison
 */
export interface IConfigComparison {
  snapshot1Id: string;
  snapshot2Id: string;
  differences: Array<{
    path: string;
    value1: ConfigValueType;
    value2: ConfigValueType;
    type: 'added' | 'removed' | 'modified';
  }>;
  timestamp: Date;
}

/**
 * Configuration listener
 */
export type ConfigListener = (change: IConfigChange) => Promise<void> | void;

/**
 * Configuration statistics
 */
export interface IConfigStats {
  totalKeys: number;
  totalValues: number;
  encryptedCount: number;
  secretCount: number;
  sourceCount: number;
  profileCount: number;
  overrideCount: number;
  lastUpdated: Date;
}

/**
 * Configuration health check
 */
export interface IConfigHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
  }>;
}

/**
 * Configuration export options
 */
export interface IConfigExportOptions {
  format: 'json' | 'yaml' | 'toml' | 'env';
  includeSecrets: boolean;
  excludePatterns?: string[];
  environment?: ConfigEnvironment;
  scope?: string;
}

/**
 * Configuration import options
 */
export interface IConfigImportOptions {
  format: 'json' | 'yaml' | 'toml' | 'env';
  mergeStrategy: MergeStrategy;
  validate: boolean;
  overwrite: boolean;
  sourceLocation?: string;
}

/**
 * Configuration encryption config
 */
export interface IEncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-128-gcm' | 'chacha20-poly1305';
  enabled: boolean;
  keyRotationInterval: number;
  keyDerivation: 'pbkdf2' | 'argon2';
}

/**
 * Configuration service config
 */
export interface IConfigServiceConfig {
  environment: ConfigEnvironment;
  hostname?: string;
  region?: string;
  enableValidation: boolean;
  enableEncryption: boolean;
  encryptionConfig?: IEncryptionConfig;
  mergingStrategy: MergeStrategy;
  cacheTTL: number;
  maxCacheSize: number;
  enableHistoryTracking: boolean;
  maxHistoryEntries: number;
  enableNotifications: boolean;
  retentionDays: number;
}

/**
 * Configuration batch operation
 */
export interface IConfigBatchOperation {
  operationId: string;
  timestamp: Date;
  action: ConfigUpdateAction;
  itemCount: number;
  successCount: number;
  failureCount: number;
  duration: number;
  errors?: Array<{
    key: string;
    error: string;
  }>;
}

/**
 * Configuration audit entry
 */
export interface IConfigAuditEntry {
  auditId: string;
  timestamp: Date;
  userId?: string;
  action: ConfigUpdateAction;
  resourcePath: string;
  oldValue?: ConfigValueType;
  newValue?: ConfigValueType;
  status: 'success' | 'failure';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Configuration watch handle
 */
export interface IConfigWatchHandle {
  watchId: string;
  pattern: string;
  handler: ConfigListener;
  active: boolean;
  createdAt: Date;
}

/**
 * Configuration draft
 */
export interface IConfigDraft {
  draftId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  changes: IConfigChange[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  description?: string;
}
