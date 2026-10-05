/**
 * Alerts Page
 * 
 * View and manage security alerts with filtering and action capabilities.
 * Includes real-time updates, advanced filtering, and bulk operations.
 */

import React, { useState } from 'react';
import { AlertTriangle, Plus, Download } from 'lucide-react';
import AlertsTable from '@components/tables/AlertsTable';
import AlertFilters, { AlertFilterState } from '@components/filters/AlertFilters';
import type { IAlert } from '@app-types';

const AlertsPage: React.FC = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<AlertFilterState>({});
  const [selectedAlert, setSelectedAlert] = useState<IAlert | null>(null);

  const handleFiltersChange = (newFilters: AlertFilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and respond to security events</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium">
            <Download size={18} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus size={18} />
            New Alert
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <AlertFilters
          onFiltersChange={handleFiltersChange}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <AlertsTable
          initialFilters={filters as Record<string, unknown>}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
        />
      </div>

      {/* Alert Detail Modal (if needed) */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-600" size={24} />
              {selectedAlert.title}
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Description</h3>
                <p className="text-gray-900">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Severity</h3>
                  <p className="text-gray-900 capitalize">{selectedAlert.severity}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Status</h3>
                  <p className="text-gray-900 capitalize">{selectedAlert.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Source System</h3>
                  <p className="text-gray-900">{selectedAlert.sourceSystem}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Created</h3>
                  <p className="text-gray-900">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                View Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
