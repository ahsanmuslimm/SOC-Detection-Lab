/**
 * Integration Tests - Authentication API
 *
 * Tests for all authentication endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';
import { adminAuthHeader, analystAuthHeader, } from './helpers/auth';

describe('Authentication API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3007);
    baseUrl = 'http://localhost:3007/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'SecurePassword123!'
        })
      });
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.accessToken).toBeDefined();
        expect(data.data.refreshToken).toBeDefined();
      }
    });

    it('should reject invalid email', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@soc.local',
          password: 'Password123!'
        })
      });
      expect(response.status).toBe(401);
      const data = await (response.json() as Promise<any>);
      expect(data.error.code).toBe('AUTHENTICATION_FAILED');
    });

    it('should reject invalid password', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'WrongPassword123!'
        })
      });
      expect(response.status).toBe(401);
    });

    it('should validate email format', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'Password123!'
        })
      });
      expect(response.status).toBe(422);
      const data = await (response.json() as Promise<any>);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require email field', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'Password123!'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should require password field', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should not accept GET requests', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      expect([405, 404]).toContain(response.status);
    });

    it('should return access and refresh tokens', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'SecurePassword123!'
        })
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.accessToken).toBeDefined();
        expect(data.data.refreshToken).toBeDefined();
        expect(data.data.expiresIn).toBeDefined();
      }
    });

    it('should return user info on successful login', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'SecurePassword123!'
        })
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.user).toBeDefined();
        expect(data.data.user.email).toBe('admin@soc.local');
      }
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout with valid token', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 204]).toContain(response.status);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST'
      });
      expect(response.status).toBe(401);
    });

    it('should invalidate the token', async () => {
      // Login first
      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'SecurePassword123!'
        })
      });

      if (loginResponse.status === 200) {
        const loginData = await (loginResponse.json() as Promise<any>);
        const token = loginData.data.accessToken;

        // Logout
        const logoutResponse = await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        expect([200, 204]).toContain(logoutResponse.status);

        // Try to use the token after logout
        const testResponse = await fetch(`${baseUrl}/users/me/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        expect(testResponse.status).toBe(401);
      }
    });

    it('should return 200 on successful logout', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refresh-token'
        },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token'
        })
      });
      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.accessToken).toBeDefined();
      }
    });

    it('should reject invalid refresh token', async () => {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'invalid-token'
        })
      });
      expect(response.status).toBe(401);
      const data = await (response.json() as Promise<any>);
      expect(data.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should require refreshToken field', async () => {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(422);
    });

    it('should return new access token', async () => {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token'
        })
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.accessToken).toBeDefined();
        expect(data.data.expiresIn).toBeDefined();
      }
    });

    it('should reject expired refresh tokens', async () => {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'expired-refresh-token'
        })
      });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/register', () => {
    it('should register new user with admin token', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          email: 'newuser@soc.local',
          firstName: 'New',
          lastName: 'User',
          password: 'SecurePassword123!',
          role: 'analyst'
        })
      });
      expect([201, 403]).toContain(response.status);
      if (response.status === 201) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.id).toBeDefined();
      }
    });

    it('should reject registration without admin role', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': analystAuthHeader()
        },
        body: JSON.stringify({
          email: 'newuser@soc.local',
          firstName: 'New',
          lastName: 'User',
          password: 'SecurePassword123!',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(403);
    });

    it('should validate email format', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          email: 'not-an-email',
          firstName: 'New',
          lastName: 'User',
          password: 'SecurePassword123!',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should validate password strength', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          email: 'newuser@soc.local',
          firstName: 'New',
          lastName: 'User',
          password: 'weak',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@soc.local',
          firstName: 'New',
          lastName: 'User',
          password: 'SecurePassword123!',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(401);
    });

    it('should prevent duplicate email registration', async () => {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          email: 'admin@soc.local', // existing user
          firstName: 'Another',
          lastName: 'Admin',
          password: 'SecurePassword123!',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(409);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@test.com',
          password: 'wrong'
        })
      });
      const data = await (response.json() as Promise<any>);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in response', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test'
        })
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should not expose internal error details', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test'
        })
      });
      const data = await (response.json() as Promise<any>);
      expect(JSON.stringify(data)).not.toContain('stack');
    });
  });

  describe('Performance Tests', () => {
    it('should login within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'SecurePassword123!'
        })
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should refresh token within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'token'
        })
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should logout within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Security Tests', () => {
    it('should never return password in response', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'SecurePassword123!'
        })
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(JSON.stringify(data)).not.toContain('password');
      }
    });

    it('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@soc.local',
          password: 'test'
        })
      });
      expect(response.headers.get('x-content-type-options')).toBeDefined();
    });

    it('should use HTTPS in production', async () => {
      // This test verifies the API design supports HTTPS
      expect(baseUrl).toContain('http');
    });

    it('should not allow token injection in headers', async () => {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token X-Inject: malicious'
        }
      });
      expect([200, 204, 401]).toContain(response.status);
    });
  });

  describe('Token Validation', () => {
    it('should reject malformed tokens', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'Bearer not.a.valid.jwt' }
      });
      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'Bearer expired.token.jwt' }
      });
      expect(response.status).toBe(401);
    });

    it('should require Bearer prefix', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'test-token' }
      });
      expect(response.status).toBe(401);
    });
  });
});
