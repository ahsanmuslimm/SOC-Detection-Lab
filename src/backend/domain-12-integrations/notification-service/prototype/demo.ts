/**
 * Notification Service - Demonstration Scenarios
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
  IBatchNotificationRequest,
  INotificationSchedule,
  IRecurrencePattern,
} from '../src';

/**
 * Demo 1: Template Registration and Management
 */
async function demo1_TemplateRegistrationAndManagement() {
  console.log('\n=== Demo 1: Template Registration and Management ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Register template
  const alertTemplate: INotificationTemplate = {
    templateId: 'alert-template',
    name: 'Security Alert Template',
    category: 'security',
    version: 1,
    channels: {
      email: {
        subject: 'Security Alert: ${alertType}',
        body: 'Alert severity: ${severity}\nAlert details: ${details}',
      },
      sms: {
        body: '${alertType} alert - Severity: ${severity}',
      },
      slack: {
        body: '*${alertType}*\nSeverity: ${severity}\n${details}',
      },
    },
    variables: [
      { name: 'alertType', type: 'string', required: true, description: 'Type of alert' },
      { name: 'severity', type: 'string', required: true, description: 'Alert severity level' },
      { name: 'details', type: 'string', required: false, description: 'Alert details' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  const registered = service.registerTemplate(alertTemplate);
  console.log(`Template registered: ${registered}`);

  // Get template
  const retrieved = service.getTemplate('alert-template');
  console.log(`\nTemplate details:`, {
    name: retrieved?.name,
    category: retrieved?.category,
    channels: Object.keys(retrieved?.channels || {}),
    variables: retrieved?.variables.length,
    isActive: retrieved?.isActive,
  });

  // Update template
  const updated = service.updateTemplate('alert-template', {
    name: 'Updated Security Alert Template',
  });
  console.log(`\nTemplate updated: ${updated}`);

  const final = service.getTemplate('alert-template');
  console.log(`Updated name: ${final?.name}`);

  service.stop();
}

/**
 * Demo 2: Recipient Management
 */
async function demo2_RecipientManagement() {
  console.log('\n=== Demo 2: Recipient Management ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Register recipients
  const recipients: INotificationRecipient[] = [
    {
      recipientId: 'analyst-1',
      name: 'John Analyst',
      email: 'john@example.com',
      phone: '+1-555-0001',
      preferences: {
        enabledChannels: ['email', 'slack'],
        language: 'en',
      },
    },
    {
      recipientId: 'analyst-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1-555-0002',
      preferences: {
        enabledChannels: ['email', 'sms'],
        doNotDisturb: {
          enabled: true,
          startTime: '18:00',
          endTime: '08:00',
        },
      },
    },
    {
      recipientId: 'manager-1',
      name: 'Security Manager',
      email: 'manager@example.com',
      preferences: {
        enabledChannels: ['email', 'slack', 'teams'],
      },
    },
  ];

  for (const recipient of recipients) {
    const registered = service.registerRecipient(recipient);
    console.log(`✓ Registered: ${recipient.name} (${registered})`);
  }

  // Get recipient
  const retrieved = service.getRecipient('analyst-1');
  console.log(`\nRetrieved recipient:`, {
    name: retrieved?.name,
    email: retrieved?.email,
    channels: retrieved?.preferences?.enabledChannels,
  });

  // Update recipient
  const updated = service.updateRecipient('analyst-1', {
    email: 'john.analyst@example.com',
  });
  console.log(`\nRecipient updated: ${updated}`);

  service.stop();
}

/**
 * Demo 3: Provider Configuration
 */
async function demo3_ProviderConfiguration() {
  console.log('\n=== Demo 3: Provider Configuration ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Register providers
  const providers: INotificationProviderConfig[] = [
    {
      providerId: 'sendgrid-email',
      name: 'SendGrid Email',
      channel: 'email',
      isActive: true,
      config: { apiKey: 'sg-xxx', from: 'alerts@example.com' },
      retryPolicy: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        backoffType: 'exponential',
      },
    },
    {
      providerId: 'twilio-sms',
      name: 'Twilio SMS',
      channel: 'sms',
      isActive: true,
      config: { accountSid: 'twilio-xxx', authToken: 'token-xxx' },
      rateLimit: { maxPerMinute: 60, maxPerHour: 1000 },
    },
    {
      providerId: 'slack-webhook',
      name: 'Slack Webhook',
      channel: 'slack',
      isActive: true,
      config: { webhookUrl: 'https://hooks.slack.com/...' },
    },
    {
      providerId: 'teams-webhook',
      name: 'MS Teams Webhook',
      channel: 'teams',
      isActive: true,
      config: { webhookUrl: 'https://outlook.webhook.office.com/...' },
    },
  ];

  for (const provider of providers) {
    const registered = service.registerProvider(provider);
    console.log(`✓ Registered provider: ${provider.name} (${registered})`);
  }

  // Get providers by channel
  const emailProviders = service.getProvidersByChannel('email');
  console.log(`\nEmail providers: ${emailProviders.length}`);
  emailProviders.forEach((p) => console.log(`  - ${p.name}`));

  const slackProviders = service.getProvidersByChannel('slack');
  console.log(`\nSlack providers: ${slackProviders.length}`);

  service.stop();
}

/**
 * Demo 4: Single Notification Sending
 */
async function demo4_SingleNotificationSending() {
  console.log('\n=== Demo 4: Single Notification Sending ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Setup template
  const template: INotificationTemplate = {
    templateId: 'incident-alert',
    name: 'Incident Alert',
    category: 'incidents',
    version: 1,
    channels: {
      email: {
        subject: 'Incident #${incidentId}: ${title}',
        body: 'Severity: ${severity}\nStatus: ${status}\n\nDescription: ${description}',
      },
    },
    variables: [
      { name: 'incidentId', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'severity', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  // Setup recipient and provider
  const recipient: INotificationRecipient = {
    recipientId: 'analyst-1',
    name: 'John Analyst',
    email: 'john@example.com',
  };

  service.registerRecipient(recipient);

  const provider: INotificationProviderConfig = {
    providerId: 'sendgrid',
    name: 'SendGrid',
    channel: 'email',
    isActive: true,
    config: { apiKey: 'test-key' },
  };

  service.registerProvider(provider);

  // Send notification
  console.log('Sending notification...');
  const notificationId = await service.sendNotification(
    'incident-alert',
    [recipient],
    ['email'],
    'high',
    {
      incidentId: 'INC-001',
      title: 'Unauthorized Access Attempt',
      severity: 'High',
      status: 'Open',
      description: 'Multiple failed login attempts detected from unusual location',
    },
    'system',
  );

  console.log(`\nNotification sent:`, {
    notificationId,
    template: 'incident-alert',
    recipient: recipient.name,
    channels: ['email'],
    priority: 'high',
  });

  // Get notification
  const sent = service.getNotification(notificationId);
  console.log(`\nNotification status: ${sent?.status}`);

  service.stop();
}

/**
 * Demo 5: Batch Notification Sending
 */
async function demo5_BatchNotificationSending() {
  console.log('\n=== Demo 5: Batch Notification Sending ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Setup template
  const template: INotificationTemplate = {
    templateId: 'alert-broadcast',
    name: 'Alert Broadcast',
    category: 'alerts',
    version: 1,
    channels: {
      email: {
        subject: 'Alert: ${alertType}',
        body: 'Alert Type: ${alertType}\nSeverity: ${severity}\nAffected Systems: ${systems}',
      },
    },
    variables: [
      { name: 'alertType', type: 'string', required: true },
      { name: 'severity', type: 'string', required: true },
      { name: 'systems', type: 'string', required: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  // Setup recipients
  const recipients: INotificationRecipient[] = [
    { recipientId: 'user-1', name: 'User 1', email: 'user1@example.com' },
    { recipientId: 'user-2', name: 'User 2', email: 'user2@example.com' },
    { recipientId: 'user-3', name: 'User 3', email: 'user3@example.com' },
    { recipientId: 'user-4', name: 'User 4', email: 'user4@example.com' },
    { recipientId: 'user-5', name: 'User 5', email: 'user5@example.com' },
  ];

  for (const recipient of recipients) {
    service.registerRecipient(recipient);
  }

  const provider: INotificationProviderConfig = {
    providerId: 'sendgrid',
    name: 'SendGrid',
    channel: 'email',
    isActive: true,
    config: { apiKey: 'test-key' },
  };

  service.registerProvider(provider);

  // Send batch
  console.log('Sending batch notification to 5 recipients...');
  const batchRequest: IBatchNotificationRequest = {
    templateId: 'alert-broadcast',
    recipients,
    channels: ['email'],
    priority: 'high',
    variables: {
      alertType: 'System Outage',
      severity: 'Critical',
      systems: 'Mail Server, Web Server',
    },
  };

  const result = await service.sendBatchNotifications(batchRequest);

  console.log(`\nBatch notification results:`, {
    batchId: result.batchId,
    totalRecipients: result.totalRecipients,
    successful: result.successfulNotifications,
    failed: result.failedNotifications,
    pending: result.pendingNotifications,
  });

  service.stop();
}

/**
 * Demo 6: Multi-Channel Rendering
 */
async function demo6_MultiChannelRendering() {
  console.log('\n=== Demo 6: Multi-Channel Rendering ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Template with multiple channels
  const multiChannelTemplate: INotificationTemplate = {
    templateId: 'multi-channel-alert',
    name: 'Multi-Channel Alert',
    category: 'alerts',
    version: 1,
    channels: {
      email: {
        subject: 'Alert: ${title}',
        body: 'Priority: ${priority}\nDetails: ${details}\nAction: ${actionUrl}',
      },
      sms: {
        body: '${title} - ${priority}',
      },
      slack: {
        body: '*Alert*\n*Title:* ${title}\n*Priority:* ${priority}\n*Details:* ${details}',
      },
      teams: {
        body: '## ${title}\n**Priority:** ${priority}\n**Details:** ${details}',
      },
    },
    variables: [
      { name: 'title', type: 'string', required: true },
      { name: 'priority', type: 'string', required: true },
      { name: 'details', type: 'string', required: true },
      { name: 'actionUrl', type: 'string', required: false },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(multiChannelTemplate);

  // Render for each channel
  const variables = {
    title: 'Malware Detected',
    priority: 'High',
    details: 'Suspicious executable found on workstation',
    actionUrl: 'https://dashboard.example.com/alerts/alert-123',
  };

  const channels: Array<'email' | 'sms' | 'slack' | 'teams'> = ['email', 'sms', 'slack', 'teams'];

  console.log('Rendering for multiple channels:\n');

  for (const channel of channels) {
    const rendered = service.renderNotification(multiChannelTemplate, channel, variables);
    console.log(`${channel.toUpperCase()}:`);
    console.log(`  Subject: ${rendered?.subject || 'N/A'}`);
    console.log(`  Body: ${rendered?.body || 'N/A'}`);
    console.log('');
  }

  service.stop();
}

/**
 * Demo 7: Scheduled Notifications
 */
async function demo7_ScheduledNotifications() {
  console.log('\n=== Demo 7: Scheduled Notifications ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Setup
  const template: INotificationTemplate = {
    templateId: 'daily-report',
    name: 'Daily Report',
    category: 'reports',
    version: 1,
    channels: {
      email: {
        subject: 'Daily Security Report - ${date}',
        body: 'Alerts Today: ${alertCount}\nIncidents: ${incidentCount}',
      },
    },
    variables: [
      { name: 'date', type: 'string', required: true },
      { name: 'alertCount', type: 'number', required: true },
      { name: 'incidentCount', type: 'number', required: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  const recipient: INotificationRecipient = {
    recipientId: 'manager-1',
    name: 'Security Manager',
    email: 'manager@example.com',
  };

  service.registerRecipient(recipient);

  const provider: INotificationProviderConfig = {
    providerId: 'sendgrid',
    name: 'SendGrid',
    channel: 'email',
    isActive: true,
    config: { apiKey: 'test-key' },
  };

  service.registerProvider(provider);

  // Create recurring schedule
  const recurrence: IRecurrencePattern = {
    type: 'daily',
    interval: 1,
    timeOfDay: '09:00',
  };

  const schedule: INotificationSchedule = {
    scheduleId: 'daily-report-1',
    name: 'Daily Report Schedule',
    description: 'Send daily security report every morning',
    templateId: 'daily-report',
    recipients: [recipient],
    channels: ['email'],
    recurrence,
    nextRunAt: new Date(Date.now() + 86400000), // Tomorrow 9 AM
    isActive: true,
    createdAt: new Date(),
    createdBy: 'admin',
  };

  const created = service.createSchedule(schedule);
  console.log(`Schedule created: ${created}`);
  console.log(`\nSchedule details:`, {
    scheduleId: schedule.scheduleId,
    name: schedule.name,
    recurrence: schedule.recurrence?.type,
    interval: schedule.recurrence?.interval,
    timeOfDay: schedule.recurrence?.timeOfDay,
    nextRunAt: schedule.nextRunAt.toISOString(),
  });

  service.stop();
}

/**
 * Demo 8: Statistics and Metrics
 */
async function demo8_StatisticsAndMetrics() {
  console.log('\n=== Demo 8: Statistics and Metrics ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Setup
  const template: INotificationTemplate = {
    templateId: 'test-template',
    name: 'Test Template',
    category: 'test',
    version: 1,
    channels: {
      email: { body: 'Test notification' },
      sms: { body: 'Test SMS' },
    },
    variables: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  // Send multiple notifications
  for (let i = 1; i <= 3; i++) {
    const recipient: INotificationRecipient = {
      recipientId: `user-${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
    };

    service.registerRecipient(recipient);

    const provider: INotificationProviderConfig = {
      providerId: `provider-${i}`,
      name: `Provider ${i}`,
      channel: i === 1 ? 'email' : 'sms',
      isActive: true,
      config: { apiKey: 'test' },
    };

    service.registerProvider(provider);

    await service.sendNotification('test-template', [recipient], [i === 1 ? 'email' : 'sms']);
  }

  // Get statistics
  const stats = service.getStats();

  console.log('Notification Service Statistics:');
  console.log(`  Total Notifications: ${stats.totalNotifications}`);
  console.log(`  Sent: ${stats.sentNotifications}`);
  console.log(`  Delivered: ${stats.deliveredNotifications}`);
  console.log(`  Failed: ${stats.failedNotifications}`);
  console.log(`  Pending: ${stats.pendingNotifications}`);
  console.log(`  Success Rate: ${(stats.deliverySuccessRate * 100).toFixed(2)}%`);
  console.log(`  Avg Delivery Time: ${stats.averageDeliveryTimeMs.toFixed(0)}ms`);

  console.log(`\nDeliveries by Channel:`, stats.deliveryByChannel);
  console.log(`\nDeliveries by Status:`, stats.deliveryByStatus);

  service.stop();
}

/**
 * Demo 9: Audit Logging
 */
async function demo9_AuditLogging() {
  console.log('\n=== Demo 9: Audit Logging ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Setup and send
  const template: INotificationTemplate = {
    templateId: 'audit-test',
    name: 'Audit Test',
    category: 'test',
    version: 1,
    channels: { email: { body: 'Test' } },
    variables: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  const recipient: INotificationRecipient = {
    recipientId: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  };

  service.registerRecipient(recipient);

  const provider: INotificationProviderConfig = {
    providerId: 'test-provider',
    name: 'Test',
    channel: 'email',
    isActive: true,
    config: {},
  };

  service.registerProvider(provider);

  const notificationId = await service.sendNotification('audit-test', [recipient]);

  // Get audit log
  const auditLog = service.getAuditLog(10);

  console.log('Audit Log Entries:');
  auditLog.forEach((entry) => {
    console.log(`\n  [${entry.timestamp.toISOString()}] ${entry.action.toUpperCase()}`);
    console.log(`    Notification: ${entry.notificationId}`);
    if (entry.details) {
      console.log(`    Details: ${JSON.stringify(entry.details)}`);
    }
  });

  service.stop();
}

/**
 * Demo 10: Event Listeners
 */
async function demo10_EventListeners() {
  console.log('\n=== Demo 10: Event Listeners ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);
  const events: string[] = [];

  // Add listeners
  service.onNotification(async (notification) => {
    events.push(`[Notification] ${notification.notificationId} - Status: ${notification.status}`);
  });

  service.onDelivery(async (delivery) => {
    events.push(`[Delivery] ${delivery.attemptId} - ${delivery.channel} - ${delivery.status}`);
  });

  // Setup and send
  const template: INotificationTemplate = {
    templateId: 'listener-test',
    name: 'Listener Test',
    category: 'test',
    version: 1,
    channels: { email: { body: 'Test' } },
    variables: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  const recipient: INotificationRecipient = {
    recipientId: 'user-1',
    name: 'Test',
    email: 'test@example.com',
  };

  service.registerRecipient(recipient);

  const provider: INotificationProviderConfig = {
    providerId: 'test',
    name: 'Test',
    channel: 'email',
    isActive: true,
    config: {},
  };

  service.registerProvider(provider);

  await service.sendNotification('listener-test', [recipient]);

  console.log('Captured Events:');
  events.forEach((e) => console.log(`  ${e}`));

  service.stop();
}

/**
 * Demo 11: Delivery Reports
 */
async function demo11_DeliveryReports() {
  console.log('\n=== Demo 11: Delivery Reports ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);

  // Setup
  const template: INotificationTemplate = {
    templateId: 'report-test',
    name: 'Report Test',
    category: 'test',
    version: 1,
    channels: {
      email: { body: 'Test' },
      sms: { body: 'Test SMS' },
    },
    variables: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(template);

  // Send notifications
  for (let i = 1; i <= 2; i++) {
    const recipient: INotificationRecipient = {
      recipientId: `user-${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
    };

    service.registerRecipient(recipient);

    const provider: INotificationProviderConfig = {
      providerId: `provider-${i}`,
      name: `Provider ${i}`,
      channel: 'email',
      isActive: true,
      config: {},
    };

    service.registerProvider(provider);

    await service.sendNotification('report-test', [recipient]);
  }

  // Generate report
  const startDate = new Date(Date.now() - 3600000);
  const endDate = new Date();

  const report = service.generateDeliveryReport(startDate, endDate);

  console.log('Delivery Report:');
  console.log(`  Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log(`  Total Notifications: ${report.totalNotifications}`);
  console.log(`  Delivered: ${report.deliveredNotifications}`);
  console.log(`  Failed: ${report.failedNotifications}`);
  console.log(`  Pending: ${report.pendingNotifications}`);
  console.log(`  Success Rate: ${(report.successRate * 100).toFixed(2)}%`);
  console.log(`  Avg Delivery Time: ${report.averageDeliveryTimeMs.toFixed(0)}ms`);

  console.log(`\nChannel Performance:`, report.channelPerformance.email);

  service.stop();
}

/**
 * Demo 12: Complete Integration Flow
 */
async function demo12_CompleteIntegrationFlow() {
  console.log('\n=== Demo 12: Complete Integration Flow ===\n');

  const config: INotificationServiceConfig = {
    enableTemplating: true,
    enableScheduling: true,
    enableRetry: true,
    enableDeduplication: true,
    defaultPriority: 'normal',
    defaultChannels: ['email'],
    enableAudit: true,
    enableMetrics: true,
    enableLogging: true,
  };

  const service = createNotificationService(config);
  const flowEvents: string[] = [];

  // Add listeners
  service.onNotification(async (notification) => {
    flowEvents.push(`[Setup] Notification created: ${notification.notificationId}`);
  });

  service.onDelivery(async (delivery) => {
    flowEvents.push(`[Delivery] ${delivery.channel} - ${delivery.status}`);
  });

  // Register templates
  const alertTemplate: INotificationTemplate = {
    templateId: 'incident-template',
    name: 'Incident Alert',
    category: 'incidents',
    version: 1,
    channels: {
      email: {
        subject: 'Incident: ${title}',
        body: 'Status: ${status}\nSeverity: ${severity}',
      },
      slack: {
        body: '*Incident Alert*\n${title}\nStatus: ${status}',
      },
    },
    variables: [
      { name: 'title', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'severity', type: 'string', required: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  service.registerTemplate(alertTemplate);
  flowEvents.push('[Setup] Template registered');

  // Register recipients
  const recipients: INotificationRecipient[] = [
    { recipientId: 'analyst-1', name: 'Analyst 1', email: 'analyst1@example.com' },
    { recipientId: 'manager-1', name: 'Manager', email: 'manager@example.com' },
  ];

  for (const recipient of recipients) {
    service.registerRecipient(recipient);
  }

  flowEvents.push('[Setup] Recipients registered');

  // Register providers
  const providers: INotificationProviderConfig[] = [
    { providerId: 'sendgrid', name: 'SendGrid', channel: 'email', isActive: true, config: {} },
    { providerId: 'slack', name: 'Slack', channel: 'slack', isActive: true, config: {} },
  ];

  for (const provider of providers) {
    service.registerProvider(provider);
  }

  flowEvents.push('[Setup] Providers registered');

  // Send notifications
  const notificationId = await service.sendNotification(
    'incident-template',
    recipients,
    ['email', 'slack'],
    'critical',
    {
      title: 'Data Breach Detected',
      status: 'Active Investigation',
      severity: 'Critical',
    },
    'system',
  );

  flowEvents.push('[Execution] Notifications sent');

  // Query notifications
  const results = service.queryNotifications({
    templateId: 'incident-template',
  });

  flowEvents.push(`[Query] Found ${results.length} notification(s)`);

  // Get statistics
  const stats = service.getStats();
  flowEvents.push(`[Stats] Delivered: ${stats.deliveredNotifications}, Failed: ${stats.failedNotifications}`);

  // Perform health check
  const health = await service.performHealthCheck();
  flowEvents.push(`[Health] Status: ${health.status}`);

  // Display results
  console.log('Complete Integration Flow:\n');
  flowEvents.forEach((event) => console.log(`  ${event}`));

  console.log(`\nFinal Metrics:`, {
    totalNotifications: stats.totalNotifications,
    sent: stats.sentNotifications,
    delivered: stats.deliveredNotifications,
    failed: stats.failedNotifications,
    successRate: `${(stats.deliverySuccessRate * 100).toFixed(2)}%`,
  });

  service.stop();
}

/**
 * Run all demonstrations
 */
async function runAllDemos() {
  try {
    await demo1_TemplateRegistrationAndManagement();
    await demo2_RecipientManagement();
    await demo3_ProviderConfiguration();
    await demo4_SingleNotificationSending();
    await demo5_BatchNotificationSending();
    await demo6_MultiChannelRendering();
    await demo7_ScheduledNotifications();
    await demo8_StatisticsAndMetrics();
    await demo9_AuditLogging();
    await demo10_EventListeners();
    await demo11_DeliveryReports();
    await demo12_CompleteIntegrationFlow();

    console.log('\n=== All demonstrations completed successfully ===\n');
  } catch (error) {
    console.error('Demo execution failed:', error);
  }
}

// Export for testing
export {
  demo1_TemplateRegistrationAndManagement,
  demo2_RecipientManagement,
  demo3_ProviderConfiguration,
  demo4_SingleNotificationSending,
  demo5_BatchNotificationSending,
  demo6_MultiChannelRendering,
  demo7_ScheduledNotifications,
  demo8_StatisticsAndMetrics,
  demo9_AuditLogging,
  demo10_EventListeners,
  demo11_DeliveryReports,
  demo12_CompleteIntegrationFlow,
  runAllDemos,
};
