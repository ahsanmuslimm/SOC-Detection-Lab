/**
 * Dashboard Page
 *
 * Main dashboard showing overview statistics, recent alerts, and key metrics.
 * All statistics are fetched live from the API.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Briefcase, Search, TrendingUp } from 'lucide-react';
import { useAlerts, useAlertStats } from '@hooks/useAlerts';
import { useCaseStats, useInvestigations } from '@hooks/useDomainData';
import { getSeverityColor, formatRelativeTime } from '@utils/formatters';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: alertStats } = useAlertStats();
  const { data: caseStats } = useCaseStats();
  const { alerts } = useAlerts({ page: 1, pageSize: 5 });
  const { investigations } = useInvestigations({ page: 1, pageSize: 1 });

  const openCases = caseStats ? (caseStats as any).open ?? 0 : 0;
  const totalAlerts = alertStats?.total ?? 0;
  const resolvedAlerts = alertStats?.resolved ?? 0;
  const resolutionRate = totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0;
  const investigationCount = investigations.length > 0
    ? String((investigations as any).length)
    : '—';

  const stats = [
    { label: 'Total Alerts', value: totalAlerts.toLocaleString(), icon: AlertTriangle, color: 'bg-red-50' },
    { label: 'Open Cases', value: String(openCases), icon: Briefcase, color: 'bg-blue-50' },
    { label: 'Investigations', value: investigationCount, icon: Search, color: 'bg-purple-50' },
    { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: TrendingUp, color: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your SOC overview.</p>
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
          {alerts.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No recent alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate('/alerts')}
                >
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(alert.createdAt)}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/alerts')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              View Alerts
            </button>
            <button
              onClick={() => navigate('/cases')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Open Cases
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Generate Report
            </button>
            <button
              onClick={() => navigate('/investigations')}
              className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 text-sm font-medium"
            >
              Start Investigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
