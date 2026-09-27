/**
 * JWT Service - Type Definitions
 * Type definitions for JWT token generation, validation, and management
 */

/**
 * Token payload (claims)
 */
export interface ITokenPayload {
  userId: string;
  email?: string;
  username?: string;
  roles?: string[];
  permissions?: string[];
  issuer?: string;
  subject?: string;
  customClaims?: Record<string, unknown>;
}

/**
 * Token generation options
 */
export interface ITokenOptions {
  algorithm?: 'HS256' | 'RS256';
  expiresIn?: number; // seconds
  refreshTokenExpiresIn?: number; // seconds
  includeRefreshToken?: boolean;
  issuer?: string;
  audience?: string;
  notBefore?: number;
}

/**
 * Generated token response
 */
export interface IToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  issuedAt: Date;
  expiresAt: Date;
}

/**
 * Token validation result
 */
export interface ITokenValidationResult {
  valid: boolean;
  payload?: ITokenPayload;
  error?: string;
  expired?: boolean;
  invalidSignature?: boolean;
}

/**
 * Token refresh result
 */
export interface ITokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Revoked token entry
 */
export interface IRevokedToken {
  token: string;
  revokedAt: Date;
  expiresAt: Date;
  reason?: string;
}

/**
 * JWT configuration
 */
export interface IJWTConfig {
  secretKey: string;
  publicKey?: string;
  algorithm: 'HS256' | 'RS256';
  expiresIn: number;
  refreshTokenExpiresIn: number;
  issuer: string;
  audience: string;
  clockTolerance?: number;
}

/**
 * Token statistics
 */
export interface ITokenStats {
  totalGenerated: number;
  totalValidated: number;
  totalRefreshed: number;
  revokedCount: number;
  invalidTokens: number;
}

/**
 * Token event
 */
export interface ITokenEvent {
  type: 'generated' | 'validated' | 'refreshed' | 'revoked' | 'invalid';
  timestamp: Date;
  userId?: string;
  tokenId?: string;
  details?: Record<string, unknown>;
}

/**
 * Token listener
 */
export type TokenListener = (event: ITokenEvent) => Promise<void> | void;

/**
 * Decoded token
 */
export interface IDecodedToken {
  header: {
    alg: string;
    typ: string;
  };
  payload: ITokenPayload & {
    iat?: number; // issued at
    exp?: number; // expiration
    nbf?: number; // not before
    iss?: string; // issuer
    aud?: string; // audience
  };
  signature: string;
}

/**
 * Token cache entry
 */
export interface ITokenCacheEntry {
  payload: ITokenPayload;
  expiresAt: Date;
  validated: boolean;
}

/**
 * Batch token generation
 */
export interface IBatchTokenRequest {
  userId: string;
  customClaims?: Record<string, unknown>;
}

/**
 * Batch token result
 */
export interface IBatchTokenResult {
  userId: string;
  token: IToken;
  error?: string;
}
