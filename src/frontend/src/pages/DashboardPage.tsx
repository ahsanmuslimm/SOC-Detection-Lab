/**
 * Dashboard Page
 * 
 * Main dashboard showing overview statistics, recent alerts, and key metrics.
 */

import React from 'react';
import { AlertTriangle, Briefcase, Search, TrendingUp } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const stats = [
    { label: 'Total Alerts', value: '2,543', icon: AlertTriangle, color: 'bg-red-50' },
    { label: 'Open Cases', value: '47', icon: Briefcase, color: 'bg-blue-50' },
    { label: 'Investigations', value: '12', icon: Search, color: 'bg-purple-50' },
    { label: 'Resolution Rate', value: '89%', icon: TrendingUp, color: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your SOC overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.color} rounded-lg p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <Icon className="text-gray-400" size={32} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-900">SSH Brute Force Attempt #{i}</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                  High
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
              Create Alert
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
              Open New Case
            </button>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
              Generate Report
            </button>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 text-sm font-medium">
              View All Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
