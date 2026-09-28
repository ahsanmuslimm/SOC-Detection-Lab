/**
 * RBAC Controller - 5 endpoints
 */

import { Response } from 'express';
import type { IAuthenticatedRequest } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class RBACController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async listRoles(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roles = await this.orchestrator.rbacService?.getAllRoles?.();
      this.success(res, roles || []);
    } catch (error: any) {
      this.error(res, 'LIST_ROLES_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getRole(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const role = await this.orchestrator.rbacService?.getRole?.(req.params.id);
      if (!role) { this.notFound(res, 'Role'); return; }
      this.success(res, role);
    } catch (error: any) {
      this.error(res, 'GET_ROLE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async updateRolePermissions(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        this.validationError(res, { field: 'permissions', message: 'Must be array' });
        return;
      }

      const role = await this.orchestrator.rbacService?.getRole?.(id);
      if (!role) { this.notFound(res, 'Role'); return; }

      const updated = await this.orchestrator.rbacService?.updateRolePermissions?.(id, permissions);

      if (!updated) {
        this.error(res, 'UPDATE_FAILED', 'Failed to update role permissions');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'role_permissions_updated',
        resource: `role:${id}`,
        status: 'success',
        details: { permissions }
      });

      this.success(res, updated);
    } catch (error: any) {
      this.error(res, 'UPDATE_ROLE_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async listPermissions(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permissions = await this.orchestrator.rbacService?.getAllPermissions?.();
      this.success(res, permissions || []);
    } catch (error: any) {
      this.error(res, 'LIST_PERMISSIONS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getUserPermissions(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const permissions = await this.orchestrator.rbacService?.getUserPermissions?.(userId);

      this.success(res, permissions || []);
    } catch (error: any) {
      this.error(res, 'GET_PERMISSIONS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createRBACController(orchestrator: IServiceOrchestrator): RBACController {
  return new RBACController(orchestrator);
}
