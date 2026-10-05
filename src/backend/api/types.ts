/**
 * REST API Module - Type Definitions
 *
 * Type definitions for API requests, responses, controllers, and middleware.
 *
 * @module api/types
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Authenticated request with user context
 */
export interface IAuthenticatedRequest extends Request {
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    roleId: string;
  };
}

/**
 * Generic API response envelope
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    version: string;
    traceId?: string;
  };
}

/**
 * Paginated response
 */
export interface IPaginatedResponse<T = any> {
  success: true;
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

/**
 * Query parameters for filtering and pagination
 */
export interface IQueryParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filter?: Record<string, any>;
  search?: string;
}

/**
 * Alert response type
 */
export interface IAlertResponse {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  alertType: string;
  sourceSystem: string;
  assignedTo?: { id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * Case response type
 */
export interface ICaseResponse {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  classification: string;
  assignedTo?: { id: string; username: string };
  createdBy?: { id: string; username: string };
  alertCount: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Detection rule response type
 */
export interface IDetectionRuleResponse {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'active' | 'disabled' | 'testing';
  ruleType: string;
  detectionCount: number;
  createdBy?: { id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * Investigation response type
 */
export interface IInvestigationResponse {
  id: string;
  caseId: string;
  title: string;
  description: string;
  investigator?: { id: string; username: string };
  status: 'active' | 'on_hold' | 'completed';
  priority: number;
  evidenceCount: number;
  findings?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User response type
 */
export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  role: { id: string; name: string };
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

/**
 * Report response type
 */
export interface IReportResponse {
  id: string;
  title: string;
  reportType: 'incident' | 'threat' | 'dashboard' | 'forensic';
  status: 'draft' | 'generated' | 'distributed' | 'archived';
  dateRangeStart: string;
  dateRangeEnd: string;
  generatedAt: string;
  fileFormat: string;
  downloadUrl?: string;
}

/**
 * Create alert request
 */
export interface ICreateAlertRequest {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alertType: string;
  sourceSystem?: string;
  detectionIds?: string[];
}

/**
 * Update alert request
 */
export interface IUpdateAlertRequest {
  title?: string;
  description?: string;
  status?: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  assignedToId?: string;
}

/**
 * Create case request
 */
export interface ICreateCaseRequest {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  caseType?: string;
  classification?: string;
  alertIds?: string[];
  dueDate?: string;
}

/**
 * Update case request
 */
export interface IUpdateCaseRequest {
  title?: string;
  description?: string;
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedToId?: string;
  severity?: string;
}

/**
 * Create detection rule request
 */
export interface ICreateDetectionRuleRequest {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  ruleType: string;
  ruleDefinition: Record<string, any>;
  testData?: any;
}

/**
 * Update detection rule request
 */
export interface IUpdateDetectionRuleRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'disabled' | 'testing';
  ruleDefinition?: Record<string, any>;
}

/**
 * Login request
 */
export interface ILoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IUserResponse;
}

/**
 * Register request
 */
export interface IRegisterRequest {
  username?: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}

/**
 * Create investigation request
 */
export interface ICreateInvestigationRequest {
  caseId: string;
  title: string;
  description: string;
  priority?: number;
}

/**
 * Create report request
 */
export interface ICreateReportRequest {
  title: string;
  description?: string;
  reportType: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  scope?: {
    startDate: string;
    endDate: string;
  };
  caseIds?: string[];
  alertIds?: string[];
  fileFormat?: 'pdf' | 'html' | 'json' | 'csv';
}

/**
 * Health check response
 */
export interface IHealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: { status: string; responseTime: number };
    cache: { status: string };
    authentication: { status: string };
    [key: string]: any;
  };
  version: string;
}

/**
 * Error response
 */
export interface IErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
  traceId?: string;
}

/**
 * Pagination options
 */
export interface IPaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Filter options
 */
export interface IFilterOptions {
  status?: string;
  severity?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  [key: string]: any;
}

/**
 * Request context
 */
export interface IRequestContext {
  traceId: string;
  userId?: string;
  requestId: string;
  startTime: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * Middleware signature
 */
export type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Controller method signature
 */
export type ControllerMethod<T = any> = (req: IAuthenticatedRequest, res: Response) => Promise<void>;

/**
 * API error codes
 */
export const API_ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * API version
 */
export const API_VERSION = 'v1';

/**
 * API base path
 */
export const API_BASE_PATH = `/api/${API_VERSION}`;
