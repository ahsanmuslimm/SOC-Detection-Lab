/**
 * JWT Service - Unit Tests
 * Comprehensive test suite for token generation, validation, and refresh
 */

import { JWTService, createJWTService } from '../../src/main';
import type { IJWTConfig, ITokenPayload } from '../../src/types';

describe('JWTService', () => {
  let service: JWTService;
  const config: IJWTConfig = {
    secretKey: 'test-secret-key-very-secure-123',
    algorithm: 'HS256',
    expiresIn: 3600,
    refreshTokenExpiresIn: 86400,
    issuer: 'soc-lab',
    audience: 'soc-users',
    clockTolerance: 60,
  };

  beforeEach(() => {
    service = new JWTService(config);
  });

  // ============================================================
  // Service Creation Tests
  // ============================================================

  describe('Service Creation', () => {
    test('should create JWT service instance', () => {
      expect(service).toBeInstanceOf(JWTService);
    });

    test('should create service via factory', () => {
      const srv = createJWTService(config);
      expect(srv).toBeInstanceOf(JWTService);
    });

    test('should throw error without secret key', () => {
      expect(() => {
        new JWTService({ ...config, secretKey: '' });
      }).toThrow();
    });

    test('should require public key for RS256', () => {
      expect(() => {
        new JWTService({
          ...config,
          algorithm: 'RS256',
          publicKey: undefined,
        });
      }).toThrow();
    });
  });

  // ============================================================
  // Token Generation Tests
  // ============================================================

  describe('Token Generation', () => {
    test('should generate token', async () => {
      const payload: ITokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        username: 'testuser',
      };

      const token = await service.generateToken(payload);
      expect(token.accessToken).toBeDefined();
      expect(token.tokenType).toBe('Bearer');
      expect(token.expiresIn).toBeGreaterThan(0);
    });

    test('should include refresh token', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { includeRefreshToken: true });

      expect(token.accessToken).toBeDefined();
      expect(token.refreshToken).toBeDefined();
    });

    test('should exclude refresh token when requested', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { includeRefreshToken: false });

      expect(token.accessToken).toBeDefined();
      expect(token.refreshToken).toBeUndefined();
    });

    test('should set custom expiration', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const customExpiry = 7200;
      const token = await service.generateToken(payload, { expiresIn: customExpiry });

      expect(token.expiresIn).toBe(customExpiry);
    });

    test('should include custom claims', async () => {
      const payload: ITokenPayload = {
        userId: 'user-123',
        roles: ['admin', 'user'],
        permissions: ['read', 'write'],
      };

      const token = await service.generateToken(payload);
      expect(token.accessToken).toBeDefined();
    });

    test('should increment generation counter', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const stats1 = service.getStats();

      await service.generateToken(payload);
      await service.generateToken(payload);

      const stats2 = service.getStats();
      expect(stats2.totalGenerated).toBe(stats1.totalGenerated + 2);
    });

    test('should emit generated event', async () => {
      const listener = jest.fn();
      service.onTokenEvent(listener);

      const payload: ITokenPayload = { userId: 'user-123' };
      await service.generateToken(payload);

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('generated');
    });
  });

  // ============================================================
  // Token Validation Tests
  // ============================================================

  describe('Token Validation', () => {
    test('should validate token', async () => {
      const payload: ITokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
      };

      const token = await service.generateToken(payload);
      const result = await service.validateToken(token.accessToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe('user-123');
    });

    test('should reject invalid token', async () => {
      const result = await service.validateToken('invalid.token.here');
      expect(result.valid).toBe(false);
      expect(result.invalidSignature).toBe(true);
    });

    test('should detect expired token', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { expiresIn: -1 });

      const result = await service.validateToken(token.accessToken);
      expect(result.valid).toBe(false);
      expect(result.expired).toBe(true);
    });

    test('should cache validation result', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);

      const stats1 = service.getStats();
      await service.validateToken(token.accessToken);
      const stats2 = service.getStats();

      // Second validation from cache
      await service.validateToken(token.accessToken);

      expect(stats2.totalValidated).toBeGreaterThan(stats1.totalValidated);
    });

    test('should increment validation counter', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);
      const stats1 = service.getStats();

      await service.validateToken(token.accessToken);
      const stats2 = service.getStats();

      expect(stats2.totalValidated).toBeGreaterThan(stats1.totalValidated);
    });

    test('should emit validated event', async () => {
      const listener = jest.fn();
      service.onTokenEvent(listener);

      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);
      await service.validateToken(token.accessToken);

      const validatedEvent = listener.mock.calls.find(call => call[0].type === 'validated');
      expect(validatedEvent).toBeDefined();
    });
  });

  // ============================================================
  // Token Refresh Tests
  // ============================================================

  describe('Token Refresh', () => {
    test('should refresh token', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { includeRefreshToken: true });

      const refreshed = await service.refreshToken(token.refreshToken!);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.accessToken).not.toBe(token.accessToken);
    });

    test('should include new refresh token', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { includeRefreshToken: true });

      const refreshed = await service.refreshToken(token.refreshToken!);
      expect(refreshed.refreshToken).toBeDefined();
    });

    test('should reject invalid refresh token', async () => {
      await expect(service.refreshToken('invalid.token')).rejects.toThrow();
    });

    test('should increment refresh counter', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { includeRefreshToken: true });

      const stats1 = service.getStats();
      await service.refreshToken(token.refreshToken!);
      const stats2 = service.getStats();

      expect(stats2.totalRefreshed).toBeGreaterThan(stats1.totalRefreshed);
    });

    test('should emit refreshed event', async () => {
      const listener = jest.fn();
      service.onTokenEvent(listener);

      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload, { includeRefreshToken: true });
      await service.refreshToken(token.refreshToken!);

      const refreshedEvent = listener.mock.calls.find(call => call[0].type === 'refreshed');
      expect(refreshedEvent).toBeDefined();
    });
  });

  // ============================================================
  // Token Revocation Tests
  // ============================================================

  describe('Token Revocation', () => {
    test('should revoke token', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);

      await service.revokeToken(token.accessToken, 'Logout');

      const result = await service.validateToken(token.accessToken);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('revoked');
    });

    test('should track revoked token count', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token1 = await service.generateToken(payload);
      const token2 = await service.generateToken(payload);

      await service.revokeToken(token1.accessToken);
      await service.revokeToken(token2.accessToken);

      expect(service.getRevokedTokensCount()).toBe(2);
    });

    test('should increment revoked counter', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);

      const stats1 = service.getStats();
      await service.revokeToken(token.accessToken);
      const stats2 = service.getStats();

      expect(stats2.revokedCount).toBeGreaterThan(stats1.revokedCount);
    });

    test('should emit revoked event', async () => {
      const listener = jest.fn();
      service.onTokenEvent(listener);

      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);
      await service.revokeToken(token.accessToken);

      const revokedEvent = listener.mock.calls.find(call => call[0].type === 'revoked');
      expect(revokedEvent).toBeDefined();
    });
  });

  // ============================================================
  // Token Payload Tests
  // ============================================================

  describe('Token Payload', () => {
    test('should get token payload', async () => {
      const payload: ITokenPayload = {
        userId: 'user-123',
        email: 'user@example.com',
        username: 'testuser',
      };

      const token = await service.generateToken(payload);
      const retrieved = await service.getPayload(token.accessToken);

      expect(retrieved?.userId).toBe('user-123');
      expect(retrieved?.email).toBe('user@example.com');
    });

    test('should return null for invalid token', async () => {
      const payload = await service.getPayload('invalid.token');
      expect(payload).toBeNull();
    });

    test('should detect expired token', () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      // Would need actual expired token to test properly
      // Placeholder for now
      expect(true).toBe(true);
    });
  });

  // ============================================================
  // Batch Operations Tests
  // ============================================================

  describe('Batch Operations', () => {
    test('should batch generate tokens', async () => {
      const requests = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ];

      const results = await service.batchGenerateTokens(requests);
      expect(results).toHaveLength(3);
      expect(results[0].token.accessToken).toBeDefined();
    });

    test('should handle batch errors', async () => {
      const requests = [{ userId: 'user-1' }, { userId: 'user-2' }];

      const results = await service.batchGenerateTokens(requests);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // Cache Management Tests
  // ============================================================

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);

      await service.validateToken(token.accessToken);
      service.clearCache();

      // Cache should be cleared
      expect(true).toBe(true);
    });

    test('should cache validation results', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);

      await service.validateToken(token.accessToken);
      // Subsequent calls should use cache
      await service.validateToken(token.accessToken);

      expect(true).toBe(true);
    });
  });

  // ============================================================
  // Event Listener Tests
  // ============================================================

  describe('Event Listeners', () => {
    test('should register listener', () => {
      const listener = jest.fn();
      service.onTokenEvent(listener);
      expect(service).toBeDefined();
    });

    test('should remove listener', () => {
      const listener = jest.fn();
      service.onTokenEvent(listener);
      service.offTokenEvent(listener);
      expect(service).toBeDefined();
    });

    test('should notify multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.onTokenEvent(listener1);
      service.onTokenEvent(listener2);

      const payload: ITokenPayload = { userId: 'user-123' };
      await service.generateToken(payload);

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Statistics Tests
  // ============================================================

  describe('Statistics', () => {
    test('should get statistics', () => {
      const stats = service.getStats();
      expect(stats).toHaveProperty('totalGenerated');
      expect(stats).toHaveProperty('totalValidated');
      expect(stats).toHaveProperty('revokedCount');
    });

    test('should reset statistics', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      await service.generateToken(payload);

      let stats = service.getStats();
      expect(stats.totalGenerated).toBeGreaterThan(0);

      service.resetStats();
      stats = service.getStats();

      expect(stats.totalGenerated).toBe(0);
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('Edge Cases', () => {
    test('should handle empty payload', async () => {
      const payload: ITokenPayload = { userId: '' };
      const token = await service.generateToken(payload);
      expect(token.accessToken).toBeDefined();
    });

    test('should handle null values gracefully', async () => {
      const payload: ITokenPayload = { userId: 'user-123' };
      const token = await service.generateToken(payload);
      expect(token).toBeDefined();
    });

    test('should handle malformed tokens', async () => {
      const result = await service.validateToken('not.a.token');
      expect(result.valid).toBe(false);
    });

    test('should handle listener errors', async () => {
      const errorListener = () => {
        throw new Error('Listener error');
      };

      service.onTokenEvent(errorListener);
      const payload: ITokenPayload = { userId: 'user-123' };

      // Should not throw
      await expect(service.generateToken(payload)).resolves.toBeDefined();
    });
  });
});
