/**
 * Alert Service
 * 
 * API service for alert management operations.
 * Handles all alert-related HTTP requests.
 * 
 * @module services/alertService
 */

import { apiClient } from './apiClient';
import type { IAlert, ICreateAlertRequest, IPaginatedResponse, IAlertStats } from '@types/index';

export const alertService = {
  /**
   * List all alerts with pagination
   */
  async listAlerts(
    page: number = 1,
    pageSize: number = 25,
    filters?: {
      status?: string;
      severity?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Promise<IPaginatedResponse<IAlert>> {
    return apiClient.getPaginated<IAlert>('/alerts', page, pageSize, filters);
  },

  /**
   * Get alert by ID
   */
  async getAlert(id: string): Promise<{ success: boolean; data: IAlert }> {
    return apiClient.get<IAlert>(`/alerts/${id}`);
  },

  /**
   * Create new alert
   */
  async createAlert(data: ICreateAlertRequest): Promise<{ success: boolean; data: IAlert }> {
    return apiClient.post<IAlert>('/alerts', data);
  },

  /**
   * Update alert
   */
  async updateAlert(
    id: string,
    data: Partial<IAlert>
  ): Promise<{ success: boolean; data: IAlert }> {
    return apiClient.put<IAlert>(`/alerts/${id}`, data);
  },

  /**
   * Delete alert
   */
  async deleteAlert(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/alerts/${id}`);
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(
    id: string,
    comment?: string
  ): Promise<{ success: boolean; data: IAlert }> {
    return apiClient.post<IAlert>(`/alerts/${id}/acknowledge`, { comment });
  },

  /**
   * Assign alert to user
   */
  async assignAlert(
    id: string,
    userId: string
  ): Promise<{ success: boolean; data: IAlert }> {
    return apiClient.post<IAlert>(`/alerts/${id}/assign`, { assignToUserId: userId });
  },

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{ success: boolean; data: IAlertStats }> {
    return apiClient.get<IAlertStats>('/alerts/stats/summary');
  },

  /**
   * Bulk update alerts
   */
  async bulkUpdateAlerts(
    alertIds: string[],
    updates: {
      status?: string;
      severity?: string;
      assignedTo?: string;
    }
  ): Promise<{ success: boolean; data: { updated: number; total: number } }> {
    return apiClient.post('/alerts/bulk/update', {
      alertIds,
      ...updates,
    });
  },
};
