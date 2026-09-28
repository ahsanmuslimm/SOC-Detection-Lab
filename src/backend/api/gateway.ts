/**
 * REST API - Gateway Setup
 *
 * Express application setup with middleware, routes, and error handling.
 *
 * @module api/gateway
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import type { IServiceOrchestrator } from '../services/orchestrator/types';
import type { IApiResponse, IErrorResponse, IHealthCheckResponse, IRequestContext } from './types';
import { HTTP_STATUS, API_ERROR_CODES, API_BASE_PATH } from './types';

/**
 * API Gateway interface
 */
export interface IApiGateway {
  app: Express;
  start(port: number): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

/**
 * API Gateway implementation
 */
export class ApiGateway implements IApiGateway {
  app: Express;
  private server: any;
  private running: boolean = false;
  private orchestrator: IServiceOrchestrator;

  constructor(orchestrator: IServiceOrchestrator) {
    this.orchestrator = orchestrator;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request context middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const context: IRequestContext = {
        traceId: req.headers['x-trace-id'] as string || uuidv4(),
        requestId: uuidv4(),
        startTime: new Date(),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      };

      (req as any).context = context;
      res.setHeader('X-Trace-Id', context.traceId);
      res.setHeader('X-Request-Id', context.requestId);

      next();
    });

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const context: IRequestContext = (req as any).context;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get(`${API_BASE_PATH}/health`, async (req: Request, res: Response) => {
      try {
        const health = await this.orchestrator.healthCheck();

        const response: IHealthCheckResponse = {
          status: Object.values(health).every((s: any) => s.status !== 'unhealthy') ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          services: {
            database: {
              status: health.database?.status || 'unknown',
              responseTime: health.database?.responseTime || 0
            },
            cache: {
              status: health.cache?.status || 'unknown'
            },
            authentication: {
              status: health.auth?.status || 'unknown'
            }
          },
          version: '1.0.0'
        };

        res.json(this.successResponse(response));
      } catch (error: any) {
        res.status(HTTP_STATUS.INTERNAL_ERROR).json(
          this.errorResponse(
            'HEALTH_CHECK_FAILED',
            'Health check failed',
            HTTP_STATUS.INTERNAL_ERROR,
            error.message
          )
        );
      }
    });

    // Status endpoint (no auth required)
    this.app.get(`${API_BASE_PATH}/status`, (req: Request, res: Response) => {
      res.json(this.successResponse({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }));
    });

    // Version endpoint
    this.app.get(`${API_BASE_PATH}/version`, (req: Request, res: Response) => {
      res.json(this.successResponse({
        version: '1.0.0',
        name: 'SOC Detection Lab',
        buildDate: new Date().toISOString()
      }));
    });

    // API documentation
    this.app.get('/api/docs', (req: Request, res: Response) => {
      res.json({
        title: 'SOC Detection Lab API',
        version: '1.0.0',
        description: 'REST API for SOC Detection Lab platform',
        baseUrl: `http://localhost:3000${API_BASE_PATH}`,
        endpoints: {
          alerts: `${API_BASE_PATH}/alerts`,
          cases: `${API_BASE_PATH}/cases`,
          detections: `${API_BASE_PATH}/detections`,
          rules: `${API_BASE_PATH}/rules`,
          investigations: `${API_BASE_PATH}/investigations`,
          users: `${API_BASE_PATH}/users`,
          reports: `${API_BASE_PATH}/reports`,
          auth: `${API_BASE_PATH}/auth`
        }
      });
    });

    // API routes (placeholder - will be implemented in controllers)
    this.app.get(`${API_BASE_PATH}/alerts`, (req: Request, res: Response) => {
      this.handleNotImplemented(res);
    });

    this.app.post(`${API_BASE_PATH}/alerts`, (req: Request, res: Response) => {
      this.handleNotImplemented(res);
    });

    this.app.get(`${API_BASE_PATH}/cases`, (req: Request, res: Response) => {
      this.handleNotImplemented(res);
    });

    this.app.post(`${API_BASE_PATH}/cases`, (req: Request, res: Response) => {
      this.handleNotImplemented(res);
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json(
        this.errorResponse(
          API_ERROR_CODES.NOT_FOUND,
          `Endpoint not found: ${req.method} ${req.path}`,
          HTTP_STATUS.NOT_FOUND
        )
      );
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const context: IRequestContext = (req as any).context || {
        traceId: uuidv4(),
        requestId: uuidv4(),
        startTime: new Date(),
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      };

      console.error(`[ERROR] ${context.traceId}:`, {
        method: req.method,
        path: req.path,
        error: err.message,
        stack: err.stack
      });

      const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
      const errorCode = err.code || API_ERROR_CODES.INTERNAL_ERROR;

      res.status(statusCode).json(
        this.errorResponse(errorCode, err.message, statusCode, err.details)
      );
    });
  }

  /**
   * Start API gateway
   */
  async start(port: number): Promise<void> {
    try {
      // Initialize orchestrator
      console.log('[API] Initializing service orchestrator...');
      await this.orchestrator.initialize();
      console.log('[API] ✓ Service orchestrator initialized');

      // Start server
      this.server = this.app.listen(port, () => {
        this.running = true;
        console.log(`[API] ✓ Gateway running on http://localhost:${port}`);
        console.log(`[API] ✓ API base path: ${API_BASE_PATH}`);
        console.log(`[API] ✓ Health check: GET http://localhost:${port}${API_BASE_PATH}/health`);
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => this.stop());
      process.on('SIGINT', () => this.stop());
    } catch (error: any) {
      console.error('[API] Failed to start gateway:', error.message);
      throw error;
    }
  }

  /**
   * Stop API gateway
   */
  async stop(): Promise<void> {
    try {
      console.log('[API] Shutting down...');

      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(() => {
            console.log('[API] ✓ Server closed');
            resolve(undefined);
          });
        });
      }

      await this.orchestrator.shutdown();
      console.log('[API] ✓ Service orchestrator shutdown');

      this.running = false;
      console.log('[API] ✓ Gateway shutdown complete');
    } catch (error: any) {
      console.error('[API] Error during shutdown:', error.message);
    }
  }

  /**
   * Check if gateway is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Success response helper
   */
  private successResponse<T>(data: T, meta?: any): IApiResponse<T> {
    return {
      success: true,
      data,
      meta: meta || {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Error response helper
   */
  private errorResponse(
    code: string,
    message: string,
    statusCode: number,
    details?: any
  ): IErrorResponse {
    return {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      details
    };
  }

  /**
   * Handle not implemented endpoints
   */
  private handleNotImplemented(res: Response): void {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'This endpoint is not yet implemented'
      }
    });
  }
}

/**
 * Factory function to create API gateway
 */
export function createApiGateway(orchestrator: IServiceOrchestrator): IApiGateway {
  return new ApiGateway(orchestrator);
}

/**
 * Singleton instance
 */
let instance: IApiGateway | null = null;

/**
 * Get or create API gateway singleton
 */
export function getApiGateway(orchestrator?: IServiceOrchestrator): IApiGateway {
  if (!instance && orchestrator) {
    instance = createApiGateway(orchestrator);
  }
  if (!instance) {
    throw new Error('API Gateway not initialized. Call createApiGateway first.');
  }
  return instance;
}

/**
 * Set API gateway singleton (for testing)
 */
export function setApiGateway(gateway: IApiGateway): void {
  instance = gateway;
}

/**
 * Reset API gateway singleton
 */
export function resetApiGateway(): void {
  instance = null;
}
