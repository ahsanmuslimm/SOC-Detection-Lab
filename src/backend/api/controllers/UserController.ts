/**
 * User Controller - 6 endpoints
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, IUserResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class UserController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async listUsers(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, pageSize, limit, offset } = this.getPaginationParams(req);

      const filters: Record<string, any> = {};
      if (req.query.role) {filters.role = req.query.role;}
      if (req.query.status) {filters.status = req.query.status;}
      if (req.query.search) {filters.search = req.query.search;}

      const result = await this.orchestrator.userService?.queryUsers?.({
        limit,
        offset,
        filters
      });

      const users = (result?.users || []) as IUserResponse[];
      this.paginated(res, users, page, pageSize, result?.total || 0);
    } catch (error: any) {
      this.error(res, 'LIST_USERS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async createUser(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName, fullName, role } = req.body;

      if (!email || !firstName) {
        this.validationError(res, { fields: ['email', 'firstName'], message: 'Missing required fields' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        this.validationError(res, { field: 'email', message: 'Invalid email format' });
        return;
      }

      const derivedUsername = username || String(email).split('@')[0];
      const derivedFullName = fullName || [firstName, lastName].filter(Boolean).join(' ');

      const user = await this.orchestrator.userService?.createUser?.({
        username: derivedUsername,
        email,
        password,
        fullName: derivedFullName,
        firstName,
        lastName,
        role
      });

      if (!user) {
        this.error(res, 'USER_CREATION_FAILED', 'Failed to create user');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'user_created',
        resource: `user:${user.id}`,
        status: 'success'
      });

      this.created(res, user);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        this.conflict(res, 'User already exists');
      } else {
        this.error(res, 'CREATE_USER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
      }
    }
  }

  async getUser(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await this.orchestrator.userService?.getUser?.(req.params.id);
      if (!user) { this.notFound(res, 'User'); return; }
      this.success(res, user);
    } catch (error: any) {
      this.error(res, 'GET_USER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async updateUser(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!await this.orchestrator.userService?.getUser?.(id)) {
        this.notFound(res, 'User');
        return;
      }

      const updated = await this.orchestrator.userService?.updateUser?.(id, updateData);

      if (!updated) {
        this.error(res, 'UPDATE_FAILED', 'Failed to update user');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'user_updated',
        resource: `user:${id}`,
        status: 'success'
      });

      this.success(res, updated);
    } catch (error: any) {
      this.error(res, 'UPDATE_USER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async deleteUser(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!await this.orchestrator.userService?.getUser?.(id)) {
        this.notFound(res, 'User');
        return;
      }

      const deleted = await this.orchestrator.userService?.deleteUser?.(id);

      if (!deleted) {
        this.error(res, 'DELETE_FAILED', 'Failed to delete user');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'user_deleted',
        resource: `user:${id}`,
        status: 'success'
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error: any) {
      this.error(res, 'DELETE_USER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async getCurrentUser(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Profile is derived from the verified token claims so it always
      // matches the authenticated principal, with permissions from RBAC.
      const permissions =
        (await this.orchestrator.rbacService?.getUserPermissions?.(req.user.id)) ??
        (await this.orchestrator.rbacService?.getPermissions?.(String(req.user.roleId || req.user.role || ''))) ??
        [];

      this.success(res, {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        roleId: req.user.roleId,
        permissions
      });
    } catch (error: any) {
      this.error(res, 'GET_CURRENT_USER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createUserController(orchestrator: IServiceOrchestrator): UserController {
  return new UserController(orchestrator);
}
