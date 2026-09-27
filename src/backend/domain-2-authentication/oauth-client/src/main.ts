/**
 * OAuth Client - Main Implementation
 * OAuth2 provider integration for federated authentication
 */

import type {
  IOAuthProvider,
  IOAuthAuthorizationRequest,
  IOAuthCallback,
  IOAuthToken,
  IOAuthUserProfile,
  IOAuthFlowState,
  IAccountLink,
  IOAuthClientConfig,
  IOAuthEvent,
  OAuthListener,
  IOAuthStats,
} from './types';

/**
 * OAuth Client - OAuth2 provider integration
 */
export class OAuthClient {
  private config: IOAuthClientConfig;
  private flowStates: Map<string, IOAuthFlowState> = new Map();
  private accountLinks: Map<string, IAccountLink[]> = new Map();
  private tokenCache: Map<string, IOAuthToken> = new Map();
  private listeners: Set<OAuthListener> = new Set();
  private stats: IOAuthStats = {
    totalAuthorizationRequests: 0,
    successfulTokenExchanges: 0,
    failedTokenExchanges: 0,
    accountsLinked: 0,
    accountsUnlinked: 0,
    errors: 0,
  };

  constructor(config: IOAuthClientConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.providers || Object.keys(this.config.providers).length === 0) {
      throw new Error('At least one OAuth provider must be configured');
    }
  }

  /**
   * Get authorization URL for provider
   */
  async getAuthorizationUrl(provider: string, redirectUri?: string): Promise<string> {
    try {
      const providerConfig = this.config.providers[provider];
      if (!providerConfig) {
        throw new Error(`Provider not configured: ${provider}`);
      }

      const state = this.generateState();
      const redirectUrl = redirectUri || providerConfig.redirectUri;

      // Store flow state
      const flowState: IOAuthFlowState = {
        state,
        provider,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.stateTimeout * 1000),
        redirectUri: redirectUrl,
        used: false,
      };

      this.flowStates.set(state, flowState);

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: providerConfig.clientId,
        redirect_uri: redirectUrl,
        response_type: 'code',
        scope: providerConfig.scopes.join(' '),
        state,
      });

      this.stats.totalAuthorizationRequests++;
      this.emitEvent('authorization_started', { provider });

      return `${providerConfig.authorizationUrl}?${params.toString()}`;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(callback: IOAuthCallback): Promise<IOAuthUserProfile | null> {
    try {
      // Validate state
      const flowState = this.flowStates.get(callback.state);
      if (!flowState || flowState.used || flowState.expiresAt < new Date()) {
        this.stats.errors++;
        this.emitEvent('error', { provider: callback.provider });
        return null;
      }

      // Check for error
      if (callback.error) {
        this.stats.errors++;
        throw new Error(`OAuth error: ${callback.error}`);
      }

      // Exchange code for token
      const token = await this.exchangeCodeForToken(callback.provider, callback.code, flowState.redirectUri);
      if (!token) {
        return null;
      }

      // Mark state as used
      flowState.used = true;

      // Get user profile
      const profile = await this.getUserProfile(callback.provider, token);
      if (!profile) {
        return null;
      }

      this.stats.successfulTokenExchanges++;
      this.emitEvent('token_exchanged', { provider: callback.provider });

      return profile;
    } catch (err) {
      this.stats.failedTokenExchanges++;
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Exchange authorization code for token
   */
  async exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUri: string
  ): Promise<IOAuthToken | null> {
    try {
      const providerConfig = this.config.providers[provider];
      if (!providerConfig) {
        throw new Error(`Provider not configured: ${provider}`);
      }

      // Simulated token exchange (in production, make HTTP request)
      const token: IOAuthToken = {
        accessToken: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken: `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scope: providerConfig.scopes.join(' '),
        rawResponse: { code },
      };

      // Cache token
      this.tokenCache.set(provider, token);

      return token;
    } catch (err) {
      this.stats.failedTokenExchanges++;
      return null;
    }
  }

  /**
   * Get user profile from provider
   */
  async getUserProfile(provider: string, token: IOAuthToken): Promise<IOAuthUserProfile | null> {
    try {
      // Simulated profile retrieval (in production, make HTTP request)
      const profile: IOAuthUserProfile = {
        id: `${provider}-user-${Date.now()}`,
        email: `user-${Date.now()}@example.com`,
        name: 'OAuth User',
        provider,
        rawProfile: {},
      };

      this.emitEvent('profile_retrieved', { provider, userId: profile.id });

      return profile;
    } catch (err) {
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Link OAuth account to user
   */
  async linkAccount(userId: string, provider: string, profile: IOAuthUserProfile): Promise<boolean> {
    try {
      const link: IAccountLink = {
        userId,
        provider,
        providerUserId: profile.id,
        email: profile.email,
        linkedAt: new Date(),
        lastLogin: new Date(),
      };

      const links = this.accountLinks.get(userId) || [];
      links.push(link);
      this.accountLinks.set(userId, links);

      this.stats.accountsLinked++;
      this.emitEvent('account_linked', { userId, provider });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Unlink OAuth account
   */
  async unlinkAccount(userId: string, provider: string): Promise<boolean> {
    try {
      const links = this.accountLinks.get(userId) || [];
      const filtered = links.filter(l => l.provider !== provider);
      
      if (filtered.length === links.length) {
        return false; // Not found
      }

      this.accountLinks.set(userId, filtered);
      this.stats.accountsUnlinked++;
      this.emitEvent('account_unlinked', { userId, provider });

      return true;
    } catch (err) {
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get linked accounts for user
   */
  async getLinkedAccounts(userId: string): Promise<IAccountLink[]> {
    return this.accountLinks.get(userId) || [];
  }

  /**
   * Get linked account by provider
   */
  async getLinkedAccount(userId: string, provider: string): Promise<IAccountLink | null> {
    const links = this.accountLinks.get(userId) || [];
    return links.find(l => l.provider === provider) || null;
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(provider: string, refreshToken: string): Promise<IOAuthToken | null> {
    try {
      const providerConfig = this.config.providers[provider];
      if (!providerConfig) {
        throw new Error(`Provider not configured: ${provider}`);
      }

      // Simulated token refresh (in production, make HTTP request)
      const token: IOAuthToken = {
        accessToken: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken: `refresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scope: providerConfig.scopes.join(' '),
        rawResponse: { refreshToken },
      };

      this.tokenCache.set(provider, token);
      return token;
    } catch (err) {
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Register listener
   */
  onOAuth(listener: OAuthListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove listener
   */
  offOAuth(listener: OAuthListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Get statistics
   */
  getStats(): IOAuthStats {
    return { ...this.stats };
  }

  /**
   * Get configured providers
   */
  getProviders(): string[] {
    return Object.keys(this.config.providers);
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private generateState(): string {
    return `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent(type: IOAuthEvent['type'], details?: Record<string, unknown>): void {
    const event: IOAuthEvent = {
      type,
      timestamp: new Date(),
      provider: (details?.provider as string) || 'unknown',
      userId: details?.userId as string,
      details,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[OAuthClient] Listener error:', err);
      }
    }
  }
}

/**
 * Factory function
 */
export function createOAuthClient(config: IOAuthClientConfig): OAuthClient {
  return new OAuthClient(config);
}

/**
 * Default export
 */
export default OAuthClient;
