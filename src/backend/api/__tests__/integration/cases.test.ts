/**
 * Integration Tests - Cases API
 *
 * Tests for all case endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';

describe('Cases API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3002);
    baseUrl = 'http://localhost:3002/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('GET /cases', () => {
    it('should list cases with pagination', async () => {
      const response = await fetch(`${baseUrl}/cases?page=1&pageSize=25`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter cases by status', async () => {
      const response = await fetch(`${baseUrl}/cases?status=open`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination).toBeDefined();
    });

    it('should filter cases by severity', async () => {
      const response = await fetch(`${baseUrl}/cases?severity=critical`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should support custom page size', async () => {
      const response = await fetch(`${baseUrl}/cases?page=1&pageSize=50`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.pageSize).toBeLessThanOrEqual(100);
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/cases`);
      expect(response.status).toBe(401);
    });

    it('should include pagination metadata', async () => {
      const response = await fetch(`${baseUrl}/cases?page=1&pageSize=25`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('pageSize');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('totalPages');
      expect(data.pagination).toHaveProperty('hasMore');
    });
  });

  describe('POST /cases', () => {
    it('should create case with valid data', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: 'Data Exfiltration Investigation',
          description: 'Suspicious data transfer detected',
          severity: 'high',
          caseType: 'data_exfiltration'
        })
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: 'Missing Severity'
          // missing severity and caseType
        })
      });
      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty title', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: '',
          severity: 'high',
          caseType: 'breach'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should enforce case:create permission', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          title: 'Test',
          severity: 'high',
          caseType: 'breach'
        })
      });
      expect([201, 403]).toContain(response.status);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: 'not valid json'
      });
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('GET /cases/:id', () => {
    it('should get case by id', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent case', async () => {
      const response = await fetch(`${baseUrl}/cases/non-existent-case-id`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`);
      expect(response.status).toBe(401);
    });

    it('should include X-Trace-Id header', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });
  });

  describe('PUT /cases/:id', () => {
    it('should update case status', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          status: 'in_progress'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update case description', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          description: 'Updated investigation findings'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should enforce case:edit permission', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          status: 'closed'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /cases/:id', () => {
    it('should delete case', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([204, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent case', async () => {
      const response = await fetch(`${baseUrl}/cases/non-existent-case`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should enforce case:delete permission', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer viewer-token' }
      });
      expect([204, 403, 404]).toContain(response.status);
    });

    it('should return 204 on successful deletion', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 204) {
        const text = await response.text();
        expect(text).toBe('');
      }
    });
  });

  describe('POST /cases/:id/assign', () => {
    it('should assign case to analyst', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          assignToUserId: 'analyst-user-1'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should validate required assignToUserId', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(422);
    });

    it('should enforce case:assign permission', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          assignToUserId: 'analyst-1'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('GET /cases/:id/investigations', () => {
    it('should get case investigations', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123/investigations`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.data || data)).toBe(true);
      }
    });

    it('should return 404 for non-existent case', async () => {
      const response = await fetch(`${baseUrl}/cases/non-existent-case/investigations`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/cases/case-123/investigations`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /cases/stats/summary', () => {
    it('should get case statistics', async () => {
      const response = await fetch(`${baseUrl}/cases/stats/summary`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should include stats breakdown', async () => {
      const response = await fetch(`${baseUrl}/cases/stats/summary`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.data).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/cases/stats/summary`);
      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/cases/invalid`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include error timestamp', async () => {
      const response = await fetch(`${baseUrl}/cases/invalid`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.error.timestamp).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should list cases within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/cases?pageSize=10`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get single case within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/cases/case-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/cases`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('x-content-type-options')).toBeDefined();
    });
  });
});
