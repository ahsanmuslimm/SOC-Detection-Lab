/**
 * REST API - Middleware
 *
 * Authentication, authorization, validation, and logging middleware.
 *
 * @module api/middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { IAuthenticatedRequest, IRequestContext } from './types';
import { HTTP_STATUS, API_ERROR_CODES } from './types';

/**
 * Revoked access-token registry (in-memory).
 *
 * Logout revokes the presented access token for the lifetime of the
 * process; the shared Redis-backed registry replaces this in the
 * hardening phase when multiple gateway instances run.
 */
const revokedTokens: Set<string> = new Set();

export function revokeToken(token: string): void {
  revokedTokens.add(token);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

/**
 * Authentication middleware
 *
 * Verifies JWT token and extracts user context
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Missing or invalid authorization header'
        }
      });
      return;
    }

    const token = authHeader.substring(7);

    if (isTokenRevoked(token)) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: API_ERROR_CODES.TOKEN_EXPIRED,
          message: 'Token has been revoked'
        }
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;

      const authReq = req as IAuthenticatedRequest;
      authReq.userId = decoded.userId;
      authReq.user = {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        roleId: decoded.roleId
      };

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: API_ERROR_CODES.TOKEN_EXPIRED,
            message: 'Token has expired'
          }
        });
      } else {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: API_ERROR_CODES.TOKEN_INVALID,
            message: 'Invalid token'
          }
        });
      }
    }
  } catch (error: any) {
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      error: {
        code: API_ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication check failed'
      }
    });
  }
}

/**
 * Authorization middleware
 *
 * Checks if user has required permissions for the resource
 */
export function authorizationMiddleware(requiredPermissions: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;

      if (!authReq.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: API_ERROR_CODES.UNAUTHORIZED,
            message: 'User not authenticated'
          }
        });
        return;
      }

      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Check if user has at least one required permission
      const hasPermission = permissions.some(perm => {
        // TODO: Query database for actual permissions
        // For now, use role-based permissions
        const rolePermissions: Record<string, string[]> = {
          'ADMIN': ['*'],
          'SOC_ANALYST': ['alert:read', 'alert:acknowledge', 'case:read', 'case:create', 'investigation:read', 'report:read'],
          'DETECTION_ENGINEER': ['rule:create', 'rule:edit', 'rule:test', 'alert:read', 'case:read'],
          'SOC_MANAGER': ['alert:read', 'case:read', 'case:assign', 'investigation:read', 'report:generate', 'user:read'],
          'VIEWER': ['alert:read', 'case:read', 'report:read']
        };

        const userPerms = rolePermissions[authReq.user.role] || [];
        return userPerms.includes('*') || userPerms.includes(perm);
      });

      if (!hasPermission) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: API_ERROR_CODES.INSUFFICIENT_PERMISSIONS,
            message: `Requires permissions: ${permissions.join(', ')}`
          }
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: 'Authorization check failed'
        }
      });
    }
  };
}

/**
 * Request validation middleware
 *
 * Validates request body against schema
 */
export function validateRequest(schema: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const details = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Request validation failed',
            details
          }
        });
        return;
      }

      req.body = value;
      next();
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: 'Validation error'
        }
      });
    }
  };
}

/**
 * Query parameter validation
 */
export function validateQueryParams(schema: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const details = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message: 'Query parameter validation failed',
            details
          }
        });
        return;
      }

      req.query = value;
      next();
    } catch (error: any) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: 'Query validation error'
        }
      });
    }
  };
}

/**
 * Audit logging middleware
 *
 * Logs all API requests to audit trail
 */
export function auditMiddleware(orchestrator: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const context: IRequestContext = (req as any).context;
    const authReq = req as IAuthenticatedRequest;

    const startTime = Date.now();

    // Capture response
    const originalJson = res.json;
    res.json = function(data: any) {
      const duration = Date.now() - startTime;

      // Log to audit service
      if (orchestrator && orchestrator.auditService) {
        orchestrator.auditService.log({
          timestamp: new Date(),
          actor: authReq.user?.id || 'anonymous',
          action: `${req.method} ${req.path}`,
          resource: req.path,
          status: res.statusCode,
          duration,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestId: context.requestId,
          traceId: context.traceId
        }).catch((error: any) => {
          console.error('[Audit] Failed to log:', error.message);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Request timing middleware
 *
 * Measures and logs request processing time
 */
export function timingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const context: IRequestContext = (req as any).context;
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      console.warn(`[SLOW] ${req.method} ${req.path} took ${duration}ms`);
    }

    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalJson.call(this, data);
  };

  next();
}

/**
 * Request sanitization middleware
 *
 * Sanitizes input to prevent injection attacks
 */
export function sanitizeMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as any);
  }

  next();
}

/**
 * Sanitize object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip keys that might be injection vectors
    if (key.includes('$') || key.includes('.')) {
      continue;
    }

    if (typeof value === 'string') {
      // Basic XSS prevention
      sanitized[key] = value
        .replace(/[<>]/g, '')
        .substring(0, 10000);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Error response middleware
 *
 * Formats error responses consistently
 */
export function errorResponseMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
  const context: IRequestContext = (req as any).context;
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const errorCode = err.code || API_ERROR_CODES.INTERNAL_ERROR;

  console.error(`[ERROR] ${context.traceId}:`, {
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message: err.message
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message,
      timestamp: new Date().toISOString(),
      traceId: context.traceId,
      details: err.details
    }
  });
}

/**
 * CORS preflight middleware
 */
export function corsPreflightMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Trace-Id');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
  } else {
    next();
  }
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Content-Security-Policy', "default-src 'self'");
  next();
}

/**
 * Async error handler wrapper
 *
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => unknown
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Optional authentication middleware
 *
 * Attempts to authenticate but doesn't fail if no token
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;

        const authReq = req as IAuthenticatedRequest;
        authReq.userId = decoded.userId;
        authReq.user = {
          id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          roleId: decoded.roleId
        };
      } catch (error) {
        // Token invalid, but continue without auth
      }
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Rate limiting per user
 */
export function rateLimitPerUser(windowMs: number = 60000, maxRequests: number = 60) {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as IAuthenticatedRequest;
    const userId = authReq.user?.id || req.ip || 'anonymous';

    const now = Date.now();
    const userData = userRequestCounts.get(userId);

    if (!userData || now > userData.resetTime) {
      userRequestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      next();
    } else if (userData.count < maxRequests) {
      userData.count++;
      next();
    } else {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: API_ERROR_CODES.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs}ms`
        }
      });
    }
  };
}
