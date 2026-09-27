/**
 * MFA Service - Demonstration Scenarios
 * Shows practical usage of multi-factor authentication
 */

import { MFAService } from '../src/main';
import type { IMFAServiceConfig } from '../src/types';

/**
 * Initialize MFA Service
 */
function initializeMFAService(): MFAService {
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

  return new MFAService(config);
}

/**
 * SCENARIO 1: TOTP Setup
 * Demonstrates setting up and verifying TOTP authentication
 */
async function scenario1TOTPSetup(): Promise<void> {
  console.log('\n=== SCENARIO 1: TOTP Setup ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Step 1: Initiate TOTP setup
  console.log('Step 1: Initiating TOTP setup...');
  const setup = await mfa.initiateTOTPSetup(userId);
  console.log('TOTP Secret:', setup.secret);
  console.log('QR Code:', setup.qrCode.substring(0, 60) + '...');
  console.log('Manual Entry Key:', setup.manualEntryKey);
  console.log('Backup Codes Generated:', setup.backupCodes.length);

  // Step 2: User scans QR code and enters code
  console.log('\nStep 2: User scans QR code and enters 6-digit code...');

  // Step 3: Verify TOTP
  console.log('Step 3: Verifying TOTP code...');
  const verified = await mfa.verifyTOTPSetup(userId, '123456');
  console.log('TOTP Verification:', verified ? 'SUCCESS' : 'FAILED');
}

/**
 * SCENARIO 2: TOTP Authentication Challenge
 * Demonstrates logging in with TOTP verification
 */
async function scenario2TOTPLogin(): Promise<void> {
  console.log('\n=== SCENARIO 2: TOTP Login ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Setup TOTP first
  await mfa.initiateTOTPSetup(userId);
  await mfa.verifyTOTPSetup(userId, '123456');

  // Step 1: Create MFA challenge during login
  console.log('Step 1: User enters credentials...');
  console.log('Step 2: Creating MFA challenge...');
  const challenge = await mfa.createMFAChallenge(userId, 'totp');
  console.log('Challenge ID:', challenge.challengeId);
  console.log('Method:', challenge.method);
  console.log('Status:', challenge.status);

  // Step 2: User enters TOTP code
  console.log('\nStep 3: User enters TOTP code from authenticator...');

  // Step 3: Verify challenge
  console.log('Step 4: Verifying MFA challenge...');
  const result = await mfa.verifyMFAChallenge(challenge.challengeId, {
    challengeId: challenge.challengeId,
    code: '123456',
  });
  console.log('Verification Result:', result.success ? 'SUCCESS' : 'FAILED');
  console.log('User ID:', result.userId);
}

/**
 * SCENARIO 3: Email OTP
 * Demonstrates email-based one-time password authentication
 */
async function scenario3EmailOTP(): Promise<void> {
  console.log('\n=== SCENARIO 3: Email OTP ===');

  const mfa = initializeMFAService();

  // Step 1: Request email OTP
  console.log('Step 1: Requesting email OTP...');
  const challengeId = await mfa.requestOTP({
    userId: 'user-123',
    method: 'email',
    destination: 'user@example.com',
  });
  console.log('Challenge ID:', challengeId);
  console.log('Email sent to: user@example.com');

  // Step 2: User receives email and enters code
  console.log('\nStep 2: User enters OTP code from email...');
  console.log('(Simulating user waiting for email)');

  // Step 3: Verify OTP
  console.log('\nStep 3: Verifying OTP code...');
  const result = await mfa.verifyOTP(challengeId, '123456');
  console.log('OTP Verification:', result.success ? 'SUCCESS' : 'FAILED');
}

/**
 * SCENARIO 4: SMS OTP
 * Demonstrates SMS-based one-time password authentication
 */
async function scenario4SMSOTP(): Promise<void> {
  console.log('\n=== SCENARIO 4: SMS OTP ===');

  const mfa = initializeMFAService();

  // Step 1: Request SMS OTP
  console.log('Step 1: Requesting SMS OTP...');
  const challengeId = await mfa.requestOTP({
    userId: 'user-123',
    method: 'sms',
    destination: '+1234567890',
  });
  console.log('Challenge ID:', challengeId);
  console.log('SMS sent to: +1234567890');

  // Step 2: User receives SMS and enters code
  console.log('\nStep 2: User enters OTP code from SMS...');

  // Step 3: Verify OTP
  console.log('\nStep 3: Verifying OTP code...');
  const result = await mfa.verifyOTP(challengeId, '123456');
  console.log('SMS Verification:', result.success ? 'SUCCESS' : 'FAILED');
}

/**
 * SCENARIO 5: Backup Codes
 * Demonstrates backup code generation and usage
 */
async function scenario5BackupCodes(): Promise<void> {
  console.log('\n=== SCENARIO 5: Backup Codes ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Step 1: Generate backup codes
  console.log('Step 1: Generating backup codes...');
  const codes = await mfa.generateBackupCodes(userId, 10);
  console.log('Backup Codes Generated:');
  codes.forEach((code, index) => {
    console.log(`  ${index + 1}. ${code}`);
  });

  // Step 2: Get remaining codes
  console.log('\nStep 2: Checking remaining backup codes...');
  const remaining = await mfa.getBackupCodesCount(userId);
  console.log('Remaining Codes:', remaining);

  // Step 3: Use a backup code
  console.log('\nStep 3: User uses backup code for login...');
  const challenge = await mfa.createMFAChallenge(userId, 'totp');
  const result = await mfa.verifyMFAChallenge(challenge.challengeId, {
    challengeId: challenge.challengeId,
    code: codes[0],
  });
  console.log('Backup Code Verification:', result.success ? 'SUCCESS' : 'FAILED');

  // Step 4: Check remaining after use
  console.log('\nStep 4: Remaining codes after use...');
  const remaining2 = await mfa.getBackupCodesCount(userId);
  console.log('Remaining Codes:', remaining2);
}

/**
 * SCENARIO 6: Trusted Devices
 * Demonstrates device trust and MFA bypass
 */
async function scenario6TrustedDevices(): Promise<void> {
  console.log('\n=== SCENARIO 6: Trusted Devices ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Step 1: Add trusted device
  console.log('Step 1: Adding trusted device...');
  const device = await mfa.addTrustedDevice(
    userId,
    'MacBook Pro',
    'device-fingerprint-abc123',
    '192.168.1.100',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  );
  console.log('Device ID:', device.deviceId);
  console.log('Device Name:', device.deviceName);
  console.log('Trusted Until:', device.expiresAt);

  // Step 2: Check trusted devices
  console.log('\nStep 2: Listing trusted devices...');
  const devices = await mfa.getTrustedDevices(userId);
  devices.forEach((d, index) => {
    console.log(`  ${index + 1}. ${d.deviceName} (${d.deviceId})`);
  });

  // Step 3: Check if device is trusted
  console.log('\nStep 3: Checking device trust status...');
  const isTrusted = await mfa.isDeviceTrusted(userId, 'device-fingerprint-abc123');
  console.log('Device Trusted:', isTrusted);

  // Step 4: Revoke device
  console.log('\nStep 4: Revoking device...');
  const revoked = await mfa.revokeTrustedDevice(userId, device.deviceId);
  console.log('Device Revoked:', revoked);

  const remaining = await mfa.getTrustedDevices(userId);
  console.log('Remaining Trusted Devices:', remaining.length);
}

/**
 * SCENARIO 7: Recovery Options
 * Demonstrates recovery methods for locked accounts
 */
async function scenario7RecoveryOptions(): Promise<void> {
  console.log('\n=== SCENARIO 7: Recovery Options ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Setup multiple MFA methods
  console.log('Step 1: Setting up multiple MFA methods...');
  const backupCodes = await mfa.generateBackupCodes(userId, 10);

  // Get recovery options
  console.log('\nStep 2: Getting recovery options...');
  const options = await mfa.getRecoveryOptions(userId);
  console.log('Recovery Options:');
  console.log('  Use Backup Code:', options.useBackupCode);
  console.log('  Use Recovery Email:', options.useRecoveryEmail);
  console.log('  Use Recovery Phone:', options.useRecoveryPhone);
  console.log('  Backup Codes Remaining:', options.backupCodesRemaining);

  // Demonstrate using backup code for recovery
  console.log('\nStep 3: Using backup code for recovery...');
  if (options.useBackupCode) {
    const challenge = await mfa.createMFAChallenge(userId, 'totp');
    const result = await mfa.verifyMFAChallenge(challenge.challengeId, {
      challengeId: challenge.challengeId,
      code: backupCodes[0],
    });
    console.log('Account Recovered:', result.success ? 'SUCCESS' : 'FAILED');
  }
}

/**
 * SCENARIO 8: MFA Settings Management
 * Demonstrates retrieving and managing MFA settings
 */
async function scenario8MFASettings(): Promise<void> {
  console.log('\n=== SCENARIO 8: MFA Settings Management ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Setup TOTP
  console.log('Step 1: Setting up TOTP...');
  await mfa.initiateTOTPSetup(userId);
  await mfa.verifyTOTPSetup(userId, '123456');

  // Get MFA settings
  console.log('\nStep 2: Retrieving MFA settings...');
  const settings = await mfa.getUserMFASettings(userId);
  if (settings) {
    console.log('User ID:', settings.userId);
    console.log('MFA Required:', settings.isRequired);
    console.log('Enabled Methods:');
    settings.methods.forEach((method, index) => {
      console.log(`  ${index + 1}. ${method.type} - Enabled: ${method.enabled}`);
    });
  }

  // Remove TOTP
  console.log('\nStep 3: Removing TOTP method...');
  const removed = await mfa.removeMFAMethod(userId, 'totp');
  console.log('TOTP Removed:', removed);

  // Get updated settings
  console.log('\nStep 4: Updated MFA settings...');
  const updatedSettings = await mfa.getUserMFASettings(userId);
  console.log('Remaining Methods:', updatedSettings?.methods.length || 0);
}

/**
 * SCENARIO 9: Event Monitoring
 * Demonstrates monitoring MFA events
 */
async function scenario9EventMonitoring(): Promise<void> {
  console.log('\n=== SCENARIO 9: Event Monitoring ===');

  const mfa = initializeMFAService();
  const events: any[] = [];

  // Setup event listener
  console.log('Step 1: Setting up event listener...');
  mfa.onMFA((event) => {
    events.push(event);
    console.log(`Event: ${event.type} - User: ${event.userId}`);
  });

  // Trigger various events
  console.log('\nStep 2: Triggering MFA operations...');
  const userId = 'user-123';

  await mfa.initiateTOTPSetup(userId);
  await mfa.verifyTOTPSetup(userId, '123456');
  const challenge = await mfa.createMFAChallenge(userId, 'totp');
  await mfa.verifyMFAChallenge(challenge.challengeId, {
    challengeId: challenge.challengeId,
    code: '123456',
  });

  // Summary
  console.log('\nStep 3: Event Summary...');
  console.log('Total Events:', events.length);
  const eventTypes = new Set(events.map(e => e.type));
  console.log('Event Types:', Array.from(eventTypes).join(', '));
}

/**
 * SCENARIO 10: Statistics Tracking
 * Demonstrates MFA statistics and monitoring
 */
async function scenario10Statistics(): Promise<void> {
  console.log('\n=== SCENARIO 10: Statistics Tracking ===');

  const mfa = initializeMFAService();

  // Perform various operations
  console.log('Step 1: Performing MFA operations...');
  await mfa.initiateTOTPSetup('user-123');
  await mfa.verifyTOTPSetup('user-123', '123456');
  await mfa.generateBackupCodes('user-123', 10);
  await mfa.addTrustedDevice('user-123', 'Device 1', 'fp-1', '192.168.1.1', 'UA');

  // Get statistics
  console.log('\nStep 2: MFA Statistics...');
  const stats = mfa.getStats();
  console.log('Statistics:');
  console.log('  Total Setups:', stats.totalSetups);
  console.log('  Successful Setups:', stats.successfulSetups);
  console.log('  Total Verifications:', stats.totalVerifications);
  console.log('  Successful Verifications:', stats.successfulVerifications);
  console.log('  Backup Codes Generated:', stats.backupCodesGenerated);
  console.log('  Devices Added:', stats.devicesAdded);
  console.log('  Errors:', stats.errors);
}

/**
 * SCENARIO 11: Complete Authentication Flow
 * Demonstrates end-to-end MFA authentication
 */
async function scenario11CompleteFlow(): Promise<void> {
  console.log('\n=== SCENARIO 11: Complete Authentication Flow ===');

  const mfa = initializeMFAService();
  const userId = 'john.doe@example.com';

  // Step 1: Initial MFA Setup
  console.log('Step 1: User enables MFA...');
  const setup = await mfa.initiateTOTPSetup(userId);
  console.log('TOTP setup initiated');
  const codes = await mfa.generateBackupCodes(userId, 10);
  console.log('Backup codes generated:', codes.length);

  console.log('\nStep 2: User verifies TOTP...');
  await mfa.verifyTOTPSetup(userId, '123456');
  console.log('TOTP verified');

  // Step 2: Subsequent Login
  console.log('\nStep 3: User logs in later...');
  console.log('Username/password verified');

  console.log('\nStep 4: MFA challenge created...');
  const challenge = await mfa.createMFAChallenge(userId, 'totp');
  console.log('Challenge ID:', challenge.challengeId);

  console.log('\nStep 5: User enters TOTP code...');
  const result = await mfa.verifyMFAChallenge(challenge.challengeId, {
    challengeId: challenge.challengeId,
    code: '123456',
    rememberDevice: true,
  });

  console.log('Login successful:', result.success);
  if (result.rememberUntil) {
    console.log('Device remembered until:', result.rememberUntil);
  }

  // Step 3: Next login with remembered device
  console.log('\nStep 6: User logs in from remembered device...');
  const isDeviceTrusted = await mfa.isDeviceTrusted(userId, 'device-fingerprint');
  console.log('Device trusted (would skip MFA):', isDeviceTrusted);
}

/**
 * SCENARIO 12: Error Recovery
 * Demonstrates error handling and recovery
 */
async function scenario12ErrorRecovery(): Promise<void> {
  console.log('\n=== SCENARIO 12: Error Recovery ===');

  const mfa = initializeMFAService();
  const userId = 'user-123';

  // Setup TOTP
  await mfa.initiateTOTPSetup(userId);
  await mfa.verifyTOTPSetup(userId, '123456');

  // Step 1: Invalid challenge
  console.log('Step 1: Attempting to verify non-existent challenge...');
  const result = await mfa.verifyMFAChallenge('invalid-challenge', {
    challengeId: 'invalid-challenge',
    code: '123456',
  });
  console.log('Result:', result.success ? 'SUCCESS' : 'FAILED');
  console.log('Error:', result.error);

  // Step 2: Use recovery codes
  console.log('\nStep 2: Using backup codes for recovery...');
  const codes = await mfa.generateBackupCodes(userId, 5);
  const challenge = await mfa.createMFAChallenge(userId, 'totp');

  const recoveryResult = await mfa.verifyMFAChallenge(challenge.challengeId, {
    challengeId: challenge.challengeId,
    code: codes[0],
  });
  console.log('Recovery Result:', recoveryResult.success ? 'SUCCESS' : 'FAILED');

  // Step 3: Check remaining backup codes
  console.log('\nStep 3: Backup codes status...');
  const remaining = await mfa.getBackupCodesCount(userId);
  console.log('Backup Codes Remaining:', remaining);
}

/**
 * Run all demo scenarios
 */
async function runAllScenarios(): Promise<void> {
  try {
    await scenario1TOTPSetup();
    await scenario2TOTPLogin();
    await scenario3EmailOTP();
    await scenario4SMSOTP();
    await scenario5BackupCodes();
    await scenario6TrustedDevices();
    await scenario7RecoveryOptions();
    await scenario8MFASettings();
    await scenario9EventMonitoring();
    await scenario10Statistics();
    await scenario11CompleteFlow();
    await scenario12ErrorRecovery();

    console.log('\n=== ALL SCENARIOS COMPLETED ===\n');
  } catch (error) {
    console.error('Error running scenarios:', error);
  }
}

// Export scenarios for individual testing
export {
  scenario1TOTPSetup,
  scenario2TOTPLogin,
  scenario3EmailOTP,
  scenario4SMSOTP,
  scenario5BackupCodes,
  scenario6TrustedDevices,
  scenario7RecoveryOptions,
  scenario8MFASettings,
  scenario9EventMonitoring,
  scenario10Statistics,
  scenario11CompleteFlow,
  scenario12ErrorRecovery,
  runAllScenarios,
};

// Run all scenarios if executed directly
if (require.main === module) {
  runAllScenarios().catch(console.error);
}
