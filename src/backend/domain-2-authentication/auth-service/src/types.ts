/**
 * Auth Service - Type Definitions
 * Type definitions for user authentication and session management
 */

/**
 * User credentials for login
 */
export interface ILoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response with tokens
 */
export interface ILoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: IAuthUser;
  expiresIn: number;
}

/**
 * Authenticated user information
 */
export interface IAuthUser {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastLogin?: Date;
  loginAttempts: number;
  isActive: boolean;
  isMFAEnabled: boolean;
}

/**
 * User credentials for password management
 */
export interface IPasswordChangeRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Password reset request
 */
export interface IPasswordResetRequest {
  email: string;
}

/**
 * Password reset token
 */
export interface IPasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
}

/**
 * Session information
 */
export interface ISession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

/**
 * Account lockout configuration
 */
export interface IAccountLockout {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  resetAttemptsAfterMinutes: number;
}

/**
 * Authentication result
 */
export interface IAuthResult {
  success: boolean;
  user?: IAuthUser;
  token?: string;
  error?: string;
  errorCode?: string;
  remainingAttempts?: number;
  lockedUntil?: Date;
}

/**
 * User registration request
 */
export interface IRegistrationRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * User registration response
 */
export interface IRegistrationResponse {
  success: boolean;
  userId?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

/**
 * MFA setup response
 */
export interface IMFASetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * MFA verification request
 */
export interface IMFAVerificationRequest {
  userId: string;
  code: string;
  method: 'totp' | 'sms' | 'email';
}

/**
 * Auth service configuration
 */
export interface IAuthServiceConfig {
  jwtService: any; // JWTService instance
  database: any; // Database connection
  passwordHashAlgorithm: string;
  sessionTimeout: number;
  refreshTokenRotation: boolean;
  enableMFA: boolean;
  lockout: IAccountLockout;
}

/**
 * Login attempt entry
 */
export interface ILoginAttempt {
  userId?: string;
  username?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
}

/**
 * Audit event
 */
export interface IAuditEvent {
  type: 'login' | 'logout' | 'password_change' | 'mfa_enable' | 'mfa_disable' | 'failed_login';
  userId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

/**
 * Auth listener
 */
export type AuthListener = (event: IAuditEvent) => Promise<void> | void;

/**
 * User account status
 */
export type AccountStatus = 'active' | 'inactive' | 'locked' | 'suspended';

/**
 * Password policy
 */
export interface IPasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays?: number;
  historyCount?: number;
}

/**
 * Session statistics
 */
export interface ISessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  totalLogins: number;
  totalLogouts: number;
  failedLogins: number;
  successRate: number;
}

/**
 * Account statistics
 */
export interface IAccountStats {
  totalUsers: number;
  activeUsers: number;
  lockedAccounts: number;
  accountsWithMFA: number;
  lastPasswordChangeDate?: Date;
}
