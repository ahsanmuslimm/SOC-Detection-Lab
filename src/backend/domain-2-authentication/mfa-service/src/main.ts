/**
 * MFA Service - Main Implementation
 * Multi-factor authentication with TOTP, OTP, and backup codes
 */

import type {
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

/**
 * MFA Service - Multi-factor authentication
 */
export class MFAService {
  private config: IMFAServiceConfig;
  private userSettings: Map<string, IUserMFASettings> = new Map();
  private otpChallenges: Map<string, IOTPChallenge> = new Map();
  private mfaChallenges: Map<string, IMFAChallenge> = new Map();
  private setupChallenges: Map<string, ISetupChallenge> = new Map();
  private trustedDevices: Map<string, ITrustedDevice[]> = new Map();
  private backupCodes: Map<string, IBackupCode[]> = new Map();
  private listeners: Set<MFAListener> = new Set();
  private stats: IMFAStats = {
    totalSetups: 0,
    successfulSetups: 0,
    failedSetups: 0,
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    backupCodesGenerated: 0,
    backupCodesUsed: 0,
    devicesAdded: 0,
    devicesRevoked: 0,
    errors: 0,
  };

  constructor(config: IMFAServiceConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.totpConfig || !this.config.otpConfig || !this.config.backupCodeConfig) {
      throw new Error('MFA Service configuration is invalid');
    }
  }

  /**
   * Initialize TOTP setup
   */
  async initiateTOTPSetup(userId: string): Promise<ITOTPSetup> {
    try {
      const secret = this.generateTOTPSecret();
      const issuer = this.config.totpConfig.issuer;
      const accountName = userId;

      // Generate QR code data (simplified)
      const qrCode = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
      const manualEntryKey = secret;

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(this.config.backupCodeConfig.count);

      const setupChallenge: ISetupChallenge = {
        challengeId: this.generateChallengeId(),
        userId,
        method: 'totp',
        step: 'init',
        data: { secret, qrCode, manualEntryKey },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.challengeTimeout * 1000),
        verified: false,
      };

      this.setupChallenges.set(setupChallenge.challengeId, setupChallenge);
      this.emitEvent('setup_started', { userId, method: 'totp' });

      return {
        secret,
        qrCode,
        manualEntryKey,
        backupCodes,
      };
    } catch (err) {
      this.stats.errors++;
      this.stats.failedSetups++;
      throw err;
    }
  }

  /**
   * Verify TOTP setup
   */
  async verifyTOTPSetup(userId: string, code: string): Promise<boolean> {
    try {
      const isValid = this.verifyTOTPCode(code);
      if (!isValid) {
        this.stats.failedSetups++;
        this.emitEvent('setup_failed', { userId, method: 'totp' });
        return false;
      }

      // Create MFA method
      const method: IMFAMethod = {
        userId,
        type: 'totp',
        enabled: true,
        verified: true,
        createdAt: new Date(),
        priority: 1,
      };

      let settings = this.userSettings.get(userId);
      if (!settings) {
        settings = {
          userId,
          isRequired: false,
          methods: [],
          backupCodesUsed: 0,
        };
        this.userSettings.set(userId, settings);
      }

      settings.methods.push(method);
      this.stats.successfulSetups++;
      this.stats.totalSetups++;
      this.emitEvent('setup_completed', { userId, method: 'totp' });

      return true;
    } catch (err) {
      this.stats.failedSetups++;
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Request OTP
   */
  async requestOTP(request: IOTPRequest): Promise<string> {
    try {
      const challengeId = this.generateChallengeId();
      const code = this.generateOTP(this.config.otpConfig.digits);
      const expiresAt = new Date(Date.now() + this.config.otpConfig.expiresIn * 1000);

      const challenge: IOTPChallenge = {
        challengeId,
        userId: request.userId,
        method: request.method,
        destination: request.destination,
        createdAt: new Date(),
        expiresAt,
        attempts: 0,
        status: 'pending',
      };

      this.otpChallenges.set(challengeId, challenge);

      // Simulate sending OTP (in production, use actual service)
      this.simulateOTPDelivery(request.method, request.destination, code);

      this.emitEvent('verification_started', { userId: request.userId, method: request.method === 'email' ? 'email_otp' : 'sms_otp' });

      return challengeId;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(challengeId: string, code: string): Promise<IMFAVerificationResult> {
    try {
      const challenge = this.otpChallenges.get(challengeId);
      if (!challenge) {
        this.stats.failedVerifications++;
        this.stats.totalVerifications++;
        this.emitEvent('verification_failed', { userId: 'unknown' });
        return { success: false, userId: 'unknown', method: 'email_otp', error: 'Challenge not found' };
      }

      if (challenge.status !== 'pending') {
        return { success: false, userId: challenge.userId, method: challenge.method === 'email' ? 'email_otp' : 'sms_otp', error: 'Challenge already used' };
      }

      if (challenge.expiresAt < new Date()) {
        challenge.status = 'expired';
        this.stats.failedVerifications++;
        this.stats.totalVerifications++;
        return { success: false, userId: challenge.userId, method: challenge.method === 'email' ? 'email_otp' : 'sms_otp', error: 'Challenge expired' };
      }

      challenge.attempts++;
      if (challenge.attempts > this.config.otpConfig.maxAttempts) {
        challenge.status = 'failed';
        this.stats.failedVerifications++;
        this.stats.totalVerifications++;
        this.emitEvent('verification_failed', { userId: challenge.userId, method: challenge.method });
        return { success: false, userId: challenge.userId, method: challenge.method === 'email' ? 'email_otp' : 'sms_otp', error: 'Max attempts exceeded' };
      }

      // Verify code (simplified - in production, compare with stored OTP)
      const isValid = this.verifyOTPCode(code);
      if (!isValid) {
        return { success: false, userId: challenge.userId, method: challenge.method === 'email' ? 'email_otp' : 'sms_otp', error: 'Invalid code' };
      }

      challenge.status = 'verified';
      this.stats.successfulVerifications++;
      this.stats.totalVerifications++;
      this.emitEvent('verification_succeeded', { userId: challenge.userId, method: challenge.method });

      return { success: true, userId: challenge.userId, method: challenge.method === 'email' ? 'email_otp' : 'sms_otp' };
    } catch (err) {
      this.stats.failedVerifications++;
      this.stats.errors++;
      return { success: false, userId: 'unknown', method: 'email_otp', error: 'Verification failed' };
    }
  }

  /**
   * Create MFA challenge
   */
  async createMFAChallenge(userId: string, method: MFAMethodType): Promise<IMFAChallenge> {
    try {
      const challengeId = this.generateChallengeId();
      const challenge: IMFAChallenge = {
        challengeId,
        userId,
        method,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.challengeTimeout * 1000),
        status: 'pending',
        attempts: 0,
        maxAttempts: this.config.otpConfig.maxAttempts,
      };

      this.mfaChallenges.set(challengeId, challenge);
      this.emitEvent('verification_started', { userId, method });

      return challenge;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Verify MFA challenge
   */
  async verifyMFAChallenge(challengeId: string, response: IChallengeResponse): Promise<IMFAVerificationResult> {
    try {
      const challenge = this.mfaChallenges.get(challengeId);
      if (!challenge) {
        this.stats.failedVerifications++;
        return { success: false, userId: 'unknown', method: 'totp', error: 'Challenge not found' };
      }

      if (challenge.status !== 'pending') {
        return { success: false, userId: challenge.userId, method: challenge.method, error: 'Challenge already used' };
      }

      if (challenge.expiresAt < new Date()) {
        challenge.status = 'expired';
        this.stats.failedVerifications++;
        this.stats.totalVerifications++;
        return { success: false, userId: challenge.userId, method: challenge.method, error: 'Challenge expired' };
      }

      challenge.attempts++;
      if (challenge.attempts > challenge.maxAttempts) {
        challenge.status = 'failed';
        this.stats.failedVerifications++;
        this.stats.totalVerifications++;
        this.emitEvent('verification_failed', { userId: challenge.userId, method: challenge.method });
        return { success: false, userId: challenge.userId, method: challenge.method, error: 'Max attempts exceeded' };
      }

      // Try backup code first
      const backupCodeResult = await this.verifyBackupCode(challenge.userId, response.code);
      if (backupCodeResult) {
        challenge.status = 'verified';
        this.stats.successfulVerifications++;
        this.stats.totalVerifications++;
        this.stats.backupCodesUsed++;
        this.emitEvent('verification_succeeded', { userId: challenge.userId, method: challenge.method });
        this.emitEvent('backup_code_used', { userId: challenge.userId });
        return { success: true, userId: challenge.userId, method: challenge.method, rememberUntil: this.getRememberUntil(response.rememberDevice) };
      }

      // Verify code for method
      const isValid = this.verifyMFACode(challenge.method, response.code);
      if (!isValid) {
        return { success: false, userId: challenge.userId, method: challenge.method, error: 'Invalid code' };
      }

      challenge.status = 'verified';
      this.stats.successfulVerifications++;
      this.stats.totalVerifications++;
      this.emitEvent('verification_succeeded', { userId: challenge.userId, method: challenge.method });

      return { success: true, userId: challenge.userId, method: challenge.method, rememberUntil: this.getRememberUntil(response.rememberDevice) };
    } catch (err) {
      this.stats.failedVerifications++;
      this.stats.errors++;
      return { success: false, userId: 'unknown', method: 'totp', error: 'Verification failed' };
    }
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId: string, count?: number): Promise<string[]> {
    try {
      const codeCount = count || this.config.backupCodeConfig.count;
      const codes: string[] = [];

      for (let i = 0; i < codeCount; i++) {
        codes.push(this.generateBackupCode(this.config.backupCodeConfig.length));
      }

      const backupCodes: IBackupCode[] = codes.map(code => ({
        code,
        used: false,
        createdAt: new Date(),
      }));

      this.backupCodes.set(userId, backupCodes);
      this.stats.backupCodesGenerated++;
      this.emitEvent('backup_code_generated', { userId });

      return codes;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Get remaining backup codes count
   */
  async getBackupCodesCount(userId: string): Promise<number> {
    const codes = this.backupCodes.get(userId) || [];
    return codes.filter(c => !c.used).length;
  }

  /**
   * Add trusted device
   */
  async addTrustedDevice(userId: string, deviceName: string, fingerprint: string, ipAddress: string, userAgent: string): Promise<ITrustedDevice> {
    try {
      const deviceId = this.generateDeviceId();
      const device: ITrustedDevice = {
        deviceId,
        userId,
        deviceName,
        fingerprint,
        trustedAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.deviceRememberDuration * 1000),
        lastUsedAt: new Date(),
        ipAddress,
        userAgent,
      };

      let devices = this.trustedDevices.get(userId) || [];
      devices.push(device);
      this.trustedDevices.set(userId, devices);

      this.stats.devicesAdded++;
      this.emitEvent('device_trusted', { userId, details: { deviceName, fingerprint } });

      return device;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Get trusted devices
   */
  async getTrustedDevices(userId: string): Promise<ITrustedDevice[]> {
    const devices = this.trustedDevices.get(userId) || [];
    return devices.filter(d => d.expiresAt > new Date());
  }

  /**
   * Revoke trusted device
   */
  async revokeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const devices = this.trustedDevices.get(userId) || [];
      const index = devices.findIndex(d => d.deviceId === deviceId);

      if (index === -1) {
        return false;
      }

      devices.splice(index, 1);
      this.stats.devicesRevoked++;
      this.emitEvent('device_revoked', { userId, details: { deviceId } });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Is device trusted
   */
  async isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
    const devices = await this.getTrustedDevices(userId);
    return devices.some(d => d.fingerprint === fingerprint && d.expiresAt > new Date());
  }

  /**
   * Get user MFA settings
   */
  async getUserMFASettings(userId: string): Promise<IUserMFASettings | null> {
    return this.userSettings.get(userId) || null;
  }

  /**
   * Get recovery options
   */
  async getRecoveryOptions(userId: string): Promise<IRecoveryOptions> {
    const settings = this.userSettings.get(userId);
    const backupCodes = this.backupCodes.get(userId) || [];
    const remainingCodes = backupCodes.filter(c => !c.used).length;

    return {
      useBackupCode: remainingCodes > 0,
      useRecoveryEmail: !!settings?.recoveryEmail,
      useRecoveryPhone: !!settings?.recoveryPhone,
      backupCodesRemaining: remainingCodes,
    };
  }

  /**
   * Remove MFA method
   */
  async removeMFAMethod(userId: string, method: MFAMethodType): Promise<boolean> {
    try {
      const settings = this.userSettings.get(userId);
      if (!settings) {
        return false;
      }

      const index = settings.methods.findIndex(m => m.type === method);
      if (index === -1) {
        return false;
      }

      settings.methods.splice(index, 1);
      this.stats.errors++;
      this.emitEvent('method_removed', { userId, method });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Register listener
   */
  onMFA(listener: MFAListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove listener
   */
  offMFA(listener: MFAListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Get statistics
   */
  getStats(): IMFAStats {
    return { ...this.stats };
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private generateTOTPSecret(): string {
    return `SECRET-${Date.now()}-${Math.random().toString(36).substr(2, 32)}`;
  }

  private generateOTP(digits: number): string {
    const codes = '0123456789';
    let code = '';
    for (let i = 0; i < digits; i++) {
      code += codes.charAt(Math.floor(Math.random() * codes.length));
    }
    return code;
  }

  private generateBackupCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format as XXXX-XXXX-XXXX for readability
    return code.substring(0, 4) + '-' + code.substring(4, 8) + '-' + code.substring(8, 12);
  }

  private generateChallengeId(): string {
    return `chg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceId(): string {
    return `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private verifyTOTPCode(code: string): boolean {
    // Simplified TOTP verification (6 digits)
    return /^\d{6}$/.test(code);
  }

  private verifyOTPCode(code: string): boolean {
    // Simplified OTP verification
    return /^\d{6}$/.test(code) || /^\d{8}$/.test(code);
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const codes = this.backupCodes.get(userId) || [];
    const backup = codes.find(c => c.code === code && !c.used);

    if (backup) {
      backup.used = true;
      backup.usedAt = new Date();
      return true;
    }

    return false;
  }

  private verifyMFACode(method: MFAMethodType, code: string): boolean {
    if (method === 'totp') {
      return this.verifyTOTPCode(code);
    }
    if (method === 'email_otp' || method === 'sms_otp') {
      return this.verifyOTPCode(code);
    }
    return false;
  }

  private simulateOTPDelivery(method: OTPDeliveryMethod, destination: string, code: string): void {
    // Simulate sending OTP (in production, use actual SMS/Email service)
    console.log(`[MFAService] OTP Code: ${code} sent via ${method} to ${destination}`);
  }

  private getRememberUntil(rememberDevice?: boolean): Date | undefined {
    if (rememberDevice) {
      return new Date(Date.now() + this.config.deviceRememberDuration * 1000);
    }
    return undefined;
  }

  private emitEvent(type: IMFAEvent['type'], details?: Record<string, unknown>): void {
    const event: IMFAEvent = {
      type,
      timestamp: new Date(),
      userId: (details?.userId as string) || 'unknown',
      method: details?.method as MFAMethodType,
      details,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[MFAService] Listener error:', err);
      }
    }
  }
}

/**
 * Factory function
 */
export function createMFAService(config: IMFAServiceConfig): MFAService {
  return new MFAService(config);
}

/**
 * Default export
 */
export default MFAService;
