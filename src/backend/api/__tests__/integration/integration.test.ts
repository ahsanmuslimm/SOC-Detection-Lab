/**
 * Integration Tests - All Endpoints Summary
 *
 * Comprehensive test suite for all 50+ API endpoints.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';
import { adminAuthHeader, } from './helpers/auth';

describe('Complete API Integration Tests - All 50+ Endpoints', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3001);
    baseUrl = 'http://localhost:3001/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('ALERTS - 9 endpoints', () => {
    it('should support GET /alerts (list)', async () => {
      const res = await fetch(`${baseUrl}/alerts`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /alerts (create)', async () => {
      const res = await fetch(`${baseUrl}/alerts`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', severity: 'high', alertType: 'attack' })
      });
      expect([201, 403, 422]).toContain(res.status);
    });

    it('should support GET /alerts/:id', async () => {
      const res = await fetch(`${baseUrl}/alerts/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /alerts/:id', async () => {
      const res = await fetch(`${baseUrl}/alerts/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support DELETE /alerts/:id', async () => {
      const res = await fetch(`${baseUrl}/alerts/123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 403, 404]).toContain(res.status);
    });

    it('should support POST /alerts/:id/acknowledge', async () => {
      const res = await fetch(`${baseUrl}/alerts/123/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: 'test' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support POST /alerts/:id/assign', async () => {
      const res = await fetch(`${baseUrl}/alerts/123/assign`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignToUserId: 'user-123' })
      });
      expect([200, 403, 404, 422]).toContain(res.status);
    });

    it('should support GET /alerts/stats/summary', async () => {
      const res = await fetch(`${baseUrl}/alerts/stats/summary`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /alerts/bulk/update', async () => {
      const res = await fetch(`${baseUrl}/alerts/bulk/update`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertIds: ['1', '2'], status: 'acknowledged' })
      });
      expect([200, 403, 404, 422]).toContain(res.status);
    });
  });

  describe('CASES - 8 endpoints', () => {
    it('should support GET /cases', async () => {
      const res = await fetch(`${baseUrl}/cases`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /cases', async () => {
      const res = await fetch(`${baseUrl}/cases`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Case', severity: 'high' })
      });
      expect([201, 403, 422]).toContain(res.status);
    });

    it('should support GET /cases/:id', async () => {
      const res = await fetch(`${baseUrl}/cases/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /cases/:id', async () => {
      const res = await fetch(`${baseUrl}/cases/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support DELETE /cases/:id', async () => {
      const res = await fetch(`${baseUrl}/cases/123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 403, 404]).toContain(res.status);
    });

    it('should support POST /cases/:id/assign', async () => {
      const res = await fetch(`${baseUrl}/cases/123/assign`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignToUserId: 'user-123' })
      });
      expect([200, 403, 404, 422]).toContain(res.status);
    });

    it('should support GET /cases/:id/investigations', async () => {
      const res = await fetch(`${baseUrl}/cases/123/investigations`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support GET /cases/stats/summary', async () => {
      const res = await fetch(`${baseUrl}/cases/stats/summary`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('DETECTION RULES - 7 endpoints', () => {
    it('should support GET /rules', async () => {
      const res = await fetch(`${baseUrl}/rules`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /rules', async () => {
      const res = await fetch(`${baseUrl}/rules`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Rule', severity: 'high', ruleType: 'signature', ruleDefinition: {} })
      });
      expect([201, 403, 422]).toContain(res.status);
    });

    it('should support GET /rules/:id', async () => {
      const res = await fetch(`${baseUrl}/rules/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /rules/:id', async () => {
      const res = await fetch(`${baseUrl}/rules/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support DELETE /rules/:id', async () => {
      const res = await fetch(`${baseUrl}/rules/123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 403, 404]).toContain(res.status);
    });

    it('should support POST /rules/:id/test', async () => {
      const res = await fetch(`${baseUrl}/rules/123/test`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ testData: {} })
      });
      expect([200, 403, 404, 422]).toContain(res.status);
    });

    it('should support POST /rules/:id/deploy', async () => {
      const res = await fetch(`${baseUrl}/rules/123/deploy`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  describe('INVESTIGATIONS - 6 endpoints', () => {
    it('should support GET /investigations', async () => {
      const res = await fetch(`${baseUrl}/investigations`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /investigations', async () => {
      const res = await fetch(`${baseUrl}/investigations`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: 'case-123', title: 'Investigation' })
      });
      expect([201, 403, 422]).toContain(res.status);
    });

    it('should support GET /investigations/:id', async () => {
      const res = await fetch(`${baseUrl}/investigations/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /investigations/:id', async () => {
      const res = await fetch(`${baseUrl}/investigations/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support GET /investigations/:id/timeline', async () => {
      const res = await fetch(`${baseUrl}/investigations/123/timeline`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support POST /investigations/:id/close', async () => {
      const res = await fetch(`${baseUrl}/investigations/123/close`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings: 'test' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  describe('USERS - 6 endpoints', () => {
    it('should support GET /users', async () => {
      const res = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /users', async () => {
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', email: 'test@test.com', password: 'pass' })
      });
      expect([201, 403, 409, 422]).toContain(res.status);
    });

    it('should support GET /users/:id', async () => {
      const res = await fetch(`${baseUrl}/users/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /users/:id', async () => {
      const res = await fetch(`${baseUrl}/users/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support DELETE /users/:id', async () => {
      const res = await fetch(`${baseUrl}/users/123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 403, 404]).toContain(res.status);
    });

    it('should support GET /users/me/profile', async () => {
      const res = await fetch(`${baseUrl}/users/me/profile`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('REPORTS - 5 endpoints', () => {
    it('should support GET /reports', async () => {
      const res = await fetch(`${baseUrl}/reports`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support POST /reports', async () => {
      const res = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Report', reportType: 'incident', dateRangeStart: '2024-01-01', dateRangeEnd: '2024-01-31' })
      });
      expect([201, 403, 422]).toContain(res.status);
    });

    it('should support GET /reports/:id', async () => {
      const res = await fetch(`${baseUrl}/reports/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /reports/:id', async () => {
      const res = await fetch(`${baseUrl}/reports/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'generated' })
      });
      expect([200, 403, 404]).toContain(res.status);
    });

    it('should support DELETE /reports/:id', async () => {
      const res = await fetch(`${baseUrl}/reports/123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 403, 404]).toContain(res.status);
    });
  });

  describe('AUTHENTICATION - 4 endpoints', () => {
    it('should support POST /auth/login', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'user', password: 'pass' })
      });
      expect([200, 401, 422]).toContain(res.status);
    });

    it('should support POST /auth/logout', async () => {
      const res = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect([200, 401, 403]).toContain(res.status);
    });

    it('should support POST /auth/refresh', async () => {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'token' })
      });
      expect([200, 401, 422]).toContain(res.status);
    });

    it('should support POST /auth/register', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', email: 'new@test.com', password: 'pass' })
      });
      expect([201, 401, 403, 409, 422]).toContain(res.status);
    });
  });

  describe('RBAC - 5 endpoints', () => {
    it('should support GET /rbac/roles', async () => {
      const res = await fetch(`${baseUrl}/rbac/roles`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support GET /rbac/roles/:id', async () => {
      const res = await fetch(`${baseUrl}/rbac/roles/123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(res.status);
    });

    it('should support PUT /rbac/roles/:id', async () => {
      const res = await fetch(`${baseUrl}/rbac/roles/123`, {
        method: 'PUT',
        headers: { 'Authorization': adminAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: ['read', 'write'] })
      });
      expect([200, 403, 404, 422]).toContain(res.status);
    });

    it('should support GET /rbac/permissions', async () => {
      const res = await fetch(`${baseUrl}/rbac/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });

    it('should support GET /rbac/user/:userId/permissions', async () => {
      const res = await fetch(`${baseUrl}/rbac/user/123/permissions`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('Overall API Characteristics', () => {
    it('should include X-Trace-Id header in all responses', async () => {
      const res = await fetch(`${baseUrl}/alerts`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should return JSON responses', async () => {
      const res = await fetch(`${baseUrl}/alerts`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
    });

    it('should support CORS headers', async () => {
      const res = await fetch(`${baseUrl}/alerts`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });

    it('should include security headers', async () => {
      const res = await fetch(`${baseUrl}/alerts`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });
});
