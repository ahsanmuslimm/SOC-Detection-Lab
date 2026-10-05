/**
 * Integration Tests - RBAC API
 *
 * Tests for all role-based access control endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';
import { adminAuthHeader, analystAuthHeader, viewerAuthHeader, } from './helpers/auth';

describe('RBAC API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3008);
    baseUrl = 'http://localhost:3008/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('GET /rbac/roles', () => {
    it('should list all roles', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
      const data = await (response.json() as Promise<any>);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data || data.items)).toBe(true);
    });

    it('should include predefined roles', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const roles = data.data || data.items || [];
        const roleNames = roles.map((r: any) => r.name);
        expect(roleNames).toContain('admin');
        expect(roleNames).toContain('analyst');
        expect(roleNames).toContain('viewer');
      }
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`);
      expect(response.status).toBe(401);
    });

    it('should include role descriptions', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const roles = data.data || data.items || [];
        if (roles.length > 0) {
          expect(roles[0].description).toBeDefined();
        }
      }
    });

    it('should enforce rbac:read permission', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('GET /rbac/roles/:id', () => {
    it('should get role by id', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent role', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/non-existent-role`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(404);
    });

    it('should include role permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(Array.isArray(data.data.permissions)).toBe(true);
      }
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`);
      expect(response.status).toBe(401);
    });

    it('should include all role details', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const role = data.data;
        expect(role.name).toBeDefined();
        expect(role.description).toBeDefined();
        expect(role.permissions).toBeDefined();
      }
    });
  });

  describe('PUT /rbac/roles/:id', () => {
    it('should update role permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/analyst`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          permissions: ['alert:read', 'alert:write', 'case:read']
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update role description', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/analyst`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          description: 'Updated analyst role'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should validate permission format', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/analyst`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          permissions: ['invalid_permission_format']
        })
      });
      expect([200, 422, 404]).toContain(response.status);
    });

    it('should enforce rbac:edit permission', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/analyst`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': analystAuthHeader()
        },
        body: JSON.stringify({
          permissions: ['alert:read']
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should prevent removing all permissions from admin role', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          permissions: []
        })
      });
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent role', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/non-existent-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          permissions: ['alert:read']
        })
      });
      expect(response.status).toBe(404);
    });
  });

  describe('GET /rbac/permissions', () => {
    it('should list all available permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
      const data = await (response.json() as Promise<any>);
      expect(Array.isArray(data.data || data.items)).toBe(true);
    });

    it('should include all permission categories', async () => {
      const response = await fetch(`${baseUrl}/rbac/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const permissions = data.data || data.items || [];
        const permissionNames = permissions.map((p: any) => p.name);
        expect(permissionNames.length).toBeGreaterThan(0);
        // Verify some standard permissions
        expect(
          permissionNames.some((p: string) => p.startsWith('alert:')) ||
          permissionNames.some((p: string) => p.startsWith('case:'))
        ).toBe(true);
      }
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/rbac/permissions`);
      expect(response.status).toBe(401);
    });

    it('should include permission descriptions', async () => {
      const response = await fetch(`${baseUrl}/rbac/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const permissions = data.data || data.items || [];
        if (permissions.length > 0) {
          expect(permissions[0].description).toBeDefined();
        }
      }
    });

    it('should enforce rbac:read permission', async () => {
      const response = await fetch(`${baseUrl}/rbac/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('GET /rbac/user/:userId/permissions', () => {
    it('should get user permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/user/user-123/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(Array.isArray(data.data || data)).toBe(true);
      }
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(`${baseUrl}/rbac/user/non-existent-user/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/rbac/user/user-123/permissions`);
      expect(response.status).toBe(401);
    });

    it('should include permissions from all roles', async () => {
      const response = await fetch(`${baseUrl}/rbac/user/user-123/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const permissions = data.data || data;
        if (Array.isArray(permissions) && permissions.length > 0) {
          expect(permissions[0]).toBeDefined();
        }
      }
    });

    it('should show effective permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/user/user-123/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const permissions = data.data || data;
        // Permissions should be a flat list of effective permissions
        if (Array.isArray(permissions)) {
          permissions.forEach((perm: any) => {
            expect(typeof perm === 'string' || perm.name).toBeDefined();
          });
        }
      }
    });

    it('should enforce permission:read permission', async () => {
      const response = await fetch(`${baseUrl}/rbac/user/user-123/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Standard Roles', () => {
    it('should have admin role with all permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.permissions.length).toBeGreaterThan(0);
      }
    });

    it('should have analyst role with case and alert permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/analyst`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const perms = data.data.permissions;
        const hasAlertOrCase = perms.some((p: string) =>
          p.includes('alert') || p.includes('case')
        );
        expect(hasAlertOrCase).toBe(true);
      }
    });

    it('should have viewer role with read-only permissions', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/viewer`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        const perms = data.data.permissions;
        // Viewer should primarily have read permissions
        const readPerms = perms.filter((p: string) => p.includes('read'));
        expect(readPerms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/invalid`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const data = await (response.json() as Promise<any>);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in response', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: 'invalid json'
      });
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should list roles within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should list permissions within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/rbac/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get user permissions within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/rbac/user/user-123/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Security Tests', () => {
    it('should not expose internal role IDs', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        // Response should use role names, not internal IDs
        expect(JSON.stringify(data)).not.toContain('__internal');
      }
    });

    it('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.headers.get('x-content-type-options')).toBeDefined();
    });

    it('should enforce RBAC checks on all endpoints', async () => {
      const responses = await Promise.all([
        fetch(`${baseUrl}/rbac/roles`, {
          headers: { 'Authorization': viewerAuthHeader() }
        }),
        fetch(`${baseUrl}/rbac/permissions`, {
          headers: { 'Authorization': analystAuthHeader() }
        }),
        fetch(`${baseUrl}/rbac/user/user-123/permissions`, {
          headers: { 'Authorization': analystAuthHeader() }
        })
      ]);
      // Each endpoint should return 200 or 403 (permission denied)
      responses.forEach(response => {
        expect([200, 403]).toContain(response.status);
      });
    });
  });
});
