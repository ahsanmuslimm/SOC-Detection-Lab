/**
 * API Client Service
 * 
 * Centralized HTTP client with axios for API communication.
 * Handles authentication, error handling, request/response interceptors,
 * and automatic token refresh.
 * 
 * @module services/apiClient
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { IApiResponse, IPaginatedResponse } from '@app-types';
import { useAuthStore } from '@stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const authStore = useAuthStore.getState();
        const token = authStore.accessToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          config.headers['X-Request-ID'] = this.generateRequestId();
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { retry?: boolean };

        // Handle 401 Unauthorized — only attempt refresh if we have a refresh token
        if (error.response?.status === 401 && !originalRequest.retry) {
          originalRequest.retry = true;
          const authStore = useAuthStore.getState();

          // No refresh token — just logout, don't loop
          if (!authStore.refreshToken) {
            authStore.logout();
            return Promise.reject(error);
          }

          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
              await authStore.refreshAccessToken();
              const newToken = authStore.accessToken;
              if (newToken) {
                this.onRefreshed(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.client(originalRequest);
              }
              // Refresh didn't produce a new token — reject silently
              return Promise.reject(error);
            } catch {
              // Refresh failed — reject but DON'T logout
              return Promise.reject(error);
            } finally {
              this.isRefreshing = false;
              this.refreshSubscribers = [];
            }
          }

          return new Promise((resolve) => {
            this.addRefreshSubscriber((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(this.client(originalRequest));
            });
          });
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
          useAuthStore.getState().setError('Access denied. Insufficient permissions.');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Add subscriber for token refresh
   */
  private addRefreshSubscriber(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers of token refresh
   */
  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, unknown>): Promise<IApiResponse<T>> {
    try {
      const response = await this.client.get<IApiResponse<T>>(url, { params });
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * GET request for paginated data
   */
  async getPaginated<T>(
    url: string,
    page: number = 1,
    pageSize: number = 25,
    params?: Record<string, unknown>
  ): Promise<IPaginatedResponse<T>> {
    try {
      const response = await this.client.get<IPaginatedResponse<T>>(url, {
        params: {
          page,
          pageSize,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown): Promise<IApiResponse<T>> {
    try {
      const response = await this.client.post<IApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown): Promise<IApiResponse<T>> {
    try {
      const response = await this.client.put<IApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown): Promise<IApiResponse<T>> {
    try {
      const response = await this.client.patch<IApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<IApiResponse<T>> {
    try {
      const response = await this.client.delete<IApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorMessage = (error.response?.data as any)?.error?.message || error.message;

      const appError = {
        code: `HTTP_${status}`,
        message: errorMessage,
        status,
        details: error.response?.data,
      };

      throw appError;
    }

    throw {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export const apiClient = new ApiClient();
