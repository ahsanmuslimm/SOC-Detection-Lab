/**
 * Detection Rules Routes - 7 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { DetectionRuleController } from '../controllers/DetectionRuleController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createRuleRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new DetectionRuleController(orchestrator);

  router.get('/', authMiddleware, asyncHandler((req, res) => controller.listRules(req as any, res)));
  router.post('/', authMiddleware, authorizationMiddleware('rule:create'), asyncHandler((req, res) => controller.createRule(req as any, res)));
  router.get('/:id', authMiddleware, asyncHandler((req, res) => controller.getRule(req as any, res)));
  router.put('/:id', authMiddleware, authorizationMiddleware('rule:edit'), asyncHandler((req, res) => controller.updateRule(req as any, res)));
  router.delete('/:id', authMiddleware, authorizationMiddleware('rule:delete'), asyncHandler((req, res) => controller.deleteRule(req as any, res)));
  router.post('/:id/test', authMiddleware, authorizationMiddleware('rule:test'), asyncHandler((req, res) => controller.testRule(req as any, res)));
  router.post('/:id/deploy', authMiddleware, authorizationMiddleware('rule:deploy'), asyncHandler((req, res) => controller.deployRule(req as any, res)));

  return router;
}
