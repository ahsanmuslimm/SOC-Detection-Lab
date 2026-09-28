/**
 * Alert Routes
 *
 * REST API routes for alert management endpoints.
 */

import { Router } from 'express';
import { authMiddleware, authorizationMiddleware, asyncHandler } from '../middleware';
import { AlertController } from '../controllers/AlertController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export function createAlertRoutes(orchestrator: IServiceOrchestrator): Router {
  const router = Router();
  const controller = new AlertController(orchestrator);

  // List alerts
  router.get('/', authMiddleware, asyncHandler((req, res) => controller.listAlerts(req as any, res)));

  // Create alert
  router.post('/', authMiddleware, authorizationMiddleware('alert:create'), asyncHandler((req, res) => controller.createAlert(req as any, res)));

  // Get alert details
  router.get('/:id', authMiddleware, asyncHandler((req, res) => controller.getAlert(req as any, res)));

  // Update alert
  router.put('/:id', authMiddleware, authorizationMiddleware('alert:edit'), asyncHandler((req, res) => controller.updateAlert(req as any, res)));

  // Delete alert
  router.delete('/:id', authMiddleware, authorizationMiddleware('alert:delete'), asyncHandler((req, res) => controller.deleteAlert(req as any, res)));

  // Acknowledge alert
  router.post('/:id/acknowledge', authMiddleware, authorizationMiddleware('alert:acknowledge'), asyncHandler((req, res) => controller.acknowledgeAlert(req as any, res)));

  // Assign alert
  router.post('/:id/assign', authMiddleware, authorizationMiddleware('alert:assign'), asyncHandler((req, res) => controller.assignAlert(req as any, res)));

  // Get stats
  router.get('/stats/summary', authMiddleware, asyncHandler((req, res) => controller.getAlertStats(req as any, res)));

  // Bulk update
  router.post('/bulk/update', authMiddleware, authorizationMiddleware('alert:edit'), asyncHandler((req, res) => controller.bulkUpdateAlerts(req as any, res)));

  return router;
}
