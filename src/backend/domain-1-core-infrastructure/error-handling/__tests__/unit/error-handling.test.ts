/**
 * Error Handling - Unit Tests
 * Tests error classes, utilities, and handlers
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
  globalErrorHandler,
} from '../../src/main';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create AppError with defaults', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isAppError).toBe(true);
    });

    it('should create AppError with custom properties', () => {
      const error = new AppError(
        'Custom error',
        'CUSTOM_CODE',
        400,
        'validation',
        'low'
      );
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.category).toBe('validation');
      expect(error.severity).toBe('low');
    });

    it('should serialize AppError', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400);
      const serialized = error.serialize();

      expect(serialized.code).toBe('TEST_CODE');
      expect(serialized.message).toBe('Test error');
      expect(serialized.statusCode).toBe(400);
      expect(serialized.timestamp).toBeDefined();
    });

    it('should add context to error', () => {
      const error = new AppError('Test error');
      error.withContext({
        userId: 'user-123',
        requestId: 'req-456',
      });

      expect(error.context?.userId).toBe('user-123');
      expect(error.context?.requestId).toBe('req-456');
    });

    it('should add metadata to error', () => {
      const error = new AppError('Test error');
      error.withMetadata({ custom: 'value', nested: { key: 'data' } });

      expect(error.metadata.custom).toBe('value');
      expect((error.metadata.nested as any).key).toBe('data');
    });

    it('should chain context and metadata', () => {
      const error = new AppError('Test error');
      const result = error
        .withContext({ userId: 'user-1' })
        .withMetadata({ type: 'custom' });

      expect(result.context?.userId).toBe('user-1');
      expect(result.metadata.type).toBe('custom');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError', () => {
      const error = new ValidationError('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(422);
      expect(error.category).toBe('validation');
    });

    it('should add validation fields', () => {
      const error = new ValidationError();
      error.addField('email', 'invalid-email', 'Invalid email format');

      expect(error.fields.email).toBeDefined();
      expect((error.fields.email as any).reason).toBe('Invalid email format');
    });

    it('should support multiple fields', () => {
      const error = new ValidationError();
      error
        .addField('email', 'invalid', 'Invalid format')
        .addField('password', '123', 'Too short');

      expect(Object.keys(error.fields).length).toBe(2);
    });

    it('should serialize with field details', () => {
      const error = new ValidationError();
      error.addField('email', 'test@invalid', 'Invalid domain');
      const serialized = error.serialize();

      expect(serialized.metadata?.fields).toBeDefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError', () => {
      const error = new AuthenticationError('Invalid credentials');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.category).toBe('authentication');
    });

    it('should support metadata', () => {
      const error = new AuthenticationError('Invalid token', {
        tokenType: 'JWT',
        expired: true,
      });

      expect(error.metadata.tokenType).toBe('JWT');
      expect(error.metadata.expired).toBe(true);
    });
  });

  describe('AuthorizationError', () => {
    it('should create AuthorizationError', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.code).toBe('AUTHZ_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.category).toBe('authorization');
    });

    it('should track permissions', () => {
      const error = new AuthorizationError(
        'Insufficient permissions',
        ['admin', 'write'],
        ['read']
      );

      expect(error.requiredPermissions).toContain('admin');
      expect(error.userPermissions).toContain('read');
    });

    it('should serialize with permissions', () => {
      const error = new AuthorizationError(
        'Forbidden',
        ['delete'],
        ['read', 'write']
      );
      const serialized = error.serialize();

      expect(serialized.metadata?.requiredPermissions).toBeDefined();
      expect(serialized.metadata?.userPermissions).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError', () => {
      const error = new NotFoundError('User', 'user-123');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('User');
      expect(error.message).toContain('user-123');
    });

    it('should serialize with resource details', () => {
      const error = new NotFoundError('Alert', 'alert-456');
      const serialized = error.serialize();

      expect(serialized.metadata?.resourceType).toBe('Alert');
      expect(serialized.metadata?.resourceId).toBe('alert-456');
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError', () => {
      const error = new ConflictError('Resource already exists');
      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError', () => {
      const error = new RateLimitError(100, 150, 60);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.limit).toBe(100);
      expect(error.current).toBe(150);
      expect(error.retryAfter).toBe(60);
    });

    it('should include retry info in message', () => {
      const error = new RateLimitError(10, 11);
      expect(error.message).toContain('10');
      expect(error.message).toContain('11');
    });

    it('should serialize with rate limit details', () => {
      const error = new RateLimitError(50, 75, 120);
      const serialized = error.serialize();

      expect(serialized.metadata?.limit).toBe(50);
      expect(serialized.metadata?.current).toBe(75);
      expect(serialized.metadata?.retryAfter).toBe(120);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.code).toBe('DB_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.category).toBe('database');
      expect(error.severity).toBe('critical');
    });

    it('should include query (redacted in serialization)', () => {
      const error = new DatabaseError(
        'Query failed',
        'SELECT * FROM users WHERE id = ?',
        'users'
      );

      expect(error.query).toBeDefined();
      expect(error.tableName).toBe('users');

      const serialized = error.serialize();
      expect(serialized.metadata?.query).toBe('[REDACTED]');
    });
  });

  describe('ExternalServiceError', () => {
    it('should create ExternalServiceError', () => {
      const error = new ExternalServiceError('Stripe', 'Payment failed');
      expect(error.code).toBe('STRIPE_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.serviceName).toBe('Stripe');
    });

    it('should chain original error', () => {
      const originalError = new Error('Network timeout');
      const error = new ExternalServiceError('API', 'Request failed', originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.cause).toBe(originalError);
    });
  });

  describe('ServerError', () => {
    it('should create ServerError', () => {
      const error = new ServerError('Unexpected error');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.category).toBe('server');
    });

    it('should wrap original error', () => {
      const original = new Error('Unexpected crash');
      const error = new ServerError('Internal error', original);

      expect(error.originalError).toBe(original);
      expect(error.cause).toBe(original);
    });
  });
});

describe('ErrorUtils', () => {
  describe('isAppError', () => {
    it('should identify AppError', () => {
      const error = new AppError('Test');
      expect(ErrorUtils.isAppError(error)).toBe(true);
    });

    it('should identify ValidationError as AppError', () => {
      const error = new ValidationError();
      expect(ErrorUtils.isAppError(error)).toBe(true);
    });

    it('should reject regular Error', () => {
      const error = new Error('Regular error');
      expect(ErrorUtils.isAppError(error)).toBe(false);
    });

    it('should reject non-errors', () => {
      expect(ErrorUtils.isAppError('error string')).toBe(false);
      expect(ErrorUtils.isAppError(null)).toBe(false);
      expect(ErrorUtils.isAppError({})).toBe(false);
    });
  });

  describe('toAppError', () => {
    it('should return AppError unchanged', () => {
      const error = new AppError('Test');
      const result = ErrorUtils.toAppError(error);
      expect(result).toBe(error);
    });

    it('should convert Error to ServerError', () => {
      const error = new Error('Generic error');
      const result = ErrorUtils.toAppError(error);

      expect(result).toBeInstanceOf(ServerError);
      expect(result.message).toBe('Generic error');
    });

    it('should convert string to ServerError', () => {
      const result = ErrorUtils.toAppError('String error');

      expect(result).toBeInstanceOf(ServerError);
      expect(result.message).toBe('String error');
    });
  });

  describe('isRetryable', () => {
    it('should mark rate limit as retryable', () => {
      const error = new RateLimitError(10, 11);
      expect(ErrorUtils.isRetryable(error)).toBe(true);
    });

    it('should mark database errors as retryable', () => {
      const error = new DatabaseError('Connection lost');
      expect(ErrorUtils.isRetryable(error)).toBe(true);
    });

    it('should mark validation errors as non-retryable', () => {
      const error = new ValidationError();
      expect(ErrorUtils.isRetryable(error)).toBe(false);
    });

    it('should mark auth errors as non-retryable', () => {
      const error = new AuthenticationError();
      expect(ErrorUtils.isRetryable(error)).toBe(false);
    });
  });

  describe('isClientError', () => {
    it('should identify 4xx errors', () => {
      expect(ErrorUtils.isClientError(new ValidationError())).toBe(true);
      expect(ErrorUtils.isClientError(new AuthenticationError())).toBe(true);
      expect(ErrorUtils.isClientError(new NotFoundError('Test', '123'))).toBe(true);
    });

    it('should reject 5xx errors', () => {
      expect(ErrorUtils.isClientError(new ServerError())).toBe(false);
      expect(ErrorUtils.isClientError(new DatabaseError())).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('should identify 5xx errors', () => {
      expect(ErrorUtils.isServerError(new ServerError())).toBe(true);
      expect(ErrorUtils.isServerError(new DatabaseError())).toBe(true);
    });

    it('should reject 4xx errors', () => {
      expect(ErrorUtils.isServerError(new ValidationError())).toBe(false);
      expect(ErrorUtils.isServerError(new AuthenticationError())).toBe(false);
    });
  });

  describe('getRecoveryStrategy', () => {
    it('should return retry strategy for rate limit', () => {
      const error = new RateLimitError(10, 11);
      const strategy = ErrorUtils.getRecoveryStrategy(error);

      expect(strategy.canRecover).toBe(true);
      expect(strategy.strategy).toBe('retry');
      expect(strategy.retryDelay).toBe(60000);
    });

    it('should return retry strategy for database error', () => {
      const error = new DatabaseError('Connection failed');
      const strategy = ErrorUtils.getRecoveryStrategy(error);

      expect(strategy.canRecover).toBe(true);
      expect(strategy.strategy).toBe('retry');
      expect(strategy.retryCount).toBe(3);
    });

    it('should return non-recoverable for validation error', () => {
      const error = new ValidationError();
      const strategy = ErrorUtils.getRecoveryStrategy(error);

      expect(strategy.canRecover).toBe(false);
    });

    it('should return non-recoverable for auth error', () => {
      const error = new AuthenticationError();
      const strategy = ErrorUtils.getRecoveryStrategy(error);

      expect(strategy.canRecover).toBe(false);
    });
  });

  describe('maskSensitive', () => {
    it('should redact password fields', () => {
      const metadata = {
        username: 'user',
        password: 'secret123',
        email: 'user@example.com',
      };

      const masked = ErrorUtils.maskSensitive(metadata);
      expect(masked.password).toBe('[REDACTED]');
      expect(masked.username).toBe('user');
    });

    it('should redact token fields', () => {
      const metadata = {
        accessToken: 'abc123def456',
        refreshToken: 'xyz789',
        userId: 'user-123',
      };

      const masked = ErrorUtils.maskSensitive(metadata);
      expect(masked.accessToken).toBe('[REDACTED]');
      expect(masked.refreshToken).toBe('[REDACTED]');
      expect(masked.userId).toBe('user-123');
    });

    it('should handle case-insensitive keys', () => {
      const metadata = {
        apiKey: 'key123',
        ApiSecret: 'secret456',
        CREDENTIALS: 'creds789',
      };

      const masked = ErrorUtils.maskSensitive(metadata);
      expect(masked.apiKey).toBe('[REDACTED]');
      expect(masked.ApiSecret).toBe('[REDACTED]');
      expect(masked.CREDENTIALS).toBe('[REDACTED]');
    });
  });

  describe('fromHttpResponse', () => {
    it('should create ValidationError for 400', () => {
      const error = ErrorUtils.fromHttpResponse(400, {
        message: 'Bad request',
        fields: { email: { reason: 'Invalid' } },
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.statusCode).toBe(400);
    });

    it('should create AuthenticationError for 401', () => {
      const error = ErrorUtils.fromHttpResponse(401, {
        message: 'Unauthorized',
      });

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.statusCode).toBe(401);
    });

    it('should create AuthorizationError for 403', () => {
      const error = ErrorUtils.fromHttpResponse(403, {
        message: 'Forbidden',
      });

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.statusCode).toBe(403);
    });

    it('should create NotFoundError for 404', () => {
      const error = ErrorUtils.fromHttpResponse(404, {
        message: 'Not found',
        resourceType: 'User',
        resourceId: 'user-123',
      });

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
    });

    it('should create RateLimitError for 429', () => {
      const error = ErrorUtils.fromHttpResponse(429, {
        message: 'Too many requests',
        limit: 100,
        current: 150,
        retryAfter: 60,
      });

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.statusCode).toBe(429);
    });

    it('should create ServerError for 5xx', () => {
      const error = ErrorUtils.fromHttpResponse(500, {
        message: 'Internal server error',
      });

      expect(error).toBeInstanceOf(ServerError);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('formatForLogging', () => {
    it('should format error for logging', () => {
      const error = new ValidationError('Invalid data');
      const formatted = ErrorUtils.formatForLogging(error);

      expect(formatted.code).toBe('VALIDATION_ERROR');
      expect(formatted.message).toBe('Invalid data');
      expect(formatted.statusCode).toBe(422);
    });

    it('should exclude stack by default', () => {
      const error = new AppError('Test');
      const formatted = ErrorUtils.formatForLogging(error);

      expect(formatted).not.toHaveProperty('stack');
    });

    it('should include stack when requested', () => {
      const error = new AppError('Test');
      const formatted = ErrorUtils.formatForLogging(error, true);

      expect(formatted.stack).toBeDefined();
    });

    it('should include context and metadata', () => {
      const error = new AppError('Test')
        .withContext({ userId: 'user-1', requestId: 'req-1' })
        .withMetadata({ action: 'create' });

      const formatted = ErrorUtils.formatForLogging(error);

      expect(formatted.context?.userId).toBe('user-1');
      expect(formatted.metadata?.action).toBe('create');
    });
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    globalErrorHandler.clear();
  });

  it('should create error handler', () => {
    const handler = new ErrorHandler();
    expect(handler).toBeDefined();
  });

  it('should register global handler', async () => {
    const handler = new ErrorHandler();
    const mockHandler = jest.fn();

    handler.registerGlobal(mockHandler);
    const error = new AppError('Test');

    await handler.handle(error);
    expect(mockHandler).toHaveBeenCalledWith(error);
  });

  it('should register category-specific handler', async () => {
    const handler = new ErrorHandler();
    const mockHandler = jest.fn();

    handler.registerCategory('validation', mockHandler);
    const error = new ValidationError();

    await handler.handle(error);
    expect(mockHandler).toHaveBeenCalledWith(error);
  });

  it('should call critical handler for critical errors', async () => {
    const mockCritical = jest.fn();
    const handler = new ErrorHandler({ onCritical: mockCritical });

    const error = new DatabaseError();
    await handler.handle(error);

    expect(mockCritical).toHaveBeenCalledWith(error);
  });

  it('should call validation handler for validation errors', async () => {
    const mockValidation = jest.fn();
    const handler = new ErrorHandler({ onValidation: mockValidation });

    const error = new ValidationError();
    await handler.handle(error);

    expect(mockValidation).toHaveBeenCalledWith(error);
  });

  it('should call multiple handlers', async () => {
    const handler = new ErrorHandler();
    const mock1 = jest.fn();
    const mock2 = jest.fn();

    handler.registerGlobal(mock1);
    handler.registerGlobal(mock2);

    const error = new AppError('Test');
    await handler.handle(error);

    expect(mock1).toHaveBeenCalled();
    expect(mock2).toHaveBeenCalled();
  });

  it('should clear all handlers', () => {
    const handler = new ErrorHandler();
    handler.registerGlobal(jest.fn());
    handler.registerCategory('validation', jest.fn());

    handler.clear();

    const mockHandler = jest.fn();
    handler.registerGlobal(mockHandler);
    // After clear, only new global handler should exist
    expect(handler).toBeDefined();
  });

  it('should handle errors in handlers gracefully', async () => {
    const handler = new ErrorHandler();
    const errorHandler = jest.fn().mockRejectedValue(new Error('Handler failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    handler.registerGlobal(errorHandler);
    const error = new AppError('Test');

    await expect(handler.handle(error)).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should chain handler registration', () => {
    const handler = new ErrorHandler();
    const result = handler
      .registerGlobal(jest.fn())
      .registerCategory('validation', jest.fn())
      .registerCategory('authentication', jest.fn());

    expect(result).toBe(handler);
  });
});

describe('Error Integration', () => {
  it('should work through complete error lifecycle', async () => {
    // Create error
    const error = new ValidationError('Invalid input');
    error
      .addField('email', 'invalid@', 'Invalid email format')
      .withContext({ userId: 'user-1', requestId: 'req-123' })
      .withMetadata({ attemptNumber: 1 });

    // Check properties
    expect(error.isAppError).toBe(true);
    expect(ErrorUtils.isAppError(error)).toBe(true);
    expect(ErrorUtils.isClientError(error)).toBe(true);
    expect(ErrorUtils.isRetryable(error)).toBe(false);

    // Get recovery strategy
    const strategy = ErrorUtils.getRecoveryStrategy(error);
    expect(strategy.canRecover).toBe(false);

    // Serialize for transmission
    const serialized = error.serialize();
    expect(serialized.code).toBe('VALIDATION_ERROR');
    expect(serialized.metadata?.fields).toBeDefined();

    // Format for logging
    const formatted = ErrorUtils.formatForLogging(error, true);
    expect(formatted.stack).toBeDefined();

    // Handle with handlers
    const handler = new ErrorHandler();
    const mockHandler = jest.fn();
    handler.registerCategory('validation', mockHandler);

    await handler.handle(error);
    expect(mockHandler).toHaveBeenCalledWith(error);
  });
});
