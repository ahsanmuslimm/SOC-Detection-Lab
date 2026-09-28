/**
 * Report Routes - 5 endpoints
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { ReportController } from '../controllers/ReportController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createReportRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new ReportController(orchestrator);

  router.get('/', authMiddleware, asyncHandler((req, res) => controller.listReports(req as any, res)));
  router.post('/', authMiddleware, authorizationMiddleware('report:generate'), asyncHandler((req, res) => controller.createReport(req as any, res)));
  router.get('/:id', authMiddleware, asyncHandler((req, res) => controller.getReport(req as any, res)));
  router.put('/:id', authMiddleware, authorizationMiddleware('report:edit'), asyncHandler((req, res) => controller.updateReport(req as any, res)));
  router.delete('/:id', authMiddleware, authorizationMiddleware('report:delete'), asyncHandler((req, res) => controller.deleteReport(req as any, res)));

  return router;
}
