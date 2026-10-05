/**
 * User Service
 *
 * API service for user and role management.
 *
 * @module services/userService
 */

import { apiClient } from './apiClient';
import type { IApiResponse, IPermission, IUser, IUserProfile, IPaginatedResponse } from '@app-types';

export const userService = {
  async listUsers(
    page: number = 1,
    pageSize: number = 25,
    filters?: Record<string, unknown>
  ): Promise<IPaginatedResponse<IUser>> {
    return apiClient.getPaginated<IUser>('/users', page, pageSize, filters);
  },

  async getUser(id: string): Promise<IApiResponse<IUser>> {
    return apiClient.get<IUser>(`/users/${id}`);
  },

  async createUser(data: { email: string; firstName: string; lastName?: string; role?: string }): Promise<IApiResponse<IUser>> {
    return apiClient.post<IUser>('/users', data);
  },

  async updateUser(id: string, data: Partial<IUser>): Promise<IApiResponse<IUser>> {
    return apiClient.put<IUser>(`/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<IApiResponse<void>> {
    return apiClient.delete(`/users/${id}`);
  },

  async getCurrentUser(): Promise<IApiResponse<IUserProfile>> {
    return apiClient.get<IUserProfile>('/users/me/profile');
  },

  async getRoles(): Promise<IApiResponse<IRole[]>> {
    return apiClient.get('/rbac/roles');
  },

  async getPermissions(): Promise<IApiResponse<IPermission[]>> {
    return apiClient.get('/rbac/permissions');
  },
};

export interface IRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount?: number;
}
