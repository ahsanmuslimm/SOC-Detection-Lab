/**
 * Main Application Component
 * @module App
 *
 * NOTE: Login is temporarily disabled — app goes straight to dashboard.
 * All routes are open. Re-enable ProtectedRoute when login is fixed.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@stores/authStore';

import MainLayout from '@components/layouts/MainLayout';
import AuthLayout from '@components/layouts/AuthLayout';
import LoginPage from '@pages/LoginPage';
import DashboardPage from '@pages/DashboardPage';
import AlertsPage from '@pages/AlertsPage';
import CasesPage from '@pages/CasesPage';
import InvestigationsPage from '@pages/InvestigationsPage';
import ReportsPage from '@pages/ReportsPage';
import UsersPage from '@pages/UsersPage';
import SettingsPage from '@pages/SettingsPage';
import ProfilePage from '@pages/ProfilePage';
import NotFoundPage from '@pages/NotFoundPage';

// ── Hardcoded dev token — valid 1 year, signed with correct secret ─────────────
const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHNvYy5sb2NhbCIsInJvbGUiOiJBRE1JTiIsInJvbGVJZCI6ImFkbWluIiwiaWF0IjoxNzkxNzE4MTkwLCJleHAiOjE4MjMyNTQxOTB9.VXBPbEWkqM6ABWpL5Up_R5LfCnJGveNjackIBEFk1a8';

// Seed auth store with the dev token so all API calls have a valid JWT
if (!useAuthStore.getState().accessToken || useAuthStore.getState().accessToken !== DEV_TOKEN) {
  useAuthStore.setState({
    isAuthenticated: true,
    _hydrated: true,
    accessToken: DEV_TOKEN,
    refreshToken: 'dev-bypass',
    expiresIn: Date.now() + 365 * 24 * 3600 * 1000,
    user: {
      id: 'admin',
      email: 'admin@soc.local',
      firstName: 'Admin',
      lastName: '',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
}

// ── Main App ──────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <>
    <BrowserRouter>
      <Routes>
        {/* Login page still accessible but not required */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* All app routes — no auth check */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/investigations" element={<InvestigationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Always go to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>

    <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }} />
  </>
);

export default App;
