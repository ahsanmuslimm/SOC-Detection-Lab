/**
 * Authentication Store
 *
 * Zustand store for managing authentication state.
 * The persist middleware handles localStorage automatically —
 * there is NO manual hydrate() that could overwrite live state.
 *
 * @module stores/authStore
 */

import { create } from 'zustand';
import type { IUser, UserRole } from '@app-types';
import { devtools, persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  _hydrated: boolean;
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;   // absolute ms timestamp
  error: string | null;

  setUser: (user: IUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  hydrate: () => void;
  getUserRole: () => UserRole | null;
  hasPermission: (permission: string) => boolean;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial state ────────────────────────────────────────────────────
        isAuthenticated: false,
        isLoading: false,
        _hydrated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
        error: null,

        // ── Primitive setters ────────────────────────────────────────────────
        setUser: (user) => set({ user, isAuthenticated: user !== null }),
        setTokens: (accessToken, refreshToken, expiresIn) =>
          set({ accessToken, refreshToken, expiresIn, isAuthenticated: true }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

        // ── Login ────────────────────────────────────────────────────────────
        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';
            const res = await fetch(`${baseUrl}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });

            const json = await res.json() as {
              success: boolean;
              data?: {
                user: { id: string; username: string; email: string; role: string };
                accessToken: string;
                refreshToken: string;
                expiresIn: number;
              };
              error?: { message: string };
            };

            if (!res.ok || !json.success || !json.data) {
              throw new Error(json.error?.message ?? 'Invalid email or password');
            }

            const { user: apiUser, accessToken, refreshToken, expiresIn } = json.data;

            const user: IUser = {
              id: apiUser.id,
              email: apiUser.email,
              firstName: apiUser.username,
              lastName: '',
              role: (apiUser.role?.toLowerCase() as UserRole) ?? 'viewer',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            // Single atomic set — persist middleware writes to localStorage immediately
            set({
              user,
              accessToken,
              refreshToken,
              expiresIn: Date.now() + expiresIn * 1000,
              isAuthenticated: true,
              error: null,
              isLoading: false,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            set({ error: msg, isLoading: false });
            throw err;
          }
        },

        // ── Logout ───────────────────────────────────────────────────────────
        logout: () =>
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            expiresIn: null,
            error: null,
          }),

        // ── Refresh token ────────────────────────────────────────────────────
        refreshAccessToken: async () => {
          const { refreshToken } = get();
          if (!refreshToken) {
            // No refresh token — just clear auth silently, don't throw
            set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null, expiresIn: null });
            return;
          }

          try {
            const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';
            const res = await fetch(`${baseUrl}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            const json = await res.json() as {
              success: boolean;
              data?: { accessToken: string; refreshToken?: string; expiresIn: number };
            };

            if (!res.ok || !json.success || !json.data) {
              // Refresh failed — clear auth silently so user can log in again
              set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null, expiresIn: null });
              return;
            }

            const { accessToken, refreshToken: newRefresh, expiresIn } = json.data;
            set({
              accessToken,
              refreshToken: newRefresh ?? refreshToken,
              expiresIn: Date.now() + expiresIn * 1000,
            });
          } catch {
            set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null, expiresIn: null });
          }
        },

        // ── hydrate: no-op — persist middleware handles it ───────────────────
        hydrate: () => { /* intentional no-op */ },

        // ── Selectors ────────────────────────────────────────────────────────
        getUserRole: () => get().user?.role ?? null,

        hasPermission: (permission) => {
          const user = get().user;
          if (!user) return false;
          if (user.role === 'admin') return true;

          const map: Record<UserRole, string[]> = {
            admin: ['*'],
            analyst: ['alert:read', 'alert:write', 'case:read', 'case:write', 'investigation:read', 'investigation:write'],
            manager: ['alert:read', 'case:read', 'investigation:read', 'report:read', 'user:read'],
            viewer: ['alert:read', 'case:read', 'investigation:read', 'report:read'],
          };
          const perms = map[user.role] ?? [];
          return perms.includes('*') || perms.includes(permission);
        },

        isTokenExpired: () => {
          const { expiresIn } = get();
          if (!expiresIn) return true;
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
        onRehydrateStorage: () => (state) => {
          if (state) state._hydrated = true;
        },
      }
    )
  )
);
