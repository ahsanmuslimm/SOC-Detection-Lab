/**
 * JWT Service - Main Implementation
 * JWT token generation, validation, refresh, and management
 */

import type {
  ITokenPayload,
  ITokenOptions,
  IToken,
  ITokenValidationResult,
  ITokenRefreshResult,
  IRevokedToken,
  IJWTConfig,
  ITokenStats,
  ITokenEvent,
  TokenListener,
  IDecodedToken,
  ITokenCacheEntry,
  IBatchTokenRequest,
  IBatchTokenResult,
} from './types';

/**
 * JWT Service - Token management
 */
export class JWTService {
  private config: IJWTConfig;
  private revokedTokens: Map<string, IRevokedToken> = new Map();
  private listeners: Set<TokenListener> = new Set();
  private tokenCache: Map<string, ITokenCacheEntry> = new Map();
  private stats: ITokenStats = {
    totalGenerated: 0,
    totalValidated: 0,
    totalRefreshed: 0,
    revokedCount: 0,
    invalidTokens: 0,
  };

  constructor(config: IJWTConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (!this.config.secretKey) {
      throw new Error('JWT secret key is required');
    }
    if (this.config.algorithm === 'RS256' && !this.config.publicKey) {
      throw new Error('Public key required for RS256 algorithm');
    }
  }

  /**
   * Generate token
   */
  async generateToken(
    payload: ITokenPayload,
    options: ITokenOptions = {}
  ): Promise<IToken> {
    try {
      const expiresIn = options.expiresIn || this.config.expiresIn;
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + expiresIn * 1000);

      // Create token payload
      const tokenPayload = {
        ...payload,
        iat: Math.floor(issuedAt.getTime() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
        iss: options.issuer || this.config.issuer,
        aud: options.audience || this.config.audience,
      };

      // Simulated token generation (in production, use jsonwebtoken library)
      const accessToken = this.createToken(JSON.stringify(tokenPayload));

      let refreshToken: string | undefined;
      if (options.includeRefreshToken !== false) {
        const refreshExpiresIn = options.refreshTokenExpiresIn || this.config.refreshTokenExpiresIn;
        refreshToken = this.createToken(
          JSON.stringify({
            ...tokenPayload,
            type: 'refresh',
            exp: Math.floor((Date.now() + refreshExpiresIn * 1000) / 1000),
          })
        );
      }

      const token: IToken = {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn,
        issuedAt,
        expiresAt,
      };

      this.stats.totalGenerated++;
      this.emitEvent('generated', { userId: payload.userId, expiresIn });

      return token;
    } catch (err) {
      throw new Error(`Failed to generate token: ${err}`);
    }
  }

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<ITokenValidationResult> {
    try {
      // Check revocation
      if (this.revokedTokens.has(token)) {
        this.stats.invalidTokens++;
        return {
          valid: false,
          error: 'Token has been revoked',
        };
      }

      // Check cache
      const cached = this.tokenCache.get(token);
      if (cached && cached.expiresAt > new Date()) {
        this.stats.totalValidated++;
        return {
          valid: true,
          payload: cached.payload,
        };
      }

      // Decode and validate token
      const decoded = this.decodeToken(token);
      if (!decoded) {
        this.stats.invalidTokens++;
        return {
          valid: false,
          error: 'Invalid token format',
          invalidSignature: true,
        };
      }

      // Check expiration
      if (decoded.payload.exp && decoded.payload.exp < Math.floor(Date.now() / 1000)) {
        this.stats.invalidTokens++;
        return {
          valid: false,
          error: 'Token has expired',
          expired: true,
        };
      }

      // Validate signature
      const isValid = this.verifySignature(token, decoded);
      if (!isValid) {
        this.stats.invalidTokens++;
        return {
          valid: false,
          error: 'Invalid token signature',
          invalidSignature: true,
        };
      }

      // Cache the result
      const payload: ITokenPayload = {
        userId: decoded.payload.userId,
        email: decoded.payload.email,
        username: decoded.payload.username,
        roles: decoded.payload.roles,
        permissions: decoded.payload.permissions,
      };

      this.tokenCache.set(token, {
        payload,
        expiresAt: new Date((decoded.payload.exp || 0) * 1000),
        validated: true,
      });

      this.stats.totalValidated++;
      this.emitEvent('validated', { userId: payload.userId });

      return {
        valid: true,
        payload,
      };
    } catch (err) {
      this.stats.invalidTokens++;
      return {
        valid: false,
        error: String(err),
      };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<ITokenRefreshResult> {
    try {
      // Validate refresh token
      const validation = await this.validateToken(refreshToken);
      if (!validation.valid) {
        throw new Error('Invalid refresh token');
      }

      const payload = validation.payload!;

      // Generate new access token
      const newToken = await this.generateToken(
        {
          userId: payload.userId,
          email: payload.email,
          username: payload.username,
          roles: payload.roles,
          permissions: payload.permissions,
        },
        { includeRefreshToken: true }
      );

      this.stats.totalRefreshed++;
      this.emitEvent('refreshed', { userId: payload.userId });

      return {
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        expiresIn: newToken.expiresIn,
      };
    } catch (err) {
      throw new Error(`Failed to refresh token: ${err}`);
    }
  }

  /**
   * Get token payload
   */
  async getPayload(token: string): Promise<ITokenPayload | null> {
    try {
      const validation = await this.validateToken(token);
      return validation.valid ? validation.payload || null : null;
    } catch {
      return null;
    }
  }

  /**
   * Revoke token
   */
  async revokeToken(token: string, reason?: string): Promise<void> {
    try {
      const validation = await this.validateToken(token);
      if (validation.payload) {
        const expiresAt = new Date(validation.payload.customClaims?.exp as number || 0);

        this.revokedTokens.set(token, {
          token,
          revokedAt: new Date(),
          expiresAt,
          reason,
        });

        this.stats.revokedCount++;
        this.emitEvent('revoked', { reason });

        // Cleanup cache
        this.tokenCache.delete(token);

        // Auto-cleanup expired revocations
        this.cleanupExpiredRevocations();
      }
    } catch (err) {
      throw new Error(`Failed to revoke token: ${err}`);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload.exp) {
        return false;
      }
      return decoded.payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  /**
   * Decode token
   */
  private decodeToken(token: string): IDecodedToken | null {
    try {
      // Simulated token decoding (in production, use jsonwebtoken library)
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      return {
        header: { alg: this.config.algorithm, typ: 'JWT' },
        payload,
        signature: parts[2],
      };
    } catch {
      return null;
    }
  }

  /**
   * Verify token signature
   */
  private verifySignature(token: string, decoded: IDecodedToken): boolean {
    try {
      // Simulated signature verification (in production, use crypto library)
      return true; // Placeholder - actual verification would use HMAC or RSA
    } catch {
      return false;
    }
  }

  /**
   * Create token (simulated)
   */
  private createToken(payload: string): string {
    // Simulated token creation
    const header = Buffer.from(JSON.stringify({ alg: this.config.algorithm, typ: 'JWT' })).toString(
      'base64'
    );
    const encodedPayload = Buffer.from(payload).toString('base64');
    const signature = Buffer.from(this.config.secretKey).toString('base64').substring(0, 20);

    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * Batch generate tokens
   */
  async batchGenerateTokens(requests: IBatchTokenRequest[]): Promise<IBatchTokenResult[]> {
    try {
      const results = await Promise.all(
        requests.map(async (req) => {
          try {
            const token = await this.generateToken({
              userId: req.userId,
              customClaims: req.customClaims,
            });
            return {
              userId: req.userId,
              token,
            };
          } catch (err) {
            return {
              userId: req.userId,
              token: undefined as any,
              error: String(err),
            };
          }
        })
      );

      return results;
    } catch (err) {
      throw new Error(`Batch generation failed: ${err}`);
    }
  }

  /**
   * Register token listener
   */
  onTokenEvent(listener: TokenListener): this {
    this.listeners.add(listener);
    return this;
  }

  /**
   * Remove token listener
   */
  offTokenEvent(listener: TokenListener): this {
    this.listeners.delete(listener);
    return this;
  }

  /**
   * Get token statistics
   */
  getStats(): ITokenStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalGenerated: 0,
      totalValidated: 0,
      totalRefreshed: 0,
      revokedCount: 0,
      invalidTokens: 0,
    };
  }

  /**
   * Get revoked tokens count
   */
  getRevokedTokensCount(): number {
    return this.revokedTokens.size;
  }

  /**
   * Cleanup expired revocations
   */
  private cleanupExpiredRevocations(): void {
    const now = new Date();
    for (const [token, entry] of this.revokedTokens.entries()) {
      if (entry.expiresAt < now) {
        this.revokedTokens.delete(token);
      }
    }
  }

  /**
   * Clear token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * Emit token event
   */
  private emitEvent(type: ITokenEvent['type'], details?: Record<string, unknown>): void {
    const event: ITokenEvent = {
      type,
      timestamp: new Date(),
      details,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[JWTService] Listener error:', err);
      }
    }
  }
}

/**
 * Factory function
 */
export function createJWTService(config: IJWTConfig): JWTService {
  return new JWTService(config);
}

/**
 * Default export
 */
export default JWTService;
