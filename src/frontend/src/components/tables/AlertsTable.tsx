/**
 * Alerts Table Component
 * 
 * Advanced data table for displaying and managing alerts.
 * Includes sorting, filtering, pagination, and inline actions.
 * 
 * @module components/tables/AlertsTable
 */

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAlerts } from '@hooks/useAlerts';
import type { IAlert, AlertSeverity, AlertStatus } from '@app-types';
import clsx from 'clsx';

interface AlertsTableProps {
  onSelectAlert?: (alert: IAlert) => void;
  initialFilters?: Record<string, unknown>;
}

const severityColors: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-gray-100 text-gray-800',
};

const statusColors: Record<AlertStatus, string> = {
  open: 'bg-red-50 border-red-200',
  acknowledged: 'bg-yellow-50 border-yellow-200',
  resolved: 'bg-green-50 border-green-200',
  false_positive: 'bg-gray-50 border-gray-200',
};

/**
 * Alerts Table Component
 */
const AlertsTable: React.FC<AlertsTableProps> = ({ onSelectAlert, initialFilters = {} }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  const { alerts, pagination, isLoading, acknowledgeAlert, deleteAlert } = useAlerts({
    page,
    pageSize,
    filters: {
      sortBy,
      sortOrder,
      ...initialFilters,
    },
  });

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page
  };

  const handleSelectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    }
  };

  const handleSelectAlert = (id: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAlerts(newSelected);
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert({ id });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      await deleteAlert(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {alerts.length} of {pagination?.total || 0} alerts
        </div>
        <div className="flex gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Title
                  {sortBy === 'title' && (
                    sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('severity')}
              >
                <div className="flex items-center gap-2">
                  Severity
                  {sortBy === 'severity' && (
                    sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Source System
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Created
                  {sortBy === 'createdAt' && (
                    sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr
                key={alert.id}
                className={clsx(
                  'border-b border-gray-200 hover:bg-gray-50 transition-colors',
                  statusColors[alert.status]
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.has(alert.id)}
                    onChange={() => handleSelectAlert(alert.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-gray-900">{alert.title}</div>
                  <div className="text-gray-500 text-xs">{alert.description}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-block px-2 py-1 text-xs font-semibold rounded',
                      severityColors[alert.severity]
                    )}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-block px-2 py-1 text-xs font-medium rounded capitalize',
                      statusColors[alert.status]
                    )}
                  >
                    {alert.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{alert.sourceSystem}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(alert.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Acknowledge"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => onSelectAlert?.(alert)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="View details"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-1 hover:bg-red-200 text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={!pagination.hasMore || page === 1}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasMore}
              className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsTable;
