/**
 * Investigation Service
 *
 * API service for investigation operations.
 *
 * @module services/investigationService
 */

import { apiClient } from './apiClient';
import type { IApiResponse,  IInvestigation, ITimelineEvent, IPaginatedResponse } from '@app-types';

export const investigationService = {
  async listInvestigations(
    page: number = 1,
    pageSize: number = 25,
    filters?: Record<string, unknown>
  ): Promise<IPaginatedResponse<IInvestigation>> {
    return apiClient.getPaginated<IInvestigation>('/investigations', page, pageSize, filters);
  },

  async getInvestigation(id: string): Promise<IApiResponse<IInvestigation>> {
    return apiClient.get<IInvestigation>(`/investigations/${id}`);
  },

  async createInvestigation(data: Partial<IInvestigation>): Promise<IApiResponse<IInvestigation>> {
    return apiClient.post<IInvestigation>('/investigations', data);
  },

  async updateInvestigation(id: string, data: Partial<IInvestigation>): Promise<IApiResponse<IInvestigation>> {
    return apiClient.put<IInvestigation>(`/investigations/${id}`, data);
  },

  async getTimeline(id: string): Promise<IApiResponse<ITimelineEvent[]>> {
    return apiClient.get(`/investigations/${id}/timeline`);
  },

  async closeInvestigation(
    id: string,
    closeReason: string,
    conclusion?: string
  ): Promise<IApiResponse<IInvestigation>> {
    return apiClient.post<IInvestigation>(`/investigations/${id}/close`, {
      closeReason,
      conclusion,
    });
  },
};
