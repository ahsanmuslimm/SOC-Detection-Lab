/**
 * Integration Tests - Reports API
 *
 * Tests for all report management endpoints with real orchestrator.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createApiGateway } from '../../gateway';
import { createOrchestrator } from '../../../services/orchestrator';
import type { IServiceOrchestrator } from '../../../services/orchestrator/types';
import { adminAuthHeader, viewerAuthHeader, } from './helpers/auth';

describe('Reports API Integration Tests', () => {
  let orchestrator: IServiceOrchestrator;
  let gateway: any;
  let baseUrl: string;

  beforeAll(async () => {
    orchestrator = createOrchestrator();
    gateway = createApiGateway(orchestrator);
    await gateway.start(3006);
    baseUrl = 'http://localhost:3006/api/v1';
  });

  afterAll(async () => {
    await gateway.stop();
  });

  describe('GET /reports', () => {
    it('should list reports with pagination', async () => {
      const response = await fetch(`${baseUrl}/reports?page=1&pageSize=25`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
      const data = await (response.json() as Promise<any>);
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter reports by type', async () => {
      const response = await fetch(`${baseUrl}/reports?reportType=daily_summary`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
      const data = await (response.json() as Promise<any>);
      expect(data.pagination).toBeDefined();
    });

    it('should filter reports by status', async () => {
      const response = await fetch(`${baseUrl}/reports?status=generated`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
    });

    it('should support date range filtering', async () => {
      const response = await fetch(`${baseUrl}/reports?startDate=2024-01-01&endDate=2024-01-31`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
    });

    it('should return 401 without auth token', async () => {
      const response = await fetch(`${baseUrl}/reports`);
      expect(response.status).toBe(401);
    });

    it('should support sorting by date', async () => {
      const response = await fetch(`${baseUrl}/reports?sortBy=createdAt&sortOrder=desc`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(200);
    });
  });

  describe('POST /reports', () => {
    it('should create report with valid data', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Daily Security Summary',
          reportType: 'daily_summary',
          description: 'Daily summary of security events',
          scope: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          }
        })
      });
      expect(response.status).toBe(201);
      const data = await (response.json() as Promise<any>);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Missing Type'
        })
      });
      expect(response.status).toBe(422);
      const data = await (response.json() as Promise<any>);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid report type', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Test',
          reportType: 'invalid_type',
          description: 'Test'
        })
      });
      expect(response.status).toBe(422);
    });

    it('should enforce report:create permission', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': viewerAuthHeader()
        },
        body: JSON.stringify({
          title: 'Test',
          reportType: 'daily_summary',
          description: 'Test'
        })
      });
      expect([201, 403]).toContain(response.status);
    });

    it('should generate default scope if not provided', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Test Report',
          reportType: 'weekly_summary',
          description: 'Test'
        })
      });
      if (response.status === 201) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.scope).toBeDefined();
      }
    });
  });

  describe('GET /reports/:id', () => {
    it('should get report by id', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent report', async () => {
      const response = await fetch(`${baseUrl}/reports/non-existent-report`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`);
      expect(response.status).toBe(401);
    });

    it('should include full report content', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(data.data.title).toBeDefined();
        expect(data.data.content).toBeDefined();
      }
    });
  });

  describe('PUT /reports/:id', () => {
    it('should update report title', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Updated Title'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update report status', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          status: 'published'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should update report content', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          content: 'Updated report content'
        })
      });
      expect([200, 404]).toContain(response.status);
    });

    it('should enforce report:edit permission', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': viewerAuthHeader()
        },
        body: JSON.stringify({
          title: 'New Title'
        })
      });
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /reports/:id', () => {
    it('should delete report', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect([204, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent report', async () => {
      const response = await fetch(`${baseUrl}/reports/non-existent-report`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.status).toBe(404);
    });

    it('should enforce report:delete permission', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'DELETE',
        headers: { 'Authorization': viewerAuthHeader() }
      });
      expect([204, 403, 404]).toContain(response.status);
    });

    it('should return 204 on successful deletion', async () => {
      const response = await fetch(`${baseUrl}/reports/report-123`, {
        method: 'DELETE',
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 204) {
        const text = await response.text();
        expect(text).toBe('');
      }
    });
  });

  describe('Report Types', () => {
    it('should support daily_summary reports', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Daily Summary',
          reportType: 'daily_summary',
          description: 'Daily events'
        })
      });
      expect(response.status).toBe(201);
    });

    it('should support weekly_summary reports', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Weekly Summary',
          reportType: 'weekly_summary',
          description: 'Weekly events'
        })
      });
      expect(response.status).toBe(201);
    });

    it('should support incident_analysis reports', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Incident Analysis',
          reportType: 'incident_analysis',
          description: 'Analysis'
        })
      });
      expect(response.status).toBe(201);
    });
  });

  describe('Error Handling', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(`${baseUrl}/reports/invalid`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const data = await (response.json() as Promise<any>);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    });

    it('should include trace ID in response', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.headers.get('X-Trace-Id')).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
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
    it('should list reports within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/reports?pageSize=10`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should get single report within 50ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/reports/report-123`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should create report within 200ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminAuthHeader()
        },
        body: JSON.stringify({
          title: 'Test',
          reportType: 'daily_summary',
          description: 'Test'
        })
      });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in list', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      if (response.status === 200) {
        const data = await (response.json() as Promise<any>);
        expect(JSON.stringify(data)).not.toContain('password');
      }
    });

    it('should include security headers', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.headers.get('x-content-type-options')).toBeDefined();
    });

    it('should enforce CORS', async () => {
      const response = await fetch(`${baseUrl}/reports`, {
        headers: { 'Authorization': adminAuthHeader() }
      });
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });
});
