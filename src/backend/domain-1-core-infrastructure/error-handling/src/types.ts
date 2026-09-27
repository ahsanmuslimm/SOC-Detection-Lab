/**
 * Error Handling - Type Definitions
 * Error types and interfaces for the application
 */

/**
 * Base error metadata interface
 */
export interface IErrorMetadata {
  [key: string]: unknown;
}

/**
 * Error context for tracking error origin and flow
 */
export interface IErrorContext {
  userId?: string;
  requestId?: string;
  traceId?: string;
  timestamp?: Date;
  path?: string;
  method?: string;
}

/**
 * Error cause for error chaining
 */
export interface IErrorCause {
  message: string;
  code?: string;
  stack?: string;
}

/**
 * Serialized error for logging and transmission
 */
export interface ISerializedError {
  code: string;
  message: string;
  statusCode: number;
  type: string;
  timestamp: string;
  context?: IErrorContext;
  metadata?: IErrorMetadata;
  cause?: IErrorCause;
  stack?: string;
}

/**
 * HTTP error status codes
 */
export type HttpStatusCode =
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable;

/**
 * Error severity levels
 */
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Error categories
 */
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'external_service'
  | 'database'
  | 'unknown';

/**
 * Application error type
 */
export interface IAppError extends Error {
  code: string;
  statusCode: HttpStatusCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  metadata: IErrorMetadata;
  context?: IErrorContext;
  cause?: Error | IErrorCause;
  isAppError: true;

  serialize(): ISerializedError;
  getCause(): IErrorCause | undefined;
  withContext(context: Partial<IErrorContext>): IAppError;
  withMetadata(metadata: IErrorMetadata): IAppError;
}

/**
 * Validation error details
 */
export interface IValidationErrorDetail {
  field: string;
  value: unknown;
  reason: string;
  constraint?: string;
}

/**
 * Validation error fields
 */
export interface IValidationErrorFields {
  [field: string]: IValidationErrorDetail | IValidationErrorDetail[];
}

/**
 * Error handler callback
 */
export type ErrorHandler = (error: IAppError) => Promise<void> | void;

/**
 * Error handler options
 */
export interface IErrorHandlerOptions {
  onError?: ErrorHandler;
  onCritical?: ErrorHandler;
  onValidation?: ErrorHandler;
  maskSensitive?: boolean;
  includeStack?: boolean;
}

/**
 * Error recovery strategy
 */
export interface IErrorRecovery {
  canRecover: boolean;
  strategy?: 'retry' | 'fallback' | 'circuit_break' | 'queue';
  retryCount?: number;
  retryDelay?: number;
}
