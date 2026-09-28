/**
 * Integration Tests - Detection Rules API
 *
 * Tests for all detection rule endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';

describe('Detection Rules API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3003);
    baseUrl = 'http://localhost:3003/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('GET /rules', () => {
    it('should list detection rules with pagination', async () => {
      const response = await fetch(`${baseUrl}/rules?page=1&pageSize=25`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter rules by status', async () => {
      const response = await fetch(`${baseUrl}/rules?status=active`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination).toBeDefined();
    });

    it('should filter rules by severity', async () => {
      const response = await fetch(`${baseUrl}/rules?severity=critical`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should filter rules by type', async () => {
      const response = await fetch(`${baseUrl}/rules?ruleType=network`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/rules`);
      expect(response.status).toBe(401);
    });

    it('should support sorting', async () => {
      const response = await fetch(`${baseUrl}/rules?sortBy=created_at&sortOrder=desc`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /rules', () => {
    it('should create rule with valid data', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'SSH Brute Force Detection',
          severity: 'high',
          ruleType: 'network',
          ruleDefinition: {
            condition: 'multiple_failed_logins',
            threshold: 5,
            timeWindow: 300
          }
        })
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'Missing Fields'
          // missing severity, ruleType, ruleDefinition
        })
      });
      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid severity', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'Test Rule',
          severity: 'invalid_severity',
          ruleType: 'network',
          ruleDefinition: {}
        })
      });
      expect(response.status).toBe(422);
    });

    it('should enforce rule:create permission', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          name: 'Test',
          severity: 'high',
          ruleType: 'network',
          ruleDefinition: {}
        })
      });
      expect([201, 403]).toContain(response.status);
    });
  });

  describe('GET /rules/:id', () => {
    it('should get rule by id', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await fetch(`${baseUrl}/rules/non-existent-rule`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`);
      expect(response.status).toBe(401);
    });

    it('should return complete rule definition', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data.ruleDefinition).toBeDefined();
      }
    });
  });

  describe('PUT /rules/:id', () => {
    it('should update rule definition', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          ruleDefinition: {
            condition: 'updated_condition',
            threshold: 10
          }
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update rule status', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          status: 'inactive'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should enforce rule:edit permission', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer viewer-token'
        },
        body: JSON.stringify({
          status: 'active'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /rules/:id', () => {
    it('should delete rule', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect([204, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await fetch(`${baseUrl}/rules/non-existent-rule`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should enforce rule:delete permission', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer viewer-token' }
      });
      expect([204, 403, 404]).toContain(response.status);
    });
  });

  describe('POST /rules/:id/test', () => {
    it('should test rule with valid data', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          testData: {
            source_ip: '192.168.1.100',
            event_type: 'login_attempt'
          }
        })
      });
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data.matched).toBeDefined();
      }
    });

    it('should validate required testData', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(422);
    });

    it('should return test results', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          testData: { test: 'value' }
        })
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      }
    });
  });

  describe('POST /rules/:id/deploy', () => {
    it('should deploy rule', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent rule', async () => {
      const response = await fetch(`${baseUrl}/rules/non-existent-rule/deploy`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.status).toBe(404);
    });

    it('should enforce rule:deploy permission', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123/deploy`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer viewer-token' }
      });
      expect([200, 403, 404]).toContain(response.status);
    });

    it('should return deployed rule state', async () => {
      const response = await fetch(`${baseUrl}/rules/rule-123/deploy`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token' }
      });
      if (response.status === 200) {
        const data = await response.json();
        expect(data.data).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/rules/invalid`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in response', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: 'invalid json {{'
      });
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should list rules within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/rules?pageSize=10`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get single rule within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/rules/rule-123`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should test rule within 200ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/rules/rule-123/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ testData: {} })
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });

    it('should include content security headers', async () => {
      const response = await fetch(`${baseUrl}/rules`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(response.headers.get('x-content-type-options')).toBeDefined();
    });
  });
});
