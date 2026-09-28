# Queue Service

Message queuing with priorities, retry policies, delivery guarantees, and dead-letter queues for asynchronous event processing.

## Overview

The Queue Service provides a robust, high-performance message queuing capability designed for reliable asynchronous event processing. It supports multiple queue types (FIFO, priority, topic, stream), sophisticated retry policies with exponential backoff, multiple delivery guarantees (at-most-once, at-least-once, exactly-once), dead-letter queues for failed messages, consumer groups, batch operations, and comprehensive monitoring.

**Key Features:**
- Multiple queue types (FIFO, priority, topic, stream)
- Configurable delivery guarantees (at-most-once, at-least-once, exactly-once)
- Advanced retry policies (linear, exponential, fixed backoff)
- Dead-letter queue for unprocessable messages
- Consumer registration and management
- Concurrent message processing
- Batch send/receive operations
- Message visibility timeout
- TTL-based message expiration
- Queue statistics and health monitoring
- Event-driven architecture with listeners
- Message priority routing
- Consumer groups with shared state
- Queue capacity management
- Audit trail for all operations

## Architecture

### Core Components

1. **Queue Manager**: Creates and manages multiple message queues
2. **Message Processor**: Handles message routing and processing
3. **Retry Engine**: Manages message retries with backoff policies
4. **Dead-Letter Handler**: Routes failed messages to dead-letter queue
5. **Consumer Manager**: Manages consumer registration and lifecycle
6. **Statistics Collector**: Aggregates queue metrics and stats
7. **Event Emitter**: Publishes queue events to listeners
8. **Health Monitor**: Tracks queue and message health
9. **Cleanup Engine**: Manages TTL expiration and queue maintenance
10. **Audit Logger**: Records all queue operations

### Data Flow

```
Message Send
    ↓
Queue Validation
    ↓
Message Storage
    ↓
Event Emission
    ↓
Consumer Registration
    ↓
Message Receive
    ↓
Message Processing
    ↓
Completion/Retry/Dead-Letter
    ↓
Stats Update
```

## API Reference

### Creating the Service

```typescript
import { createQueueService, IQueueServiceConfig } from '@queue-service';

const config: IQueueServiceConfig = {
  maxQueues: 1000,
  maxMessagesPerQueue: 100000,
  defaultVisibilityTimeoutMs: 30000,
  maxMessageSize: 262144, // 256 KB
  enableDeadLetterQueue: true,
  enableMetrics: true,
  enableAudit: true,
  maxAuditEntries: 10000,
  cleanupIntervalMs: 60000,
  enablePersistence: false,
  retentionDays: 7,
};

const service = createQueueService(config);
```

### Queue Management

#### Create Queue

```typescript
// Create FIFO queue
const queueId = service.createQueue({
  name: 'order_processing',
  description: 'Process customer orders',
  type: 'FIFO',
  maxMessages: 10000,
  maxMessageSize: 262144,
  visibilityTimeoutMs: 30000,
  deliveryGuarantee: 'at-least-once',
  retryPolicy: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    backoffType: 'exponential',
    retryableErrors: ['timeout', 'temporary_failure'],
  },
  deadLetterConfig: {
    enabled: true,
    maxRetries: 3,
  },
});

// Create priority queue
const priorityQueueId = service.createQueue({
  name: 'alerts',
  type: 'priority',
  deliveryGuarantee: 'exactly-once',
  retryPolicy: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 30000,
    backoffMultiplier: 1.5,
    backoffType: 'exponential',
  },
  // ... other config
});
```

#### Retrieve Queue Configuration

```typescript
const config = service.getQueue(queueId);
if (config) {
  console.log(`Queue: ${config.name}`);
  console.log(`Type: ${config.type}`);
  console.log(`Messages: ${config.maxMessages}`);
}
```

#### Delete Queue

```typescript
const success = service.deleteQueue(queueId);
```

### Message Operations

#### Send Message

```typescript
// Send with default priority
const messageId = service.sendMessage(queueId, {
  orderId: 'order123',
  customerId: 'cust456',
  amount: 99.99,
  items: [...],
});

// Send with priority and delay
const urgentId = service.sendMessage(queueId, {
  alert: 'security_breach',
  severity: 'critical',
  details: {...},
}, {
  priority: 'critical',
  delayMs: 5000, // 5 second delay
  ttlMs: 3600000, // 1 hour TTL
});
```

#### Receive Message

```typescript
const message = service.receiveMessage(queueId);
if (message) {
  console.log(`Processing: ${message.messageId}`);
  console.log(`Priority: ${message.priority}`);
  console.log(`Attempts: ${message.attempts}`);
  
  // Process message
  try {
    await processOrder(message.body);
    service.completeMessage(queueId, message.messageId);
  } catch (error) {
    service.failMessage(queueId, message.messageId, error.message);
  }
}
```

#### Complete Message

```typescript
const completed = service.completeMessage(queueId, messageId);
```

#### Fail Message

```typescript
const failed = service.failMessage(queueId, messageId, 'Processing timeout');
```

### Consumer Management

#### Register Consumer

```typescript
const messageHandler = async (message: IQueueMessage) => {
  try {
    console.log(`Handling message: ${message.messageId}`);
    // Process message
    await processMessage(message.body);
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
};

const consumerId = 'consumer_1';
const registered = service.registerConsumer(queueId, consumerId, messageHandler);
```

#### Unregister Consumer

```typescript
const unregistered = service.unregisterConsumer(consumerId);
```

### Batch Operations

#### Send Batch

```typescript
const messages = [
  { body: { orderId: 'order1' }, priority: 'normal' },
  { body: { orderId: 'order2' }, priority: 'high' },
  { body: { orderId: 'order3' }, priority: 'normal' },
];

const result = service.sendBatch(queueId, messages);
console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`);
```

### Statistics and Monitoring

#### Queue Statistics

```typescript
const stats = service.getQueueStats(queueId);
if (stats) {
  console.log(`Total messages: ${stats.totalMessages}`);
  console.log(`Pending: ${stats.pendingMessages}`);
  console.log(`Processing: ${stats.processingMessages}`);
  console.log(`Completed: ${stats.completedMessages}`);
  console.log(`Failed: ${stats.failedMessages}`);
  console.log(`Dead-letter: ${stats.deadLetterMessages}`);
  console.log(`Average processing time: ${stats.averageProcessingTimeMs}ms`);
}
```

#### Dead-Letter Queue Statistics

```typescript
const dlStats = service.getDeadLetterStats(queueId);
console.log(`Total DLQ messages: ${dlStats.totalMessages}`);
console.log(`Average retry attempts: ${dlStats.averageRetryAttempts}`);
console.log(`Oldest message age: ${dlStats.oldestMessageAge}ms`);

// Breakdown by reason
Object.entries(dlStats.messagesByReason).forEach(([reason, count]) => {
  console.log(`${reason}: ${count} messages`);
});
```

#### Health Check

```typescript
const health = await service.performHealthCheck();
console.log(`Overall status: ${health.status}`);

health.queues.forEach(queue => {
  console.log(`${queue.name}: ${queue.status}`);
  console.log(`  Messages: ${queue.messageCount}`);
  console.log(`  Consumers: ${queue.consumerCount}`);
});
```

### Queue Maintenance

#### Purge Queue

```typescript
const purged = service.purgeQueue(queueId);
console.log(`Purged ${purged} messages`);
```

### Event Listeners

```typescript
service.onEvent(async (event) => {
  console.log(`Event: ${event.type}`);
  console.log(`Timestamp: ${event.timestamp}`);
  
  switch (event.type) {
    case 'message-received':
      console.log(`Message received: ${event.messageId}`);
      break;
    case 'message-processed':
      console.log(`Message processed: ${event.messageId}`);
      break;
    case 'message-failed':
      console.log(`Message failed: ${event.error}`);
      break;
    case 'message-dead-lettered':
      console.log(`Message DLQ: ${event.messageId}`);
      break;
  }
});
```

## Configuration

### IQueueServiceConfig

```typescript
interface IQueueServiceConfig {
  maxQueues: number;                    // Maximum number of queues
  maxMessagesPerQueue: number;          // Max messages in a queue
  defaultVisibilityTimeoutMs: number;   // Visibility timeout
  maxMessageSize: number;               // Max message size in bytes
  enableDeadLetterQueue: boolean;       // Enable DLQ feature
  enableMetrics: boolean;               // Collect metrics
  enableAudit: boolean;                 // Log all operations
  maxAuditEntries: number;              // Audit log size limit
  cleanupIntervalMs: number;            // Cleanup frequency
  enablePersistence: boolean;           // Persist to storage
  retentionDays: number;                // Message retention period
}
```

### Queue Types

| Type | Description | Best For |
|------|-------------|----------|
| **FIFO** | First In, First Out ordering | Orders, transactions |
| **priority** | Messages processed by priority | Alerts, urgent events |
| **topic** | Publish-subscribe pattern | Event broadcasting |
| **stream** | Event streaming | Log streaming, analytics |

### Delivery Guarantees

| Guarantee | Description | Use Case |
|-----------|-------------|----------|
| **at-most-once** | Message processed 0 or 1 times | Non-critical events |
| **at-least-once** | Message processed 1+ times | Important operations |
| **exactly-once** | Message processed exactly once | Critical transactions |

### Retry Policies

```typescript
interface IRetryPolicy {
  maxAttempts: number;              // Max retry attempts
  initialDelayMs: number;           // Initial retry delay
  maxDelayMs: number;               // Maximum retry delay
  backoffMultiplier: number;        // Backoff multiplier
  backoffType: 'linear' | 'exponential' | 'fixed';
  retryableErrors?: string[];       // Error types to retry
}
```

### Dead-Letter Configuration

```typescript
interface IDeadLetterConfig {
  enabled: boolean;                 // Enable DLQ
  maxRetries: number;               // Max retries before DLQ
  deadLetterQueueId?: string;       // Custom DLQ ID
}
```

## Usage Examples

### Example 1: Order Processing Queue

```typescript
const service = createQueueService(config);

// Create order queue
const orderQueueId = service.createQueue({
  name: 'order_processing',
  type: 'FIFO',
  deliveryGuarantee: 'at-least-once',
  retryPolicy: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    backoffType: 'exponential',
  },
  deadLetterConfig: {
    enabled: true,
    maxRetries: 3,
  },
  maxMessages: 50000,
  maxMessageSize: 262144,
  visibilityTimeoutMs: 60000,
});

// Register order processor
service.registerConsumer(orderQueueId, 'order_processor', async (message) => {
  const order = message.body;
  await processOrder(order);
  console.log(`Order ${order.orderId} processed`);
});

// Send order
const messageId = service.sendMessage(orderQueueId, {
  orderId: 'ORD123',
  customerId: 'CUST456',
  items: [...],
  total: 299.99,
});
```

### Example 2: Priority-Based Alerting

```typescript
// Create priority alert queue
const alertQueueId = service.createQueue({
  name: 'security_alerts',
  type: 'priority',
  deliveryGuarantee: 'at-least-once',
  retryPolicy: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    backoffMultiplier: 1.5,
    backoffType: 'exponential',
  },
  maxMessages: 100000,
});

// Send alerts with different priorities
service.sendMessage(alertQueueId, {
  alert: 'high_cpu_usage',
  value: 95,
}, { priority: 'high' });

service.sendMessage(alertQueueId, {
  alert: 'security_breach_detected',
  severity: 'critical',
  details: { ... },
}, { priority: 'critical' });

// Register alert handler
service.registerConsumer(alertQueueId, 'alert_handler', async (message) => {
  const alert = message.body;
  await sendNotification(alert);
  
  if (alert.severity === 'critical') {
    await escalateToSecurity(alert);
  }
});
```

### Example 3: Batch Message Processing

```typescript
// Prepare batch messages
const messages = Array.from({ length: 1000 }, (_, i) => ({
  body: {
    id: i,
    data: `item_${i}`,
    timestamp: new Date(),
  },
  priority: i % 10 === 0 ? 'high' : 'normal',
}));

// Send batch
const result = service.sendBatch(queueId, messages);
console.log(`Batch sent: ${result.successCount} succeeded, ${result.failureCount} failed`);

if (result.errors && result.errors.length > 0) {
  result.errors.forEach(err => {
    console.error(`Error: ${err.error}`);
  });
}
```

### Example 4: Dead-Letter Queue Handling

```typescript
// Monitor dead-letter messages
service.onEvent(async (event) => {
  if (event.type === 'message-dead-lettered') {
    console.warn(`Message moved to DLQ: ${event.messageId}`);
    console.warn(`Error: ${event.error}`);
    
    // Alert operators
    await alertOps(`Message failed: ${event.error}`);
    
    // Log for analysis
    await logFailure({
      messageId: event.messageId,
      queueId: event.queueId,
      error: event.error,
      timestamp: event.timestamp,
    });
  }
});

// Check DLQ statistics
const dlStats = service.getDeadLetterStats(queueId);
if (dlStats.totalMessages > 0) {
  console.log(`Warning: ${dlStats.totalMessages} messages in DLQ`);
}
```

### Example 5: Queue Monitoring

```typescript
// Monitor queue health
setInterval(async () => {
  const health = await service.performHealthCheck();
  
  if (health.status !== 'healthy') {
    console.warn(`Queue health degraded: ${health.status}`);
  }
  
  health.queues.forEach(queue => {
    const stats = service.getQueueStats(queue.name);
    if (stats) {
      const queueHealth = {
        name: queue.name,
        messages: stats.totalMessages,
        failed: stats.failedMessages,
        avgTime: stats.averageProcessingTimeMs,
        consumers: stats.totalConsumers,
      };
      
      console.log(JSON.stringify(queueHealth));
    }
  });
}, 60000);
```

## Performance Considerations

### Message Processing

- Visibility timeout should exceed expected processing time
- Batch operations reduce API calls
- Priority queues add minimal overhead
- Consumer concurrency improves throughput

### Queue Sizing

- Set maxMessages based on peak load
- Monitor queue depth regularly
- Use separate queues for different priorities
- Clean up expired messages regularly

### Retry Strategy

- Balance between retry count and processing time
- Use exponential backoff to avoid thundering herd
- Set maxDelay to prevent excessive retry delays
- Use DLQ for persistent failures

### Memory Management

- Size maxMessageSize appropriately
- Enable cleanup for TTL'd messages
- Monitor queue statistics
- Archive messages for compliance

## Best Practices

1. **Queue Design**: Use separate queues for different priority levels
2. **Retry Strategy**: Use exponential backoff with reasonable limits
3. **Dead-Letter Queues**: Monitor and investigate DLQ messages
4. **Consumer Groups**: Use consumer groups for scaling
5. **Message Size**: Keep messages small; use references for large data
6. **Visibility Timeout**: Set based on expected processing time
7. **Delivery Guarantee**: Choose based on business requirements
8. **Error Handling**: Distinguish retryable vs. permanent failures
9. **Monitoring**: Track queue depth and processing time
10. **Cleanup**: Regularly purge or archive old messages

## Error Handling

Service handles:
- Queue not found (returns null/false)
- Message size exceeded (throws error)
- Queue capacity exceeded (throws error)
- Processing timeout (visibility timeout reset)
- Dead-letter on max retries (automatic routing)
- Invalid priority values (normalized to 'normal')

## Lifecycle Management

```typescript
// Create service
const service = createQueueService(config);

// Create queues
const queueId = service.createQueue({...});

// Register consumers
service.registerConsumer(queueId, 'consumer1', handler);

// Send messages
const messageId = service.sendMessage(queueId, body);

// Graceful shutdown
service.stop();
```

## Testing

Run unit tests:

```bash
npm run test -- queue-service.test.ts
```

Run demo scenarios:

```bash
npm run demo -- queue-service/demo.ts
```

## Dependencies

- **Built-in**: No external dependencies for core functionality
- **Optional**: RabbitMQ, Kafka, or SQS adapters for distributed queuing

## See Also

- [Event Pipeline Service](../event-pipeline/README.md) - Event routing
- [Notification Service](../notification-service/README.md) - Alert delivery
- [Audit Service](../audit-service/README.md) - Operation tracking
- [Logging Service](../logging-service/README.md) - Structured logging
- [Metrics Service](../metrics-service/README.md) - Metrics collection

## Version

1.0.0

## License

See repository LICENSE file
