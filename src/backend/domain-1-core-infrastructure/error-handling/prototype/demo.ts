/**
 * Error Handling - Demo/Prototype
 * Demonstrates all error-handling features and usage patterns
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ServerError,
  ErrorUtils,
  ErrorHandler,
} from '../src/main';

console.log('=== Error Handling Module - Demonstration ===\n');

// ============================================================
// 1. Basic Error Creation & Usage
// ============================================================
console.log('1. Basic Error Creation');
console.log('------------------------');

const basicError = new AppError('Something went wrong', 'CUSTOM_ERROR', 400);
console.log('AppError:', basicError.message);
console.log('Code:', basicError.code);
console.log('Status:', basicError.statusCode);
console.log('Is AppError:', ErrorUtils.isAppError(basicError));
console.log();

// ============================================================
// 2. Error Classes
// ============================================================
console.log('2. Specific Error Types');
console.log('-----------------------');

// Validation Error
const validationError = new ValidationError('Form validation failed');
validationError
  .addField('email', 'user@invalid', 'Invalid email domain')
  .addField('password', '123', 'Password too short (min 8 chars)');

console.log('ValidationError:', validationError.message);
console.log('Fields:', validationError.fields);
console.log();

// Authentication Error
const authError = new AuthenticationError('Invalid credentials', {
  attemptCount: 3,
  locked: false,
});

console.log('AuthenticationError:', authError.message);
console.log('Metadata:', authError.metadata);
console.log();

// Authorization Error
const authzError = new AuthorizationError(
  'Access denied: insufficient permissions',
  ['admin', 'moderator'],
  ['user']
);

console.log('AuthorizationError:', authzError.message);
console.log('Required:', authzError.requiredPermissions);
console.log('User has:', authzError.userPermissions);
console.log();

// Not Found Error
const notFoundError = new NotFoundError('User', 'user-12345');
console.log('NotFoundError:', notFoundError.message);
console.log();

// Rate Limit Error
const rateLimitError = new RateLimitError(100, 125, 60);
console.log('RateLimitError:', rateLimitError.message);
console.log('Retry after:', rateLimitError.retryAfter, 'seconds');
console.log();

// Database Error
const dbError = new DatabaseError(
  'Connection pool exhausted',
  'SELECT * FROM events WHERE timestamp > NOW() - INTERVAL 1 day',
  'events'
);

console.log('DatabaseError:', dbError.message);
console.log('Table:', dbError.tableName);
console.log();

// ============================================================
// 3. Error Context & Metadata
// ============================================================
console.log('3. Context & Metadata');
console.log('---------------------');

const contextError = new AppError('Request failed')
  .withContext({
    userId: 'analyst-456',
    requestId: 'req-789-xyz',
    path: '/api/alerts',
    method: 'POST',
  })
  .withMetadata({
    resourceId: 'alert-123',
    action: 'update_status',
    previousStatus: 'new',
    newStatus: 'acknowledged',
  });

console.log('Error context:', contextError.context);
console.log('Error metadata:', contextError.metadata);
console.log();

// ============================================================
// 4. Error Serialization
// ============================================================
console.log('4. Error Serialization');
console.log('----------------------');

const serializableError = new ValidationError('Invalid request data');
serializableError.addField('timestamp', 'invalid-date', 'Date format must be ISO 8601');

const serialized = serializableError.serialize();
console.log('Serialized error:');
console.log(JSON.stringify(serialized, null, 2));
console.log();

// ============================================================
// 5. Error Utilities
// ============================================================
console.log('5. Error Utilities');
console.log('------------------');

const testErrors = [
  new ValidationError(),
  new AuthenticationError(),
  new AuthorizationError(),
  new NotFoundError('Alert', 'alert-1'),
  new RateLimitError(10, 11),
  new DatabaseError(),
  new ServerError(),
];

console.log('Error Classification:');
testErrors.forEach((err) => {
  console.log(`- ${err.name}:`);
  console.log(`  Client Error (4xx): ${ErrorUtils.isClientError(err)}`);
  console.log(`  Server Error (5xx): ${ErrorUtils.isServerError(err)}`);
  console.log(`  Retryable: ${ErrorUtils.isRetryable(err)}`);
});
console.log();

// ============================================================
// 6. Error Recovery Strategies
// ============================================================
console.log('6. Recovery Strategies');
console.log('----------------------');

const recoveryTestErrors = {
  'Rate Limit': new RateLimitError(100, 101),
  'Database': new DatabaseError(),
  'Validation': new ValidationError(),
  'Auth': new AuthenticationError(),
};

Object.entries(recoveryTestErrors).forEach(([name, err]) => {
  const strategy = ErrorUtils.getRecoveryStrategy(err);
  console.log(`${name}:`);
  console.log(`  Can recover: ${strategy.canRecover}`);
  if (strategy.canRecover) {
    console.log(`  Strategy: ${strategy.strategy}`);
    console.log(`  Retry delay: ${strategy.retryDelay}ms`);
    console.log(`  Retry count: ${strategy.retryCount || '1'}`);
  }
  console.log();
});

// ============================================================
// 7. HTTP Response to Error Conversion
// ============================================================
console.log('7. HTTP Response Conversion');
console.log('---------------------------');

const httpResponses = [
  { status: 400, body: { message: 'Bad request', fields: { email: {} } } },
  { status: 401, body: { message: 'Invalid token' } },
  { status: 403, body: { message: 'Forbidden' } },
  { status: 404, body: { message: 'Not found', resourceType: 'User', resourceId: 'xyz' } },
  { status: 429, body: { message: 'Rate limited', limit: 100, current: 101, retryAfter: 60 } },
  { status: 500, body: { message: 'Server error' } },
];

httpResponses.forEach(({ status, body }) => {
  const error = ErrorUtils.fromHttpResponse(status, body);
  console.log(`HTTP ${status} -> ${error.constructor.name} (${error.code})`);
});
console.log();

// ============================================================
// 8. Sensitive Data Masking
// ============================================================
console.log('8. Sensitive Data Masking');
console.log('------------------------');

const sensitiveMetadata = {
  username: 'john_doe',
  password: 'super_secret_123',
  email: 'john@example.com',
  apiKey: 'sk-1234567890abcdef',
  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
  refreshToken: 'refresh_token_xyz',
  databaseUrl: 'postgres://user:pass@localhost:5432/db',
};

const masked = ErrorUtils.maskSensitive(sensitiveMetadata);
console.log('Original metadata keys:', Object.keys(sensitiveMetadata).join(', '));
console.log('\nMasked metadata:');
Object.entries(masked).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});
console.log();

// ============================================================
// 9. Error Formatting for Logging
// ============================================================
console.log('9. Error Formatting for Logging');
console.log('--------------------------------');

const logError = new DatabaseError('Connection timeout')
  .withContext({ userId: 'user-1', requestId: 'req-123' })
  .withMetadata({ retryAttempt: 2 });

const formatted = ErrorUtils.formatForLogging(logError, true);
console.log('Formatted error:');
console.log(JSON.stringify(formatted, null, 2).substring(0, 500) + '...');
console.log();

// ============================================================
// 10. Error Handling Chains
// ============================================================
console.log('10. Error Handler');
console.log('-----------------');

const errorHandler = new ErrorHandler({
  maskSensitive: true,
  includeStack: false,
});

// Register handlers
let globalHandled = false;
let validationHandled = false;
let criticalHandled = false;

errorHandler.registerGlobal(async (error) => {
  globalHandled = true;
  console.log(`Global handler: ${error.code}`);
});

errorHandler.registerCategory('validation', async (error) => {
  validationHandled = true;
  console.log(`Validation handler: ${error.message}`);
});

errorHandler.registerCategory('database', async (error) => {
  criticalHandled = true;
  console.log(`Database handler: CRITICAL - ${error.message}`);
});

// Test handlers
(async () => {
  console.log('Testing error handlers:');

  const valError = new ValidationError('Invalid input');
  await errorHandler.handle(valError);
  console.log('  - Validation error handled\n');

  const dbError = new DatabaseError('Connection lost');
  await errorHandler.handle(dbError);
  console.log('  - Database error handled\n');

  // ============================================================
  // 11. Error Chaining
  // ============================================================
  console.log('11. Error Chaining');
  console.log('------------------');

  const originalError = new Error('Network timeout after 5000ms');
  const chainedError = new ExternalServiceError('PaymentAPI', 'Payment processing failed', originalError);

  chainedError.withContext({ userId: 'user-789', requestId: 'req-456' });

  console.log('Chained error:', chainedError.message);
  console.log('Original cause:', chainedError.getCause()?.message);
  console.log();

  // ============================================================
  // 12. Error Type Checking
  // ============================================================
  console.log('12. Type Checking');
  console.log('-----------------');

  const mixedErrors: any[] = [
    new AppError('App error'),
    new Error('Regular error'),
    'error string',
    null,
    { code: 'FAKE' },
  ];

  console.log('Checking errors:');
  mixedErrors.forEach((err, i) => {
    const isApp = ErrorUtils.isAppError(err);
    console.log(`  Error ${i}: isAppError = ${isApp}`);
    if (!isApp) {
      const converted = ErrorUtils.toAppError(err);
      console.log(`    Converted to: ${converted.constructor.name}`);
    }
  });
  console.log();

  // ============================================================
  // 13. Real-World Scenarios
  // ============================================================
  console.log('13. Real-World Scenarios');
  console.log('------------------------');

  // Scenario 1: Failed Login
  console.log('Scenario 1: Failed Login Attempt');
  const loginError = new AuthenticationError('Invalid credentials', {
    username: 'analyst@company.com',
    attemptNumber: 3,
    locked: false,
    remainingAttempts: 2,
  });
  loginError.withContext({ path: '/api/auth/login', method: 'POST' });
  console.log(JSON.stringify(ErrorUtils.formatForLogging(loginError), null, 2).substring(0, 300) + '...');
  console.log();

  // Scenario 2: Missing Alert
  console.log('Scenario 2: Alert Not Found');
  const missingAlertError = new NotFoundError('Alert', 'alert-999');
  missingAlertError.withContext({
    userId: 'analyst-1',
    requestId: 'req-get-alert-999',
  });
  console.log(JSON.stringify(ErrorUtils.formatForLogging(missingAlertError), null, 2).substring(0, 300) + '...');
  console.log();

  // Scenario 3: Database Failure
  console.log('Scenario 3: Database Connection Failure');
  const dbFailure = new DatabaseError(
    'ECONNREFUSED: Connection refused on 5432',
    'undefined',
    'events'
  );
  dbFailure.withContext({ requestId: 'req-events-list', userId: 'analyst-1' });
  const recovery = ErrorUtils.getRecoveryStrategy(dbFailure);
  console.log(`Status: ${dbFailure.statusCode}`);
  console.log(`Severity: ${dbFailure.severity}`);
  console.log(`Recoverable: ${recovery.canRecover} (${recovery.strategy}, retry: ${recovery.retryCount}x)`);
  console.log();

  // Scenario 4: Rate Limiting
  console.log('Scenario 4: Rate Limit Hit');
  const rateLimited = new RateLimitError(1000, 1001, 60);
  rateLimited.withContext({
    userId: 'analyst-2',
    path: '/api/search',
  });
  console.log(`Requests allowed: ${rateLimited.limit}`);
  console.log(`Current requests: ${rateLimited.current}`);
  console.log(`Retry after: ${rateLimited.retryAfter} seconds`);
  console.log();

  // Scenario 5: Validation Error
  console.log('Scenario 5: Form Validation Error');
  const formError = new ValidationError('Form submission failed')
    .addField('startDate', '2025-13-01', 'Invalid month (01-12 expected)')
    .addField('endDate', '2025-01-01', 'End date must be after start date')
    .addField('threshold', '-50', 'Threshold must be between 0-100');

  formError.withContext({
    userId: 'analyst-3',
    path: '/api/reports/create',
    method: 'POST',
  });
  console.log(`Fields with errors: ${Object.keys(formError.fields).join(', ')}`);
  console.log();

  console.log('=== Demo Complete ===');
})();
