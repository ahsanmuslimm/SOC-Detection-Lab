/**
 * Auth Service - Main Implementation
 * User authentication, session management, and credential handling
 */

import type {
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
  AuthListener,
  IPasswordPolicy,
  ISessionStats,
  IAccountStats,
} from './types';

/**
 * Auth Service - User authentication and session management
 */
export class AuthService {
  private config: IAuthServiceConfig;
  private sessions: Map<string, ISession> = new Map();
  private loginAttempts: Map<string, ILoginAttempt[]> = new Map();
  private listeners: Set<AuthListener> = new Set();
  private passwordResetTokens: Map<string, IPasswordResetToken> = new Map();
  private stats = {
    totalLogins: 0,
    totalLogouts: 0,
    failedLogins: 0,
    successfulLogins: 0,
    passwordChanges: 0,
    registrations: 0,
  };

  constructor(config: IAuthServiceConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.jwtService) {
      throw new Error('JWT service is required');
    }
    if (!this.config.database) {
      throw new Error('Database connection is required');
    }
  }

  /**
   * User login with credentials
   */
  async login(request: ILoginRequest): Promise<IAuthResult> {
    try {
      // Validate input
      if (!request.username || !request.password) {
        return {
          success: false,
          error: 'Username and password required',
          errorCode: 'INVALID_CREDENTIALS',
        };
      }

      // Check if account is locked
      const lockoutInfo = this.checkAccountLockout(request.username);
      if (lockoutInfo.isLocked) {
        this.recordLoginAttempt(request.username, false, 'Account locked');
        return {
          success: false,
          error: 'Account is temporarily locked',
          errorCode: 'ACCOUNT_LOCKED',
          lockedUntil: lockoutInfo.lockedUntil,
        };
      }

      // Fetch user from database (simulated)
      const user = await this.getUserByUsername(request.username);
      if (!user) {
        this.recordLoginAttempt(request.username, false, 'User not found');
        this.stats.failedLogins++;
        return {
          success: false,
          error: 'Invalid credentials',
          errorCode: 'INVALID_CREDENTIALS',
        };
      }

      // Verify password
      const passwordValid = await this.verifyPassword(request.password, user.userId);
      if (!passwordValid) {
        this.incrementFailedAttempts(request.username);
        this.recordLoginAttempt(request.username, false, 'Invalid password');
        this.stats.failedLogins++;

        const remaining = this.config.lockout.maxFailedAttempts - user.loginAttempts;
        return {
          success: false,
          error: 'Invalid credentials',
          errorCode: 'INVALID_CREDENTIALS',
          remainingAttempts: Math.max(0, remaining),
        };
      }

      // Check if account is active
      if (!user.isActive) {
        this.recordLoginAttempt(request.username, false, 'Account inactive');
        return {
          success: false,
          error: 'Account is inactive',
          errorCode: 'ACCOUNT_INACTIVE',
        };
      }

      // Generate tokens
      const tokens = await this.config.jwtService.generateToken(
        {
          userId: user.userId,
          email: user.email,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        { includeRefreshToken: !user.isMFAEnabled } // Skip refresh if MFA needed
      );

      // Create session
      const session = await this.createSession(user.userId, tokens.accessToken, tokens.refreshToken);

      // Reset failed attempts
      this.resetFailedAttempts(request.username);

      // Record successful attempt
      this.recordLoginAttempt(request.username, true);
      this.stats.totalLogins++;
      this.stats.successfulLogins++;

      // Emit audit event
      this.emitEvent('login', {
        userId: user.userId,
        details: { sessionId: session.sessionId },
      });

      const response: ILoginResponse = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          loginAttempts: 0,
          isActive: user.isActive,
          isMFAEnabled: user.isMFAEnabled,
        },
        expiresIn: tokens.expiresIn,
      };

      return {
        success: true,
        user: response.user,
        token: tokens.accessToken,
      };
    } catch (err) {
      this.stats.failedLogins++;
      return {
        success: false,
        error: String(err),
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * User logout
   */
  async logout(token: string, userId: string): Promise<boolean> {
    try {
      // Revoke JWT token
      await this.config.jwtService.revokeToken(token, 'User logout');

      // Invalidate session
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.userId === userId) {
          session.isActive = false;
        }
      }

      this.stats.totalLogouts++;

      // Emit audit event
      this.emitEvent('logout', { userId });

      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Validate credentials
   */
  async validateCredentials(username: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) return false;

      return this.verifyPassword(password, user.userId);
    } catch {
      return false;
    }
  }

  /**
   * Get active session
   */
  async getSession(token: string): Promise<ISession | null> {
    try {
      // Validate token
      const validation = await this.config.jwtService.validateToken(token);
      if (!validation.valid) return null;

      // Find session
      for (const session of this.sessions.values()) {
        if (session.accessToken === token && session.isActive) {
          session.lastActivityAt = new Date();
          return session;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(token: string): Promise<ILoginResponse | null> {
    try {
      // Get current session
      const session = await this.getSession(token);
      if (!session) return null;

      // Generate new tokens
      const user = await this.getUserById(session.userId);
      if (!user) return null;

      const newTokens = await this.config.jwtService.refreshToken(session.refreshToken || token);

      // Update session
      session.accessToken = newTokens.accessToken;
      session.refreshToken = newTokens.refreshToken;
      session.lastActivityAt = new Date();

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          loginAttempts: 0,
          isActive: user.isActive,
          isMFAEnabled: user.isMFAEnabled,
        },
        expiresIn: newTokens.expiresIn,
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Verify session is valid
   */
  async isSessionValid(token: string): Promise<boolean> {
    try {
      const session = await this.getSession(token);
      return session !== null && session.isActive;
    } catch {
      return false;
    }
  }

  /**
   * Change password
   */
  async changePassword(request: IPasswordChangeRequest): Promise<boolean> {
    try {
      // Verify current password
      if (!(await this.verifyPassword(request.currentPassword, request.userId))) {
        this.emitEvent('password_change', {
          userId: request.userId,
          details: { success: false, reason: 'Invalid current password' },
        });
        return false;
      }

      // Update password (simulated)
      await this.updateUserPassword(request.userId, request.newPassword);

      this.stats.passwordChanges++;

      // Revoke all sessions for this user
      for (const session of this.sessions.values()) {
        if (session.userId === request.userId) {
          session.isActive = false;
        }
      }

      this.emitEvent('password_change', {
        userId: request.userId,
        details: { success: true },
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: IPasswordResetRequest): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(request.email);
      if (!user) return true; // Don't reveal if email exists

      // Generate reset token
      const resetToken: IPasswordResetToken = {
        token: this.generateResetToken(),
        userId: user.userId,
        email: request.email,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        used: false,
      };

      this.passwordResetTokens.set(resetToken.token, resetToken);

      // Send email (simulated)
      await this.sendPasswordResetEmail(request.email, resetToken.token);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify password reset token and set new password
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const resetToken = this.passwordResetTokens.get(token);
      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return false;
      }

      // Update password
      await this.updateUserPassword(resetToken.userId, newPassword);

      // Mark token as used
      resetToken.used = true;

      this.emitEvent('password_change', {
        userId: resetToken.userId,
        details: { via: 'password_reset', success: true },
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Register new user
   */
  async register(request: IRegistrationRequest): Promise<IRegistrationResponse> {
    try {
      // Validate email not already used
      const existing = await this.getUserByEmail(request.email);
      if (existing) {
        return {
          success: false,
          error: 'Email already registered',
        };
      }

      // Create user (simulated)
      const userId = await this.createUser({
        username: request.username,
        email: request.email,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
      });

      this.stats.registrations++;

      return {
        success: true,
        userId,
        requiresEmailVerification: true,
      };
    } catch {
      return {
        success: false,
        error: 'Registration failed',
      };
    }
  }

  /**
   * Register listener
   */
  onAuth(listener: AuthListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove listener
   */
  offAuth(listener: AuthListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalLogins: this.stats.totalLogins,
      totalLogouts: this.stats.totalLogouts,
      failedLogins: this.stats.failedLogins,
      successfulLogins: this.stats.successfulLogins,
      passwordChanges: this.stats.passwordChanges,
      registrations: this.stats.registrations,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.isActive).length,
      successRate:
        this.stats.successfulLogins + this.stats.failedLogins > 0
          ? this.stats.successfulLogins / (this.stats.successfulLogins + this.stats.failedLogins)
          : 0,
    };
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private async getUserByUsername(username: string): Promise<IAuthUser | null> {
    // Simulated database lookup
    return {
      userId: `user-${username}-123`,
      username,
      email: `${username}@example.com`,
      roles: ['user', 'analyst'],
      permissions: ['read_cases', 'read_alerts'],
      loginAttempts: 0,
      isActive: true,
      isMFAEnabled: false,
    };
  }

  private async getUserById(userId: string): Promise<IAuthUser | null> {
    // Simulated database lookup
    return {
      userId,
      username: 'user',
      email: 'user@example.com',
      roles: ['user'],
      permissions: ['read_cases'],
      loginAttempts: 0,
      isActive: true,
      isMFAEnabled: false,
    };
  }

  private async getUserByEmail(email: string): Promise<IAuthUser | null> {
    // Simulated database lookup
    if (email === 'exists@example.com') {
      return {
        userId: 'user-123',
        username: 'existing',
        email,
        roles: ['user'],
        permissions: [],
        loginAttempts: 0,
        isActive: true,
        isMFAEnabled: false,
      };
    }
    return null;
  }

  private async verifyPassword(password: string, userId: string): Promise<boolean> {
    // Simulated password verification (in production, use bcrypt)
    return password.length >= 8; // Placeholder
  }

  private async updateUserPassword(userId: string, password: string): Promise<void> {
    // Simulated password update
  }

  private async createUser(data: any): Promise<string> {
    // Simulated user creation
    return `user-${Date.now()}`;
  }

  private async createSession(
    userId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<ISession> {
    const session: ISession = {
      sessionId: `session-${Date.now()}`,
      userId,
      accessToken,
      refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      lastActivityAt: new Date(),
      isActive: true,
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  private checkAccountLockout(username: string) {
    const attempts = this.loginAttempts.get(username) || [];
    const recentFailures = attempts.filter(
      a => !a.success && Date.now() - a.timestamp.getTime() < 900000 // 15 minutes
    );

    if (recentFailures.length >= this.config.lockout.maxFailedAttempts) {
      const lockedUntil = new Date(recentFailures[0].timestamp.getTime() + this.config.lockout.lockoutDurationMinutes * 60000);
      return { isLocked: true, lockedUntil };
    }

    return { isLocked: false };
  }

  private incrementFailedAttempts(username: string): void {
    const attempts = this.loginAttempts.get(username) || [];
    attempts.push({
      username,
      ipAddress: '0.0.0.0',
      timestamp: new Date(),
      success: false,
    });
    this.loginAttempts.set(username, attempts);
  }

  private resetFailedAttempts(username: string): void {
    this.loginAttempts.delete(username);
  }

  private recordLoginAttempt(username: string, success: boolean, reason?: string): void {
    const attempts = this.loginAttempts.get(username) || [];
    attempts.push({
      username,
      ipAddress: '0.0.0.0',
      timestamp: new Date(),
      success,
      reason,
    });
  }

  private generateResetToken(): string {
    return `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Simulated email sending
  }

  private emitEvent(type: IAuditEvent['type'], details?: any): void {
    const event: IAuditEvent = {
      type,
      timestamp: new Date(),
      ...details,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[AuthService] Listener error:', err);
      }
    }
  }
}

/**
 * Factory function
 */
export function createAuthService(config: IAuthServiceConfig): AuthService {
  return new AuthService(config);
}

/**
 * Default export
 */
export default AuthService;
