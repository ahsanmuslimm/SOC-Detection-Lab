/**
 * Authentication Controller - 4 endpoints
 */

import { Response } from 'express';
import type { IAuthenticatedRequest, ILoginRequest, IRegisterRequest, ILoginResponse } from '../types';
import { HTTP_STATUS } from '../types';
import { BaseController } from './BaseController';
import { revokeToken } from '../middleware';
import type { IServiceOrchestrator } from '../../services/orchestrator/types';

export class AuthController extends BaseController {
  constructor(private orchestrator: IServiceOrchestrator) { super(); }

  async login(req: any, res: Response): Promise<void> {
    try {
      const { email, username, password, rememberMe } = req.body as ILoginRequest & { email?: string };

      if ((!email && !username) || !password) {
        this.validationError(res, { fields: ['email', 'password'], message: 'Missing required fields' });
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        this.validationError(res, { field: 'email', message: 'Invalid email format' });
        return;
      }

      const result = await this.orchestrator.authService?.login?.({
        email,
        username,
        password,
        rememberMe,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      if (!result) {
        this.error(res, 'AUTHENTICATION_FAILED', 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
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

      // Revoke the presented access token so it cannot be reused.
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        revokeToken(authHeader.substring(7));
      }

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
        this.error(res, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      this.success(res, result);
    } catch (error: any) {
      this.error(res, 'REFRESH_TOKEN_FAILED', error.message, HTTP_STATUS.INTERNAL_ERROR);
    }
  }

  async register(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, firstName, lastName, fullName, role } = req.body as IRegisterRequest & {
        firstName?: string;
        lastName?: string;
      };

      if (!email || !password) {
        this.validationError(res, { fields: ['email', 'password'], message: 'Missing required fields' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        this.validationError(res, { field: 'email', message: 'Invalid email format' });
        return;
      }

      if (String(password).length < 8 || !/[A-Za-z]/.test(String(password)) || !/[0-9]/.test(String(password))) {
        this.validationError(res, {
          field: 'password',
          message: 'Password must be at least 8 characters and contain letters and numbers'
        });
        return;
      }

      const derivedUsername = username || String(email).split('@')[0];

      const user = await this.orchestrator.userService?.createUser?.({
        username: derivedUsername,
        email,
        password,
        fullName: fullName || [firstName, lastName].filter(Boolean).join(' '),
        firstName,
        lastName,
        role
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
