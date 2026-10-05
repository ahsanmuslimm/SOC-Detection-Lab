/**
 * Investigation Controller - 6 endpoints
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ICreateInvestigationRequest, IInvestigationResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class InvestigationController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async listInvestigations(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, pageSize, limit, offset } = this.getPaginationParams(req);
      const filters = this.getFilterParams(req);

      const result = await this.orchestrator.investigationService?.queryInvestigations?.({ limit, offset, filters });
      const investigations = (result?.investigations || []) as IInvestigationResponse[];

      this.paginated(res, investigations, page, pageSize, result?.total || 0);
    } catch (error: any) {
      this.error(res, 'LIST_INVESTIGATIONS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async createInvestigation(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const investData = req.body as ICreateInvestigationRequest;

      if (!investData.caseId || !investData.title) {
        this.validationError(res, { fields: ['caseId', 'title'] });
        return;
      }

      const investigation = await this.orchestrator.investigationService?.createInvestigation?.({
        ...investData,
        investigatorId: req.user.id
      });

      if (!investigation) {
        this.error(res, 'INVESTIGATION_CREATION_FAILED', 'Failed to create investigation');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'investigation_created',
        resource: `investigation:${investigation.id}`,
        status: 'success'
      });

      this.created(res, investigation);
    } catch (error: any) {
      this.error(res, 'CREATE_INVESTIGATION_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getInvestigation(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const investigation = await this.orchestrator.investigationService?.getInvestigation?.(req.params.id);
      if (!investigation) { this.notFound(res, 'Investigation'); return; }
      this.success(res, investigation);
    } catch (error: any) {
      this.error(res, 'GET_INVESTIGATION_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async updateInvestigation(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!await this.orchestrator.investigationService?.getInvestigation?.(id)) {
        this.notFound(res, 'Investigation');
        return;
      }

      const updated = await this.orchestrator.investigationService?.updateInvestigation?.(id, req.body);

      if (!updated) {
        this.error(res, 'UPDATE_FAILED', 'Failed to update investigation');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'investigation_updated',
        resource: `investigation:${id}`,
        status: 'success'
      });

      this.success(res, updated);
    } catch (error: any) {
      this.error(res, 'UPDATE_INVESTIGATION_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getInvestigationTimeline(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!await this.orchestrator.investigationService?.getInvestigation?.(id)) {
        this.notFound(res, 'Investigation');
        return;
      }

      const timeline = await this.orchestrator.investigationService?.getTimeline?.(id);
      this.success(res, timeline || []);
    } catch (error: any) {
      this.error(res, 'GET_TIMELINE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async closeInvestigation(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { closeReason, conclusion } = req.body;

      const investigation = await this.orchestrator.investigationService?.getInvestigation?.(id);
      if (!investigation) { this.notFound(res, 'Investigation'); return; }

      if (!closeReason || String(closeReason).trim() === '') {
        this.validationError(res, { field: 'closeReason', message: 'Required' });
        return;
      }

      const closed = await this.orchestrator.investigationService?.closeInvestigation?.(id, {
        notes: closeReason,
        closureCode: conclusion ? 'TRUE_POSITIVE' : undefined,
        closureNotes: conclusion
      });

      if (!closed) {
        this.error(res, 'CLOSE_FAILED', 'Failed to close investigation');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'investigation_closed',
        resource: `investigation:${id}`,
        status: 'success'
      });

      this.success(res, closed);
    } catch (error: any) {
      this.error(res, 'CLOSE_INVESTIGATION_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createInvestigationController(orchestrator: IServiceOrchestrator): InvestigationController {
  return new InvestigationController(orchestrator);
}
