/**
 * API Gateway Service - Public API
 */

export { APIGateway, createAPIGateway } from './main';

export type {
  HTTPMethod,
  RouteHandler,
  MiddlewareHandler,
  IRouteContext,
  IUserContext,
  IRouteResponse,
  IMiddlewareResult,
  IRoute,
  IRouteGroup,
  IRateLimit,
  IRequestInterceptor,
  IResponseInterceptor,
  IErrorHandler,
  IAuthMiddlewareConfig,
  IAuthzMiddlewareConfig,
  ICORSConfig,
  IAPIRequest,
  IAPIResponse,
  IRouteExecutionResult,
  IRateLimiterState,
  IAPIGatewayConfig,
  IGatewayMetrics,
  IGatewayAuditEntry,
  IRouteExecutionEvent,
  RouteExecutionListener,
  IAPIEndpointMetadata,
  IAPIParameter,
  IAPIRequestBody,
  IMediaType,
  IHealthCheckResult,
  IRouteRegistrationResult,
  IBatchRouteRegistrationResult,
  IAPIVersion,
} from './types';
