/**
 * Main Application Layout
 * 
 * Primary layout component with sidebar navigation, top bar, and main content area.
 * Used for all authenticated pages.
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  AlertTriangle,
  Briefcase,
  Search,
  FileText,
  Users,
  Settings,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import clsx from 'clsx';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  requiredRole?: string[];
}

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { user, logout, getUserRole } = useAuthStore();
  const userRole = getUserRole();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { label: 'Alerts', icon: <AlertTriangle size={20} />, path: '/alerts' },
    { label: 'Cases', icon: <Briefcase size={20} />, path: '/cases' },
    { label: 'Investigations', icon: <Search size={20} />, path: '/investigations' },
    { label: 'Reports', icon: <FileText size={20} />, path: '/reports' },
    { label: 'Users', icon: <Users size={20} />, path: '/users', requiredRole: ['admin'] },
    { label: 'Settings', icon: <Settings size={20} />, path: '/settings', requiredRole: ['admin'] },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 bg-gray-900 text-white transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className={clsx('font-bold text-lg', !sidebarOpen && 'hidden')}>SOC Lab</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            // Check role-based access
            if (item.requiredRole && !item.requiredRole.includes(userRole || '')) {
              return null;
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center px-4 py-3 rounded-lg transition-colors',
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                )}
                title={!sidebarOpen ? item.label : ''}
              >
                {item.icon}
                {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.firstName}</p>
                <p className="text-xs text-gray-400 capitalize">{userRole}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={clsx('flex-1 flex flex-col', sidebarOpen ? 'ml-64' : 'ml-20')}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">SOC Detection Lab</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
            </div>

            {/* User Menu */}
            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg">
              <User size={20} />
              <span className="text-sm">{user?.email}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
