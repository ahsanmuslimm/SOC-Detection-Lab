/**
 * MFA Service - Type Definitions
 * Type definitions for multi-factor authentication
 */

/**
 * MFA method types
 */
export type MFAMethodType = 'totp' | 'email_otp' | 'sms_otp' | 'backup_codes';

/**
 * MFA challenge status
 */
export type MFAChallengeStatus = 'pending' | 'verified' | 'expired' | 'failed';

/**
 * TOTP configuration
 */
export interface ITOTPConfig {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  issuer: string;
  accountName: string;
}

/**
 * TOTP setup response
 */
export interface ITOTPSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
}

/**
 * OTP configuration
 */
export interface IOTPConfig {
  digits: number;
  expiresIn: number;
  maxAttempts: number;
  resendLimit: number;
}

/**
 * OTP delivery method
 */
export type OTPDeliveryMethod = 'email' | 'sms';

/**
 * OTP request
 */
export interface IOTPRequest {
  userId: string;
  method: OTPDeliveryMethod;
  destination: string;
}

/**
 * OTP challenge
 */
export interface IOTPChallenge {
  challengeId: string;
  userId: string;
  method: OTPDeliveryMethod;
  destination: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  status: MFAChallengeStatus;
}

/**
 * MFA method
 */
export interface IMFAMethod {
  userId: string;
  type: MFAMethodType;
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  priority: number;
  metadata?: Record<string, unknown>;
}

/**
 * User MFA settings
 */
export interface IUserMFASettings {
  userId: string;
  isRequired: boolean;
  methods: IMFAMethod[];
  recoveryEmail?: string;
  recoveryPhone?: string;
  backupCodesRegeneratedAt?: Date;
  backupCodesUsed: number;
}

/**
 * Backup code
 */
export interface IBackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

/**
 * Challenge response
 */
export interface IChallengeResponse {
  challengeId: string;
  code: string;
  rememberDevice?: boolean;
}

/**
 * MFA verification result
 */
export interface IMFAVerificationResult {
  success: boolean;
  userId: string;
  method: MFAMethodType;
  rememberUntil?: Date;
  error?: string;
}

/**
 * MFA challenge
 */
export interface IMFAChallenge {
  challengeId: string;
  userId: string;
  method: MFAMethodType;
  createdAt: Date;
  expiresAt: Date;
  status: MFAChallengeStatus;
  attempts: number;
  maxAttempts: number;
}

/**
 * MFA service configuration
 */
export interface IMFAServiceConfig {
  totpConfig: {
    algorithm: 'SHA1' | 'SHA256' | 'SHA512';
    digits: number;
    period: number;
    issuer: string;
  };
  otpConfig: {
    digits: number;
    expiresIn: number;
    maxAttempts: number;
    resendLimit: number;
  };
  backupCodeConfig: {
    count: number;
    length: number;
  };
  challengeTimeout: number;
  deviceRememberDuration: number;
}

/**
 * Trusted device
 */
export interface ITrustedDevice {
  deviceId: string;
  userId: string;
  deviceName: string;
  fingerprint: string;
  trustedAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * MFA event
 */
export interface IMFAEvent {
  type: 'setup_started' | 'setup_completed' | 'setup_failed' | 'verification_started' | 'verification_succeeded' | 'verification_failed' | 'method_removed' | 'backup_code_generated' | 'backup_code_used' | 'device_trusted' | 'device_revoked' | 'error';
  timestamp: Date;
  userId: string;
  method?: MFAMethodType;
  details?: Record<string, unknown>;
}

/**
 * MFA listener
 */
export type MFAListener = (event: IMFAEvent) => Promise<void> | void;

/**
 * MFA statistics
 */
export interface IMFAStats {
  totalSetups: number;
  successfulSetups: number;
  failedSetups: number;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  backupCodesGenerated: number;
  backupCodesUsed: number;
  devicesAdded: number;
  devicesRevoked: number;
  errors: number;
}

/**
 * Setup challenge
 */
export interface ISetupChallenge {
  challengeId: string;
  userId: string;
  method: MFAMethodType;
  step: 'init' | 'verify' | 'backup_codes' | 'complete';
  data: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

/**
 * Recovery options
 */
export interface IRecoveryOptions {
  useBackupCode: boolean;
  useRecoveryEmail: boolean;
  useRecoveryPhone: boolean;
  backupCodesRemaining: number;
}
