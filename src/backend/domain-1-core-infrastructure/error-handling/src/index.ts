/**
 * Error Handling - Public API
 */

export {
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
} from './main';

export type {
  IErrorMetadata,
  IErrorContext,
  IErrorCause,
  ISerializedError,
  HttpStatusCode,
  ErrorSeverity,
  ErrorCategory,
  IAppError,
  IValidationErrorDetail,
  IValidationErrorFields,
  IErrorHandlerOptions,
  IErrorRecovery,
} from './types';
