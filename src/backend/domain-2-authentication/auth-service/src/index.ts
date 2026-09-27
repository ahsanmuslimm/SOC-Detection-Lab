/**
 * Auth Service - Public API
 * Exports authentication service and related types
 */

export { AuthService, createAuthService } from './main';
export type {
  ILoginRequest,
  ILoginResponse,
  IAuthUser,
  IPasswordChangeRequest,
  IPasswordResetRequest,
  IPasswordResetToken,
  ISession,
  IAccountLockout,
  IAuthResult,
  IRegistrationRequest,
  IRegistrationResponse,
  IMFASetupResponse,
  IMFAVerificationRequest,
  IAuthServiceConfig,
  ILoginAttempt,
  IAuditEvent,
  IPasswordPolicy,
  ISessionStats,
  IAccountStats,
  AuthListener,
  AccountStatus,
} from './types';
