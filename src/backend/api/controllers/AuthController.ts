/**
 * Authentication Controller - 4 endpoints
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ILoginRequest, IRegisterRequest, ILoginResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class AuthController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async login(req: any, res: Response): Promise<void> {
    try {
      const { username, password, rememberMe } = req.body as ILoginRequest;

      if (!username || !password) {
        this.validationError(res, { fields: ['username', 'password'] });
        return;
      }

      const result = await this.orchestrator.authService?.login?.({
        username,
        password,
        rememberMe,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      if (!result) {
        this.error(res, 'INVALID_CREDENTIALS', 'Invalid username or password', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: result.user.id,
        action: 'user_logged_in',
        resource: 'auth',
        status: 'success'
      });

      this.success(res, result as ILoginResponse);
    } catch (error: any) {
      this.error(res, 'LOGIN_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async logout(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: sessionId } = req.body;

      await this.orchestrator.authService?.logout?.(req.user.id, sessionId);

      await this.orchestrator.auditService?.log?.({
        actor: req.user.id,
        action: 'user_logged_out',
        resource: 'auth',
        status: 'success'
      });

      this.success(res, { message: 'Logged out successfully' });
    } catch (error: any) {
      this.error(res, 'LOGOUT_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async refreshToken(req: any, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        this.validationError(res, { field: 'refreshToken', message: 'Required' });
        return;
      }

      const result = await this.orchestrator.authService?.refreshToken?.(refreshToken);

      if (!result) {
        this.error(res, 'TOKEN_INVALID', 'Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      this.success(res, result);
    } catch (error: any) {
      this.error(res, 'REFRESH_TOKEN_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async register(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName } = req.body as IRegisterRequest;

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
        this.error(res, 'REGISTRATION_FAILED', 'Failed to register user');
        return;
      }

      await this.orchestrator.auditService?.log?.({
        actor: req.user?.id || 'system',
        action: 'user_registered',
        resource: `user:${user.id}`,
        status: 'success'
      });

      this.created(res, user);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        this.conflict(res, 'User already exists');
      } else {
        this.error(res, 'REGISTER_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
      }
    }
  }
}

export function createAuthController(orchestrator: IServiceOrchestrator): AuthController {
  return new AuthController(orchestrator);
}
