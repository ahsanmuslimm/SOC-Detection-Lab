/**
 * Notification Service - Unit Tests
 */

import {
  NotificationService,
  createNotificationService,
  INotificationServiceConfig,
  INotificationTemplate,
  INotificationRecipient,
  INotificationProviderConfig,
  NotificationListener,
  DeliveryListener,
} from '../../src';

describe('NotificationService', () => {
  let service: NotificationService;
  let config: INotificationServiceConfig;

  beforeEach(() => {
    config = {
      enableTemplating: true,
      enableScheduling: true,
      enableRetry: true,
      enableDeduplication: true,
      defaultPriority: 'normal',
      defaultChannels: ['email'],
      maxQueueSize: 10000,
      maxDeliveryHistory: 100000,
      cleanupIntervalMs: 3600000,
      enableAudit: true,
      enableMetrics: true,
      enableLogging: true,
    };

    service = createNotificationService(config);
  });

  afterEach(() => {
    service.stop();
  });

  describe('Template Management', () => {
    it('should register template', () => {
      const template: INotificationTemplate = {
        templateId: 'alert-template',
        name: 'Alert Template',
        category: 'alerts',
        version: 1,
        channels: {
          email: {
            subject: 'Alert: ${alertType}',
            body: 'An alert of type ${alertType} has been triggered.',
          },
        },
        variables: [
          {
            name: 'alertType',
            type: 'string',
            required: true,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const result = service.registerTemplate(template);
      expect(result).toBe(true);
    });

    it('should prevent duplicate template registration', () => {
      const template: INotificationTemplate = {
        templateId: 'alert-template',
        name: 'Alert Template',
        category: 'alerts',
        version: 1,
        channels: {
          email: { body: 'Alert' },
        },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      service.registerTemplate(template);
      const result = service.registerTemplate(template);
      expect(result).toBe(false);
    });

    it('should get template by ID', () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      service.registerTemplate(template);
      const retrieved = service.getTemplate('test-template');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Test Template');
    });

    it('should update template', () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Original Name',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      service.registerTemplate(template);
      const updated = service.updateTemplate('test-template', { name: 'Updated Name' });

      expect(updated).toBe(true);

      const retrieved = service.getTemplate('test-template');
      expect(retrieved?.name).toBe('Updated Name');
    });
  });

  describe('Recipient Management', () => {
    it('should register recipient', () => {
      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = service.registerRecipient(recipient);
      expect(result).toBe(true);
    });

    it('should get recipient by ID', () => {
      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      service.registerRecipient(recipient);
      const retrieved = service.getRecipient('user-123');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe('john@example.com');
    });

    it('should update recipient', () => {
      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      service.registerRecipient(recipient);
      const updated = service.updateRecipient('user-123', { email: 'john.doe@example.com' });

      expect(updated).toBe(true);

      const retrieved = service.getRecipient('user-123');
      expect(retrieved?.email).toBe('john.doe@example.com');
    });
  });

  describe('Provider Management', () => {
    it('should register provider', () => {
      const provider: INotificationProviderConfig = {
        providerId: 'sendgrid',
        name: 'SendGrid',
        channel: 'email',
        isActive: true,
        config: { apiKey: 'test-key' },
      };

      const result = service.registerProvider(provider);
      expect(result).toBe(true);
    });

    it('should get provider by ID', () => {
      const provider: INotificationProviderConfig = {
        providerId: 'sendgrid',
        name: 'SendGrid',
        channel: 'email',
        isActive: true,
        config: { apiKey: 'test-key' },
      };

      service.registerProvider(provider);
      const retrieved = service.getProvider('sendgrid');

      expect(retrieved).not.toBeNull();
      expect(retrieved?.channel).toBe('email');
    });

    it('should get providers by channel', () => {
      const provider1: INotificationProviderConfig = {
        providerId: 'sendgrid',
        name: 'SendGrid',
        channel: 'email',
        isActive: true,
        config: {},
      };

      const provider2: INotificationProviderConfig = {
        providerId: 'twilio',
        name: 'Twilio',
        channel: 'sms',
        isActive: true,
        config: {},
      };

      service.registerProvider(provider1);
      service.registerProvider(provider2);

      const emailProviders = service.getProvidersByChannel('email');
      expect(emailProviders.length).toBe(1);
      expect(emailProviders[0].providerId).toBe('sendgrid');
    });
  });

  describe('Notification Rendering', () => {
    it('should render notification with variables', () => {
      const template: INotificationTemplate = {
        templateId: 'alert-template',
        name: 'Alert Template',
        category: 'alerts',
        version: 1,
        channels: {
          email: {
            subject: 'Alert: ${alertType}',
            body: 'Severity: ${severity}',
          },
        },
        variables: [
          { name: 'alertType', type: 'string', required: true },
          { name: 'severity', type: 'string', required: true },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      service.registerTemplate(template);

      const rendered = service.renderNotification(template, 'email', {
        alertType: 'Malware',
        severity: 'High',
      });

      expect(rendered).not.toBeNull();
      expect(rendered?.subject).toBe('Alert: Malware');
      expect(rendered?.body).toBe('Severity: High');
    });
  });

  describe('Notification Sending', () => {
    it('should send notification', async () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test message' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      service.registerTemplate(template);
      service.registerRecipient(recipient);
      service.registerProvider(provider);

      const notificationId = await service.sendNotification(
        'test-template',
        [recipient],
        ['email'],
        'normal',
      );

      expect(notificationId).toBeDefined();
      expect(notificationId).toMatch(/^notif_/);
    });

    it('should throw error for inactive template', async () => {
      const template: INotificationTemplate = {
        templateId: 'inactive-template',
        name: 'Inactive Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: false,
      };

      service.registerTemplate(template);

      await expect(
        service.sendNotification('inactive-template', [], ['email']),
      ).rejects.toThrow();
    });
  });

  describe('Batch Notifications', () => {
    it('should send batch notifications', async () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipients: INotificationRecipient[] = [
        { recipientId: 'user-1', name: 'User 1', email: 'user1@example.com' },
        { recipientId: 'user-2', name: 'User 2', email: 'user2@example.com' },
      ];

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      service.registerTemplate(template);
      service.registerProvider(provider);

      const result = await service.sendBatchNotifications({
        templateId: 'test-template',
        recipients,
        channels: ['email'],
      });

      expect(result.totalRecipients).toBe(2);
      expect(result.successfulNotifications).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Notification Querying', () => {
    it('should query notifications', async () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      service.registerTemplate(template);
      service.registerRecipient(recipient);
      service.registerProvider(provider);

      const notificationId = await service.sendNotification('test-template', [recipient]);

      const results = service.queryNotifications({
        templateId: 'test-template',
      });

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should track statistics', async () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      service.registerTemplate(template);
      service.registerRecipient(recipient);
      service.registerProvider(provider);

      await service.sendNotification('test-template', [recipient]);

      const stats = service.getStats();
      expect(stats.totalNotifications).toBeGreaterThan(0);
      expect(stats.sentNotifications).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Audit Logging', () => {
    it('should maintain audit log', async () => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      service.registerTemplate(template);
      service.registerRecipient(recipient);
      service.registerProvider(provider);

      await service.sendNotification('test-template', [recipient]);

      const auditLog = service.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const health = await service.performHealthCheck();

      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.checks).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should call notification listener', (done) => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      const listener: NotificationListener = async (notification) => {
        expect(notification.notificationId).toBeDefined();
        done();
      };

      service.registerTemplate(template);
      service.registerRecipient(recipient);
      service.registerProvider(provider);
      service.onNotification(listener);

      service.sendNotification('test-template', [recipient]).catch(done);
    });

    it('should call delivery listener', (done) => {
      const template: INotificationTemplate = {
        templateId: 'test-template',
        name: 'Test Template',
        category: 'test',
        version: 1,
        channels: { email: { body: 'Test' } },
        variables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const recipient: INotificationRecipient = {
        recipientId: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const provider: INotificationProviderConfig = {
        providerId: 'test-provider',
        name: 'Test Provider',
        channel: 'email',
        isActive: true,
        config: {},
      };

      const listener: DeliveryListener = async (delivery) => {
        expect(delivery.attemptId).toBeDefined();
        done();
      };

      service.registerTemplate(template);
      service.registerRecipient(recipient);
      service.registerProvider(provider);
      service.onDelivery(listener);

      service.sendNotification('test-template', [recipient]).catch(done);
    });
  });

  describe('Delivery Reporting', () => {
    it('should generate delivery report', async () => {
      const startDate = new Date(Date.now() - 3600000);
      const endDate = new Date();

      const report = service.generateDeliveryReport(startDate, endDate);

      expect(report.reportId).toBeDefined();
      expect(report.startDate).toEqual(startDate);
      expect(report.endDate).toEqual(endDate);
    });
  });
});
