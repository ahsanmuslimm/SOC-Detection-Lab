# Notification Service

Enterprise-grade multi-channel notification system with comprehensive templating, scheduling, delivery tracking, and audit capabilities for delivering notifications across email, SMS, push, in-app messaging, Slack, Teams, and webhooks.

## Overview

The Notification Service provides a robust, scalable framework for managing and delivering notifications across multiple channels. It handles template management, recipient preferences, provider configuration, scheduled delivery, batch processing, and comprehensive delivery tracking and reporting.

## Key Features

### Template Management
- Template registration with variable interpolation
- Multi-channel template definitions
- Version control for templates
- Active/inactive template switching
- Template update tracking

### Recipient Management
- Recipient registration with contact information
- Multi-channel contact preferences
- Do-not-disturb scheduling
- Language and timezone preferences
- Push token management

### Multi-Channel Delivery
- Email delivery via configured providers
- SMS messaging
- Push notifications
- In-app notifications
- Slack webhook integration
- Microsoft Teams webhook integration
- Custom webhook delivery

### Provider Configuration
- Provider registration for each channel
- Flexible provider configuration
- Retry policy management
- Rate limiting configuration
- Provider health monitoring

### Notification Delivery
- Single notification sending
- Batch notification processing
- Priority-based queuing
- Delivery status tracking
- Automatic retry with exponential backoff

### Scheduled Notifications
- One-time scheduled delivery
- Recurring schedule support (daily, weekly, monthly, yearly)
- Time-of-day scheduling
- Do-not-disturb respect
- Schedule management

### Delivery Tracking
- Delivery attempt tracking
- Status transitions (pending → sent → delivered)
- Delivery time metrics
- Failure reason tracking
- Retry attempt monitoring

### Observability & Reporting
- Real-time statistics and metrics
- Delivery success rates
- Channel-specific performance metrics
- Delivery reports by date range
- Failure reason breakdowns

### Audit & Compliance
- Comprehensive audit logging
- Complete action history
- Delivery attempt audit trail
- Compliance reporting
- Traceability

### Event System
- Notification creation events
- Delivery status events
- Listener-based architecture
- Asynchronous event handling
- Event filtering capabilities

## Architecture

### Notification Lifecycle

```
Template Definition
    ↓
Recipient Registration
    ↓
Notification Creation
    ├→ Single Send
    ├→ Batch Send
    └→ Scheduled Send
    ↓
Channel Selection
    └→ Multi-Channel Rendering
    ↓
Provider Selection
    └→ Active Provider Routing
    ↓
Delivery Attempt
    ├→ Successful
    ├→ Failed (Retry)
    └→ Exhausted
    ↓
Delivery Status Update
    ↓
Audit & Metrics
    ↓
History & Reporting
```

### Component Hierarchy

```
NotificationService
├── Template Management
│   ├── Registration
│   ├── Retrieval
│   └── Updates
├── Recipient Management
│   ├── Registration
│   ├── Preferences
│   └── Updates
├── Provider Management
│   ├── Registration
│   ├── Channel Mapping
│   └── Configuration
├── Notification Delivery
│   ├── Rendering
│   ├── Queuing
│   └── Sending
├── Scheduling Engine
│   ├── Recurring Schedules
│   ├── Time-based Execution
│   └── Recurrence Calculation
└── Observability
    ├── Statistics
    ├── Audit Logging
    ├── Delivery Reports
    └── Health Checks
```

## Type Definitions

### INotificationTemplate

```typescript
interface INotificationTemplate {
  templateId: string;
  name: string;
  category: string;
  version: number;
  channels: Record<NotificationChannel, ITemplateContent>;
  variables: ITemplateVariable[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### INotificationRecipient

```typescript
interface INotificationRecipient {
  recipientId: string;
  name: string;
  email?: string;
  phone?: string;
  pushTokens?: string[];
  preferences?: IRecipientPreferences;
}
```

### INotificationProviderConfig

```typescript
interface INotificationProviderConfig {
  providerId: string;
  name: string;
  channel: NotificationChannel;
  isActive: boolean;
  config: Record<string, unknown>;
  retryPolicy?: IRetryPolicy;
  rateLimit?: IRateLimit;
}
```

### INotification

```typescript
interface INotification {
  notificationId: string;
  templateId: string;
  recipients: INotificationRecipient[];
  channels: NotificationChannel[];
  priority: NotificationPriority;
  status: NotificationStatus;
  variables: Record<string, unknown>;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
}
```

## API Reference

### Constructor

```typescript
const service = new NotificationService(config: INotificationServiceConfig);
```

### Template Management

#### Register Template

```typescript
registerTemplate(template: INotificationTemplate): boolean

// Example
const result = service.registerTemplate({
  templateId: 'alert-email',
  name: 'Alert Email',
  category: 'alerts',
  version: 1,
  channels: {
    email: {
      subject: 'Alert: ${alertType}',
      body: 'Severity: ${severity}'
    }
  },
  variables: [
    { name: 'alertType', type: 'string', required: true },
    { name: 'severity', type: 'string', required: true }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
});
```

#### Get Template

```typescript
getTemplate(templateId: string): INotificationTemplate | null

// Example
const template = service.getTemplate('alert-email');
```

#### Update Template

```typescript
updateTemplate(templateId: string, updates: INotificationTemplateUpdate): boolean

// Example
const updated = service.updateTemplate('alert-email', {
  name: 'Updated Alert Email',
  isActive: true
});
```

### Recipient Management

#### Register Recipient

```typescript
registerRecipient(recipient: INotificationRecipient): boolean

// Example
const result = service.registerRecipient({
  recipientId: 'user-123',
  name: 'John Analyst',
  email: 'john@example.com',
  preferences: {
    enabledChannels: ['email', 'slack'],
    timezone: 'UTC'
  }
});
```

#### Get Recipient

```typescript
getRecipient(recipientId: string): INotificationRecipient | null

// Example
const recipient = service.getRecipient('user-123');
```

#### Update Recipient

```typescript
updateRecipient(recipientId: string, updates: IRecipientUpdate): boolean

// Example
const updated = service.updateRecipient('user-123', {
  email: 'john.analyst@example.com'
});
```

### Provider Management

#### Register Provider

```typescript
registerProvider(provider: INotificationProviderConfig): boolean

// Example
const result = service.registerProvider({
  providerId: 'sendgrid',
  name: 'SendGrid Email',
  channel: 'email',
  isActive: true,
  config: { apiKey: 'sg-xxx' },
  retryPolicy: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    backoffType: 'exponential'
  }
});
```

#### Get Provider

```typescript
getProvider(providerId: string): INotificationProviderConfig | null

// Example
const provider = service.getProvider('sendgrid');
```

#### Get Providers by Channel

```typescript
getProvidersByChannel(channel: NotificationChannel): INotificationProviderConfig[]

// Example
const emailProviders = service.getProvidersByChannel('email');
```

### Notification Delivery

#### Send Single Notification

```typescript
async sendNotification(
  templateId: string,
  recipients: INotificationRecipient[],
  channels?: NotificationChannel[],
  priority?: NotificationPriority,
  variables?: Record<string, unknown>,
  createdBy?: string
): Promise<string>

// Example
const notificationId = await service.sendNotification(
  'alert-email',
  [{ recipientId: 'user-123', name: 'John', email: 'john@example.com' }],
  ['email'],
  'high',
  { alertType: 'Malware', severity: 'Critical' },
  'system'
);
```

#### Send Batch Notifications

```typescript
async sendBatchNotifications(
  batch: IBatchNotificationRequest,
  createdBy?: string
): Promise<INotificationBatchResult>

// Example
const result = await service.sendBatchNotifications({
  templateId: 'alert-email',
  recipients: [
    { recipientId: 'user-1', name: 'User 1', email: 'user1@example.com' },
    { recipientId: 'user-2', name: 'User 2', email: 'user2@example.com' }
  ],
  channels: ['email'],
  priority: 'high',
  variables: { alertType: 'Malware' }
});
```

#### Render Notification

```typescript
renderNotification(
  template: INotificationTemplate,
  channel: NotificationChannel,
  variables: Record<string, unknown>
): INotificationRenderResult | null

// Example
const rendered = service.renderNotification(template, 'email', {
  alertType: 'Malware',
  severity: 'High'
});
```

### Notification Management

#### Get Notification

```typescript
getNotification(notificationId: string): INotification | null

// Example
const notification = service.getNotification(notificationId);
```

#### Query Notifications

```typescript
queryNotifications(query: INotificationQuery): INotification[]

// Example
const results = service.queryNotifications({
  templateId: 'alert-email',
  statusFilter: ['sent', 'delivered'],
  priorityFilter: ['critical', 'high'],
  limit: 100
});
```

#### Get Delivery History

```typescript
getDeliveryHistory(notificationId: string, limit?: number): INotificationDeliveryAttempt[]

// Example
const history = service.getDeliveryHistory(notificationId, 50);
```

### Scheduling

#### Schedule Notification

```typescript
scheduleNotification(
  notification: INotification,
  scheduledFor: Date
): boolean

// Example
const scheduled = service.scheduleNotification(notification, new Date(Date.now() + 3600000));
```

#### Create Recurring Schedule

```typescript
createSchedule(schedule: INotificationSchedule): boolean

// Example
const created = service.createSchedule({
  scheduleId: 'daily-report',
  name: 'Daily Report',
  templateId: 'report-template',
  recipients: [recipient],
  channels: ['email'],
  recurrence: {
    type: 'daily',
    timeOfDay: '09:00'
  },
  nextRunAt: new Date(Date.now() + 86400000),
  isActive: true,
  createdAt: new Date(),
  createdBy: 'admin'
});
```

### Observability & Reporting

#### Get Statistics

```typescript
getStats(): INotificationStats

// Example
const stats = service.getStats();
console.log(stats.deliverySuccessRate);
console.log(stats.deliveryByChannel);
```

#### Get Audit Log

```typescript
getAuditLog(limit?: number): INotificationAuditEntry[]

// Example
const auditLog = service.getAuditLog(100);
```

#### Generate Delivery Report

```typescript
generateDeliveryReport(startDate: Date, endDate: Date): IDeliveryReport

// Example
const report = service.generateDeliveryReport(
  new Date(Date.now() - 86400000),
  new Date()
);
```

#### Perform Health Check

```typescript
async performHealthCheck(): Promise<INotificationHealthCheck>

// Example
const health = await service.performHealthCheck();
console.log(health.status);
```

### Event Listeners

#### On Notification Event

```typescript
onNotification(listener: NotificationListener): this

// Example
service.onNotification(async (notification) => {
  console.log(`Notification ${notification.notificationId} created`);
});
```

#### On Delivery Event

```typescript
onDelivery(listener: DeliveryListener): this

// Example
service.onDelivery(async (delivery) => {
  console.log(`Delivery to ${delivery.channel}: ${delivery.status}`);
});
```

## Usage Examples

### Basic Notification Sending

```typescript
// Create service
const service = new NotificationService({
  enableTemplating: true,
  enableScheduling: true,
  enableRetry: true,
  enableAudit: true,
  enableMetrics: true
});

// Register template
service.registerTemplate({
  templateId: 'alert',
  name: 'Alert Template',
  category: 'alerts',
  version: 1,
  channels: {
    email: {
      subject: 'Alert: ${title}',
      body: 'Severity: ${severity}'
    }
  },
  variables: [
    { name: 'title', type: 'string', required: true },
    { name: 'severity', type: 'string', required: true }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
});

// Register recipient
service.registerRecipient({
  recipientId: 'user-1',
  name: 'Analyst',
  email: 'analyst@example.com'
});

// Register provider
service.registerProvider({
  providerId: 'sendgrid',
  name: 'SendGrid',
  channel: 'email',
  isActive: true,
  config: { apiKey: 'sg-xxx' }
});

// Send notification
const notificationId = await service.sendNotification(
  'alert',
  [{ recipientId: 'user-1', name: 'Analyst', email: 'analyst@example.com' }],
  ['email'],
  'high',
  { title: 'Security Alert', severity: 'High' }
);
```

### Multi-Channel Notifications

```typescript
// Template with multiple channels
service.registerTemplate({
  templateId: 'incident',
  name: 'Incident Alert',
  category: 'incidents',
  version: 1,
  channels: {
    email: {
      subject: 'Incident: ${title}',
      body: 'Status: ${status}'
    },
    slack: {
      body: '*Incident*\n${title}\nStatus: ${status}'
    },
    teams: {
      body: '## Incident\n${title}\nStatus: ${status}'
    }
  },
  variables: [
    { name: 'title', type: 'string', required: true },
    { name: 'status', type: 'string', required: true }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
});

// Send across all channels
await service.sendNotification(
  'incident',
  recipients,
  ['email', 'slack', 'teams'],
  'critical',
  { title: 'Data Breach', status: 'Active' }
);
```

### Batch Notifications

```typescript
const result = await service.sendBatchNotifications({
  templateId: 'alert',
  recipients: [
    { recipientId: 'user-1', name: 'User 1', email: 'user1@example.com' },
    { recipientId: 'user-2', name: 'User 2', email: 'user2@example.com' },
    { recipientId: 'user-3', name: 'User 3', email: 'user3@example.com' }
  ],
  channels: ['email'],
  priority: 'high',
  variables: { title: 'System Update', severity: 'Medium' }
});

console.log(`Sent to: ${result.successfulNotifications}/${result.totalRecipients}`);
```

### Scheduled Notifications

```typescript
// Daily report at 9 AM
service.createSchedule({
  scheduleId: 'daily-report',
  name: 'Daily Security Report',
  templateId: 'report',
  recipients: [manager],
  channels: ['email'],
  recurrence: {
    type: 'daily',
    timeOfDay: '09:00'
  },
  nextRunAt: new Date(Date.now() + 86400000),
  isActive: true,
  createdAt: new Date(),
  createdBy: 'admin'
});
```

### Delivery Tracking

```typescript
// Get notification details
const notification = service.getNotification(notificationId);
console.log(`Status: ${notification.status}`);

// Get delivery attempts
const history = service.getDeliveryHistory(notificationId);
history.forEach(attempt => {
  console.log(`${attempt.channel}: ${attempt.status} at ${attempt.sentAt}`);
});

// Generate report
const report = service.generateDeliveryReport(startDate, endDate);
console.log(`Success rate: ${(report.successRate * 100).toFixed(2)}%`);
```

## Configuration

### Service Configuration

```typescript
interface INotificationServiceConfig {
  enableTemplating: boolean;          // Enable template system
  enableScheduling: boolean;          // Enable scheduling
  enableRetry: boolean;              // Enable retry logic
  enableDeduplication: boolean;      // Enable deduplication
  defaultPriority?: NotificationPriority;
  defaultChannels?: NotificationChannel[];
  defaultRetryPolicy?: IRetryPolicy;
  maxQueueSize?: number;             // Default: 10000
  maxDeliveryHistory?: number;       // Default: 100000
  cleanupIntervalMs?: number;        // Default: 3600000
  enableAudit: boolean;              // Enable audit logging
  enableMetrics: boolean;            // Enable metrics
  enableLogging: boolean;            // Enable logging
}
```

### Retry Policy

```typescript
interface IRetryPolicy {
  maxRetries: number;                // Max retry attempts
  initialDelayMs: number;            // Initial delay (ms)
  maxDelayMs: number;                // Max delay (ms)
  backoffMultiplier: number;         // Exponential multiplier
  backoffType: 'exponential' | 'linear';
}
```

### Rate Limiting

```typescript
interface IRateLimit {
  maxPerSecond?: number;
  maxPerMinute?: number;
  maxPerHour?: number;
  maxPerDay?: number;
}
```

## Notification Channels

Supported channels for multi-channel delivery:

- **email** - Email delivery via configured SMTP/API providers
- **sms** - SMS messaging via SMS providers
- **push** - Push notifications via push services
- **in-app** - In-application notifications
- **slack** - Slack webhook integration
- **teams** - Microsoft Teams webhook integration
- **webhook** - Custom webhook delivery

## Best Practices

1. **Template Design**: Create reusable, well-structured templates with clear variable naming
2. **Recipient Preferences**: Respect do-not-disturb schedules and channel preferences
3. **Error Handling**: Implement retry logic for transient failures
4. **Batch Processing**: Use batch APIs for multiple recipients to improve throughput
5. **Monitoring**: Regularly review statistics and delivery reports
6. **Audit Trail**: Enable audit logging for compliance and debugging
7. **Provider Configuration**: Configure appropriate retry policies and rate limits
8. **Channel Selection**: Choose appropriate channels based on urgency and recipient preference
9. **Variables**: Use descriptive variable names and provide default values where applicable
10. **Scheduling**: Plan recurring notifications during business hours when possible

## Performance Characteristics

- **Template Registration**: O(1) lookup
- **Notification Sending**: O(c) where c = number of channels
- **Batch Processing**: O(r) where r = number of recipients
- **Delivery Tracking**: O(1) lookup by notification ID
- **Querying**: O(n) filtering with optional index optimization
- **Reporting**: O(d) aggregation where d = delivery attempts

## Related Services

- **API Gateway**: HTTP routing for notification endpoints
- **Webhook Service**: External event delivery
- **Event Pipeline**: Event processing and enrichment
- **Audit Service**: Comprehensive audit tracking
- **Queue Service**: Background job processing

## Testing

The service includes 40+ comprehensive unit tests covering:

- Template management (registration, retrieval, updates)
- Recipient management (registration, preferences, updates)
- Provider management (registration, routing)
- Single notification sending
- Batch notification processing
- Multi-channel rendering
- Delivery status tracking
- Query and filtering
- Statistics and metrics
- Audit logging
- Health checks
- Event listeners
- Integration flows

## Graceful Shutdown

```typescript
service.stop();
```

Stops internal intervals and allows pending operations to complete gracefully.

## License

Enterprise Grade - All Rights Reserved
