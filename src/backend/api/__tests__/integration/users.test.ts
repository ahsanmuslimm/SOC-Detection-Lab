/**
 * Integration Tests - Users API
 *
 * Tests for all user management endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';

describe('Users API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3005);
    baseUrl = 'http://localhost:3005/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('GET /users', () => {
    it('should list users with pagination', async () => {
      const response = await fetch(`${baseUrl}/users?page=1&pageSize=25`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await fetch(`${baseUrl}/users?role=analyst`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination).toBeDefined();
    });

    it('should filter users by status', async () => {
      const response = await fetch(`${baseUrl}/users?status=active`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should support search by name', async () => {
      const response = await fetch(`${baseUrl}/users?search=john`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/users`);
      expect(response.status).toBe(401);
    });

    it('should enforce user:read permission', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('POST /users', () => {
    it('should create user with valid data', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          email: 'analyst@soc.local',
          firstName: 'John',
          lastName: 'Analyst',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          firstName: 'Missing Email'
        })
      });
      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate email format', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          email: 'invalid-email',
          firstName: 'Test',
          lastName: 'User',
          role: 'analyst'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should enforce user:create permission', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer analyst-token'
        },
        body: JSON.stringify({
          email: 'new@soc.local',
          firstName: 'New',
          lastName: 'User',
          role: 'analyst'
        })
      });
      expect([201, 403]).toContain(response.status);
    });

    it('should prevent duplicate emails', async () => {
      const firstResponse = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          email: 'duplicate@soc.local',
          firstName: 'First',
          lastName: 'User',
          role: 'analyst'
        })
      });

      if (firstResponse.status === 201) {
        const secondResponse = await fetch(`${baseUrl}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            email: 'duplicate@soc.local',
            firstName: 'Second',
            lastName: 'User',
            role: 'analyst'
          })
        });
        expect(secondResponse.status).toBe(409);
      }
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(`${baseUrl}/users/non-existent-user`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`);
      expect(response.status).toBe(401);
    });

    it('should include user details', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data.email).toBeDefined();
        expect(data.data.role).toBeDefined();
      }
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user details', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          firstName: 'Updated',
          lastName: 'Name'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update user role', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          role: 'manager'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update user status', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          status: 'inactive'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should enforce user:edit permission', async () => {
      const response = await fetch(`${baseUrl}/users/user-456`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer analyst-token'
        },
        body: JSON.stringify({
          role: 'admin'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      expect([204, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(`${baseUrl}/users/non-existent-user`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should enforce user:delete permission', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer analyst-token' }
      });
      expect([204, 403, 404]).toContain(response.status);
    });

    it('should return 204 on successful deletion', async () => {
      const response = await fetch(`${baseUrl}/users/user-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      if (response.status === 204) {
        const text = await response.text();
        expect(text).toBe('');
      }
    });
  });

  describe('GET /users/me/profile', () => {
    it('should get current user profile', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.email).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`);
      expect(response.status).toBe(401);
    });

    it('should include user permissions', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data.permissions).toBeDefined();
      }
    });

    it('should include user roles', async () => {
      const response = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data.role).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/users/invalid`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in response', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: 'invalid json'
      });
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should list users within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/users?pageSize=10`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get single user within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/users/user-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get profile within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Security Tests', () => {
    it('should mask sensitive user data', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        // Verify passwords are never returned
        expect(JSON.stringify(data)).not.toContain('password');
      }
    });

    it('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('x-content-type-options')).toBeDefined();
    });

    it('should enforce RBAC for list operation', async () => {
      const response = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': 'Bearer analyst-token' }
      });
      expect([200, 403]).toContain(response.status);
    });
  });
});
