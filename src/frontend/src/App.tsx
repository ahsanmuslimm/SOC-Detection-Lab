/**
 * Main Application Component
 * @module App
 */

import React, { useEffect, useState } from 'react';
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

// ── Spinner shown while auto-login is in progress ────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-gray-400 text-sm">Connecting to SOC Detection Lab…</p>
  </div>
);

// ── All routes are accessible — auth bypass active ───────────────────────────
interface ProtectedRouteProps { children: React.ReactNode; requiredPermission?: string; }
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => <>{children}</>;

// ── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { isAuthenticated, accessToken, login } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If already authenticated (token in localStorage), go straight to dashboard
    if (isAuthenticated && accessToken) {
      setReady(true);
      return;
    }
    // Otherwise auto-login so we get a real JWT before any data queries fire
    login('admin@soc.local', 'SecurePassword123!')
      .then(() => setReady(true))
      .catch(() => setReady(true)); // still show the app even if login fails
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Block rendering until we have a token — prevents React Query from
  // firing with no auth header and getting 401s
  if (!ready) return <LoadingScreen />;

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Auth pages */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Main app */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/investigations" element={<InvestigationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<ProtectedRoute requiredPermission="user:read"><UsersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
    </>
  );
};

export default App;
