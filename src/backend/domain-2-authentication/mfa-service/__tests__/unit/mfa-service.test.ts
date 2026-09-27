/**
 * MFA Service - Unit Tests
 * Comprehensive test suite for multi-factor authentication
 */

import { MFAService, createMFAService } from '../../src/main';
import type { IMFAServiceConfig } from '../../src/types';

describe('MFAService', () => {
  let service: MFAService;
  const config: IMFAServiceConfig = {
    totpConfig: {
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      issuer: 'SOC-Lab',
    },
    otpConfig: {
      digits: 6,
      expiresIn: 300,
      maxAttempts: 5,
      resendLimit: 3,
    },
    backupCodeConfig: {
      count: 10,
      length: 12,
    },
    challengeTimeout: 600,
    deviceRememberDuration: 2592000,
  };

  beforeEach(() => {
    service = new MFAService(config);
  });

  // ============================================================
  // Service Creation Tests
  // ============================================================

  describe('Service Creation', () => {
    test('should create MFA service instance', () => {
      expect(service).toBeInstanceOf(MFAService);
    });

    test('should create service via factory', () => {
      const srv = createMFAService(config);
      expect(srv).toBeInstanceOf(MFAService);
    });

    test('should throw error with invalid config', () => {
      expect(() => {
        new MFAService({
          totpConfig: undefined as any,
          otpConfig: config.otpConfig,
          backupCodeConfig: config.backupCodeConfig,
          challengeTimeout: 600,
          deviceRememberDuration: 2592000,
        });
      }).toThrow();
    });

    test('should initialize empty stats', () => {
      const stats = service.getStats();
      expect(stats.totalSetups).toBe(0);
      expect(stats.totalVerifications).toBe(0);
      expect(stats.successfulVerifications).toBe(0);
      expect(stats.failedVerifications).toBe(0);
      expect(stats.backupCodesGenerated).toBe(0);
      expect(stats.devicesAdded).toBe(0);
    });
  });

  // ============================================================
  // TOTP Setup Tests
  // ============================================================

  describe('TOTP Setup', () => {
    test('should initiate TOTP setup', async () => {
      const setup = await service.initiateTOTPSetup('user-123');

      expect(setup.secret).toBeDefined();
      expect(setup.qrCode).toContain('otpauth://totp/');
      expect(setup.manualEntryKey).toBeDefined();
      expect(setup.backupCodes).toHaveLength(10);
    });

    test('should generate unique TOTP secrets', async () => {
      const setup1 = await service.initiateTOTPSetup('user-123');
      const setup2 = await service.initiateTOTPSetup('user-456');

      expect(setup1.secret).not.toBe(setup2.secret);
    });

    test('should include issuer in QR code', async () => {
      const setup = await service.initiateTOTPSetup('user-123');

      expect(setup.qrCode).toContain('issuer=SOC-Lab');
      expect(setup.qrCode).toContain('user-123');
    });

    test('should generate backup codes', async () => {
      const setup = await service.initiateTOTPSetup('user-123');

      setup.backupCodes.forEach(code => {
        // Format should be XXXX-XXXX-XXXX
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });

    test('should verify TOTP setup', async () => {
      await service.initiateTOTPSetup('user-123');
      const verified = await service.verifyTOTPSetup('user-123', '123456');

      expect(verified).toBe(true);
    });

    test('should track TOTP setup statistics', async () => {
      await service.initiateTOTPSetup('user-123');
      await service.verifyTOTPSetup('user-123', '123456');

      const stats = service.getStats();
      expect(stats.totalSetups).toBe(1);
      expect(stats.successfulSetups).toBe(1);
    });
  });

  // ============================================================
  // OTP Request and Verification Tests
  // ============================================================

  describe('OTP Request and Verification', () => {
    test('should request email OTP', async () => {
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      expect(challengeId).toBeDefined();
      expect(challengeId).toMatch(/^chg-/);
    });

    test('should request SMS OTP', async () => {
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'sms',
        destination: '+1234567890',
      });

      expect(challengeId).toBeDefined();
      expect(challengeId).toMatch(/^chg-/);
    });

    test('should generate unique challenge IDs', async () => {
      const id1 = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      const id2 = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      expect(id1).not.toBe(id2);
    });

    test('should verify valid OTP', async () => {
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      const result = await service.verifyOTP(challengeId, '123456');
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    test('should reject invalid OTP', async () => {
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      const result = await service.verifyOTP(challengeId, 'invalid');
      expect(result.success).toBe(false);
    });

    test('should reject non-existent challenge', async () => {
      const result = await service.verifyOTP('invalid-challenge', '123456');
      expect(result.success).toBe(false);
    });

    test('should track OTP verification statistics', async () => {
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      await service.verifyOTP(challengeId, '123456');
      const stats = service.getStats();

      expect(stats.totalVerifications).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // MFA Challenge Tests
  // ============================================================

  describe('MFA Challenge', () => {
    test('should create TOTP MFA challenge', async () => {
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      expect(challenge.challengeId).toBeDefined();
      expect(challenge.userId).toBe('user-123');
      expect(challenge.method).toBe('totp');
      expect(challenge.status).toBe('pending');
    });

    test('should create OTP MFA challenge', async () => {
      const challenge = await service.createMFAChallenge('user-123', 'email_otp');

      expect(challenge.method).toBe('email_otp');
    });

    test('should verify MFA challenge with valid code', async () => {
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      const result = await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: '123456',
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    test('should reject MFA challenge with invalid code', async () => {
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      const result = await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    test('should support rememberDevice option', async () => {
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      const result = await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: '123456',
        rememberDevice: true,
      });

      expect(result.rememberUntil).toBeDefined();
    });
  });

  // ============================================================
  // Backup Code Tests
  // ============================================================

  describe('Backup Codes', () => {
    test('should generate backup codes', async () => {
      const codes = await service.generateBackupCodes('user-123', 10);

      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      });
    });

    test('should generate default backup code count', async () => {
      const codes = await service.generateBackupCodes('user-123');

      expect(codes.length).toBe(config.backupCodeConfig.count);
    });

    test('should track backup codes generated', async () => {
      await service.generateBackupCodes('user-123', 10);

      const stats = service.getStats();
      expect(stats.backupCodesGenerated).toBe(1);
    });

    test('should get remaining backup codes count', async () => {
      const codes = await service.generateBackupCodes('user-123', 5);

      const remaining = await service.getBackupCodesCount('user-123');
      expect(remaining).toBe(5);
    });

    test('should use backup code in verification', async () => {
      const codes = await service.generateBackupCodes('user-123', 5);
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      const result = await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: codes[0],
      });

      expect(result.success).toBe(true);

      const remaining = await service.getBackupCodesCount('user-123');
      expect(remaining).toBe(4);
    });

    test('should track backup code usage', async () => {
      const codes = await service.generateBackupCodes('user-123', 5);
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: codes[0],
      });

      const stats = service.getStats();
      expect(stats.backupCodesUsed).toBe(1);
    });
  });

  // ============================================================
  // Trusted Device Tests
  // ============================================================

  describe('Trusted Devices', () => {
    test('should add trusted device', async () => {
      const device = await service.addTrustedDevice(
        'user-123',
        'My Laptop',
        'fingerprint-abc123',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(device.deviceId).toBeDefined();
      expect(device.userId).toBe('user-123');
      expect(device.deviceName).toBe('My Laptop');
      expect(device.fingerprint).toBe('fingerprint-abc123');
    });

    test('should get trusted devices', async () => {
      await service.addTrustedDevice(
        'user-123',
        'Device 1',
        'fingerprint-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      await service.addTrustedDevice(
        'user-123',
        'Device 2',
        'fingerprint-2',
        '192.168.1.2',
        'Mozilla/5.0'
      );

      const devices = await service.getTrustedDevices('user-123');
      expect(devices).toHaveLength(2);
    });

    test('should check if device is trusted', async () => {
      await service.addTrustedDevice(
        'user-123',
        'Device 1',
        'fingerprint-abc',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      const isTrusted = await service.isDeviceTrusted('user-123', 'fingerprint-abc');
      expect(isTrusted).toBe(true);

      const isNotTrusted = await service.isDeviceTrusted('user-123', 'fingerprint-xyz');
      expect(isNotTrusted).toBe(false);
    });

    test('should revoke trusted device', async () => {
      const device = await service.addTrustedDevice(
        'user-123',
        'Device 1',
        'fingerprint-abc',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      const revoked = await service.revokeTrustedDevice('user-123', device.deviceId);
      expect(revoked).toBe(true);

      const devices = await service.getTrustedDevices('user-123');
      expect(devices).toHaveLength(0);
    });

    test('should track device statistics', async () => {
      await service.addTrustedDevice(
        'user-123',
        'Device 1',
        'fingerprint-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      let stats = service.getStats();
      expect(stats.devicesAdded).toBe(1);

      const device = await service.addTrustedDevice(
        'user-123',
        'Device 2',
        'fingerprint-2',
        '192.168.1.2',
        'Mozilla/5.0'
      );

      await service.revokeTrustedDevice('user-123', device.deviceId);

      stats = service.getStats();
      expect(stats.devicesAdded).toBe(2);
      expect(stats.devicesRevoked).toBe(1);
    });

    test('should return only non-expired trusted devices', async () => {
      await service.addTrustedDevice(
        'user-123',
        'Device 1',
        'fingerprint-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      const devices = await service.getTrustedDevices('user-123');
      expect(devices.length).toBeGreaterThan(0);

      devices.forEach(device => {
        expect(device.expiresAt.getTime()).toBeGreaterThan(Date.now());
      });
    });
  });

  // ============================================================
  // MFA Settings Tests
  // ============================================================

  describe('MFA Settings', () => {
    test('should get user MFA settings', async () => {
      await service.initiateTOTPSetup('user-123');
      await service.verifyTOTPSetup('user-123', '123456');

      const settings = await service.getUserMFASettings('user-123');
      expect(settings).not.toBeNull();
      expect(settings?.userId).toBe('user-123');
      expect(settings?.methods.length).toBeGreaterThan(0);
    });

    test('should return null for non-existent user', async () => {
      const settings = await service.getUserMFASettings('non-existent');
      expect(settings).toBeNull();
    });

    test('should get recovery options', async () => {
      await service.generateBackupCodes('user-123', 5);

      const options = await service.getRecoveryOptions('user-123');
      expect(options.useBackupCode).toBe(true);
      expect(options.backupCodesRemaining).toBe(5);
    });

    test('should remove MFA method', async () => {
      await service.initiateTOTPSetup('user-123');
      await service.verifyTOTPSetup('user-123', '123456');

      const removed = await service.removeMFAMethod('user-123', 'totp');
      expect(removed).toBe(true);

      const settings = await service.getUserMFASettings('user-123');
      expect(settings?.methods.some(m => m.type === 'totp')).toBe(false);
    });

    test('should return false removing non-existent method', async () => {
      const removed = await service.removeMFAMethod('user-123', 'totp');
      expect(removed).toBe(false);
    });
  });

  // ============================================================
  // Event Listener Tests
  // ============================================================

  describe('Event Listeners', () => {
    test('should register and emit events', async () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);

      service.onMFA(listener);
      await service.initiateTOTPSetup('user-123');

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('setup_started');
    });

    test('should support multiple listeners', async () => {
      const events1: any[] = [];
      const events2: any[] = [];

      const listener1 = (event: any) => events1.push(event);
      const listener2 = (event: any) => events2.push(event);

      service.onMFA(listener1);
      service.onMFA(listener2);

      await service.initiateTOTPSetup('user-123');

      expect(events1.length).toBeGreaterThan(0);
      expect(events2.length).toBeGreaterThan(0);
    });

    test('should remove listener', async () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);

      service.onMFA(listener);
      service.offMFA(listener);

      await service.initiateTOTPSetup('user-123');

      expect(events.length).toBe(0);
    });

    test('should emit setup events', async () => {
      const events: any[] = [];
      service.onMFA((event: any) => events.push(event));

      await service.initiateTOTPSetup('user-123');
      await service.verifyTOTPSetup('user-123', '123456');

      const setupStarted = events.find(e => e.type === 'setup_started');
      const setupCompleted = events.find(e => e.type === 'setup_completed');

      expect(setupStarted).toBeDefined();
      expect(setupCompleted).toBeDefined();
    });

    test('should emit verification events', async () => {
      const events: any[] = [];
      service.onMFA((event: any) => events.push(event));

      const challenge = await service.createMFAChallenge('user-123', 'totp');
      await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: '123456',
      });

      const verified = events.find(e => e.type === 'verification_succeeded');
      expect(verified).toBeDefined();
    });

    test('should emit backup code events', async () => {
      const events: any[] = [];
      service.onMFA((event: any) => events.push(event));

      const codes = await service.generateBackupCodes('user-123', 5);
      const challenge = await service.createMFAChallenge('user-123', 'totp');

      await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: codes[0],
      });

      const codeUsed = events.find(e => e.type === 'backup_code_used');
      expect(codeUsed).toBeDefined();
    });

    test('should chain listener registration', () => {
      const listener = jest.fn();
      const result = service.onMFA(listener).onMFA(listener);

      expect(result).toBe(service);
    });
  });

  // ============================================================
  // Statistics Tests
  // ============================================================

  describe('Statistics', () => {
    test('should track TOTP setups', async () => {
      await service.initiateTOTPSetup('user-123');
      await service.verifyTOTPSetup('user-123', '123456');

      const stats = service.getStats();
      expect(stats.totalSetups).toBe(1);
      expect(stats.successfulSetups).toBe(1);
    });

    test('should track verification attempts', async () => {
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      await service.verifyOTP(challengeId, '123456');

      const stats = service.getStats();
      expect(stats.totalVerifications).toBeGreaterThan(0);
    });

    test('should track backup code generation', async () => {
      await service.generateBackupCodes('user-123', 10);

      const stats = service.getStats();
      expect(stats.backupCodesGenerated).toBe(1);
    });

    test('should track device management', async () => {
      await service.addTrustedDevice('user-123', 'Device 1', 'fp-1', '192.168.1.1', 'UA');
      const device = await service.addTrustedDevice('user-123', 'Device 2', 'fp-2', '192.168.1.2', 'UA');
      await service.revokeTrustedDevice('user-123', device.deviceId);

      const stats = service.getStats();
      expect(stats.devicesAdded).toBe(2);
      expect(stats.devicesRevoked).toBe(1);
    });

    test('should return immutable stats copy', () => {
      const stats1 = service.getStats();
      const stats2 = service.getStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration Scenarios', () => {
    test('should complete TOTP setup and verification flow', async () => {
      // Step 1: Initiate TOTP
      const setup = await service.initiateTOTPSetup('user-123');
      expect(setup.secret).toBeDefined();

      // Step 2: Verify TOTP
      const verified = await service.verifyTOTPSetup('user-123', '123456');
      expect(verified).toBe(true);

      // Step 3: Create challenge
      const challenge = await service.createMFAChallenge('user-123', 'totp');
      expect(challenge.status).toBe('pending');

      // Step 4: Verify challenge
      const result = await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: '123456',
      });
      expect(result.success).toBe(true);
    });

    test('should handle multi-method MFA', async () => {
      // Setup TOTP
      await service.initiateTOTPSetup('user-123');
      await service.verifyTOTPSetup('user-123', '123456');

      // Setup backup codes
      const codes = await service.generateBackupCodes('user-123', 5);
      expect(codes.length).toBe(5);

      // Get settings
      const settings = await service.getUserMFASettings('user-123');
      expect(settings?.methods.length).toBeGreaterThan(0);

      // Use backup code for verification
      const challenge = await service.createMFAChallenge('user-123', 'totp');
      const result = await service.verifyMFAChallenge(challenge.challengeId, {
        challengeId: challenge.challengeId,
        code: codes[0],
      });

      expect(result.success).toBe(true);
    });

    test('should manage trusted devices', async () => {
      // Add devices
      const device1 = await service.addTrustedDevice(
        'user-123',
        'Laptop',
        'fingerprint-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      const device2 = await service.addTrustedDevice(
        'user-123',
        'Mobile',
        'fingerprint-2',
        '192.168.1.2',
        'Mozilla/5.0'
      );

      // Check devices
      let devices = await service.getTrustedDevices('user-123');
      expect(devices.length).toBe(2);

      // Check trust status
      expect(await service.isDeviceTrusted('user-123', 'fingerprint-1')).toBe(true);

      // Revoke device
      await service.revokeTrustedDevice('user-123', device1.deviceId);

      devices = await service.getTrustedDevices('user-123');
      expect(devices.length).toBe(1);
      expect(devices[0].deviceName).toBe('Mobile');
    });

    test('should handle OTP and recovery options', async () => {
      // Generate backup codes
      const codes = await service.generateBackupCodes('user-123', 5);

      // Get recovery options
      const options = await service.getRecoveryOptions('user-123');
      expect(options.useBackupCode).toBe(true);
      expect(options.backupCodesRemaining).toBe(5);

      // Request OTP
      const challengeId = await service.requestOTP({
        userId: 'user-123',
        method: 'email',
        destination: 'user@example.com',
      });

      // Verify OTP
      const result = await service.verifyOTP(challengeId, '123456');
      expect(result.success).toBe(true);
    });
  });
});
