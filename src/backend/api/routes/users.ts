/**
 * User Routes - 6 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { UserController } from '../controllers/UserController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createUserRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new UserController(orchestrator);

  router.get('/', authMiddleware, authorizationMiddleware('user:read'), asyncHandler((req, res) => controller.listUsers(req as any, res)));
  router.post('/', authMiddleware, authorizationMiddleware('user:create'), asyncHandler((req, res) => controller.createUser(req as any, res)));
  router.get('/:id', authMiddleware, asyncHandler((req, res) => controller.getUser(req as any, res)));
  router.put('/:id', authMiddleware, authorizationMiddleware('user:edit'), asyncHandler((req, res) => controller.updateUser(req as any, res)));
  router.delete('/:id', authMiddleware, authorizationMiddleware('user:delete'), asyncHandler((req, res) => controller.deleteUser(req as any, res)));
  router.get('/me/profile', authMiddleware, asyncHandler((req, res) => controller.getCurrentUser(req as any, res)));

  return router;
}
