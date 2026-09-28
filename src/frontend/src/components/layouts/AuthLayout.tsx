/**
 * Authentication Layout
 * 
 * Layout component for authentication pages (login, register, etc).
 * Provides centered card layout with minimal navigation.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">SOC Detection Lab</h1>
          <p className="text-gray-400">Enterprise Security Monitoring Platform</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>© 2024 SOC Detection Lab. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
