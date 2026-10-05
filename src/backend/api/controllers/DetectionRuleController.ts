/**
 * Detection Rule Controller - 7 endpoints
 * REST API endpoints for detection rule management.
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ICreateDetectionRuleRequest, IUpdateDetectionRuleRequest, IDetectionRuleResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class DetectionRuleController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async listRules(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, pageSize, limit, offset } = this.getPaginationParams(req);
      const filters = this.getFilterParams(req);
      const { sortBy, sortOrder } = this.getSortParams(req);

      const result = await this.orchestrator.detectionService?.queryRules?.({ limit, offset, filters, sortBy, sortOrder });
      const rules = (result?.rules || []) as IDetectionRuleResponse[];
      const total = result?.total || 0;

      this.paginated(res, rules, page, pageSize, total);
    } catch (error: any) {
      this.error(res, 'LIST_RULES_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async createRule(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ruleData = req.body as ICreateDetectionRuleRequest;

      const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

      if (!ruleData.name || !ruleData.severity || !ruleData.ruleType || !ruleData.ruleDefinition) {
        this.validationError(res, { fields: ['name', 'severity', 'ruleType', 'ruleDefinition'] });
        return;
      }

      if (!VALID_SEVERITIES.includes(ruleData.severity)) {
        this.validationError(res, { field: 'severity', message: `Must be one of: ${VALID_SEVERITIES.join(', ')}` });
        return;
      }

      const rule = await this.orchestrator.detectionService?.createRule?.({ ...ruleData, createdBy: req.user.id });

      if (!rule) {
        this.error(res, 'RULE_CREATION_FAILED', 'Failed to create rule');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'rule_created',
        resource: `rule:${rule.id}`,
        status: 'success'
      });

      this.created(res, rule);
    } catch (error: any) {
      this.error(res, 'CREATE_RULE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getRule(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rule = await this.orchestrator.detectionService?.getRule?.(req.params.id);
      if (!rule) { this.notFound(res, 'Rule'); return; }
      this.success(res, rule);
    } catch (error: any) {
      this.error(res, 'GET_RULE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async updateRule(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as IUpdateDetectionRuleRequest;

      if (!await this.orchestrator.detectionService?.getRule?.(id)) {
        this.notFound(res, 'Rule');
        return;
      }

      const updated = await this.orchestrator.detectionService?.updateRule?.(id, updateData);

      if (!updated) {
        this.error(res, 'RULE_UPDATE_FAILED', 'Failed to update rule');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'rule_updated',
        resource: `rule:${id}`,
        status: 'success'
      });

      this.success(res, updated);
    } catch (error: any) {
      this.error(res, 'UPDATE_RULE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async deleteRule(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!await this.orchestrator.detectionService?.getRule?.(id)) {
        this.notFound(res, 'Rule');
        return;
      }

      const deleted = await this.orchestrator.detectionService?.deleteRule?.(id);

      if (!deleted) {
        this.error(res, 'RULE_DELETION_FAILED', 'Failed to delete rule');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'rule_deleted',
        resource: `rule:${id}`,
        status: 'success'
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.error(res, 'DELETE_RULE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async testRule(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { testData } = req.body;

      if (!testData) {
        this.validationError(res, { field: 'testData', message: 'Required' });
        return;
      }

      const result = await this.orchestrator.detectionService?.testRule?.(id, testData);

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'rule_tested',
        resource: `rule:${id}`,
        status: 'success'
      });

      this.success(res, result || { matched: false });
    } catch (error: any) {
      this.error(res, 'TEST_RULE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async deployRule(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rule = await this.orchestrator.detectionService?.getRule?.(id);
      if (!rule) { this.notFound(res, 'Rule'); return; }

      const deployed = await this.orchestrator.detectionService?.deployRule?.(id);

      if (!deployed) {
        this.error(res, 'DEPLOY_FAILED', 'Failed to deploy rule');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'rule_deployed',
        resource: `rule:${id}`,
        status: 'success'
      });

      this.success(res, deployed);
    } catch (error: any) {
      this.error(res, 'DEPLOY_RULE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createDetectionRuleController(orchestrator: IServiceOrchestrator): DetectionRuleController {
  return new DetectionRuleController(orchestrator);
}
