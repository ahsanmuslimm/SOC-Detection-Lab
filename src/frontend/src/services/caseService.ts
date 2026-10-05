/**
 * Case Service
 *
 * API service for case management operations.
 *
 * @module services/caseService
 */

import { apiClient } from './apiClient';
import type { IApiResponse,  ICase, ICreateCaseRequest, IPaginatedResponse, ICaseStats } from '@app-types';

export const caseService = {
  async listCases(
    page: number = 1,
    pageSize: number = 25,
    filters?: Record<string, unknown>
  ): Promise<IPaginatedResponse<ICase>> {
    return apiClient.getPaginated<ICase>('/cases', page, pageSize, filters);
  },

  async getCase(id: string): Promise<IApiResponse<ICase>> {
    return apiClient.get<ICase>(`/cases/${id}`);
  },

  async createCase(data: ICreateCaseRequest): Promise<IApiResponse<ICase>> {
    return apiClient.post<ICase>('/cases', data);
  },

  async updateCase(id: string, data: Partial<ICase>): Promise<IApiResponse<ICase>> {
    return apiClient.put<ICase>(`/cases/${id}`, data);
  },

  async deleteCase(id: string): Promise<IApiResponse<void>> {
    return apiClient.delete(`/cases/${id}`);
  },

  async assignCase(id: string, userId: string): Promise<IApiResponse<ICase>> {
    return apiClient.post<ICase>(`/cases/${id}/assign`, { assignToUserId: userId });
  },

  async getCaseInvestigations(id: string): Promise<IApiResponse<IInvestigationList>> {
    return apiClient.get(`/cases/${id}/investigations`);
  },

  async getCaseStats(): Promise<IApiResponse<ICaseStats>> {
    return apiClient.get<ICaseStats>('/cases/stats/summary');
  },
};

type IInvestigationList = { investigations: unknown[]; total: number };
