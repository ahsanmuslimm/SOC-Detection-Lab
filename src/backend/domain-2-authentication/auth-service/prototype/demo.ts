/**
 * Auth Service - Demo/Prototype
 * Demonstrates user authentication, session management, and credential handling
 */

import { createAuthService } from '../src/main';
import type { IAuthServiceConfig } from '../src/types';

console.log('=== Auth Service - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. Auth Service Configuration');
console.log('-----------------------------');

const config: IAuthServiceConfig = {
  jwtService: {} as any, // Would be real JWT service
  database: {} as any,   // Would be real database connection
  passwordHashAlgorithm: 'bcrypt',
  sessionTimeout: 3600,
  refreshTokenRotation: true,
  enableMFA: false,
  lockout: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    resetAttemptsAfterMinutes: 60,
  },
};

console.log('Account Lockout Configuration:');
console.log(`  Max failed attempts: ${config.lockout.maxFailedAttempts}`);
console.log(`  Lockout duration: ${config.lockout.lockoutDurationMinutes} minutes`);
console.log(`  Reset attempts after: ${config.lockout.resetAttemptsAfterMinutes} minutes`);
console.log();

// ============================================================
// 2. User Login
// ============================================================
console.log('2. User Login');
console.log('-------------');

const loginExample = `
// Login with username and password
const loginResult = await authService.login({
  username: 'john.doe',
  password: 'SecurePassword123!',
  rememberMe: true,
});

if (loginResult.success) {
  console.log('Login successful');
  console.log('Access Token:', loginResult.token);
  console.log('User:', loginResult.user);
  
  // Response includes:
  // {
  //   success: true,
  //   user: {
  //     userId: 'user-123',
  //     username: 'john.doe',
  //     email: 'john@example.com',
  //     roles: ['analyst', 'user'],
  //     permissions: ['read_cases', 'read_alerts'],
  //     isActive: true,
  //     isMFAEnabled: false
  //   },
  //   token: 'eyJhbGc...'
  // }
} else {
  console.log('Login failed:', loginResult.error);
  
  if (loginResult.errorCode === 'ACCOUNT_LOCKED') {
    console.log('Account locked until:', loginResult.lockedUntil);
  } else if (loginResult.remainingAttempts !== undefined) {
    console.log('Remaining attempts:', loginResult.remainingAttempts);
  }
}
`;

console.log(loginExample);
console.log();

// ============================================================
// 3. User Logout
// ============================================================
console.log('3. User Logout');
console.log('--------------');

const logoutExample = `
// Logout - revoke token and invalidate session
const logoutSuccess = await authService.logout(accessToken, userId);

if (logoutSuccess) {
  console.log('Logout successful');
  // Token is revoked
  // Session is invalidated
  // User is no longer authenticated
} else {
  console.log('Logout failed');
}
`;

console.log(logoutExample);
console.log();

// ============================================================
// 4. Session Management
// ============================================================
console.log('4. Session Management');
console.log('---------------------');

const sessionExample = `
// Get current session
const session = await authService.getSession(accessToken);

if (session) {
  console.log('Session ID:', session.sessionId);
  console.log('Created at:', session.createdAt);
  console.log('Expires at:', session.expiresAt);
  console.log('Last activity:', session.lastActivityAt);
  console.log('Active:', session.isActive);
}

// Refresh session (get new token)
const refreshResult = await authService.refreshSession(refreshToken);

if (refreshResult) {
  console.log('Session refreshed');
  console.log('New access token:', refreshResult.accessToken);
  console.log('New refresh token:', refreshResult.refreshToken);
}

// Check if session is valid
const isValid = await authService.isSessionValid(accessToken);
if (isValid) {
  console.log('Session is active and valid');
} else {
  console.log('Session is expired or invalid');
}
`;

console.log(sessionExample);
console.log();

// ============================================================
// 5. Password Management
// ============================================================
console.log('5. Password Management');
console.log('----------------------');

const passwordExample = `
// Change password (requires current password)
const changeResult = await authService.changePassword({
  userId: 'user-123',
  currentPassword: 'OldPassword123!',
  newPassword: 'NewPassword456!',
});

if (changeResult) {
  console.log('Password changed successfully');
  // All existing sessions are invalidated
  // User must login again
}

// Request password reset (forgot password)
const resetRequested = await authService.requestPasswordReset({
  email: 'john@example.com',
});

if (resetRequested) {
  console.log('Password reset email sent');
  // Email contains reset token and link
}

// Reset password with token (from email link)
const resetSuccess = await authService.resetPassword(
  resetToken,
  'NewPassword789!'
);

if (resetSuccess) {
  console.log('Password reset successfully');
}
`;

console.log(passwordExample);
console.log();

// ============================================================
// 6. User Registration
// ============================================================
console.log('6. User Registration');
console.log('--------------------');

const registrationExample = `
// Register new user
const regResult = await authService.register({
  username: 'jane.smith',
  email: 'jane@example.com',
  password: 'StrongPass123!',
  firstName: 'Jane',
  lastName: 'Smith',
});

if (regResult.success) {
  console.log('User registered successfully');
  console.log('User ID:', regResult.userId);
  
  if (regResult.requiresEmailVerification) {
    console.log('Please verify your email');
    // Send verification email
  }
} else {
  console.log('Registration failed:', regResult.error);
  // Error might be: 'Email already registered'
}
`;

console.log(registrationExample);
console.log();

// ============================================================
// 7. Credential Validation
// ============================================================
console.log('7. Credential Validation');
console.log('------------------------');

const validationExample = `
// Validate credentials without logging in
const isValid = await authService.validateCredentials(
  'john.doe',
  'SecurePassword123!'
);

if (isValid) {
  console.log('Credentials are valid');
  // Can use for password verification flows
} else {
  console.log('Credentials are invalid');
}
`;

console.log(validationExample);
console.log();

// ============================================================
// 8. Event Monitoring
// ============================================================
console.log('8. Event Monitoring');
console.log('-------------------');

const eventExample = `
// Register listener for auth events
authService.onAuth((event) => {
  console.log(\`[\${event.timestamp.toISOString()}] \${event.type}\`);
  
  switch (event.type) {
    case 'login':
      console.log('User logged in', event.userId);
      break;
    case 'logout':
      console.log('User logged out', event.userId);
      break;
    case 'password_change':
      console.log('Password changed', event.userId);
      break;
    case 'failed_login':
      console.log('Failed login attempt for user:', event.details?.username);
      break;
  }
});

// Event types:
// - login: Successful user login
// - logout: User logout
// - password_change: Password changed or reset
// - mfa_enable: MFA enabled on account
// - mfa_disable: MFA disabled on account
// - failed_login: Failed login attempt
`;

console.log(eventExample);
console.log();

// ============================================================
// 9. Account Lockout
// ============================================================
console.log('9. Account Lockout & Security');
console.log('-----------------------------');

const securityExample = `
// Account lockout happens automatically
// After 5 failed login attempts, account is locked for 15 minutes

// Failed login attempt (wrong password)
const failResult = await authService.login({
  username: 'john.doe',
  password: 'WrongPassword',
});

if (!failResult.success) {
  console.log('Remaining attempts:', failResult.remainingAttempts);
  // remainingAttempts: 4 (5 max - 1 used)
}

// After max attempts
const lockedResult = await authService.login({
  username: 'john.doe',
  password: 'WrongPassword',
});

if (lockedResult.errorCode === 'ACCOUNT_LOCKED') {
  console.log('Account locked until:', lockedResult.lockedUntil);
  // User cannot login until lock expires or admin resets
}
`;

console.log(securityExample);
console.log();

// ============================================================
// 10. Statistics & Monitoring
// ============================================================
console.log('10. Statistics & Monitoring');
console.log('---------------------------');

const statsExample = `
// Get auth service statistics
const stats = authService.getStats();

console.log('Authentication Statistics:');
console.log(\`  Total logins: \${stats.totalLogins}\`);
console.log(\`  Total logouts: \${stats.totalLogouts}\`);
console.log(\`  Failed logins: \${stats.failedLogins}\`);
console.log(\`  Successful logins: \${stats.successfulLogins}\`);
console.log(\`  Success rate: \${(stats.successRate * 100).toFixed(2)}%\`);
console.log(\`  Password changes: \${stats.passwordChanges}\`);
console.log(\`  New registrations: \${stats.registrations}\`);
console.log(\`  Active sessions: \${stats.activeSessions}\`);

// Use for monitoring:
// - Alert if success rate drops below threshold
// - Track failed login trends
// - Monitor registration rates
// - Check active session count
`;

console.log(statsExample);
console.log();

// ============================================================
// 11. Real-World Patterns
// ============================================================
console.log('11. Real-World Patterns');
console.log('----------------------');

const patternsExample = `
// Pattern 1: Login Flow
async function handleLogin(username: string, password: string) {
  const result = await authService.login({ username, password });
  
  if (result.success) {
    // Store tokens in secure httpOnly cookies or localStorage
    setAuthCookie(result.token);
    // Redirect to dashboard
    navigate('/dashboard');
  } else if (result.errorCode === 'ACCOUNT_LOCKED') {
    // Show account locked message
    showError('Account locked. Try again in 15 minutes');
  } else {
    // Show login failed message
    showError('Invalid credentials');
  }
}

// Pattern 2: Auth Middleware
function authMiddleware(req, res, next) {
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  authService.getSession(token).then(session => {
    if (!session) {
      return res.status(401).json({ error: 'Session invalid' });
    }
    
    req.user = session;
    next();
  });
}

// Pattern 3: Password Reset Flow
async function handlePasswordReset(email: string) {
  const requested = await authService.requestPasswordReset({ email });
  if (requested) {
    showSuccess('Check your email for reset instructions');
  }
}

// Pattern 4: Session Refresh
async function refreshIfNeeded() {
  const isValid = await authService.isSessionValid(currentToken);
  
  if (!isValid) {
    const refreshed = await authService.refreshSession(refreshToken);
    if (refreshed) {
      updateTokens(refreshed.accessToken, refreshed.refreshToken);
    } else {
      logout();
    }
  }
}
`;

console.log(patternsExample);
console.log();

// ============================================================
// 12. Feature Summary
// ============================================================
console.log('12. Feature Summary');
console.log('-------------------');

const features = {
  'Authentication': ['Login', 'Logout', 'Credential validation', 'Session management'],
  'Password Management': ['Change password', 'Request reset', 'Reset password', 'Password policies'],
  'Registration': ['New user signup', 'Email verification', 'User roles/permissions'],
  'Session Management': ['Session creation', 'Session refresh', 'Session validation', 'Session expiration'],
  'Security': ['Account lockout', 'Failed attempt tracking', 'Password hashing', 'Token revocation'],
  'Monitoring': ['Login statistics', 'Session metrics', 'Event tracking', 'Audit logging'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log('\nAuth Service provides:');
console.log('- Secure user authentication');
console.log('- Session management');
console.log('- Password management');
console.log('- Account security (lockout, rate limiting)');
console.log('- Comprehensive audit logging');
console.log('- Real-time event monitoring');
