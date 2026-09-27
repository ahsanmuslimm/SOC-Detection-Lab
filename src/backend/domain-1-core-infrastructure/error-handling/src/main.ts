/**
 * Error Handling - Main Implementation
 * Comprehensive error handling system with typed errors, serialization, and context tracking
 */

import type {
  IAppError,
  IErrorContext,
  IErrorMetadata,
  ISerializedError,
  IErrorCause,
  HttpStatusCode,
  ErrorSeverity,
  ErrorCategory,
  IValidationErrorFields,
  IValidationErrorDetail,
  IErrorHandlerOptions,
  IErrorRecovery,
} from './types';

/**
 * Application Error - Base class for all application errors
 */
export class AppError extends Error implements IAppError {
  code: string;
  statusCode: HttpStatusCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  metadata: IErrorMetadata;
  context?: IErrorContext;
  cause?: Error | IErrorCause;
  isAppError: true = true;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: HttpStatusCode = 500,
    category: ErrorCategory = 'unknown',
    severity: ErrorSeverity = 'high'
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.metadata = {};

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  serialize(): ISerializedError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      type: this.name,
      timestamp: new Date().toISOString(),
      context: this.context,
      metadata: Object.keys(this.metadata).length > 0 ? this.metadata : undefined,
      cause: this.getCause(),
      stack: this.stack,
    };
  }

  getCause(): IErrorCause | undefined {
    if (!this.cause) return undefined;

    if (this.cause instanceof Error) {
      return {
        message: this.cause.message,
        code: (this.cause as any).code,
        stack: this.cause.stack,
      };
    }

    return this.cause as IErrorCause;
  }

  withContext(context: Partial<IErrorContext>): IAppError {
    this.context = { ...this.context, ...context };
    return this;
  }

  withMetadata(metadata: IErrorMetadata): IAppError {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  fields: IValidationErrorFields;

  constructor(
    message: string = 'Validation failed',
    fields: IValidationErrorFields = {}
  ) {
    super(message, 'VALIDATION_ERROR', 422, 'validation', 'medium');
    this.name = 'ValidationError';
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  addField(field: string, value: unknown, reason: string, constraint?: string): this {
    this.fields[field] = {
      field,
      value,
      reason,
      constraint,
    };
    return this;
  }

  serialize(): ISerializedError {
    const serialized = super.serialize();
    return {
      ...serialized,
      metadata: {
        ...this.metadata,
        fields: this.fields,
      },
    };
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    metadata: IErrorMetadata = {}
  ) {
    super(message, 'AUTH_ERROR', 401, 'authentication', 'high');
    this.name = 'AuthenticationError';
    this.metadata = metadata;
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  requiredPermissions?: string[];
  userPermissions?: string[];

  constructor(
    message: string = 'Access denied',
    requiredPermissions?: string[],
    userPermissions?: string[]
  ) {
    super(message, 'AUTHZ_ERROR', 403, 'authorization', 'high');
    this.name = 'AuthorizationError';
    this.requiredPermissions = requiredPermissions;
    this.userPermissions = userPermissions;
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }

  serialize(): ISerializedError {
    const serialized = super.serialize();
    return {
      ...serialized,
      metadata: {
        ...this.metadata,
        requiredPermissions: this.requiredPermissions,
        userPermissions: this.userPermissions,
      },
    };
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  resourceType: string;
  resourceId: string;

  constructor(resourceType: string, resourceId: string) {
    const message = `${resourceType} with ID ${resourceId} not found`;
    super(message, 'NOT_FOUND', 404, 'not_found', 'medium');
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serialize(): ISerializedError {
    const serialized = super.serialize();
    return {
      ...serialized,
      metadata: {
        ...this.metadata,
        resourceType: this.resourceType,
        resourceId: this.resourceId,
      },
    };
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource conflict',
    metadata: IErrorMetadata = {}
  ) {
    super(message, 'CONFLICT_ERROR', 409, 'conflict', 'medium');
    this.name = 'ConflictError';
    this.metadata = metadata;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  retryAfter: number;
  limit: number;
  current: number;

  constructor(
    limit: number,
    current: number,
    retryAfter: number = 60
  ) {
    const message = `Rate limit exceeded: ${current}/${limit} requests`;
    super(message, 'RATE_LIMIT', 429, 'rate_limit', 'low');
    this.name = 'RateLimitError';
    this.limit = limit;
    this.current = current;
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  serialize(): ISerializedError {
    const serialized = super.serialize();
    return {
      ...serialized,
      metadata: {
        ...this.metadata,
        limit: this.limit,
        current: this.current,
        retryAfter: this.retryAfter,
      },
    };
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  query?: string;
  tableName?: string;

  constructor(
    message: string = 'Database error',
    query?: string,
    tableName?: string
  ) {
    super(message, 'DB_ERROR', 500, 'database', 'critical');
    this.name = 'DatabaseError';
    this.query = query;
    this.tableName = tableName;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  serialize(): ISerializedError {
    const serialized = super.serialize();
    return {
      ...serialized,
      metadata: {
        ...this.metadata,
        query: this.query ? '[REDACTED]' : undefined,
        tableName: this.tableName,
      },
    };
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends AppError {
  serviceName: string;
  originalError?: Error;

  constructor(
    serviceName: string,
    message: string = `${serviceName} service error`,
    originalError?: Error
  ) {
    super(message, `${serviceName.toUpperCase()}_ERROR`, 502, 'external_service', 'high');
    this.name = 'ExternalServiceError';
    this.serviceName = serviceName;
    this.originalError = originalError;
    this.cause = originalError;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Server Error
 */
export class ServerError extends AppError {
  originalError?: Error;

  constructor(
    message: string = 'Internal server error',
    originalError?: Error
  ) {
    super(message, 'SERVER_ERROR', 500, 'server', 'critical');
    this.name = 'ServerError';
    this.originalError = originalError;
    this.cause = originalError;
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error Utilities
 */
export class ErrorUtils {
  /**
   * Check if error is application error
   */
  static isAppError(error: unknown): error is IAppError {
    return (
      error instanceof Error &&
      'code' in error &&
      'statusCode' in error &&
      'isAppError' in error &&
      (error as any).isAppError === true
    );
  }

  /**
   * Convert any error to AppError
   */
  static toAppError(error: unknown): IAppError {
    if (this.isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      const serverError = new ServerError(error.message, error);
      serverError.stack = error.stack;
      return serverError;
    }

    const serverError = new ServerError(String(error));
    return serverError;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: IAppError): boolean {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.statusCode);
  }

  /**
   * Check if error is client error (4xx)
   */
  static isClientError(error: IAppError): boolean {
    return error.statusCode >= 400 && error.statusCode < 500;
  }

  /**
   * Check if error is server error (5xx)
   */
  static isServerError(error: IAppError): boolean {
    return error.statusCode >= 500;
  }

  /**
   * Get recovery strategy
   */
  static getRecoveryStrategy(error: IAppError): IErrorRecovery {
    switch (error.code) {
      case 'RATE_LIMIT':
        return {
          canRecover: true,
          strategy: 'retry',
          retryDelay: 60000,
        };
      case 'DB_ERROR':
        return {
          canRecover: true,
          strategy: 'retry',
          retryDelay: 5000,
          retryCount: 3,
        };
      case 'VALIDATION_ERROR':
        return {
          canRecover: false,
        };
      case 'AUTH_ERROR':
      case 'AUTHZ_ERROR':
        return {
          canRecover: false,
        };
      default:
        return {
          canRecover: this.isRetryable(error),
          strategy: 'retry',
          retryDelay: 1000,
        };
    }
  }

  /**
   * Mask sensitive data from metadata
   */
  static maskSensitive(metadata: IErrorMetadata): IErrorMetadata {
    const masked = { ...metadata };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'accessToken',
      'refreshToken',
      'credentials',
    ];

    Object.keys(masked).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        masked[key] = '[REDACTED]';
      }
    });

    return masked;
  }

  /**
   * Create error from HTTP response
   */
  static fromHttpResponse(
    status: number,
    body: unknown
  ): IAppError {
    const errorBody = body as any;
    const message = errorBody?.message || errorBody?.error || 'HTTP Error';

    switch (status) {
      case 400:
        return new ValidationError(message, errorBody?.fields);
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(
          errorBody?.resourceType || 'Resource',
          errorBody?.resourceId || 'unknown'
        );
      case 409:
        return new ConflictError(message);
      case 422:
        return new ValidationError(message, errorBody?.fields);
      case 429:
        return new RateLimitError(
          errorBody?.limit || 100,
          errorBody?.current || 101,
          errorBody?.retryAfter || 60
        );
      case 500:
      case 502:
      case 503:
        return new ExternalServiceError(
          errorBody?.service || 'Unknown',
          message
        );
      default:
        return new ServerError(message);
    }
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: IAppError, includeStack: boolean = false): Record<string, unknown> {
    const formatted = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      category: error.category,
      severity: error.severity,
      context: error.context,
      metadata: error.metadata,
    };

    if (includeStack) {
      formatted['stack'] = error.stack;
    }

    return formatted;
  }
}

/**
 * Error Handler - Manages error callbacks and processing
 */
export class ErrorHandler {
  private handlers: Map<ErrorCategory, IErrorHandlerOptions['onError'][]> = new Map();
  private globalHandlers: IErrorHandlerOptions['onError'][] = [];
  private options: IErrorHandlerOptions;

  constructor(options: IErrorHandlerOptions = {}) {
    this.options = {
      maskSensitive: true,
      includeStack: false,
      ...options,
    };
  }

  /**
   * Register global error handler
   */
  registerGlobal(handler: IErrorHandlerOptions['onError']): this {
    this.globalHandlers.push(handler);
    return this;
  }

  /**
   * Register category-specific handler
   */
  registerCategory(category: ErrorCategory, handler: IErrorHandlerOptions['onError']): this {
    if (!this.handlers.has(category)) {
      this.handlers.set(category, []);
    }
    this.handlers.get(category)!.push(handler);
    return this;
  }

  /**
   * Handle error with registered handlers
   */
  async handle(error: IAppError): Promise<void> {
    const appError = ErrorUtils.isAppError(error) ? error : ErrorUtils.toAppError(error);

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(appError);
      } catch (err) {
        console.error('Error in global handler:', err);
      }
    }

    // Call category-specific handlers
    const categoryHandlers = this.handlers.get(appError.category) || [];
    for (const handler of categoryHandlers) {
      try {
        await handler(appError);
      } catch (err) {
        console.error('Error in category handler:', err);
      }
    }

    // Call specific handlers based on severity
    if (appError.severity === 'critical' && this.options.onCritical) {
      try {
        await this.options.onCritical(appError);
      } catch (err) {
        console.error('Error in critical handler:', err);
      }
    }

    if (appError.category === 'validation' && this.options.onValidation) {
      try {
        await this.options.onValidation(appError);
      } catch (err) {
        console.error('Error in validation handler:', err);
      }
    }
  }

  /**
   * Clear all handlers
   */
  clear(): this {
    this.handlers.clear();
    this.globalHandlers = [];
    return this;
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new ErrorHandler();
