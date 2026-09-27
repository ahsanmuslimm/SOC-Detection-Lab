# OAuth Client Module

OAuth2 provider integration for federated authentication. Supports multiple OAuth providers (Google, GitHub, Microsoft, etc.) with account linking, token management, and comprehensive event monitoring.

## Overview

The OAuth Client module provides enterprise-grade OAuth2 client functionality with support for:

- **Multi-Provider Support**: Google, GitHub, Microsoft, and custom OAuth2 providers
- **Authorization Flow**: Secure state management, PKCE support
- **Token Management**: Access/refresh token handling and caching
- **Account Linking**: Link multiple OAuth accounts to users
- **Event Monitoring**: Track OAuth events and lifecycle
- **Statistics**: Comprehensive metrics and tracking

## Module Structure

```
oauth-client/
├── src/
│   ├── types.ts          # Type definitions (140+ lines)
│   ├── main.ts           # OAuthClient implementation (260+ lines)
│   └── index.ts          # Public API exports
├── __tests__/
│   └── unit/
│       └── oauth-client.test.ts  # Unit tests (600+ lines, 40+ test cases)
├── prototype/
│   └── demo.ts           # 12 demonstration scenarios
└── README.md             # This file

Total: 1,400+ lines of production code and tests
```

## Installation

```bash
npm install
```

## Quick Start

### Initialize OAuth Client

```typescript
import { createOAuthClient } from './src/main';

const client = createOAuthClient({
  providers: {
    google: {
      name: 'google',
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      redirectUri: 'http://localhost:3000/auth/google/callback',
      scopes: ['openid', 'email', 'profile'],
    },
  },
  stateTimeout: 600,
  tokenCacheTimeout: 3600,
  enablePKCE: true,
});
```

### Generate Authorization URL

```typescript
// Get authorization URL for user to click
const authUrl = await client.getAuthorizationUrl('google');
console.log(authUrl);

// User logs in at OAuth provider and gets redirected with authorization code
```

### Handle OAuth Callback

```typescript
// OAuth provider redirects user with code and state
const callback = {
  provider: 'google',
  code: 'AUTHORIZATION_CODE',
  state: 'STATE_FROM_URL',
};

const profile = await client.handleCallback(callback);
console.log(profile);
// {
//   id: 'google-user-123',
//   email: 'user@gmail.com',
//   name: 'John Doe',
//   provider: 'google',
//   rawProfile: { ... }
// }
```

### Link Account to User

```typescript
// Associate OAuth account with user
const linked = await client.linkAccount('user-123', 'google', profile);
console.log(linked); // true

// Get all linked accounts
const accounts = await client.getLinkedAccounts('user-123');
console.log(accounts);
// [
//   {
//     userId: 'user-123',
//     provider: 'google',
//     providerUserId: 'google-user-123',
//     email: 'user@gmail.com',
//     linkedAt: Date,
//     lastLogin: Date
//   }
// ]
```

## API Reference

### OAuthClient Class

#### Constructor

```typescript
new OAuthClient(config: IOAuthClientConfig)
```

**Parameters:**
- `config.providers` - Record of OAuth provider configurations
- `config.stateTimeout` - State expiration timeout in seconds (default: 600)
- `config.tokenCacheTimeout` - Token cache timeout in seconds (default: 3600)
- `config.enablePKCE` - Enable PKCE for enhanced security (default: false)

#### Methods

##### Authorization & Callback

```typescript
// Get authorization URL for provider
async getAuthorizationUrl(provider: string, redirectUri?: string): Promise<string>

// Handle OAuth callback and retrieve user profile
async handleCallback(callback: IOAuthCallback): Promise<IOAuthUserProfile | null>

// Exchange authorization code for token
async exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string
): Promise<IOAuthToken | null>

// Get user profile from provider
async getUserProfile(
  provider: string,
  token: IOAuthToken
): Promise<IOAuthUserProfile | null>
```

##### Account Linking

```typescript
// Link OAuth account to user
async linkAccount(
  userId: string,
  provider: string,
  profile: IOAuthUserProfile
): Promise<boolean>

// Unlink OAuth account from user
async unlinkAccount(userId: string, provider: string): Promise<boolean>

// Get all linked accounts for user
async getLinkedAccounts(userId: string): Promise<IAccountLink[]>

// Get specific linked account
async getLinkedAccount(userId: string, provider: string): Promise<IAccountLink | null>
```

##### Token Management

```typescript
// Refresh OAuth token
async refreshToken(
  provider: string,
  refreshToken: string
): Promise<IOAuthToken | null>
```

##### Events & Monitoring

```typescript
// Register event listener
onOAuth(listener: OAuthListener): this

// Remove event listener
offOAuth(listener: OAuthListener): this

// Get statistics
getStats(): IOAuthStats

// Get configured providers
getProviders(): string[]
```

### Type Definitions

#### IOAuthProvider

OAuth provider configuration.

```typescript
interface IOAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scopes: string[];
}
```

#### IOAuthCallback

OAuth provider callback data.

```typescript
interface IOAuthCallback {
  provider: string;
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}
```

#### IOAuthToken

OAuth token response.

```typescript
interface IOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope: string;
  rawResponse: Record<string, unknown>;
}
```

#### IOAuthUserProfile

OAuth user profile.

```typescript
interface IOAuthUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
  rawProfile: Record<string, unknown>;
}
```

#### IAccountLink

Linked OAuth account.

```typescript
interface IAccountLink {
  userId: string;
  provider: string;
  providerUserId: string;
  email: string;
  linkedAt: Date;
  lastLogin: Date;
}
```

#### IOAuthStats

Statistics tracking.

```typescript
interface IOAuthStats {
  totalAuthorizationRequests: number;
  successfulTokenExchanges: number;
  failedTokenExchanges: number;
  accountsLinked: number;
  accountsUnlinked: number;
  errors: number;
}
```

#### IOAuthEvent

OAuth event fired during operations.

```typescript
interface IOAuthEvent {
  type: 'authorization_started' | 'token_exchanged' | 'profile_retrieved' | 'account_linked' | 'account_unlinked' | 'error';
  timestamp: Date;
  provider: string;
  userId?: string;
  details?: Record<string, unknown>;
}
```

## Usage Examples

### Example 1: Single Provider OAuth (Google)

```typescript
import { createOAuthClient } from './src/main';

const client = createOAuthClient({
  providers: {
    google: {
      name: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      redirectUri: 'http://localhost:3000/auth/callback',
      scopes: ['openid', 'email', 'profile'],
    },
  },
  stateTimeout: 600,
  tokenCacheTimeout: 3600,
  enablePKCE: true,
});

// In your authentication route
app.get('/auth/login', async (req, res) => {
  const authUrl = await client.getAuthorizationUrl('google');
  res.redirect(authUrl);
});

// OAuth callback route
app.get('/auth/callback', async (req, res) => {
  const callback = {
    provider: 'google',
    code: req.query.code as string,
    state: req.query.state as string,
  };

  const profile = await client.handleCallback(callback);
  if (profile) {
    // Link to user and create session
    await client.linkAccount(userId, 'google', profile);
    // Set session/JWT and redirect
  }
});
```

### Example 2: Multi-Provider Authentication

```typescript
const client = createOAuthClient({
  providers: {
    google: { /* ... */ },
    github: { /* ... */ },
    microsoft: { /* ... */ },
  },
  stateTimeout: 600,
  tokenCacheTimeout: 3600,
  enablePKCE: true,
});

// Get all providers
const providers = client.getProviders(); // ['google', 'github', 'microsoft']

// User selects provider
app.get('/auth/:provider/login', async (req, res) => {
  try {
    const authUrl = await client.getAuthorizationUrl(req.params.provider);
    res.redirect(authUrl);
  } catch (error) {
    res.status(400).json({ error: 'Unknown provider' });
  }
});
```

### Example 3: Account Linking

```typescript
// Link additional OAuth account
async function linkNewProvider(userId: string, provider: string) {
  const authUrl = await client.getAuthorizationUrl(provider);
  // Redirect user to authorize
  
  // After callback:
  const profile = await client.handleCallback(callback);
  if (profile) {
    await client.linkAccount(userId, provider, profile);
  }
}

// Get all linked accounts
async function getUserOAuthAccounts(userId: string) {
  const accounts = await client.getLinkedAccounts(userId);
  return accounts.map(acc => ({
    provider: acc.provider,
    email: acc.email,
    linkedAt: acc.linkedAt,
  }));
}

// Unlink a provider
async function removeOAuthAccount(userId: string, provider: string) {
  const removed = await client.unlinkAccount(userId, provider);
  return removed;
}
```

### Example 4: Event Monitoring

```typescript
const events: any[] = [];

client.onOAuth((event) => {
  events.push(event);
  
  switch (event.type) {
    case 'authorization_started':
      console.log(`User starting OAuth with ${event.provider}`);
      break;
    case 'token_exchanged':
      console.log(`Token exchanged for ${event.provider}`);
      break;
    case 'profile_retrieved':
      console.log(`Profile retrieved for user ${event.userId}`);
      break;
    case 'account_linked':
      console.log(`Account linked for user ${event.userId}`);
      break;
    case 'error':
      console.error(`OAuth error with ${event.provider}`);
      break;
  }
});

// Later: Access event history
console.log(`Total OAuth events: ${events.length}`);
```

### Example 5: Statistics & Monitoring

```typescript
// Track usage
app.get('/admin/oauth-stats', (req, res) => {
  const stats = client.getStats();
  res.json({
    totalRequests: stats.totalAuthorizationRequests,
    successfulExchanges: stats.successfulTokenExchanges,
    failedExchanges: stats.failedTokenExchanges,
    accountsLinked: stats.accountsLinked,
    errors: stats.errors,
  });
});
```

## Testing

Run the comprehensive test suite:

```bash
# Run unit tests
npm test -- oauth-client.test.ts

# Run with coverage
npm test -- --coverage oauth-client.test.ts

# Run specific test suite
npm test -- --testNamePattern="Authorization URL Generation"
```

### Test Coverage

The module includes 40+ test cases covering:

- **Service Creation** (4 tests)
  - Instance creation
  - Factory function
  - Configuration validation

- **Provider Configuration** (3 tests)
  - Multiple providers
  - Provider listing

- **Authorization URL Generation** (7 tests)
  - URL structure
  - State parameter management
  - Custom redirect URIs
  - Error handling
  - Statistics tracking

- **OAuth Callback Handling** (5 tests)
  - Successful callbacks
  - State validation
  - Reuse protection
  - Error handling
  - Statistics tracking

- **Token Exchange** (5 tests)
  - Code exchange
  - Token caching
  - Error handling
  - Unique token generation

- **User Profile Retrieval** (3 tests)
  - Profile retrieval
  - Raw data preservation
  - Unique ID generation

- **Account Linking** (7 tests)
  - Account linking
  - Multiple provider support
  - Account retrieval
  - Statistics tracking

- **Account Unlinking** (4 tests)
  - Account unlinking
  - Other accounts preservation
  - Statistics tracking

- **Token Refresh** (3 tests)
  - Token refresh
  - New token generation
  - Error handling

- **Event Listeners** (4 tests)
  - Event registration
  - Multiple listeners
  - Listener removal
  - Event types

- **Statistics** (6 tests)
  - Request tracking
  - Exchange tracking
  - Account tracking
  - Error tracking
  - Statistics isolation

- **Integration Scenarios** (3 tests)
  - Complete OAuth flow
  - Multi-provider workflow
  - User lifecycle

**Coverage Target**: 85%+

## Demonstration

Run the demo scenarios:

```bash
npm run demo -- oauth-client
```

Or execute directly:

```bash
npx ts-node prototype/demo.ts
```

The demo includes 12 scenarios:

1. **Basic Google OAuth Flow** - Single provider OAuth workflow
2. **Multi-Provider OAuth** - Supporting multiple providers
3. **Account Linking** - Linking OAuth accounts to users
4. **Retrieving Linked Accounts** - Fetching linked accounts
5. **Account Unlinking** - Removing linked accounts
6. **Token Refresh** - Refreshing expired tokens
7. **Event Listeners** - Monitoring OAuth events
8. **Error Handling** - Handling OAuth errors
9. **Statistics Tracking** - Monitoring OAuth metrics
10. **Complete Auth Flow** - End-to-end authentication
11. **Provider Configuration** - Managing providers
12. **Chaining Operations** - Method chaining patterns

## Key Features

### Security

- State parameter validation for CSRF protection
- State timeout to prevent replay attacks
- State reuse detection
- PKCE support for mobile/SPA applications
- Token caching with configurable TTL
- Error handling and logging

### Scalability

- Efficient in-memory state management
- Token caching for performance
- Batch operations support
- Event-driven architecture
- Configurable timeouts

### Monitoring & Debugging

- Comprehensive event system
- Statistics tracking
- Error tracking
- Event listener support
- Audit trail capability

### Developer Experience

- TypeScript strict mode
- Comprehensive error messages
- Method chaining support
- Type-safe interfaces
- Extensive documentation

## Integration Points

### Auth Service Integration

The OAuth Client integrates with Auth Service for:

```typescript
// After OAuth profile retrieval
const profile = await oauthClient.handleCallback(callback);

// Link to auth service
const user = await authService.registerUser({
  email: profile.email,
  name: profile.name,
  externalId: profile.id,
});

// Store account link
await oauthClient.linkAccount(user.id, profile.provider, profile);
```

### JWT Service Integration

Tokens from OAuth can be exchanged for JWT:

```typescript
const profile = await oauthClient.handleCallback(callback);

// Generate JWT for internal use
const jwtToken = await jwtService.generateToken({
  userId: user.id,
  email: profile.email,
  provider: profile.provider,
});
```

## Configuration Reference

### Provider Configuration

Each provider requires:

```typescript
{
  name: string;              // Provider identifier (google, github, etc.)
  clientId: string;          // OAuth application client ID
  clientSecret: string;      // OAuth application secret
  authorizationUrl: string;  // Provider's authorization endpoint
  tokenUrl: string;          // Provider's token endpoint
  userInfoUrl: string;       // Provider's user info endpoint
  redirectUri: string;       // Callback URL after authorization
  scopes: string[];          // Permission scopes to request
}
```

### Client Configuration

```typescript
{
  providers: {...};                    // Provider configurations
  stateTimeout?: number;               // State expiration (seconds, default: 600)
  tokenCacheTimeout?: number;          // Token cache TTL (seconds, default: 3600)
  enablePKCE?: boolean;                // Enable PKCE (default: false)
}
```

## Error Handling

The module provides specific error handling:

```typescript
try {
  const authUrl = await client.getAuthorizationUrl('unknown');
} catch (error) {
  console.error(error.message);
  // "Provider not configured: unknown"
}

// Invalid state in callback
const profile = await client.handleCallback({
  provider: 'google',
  code: 'code',
  state: 'invalid-state',
});
console.log(profile); // null
```

## Performance Considerations

- **State Storage**: In-memory Map with automatic cleanup after timeout
- **Token Caching**: Per-provider caching to avoid redundant exchanges
- **Event Processing**: Asynchronous listener execution
- **Memory Usage**: Grows with number of active OAuth flows and account links

For production:
- Consider external state store (Redis) for distributed deployments
- Implement token storage strategy (database, cache)
- Monitor memory usage with many linked accounts
- Set appropriate state and token timeouts

## License

Licensed under the ISC License.

## Contributing

This module follows the SOC Detection Lab development standards:

- TypeScript strict mode
- 85%+ test coverage
- ESLint compliance
- Professional documentation
- Type-safe implementations

## Changelog

### Version 1.0.0

- Initial OAuth Client implementation
- Multi-provider support
- Account linking and management
- Token refresh capability
- Event monitoring system
- Comprehensive test coverage
- Full documentation
