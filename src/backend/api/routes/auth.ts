/**
 * Authentication Routes - 4 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler, optionalAuthMiddleware } from '../middleware';
import { AuthController } from '../controllers/AuthController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createAuthRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new AuthController(orchestrator);

  // Login (no auth required)
  router.post('/login', asyncHandler((req, res) => controller.login(req, res)));

  // Logout (auth required)
  router.post('/logout', authMiddleware, asyncHandler((req, res) => controller.logout(req as any, res)));

  // Refresh token (no auth required, but needs refresh token)
  router.post('/refresh', asyncHandler((req, res) => controller.refreshToken(req, res)));

  // Register (admin only)
  router.post('/register', authMiddleware, authorizationMiddleware('user:create'), asyncHandler((req, res) => controller.register(req as any, res)));

  return router;
}
