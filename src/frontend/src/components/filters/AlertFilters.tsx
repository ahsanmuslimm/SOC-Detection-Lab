/**
 * Alert Filters Component
 * 
 * Advanced filtering interface for alerts with multiple criteria.
 * Manages filter state and applies filters to queries.
 * 
 * @module components/filters/AlertFilters
 */

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { AlertSeverity, AlertStatus } from '@app-types';

interface AlertFiltersProps {
  onFiltersChange: (filters: AlertFilterState) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface AlertFilterState {
  status?: AlertStatus;
  severity?: AlertSeverity;
  search?: string;
  sourceSystem?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: 'assigned' | 'unassigned' | 'all';
}

const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const statuses: AlertStatus[] = ['open', 'acknowledged', 'resolved', 'false_positive'];

/**
 * Alert Filters Component
 */
const AlertFilters: React.FC<AlertFiltersProps> = ({ onFiltersChange, isOpen = false, onToggle }) => {
  const [filters, setFilters] = useState<AlertFilterState>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof AlertFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined).length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle & Summary */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown size={16} className={clsx('transition-transform', isOpen && 'rotate-180')} />
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search alerts..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All severities</option>
                {severities.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Source System */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source System</label>
              <select
                value={filters.sourceSystem || ''}
                onChange={(e) => handleFilterChange('sourceSystem', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All sources</option>
                <option value="ssh">SSH Monitor</option>
                <option value="ids">IDS/IPS</option>
                <option value="firewall">Firewall</option>
                <option value="endpoint">Endpoint</option>
              </select>
            </div>

            {/* Assignment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
              <select
                value={filters.assignedTo || 'all'}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAdvanced ? '− Hide advanced filters' : '+ Show advanced filters'}
          </button>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="pt-4 border-t border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Filter Summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t border-gray-300">
              <div className="text-sm font-medium text-gray-700 mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <FilterTag
                    label={`Search: "${filters.search}"`}
                    onRemove={() => handleFilterChange('search', undefined)}
                  />
                )}
                {filters.status && (
                  <FilterTag
                    label={`Status: ${filters.status}`}
                    onRemove={() => handleFilterChange('status', undefined)}
                  />
                )}
                {filters.severity && (
                  <FilterTag
                    label={`Severity: ${filters.severity}`}
                    onRemove={() => handleFilterChange('severity', undefined)}
                  />
                )}
                {filters.sourceSystem && (
                  <FilterTag
                    label={`Source: ${filters.sourceSystem}`}
                    onRemove={() => handleFilterChange('sourceSystem', undefined)}
                  />
                )}
                {filters.assignedTo && filters.assignedTo !== 'all' && (
                  <FilterTag
                    label={`${filters.assignedTo.charAt(0).toUpperCase() + filters.assignedTo.slice(1)}`}
                    onRemove={() => handleFilterChange('assignedTo', undefined)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Filter Tag Component
 */
interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ label, onRemove }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="hover:text-blue-600"
    >
      <X size={14} />
    </button>
  </div>
);

export default AlertFilters;
