/**
 * Main Application Component
 * 
 * Root component for the SOC Detection Lab frontend.
 * Handles routing, authentication state, and global layout.
 * 
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

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  const { isAuthenticated, _hydrated } = useAuthStore();

  // Show nothing until the persist middleware has rehydrated from localStorage.
  // Without this, ProtectedRoute sees isAuthenticated=false on first render
  // and redirects to /login before the stored session is loaded.
  if (!_hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Authentication Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/investigations" element={<InvestigationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission="user:read">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Root redirect */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
};

export default App;
