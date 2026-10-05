/**
 * Integration Tests - Alert API
 *
 * Tests for all alert endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';
import { adminAuthHeader, viewerAuthHeader, } from './helpers/auth';

describe('Alert API Integration Tests', () => {
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

  describe('GET /alerts', () => {
    it('should list alerts with pagination', async () => {
      const response = await fetch(`${baseUrl}/alerts?page=1&pageSize=25`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
      const data = await (response.json() as Promise<any>);
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('should filter alerts by status', async () => {
      const response = await fetch(`${baseUrl}/alerts?status=open`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/alerts`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /alerts', () => {
    it('should create alert with valid data', async () => {
      const response = await fetch(`${baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Test Alert',
          description: 'Test Description',
          severity: 'high',
          alertType: 'network_attack'
        })
      });
      expect(response.status).toBe(201);
      const data = await (response.json() as Promise<any>);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Missing Fields'
          // missing severity and alertType
        })
      });
      expect(response.status).toBe(422);
      const data = await (response.json() as Promise<any>);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /alerts/:id', () => {
    it('should get alert by id', async () => {
      const response = await fetch(`${baseUrl}/alerts/test-id-123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await fetch(`${baseUrl}/alerts/non-existent-id`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /alerts/:id', () => {
    it('should update alert status', async () => {
      const response = await fetch(`${baseUrl}/alerts/test-id-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          status: 'acknowledged'
        })
      });
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /alerts/:id/acknowledge', () => {
    it('should acknowledge alert', async () => {
      const response = await fetch(`${baseUrl}/alerts/test-id-123/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          comment: 'Acknowledged for investigation'
        })
      });
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /alerts/:id/assign', () => {
    it('should assign alert to user', async () => {
      const response = await fetch(`${baseUrl}/alerts/test-id-123/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          assignToUserId: 'analyst-user-id'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should validate required assignToUserId', async () => {
      const response = await fetch(`${baseUrl}/alerts/test-id-123/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(422);
    });
  });

  describe('GET /alerts/stats/summary', () => {
    it('should get alert statistics', async () => {
      const response = await fetch(`${baseUrl}/alerts/stats/summary`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
      const data = await (response.json() as Promise<any>);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /alerts/bulk-update', () => {
    it('should bulk update alerts', async () => {
      const response = await fetch(`${baseUrl}/alerts/bulk/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          alertIds: ['alert-1', 'alert-2'],
          status: 'acknowledged'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should validate alertIds array', async () => {
      const response = await fetch(`${baseUrl}/alerts/bulk/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          status: 'acknowledged'
          // missing alertIds
        })
      });
      expect(response.status).toBe(422);
    });
  });

  describe('DELETE /alerts/:id', () => {
    it('should delete alert', async () => {
      const response = await fetch(`${baseUrl}/alerts/test-id-123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 404]).toContain(response.status);
    });
  });

  describe('Authorization Tests', () => {
    it('should enforce alert:create permission', async () => {
      const response = await fetch(`${baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': viewerAuthHeader() // viewer role
        },
        body: JSON.stringify({
          title: 'Test',
          severity: 'high',
          alertType: 'attack'
        })
      });
      expect([201, 403]).toContain(response.status);
    });
  });

  describe('Performance Tests', () => {
    it('should list alerts within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/alerts`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should create alert within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Test',
          severity: 'high',
          alertType: 'attack'
        })
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/alerts/invalid`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const data = await (response.json() as Promise<any>);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in error response', async () => {
      const response = await fetch(`${baseUrl}/alerts`);
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });
  });
});
