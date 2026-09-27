/**
 * JWT Service - Demo/Prototype
 * Demonstrates token generation, validation, refresh, and management
 */

import { createJWTService } from '../src/main';
import type { IJWTConfig, ITokenPayload } from '../src/types';

console.log('=== JWT Service - Demonstration ===\n');

// ============================================================
// 1. Configuration
// ============================================================
console.log('1. JWT Configuration');
console.log('--------------------');

const config: IJWTConfig = {
  secretKey: process.env.JWT_SECRET || 'your-secret-key-keep-it-safe',
  algorithm: 'HS256',
  expiresIn: 3600,            // 1 hour
  refreshTokenExpiresIn: 86400, // 24 hours
  issuer: 'soc-detection-lab',
  audience: 'soc-users',
  clockTolerance: 60,          // 60 seconds
};

console.log('JWT Configuration:');
console.log(`  Algorithm: ${config.algorithm}`);
console.log(`  Access token expiry: ${config.expiresIn}s (${config.expiresIn / 3600}h)`);
console.log(`  Refresh token expiry: ${config.refreshTokenExpiresIn}s (${config.refreshTokenExpiresIn / 86400}d)`);
console.log(`  Issuer: ${config.issuer}`);
console.log(`  Audience: ${config.audience}`);
console.log();

// ============================================================
// 2. Service Creation
// ============================================================
console.log('2. Service Creation');
console.log('-------------------');

const service = createJWTService(config);
console.log('✓ JWT service created');
console.log();

// ============================================================
// 3. Token Generation
// ============================================================
console.log('3. Token Generation');
console.log('-------------------');

const generateExample = `
// Generate token with user information
const payload = {
  userId: 'user-456',
  email: 'user@example.com',
  username: 'johndoe',
  roles: ['user', 'analyst'],
  permissions: ['read_cases', 'read_alerts'],
};

const token = await service.generateToken(payload, {
  expiresIn: 3600,              // Override default 1 hour
  includeRefreshToken: true,    // Include refresh token
});

console.log('Access Token:', token.accessToken);
console.log('Refresh Token:', token.refreshToken);
console.log('Expires In:', token.expiresIn, 'seconds');
console.log('Token Type:', token.tokenType);

// Result:
// {
//   accessToken: "eyJhbGc...",
//   refreshToken: "eyJhbGc...",
//   tokenType: "Bearer",
//   expiresIn: 3600,
//   issuedAt: 2024-01-15T10:30:00Z,
//   expiresAt: 2024-01-15T11:30:00Z
// }
`;

console.log(generateExample);
console.log();

// ============================================================
// 4. Token Validation
// ============================================================
console.log('4. Token Validation');
console.log('-------------------');

const validateExample = `
// Validate token
const result = await service.validateToken(token.accessToken);

if (result.valid) {
  console.log('✓ Token is valid');
  console.log('User ID:', result.payload?.userId);
  console.log('Roles:', result.payload?.roles);
  console.log('Permissions:', result.payload?.permissions);
} else {
  console.log('✗ Token is invalid');
  console.log('Error:', result.error);
  
  if (result.expired) {
    console.log('Token has expired - use refresh token');
  }
  if (result.invalidSignature) {
    console.log('Invalid signature - possible tampering');
  }
}

// Validation checks:
// - Signature verification
// - Expiration check
// - Revocation list
// - Format validation
`;

console.log(validateExample);
console.log();

// ============================================================
// 5. Token Refresh
// ============================================================
console.log('5. Token Refresh');
console.log('----------------');

const refreshExample = `
// Refresh expired token
const refreshResult = await service.refreshToken(token.refreshToken);

console.log('New Access Token:', refreshResult.accessToken);
console.log('New Refresh Token:', refreshResult.refreshToken);
console.log('Expires In:', refreshResult.expiresIn, 'seconds');

// Refresh flow:
// 1. Client sends refresh token to server
// 2. Server validates refresh token
// 3. Server generates new access token
// 4. Optionally generates new refresh token (refresh rotation)
// 5. Return new tokens to client
// 6. Client uses new access token for subsequent requests
`;

console.log(refreshExample);
console.log();

// ============================================================
// 6. Get Token Payload
// ============================================================
console.log('6. Get Token Payload');
console.log('--------------------');

const payloadExample = `
// Extract payload without validation
const payload = await service.getPayload(token.accessToken);

if (payload) {
  console.log('User ID:', payload.userId);
  console.log('Email:', payload.email);
  console.log('Roles:', payload.roles);
  console.log('Permissions:', payload.permissions);
} else {
  console.log('Failed to retrieve payload');
}

// Use cases:
// - Display user info in UI
// - Check permissions for UI features
// - Log user activity
// - Populate request context
`;

console.log(payloadExample);
console.log();

// ============================================================
// 7. Token Revocation
// ============================================================
console.log('7. Token Revocation');
console.log('-------------------');

const revocationExample = `
// Revoke token (logout, password change, etc.)
await service.revokeToken(token.accessToken, 'User logout');

// Now validation fails
const result = await service.validateToken(token.accessToken);
// result.valid = false
// result.error = 'Token has been revoked'

// Revocation use cases:
// - Logout - revoke all tokens
// - Password change - invalidate old tokens
// - Account compromise - emergency revoke
// - Session expiration - server-side revocation
// - Permission changes - force re-auth with new permissions

// Check revoked token count
const revokedCount = service.getRevokedTokensCount();
console.log(\`Revoked tokens: \${revokedCount}\`);
`;

console.log(revocationExample);
console.log();

// ============================================================
// 8. Token Expiration Check
// ============================================================
console.log('8. Token Expiration Check');
console.log('-------------------------');

const expirationExample = `
// Check if token is expired
const isExpired = service.isTokenExpired(token.accessToken);

if (isExpired) {
  console.log('Token is expired - need to refresh');
} else {
  console.log('Token is still valid');
}

// Usage in middleware:
app.use((req, res, next) => {
  const token = extractTokenFromHeader(req);
  
  if (service.isTokenExpired(token)) {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  next();
});
`;

console.log(expirationExample);
console.log();

// ============================================================
// 9. Batch Token Generation
// ============================================================
console.log('9. Batch Token Generation');
console.log('-------------------------');

const batchExample = `
// Generate multiple tokens at once
const userTokens = await service.batchGenerateTokens([
  { userId: 'user-1', customClaims: { department: 'SOC' } },
  { userId: 'user-2', customClaims: { department: 'IR' } },
  { userId: 'user-3', customClaims: { department: 'Compliance' } },
]);

// Result:
// [
//   { userId: 'user-1', token: {...} },
//   { userId: 'user-2', token: {...} },
//   { userId: 'user-3', token: {...} },
// ]

// Use cases:
// - Bulk user onboarding
// - API key generation
// - Service account provisioning
// - Test data setup
`;

console.log(batchExample);
console.log();

// ============================================================
// 10. Event Monitoring
// ============================================================
console.log('10. Event Monitoring');
console.log('--------------------');

const eventExample = `
// Register listener for token events
service.onTokenEvent((event) => {
  console.log(\`[\${event.timestamp.toISOString()}] \${event.type}\`);
  
  switch (event.type) {
    case 'generated':
      console.log('  New token issued');
      break;
    case 'validated':
      console.log('  Token validated');
      break;
    case 'refreshed':
      console.log('  Token refreshed');
      break;
    case 'revoked':
      console.log('  Token revoked:', event.details?.reason);
      break;
    case 'invalid':
      console.log('  Invalid token attempt');
      break;
  }
});

// Event types:
// - generated: Token created
// - validated: Token verified successfully
// - refreshed: New token issued from refresh
// - revoked: Token added to revocation list
// - invalid: Token validation failed
`;

console.log(eventExample);
console.log();

// ============================================================
// 11. Statistics & Monitoring
// ============================================================
console.log('11. Statistics & Monitoring');
console.log('---------------------------');

const statsExample = `
// Get token service statistics
const stats = service.getStats();

console.log('Token Statistics:');
console.log(\`  Generated: \${stats.totalGenerated}\`);
console.log(\`  Validated: \${stats.totalValidated}\`);
console.log(\`  Refreshed: \${stats.totalRefreshed}\`);
console.log(\`  Revoked: \${stats.revokedCount}\`);
console.log(\`  Invalid: \${stats.invalidTokens}\`);

// Calculate metrics
const validation_success_rate = (stats.totalValidated / (stats.totalValidated + stats.invalidTokens)) * 100;
console.log(\`Validation success rate: \${validation_success_rate.toFixed(2)}%\`);

// Reset statistics for a new period
service.resetStats();
`;

console.log(statsExample);
console.log();

// ============================================================
// 12. Real-World Patterns
// ============================================================
console.log('12. Real-World Patterns');
console.log('----------------------');

const patternsExample = `
// Pattern 1: Authentication Middleware
function authMiddleware(req, res, next) {
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  service.validateToken(token).then(result => {
    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }
    
    req.user = result.payload;
    next();
  });
}

// Pattern 2: Token Refresh Endpoint
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const result = await service.refreshToken(refreshToken);
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Pattern 3: Logout with Revocation
app.post('/auth/logout', (req, res) => {
  const token = extractTokenFromHeader(req);
  service.revokeToken(token, 'User logout');
  res.json({ success: true });
});

// Pattern 4: Token Claims for Authorization
app.get('/api/cases', authMiddleware, (req, res) => {
  const userPerms = req.user.permissions || [];
  
  if (!userPerms.includes('read_cases')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Process request
  res.json({ cases: [...] });
});
`;

console.log(patternsExample);
console.log();

// ============================================================
// 13. Security Best Practices
// ============================================================
console.log('13. Security Best Practices');
console.log('---------------------------');

const securityExample = `
// Best Practices:

1. Secret Key Management
   - Store in environment variables
   - Rotate periodically
   - Use strong random generation
   - Separate keys for different environments

2. Token Expiration
   - Short expiration for access tokens (15-60 min)
   - Longer expiration for refresh tokens (7-30 days)
   - Use refresh rotation for better security

3. Token Transport
   - Always use HTTPS/TLS
   - Send tokens in Authorization header
   - Never expose in URL or logs
   - Use secure cookies if in browser

4. Token Validation
   - Always validate signature
   - Check expiration
   - Verify claims match expected values
   - Maintain revocation list

5. Revocation & Logout
   - Revoke tokens on logout
   - Revoke on password change
   - Revoke on permission changes
   - Emergency revocation for compromised accounts

6. Monitoring
   - Track invalid token attempts
   - Alert on suspicious patterns
   - Monitor refresh rate
   - Track revocation reasons
`;

console.log(securityExample);
console.log();

// ============================================================
// 14. Feature Summary
// ============================================================
console.log('14. Feature Summary');
console.log('-------------------');

const features = {
  'Token Generation': ['Create tokens', 'Custom claims', 'Refresh tokens', 'Custom expiry'],
  'Token Validation': ['Signature verification', 'Expiration check', 'Revocation check', 'Format validation'],
  'Token Refresh': ['Generate new tokens', 'Refresh rotation', 'Token rotation'],
  'Token Revocation': ['Revoke on logout', 'Revocation list', 'Auto-cleanup'],
  'Payload Operations': ['Extract claims', 'Verify claims', 'Custom claims'],
  'Batch Operations': ['Generate multiple', 'Bulk operations'],
  'Monitoring': ['Statistics', 'Event listeners', 'Performance tracking'],
};

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}:`);
  items.forEach((item) => console.log(`  • ${item}`));
});

console.log('\n=== Demo Complete ===');
console.log('\nJWT Service provides secure token management for:');
console.log('- User authentication');
console.log('- API authorization');
console.log('- Session management');
console.log('- Cross-service communication');
console.log('- Stateless authentication');

const stats = service.getStats();
console.log(`\nService Statistics:`);
console.log(`  Tokens generated: ${stats.totalGenerated}`);
console.log(`  Tokens validated: ${stats.totalValidated}`);
console.log(`  Tokens revoked: ${stats.revokedCount}`);
