/**
 * Alert Controller
 *
 * REST API endpoints for alert management.
 * Implements CRUD operations and alert workflows.
 *
 * @module api/controllers/AlertController
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ICreateAlertRequest, IUpdateAlertRequest, IAlertResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

/**
 * Alert Controller
 *
 * Handles all alert-related endpoints
 */
export class AlertController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) {
    super();
  }

  /**
   * GET /api/v1/alerts - List all alerts
   *
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 25)
   * - status: string (open, acknowledged, investigating, resolved, closed)
   * - severity: string (critical, high, medium, low)
   * - assignedTo: string (user ID)
   * - sortBy: string (default: created_at)
   * - sortOrder: ASC | DESC (default: DESC)
   * - search: string (search in title/description)
   */
  async listAlerts(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      this.log('Listing alerts', { userId: req.user.id });

      const { page, pageSize, limit, offset } = this.getPaginationParams(req);
      const filters = this.getFilterParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req);

      // Query database
      const result = await this.orchestrator.queryService?.queryAlerts?.({
        limit,
        offset,
        filters,
        sortBy,
        sortOrder
      });

      const alerts = (result?.alerts || []) as IAlertResponse[];
      const total = result?.total || 0;

      this.paginated(res, alerts, page, pageSize, total);
    } catch (error: any) {
      this.logError('Failed to list alerts', error);
      this.error(res, 'LIST_ALERTS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * POST /api/v1/alerts - Create new alert
   *
   * Request body:
   * {
   *   "title": "string (required)",
   *   "description": "string",
   *   "severity": "critical|high|medium|low (required)",
   *   "alertType": "string (required)",
   *   "sourceSystem": "string",
   *   "detectionIds": ["string"]
   * }
   */
  async createAlert(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const alertData = req.body as ICreateAlertRequest;

      this.log('Creating alert', { title: alertData.title, userId: req.user.id });

      // Validate required fields
      if (!alertData.title || !alertData.severity || !alertData.alertType) {
        this.validationError(res, {
          fields: ['title', 'severity', 'alertType'],
          message: 'Missing required fields'
        });
        return;
      }

      // Create alert via orchestrator
      const alert = await this.orchestrator.alertService?.createAlert?.({
        ...alertData,
        createdBy: req.user.id
      });

      if (!alert) {
        this.error(res, 'ALERT_CREATION_FAILED', 'Failed to create alert');
        return;
      }

      // Log audit
      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'alert_created',
        resource: `alert:${alert.id}`,
        status: 'success'
      });

      this.created(res, alert);
    } catch (error: any) {
      this.logError('Failed to create alert', error);
      this.error(res, 'CREATE_ALERT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * GET /api/v1/alerts/:id - Get alert details
   */
  async getAlert(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      this.log('Getting alert', { id, userId: req.user.id });

      const alert = await this.orchestrator.alertService?.getAlert?.(id);

      if (!alert) {
        this.notFound(res, 'Alert');
        return;
      }

      this.success(res, alert);
    } catch (error: any) {
      this.logError('Failed to get alert', error);
      this.error(res, 'GET_ALERT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * PUT /api/v1/alerts/:id - Update alert
   *
   * Request body:
   * {
   *   "title": "string",
   *   "description": "string",
   *   "status": "open|acknowledged|investigating|resolved|closed",
   *   "assignedToId": "string"
   * }
   */
  async updateAlert(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as IUpdateAlertRequest;

      this.log('Updating alert', { id, userId: req.user.id });

      // Fetch existing alert
      const existingAlert = await this.orchestrator.alertService?.getAlert?.(id);

      if (!existingAlert) {
        this.notFound(res, 'Alert');
        return;
      }

      // Update alert
      const updatedAlert = await this.orchestrator.alertService?.updateAlert?.(id, updateData);

      if (!updatedAlert) {
        this.error(res, 'ALERT_UPDATE_FAILED', 'Failed to update alert');
        return;
      }

      // Log audit
      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'alert_updated',
        resource: `alert:${id}`,
        status: 'success',
        details: updateData
      });

      this.success(res, updatedAlert);
    } catch (error: any) {
      this.logError('Failed to update alert', error);
      this.error(res, 'UPDATE_ALERT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * DELETE /api/v1/alerts/:id - Delete alert
   */
  async deleteAlert(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      this.log('Deleting alert', { id, userId: req.user.id });

      // Fetch existing alert
      const alert = await this.orchestrator.alertService?.getAlert?.(id);

      if (!alert) {
        this.notFound(res, 'Alert');
        return;
      }

      // Delete alert
      const deleted = await this.orchestrator.alertService?.deleteAlert?.(id);

      if (!deleted) {
        this.error(res, 'ALERT_DELETION_FAILED', 'Failed to delete alert');
        return;
      }

      // Log audit
      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'alert_deleted',
        resource: `alert:${id}`,
        status: 'success'
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.logError('Failed to delete alert', error);
      this.error(res, 'DELETE_ALERT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * POST /api/v1/alerts/:id/acknowledge - Acknowledge alert
   *
   * Request body:
   * {
   *   "comment": "string"
   * }
   */
  async acknowledgeAlert(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      this.log('Acknowledging alert', { id, userId: req.user.id });

      // Update alert status
      const updatedAlert = await this.orchestrator.alertService?.updateAlert?.(id, {
        status: 'acknowledged',
        assignedToId: req.user.id
      });

      if (!updatedAlert) {
        this.error(res, 'ACKNOWLEDGE_FAILED', 'Failed to acknowledge alert');
        return;
      }

      // Log audit
      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'alert_acknowledged',
        resource: `alert:${id}`,
        status: 'success',
        details: { comment }
      });

      this.success(res, updatedAlert);
    } catch (error: any) {
      this.logError('Failed to acknowledge alert', error);
      this.error(res, 'ACKNOWLEDGE_ALERT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * POST /api/v1/alerts/:id/assign - Assign alert to user
   *
   * Request body:
   * {
   *   "assignToUserId": "string (required)"
   * }
   */
  async assignAlert(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignToUserId } = req.body;

      if (!assignToUserId) {
        this.validationError(res, { field: 'assignToUserId', message: 'Required' });
        return;
      }

      this.log('Assigning alert', { id, assignTo: assignToUserId, userId: req.user.id });

      // Update alert
      const updatedAlert = await this.orchestrator.alertService?.updateAlert?.(id, {
        assignedToId: assignToUserId
      });

      if (!updatedAlert) {
        this.error(res, 'ASSIGN_FAILED', 'Failed to assign alert');
        return;
      }

      // Log audit
      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'alert_assigned',
        resource: `alert:${id}`,
        status: 'success',
        details: { assignedTo: assignToUserId }
      });

      this.success(res, updatedAlert);
    } catch (error: any) {
      this.logError('Failed to assign alert', error);
      this.error(res, 'ASSIGN_ALERT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * GET /api/v1/alerts/stats/summary - Get alert statistics
   */
  async getAlertStats(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      this.log('Getting alert stats', { userId: req.user.id });

      const stats = await this.orchestrator.alertService?.getAlertStats?.();

      if (!stats) {
        this.error(res, 'STATS_FAILED', 'Failed to get alert statistics');
        return;
      }

      this.success(res, stats);
    } catch (error: any) {
      this.logError('Failed to get alert stats', error);
      this.error(res, 'GET_ALERT_STATS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * POST /api/v1/alerts/bulk-update - Bulk update alerts
   *
   * Request body:
   * {
   *   "alertIds": ["string"],
   *   "status": "string",
   *   "severity": "string"
   * }
   */
  async bulkUpdateAlerts(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { alertIds, status, severity } = req.body;

      if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
        this.validationError(res, { field: 'alertIds', message: 'Required array' });
        return;
      }

      this.log('Bulk updating alerts', { count: alertIds.length, userId: req.user.id });

      // Update each alert
      const results = await Promise.all(
        alertIds.map(id =>
          this.orchestrator.alertService?.updateAlert?.(id, {
            ...(status && { status }),
            ...(severity && { severity })
          })
        )
      );

      const successful = results.filter(r => r).length;

      // Log audit
      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'alerts_bulk_updated',
        resource: 'alerts',
        status: 'success',
        details: { count: successful, alertIds }
      });

      this.success(res, { updated: successful, total: alertIds.length });
    } catch (error: any) {
      this.logError('Failed to bulk update alerts', error);
      this.error(res, 'BULK_UPDATE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

/**
 * Factory function
 */
export function createAlertController(orchestrator: IServiceOrchestrator): AlertController {
  return new AlertController(orchestrator);
}
