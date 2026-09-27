/**
 * OAuth Client - Type Definitions
 * Type definitions for OAuth2 provider integration
 */

/**
 * OAuth provider configuration
 */
export interface IOAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scopes: string[];
}

/**
 * OAuth authorization request
 */
export interface IOAuthAuthorizationRequest {
  provider: string;
  state: string;
  redirectUri: string;
  scopes: string[];
  customParams?: Record<string, string>;
}

/**
 * OAuth callback data
 */
export interface IOAuthCallback {
  provider: string;
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}

/**
 * OAuth token response
 */
export interface IOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope: string;
  rawResponse: Record<string, unknown>;
}

/**
 * OAuth user profile
 */
export interface IOAuthUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
  rawProfile: Record<string, unknown>;
}

/**
 * OAuth flow state
 */
export interface IOAuthFlowState {
  state: string;
  provider: string;
  createdAt: Date;
  expiresAt: Date;
  redirectUri: string;
  used: boolean;
}

/**
 * Account link
 */
export interface IAccountLink {
  userId: string;
  provider: string;
  providerUserId: string;
  email: string;
  linkedAt: Date;
  lastLogin: Date;
}

/**
 * OAuth client configuration
 */
export interface IOAuthClientConfig {
  providers: Record<string, IOAuthProvider>;
  stateTimeout: number;
  tokenCacheTimeout: number;
  enablePKCE: boolean;
}

/**
 * OAuth error
 */
export interface IOAuthError {
  type: 'invalid_request' | 'invalid_client' | 'invalid_grant' | 'unauthorized_client' | 'invalid_scope' | 'server_error' | 'temporarily_unavailable';
  message: string;
  description?: string;
}

/**
 * OAuth event
 */
export interface IOAuthEvent {
  type: 'authorization_started' | 'token_exchanged' | 'profile_retrieved' | 'account_linked' | 'account_unlinked' | 'error';
  timestamp: Date;
  provider: string;
  userId?: string;
  details?: Record<string, unknown>;
}

/**
 * OAuth listener
 */
export type OAuthListener = (event: IOAuthEvent) => Promise<void> | void;

/**
 * OAuth statistics
 */
export interface IOAuthStats {
  totalAuthorizationRequests: number;
  successfulTokenExchanges: number;
  failedTokenExchanges: number;
  accountsLinked: number;
  accountsUnlinked: number;
  errors: number;
}
