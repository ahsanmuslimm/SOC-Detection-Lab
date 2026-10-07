/**
 * Main Application Component
 * @module App
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

// ── Loading screen ────────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-gray-400 text-sm">Loading SOC Detection Lab…</p>
  </div>
);

// ── Protected route ───────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredPermission && !hasPermission(requiredPermission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ── Main App ──────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { isAuthenticated, _hydrated } = useAuthStore();

  // Wait for Zustand persist to rehydrate from localStorage before rendering
  // routes — prevents flash-redirect to /login on page refresh
  if (!_hydrated) return <LoadingScreen />;

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

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

          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#363636', color: '#fff' } }} />
    </>
  );
};

export default App;
