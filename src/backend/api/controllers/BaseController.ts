/**
 * Base Controller
 *
 * Abstract base class for all API controllers with common functionality.
 *
 * @module api/controllers/BaseController
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, IApiResponse, IPaginatedResponse } from '../types';
import { HTTP_STATUS, API_ERROR_CODES } from '../types';

/**
 * Abstract base controller
 */
export abstract class BaseController {
  /**
   * Send success response
   */
  protected success<T>(
    res: Response,
    data: T,
    statusCode: number = HTTP_STATUS.OK,
    meta?: any
  ): void {
    const response: IApiResponse<T> = {
      success: true,
      data,
      meta: meta || {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  protected created<T>(res: Response, data: T, meta?: any): void {
    this.success(res, data, HTTP_STATUS.CREATED, meta);
  }

  /**
   * Send paginated response
   */
  protected paginated<T>(
    res: Response,
    items: T[],
    page: number,
    pageSize: number,
    total: number,
    statusCode: number = HTTP_STATUS.OK
  ): void {
    const totalPages = Math.ceil(total / pageSize);

    const response: IPaginatedResponse<T> = {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  protected error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_ERROR,
    details?: any
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send not found response
   */
  protected notFound(res: Response, resource: string): void {
    this.error(
      res,
      API_ERROR_CODES.NOT_FOUND,
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND
    );
  }

  /**
   * Send validation error response
   */
  protected validationError(res: Response, details: any): void {
    this.error(
      res,
      API_ERROR_CODES.VALIDATION_ERROR,
      'Validation error',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      details
    );
  }

  /**
   * Send conflict response
   */
  protected conflict(res: Response, message: string): void {
    this.error(
      res,
      API_ERROR_CODES.CONFLICT,
      message,
      HTTP_STATUS.CONFLICT
    );
  }

  /**
   * Send unauthorized response
   */
  protected unauthorized(res: Response): void {
    this.error(
      res,
      API_ERROR_CODES.UNAUTHORIZED,
      'Unauthorized',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  /**
   * Send forbidden response
   */
  protected forbidden(res: Response): void {
    this.error(
      res,
      API_ERROR_CODES.FORBIDDEN,
      'Forbidden',
      HTTP_STATUS.FORBIDDEN
    );
  }

  /**
   * Extract pagination parameters
   */
  protected getPaginationParams(req: any): { page: number; pageSize: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25));
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    return { page, pageSize, limit, offset };
  }

  /**
   * Extract filter parameters
   */
  protected getFilterParams(req: any): Record<string, any> {
    const filters: Record<string, any> = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.assignedTo) filters.assignedTo = req.query.assignedTo;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    return filters;
  }

  /**
   * Extract sort parameters
   */
  protected getSortParams(req: any): { sortBy: string; sortOrder: 'ASC' | 'DESC' } {
    return {
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: (req.query.sortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC'
    };
  }

  /**
   * Get user ID from request
   */
  protected getUserId(req: IAuthenticatedRequest): string {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user.id;
  }

  /**
   * Log action
   */
  protected log(message: string, data?: any): void {
    console.log(`[Controller] ${message}`, data || '');
  }

  /**
   * Log error
   */
  protected logError(message: string, error: any): void {
    console.error(`[Controller] ${message}:`, {
      message: error.message,
      stack: error.stack
    });
  }
}
