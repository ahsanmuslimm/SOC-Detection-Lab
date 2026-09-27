/**
 * OAuth Client - Public API
 * OAuth2 provider integration for federated authentication
 */

export { OAuthClient, createOAuthClient } from './main';

export type {
  IOAuthProvider,
  IOAuthAuthorizationRequest,
  IOAuthCallback,
  IOAuthToken,
  IOAuthUserProfile,
  IOAuthFlowState,
  IAccountLink,
  IOAuthClientConfig,
  IOAuthError,
  IOAuthEvent,
  OAuthListener,
  IOAuthStats,
} from './types';
