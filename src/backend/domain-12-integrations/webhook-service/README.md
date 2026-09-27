# Webhook Service

Enterprise-grade webhook management and event delivery system with automatic retry, signature verification, filtering, and comprehensive monitoring.

## Overview

The Webhook Service provides a robust webhook infrastructure for delivering events to external systems with built-in reliability, security, and observability features. It supports multiple event types, custom filtering, automatic retries with exponential backoff, and complete audit trails.

## Key Features

### Subscription Management
- Register and manage webhook subscriptions
- Support for multiple event types per subscription
- Custom headers and authentication
- Activate/deactivate subscriptions without deletion
- Subscription search and filtering

### Event Delivery
- Automatic event-to-subscription matching
- Reliable delivery with configurable retry logic
- Exponential and linear backoff strategies
- Custom timeout configuration
- Event batching for bulk operations

### Security
- HMAC signature verification (SHA-256, SHA-512)
- Secret key management
- HTTPS-only enforced
- Audit trail for all operations

### Event Filtering
- Filter events by multiple field criteria
- Support for complex filter operators (equals, contains, regex, numeric comparisons)
- Case-sensitive/insensitive matching
- Nested field path support

### Reliability
- Automatic retry with configurable policies
- Max retry attempts per subscription
- Failed delivery tracking and recovery
- Delivery status transitions (pending → retrying → delivered/failed)

### Observability
- Comprehensive metrics collection
- Per-event-type statistics
- Delivery attempt tracking
- Full audit logging
- Event and delivery listeners
- Health checks

### Integration
- Event listeners for upstream notifications
- Delivery listeners for completion tracking
- Configurable event sources
- Webhook testing capabilities

## Architecture

### Component Structure

```
WebhookService
├── Subscriptions
│   ├── Registration
│   ├── Management (CRUD)
│   └── Filtering
├── Event Processing
│   ├── Event Triggering
│   ├── Subscription Matching
│   ├── Filter Evaluation
│   └── Batch Events
├── Delivery System
│   ├── Delivery Queue
│   ├── Retry Logic
│   ├── HTTP Requests
│   └── Status Tracking
├── Security
│   ├── Signature Generation
│   ├── Secret Management
│   └── HTTPS Enforcement
└── Observability
    ├── Metrics
    ├── Audit Log
    ├── Event Listeners
    └── Health Checks
```

### Event Delivery Flow

```
Event Triggered
    ↓
Find Matching Subscriptions
    ↓
Apply Filters to Event
    ↓
Queue Delivery
    ↓
Perform Delivery Attempt
    ├→ Success (2xx)
    │  └→ Mark as Delivered
    └→ Failure
       ├→ Can Retry?
       │  ├→ Yes: Schedule Retry
       │  └→ No: Mark as Failed
       └→ Mark as Abandoned
    ↓
Record Metrics & Audit
    ↓
Emit Events
```

## Type Definitions

### IWebhookSubscription

```typescript
interface IWebhookSubscription {
  subscriptionId: string;
  name: string;
  description?: string;
  url: string;
  method: WebhookDeliveryMethod;
  eventTypes: WebhookEventType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  secret?: string;
  signingAlgorithm?: WebhookSigningAlgorithm;
  headers?: Record<string, string>;
  retryPolicy?: IWebhookRetryPolicy;
  filters?: IWebhookFilter[];
  maxRetries?: number;
  timeoutMs?: number;
}
```

### IWebhookEventPayload

```typescript
interface IWebhookEventPayload {
  eventId: string;
  eventType: WebhookEventType;
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

### IWebhookDelivery

```typescript
interface IWebhookDelivery {
  deliveryId: string;
  subscriptionId: string;
  event: IWebhookEventPayload;
  status: WebhookDeliveryStatus;
  attempts: IWebhookDeliveryAttempt[];
  createdAt: Date;
  nextRetryAt?: Date;
  completedAt?: Date;
  success: boolean;
}
```

### IWebhookRetryPolicy

```typescript
interface IWebhookRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  backoffType: 'exponential' | 'linear';
}
```

## API Reference

### Constructor

```typescript
const service = new WebhookService(config: IWebhookServiceConfig);
```

**Configuration Options:**
- `enableRetry`: Enable retry logic for failed deliveries
- `enableSignature`: Enable HMAC signature generation
- `defaultMaxRetries`: Default max retries for subscriptions
- `defaultTimeoutMs`: Default timeout for HTTP requests
- `enableAudit`: Enable audit logging
- `enableMetrics`: Enable metrics collection
- `maxSubscriptions`: Maximum subscriptions allowed
- `maxDeliveryHistory`: Maximum delivery history to keep
- `cleanupIntervalMs`: Cleanup interval for old deliveries
- `enableLogging`: Enable logging

### Subscription Management

#### Register Subscription

```typescript
registerSubscription(config: IWebhookSubscriptionConfig, userId: string): IWebhookRegistrationResult

// Example
const result = service.registerSubscription({
  name: 'Alert Webhook',
  url: 'https://example.com/webhooks/alerts',
  eventTypes: ['alert.triggered', 'alert.resolved'],
  secret: 'webhook-secret',
  signingAlgorithm: 'hmac-sha256',
  headers: {
    'Authorization': 'Bearer token'
  },
  retryPolicy: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    backoffType: 'exponential'
  },
  filters: [
    {
      filterId: 'severity',
      field: 'severity',
      operator: 'equals',
      value: 'high'
    }
  ]
}, 'user-123');
```

#### Get Subscription

```typescript
getSubscription(subscriptionId: string): IWebhookSubscription | null

// Example
const subscription = service.getSubscription('webhook_sub_123');
```

#### Get All Subscriptions

```typescript
getAllSubscriptions(): IWebhookSubscription[]

// Example
const all = service.getAllSubscriptions();
```

#### Get Subscriptions by Event Type

```typescript
getSubscriptionsByEventType(eventType: WebhookEventType): IWebhookSubscription[]

// Example
const alertSubs = service.getSubscriptionsByEventType('alert.triggered');
```

#### Update Subscription

```typescript
updateSubscription(
  subscriptionId: string,
  updates: IWebhookSubscriptionUpdate,
  userId: string
): boolean

// Example
const updated = service.updateSubscription(
  'webhook_sub_123',
  {
    name: 'Updated Name',
    url: 'https://example.com/new-webhook',
    eventTypes: ['alert.triggered']
  },
  'user-456'
);
```

#### Delete Subscription

```typescript
deleteSubscription(subscriptionId: string, userId: string): boolean
```

#### Activate Subscription

```typescript
activateSubscription(subscriptionId: string): boolean
```

#### Deactivate Subscription

```typescript
deactivateSubscription(subscriptionId: string): boolean
```

### Event Delivery

#### Trigger Event

```typescript
async triggerEvent(event: IWebhookEventPayload): Promise<void>

// Example
await service.triggerEvent({
  eventId: 'evt-123',
  eventType: 'alert.triggered',
  timestamp: new Date(),
  source: 'detection-engine',
  data: {
    alertId: 'alert-123',
    severity: 'high'
  }
});
```

#### Trigger Batch Events

```typescript
async triggerBatchEvents(batch: IWebhookBatchEventTrigger): Promise<IWebhookBatchDeliveryResult>

// Example
const result = await service.triggerBatchEvents({
  events: [
    { eventId: 'evt-1', eventType: 'alert.triggered', ... },
    { eventId: 'evt-2', eventType: 'alert.triggered', ... }
  ]
});
```

#### Get Delivery History

```typescript
getDeliveryHistory(filter: IWebhookEventFilter): IWebhookDelivery[]

// Example
const deliveries = service.getDeliveryHistory({
  subscriptionId: 'webhook_sub_123',
  status: 'delivered',
  eventType: 'alert.triggered',
  limit: 100
});
```

#### Get Delivery

```typescript
getDelivery(deliveryId: string): IWebhookDelivery | null
```

#### Retry Delivery

```typescript
async retryDelivery(deliveryId: string): Promise<boolean>
```

### Testing

#### Test Webhook

```typescript
async testWebhook(subscriptionId: string): Promise<IWebhookTestResult>

// Example
const testResult = await service.testWebhook('webhook_sub_123');
console.log(`Success: ${testResult.success}`);
console.log(`Response Time: ${testResult.responseTime}ms`);
```

### Observability

#### Get Statistics

```typescript
getStats(): IWebhookStats

// Returns
{
  totalSubscriptions: 10,
  activeSubscriptions: 9,
  totalDeliveries: 1000,
  successfulDeliveries: 950,
  failedDeliveries: 50,
  averageDeliveryTimeMs: 250,
  deliveriesByStatus: { delivered: 950, failed: 50, ... },
  deliveriesByEventType: { 'alert.triggered': 600, ... },
  successRate: 0.95
}
```

#### Get Audit Log

```typescript
getAuditLog(limit: number = 100): IWebhookAuditEntry[]

// Example
const auditLog = service.getAuditLog(50);
```

#### Perform Health Check

```typescript
async performHealthCheck(): Promise<IWebhookHealthCheck>

// Returns
{
  status: 'healthy',
  timestamp: new Date(),
  activeSubscriptions: 10,
  pendingDeliveries: 5,
  failedDeliveries: 2,
  uptime: 3600000,
  checks: [
    { name: 'subscriptions', status: 'healthy' },
    { name: 'delivery_queue', status: 'healthy' }
  ]
}
```

### Event Listeners

#### Add Event Listener

```typescript
onEvent(listener: WebhookEventListener): this

// Example
service.onEvent(async (event) => {
  console.log(`Event triggered: ${event.eventType}`);
});
```

#### Add Delivery Listener

```typescript
onDelivery(listener: WebhookDeliveryListener): this

// Example
service.onDelivery(async (delivery) => {
  if (delivery.success) {
    console.log(`Delivery successful: ${delivery.deliveryId}`);
  }
});
```

## Usage Examples

### Basic Setup

```typescript
import { createWebhookService } from '@soc-detection/webhook-service';

const service = createWebhookService({
  enableRetry: true,
  enableSignature: true,
  defaultMaxRetries: 5,
  defaultTimeoutMs: 10000,
  enableAudit: true,
  enableMetrics: true
});

// Register subscription
const result = service.registerSubscription({
  name: 'My Webhook',
  url: 'https://my-service.com/webhooks',
  eventTypes: ['alert.triggered', 'detection.created'],
  secret: 'my-secret-key'
}, 'user-123');

// Trigger event
await service.triggerEvent({
  eventId: 'evt-123',
  eventType: 'alert.triggered',
  timestamp: new Date(),
  source: 'my-service',
  data: { message: 'Something happened' }
});
```

### Event Filtering

```typescript
// Register with filters
service.registerSubscription({
  name: 'High Severity Alerts',
  url: 'https://example.com/critical',
  eventTypes: ['alert.triggered'],
  filters: [
    {
      filterId: 'severity',
      field: 'severity',
      operator: 'equals',
      value: 'high'
    },
    {
      filterId: 'source',
      field: 'source',
      operator: 'startsWith',
      value: 'prod'
    }
  ]
}, 'user-123');
```

### Custom Retry Policy

```typescript
service.registerSubscription({
  name: 'Webhook',
  url: 'https://example.com/webhook',
  eventTypes: ['alert.triggered'],
  retryPolicy: {
    maxAttempts: 10,
    initialDelayMs: 500,
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    backoffType: 'exponential'
  }
}, 'user-123');
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Processing event: ${event.eventType}`);
});

service.onDelivery(async (delivery) => {
  if (!delivery.success) {
    console.error(`Delivery failed: ${delivery.deliveryId}`);
  }
});
```

### Monitoring

```typescript
// Get metrics
const stats = service.getStats();
console.log(`Success Rate: ${(stats.successRate * 100).toFixed(2)}%`);

// Health check
const health = await service.performHealthCheck();
console.log(`Service Status: ${health.status}`);

// Audit log
const auditLog = service.getAuditLog(100);
auditLog.forEach(entry => {
  console.log(`${entry.action}: ${entry.subscriptionId}`);
});
```

## Supported Event Types

The service supports custom event types, with pre-defined types for:

- `alert.triggered` - Alert triggered
- `alert.resolved` - Alert resolved
- `detection.created` - Detection created
- `detection.updated` - Detection updated
- `detection.resolved` - Detection resolved
- `incident.created` - Incident created
- `incident.updated` - Incident updated
- `incident.closed` - Incident closed
- `user.created` - User created
- `user.updated` - User updated
- `user.deleted` - User deleted
- `policy.created` - Policy created
- `policy.updated` - Policy updated
- `policy.deleted` - Policy deleted

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `{ field: 'status', operator: 'equals', value: 'active' }` |
| `contains` | String contains | `{ field: 'message', operator: 'contains', value: 'error' }` |
| `startsWith` | String starts with | `{ field: 'source', operator: 'startsWith', value: 'prod' }` |
| `endsWith` | String ends with | `{ field: 'filename', operator: 'endsWith', value: '.log' }` |
| `gt` | Greater than | `{ field: 'severity', operator: 'gt', value: 5 }` |
| `lt` | Less than | `{ field: 'count', operator: 'lt', value: 100 }` |
| `gte` | Greater or equal | `{ field: 'score', operator: 'gte', value: 8.5 }` |
| `lte` | Less or equal | `{ field: 'age', operator: 'lte', value: 30 }` |
| `regex` | Regular expression | `{ field: 'email', operator: 'regex', value: '.*@example\\.com' }` |
| `in` | In array | `{ field: 'status', operator: 'in', value: ['active', 'pending'] }` |

## Best Practices

1. **Subscription Organization**: Name subscriptions clearly with their purpose
2. **Filtering**: Use filters to reduce noise and unnecessary deliveries
3. **Retry Policies**: Configure based on criticality (fewer retries for non-critical)
4. **Signatures**: Always use signature verification for production
5. **Timeouts**: Set appropriate timeouts based on endpoint characteristics
6. **Monitoring**: Regularly check metrics and audit logs
7. **Testing**: Use testWebhook() before production use
8. **Cleanup**: Let the service manage delivery history automatically
9. **Error Handling**: Listen for delivery failures and handle appropriately
10. **Rate Limiting**: Consider downstream system capacity when triggering events

## Performance Characteristics

- **Subscription Lookup**: O(1) map-based storage
- **Event Matching**: O(n) where n = active subscriptions
- **Filter Evaluation**: O(m) where m = filter count
- **Delivery Queuing**: O(1) append operation
- **Retry Calculation**: O(1) for exponential/linear backoff

## Related Services

- **API Gateway**: Request routing and middleware
- **Access Control**: Authorization for webhook operations
- **Policy Engine**: Policy-based filtering and rules
- **Audit Service**: Comprehensive audit trail

## Testing

The service includes comprehensive unit tests covering:
- Subscription CRUD operations
- Event triggering and delivery
- Event filtering and matching
- Batch operations
- Retry logic and backoff
- Signature generation
- Metrics collection
- Audit logging
- Health checks
- Integration scenarios

Run tests with:
```bash
npm run test:unit -- webhook-service.test.ts
```

## Cleanup and Maintenance

The service automatically maintains delivery history:
- Max delivery history: 100,000 entries (configurable)
- Cleanup runs at configured interval (default: 1 hour)
- Oldest entries removed first to maintain size limits
- Audit log rotated at 10,000 entries (keeps 5,000)

## Graceful Shutdown

```typescript
service.stop();
```

Call this to stop cleanup intervals and gracefully shutdown the service.

## License

Enterprise Grade - All Rights Reserved
