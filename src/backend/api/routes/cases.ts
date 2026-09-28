/**
 * Case Routes - 8 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { CaseController } from '../controllers/CaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createCaseRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new CaseController(orchestrator);

  router.get('/', authMiddleware, asyncHandler((req, res) => controller.listCases(req as any, res)));
  router.post('/', authMiddleware, authorizationMiddleware('case:create'), asyncHandler((req, res) => controller.createCase(req as any, res)));
  router.get('/:id', authMiddleware, asyncHandler((req, res) => controller.getCase(req as any, res)));
  router.put('/:id', authMiddleware, authorizationMiddleware('case:edit'), asyncHandler((req, res) => controller.updateCase(req as any, res)));
  router.delete('/:id', authMiddleware, authorizationMiddleware('case:delete'), asyncHandler((req, res) => controller.deleteCase(req as any, res)));
  router.post('/:id/assign', authMiddleware, authorizationMiddleware('case:assign'), asyncHandler((req, res) => controller.assignCase(req as any, res)));
  router.get('/:id/investigations', authMiddleware, asyncHandler((req, res) => controller.getCaseInvestigations(req as any, res)));
  router.get('/stats/summary', authMiddleware, asyncHandler((req, res) => controller.getCaseStats(req as any, res)));

  return router;
}
