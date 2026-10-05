/**
 * Case Controller
 *
 * REST API endpoints for case management.
 * Implements CRUD operations and case workflows.
 *
 * @module api/controllers/CaseController
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ICreateCaseRequest, IUpdateCaseRequest, ICaseResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

/**
 * Case Controller - 8 endpoints
 */
export class CaseController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) {
    super();
  }

  /**
   * GET /api/v1/cases - List all cases
   */
  async listCases(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      this.log('Listing cases', { userId: req.user.id });

      const { page, pageSize, limit, offset } = this.getPaginationParams(req);
      const filters = this.getFilterParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req);

      const result = await this.orchestrator.caseService?.queryCases?.({
        limit,
        offset,
        filters,
        sortBy,
        sortOrder
      });

      const cases = (result?.cases || []) as ICaseResponse[];
      const total = result?.total || 0;

      this.paginated(res, cases, page, pageSize, total);
    } catch (error: any) {
      this.logError('Failed to list cases', error);
      this.error(res, 'LIST_CASES_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * POST /api/v1/cases - Create new case
   */
  async createCase(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caseData = req.body as ICreateCaseRequest;

      this.log('Creating case', { title: caseData.title, userId: req.user.id });

      if (!caseData.title || String(caseData.title).trim() === '') {
        this.validationError(res, { fields: ['title'], message: 'Title is required and cannot be empty' });
        return;
      }

      if (!caseData.severity || !caseData.caseType) {
        this.validationError(res, { fields: ['title', 'severity', 'caseType'], message: 'Missing required fields' });
        return;
      }

      const newCase = await this.orchestrator.caseService?.createCase?.({
        ...caseData,
        createdBy: req.user.id
      });

      if (!newCase) {
        this.error(res, 'CASE_CREATION_FAILED', 'Failed to create case');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'case_created',
        resource: `case:${newCase.id}`,
        status: 'success'
      });

      this.created(res, newCase);
    } catch (error: any) {
      this.logError('Failed to create case', error);
      this.error(res, 'CREATE_CASE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * GET /api/v1/cases/:id - Get case details
   */
  async getCase(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      this.log('Getting case', { id, userId: req.user.id });

      const caseData = await this.orchestrator.caseService?.getCase?.(id);

      if (!caseData) {
        this.notFound(res, 'Case');
        return;
      }

      this.success(res, caseData);
    } catch (error: any) {
      this.logError('Failed to get case', error);
      this.error(res, 'GET_CASE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * PUT /api/v1/cases/:id - Update case
   */
  async updateCase(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as IUpdateCaseRequest;

      this.log('Updating case', { id, userId: req.user.id });

      const existingCase = await this.orchestrator.caseService?.getCase?.(id);

      if (!existingCase) {
        this.notFound(res, 'Case');
        return;
      }

      const updatedCase = await this.orchestrator.caseService?.updateCase?.(id, updateData);

      if (!updatedCase) {
        this.error(res, 'CASE_UPDATE_FAILED', 'Failed to update case');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'case_updated',
        resource: `case:${id}`,
        status: 'success',
        details: updateData
      });

      this.success(res, updatedCase);
    } catch (error: any) {
      this.logError('Failed to update case', error);
      this.error(res, 'UPDATE_CASE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * DELETE /api/v1/cases/:id - Delete case
   */
  async deleteCase(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      this.log('Deleting case', { id, userId: req.user.id });

      const caseData = await this.orchestrator.caseService?.getCase?.(id);

      if (!caseData) {
        this.notFound(res, 'Case');
        return;
      }

      const deleted = await this.orchestrator.caseService?.deleteCase?.(id);

      if (!deleted) {
        this.error(res, 'CASE_DELETION_FAILED', 'Failed to delete case');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'case_deleted',
        resource: `case:${id}`,
        status: 'success'
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.logError('Failed to delete case', error);
      this.error(res, 'DELETE_CASE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * POST /api/v1/cases/:id/assign - Assign case to analyst
   */
  async assignCase(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { assignToUserId } = req.body;

      if (!assignToUserId) {
        this.validationError(res, { field: 'assignToUserId', message: 'Required' });
        return;
      }

      const existingCase = await this.orchestrator.caseService?.getCase?.(id);

      if (!existingCase) {
        this.notFound(res, 'Case');
        return;
      }

      this.log('Assigning case', { id, assignTo: assignToUserId, userId: req.user.id });

      const updatedCase = await this.orchestrator.caseService?.updateCase?.(id, {
        assignedToId: assignToUserId
      });

      if (!updatedCase) {
        this.error(res, 'ASSIGN_FAILED', 'Failed to assign case');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'case_assigned',
        resource: `case:${id}`,
        status: 'success',
        details: { assignedTo: assignToUserId }
      });

      this.success(res, updatedCase);
    } catch (error: any) {
      this.logError('Failed to assign case', error);
      this.error(res, 'ASSIGN_CASE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * GET /api/v1/cases/:id/investigations - Get case investigations
   */
  async getCaseInvestigations(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      this.log('Getting investigations', { caseId: id, userId: req.user.id });

      const caseData = await this.orchestrator.caseService?.getCase?.(id);

      if (!caseData) {
        this.notFound(res, 'Case');
        return;
      }

      const investigations = await this.orchestrator.investigationService?.getCaseInvestigations?.(id);

      this.success(res, investigations || []);
    } catch (error: any) {
      this.logError('Failed to get investigations', error);
      this.error(res, 'GET_INVESTIGATIONS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  /**
   * GET /api/v1/cases/stats/summary - Get case statistics
   */
  async getCaseStats(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      this.log('Getting case stats', { userId: req.user.id });

      const stats = await this.orchestrator.caseService?.getCaseStats?.();

      if (!stats) {
        this.error(res, 'STATS_FAILED', 'Failed to get case statistics');
        return;
      }

      this.success(res, stats);
    } catch (error: any) {
      this.logError('Failed to get case stats', error);
      this.error(res, 'GET_CASE_STATS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createCaseController(orchestrator: IServiceOrchestrator): CaseController {
  return new CaseController(orchestrator);
}
