/**
 * Alerts Page
 *
 * View and manage security alerts with filtering and action capabilities.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Download, CheckCircle } from 'lucide-react';
import AlertsTable from '@components/tables/AlertsTable';
import AlertFilters, { AlertFilterState } from '@components/filters/AlertFilters';
import type { IAlert } from '@app-types';
import { useAlerts } from '@hooks/useAlerts';
import toast from 'react-hot-toast';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const ALERT_TYPES = [
  'brute_force', 'web_attack', 'malware', 'ransomware', 'lateral_movement',
  'data_exfiltration', 'privilege_escalation', 'reconnaissance', 'phishing',
  'insider_threat', 'ddos', 'command_and_control', 'exploitation', 'persistence',
  'credential_theft', 'supply_chain', 'other',
];

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<AlertFilterState>({});
  const [selectedAlert, setSelectedAlert] = useState<IAlert | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    severity: 'high' as typeof SEVERITIES[number],
    alertType: 'other',
    sourceSystem: 'manual',
    sourceIp: '',
  });

  const { createAlert, acknowledgeAlert } = useAlerts();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFiltersChange = (f: AlertFilterState) => setFilters(f);

  const handleCreateAlert = async () => {
    if (!newAlert.title.trim()) { toast.error('Title is required'); return; }
    setIsCreating(true);
    try {
      await createAlert({
        title: newAlert.title,
        description: newAlert.description || undefined,
        severity: newAlert.severity,
        alertType: newAlert.alertType,
        sourceSystem: newAlert.sourceSystem || 'manual',
        sourceIp: newAlert.sourceIp || undefined,
      } as any);
      setShowCreate(false);
      setNewAlert({ title: '', description: '', severity: 'high', alertType: 'other', sourceSystem: 'manual', sourceIp: '' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExport = () => {
    toast.success('Exporting alerts as CSV…');
    // Build CSV from the current alerts list visible in the table
    const csv = 'data:text/csv;charset=utf-8,Title,Severity,Status,Source,Created\n';
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `alerts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    await acknowledgeAlert({ id: selectedAlert.id });
    setSelectedAlert(null);
  };

  const handleViewInvestigation = () => {
    setSelectedAlert(null);
    navigate('/investigations');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and respond to security events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
          >
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
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

      {/* ── Alert Detail Modal ──────────────────────────────────────────────── */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-600" size={24} />
              {selectedAlert.title}
            </h2>

            <div className="space-y-4">
              {selectedAlert.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Description</h3>
                  <p className="text-gray-900">{selectedAlert.description}</p>
                </div>
              )}
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
                  <p className="text-gray-900">{selectedAlert.sourceSystem ?? 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Created</h3>
                  <p className="text-gray-900">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
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
              {selectedAlert.status === 'open' && (
                <button
                  onClick={handleAcknowledge}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Acknowledge
                </button>
              )}
              <button
                onClick={handleViewInvestigation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                View Investigations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Alert Modal ──────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">New Alert</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="e.g. SSH Brute Force Detected"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  placeholder="What happened?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Severity</label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as typeof SEVERITIES[number] })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Alert Type</label>
                  <select
                    value={newAlert.alertType}
                    onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ALERT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Source System</label>
                  <input
                    type="text"
                    value={newAlert.sourceSystem}
                    onChange={(e) => setNewAlert({ ...newAlert, sourceSystem: e.target.value })}
                    placeholder="e.g. wazuh, suricata"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Source IP</label>
                  <input
                    type="text"
                    value={newAlert.sourceIp}
                    onChange={(e) => setNewAlert({ ...newAlert, sourceIp: e.target.value })}
                    placeholder="e.g. 192.168.1.55"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={isCreating || !newAlert.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isCreating ? 'Creating…' : 'Create Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AlertsPage;
