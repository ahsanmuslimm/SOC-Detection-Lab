/**
 * MFA Service - Public API
 * Multi-factor authentication with TOTP, OTP, and backup codes
 */

export { MFAService, createMFAService } from './main';

export type {
  MFAMethodType,
  MFAChallengeStatus,
  ITOTPConfig,
  ITOTPSetup,
  IOTPConfig,
  OTPDeliveryMethod,
  IOTPRequest,
  IOTPChallenge,
  IMFAMethod,
  IUserMFASettings,
  IBackupCode,
  IChallengeResponse,
  IMFAVerificationResult,
  IMFAChallenge,
  IMFAServiceConfig,
  ITrustedDevice,
  IMFAEvent,
  MFAListener,
  IMFAStats,
  ISetupChallenge,
  IRecoveryOptions,
} from './types';
