/**
 * RBAC Routes - 5 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { RBACController } from '../controllers/RBACController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createRBACRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new RBACController(orchestrator);

  router.get('/roles', authMiddleware, asyncHandler((req, res) => controller.listRoles(req as any, res)));
  router.get('/roles/:id', authMiddleware, asyncHandler((req, res) => controller.getRole(req as any, res)));
  router.put('/roles/:id', authMiddleware, authorizationMiddleware('rbac:manage'), asyncHandler((req, res) => controller.updateRolePermissions(req as any, res)));
  router.get('/permissions', authMiddleware, asyncHandler((req, res) => controller.listPermissions(req as any, res)));
  router.get('/user/:userId/permissions', authMiddleware, asyncHandler((req, res) => controller.getUserPermissions(req as any, res)));

  return router;
}
