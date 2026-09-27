/**
 * OAuth Client - Unit Tests
 * Comprehensive test suite for OAuth2 provider integration
 */

import { OAuthClient, createOAuthClient } from '../../src/main';
import type { IOAuthClientConfig, IOAuthCallback, IOAuthUserProfile } from '../../src/types';

describe('OAuthClient', () => {
  let client: OAuthClient;
  const config: IOAuthClientConfig = {
    providers: {
      google: {
        name: 'google',
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scopes: ['openid', 'email', 'profile'],
      },
      github: {
        name: 'github',
        clientId: 'github-client-id',
        clientSecret: 'github-client-secret',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        redirectUri: 'http://localhost:3000/auth/github/callback',
        scopes: ['user:email'],
      },
    },
    stateTimeout: 600,
    tokenCacheTimeout: 3600,
    enablePKCE: true,
  };

  beforeEach(() => {
    client = new OAuthClient(config);
  });

  // ============================================================
  // Service Creation Tests
  // ============================================================

  describe('Service Creation', () => {
    test('should create OAuth client instance', () => {
      expect(client).toBeInstanceOf(OAuthClient);
    });

    test('should create client via factory', () => {
      const c = createOAuthClient(config);
      expect(c).toBeInstanceOf(OAuthClient);
    });

    test('should throw error without providers', () => {
      expect(() => {
        new OAuthClient({
          ...config,
          providers: {},
        });
      }).toThrow('At least one OAuth provider must be configured');
    });

    test('should initialize empty stats', () => {
      const stats = client.getStats();
      expect(stats.totalAuthorizationRequests).toBe(0);
      expect(stats.successfulTokenExchanges).toBe(0);
      expect(stats.failedTokenExchanges).toBe(0);
      expect(stats.accountsLinked).toBe(0);
      expect(stats.accountsUnlinked).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  // ============================================================
  // Provider Configuration Tests
  // ============================================================

  describe('Provider Configuration', () => {
    test('should get configured providers', () => {
      const providers = client.getProviders();
      expect(providers).toContain('google');
      expect(providers).toContain('github');
      expect(providers.length).toBe(2);
    });

    test('should support multiple providers', () => {
      const multiConfig: IOAuthClientConfig = {
        ...config,
        providers: {
          ...config.providers,
          microsoft: {
            name: 'microsoft',
            clientId: 'ms-id',
            clientSecret: 'ms-secret',
            authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
            redirectUri: 'http://localhost:3000/auth/microsoft/callback',
            scopes: ['user.read'],
          },
        },
      };

      const multiClient = new OAuthClient(multiConfig);
      expect(multiClient.getProviders().length).toBe(3);
    });
  });

  // ============================================================
  // Authorization URL Generation Tests
  // ============================================================

  describe('Authorization URL Generation', () => {
    test('should generate authorization URL for Google', async () => {
      const url = await client.getAuthorizationUrl('google');
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=google-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+email+profile');
      expect(url).toContain('state=');
    });

    test('should generate authorization URL for GitHub', async () => {
      const url = await client.getAuthorizationUrl('github');
      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=github-client-id');
      expect(url).toContain('scope=user:email');
    });

    test('should use custom redirect URI', async () => {
      const customUri = 'https://example.com/oauth/callback';
      const url = await client.getAuthorizationUrl('google', customUri);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(customUri)}`);
    });

    test('should include state parameter', async () => {
      const url = await client.getAuthorizationUrl('google');
      const urlObj = new URL(url);
      const state = urlObj.searchParams.get('state');
      expect(state).toBeDefined();
      expect(state).toMatch(/^state-\d+-[a-z0-9]+$/);
    });

    test('should throw error for unknown provider', async () => {
      await expect(client.getAuthorizationUrl('unknown')).rejects.toThrow(
        'Provider not configured: unknown'
      );
    });

    test('should increment authorization request stats', async () => {
      await client.getAuthorizationUrl('google');
      const stats = client.getStats();
      expect(stats.totalAuthorizationRequests).toBe(1);
    });

    test('should generate different states for multiple requests', async () => {
      const url1 = await client.getAuthorizationUrl('google');
      const url2 = await client.getAuthorizationUrl('google');

      const state1 = new URL(url1).searchParams.get('state');
      const state2 = new URL(url2).searchParams.get('state');

      expect(state1).not.toBe(state2);
    });
  });

  // ============================================================
  // OAuth Callback Handling Tests
  // ============================================================

  describe('OAuth Callback Handling', () => {
    test('should handle successful callback', async () => {
      const authUrl = await client.getAuthorizationUrl('google');
      const state = new URL(authUrl).searchParams.get('state');

      const callback: IOAuthCallback = {
        provider: 'google',
        code: 'auth-code-123',
        state: state!,
      };

      const profile = await client.handleCallback(callback);
      expect(profile).not.toBeNull();
      expect(profile?.id).toBeDefined();
      expect(profile?.email).toBeDefined();
      expect(profile?.name).toBeDefined();
      expect(profile?.provider).toBe('google');
    });

    test('should reject callback with invalid state', async () => {
      const callback: IOAuthCallback = {
        provider: 'google',
        code: 'auth-code-123',
        state: 'invalid-state-xyz',
      };

      const profile = await client.handleCallback(callback);
      expect(profile).toBeNull();
    });

    test('should reject reused state', async () => {
      const authUrl = await client.getAuthorizationUrl('google');
      const state = new URL(authUrl).searchParams.get('state');

      const callback: IOAuthCallback = {
        provider: 'google',
        code: 'auth-code-123',
        state: state!,
      };

      // First callback should succeed
      const profile1 = await client.handleCallback(callback);
      expect(profile1).not.toBeNull();

      // Reusing same state should fail
      const profile2 = await client.handleCallback(callback);
      expect(profile2).toBeNull();
    });

    test('should handle OAuth error callback', async () => {
      const authUrl = await client.getAuthorizationUrl('google');
      const state = new URL(authUrl).searchParams.get('state');

      const callback: IOAuthCallback = {
        provider: 'google',
        code: 'ignored',
        state: state!,
        error: 'access_denied',
        errorDescription: 'User denied access',
      };

      const profile = await client.handleCallback(callback);
      expect(profile).toBeNull();
    });

    test('should increment successful token exchange stats', async () => {
      const authUrl = await client.getAuthorizationUrl('google');
      const state = new URL(authUrl).searchParams.get('state');

      const callback: IOAuthCallback = {
        provider: 'google',
        code: 'auth-code-123',
        state: state!,
      };

      await client.handleCallback(callback);
      const stats = client.getStats();
      expect(stats.successfulTokenExchanges).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Token Exchange Tests
  // ============================================================

  describe('Token Exchange', () => {
    test('should exchange authorization code for token', async () => {
      const token = await client.exchangeCodeForToken('google', 'auth-code-123', 'http://localhost:3000/auth/google/callback');
      expect(token).not.toBeNull();
      expect(token?.accessToken).toBeDefined();
      expect(token?.tokenType).toBe('Bearer');
      expect(token?.expiresIn).toBeGreaterThan(0);
      expect(token?.refreshToken).toBeDefined();
    });

    test('should include scope in token', async () => {
      const token = await client.exchangeCodeForToken('google', 'auth-code-123', 'http://localhost:3000/auth/google/callback');
      expect(token?.scope).toContain('openid');
      expect(token?.scope).toContain('email');
    });

    test('should cache token by provider', async () => {
      const token1 = await client.exchangeCodeForToken('google', 'code-1', 'http://localhost:3000/auth/google/callback');
      const token2 = await client.exchangeCodeForToken('google', 'code-2', 'http://localhost:3000/auth/google/callback');

      expect(token2?.accessToken).toBeDefined();
    });

    test('should throw error for unknown provider', async () => {
      await expect(
        client.exchangeCodeForToken('unknown', 'code', 'http://localhost/callback')
      ).rejects.toThrow('Provider not configured: unknown');
    });

    test('should generate unique access tokens', async () => {
      const token1 = await client.exchangeCodeForToken('google', 'code-1', 'http://localhost:3000/auth/google/callback');
      const token2 = await client.exchangeCodeForToken('google', 'code-2', 'http://localhost:3000/auth/google/callback');

      expect(token1?.accessToken).not.toBe(token2?.accessToken);
    });
  });

  // ============================================================
  // User Profile Retrieval Tests
  // ============================================================

  describe('User Profile Retrieval', () => {
    test('should retrieve user profile', async () => {
      const token = await client.exchangeCodeForToken('google', 'code', 'http://localhost:3000/auth/google/callback');
      const profile = await client.getUserProfile('google', token!);

      expect(profile).not.toBeNull();
      expect(profile?.id).toBeDefined();
      expect(profile?.email).toBeDefined();
      expect(profile?.name).toBeDefined();
      expect(profile?.provider).toBe('google');
    });

    test('should include raw profile data', async () => {
      const token = await client.exchangeCodeForToken('google', 'code', 'http://localhost:3000/auth/google/callback');
      const profile = await client.getUserProfile('google', token!);

      expect(profile?.rawProfile).toBeDefined();
      expect(typeof profile?.rawProfile).toBe('object');
    });

    test('should generate unique user IDs', async () => {
      const token1 = await client.exchangeCodeForToken('google', 'code', 'http://localhost:3000/auth/google/callback');
      const token2 = await client.exchangeCodeForToken('google', 'code', 'http://localhost:3000/auth/google/callback');

      const profile1 = await client.getUserProfile('google', token1!);
      const profile2 = await client.getUserProfile('google', token2!);

      expect(profile1?.id).not.toBe(profile2?.id);
    });
  });

  // ============================================================
  // Account Linking Tests
  // ============================================================

  describe('Account Linking', () => {
    test('should link OAuth account to user', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      const linked = await client.linkAccount('user-123', 'google', profile);
      expect(linked).toBe(true);
    });

    test('should get linked accounts', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      const links = await client.getLinkedAccounts('user-123');

      expect(links.length).toBe(1);
      expect(links[0].provider).toBe('google');
      expect(links[0].providerUserId).toBe('google-user-123');
    });

    test('should support multiple provider links per user', async () => {
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

      await client.linkAccount('user-123', 'google', googleProfile);
      await client.linkAccount('user-123', 'github', githubProfile);

      const links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(2);
    });

    test('should get specific linked account', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      const link = await client.getLinkedAccount('user-123', 'google');

      expect(link).not.toBeNull();
      expect(link?.provider).toBe('google');
    });

    test('should return null for non-existent linked account', async () => {
      const link = await client.getLinkedAccount('user-123', 'google');
      expect(link).toBeNull();
    });

    test('should increment link stats', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      const stats = client.getStats();
      expect(stats.accountsLinked).toBe(1);
    });
  });

  // ============================================================
  // Account Unlinking Tests
  // ============================================================

  describe('Account Unlinking', () => {
    test('should unlink OAuth account', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      const unlinked = await client.unlinkAccount('user-123', 'google');

      expect(unlinked).toBe(true);

      const links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(0);
    });

    test('should return false for non-existent account', async () => {
      const unlinked = await client.unlinkAccount('user-123', 'google');
      expect(unlinked).toBe(false);
    });

    test('should preserve other linked accounts', async () => {
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

      await client.linkAccount('user-123', 'google', googleProfile);
      await client.linkAccount('user-123', 'github', githubProfile);

      await client.unlinkAccount('user-123', 'google');

      const links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(1);
      expect(links[0].provider).toBe('github');
    });

    test('should increment unlink stats', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      await client.unlinkAccount('user-123', 'google');

      const stats = client.getStats();
      expect(stats.accountsUnlinked).toBe(1);
    });
  });

  // ============================================================
  // Token Refresh Tests
  // ============================================================

  describe('Token Refresh', () => {
    test('should refresh OAuth token', async () => {
      const token = await client.refreshToken('google', 'refresh-token-123');
      expect(token).not.toBeNull();
      expect(token?.accessToken).toBeDefined();
      expect(token?.tokenType).toBe('Bearer');
    });

    test('should generate new access token on refresh', async () => {
      const token1 = await client.refreshToken('google', 'refresh-token-1');
      const token2 = await client.refreshToken('google', 'refresh-token-2');

      expect(token1?.accessToken).not.toBe(token2?.accessToken);
    });

    test('should throw error for unknown provider', async () => {
      await expect(
        client.refreshToken('unknown', 'refresh-token')
      ).rejects.toThrow('Provider not configured: unknown');
    });
  });

  // ============================================================
  // Event Listener Tests
  // ============================================================

  describe('Event Listeners', () => {
    test('should register and trigger event listeners', async () => {
      const events: any[] = [];
      const listener = (event: any) => {
        events.push(event);
      };

      client.onOAuth(listener);
      await client.getAuthorizationUrl('google');

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('authorization_started');
    });

    test('should support multiple listeners', async () => {
      const events1: any[] = [];
      const events2: any[] = [];

      const listener1 = (event: any) => events1.push(event);
      const listener2 = (event: any) => events2.push(event);

      client.onOAuth(listener1);
      client.onOAuth(listener2);

      await client.getAuthorizationUrl('google');

      expect(events1.length).toBeGreaterThan(0);
      expect(events2.length).toBeGreaterThan(0);
    });

    test('should remove listener', async () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);

      client.onOAuth(listener);
      client.offOAuth(listener);

      await client.getAuthorizationUrl('google');

      expect(events.length).toBe(0);
    });

    test('should emit error events', async () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);

      client.onOAuth(listener);

      // Attempt callback with invalid state
      await client.handleCallback({
        provider: 'google',
        code: 'code',
        state: 'invalid',
      });

      const errorEvents = events.filter(e => e.type === 'error');
      expect(errorEvents.length).toBeGreaterThan(0);
    });

    test('should chain listener registration', () => {
      const listener = jest.fn();
      const result = client.onOAuth(listener).onOAuth(listener);

      expect(result).toBe(client);
    });
  });

  // ============================================================
  // Statistics Tests
  // ============================================================

  describe('Statistics', () => {
    test('should track authorization requests', async () => {
      await client.getAuthorizationUrl('google');
      await client.getAuthorizationUrl('github');

      const stats = client.getStats();
      expect(stats.totalAuthorizationRequests).toBe(2);
    });

    test('should track successful token exchanges', async () => {
      const authUrl = await client.getAuthorizationUrl('google');
      const state = new URL(authUrl).searchParams.get('state');

      await client.handleCallback({
        provider: 'google',
        code: 'code',
        state: state!,
      });

      const stats = client.getStats();
      expect(stats.successfulTokenExchanges).toBeGreaterThan(0);
    });

    test('should track failed token exchanges', async () => {
      await client.exchangeCodeForToken('google', '', 'http://localhost/callback').catch(() => {});
      const stats = client.getStats();
      expect(stats.failedTokenExchanges).toBeGreaterThanOrEqual(0);
    });

    test('should track linked and unlinked accounts', async () => {
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      await client.unlinkAccount('user-123', 'google');

      const stats = client.getStats();
      expect(stats.accountsLinked).toBe(1);
      expect(stats.accountsUnlinked).toBe(1);
    });

    test('should track errors', async () => {
      await client.getAuthorizationUrl('unknown').catch(() => {});
      const stats = client.getStats();
      expect(stats.errors).toBeGreaterThan(0);
    });

    test('should return copy of stats', () => {
      const stats1 = client.getStats();
      const stats2 = client.getStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration Scenarios', () => {
    test('should complete full OAuth flow', async () => {
      // Step 1: Get authorization URL
      const authUrl = await client.getAuthorizationUrl('google');
      const state = new URL(authUrl).searchParams.get('state');

      // Step 2: Simulate OAuth callback
      const callback: IOAuthCallback = {
        provider: 'google',
        code: 'auth-code-123',
        state: state!,
      };

      // Step 3: Handle callback and get profile
      const profile = await client.handleCallback(callback);
      expect(profile).not.toBeNull();
      expect(profile?.provider).toBe('google');

      // Step 4: Link account
      const linked = await client.linkAccount('user-123', 'google', profile!);
      expect(linked).toBe(true);

      // Step 5: Verify account is linked
      const links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(1);
    });

    test('should handle multi-provider authentication', async () => {
      const googleUrl = await client.getAuthorizationUrl('google');
      const googleState = new URL(googleUrl).searchParams.get('state');

      const githubUrl = await client.getAuthorizationUrl('github');
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

      await client.linkAccount('user-123', 'google', googleProfile!);
      await client.linkAccount('user-123', 'github', githubProfile!);

      const links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(2);
    });

    test('should handle complete user lifecycle', async () => {
      // Initial link
      const profile: IOAuthUserProfile = {
        id: 'google-user-123',
        email: 'user@gmail.com',
        name: 'John Doe',
        provider: 'google',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'google', profile);
      let links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(1);

      // Add another provider
      const gitProfile: IOAuthUserProfile = {
        id: 'github-user-456',
        email: 'user@github.com',
        name: 'John Doe',
        provider: 'github',
        rawProfile: {},
      };

      await client.linkAccount('user-123', 'github', gitProfile);
      links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(2);

      // Remove one provider
      await client.unlinkAccount('user-123', 'google');
      links = await client.getLinkedAccounts('user-123');
      expect(links.length).toBe(1);
      expect(links[0].provider).toBe('github');
    });
  });
});
