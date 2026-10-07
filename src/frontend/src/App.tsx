/**
 * Main Application Component
 * @module App
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@stores/authStore';

// Layouts
import MainLayout from '@components/layouts/MainLayout';
import AuthLayout from '@components/layouts/AuthLayout';

// Pages
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

// ── Hardcoded dev token (1 year, signed with correct secret) ─────────────────
const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHNvYy5sb2NhbCIsInJvbGUiOiJBRE1JTiIsInJvbGVJZCI6ImFkbWluIiwiaWF0IjoxNzkxMzgwNDA4LCJleHAiOjE4MjI5MTY0MDh9.XtoDHk8ITn-C9sFvIeIhx4nwqmtsRIpdFIbUHVnVSR0';

// ── Seed the store once with the dev token ────────────────────────────────────
const store = useAuthStore.getState();
if (!store.accessToken) {
  useAuthStore.setState({
    isAuthenticated: true,
    _hydrated: true,
    accessToken: DEV_TOKEN,
    refreshToken: 'dev-refresh',
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

// ── All routes open (no auth check) ──────────────────────────────────────────
const App: React.FC = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

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

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }}
      />
    </>
  );
};

export default App;
