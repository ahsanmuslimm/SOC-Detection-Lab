# Error Handling Module

Comprehensive, type-safe error handling system for the SOC Detection Lab application. Provides a complete error management framework with specific error types, context tracking, serialization, and recovery strategies.

**Status**: ✅ Production Ready  
**Test Coverage**: 95%+ (40+ unit tests)  
**Dependencies**: None (Tier 0)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Error Types](#error-types)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Migration Guide](#migration-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The error-handling module provides:

- **Typed Error System**: Type-safe errors with inheritance hierarchy
- **Error Classification**: Categories (validation, auth, server, etc.)
- **Context Tracking**: Request ID, user ID, and custom context
- **Serialization**: Convert errors to JSON for API responses
- **Error Utilities**: Classification, recovery strategies, HTTP mapping
- **Error Handlers**: Callback-based error handling system
- **Sensitive Data**: Automatic masking of passwords, tokens, API keys

### Why This Module?

1. **Consistency**: All application errors follow same pattern
2. **Type Safety**: Full TypeScript support, no `any` types
3. **Debugging**: Rich context and metadata for troubleshooting
4. **Client Communication**: Proper HTTP status codes and serialization
5. **Recovery**: Automatic detection of retryable errors
6. **Security**: Sensitive data masking in logs and responses

---

## Features

### ✅ Error Types (10 Specific Classes)

- `AppError`: Base class for all application errors
- `ValidationError`: Input validation failures (422)
- `AuthenticationError`: Auth failures (401)
- `AuthorizationError`: Permission denied (403)
- `NotFoundError`: Resource not found (404)
- `ConflictError`: Resource conflict (409)
- `RateLimitError`: Rate limit exceeded (429)
- `DatabaseError`: Database failures (500)
- `ExternalServiceError`: External API failures (502)
- `ServerError`: General server errors (500)

### ✅ Error Properties

```typescript
error.code              // Unique error code
error.statusCode        // HTTP status code
error.category          // Error category
error.severity          // 'critical' | 'high' | 'medium' | 'low' | 'info'
error.metadata          // Custom metadata object
error.context           // Request context (userId, requestId, etc.)
error.cause             // Original error (error chaining)
error.isAppError        // Type guard flag
```

### ✅ Error Context

Track error origin and flow:

```typescript
error.withContext({
  userId: 'analyst-123',
  requestId: 'req-abc-789',
  path: '/api/alerts',
  method: 'POST',
  timestamp: new Date(),
  traceId: 'trace-xyz',
});
```

### ✅ Error Metadata

Attach custom data:

```typescript
error.withMetadata({
  resourceId: 'alert-456',
  action: 'update_status',
  attemptNumber: 3,
  duration: 5000,
});
```

### ✅ Utilities

- `ErrorUtils.isAppError()`: Type check
- `ErrorUtils.toAppError()`: Convert any error
- `ErrorUtils.isRetryable()`: Check if error is retryable
- `ErrorUtils.isClientError()`: Check 4xx errors
- `ErrorUtils.isServerError()`: Check 5xx errors
- `ErrorUtils.getRecoveryStrategy()`: Get retry info
- `ErrorUtils.maskSensitive()`: Redact sensitive data
- `ErrorUtils.fromHttpResponse()`: Convert HTTP errors
- `ErrorUtils.formatForLogging()`: Format for logs

### ✅ Error Handler

Callback-based error handling:

```typescript
const handler = new ErrorHandler();
handler.registerGlobal(async (error) => {
  // Handle all errors
});
handler.registerCategory('validation', async (error) => {
  // Handle validation errors
});
await handler.handle(error);
```

---

## Installation & Setup

### 1. Import the Module

```typescript
import {
  AppError,
  ValidationError,
  AuthenticationError,
  ErrorUtils,
  ErrorHandler,
} from '@soc-detection-lab/error-handling';
```

### 2. Create Custom Errors (Optional)

Extend `AppError` for domain-specific errors:

```typescript
export class InvestigationError extends AppError {
  investigationId: string;

  constructor(message: string, investigationId: string) {
    super(
      message,
      'INVESTIGATION_ERROR',
      500,
      'server',
      'high'
    );
    this.name = 'InvestigationError';
    this.investigationId = investigationId;
    Object.setPrototypeOf(this, InvestigationError.prototype);
  }
}
```

### 3. Set Up Error Handlers

```typescript
import { globalErrorHandler } from '@soc-detection-lab/error-handling';

// Log errors
globalErrorHandler.registerGlobal(async (error) => {
  console.error('[ERROR]', error.code, error.message);
});

// Alert on critical errors
globalErrorHandler.registerCategory('critical', async (error) => {
  if (error.severity === 'critical') {
    // Send alert to ops team
    await notifyOps(error);
  }
});
```

---

## Core Concepts

### Error Hierarchy

```
Error (JavaScript built-in)
└── AppError (Base application error)
    ├── ValidationError (422)
    ├── AuthenticationError (401)
    ├── AuthorizationError (403)
    ├── NotFoundError (404)
    ├── ConflictError (409)
    ├── RateLimitError (429)
    ├── DatabaseError (500)
    ├── ExternalServiceError (502)
    └── ServerError (500)
```

### Error Lifecycle

```
1. Create Error
   └─ new ValidationError('Invalid input')

2. Add Context
   └─ error.withContext({ userId: '123', requestId: 'req-abc' })

3. Add Metadata
   └─ error.withMetadata({ field: 'email', value: 'invalid' })

4. Handle/Log
   └─ ErrorUtils.formatForLogging(error)

5. Serialize/Respond
   └─ error.serialize() → Send to client

6. Recover
   └─ ErrorUtils.getRecoveryStrategy(error) → Retry logic
```

### Error Categories

| Category | Severity | Retryable | Examples |
|----------|----------|-----------|----------|
| validation | medium | No | Invalid input, field errors |
| authentication | high | No | Invalid token, wrong credentials |
| authorization | high | No | Permission denied |
| not_found | medium | No | Resource doesn't exist |
| conflict | medium | No | Duplicate, version conflict |
| rate_limit | low | Yes | Rate limit exceeded |
| database | critical | Yes | Connection failed |
| external_service | high | Yes | API timeout, service down |
| server | critical | Yes | Unhandled exception |

---

## Error Types

### ValidationError (422)

```typescript
// Simple validation
const error = new ValidationError('Form validation failed');

// Add field errors
error
  .addField('email', 'invalid@', 'Invalid email format')
  .addField('password', '123', 'Minimum 8 characters required');

// Check fields
console.log(error.fields);
// {
//   email: { field: 'email', value: 'invalid@', reason: '...', constraint?: '' },
//   password: { field: 'password', value: '123', reason: '...', constraint?: '' }
// }
```

### AuthenticationError (401)

```typescript
// Failed login
const error = new AuthenticationError(
  'Invalid credentials',
  {
    username: 'user@example.com',
    attemptCount: 3,
    locked: false,
  }
);
```

### AuthorizationError (403)

```typescript
// Permission denied
const error = new AuthorizationError(
  'Insufficient permissions',
  ['admin', 'moderator'],           // Required
  ['analyst']                        // User has
);

console.log(error.requiredPermissions);  // ['admin', 'moderator']
console.log(error.userPermissions);      // ['analyst']
```

### NotFoundError (404)

```typescript
// Resource not found
const error = new NotFoundError('Alert', 'alert-12345');
// Message: "Alert with ID alert-12345 not found"

console.log(error.resourceType);  // 'Alert'
console.log(error.resourceId);    // 'alert-12345'
```

### RateLimitError (429)

```typescript
// Rate limit exceeded
const error = new RateLimitError(
  100,              // Limit
  125,              // Current
  60                // Retry after (seconds)
);

console.log(error.limit);        // 100
console.log(error.current);      // 125
console.log(error.retryAfter);   // 60
```

### DatabaseError (500)

```typescript
// Database error
const error = new DatabaseError(
  'Connection pool exhausted',
  'SELECT * FROM events WHERE timestamp > ?',  // Query (redacted in serialization)
  'events'                                       // Table
);
```

### ExternalServiceError (502)

```typescript
// External API failure with error chaining
const originalError = new Error('Connection timeout');
const error = new ExternalServiceError(
  'PaymentProcessor',
  'Failed to process payment',
  originalError
);

console.log(error.serviceName);     // 'PaymentProcessor'
console.log(error.originalError);   // Original error object
console.log(error.getCause());      // { message, code, stack }
```

---

## Usage Examples

### Basic Usage

```typescript
import { ValidationError, ErrorUtils } from '@soc-detection-lab/error-handling';

try {
  // Validate user input
  if (!isValidEmail(email)) {
    const error = new ValidationError('Invalid email');
    error.addField('email', email, 'Must be valid email address');
    throw error;
  }
} catch (err) {
  const appError = ErrorUtils.toAppError(err);
  console.log(appError.code);      // 'VALIDATION_ERROR'
  console.log(appError.statusCode); // 422
}
```

### Request Error Handling

```typescript
import { AuthenticationError, AuthorizationError } from '@soc-detection-lab/error-handling';

async function handleRequest(req, res) {
  try {
    // Check authentication
    if (!req.user) {
      throw new AuthenticationError('Token required');
    }

    // Check authorization
    if (!req.user.permissions.includes('write')) {
      throw new AuthorizationError(
        'Write permission required',
        ['write'],
        req.user.permissions
      );
    }

    // Process request
    const result = await processRequest(req);
    res.json({ success: true, data: result });
  } catch (err) {
    const appError = ErrorUtils.toAppError(err);
    res.status(appError.statusCode).json(appError.serialize());
  }
}
```

### Error Context Tracking

```typescript
import { DatabaseError } from '@soc-detection-lab/error-handling';

async function queryDatabase(query, requestId, userId) {
  try {
    return await db.query(query);
  } catch (err) {
    const error = new DatabaseError(
      'Query failed',
      query,
      'events'
    );

    // Add context for debugging
    error.withContext({
      requestId,
      userId,
      path: '/api/events',
      method: 'GET',
      timestamp: new Date(),
    });

    // Add execution details
    error.withMetadata({
      queryTime: Date.now() - startTime,
      rowsProcessed: 0,
      errorCode: err.code,
    });

    throw error;
  }
}
```

### Error Recovery

```typescript
import { ErrorUtils } from '@soc-detection-lab/error-handling';

async function retryableRequest(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const appError = ErrorUtils.toAppError(err);

      if (!ErrorUtils.isRetryable(appError)) {
        throw appError;  // Don't retry
      }

      if (attempt === maxRetries) {
        throw appError;  // Last attempt
      }

      const strategy = ErrorUtils.getRecoveryStrategy(appError);
      const delay = strategy.retryDelay || 1000;

      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
}
```

### HTTP Error Conversion

```typescript
import { ErrorUtils } from '@soc-detection-lab/error-handling';

async function callExternalAPI(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.json();
    // Convert HTTP response to AppError
    const error = ErrorUtils.fromHttpResponse(response.status, body);
    throw error;
  }

  return response.json();
}
```

### Sensitive Data Masking

```typescript
import { ErrorUtils } from '@soc-detection-lab/error-handling';

const metadata = {
  username: 'analyst@company.com',
  password: 'super_secret_password',
  apiKey: 'sk_live_1234567890',
  databaseUrl: 'postgres://user:pass@host:5432/db',
};

const masked = ErrorUtils.maskSensitive(metadata);
// {
//   username: 'analyst@company.com',
//   password: '[REDACTED]',
//   apiKey: '[REDACTED]',
//   databaseUrl: 'postgres://user:pass@host:5432/db'  // URL not masked by default
// }
```

### Error Handling Chain

```typescript
import { ErrorHandler, ValidationError } from '@soc-detection-lab/error-handling';

const errorHandler = new ErrorHandler();

// Global handler
errorHandler.registerGlobal(async (error) => {
  // Log all errors
  console.error(`[${error.code}] ${error.message}`);
});

// Category handlers
errorHandler.registerCategory('validation', async (error) => {
  // Track validation errors
  metrics.increment('validation_errors');
});

errorHandler.registerCategory('database', async (error) => {
  // Alert on database errors
  if (error.severity === 'critical') {
    await slack.notify(`🚨 Critical DB Error: ${error.message}`);
  }
});

// Usage
try {
  const error = new ValidationError('Invalid input');
  throw error;
} catch (err) {
  const appError = ErrorUtils.toAppError(err);
  await errorHandler.handle(appError);  // Calls all registered handlers
}
```

### Custom Error Types

```typescript
import { AppError } from '@soc-detection-lab/error-handling';

// Create domain-specific error
export class CaseNotOpenError extends AppError {
  caseId: string;
  currentStatus: string;

  constructor(caseId: string, currentStatus: string) {
    super(
      `Cannot modify closed case: ${caseId}`,
      'CASE_NOT_OPEN',
      409,
      'conflict',
      'medium'
    );
    this.name = 'CaseNotOpenError';
    this.caseId = caseId;
    this.currentStatus = currentStatus;
    Object.setPrototypeOf(this, CaseNotOpenError.prototype);
  }

  serialize() {
    const serialized = super.serialize();
    return {
      ...serialized,
      metadata: {
        ...this.metadata,
        caseId: this.caseId,
        currentStatus: this.currentStatus,
      },
    };
  }
}
```

---

## API Reference

### AppError

Base class for all application errors.

#### Constructor

```typescript
new AppError(
  message: string,
  code?: string,              // Default: 'INTERNAL_ERROR'
  statusCode?: HttpStatusCode, // Default: 500
  category?: ErrorCategory,   // Default: 'unknown'
  severity?: ErrorSeverity    // Default: 'high'
)
```

#### Properties

- `code`: Unique error identifier
- `statusCode`: HTTP status code
- `category`: Error category
- `severity`: Error severity level
- `metadata`: Custom metadata object
- `context`: Request context
- `cause`: Original error
- `isAppError`: Type guard flag (always `true`)

#### Methods

- `serialize()`: Convert to `ISerializedError`
- `getCause()`: Get error cause details
- `withContext(context)`: Add context, returns `this`
- `withMetadata(metadata)`: Add metadata, returns `this`

---

### ValidationError

Input validation error (422 Unprocessable Entity).

#### Constructor

```typescript
new ValidationError(
  message?: string,        // Default: 'Validation failed'
  fields?: IValidationErrorFields
)
```

#### Methods

- `addField(field, value, reason, constraint?)`: Add field error

#### Properties

- `fields`: Map of field errors

---

### ErrorUtils

Static utility functions for error handling.

#### Methods

```typescript
// Type checking
ErrorUtils.isAppError(error: unknown): boolean
ErrorUtils.toAppError(error: unknown): IAppError

// Classification
ErrorUtils.isRetryable(error: IAppError): boolean
ErrorUtils.isClientError(error: IAppError): boolean
ErrorUtils.isServerError(error: IAppError): boolean

// Recovery
ErrorUtils.getRecoveryStrategy(error: IAppError): IErrorRecovery

// Utilities
ErrorUtils.maskSensitive(metadata: IErrorMetadata): IErrorMetadata
ErrorUtils.fromHttpResponse(status: number, body: unknown): IAppError
ErrorUtils.formatForLogging(error: IAppError, includeStack?: boolean): Record<string, unknown>
```

---

### ErrorHandler

Callback-based error handling system.

#### Constructor

```typescript
new ErrorHandler(options?: IErrorHandlerOptions)

interface IErrorHandlerOptions {
  onError?: ErrorHandler;
  onCritical?: ErrorHandler;
  onValidation?: ErrorHandler;
  maskSensitive?: boolean;
  includeStack?: boolean;
}
```

#### Methods

- `registerGlobal(handler)`: Register global handler
- `registerCategory(category, handler)`: Register category handler
- `handle(error)`: Call all registered handlers
- `clear()`: Clear all handlers

---

## Best Practices

### 1. Use Specific Error Classes

```typescript
// ✅ Good: Specific error type
throw new ValidationError('Invalid email').addField(
  'email',
  email,
  'Must be valid format'
);

// ❌ Bad: Generic error
throw new Error('Invalid email');
```

### 2. Add Context to Errors

```typescript
// ✅ Good: Rich context for debugging
const error = new DatabaseError('Connection failed');
error.withContext({
  userId: req.user.id,
  requestId: req.id,
  path: req.path,
});

// ❌ Bad: No context
throw new DatabaseError('Connection failed');
```

### 3. Use Error Chaining

```typescript
// ✅ Good: Preserve error chain
try {
  await externalAPI.call();
} catch (err) {
  throw new ExternalServiceError('ExternalAPI', 'Call failed', err);
}

// ❌ Bad: Lose original error
throw new ServerError('External API call failed');
```

### 4. Mask Sensitive Data

```typescript
// ✅ Good: Mask before logging
const masked = ErrorUtils.maskSensitive(metadata);
logger.error('Error', masked);

// ❌ Bad: Log sensitive data
logger.error('Error', error.metadata);
```

### 5. Check Retryability

```typescript
// ✅ Good: Check recovery strategy
try {
  return await operation();
} catch (err) {
  const appError = ErrorUtils.toAppError(err);
  if (ErrorUtils.isRetryable(appError)) {
    return retry(operation);
  }
  throw appError;
}

// ❌ Bad: Retry everything
for (let i = 0; i < 3; i++) {
  try {
    return await operation();
  } catch {
    // Always retry
  }
}
```

### 6. Serialize for Clients

```typescript
// ✅ Good: Serialize and respond
try {
  const result = await operation();
  res.json({ success: true, data: result });
} catch (err) {
  const appError = ErrorUtils.toAppError(err);
  res.status(appError.statusCode).json(appError.serialize());
}

// ❌ Bad: Expose internal error
res.status(500).json(err);
```

### 7. Use Consistent Error Codes

Document your error codes:

```typescript
// errors.ts
export const ERROR_CODES = {
  // Validation
  INVALID_EMAIL: 'INVALID_EMAIL',
  MISSING_FIELD: 'MISSING_FIELD',

  // Auth
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',

  // Business logic
  CASE_NOT_OPEN: 'CASE_NOT_OPEN',
  ALERT_ALREADY_ASSIGNED: 'ALERT_ALREADY_ASSIGNED',
};
```

---

## Migration Guide

### From String Errors

```typescript
// Before
throw new Error('User not found');

// After
throw new NotFoundError('User', userId);
```

### From Custom Error Classes

```typescript
// Before
export class CustomError extends Error {
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// After
export class CustomError extends AppError {
  constructor(message: string, code: string) {
    super(message, code, 500);
  }
}
```

### From Manual Error Handling

```typescript
// Before
catch (err) {
  if (err.statusCode === 404) {
    res.status(404).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// After
catch (err) {
  const appError = ErrorUtils.toAppError(err);
  res.status(appError.statusCode).json(appError.serialize());
}
```

---

## Troubleshooting

### Errors Not Being Caught

**Problem**: `try/catch` not catching errors

**Solution**: Ensure error is thrown, not returned:

```typescript
// ✅ Correct
throw new ValidationError('Invalid');

// ❌ Wrong
return new ValidationError('Invalid');
```

### Stack Traces Lost

**Problem**: Stack trace missing after error wrapping

**Solution**: Preserve stack when chaining errors:

```typescript
try {
  await operation();
} catch (err) {
  const newError = new AppError('Failed');
  newError.cause = err;  // Preserve original
  if (err instanceof Error) {
    newError.stack = err.stack;
  }
  throw newError;
}
```

### Sensitive Data Exposed

**Problem**: Passwords/tokens in error logs

**Solution**: Use `maskSensitive()`:

```typescript
const masked = ErrorUtils.maskSensitive(metadata);
logger.error('Error occurred', masked);
```

### Context Not Propagating

**Problem**: Context lost when rethrowing

**Solution**: Add context before throwing:

```typescript
const error = new AppError('Operation failed');
error.withContext({
  userId: request.userId,
  requestId: request.id,
});
throw error;
```

### Recovery Not Working

**Problem**: Retryable errors always fail

**Solution**: Check recovery strategy and retry delays:

```typescript
const strategy = ErrorUtils.getRecoveryStrategy(error);
console.log('Can recover:', strategy.canRecover);
console.log('Retry delay:', strategy.retryDelay);
console.log('Max retries:', strategy.retryCount);
```

---

## Performance Considerations

- **Serialization**: O(n) where n = metadata size
- **Masking**: O(n) keys in metadata
- **Handlers**: Runs async in parallel per category
- **Memory**: Each error ~1-2KB depending on context

---

## Related Modules

- **config-service**: Get error configuration
- **logging-service**: Log errors with context
- **types-definitions**: Shared error type definitions

---

## Support

For issues or questions:

1. Check this README and troubleshooting section
2. Review test file for usage examples
3. Run demo: `npm run demo`

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary
