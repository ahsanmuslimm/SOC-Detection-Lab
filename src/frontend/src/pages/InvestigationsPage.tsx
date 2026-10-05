/**
 * Investigations Page
 *
 * Investigation tracking with timeline inspection and close workflow.
 */

import React, { useState } from 'react';
import { Search, Eye, CheckCircle } from 'lucide-react';
import { useInvestigations, useInvestigationTimeline } from '@hooks/useDomainData';
import { formatRelativeTime, getSeverityColor, getStatusColor } from '@utils/formatters';
import type { IInvestigation } from '@app-types';

const PAGE_SIZE = 10;

const InvestigationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvestigation, setSelectedInvestigation] = useState<IInvestigation | null>(null);
  const [closeReason, setCloseReason] = useState('');

  const { investigations, pagination, isLoading, closeInvestigation } = useInvestigations({
    page,
    pageSize: PAGE_SIZE,
    filters: { ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) },
  });

  const { data: timeline, isLoading: timelineLoading } = useInvestigationTimeline(selectedInvestigation?.id || '');

  const handleClose = async () => {
    if (!selectedInvestigation || !closeReason.trim()) return;
    await closeInvestigation({ id: selectedInvestigation.id, closeReason });
    setSelectedInvestigation(null);
    setCloseReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Investigations</h1>
        <p className="text-gray-600 mt-1">Track ongoing investigations and findings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search investigations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Investigations table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Investigation</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Severity</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Case</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Updated</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading investigations...</td></tr>
            ) : investigations.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No investigations found</td></tr>
            ) : (
              investigations.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{record.title}</div>
                    <div className="text-gray-500 text-xs">{record.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(record.severity || 'medium')}`}>
                      {record.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.caseId || '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{formatRelativeTime(record.updatedAt || record.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedInvestigation(record)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View timeline"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Total {pagination.total} investigations</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                disabled={!pagination.hasMore}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline modal */}
      {selectedInvestigation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedInvestigation.title}</h2>
            <p className="text-gray-500 text-sm mb-4">{selectedInvestigation.description}</p>

            {/* Timeline */}
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Timeline</h3>
            {timelineLoading ? (
              <p className="text-gray-400 text-sm py-4">Loading timeline...</p>
            ) : !timeline || timeline.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No timeline events recorded.</p>
            ) : (
              <ol className="relative border-l border-gray-200 ml-3 space-y-4">
                {timeline.map((event, index) => (
                  <li key={event.id || index} className="ml-4">
                    <span className="absolute w-2 h-2 bg-blue-600 rounded-full -left-[4.5px] mt-1.5" />
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''} · {event.type} · {event.source}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {/* Close workflow */}
            {selectedInvestigation.status !== 'closed' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Close investigation</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Close reason..."
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleClose}
                    disabled={!closeReason.trim()}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 text-sm"
                  >
                    <CheckCircle size={16} />
                    Close
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedInvestigation(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationsPage;
