/**
 * Report Controller - 5 endpoints
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ICreateReportRequest, IReportResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class ReportController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async listReports(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, pageSize, limit, offset } = this.getPaginationParams(req);
      const reportType = req.query.reportType as string;

      const result = await this.orchestrator.reportService?.queryReports?.({
        limit,
        offset,
        reportType
      });

      const reports = (result?.reports || []) as IReportResponse[];
      this.paginated(res, reports, page, pageSize, result?.total || 0);
    } catch (error: any) {
      this.error(res, 'LIST_REPORTS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async createReport(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reportData = req.body as ICreateReportRequest;

      if (!reportData.title || !reportData.reportType || !reportData.dateRangeStart || !reportData.dateRangeEnd) {
        this.validationError(res, { fields: ['title', 'reportType', 'dateRangeStart', 'dateRangeEnd'] });
        return;
      }

      const report = await this.orchestrator.reportService?.generateReport?.({
        ...reportData,
        generatedBy: req.user.id
      });

      if (!report) {
        this.error(res, 'REPORT_GENERATION_FAILED', 'Failed to generate report');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'report_generated',
        resource: `report:${report.id}`,
        status: 'success'
      });

      this.created(res, report);
    } catch (error: any) {
      this.error(res, 'CREATE_REPORT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getReport(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const report = await this.orchestrator.reportService?.getReport?.(req.params.id);
      if (!report) { this.notFound(res, 'Report'); return; }
      this.success(res, report);
    } catch (error: any) {
      this.error(res, 'GET_REPORT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async updateReport(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!await this.orchestrator.reportService?.getReport?.(id)) {
        this.notFound(res, 'Report');
        return;
      }

      const updated = await this.orchestrator.reportService?.updateReport?.(id, req.body);

      if (!updated) {
        this.error(res, 'UPDATE_FAILED', 'Failed to update report');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'report_updated',
        resource: `report:${id}`,
        status: 'success'
      });

      this.success(res, updated);
    } catch (error: any) {
      this.error(res, 'UPDATE_REPORT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async deleteReport(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!await this.orchestrator.reportService?.getReport?.(id)) {
        this.notFound(res, 'Report');
        return;
      }

      const deleted = await this.orchestrator.reportService?.deleteReport?.(id);

      if (!deleted) {
        this.error(res, 'DELETE_FAILED', 'Failed to delete report');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'report_deleted',
        resource: `report:${id}`,
        status: 'success'
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.error(res, 'DELETE_REPORT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createReportController(orchestrator: IServiceOrchestrator): ReportController {
  return new ReportController(orchestrator);
}
