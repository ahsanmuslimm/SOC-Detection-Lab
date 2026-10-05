/**
 * Report Service
 *
 * API service for report generation and management.
 *
 * @module services/reportService
 */

import { apiClient } from './apiClient';
import type { IApiResponse,  IReport, IPaginatedResponse } from '@app-types';

export const reportService = {
  async listReports(
    page: number = 1,
    pageSize: number = 25,
    filters?: Record<string, unknown>
  ): Promise<IPaginatedResponse<IReport>> {
    return apiClient.getPaginated<IReport>('/reports', page, pageSize, filters);
  },

  async getReport(id: string): Promise<IApiResponse<IReport>> {
    return apiClient.get<IReport>(`/reports/${id}`);
  },

  async generateReport(data: { title: string; reportType: string; description?: string }): Promise<IApiResponse<IReport>> {
    return apiClient.post<IReport>('/reports', data);
  },

  async updateReport(id: string, data: Partial<IReport>): Promise<IApiResponse<IReport>> {
    return apiClient.put<IReport>(`/reports/${id}`, data);
  },

  async deleteReport(id: string): Promise<IApiResponse<void>> {
    return apiClient.delete(`/reports/${id}`);
  },
};
