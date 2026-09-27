/**
 * OAuth Client - Demonstration Scenarios
 * Shows practical usage of OAuth2 provider integration
 */

import { OAuthClient } from '../src/main';
import type { IOAuthClientConfig, IOAuthCallback, IOAuthUserProfile } from '../src/types';

/**
 * Initialize OAuth client with multiple providers
 */
async function initializeOAuthClient(): Promise<OAuthClient> {
  const config: IOAuthClientConfig = {
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
      github: {
        name: 'github',
        clientId: 'YOUR_GITHUB_CLIENT_ID',
        clientSecret: 'YOUR_GITHUB_CLIENT_SECRET',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        redirectUri: 'http://localhost:3000/auth/github/callback',
        scopes: ['user:email'],
      },
      microsoft: {
        name: 'microsoft',
        clientId: 'YOUR_MICROSOFT_CLIENT_ID',
        clientSecret: 'YOUR_MICROSOFT_CLIENT_SECRET',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        redirectUri: 'http://localhost:3000/auth/microsoft/callback',
        scopes: ['user.read'],
      },
    },
    stateTimeout: 600,
    tokenCacheTimeout: 3600,
    enablePKCE: true,
  };

  return new OAuthClient(config);
}

/**
 * SCENARIO 1: Basic Google OAuth Flow
 * Demonstrates initiating a Google OAuth authorization flow
 */
async function scenario1BasicGoogleOAuthFlow(): Promise<void> {
  console.log('\n=== SCENARIO 1: Basic Google OAuth Flow ===');

  const client = await initializeOAuthClient();

  // Step 1: Generate authorization URL
  const authUrl = await client.getAuthorizationUrl('google');
  console.log('Authorization URL:', authUrl);
  console.log('User would be redirected to Google login page');

  // Step 2: After user approves, they're redirected with code and state
  const state = new URL(authUrl).searchParams.get('state');
  const callback: IOAuthCallback = {
    provider: 'google',
    code: 'AUTHORIZATION_CODE_FROM_OAUTH_PROVIDER',
    state: state!,
  };

  // Step 3: Handle callback and retrieve profile
  const profile = await client.handleCallback(callback);
  if (profile) {
    console.log('Successfully retrieved profile:', profile.email);
  }
}

/**
 * SCENARIO 2: Multi-Provider OAuth
 * Demonstrates supporting multiple OAuth providers
 */
async function scenario2MultiProviderOAuth(): Promise<void> {
  console.log('\n=== SCENARIO 2: Multi-Provider OAuth ===');

  const client = await initializeOAuthClient();
  const providers = client.getProviders();

  console.log('Available OAuth providers:', providers);

  // Generate authorization URLs for each provider
  for (const provider of providers) {
    const url = await client.getAuthorizationUrl(provider);
    console.log(`${provider}: ${url.substring(0, 50)}...`);
  }
}

/**
 * SCENARIO 3: Account Linking
 * Demonstrates linking OAuth accounts to a user
 */
async function scenario3AccountLinking(): Promise<void> {
  console.log('\n=== SCENARIO 3: Account Linking ===');

  const client = await initializeOAuthClient();
  const userId = 'user-123';

  // Get authorization URLs
  const googleUrl = await client.getAuthorizationUrl('google');
  const githubUrl = await client.getAuthorizationUrl('github');

  // Simulate callbacks
  const googleState = new URL(googleUrl).searchParams.get('state');
  const githubState = new URL(githubUrl).searchParams.get('state');

  const googleProfile = await client.handleCallback({
    provider: 'google',
    code: 'google-code',
    state: googleState!,
  });

  const githubProfile = await client.handleCallback({
    provider: 'github',
    code: 'github-code',
    state: githubState!,
  });

  // Link both accounts to user
  if (googleProfile) {
    await client.linkAccount(userId, 'google', googleProfile);
    console.log(`Linked Google account to ${userId}`);
  }

  if (githubProfile) {
    await client.linkAccount(userId, 'github', githubProfile);
    console.log(`Linked GitHub account to ${userId}`);
  }

  // Retrieve all linked accounts
  const links = await client.getLinkedAccounts(userId);
  console.log(`User has ${links.length} linked OAuth accounts:`, links.map(l => l.provider));
}

/**
 * SCENARIO 4: Retrieving Linked Accounts
 * Demonstrates retrieving and managing linked OAuth accounts
 */
async function scenario4RetrievingLinkedAccounts(): Promise<void> {
  console.log('\n=== SCENARIO 4: Retrieving Linked Accounts ===');

  const client = await initializeOAuthClient();
  const userId = 'user-123';

  // Create some test links
  const googleProfile: IOAuthUserProfile = {
    id: 'google-user-123',
    email: 'user@gmail.com',
    name: 'John Doe',
    provider: 'google',
    rawProfile: {},
  };

  const githubProfile: IOAuthUserProfile = {
    id: 'github-user-456',
    email: 'user@github.com',
    name: 'John Doe',
    provider: 'github',
    rawProfile: {},
  };

  await client.linkAccount(userId, 'google', googleProfile);
  await client.linkAccount(userId, 'github', githubProfile);

  // Get all linked accounts
  const allLinks = await client.getLinkedAccounts(userId);
  console.log('All linked accounts:', allLinks.length);

  // Get specific linked account
  const googleLink = await client.getLinkedAccount(userId, 'google');
  console.log('Google account:', googleLink?.email);

  // Check if provider is linked
  const microsoftLink = await client.getLinkedAccount(userId, 'microsoft');
  console.log('Microsoft account linked:', microsoftLink !== null);
}

/**
 * SCENARIO 5: Account Unlinking
 * Demonstrates unlinking OAuth accounts from a user
 */
async function scenario5AccountUnlinking(): Promise<void> {
  console.log('\n=== SCENARIO 5: Account Unlinking ===');

  const client = await initializeOAuthClient();
  const userId = 'user-123';

  // Create test links
  const googleProfile: IOAuthUserProfile = {
    id: 'google-user-123',
    email: 'user@gmail.com',
    name: 'John Doe',
    provider: 'google',
    rawProfile: {},
  };

  const githubProfile: IOAuthUserProfile = {
    id: 'github-user-456',
    email: 'user@github.com',
    name: 'John Doe',
    provider: 'github',
    rawProfile: {},
  };

  await client.linkAccount(userId, 'google', googleProfile);
  await client.linkAccount(userId, 'github', githubProfile);

  let links = await client.getLinkedAccounts(userId);
  console.log('Linked accounts before:', links.map(l => l.provider).join(', '));

  // Unlink Google account
  const unlinked = await client.unlinkAccount(userId, 'google');
  console.log('Google account unlinked:', unlinked);

  links = await client.getLinkedAccounts(userId);
  console.log('Linked accounts after:', links.map(l => l.provider).join(', '));
}

/**
 * SCENARIO 6: Token Refresh
 * Demonstrates refreshing OAuth tokens
 */
async function scenario6TokenRefresh(): Promise<void> {
  console.log('\n=== SCENARIO 6: Token Refresh ===');

  const client = await initializeOAuthClient();

  // Exchange code for initial token
  const token = await client.exchangeCodeForToken('google', 'auth-code', 'http://localhost:3000/auth/google/callback');
  console.log('Initial token obtained, expires in:', token?.expiresIn, 'seconds');

  // Later, when token expires, refresh it
  if (token?.refreshToken) {
    const newToken = await client.refreshToken('google', token.refreshToken);
    console.log('Token refreshed, new token expires in:', newToken?.expiresIn, 'seconds');
  }
}

/**
 * SCENARIO 7: Event Listeners
 * Demonstrates monitoring OAuth events
 */
async function scenario7EventListeners(): Promise<void> {
  console.log('\n=== SCENARIO 7: Event Listeners ===');

  const client = await initializeOAuthClient();

  // Set up event listener
  const authEvents: any[] = [];
  client.onOAuth((event) => {
    authEvents.push(event);
    console.log(`Event: ${event.type} - ${event.provider}`);
  });

  // Trigger some OAuth events
  const authUrl = await client.getAuthorizationUrl('google');
  const state = new URL(authUrl).searchParams.get('state');

  await client.handleCallback({
    provider: 'google',
    code: 'code',
    state: state!,
  });

  console.log('Total events captured:', authEvents.length);
}

/**
 * SCENARIO 8: Error Handling
 * Demonstrates handling OAuth errors
 */
async function scenario8ErrorHandling(): Promise<void> {
  console.log('\n=== SCENARIO 8: Error Handling ===');

  const client = await initializeOAuthClient();

  // Handle invalid provider
  try {
    await client.getAuthorizationUrl('invalid-provider');
  } catch (error) {
    console.log('Error caught (invalid provider):', (error as Error).message);
  }

  // Handle invalid callback state
  const callback: IOAuthCallback = {
    provider: 'google',
    code: 'code',
    state: 'invalid-state-xyz',
  };

  const profile = await client.handleCallback(callback);
  console.log('Invalid state callback result:', profile);

  // Handle OAuth error response
  const errorCallback: IOAuthCallback = {
    provider: 'google',
    code: 'ignored',
    state: 'any-state',
    error: 'access_denied',
    errorDescription: 'User denied the request',
  };

  const result = await client.handleCallback(errorCallback);
  console.log('Error callback result:', result);
}

/**
 * SCENARIO 9: Statistics Tracking
 * Demonstrates monitoring OAuth statistics
 */
async function scenario9StatisticsTracking(): Promise<void> {
  console.log('\n=== SCENARIO 9: Statistics Tracking ===');

  const client = await initializeOAuthClient();

  // Generate authorization URLs
  await client.getAuthorizationUrl('google');
  await client.getAuthorizationUrl('github');

  // Create some linked accounts
  const profile: IOAuthUserProfile = {
    id: 'google-user-123',
    email: 'user@gmail.com',
    name: 'John Doe',
    provider: 'google',
    rawProfile: {},
  };

  await client.linkAccount('user-123', 'google', profile);
  await client.unlinkAccount('user-123', 'google');

  // Get statistics
  const stats = client.getStats();
  console.log('OAuth Statistics:');
  console.log('  Authorization Requests:', stats.totalAuthorizationRequests);
  console.log('  Successful Token Exchanges:', stats.successfulTokenExchanges);
  console.log('  Failed Token Exchanges:', stats.failedTokenExchanges);
  console.log('  Accounts Linked:', stats.accountsLinked);
  console.log('  Accounts Unlinked:', stats.accountsUnlinked);
  console.log('  Errors:', stats.errors);
}

/**
 * SCENARIO 10: Complete User Authentication Flow
 * Demonstrates a complete OAuth authentication workflow
 */
async function scenario10CompleteAuthFlow(): Promise<void> {
  console.log('\n=== SCENARIO 10: Complete User Authentication Flow ===');

  const client = await initializeOAuthClient();
  const userId = 'new-user-456';

  // Step 1: User clicks "Sign in with Google"
  const authUrl = await client.getAuthorizationUrl('google');
  console.log('Step 1: Redirecting to Google...');

  // Step 2: User approves and OAuth provider redirects
  const state = new URL(authUrl).searchParams.get('state');
  console.log('Step 2: User approved, received code and state');

  // Step 3: Exchange code for profile
  const profile = await client.handleCallback({
    provider: 'google',
    code: 'auth-code-from-provider',
    state: state!,
  });

  if (profile) {
    // Step 4: Link OAuth account to user
    const linked = await client.linkAccount(userId, 'google', profile);
    console.log('Step 3: OAuth account linked to user:', linked);

    // Step 5: User can now use linked account for login
    const linkedAccounts = await client.getLinkedAccounts(userId);
    console.log('Step 4: User can login with:', linkedAccounts.map(a => a.provider).join(', '));
  }
}

/**
 * SCENARIO 11: Provider Configuration Management
 * Demonstrates listing and managing configured providers
 */
async function scenario11ProviderConfiguration(): Promise<void> {
  console.log('\n=== SCENARIO 11: Provider Configuration Management ===');

  const client = await initializeOAuthClient();

  // Get list of configured providers
  const providers = client.getProviders();
  console.log('Configured OAuth providers:');
  providers.forEach(provider => {
    console.log(`  - ${provider}`);
  });

  // Generate authorization URLs for all providers
  console.log('\nAuthorization URLs:');
  for (const provider of providers) {
    const url = await client.getAuthorizationUrl(provider);
    console.log(`  ${provider}: ${url.substring(0, 60)}...`);
  }
}

/**
 * SCENARIO 12: Chaining Operations
 * Demonstrates method chaining for listener registration
 */
async function scenario12ChainingOperations(): Promise<void> {
  console.log('\n=== SCENARIO 12: Chaining Operations ===');

  const client = await initializeOAuthClient();

  // Chain multiple listener registrations
  const events: any[] = [];

  client
    .onOAuth((event) => {
      events.push(event);
      console.log(`Listener 1 captured: ${event.type}`);
    })
    .onOAuth((event) => {
      console.log(`Listener 2 captured: ${event.type}`);
    });

  // Trigger events
  await client.getAuthorizationUrl('google');

  console.log('Total events:', events.length);
}

/**
 * Run all demo scenarios
 */
async function runAllScenarios(): Promise<void> {
  try {
    await scenario1BasicGoogleOAuthFlow();
    await scenario2MultiProviderOAuth();
    await scenario3AccountLinking();
    await scenario4RetrievingLinkedAccounts();
    await scenario5AccountUnlinking();
    await scenario6TokenRefresh();
    await scenario7EventListeners();
    await scenario8ErrorHandling();
    await scenario9StatisticsTracking();
    await scenario10CompleteAuthFlow();
    await scenario11ProviderConfiguration();
    await scenario12ChainingOperations();

    console.log('\n=== ALL SCENARIOS COMPLETED ===\n');
  } catch (error) {
    console.error('Error running scenarios:', error);
  }
}

// Export scenarios for individual testing
export {
  scenario1BasicGoogleOAuthFlow,
  scenario2MultiProviderOAuth,
  scenario3AccountLinking,
  scenario4RetrievingLinkedAccounts,
  scenario5AccountUnlinking,
  scenario6TokenRefresh,
  scenario7EventListeners,
  scenario8ErrorHandling,
  scenario9StatisticsTracking,
  scenario10CompleteAuthFlow,
  scenario11ProviderConfiguration,
  scenario12ChainingOperations,
  runAllScenarios,
};

// Run all scenarios if executed directly
if (require.main === module) {
  runAllScenarios().catch(console.error);
}
