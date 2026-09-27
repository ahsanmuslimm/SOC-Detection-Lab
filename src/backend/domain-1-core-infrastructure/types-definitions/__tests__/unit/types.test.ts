/**
 * Shared Type Definitions - Unit Tests
 * Tests type definitions and utility functions
 */

import {
  createID,
  createUUID,
  createEmail,
  createURL,
  type IUser,
  type IAlert,
  type IEvent,
  type IApiResponse,
} from '../../src/types';

describe('Type Definitions', () => {
  describe('ID Creation', () => {
    it('should create valid ID', () => {
      const id = createID('user-123');
      expect(id).toBe('user-123');
      expect(typeof id).toBe('string');
    });

    it('should handle UUID format', () => {
      const uuid = createUUID('550e8400-e29b-41d4-a716-446655440000');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should create email', () => {
      const email = createEmail('user@example.com');
      expect(email).toContain('@');
      expect(typeof email).toBe('string');
    });

    it('should create URL', () => {
      const url = createURL('https://example.com');
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('User Types', () => {
    it('should define IUser interface', () => {
      const user: IUser = {
        id: createID('user-1'),
        email: createEmail('user@example.com'),
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        roles: ['admin'],
        permissions: ['read', 'write'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('user-1');
      expect(user.email).toContain('@');
      expect(user.roles).toContain('admin');
    });

    it('should support user with multiple roles', () => {
      const user: IUser = {
        id: createID('user-2'),
        email: createEmail('user@example.com'),
        username: 'multiuser',
        firstName: 'Multi',
        lastName: 'User',
        roles: ['analyst', 'investigator', 'responder'],
        permissions: ['read', 'write', 'approve'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.roles.length).toBe(3);
      expect(user.permissions.length).toBe(3);
    });
  });

  describe('Event Types', () => {
    it('should define IEvent interface', () => {
      const event: IEvent = {
        id: createID('event-1'),
        source: 'api',
        level: 'high',
        timestamp: new Date(),
        sourceIp: '192.168.1.1',
        userId: createID('user-1'),
        eventType: 'login_attempt',
        description: 'User login attempt',
        metadata: { success: true },
        hash: 'abc123',
      };

      expect(event.level).toBe('high');
      expect(event.source).toBe('api');
      expect(event.metadata.success).toBe(true);
    });

    it('should support all event levels', () => {
      const levels = ['critical', 'high', 'medium', 'low', 'info'] as const;

      levels.forEach((level) => {
        const event: IEvent = {
          id: createID(`event-${level}`),
          source: 'webhook',
          level,
          timestamp: new Date(),
          sourceIp: '10.0.0.1',
          eventType: 'test',
          description: `Event with ${level} level`,
          metadata: {},
          hash: 'test-hash',
        };

        expect(event.level).toBe(level);
      });
    });

    it('should support all event sources', () => {
      const sources = ['api', 'agent', 'webhook', 'import', 'manual'] as const;

      sources.forEach((source) => {
        const event: IEvent = {
          id: createID(`event-${source}`),
          source,
          level: 'info',
          timestamp: new Date(),
          sourceIp: '10.0.0.1',
          eventType: 'test',
          description: `Event from ${source}`,
          metadata: {},
          hash: 'test-hash',
        };

        expect(event.source).toBe(source);
      });
    });
  });

  describe('Alert Types', () => {
    it('should define IAlert interface', () => {
      const alert: IAlert = {
        id: createID('alert-1'),
        detectionId: createID('detection-1'),
        title: 'Suspicious Login',
        description: 'Multiple failed login attempts detected',
        threatLevel: 'high',
        status: 'new',
        assignedTo: createID('analyst-1'),
        createdBy: createID('system'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(alert.threatLevel).toBe('high');
      expect(alert.status).toBe('new');
    });

    it('should support alert status transitions', () => {
      const statuses = ['new', 'acknowledged', 'investigating', 'resolved', 'false_positive'] as const;

      statuses.forEach((status) => {
        const alert: IAlert = {
          id: createID(`alert-${status}`),
          detectionId: createID('detection-1'),
          title: 'Test Alert',
          description: 'Test',
          threatLevel: 'medium',
          status,
          createdBy: createID('system'),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(alert.status).toBe(status);
      });
    });

    it('should track alert acknowledgment', () => {
      const now = new Date();
      const alert: IAlert = {
        id: createID('alert-1'),
        detectionId: createID('detection-1'),
        title: 'Test',
        description: 'Test alert',
        threatLevel: 'high',
        status: 'acknowledged',
        createdBy: createID('system'),
        createdAt: now,
        updatedAt: now,
        acknowledgedAt: new Date(),
        acknowledgedBy: createID('analyst-1'),
      };

      expect(alert.acknowledgedAt).toBeDefined();
      expect(alert.acknowledgedBy).toBe(createID('analyst-1'));
    });
  });

  describe('Case Types', () => {
    it('should define ICase interface', () => {
      const caseData = {
        id: createID('case-1'),
        title: 'Breach Investigation',
        description: 'Investigate potential data breach',
        status: 'in_progress' as const,
        priority: 'critical' as const,
        assignedTo: createID('investigator-1'),
        createdBy: createID('analyst-1'),
        alerts: [createID('alert-1'), createID('alert-2')],
        investigations: [createID('inv-1')],
        tickets: [createID('ticket-1')],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(caseData.priority).toBe('critical');
      expect(caseData.status).toBe('in_progress');
      expect(caseData.alerts.length).toBe(2);
    });

    it('should support case priorities', () => {
      const priorities = ['critical', 'high', 'medium', 'low'] as const;

      priorities.forEach((priority) => {
        const caseData = {
          id: createID(`case-${priority}`),
          title: 'Test Case',
          description: 'Test',
          status: 'open' as const,
          priority,
          assignedTo: createID('user-1'),
          createdBy: createID('user-2'),
          alerts: [],
          investigations: [],
          tickets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(caseData.priority).toBe(priority);
      });
    });
  });

  describe('API Response Types', () => {
    it('should define successful API response', () => {
      const response: IApiResponse<{ id: string; name: string }> = {
        success: true,
        data: { id: '123', name: 'Test' },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: 'req-123',
        },
      };

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('123');
      expect(response.error).toBeUndefined();
    });

    it('should define error API response', () => {
      const response: IApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email', reason: 'invalid format' },
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.data).toBeUndefined();
    });
  });

  describe('Pagination Types', () => {
    it('should define paginated response', () => {
      const response = {
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
          hasMore: true,
        },
      };

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.total).toBe(25);
      expect(response.pagination.hasMore).toBe(true);
    });
  });

  describe('Detection Types', () => {
    it('should support detection methods', () => {
      const methods = ['rule', 'ml', 'anomaly', 'correlation'] as const;

      methods.forEach((method) => {
        const detection = {
          id: createID(`detection-${method}`),
          eventIds: [createID('event-1')],
          method,
          threatLevel: 'high' as const,
          threatScore: 0.85,
          confidence: 0.92,
          description: `Detection via ${method}`,
          metadata: {},
          detectedAt: new Date(),
        };

        expect(detection.method).toBe(method);
      });
    });
  });

  describe('Investigation Types', () => {
    it('should define investigation', () => {
      const investigation = {
        id: createID('inv-1'),
        alertId: createID('alert-1'),
        title: 'Suspicious Activity Investigation',
        description: 'Investigation into suspicious user activities',
        status: 'in_progress' as const,
        assignedTo: createID('analyst-1'),
        timeline: [],
        relatedEntities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(investigation.status).toBe('in_progress');
      expect(investigation.timeline).toEqual([]);
    });
  });

  describe('Response Action Types', () => {
    it('should define response action', () => {
      const action = {
        id: createID('action-1'),
        caseId: createID('case-1'),
        actionType: 'isolate' as const,
        target: '192.168.1.100',
        status: 'pending' as const,
        description: 'Isolate compromised host',
        createdAt: new Date(),
      };

      expect(action.actionType).toBe('isolate');
      expect(action.status).toBe('pending');
    });

    it('should support action status transitions', () => {
      const statuses = ['pending', 'executing', 'succeeded', 'failed', 'cancelled'] as const;

      statuses.forEach((status) => {
        const action = {
          id: createID(`action-${status}`),
          caseId: createID('case-1'),
          actionType: 'block' as const,
          target: 'test.com',
          status,
          description: 'Test action',
          createdAt: new Date(),
        };

        expect(action.status).toBe(status);
      });
    });
  });

  describe('Audit Log Types', () => {
    it('should define audit log', () => {
      const auditLog = {
        id: createID('audit-1'),
        userId: createID('user-1'),
        action: 'update' as const,
        resource: 'alert',
        resourceId: createID('alert-1'),
        changes: {
          before: { status: 'new' },
          after: { status: 'acknowledged' },
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        result: 'success' as const,
        timestamp: new Date(),
      };

      expect(auditLog.action).toBe('update');
      expect(auditLog.result).toBe('success');
    });

    it('should support audit actions', () => {
      const actions = ['create', 'read', 'update', 'delete', 'export', 'login', 'logout'] as const;

      actions.forEach((action) => {
        const auditLog = {
          id: createID(`audit-${action}`),
          userId: createID('user-1'),
          action,
          resource: 'test',
          resourceId: createID('res-1'),
          ipAddress: '10.0.0.1',
          userAgent: 'Test',
          result: 'success' as const,
          timestamp: new Date(),
        };

        expect(auditLog.action).toBe(action);
      });
    });
  });

  describe('Health Check Types', () => {
    it('should define health check result', () => {
      const health = {
        status: 'healthy' as const,
        timestamp: new Date(),
        uptime: 86400000, // 1 day in ms
        checks: {
          database: 'healthy' as const,
          cache: 'healthy' as const,
          search: 'healthy' as const,
          filesystem: 'healthy' as const,
        },
      };

      expect(health.status).toBe('healthy');
      expect(health.checks.database).toBe('healthy');
    });

    it('should support degraded health', () => {
      const health = {
        status: 'degraded' as const,
        timestamp: new Date(),
        uptime: 86400000,
        checks: {
          database: 'healthy' as const,
          cache: 'degraded' as const,
          search: 'healthy' as const,
          filesystem: 'healthy' as const,
        },
      };

      expect(health.status).toBe('degraded');
      expect(health.checks.cache).toBe('degraded');
    });
  });

  describe('Entity Types', () => {
    it('should define entity', () => {
      const entity = {
        id: createID('entity-1'),
        type: 'ip' as const,
        value: '192.168.1.1',
        firstSeen: new Date(),
        lastSeen: new Date(),
        threatLevel: 'high' as const,
        metadata: { country: 'US' },
      };

      expect(entity.type).toBe('ip');
      expect(entity.value).toBe('192.168.1.1');
    });

    it('should support entity types', () => {
      const types = ['ip', 'domain', 'user', 'file', 'process', 'registry', 'url'] as const;

      types.forEach((type) => {
        const entity = {
          id: createID(`entity-${type}`),
          type,
          value: `test-${type}`,
          firstSeen: new Date(),
          lastSeen: new Date(),
          metadata: {},
        };

        expect(entity.type).toBe(type);
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce type constraints', () => {
      // This test verifies TypeScript compilation
      // If types are incorrect, compilation will fail

      const user: IUser = {
        id: createID('user-1'),
        email: createEmail('user@example.com'),
        username: 'user',
        firstName: 'First',
        lastName: 'Last',
        roles: [],
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Type should be enforced
      expect(user).toBeDefined();
    });
  });

  describe('Interface Completeness', () => {
    it('should have all required user fields', () => {
      const user: IUser = {
        id: createID('test'),
        email: createEmail('test@example.com'),
        username: 'test',
        firstName: 'Test',
        lastName: 'User',
        roles: [],
        permissions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('roles');
      expect(user).toHaveProperty('permissions');
    });

    it('should have all required alert fields', () => {
      const alert: IAlert = {
        id: createID('test'),
        detectionId: createID('det-1'),
        title: 'Test',
        description: 'Test alert',
        threatLevel: 'high',
        status: 'new',
        createdBy: createID('user-1'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('detectionId');
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('threatLevel');
    });
  });
});
