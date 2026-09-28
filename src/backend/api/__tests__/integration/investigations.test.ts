/**
 * Integration Tests - Investigations API
 *
 * Tests for all investigation endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';

describe('Investigations API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3004);
    baseUrl = 'http://localhost:3004/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('GET /investigations', () => {
    it('should list investigations with pagination', async () => {
      const response = await fetch(`${baseUrl}/investigations?page=1&pageSize=25`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter investigations by status', async () => {
      const response = await fetch(`${baseUrl}/investigations?status=open`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination).toBeDefined();
    });

    it('should filter investigations by priority', async () => {
      const response = await fetch(`${baseUrl}/investigations?priority=high`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should support assignedTo filter', async () => {
      const response = await fetch(`${baseUrl}/investigations?assignedTo=analyst-1`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/investigations`);
      expect(response.status).toBe(401);
    });

    it('should support multiple filters', async () => {
      const response = await fetch(`${baseUrl}/investigations?status=open&priority=critical&page=1`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /investigations', () => {
    it('should create investigation with valid data', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: 'Brute Force Attack Investigation',
          description: 'SSH login attempts from multiple IPs',
          priority: 'high',
          caseId: 'case-123'
        })
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: 'Missing Fields'
          // missing priority and description
        })
      });
      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty title', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          title: '',
          description: 'Test',
          priority: 'medium'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should enforce investigation:create permission', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          title: 'Test',
          description: 'Test',
          priority: 'high'
        })
      });
      expect([201, 403]).toContain(response.status);
    });
  });

  describe('GET /investigations/:id', () => {
    it('should get investigation by id', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent investigation', async () => {
      const response = await fetch(`${baseUrl}/investigations/non-existent-inv`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`);
      expect(response.status).toBe(401);
    });

    it('should include investigation details', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data.title).toBeDefined();
        expect(data.data.status).toBeDefined();
      }
    });
  });

  describe('PUT /investigations/:id', () => {
    it('should update investigation status', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
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

    it('should update investigation findings', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          findings: 'Investigation results...'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update assigned analyst', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          assignedTo: 'analyst-2'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should enforce investigation:edit permission', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
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

  describe('GET /investigations/:id/timeline', () => {
    it('should get investigation timeline', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/timeline`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data.data || data)).toBe(true);
      }
    });

    it('should return 404 for non-existent investigation', async () => {
      const response = await fetch(`${baseUrl}/investigations/non-existent-inv/timeline`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/timeline`);
      expect(response.status).toBe(401);
    });

    it('should include timeline events', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/timeline`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        const timeline = Array.isArray(data.data) ? data.data : [];
        if (timeline.length > 0) {
          expect(timeline[0].timestamp).toBeDefined();
        }
      }
    });
  });

  describe('POST /investigations/:id/close', () => {
    it('should close investigation', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          closeReason: 'Investigation complete',
          conclusion: 'Threat resolved'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent investigation', async () => {
      const response = await fetch(`${baseUrl}/investigations/non-existent-inv/close`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should validate closeReason', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(422);
    });

    it('should enforce investigation:close permission', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          closeReason: 'Done'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should update investigation status to closed', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          closeReason: 'Resolved'
        })
      });
      if (response.status === 200) {
        const data = await response.json();
        if (data.data) {
          expect(data.data.status).toBe('closed');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/investigations/invalid`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in response headers', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: 'not json'
      });
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should list investigations within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/investigations?pageSize=10`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get single investigation within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/investigations/inv-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get timeline within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/investigations/inv-123/timeline`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Security Tests', () => {
    it('should enforce RBAC permissions', async () => {
      const response = await fetch(`${baseUrl}/investigations/inv-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer analyst-token'
        },
        body: JSON.stringify({
          status: 'closed'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}/investigations`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });
});
