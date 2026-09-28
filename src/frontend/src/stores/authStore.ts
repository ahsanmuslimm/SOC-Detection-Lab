/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state, including user data,
 * tokens, permissions, and authentication lifecycle.
 * 
 * @module stores/authStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { IUser, IAuthResponse, UserRole } from '@types/index';

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

        // Login action (will be connected to API)
        login: async (email: string, password: string) => {
          const state = get();
          state.setLoading(true);
          state.setError(null);

          try {
            // This will be connected to the actual API
            // For now, mock the response
            const mockUser: IUser = {
              id: 'user-123',
              email,
              firstName: 'John',
              lastName: 'Analyst',
              role: 'analyst',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const mockTokens = {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token',
              expiresIn: 3600,
            };

            state.setUser(mockUser);
            state.setTokens(
              mockTokens.accessToken,
              mockTokens.refreshToken,
              mockTokens.expiresIn
            );
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

        // Refresh access token
        refreshAccessToken: async () => {
          const state = get();
          if (!state.refreshToken) {
            state.logout();
            return;
          }

          try {
            // This will be connected to the actual API
            const newAccessToken = 'new-mock-access-token';
            const newExpiresIn = 3600;

            state.setTokens(
              newAccessToken,
              state.refreshToken,
              newExpiresIn
            );
          } catch (error) {
            state.logout();
            throw error;
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

        // Check if token is expired
        isTokenExpired: () => {
          const state = get();
          if (!state.expiresIn) return true;

          // Check if token expires in next 5 minutes
          const expirationTime = state.expiresIn * 1000;
          return Date.now() + 5 * 60 * 1000 > expirationTime;
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
