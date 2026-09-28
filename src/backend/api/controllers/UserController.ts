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
      const roleFilter = req.query.role as string;

      const result = await this.orchestrator.userService?.queryUsers?.({
        limit,
        offset,
        roleFilter
      });

      const users = (result?.users || []) as IUserResponse[];
      this.paginated(res, users, page, pageSize, result?.total || 0);
    } catch (error: any) {
      this.error(res, 'LIST_USERS_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async createUser(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password) {
        this.validationError(res, { fields: ['username', 'email', 'password'] });
        return;
      }

      const user = await this.orchestrator.userService?.createUser?.({
        username,
        email,
        password,
        fullName
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
      const user = await this.orchestrator.userService?.getUser?.(req.user.id);
      if (!user) {
        this.error(res, 'USER_NOT_FOUND', 'Current user not found');
        return;
      }
      this.success(res, user);
    } catch (error: any) {
      this.error(res, 'GET_CURRENT_USER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }
}

export function createUserController(orchestrator: IServiceOrchestrator): UserController {
  return new UserController(orchestrator);
}
