/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state, including user data,
 * tokens, permissions, and authentication lifecycle.
 * 
 * @module stores/authStore
 */

import { create } from 'zustand';
import type { IUser, UserRole } from '@app-types';
import { devtools, persist } from 'zustand/middleware';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  error: string | null;

  // Actions
  setUser: (user: IUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  hydrate: () => void;

  // Selectors
  getUserRole: () => UserRole | null;
  hasPermission: (permission: string) => boolean;
  isTokenExpired: () => boolean;
}

// Store implementation with persistence
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isAuthenticated: false,
        isLoading: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
        error: null,

        // Set user
        setUser: (user: IUser | null) => {
          set((state) => ({
            ...state,
            user,
            isAuthenticated: user !== null,
          }));
        },

        // Set tokens
        setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => {
          set((state) => ({
            ...state,
            accessToken,
            refreshToken,
            expiresIn,
            isAuthenticated: true,
          }));
        },

        // Set loading state
        setLoading: (isLoading: boolean) => {
          set((state) => ({
            ...state,
            isLoading,
          }));
        },

        // Set error
        setError: (error: string | null) => {
          set((state) => ({
            ...state,
            error,
          }));
        },

        // Set authenticated
        setAuthenticated: (isAuthenticated: boolean) => {
          set((state) => ({
            ...state,
            isAuthenticated,
          }));
        },

        // Login action — calls POST /api/v1/auth/login
        login: async (email: string, password: string) => {
          const state = get();
          state.setLoading(true);
          state.setError(null);

          try {
            const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';
            const res = await fetch(`${baseUrl}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            const json = await res.json() as {
              success: boolean;
              data?: {
                user: {
                  id: string;
                  username: string;
                  email: string;
                  role: string;
                  status: string;
                };
                accessToken: string;
                refreshToken: string;
                expiresIn: number;
              };
              error?: { message: string };
            };

            if (!res.ok || !json.success || !json.data) {
              throw new Error(json.error?.message || 'Invalid email or password');
            }

            const { user: apiUser, accessToken, refreshToken, expiresIn } = json.data;

            // Map API user shape to IUser
            const user: IUser = {
              id: apiUser.id,
              email: apiUser.email,
              firstName: apiUser.username,   // backend has username, not firstName
              lastName: '',
              role: (apiUser.role?.toLowerCase() as UserRole) || 'viewer',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Store absolute expiry timestamp (ms) so isTokenExpired() works correctly
            const expiresAt = Date.now() + expiresIn * 1000;

            state.setUser(user);
            state.setTokens(accessToken, refreshToken, expiresAt);
          } catch (error) {
            state.setError(error instanceof Error ? error.message : 'Login failed');
            throw error;
          } finally {
            state.setLoading(false);
          }
        },

        // Logout action
        logout: () => {
          set((state) => ({
            ...state,
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresIn: null,
            error: null,
          }));
        },

        // Refresh access token — calls POST /api/v1/auth/refresh
        refreshAccessToken: async () => {
          const state = get();
          if (!state.refreshToken) {
            state.logout();
            return;
          }

          try {
            const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';
            const res = await fetch(`${baseUrl}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: state.refreshToken }),
            });

            const json = await res.json() as {
              success: boolean;
              data?: { accessToken: string; refreshToken?: string; expiresIn: number };
            };

            if (!res.ok || !json.success || !json.data) {
              state.logout();
              return;
            }

            const { accessToken, refreshToken, expiresIn } = json.data;
            const expiresAt = Date.now() + expiresIn * 1000;

            state.setTokens(
              accessToken,
              refreshToken ?? state.refreshToken!,
              expiresAt
            );
          } catch {
            state.logout();
          }
        },

        // Hydrate from storage
        hydrate: () => {
          // This is called by the persist middleware
          const stored = localStorage.getItem('auth-store');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              set((state) => ({
                ...state,
                ...parsed.state,
              }));
            } catch (error) {
              console.error('Failed to hydrate auth store:', error);
            }
          }
        },

        // Get user role
        getUserRole: () => {
          return get().user?.role || null;
        },

        // Check permission
        hasPermission: (permission: string) => {
          const user = get().user;
          if (!user) return false;

          // Admin has all permissions
          if (user.role === 'admin') return true;

          // Define role-based permissions
          const rolePermissions: Record<UserRole, string[]> = {
            admin: ['*'],
            analyst: [
              'alert:read',
              'alert:write',
              'case:read',
              'case:write',
              'investigation:read',
              'investigation:write',
            ],
            manager: [
              'alert:read',
              'case:read',
              'investigation:read',
              'report:read',
              'user:read',
            ],
            viewer: ['alert:read', 'case:read', 'investigation:read', 'report:read'],
          };

          const permissions = rolePermissions[user.role] || [];
          return permissions.includes('*') || permissions.includes(permission);
        },

        // Check if token is expired (expiresIn stores absolute ms timestamp)
        isTokenExpired: () => {
          const { expiresIn } = get();
          if (!expiresIn) return true;
          // Treat as expired if less than 5 minutes remain
          return Date.now() + 5 * 60 * 1000 > expiresIn;
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          expiresIn: state.expiresIn,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
