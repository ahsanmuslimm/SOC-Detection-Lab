/**
 * Configuration Service - Public API Exports
 * Hierarchical configuration management with validation and encryption
 */

export { ConfigurationService, createConfigurationService } from './main';
export type {
  ConfigEnvironment,
  ConfigValueType,
  ConfigSourceType,
  MergeStrategy,
  ConfigUpdateAction,
  ValidationRuleType,
  IConfigValidationResult,
  IConfigValue,
  IValidationRule,
  IConfigProfile,
  IConfigScope,
  IConfigSchema,
  IConfigSource,
  IConfigChange,
  IConfigOverride,
  IResolutionContext,
  IConfigDependency,
  IRotationPolicy,
  IConfigSnapshot,
  IConfigComparison,
  ConfigListener,
  IConfigStats,
  IConfigHealthCheck,
  IConfigExportOptions,
  IConfigImportOptions,
  IEncryptionConfig,
  IConfigServiceConfig,
  IConfigBatchOperation,
  IConfigAuditEntry,
  IConfigWatchHandle,
  IConfigDraft,
} from './types';
