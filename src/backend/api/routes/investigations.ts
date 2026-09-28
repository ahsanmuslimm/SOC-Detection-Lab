/**
 * Investigation Routes - 6 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { InvestigationController } from '../controllers/InvestigationController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createInvestigationRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new InvestigationController(orchestrator);

  router.get('/', authMiddleware, asyncHandler((req, res) => controller.listInvestigations(req as any, res)));
  router.post('/', authMiddleware, authorizationMiddleware('investigation:create'), asyncHandler((req, res) => controller.createInvestigation(req as any, res)));
  router.get('/:id', authMiddleware, asyncHandler((req, res) => controller.getInvestigation(req as any, res)));
  router.put('/:id', authMiddleware, authorizationMiddleware('investigation:edit'), asyncHandler((req, res) => controller.updateInvestigation(req as any, res)));
  router.get('/:id/timeline', authMiddleware, asyncHandler((req, res) => controller.getInvestigationTimeline(req as any, res)));
  router.post('/:id/close', authMiddleware, authorizationMiddleware('investigation:close'), asyncHandler((req, res) => controller.closeInvestigation(req as any, res)));

  return router;
}
