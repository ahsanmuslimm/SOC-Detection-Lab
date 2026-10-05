/**
 * Cases Page
 *
 * Case management workspace: list, filter, inspect and manage cases.
 */

import React, { useState } from 'react';
import { Briefcase, Plus, Search, Trash2, Eye } from 'lucide-react';
import { useCases } from '@hooks/useDomainData';
import { formatRelativeTime, getSeverityColor, getStatusColor } from '@utils/formatters';
import type { ICase } from '@app-types';

const PAGE_SIZE = 10;

const CasesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState<ICase | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', description: '', severity: 'medium', caseType: 'investigation' });

  const { cases, pagination, isLoading, deleteCase, createCase, updateCase } = useCases({
    page,
    pageSize: PAGE_SIZE,
    filters: { ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) },
  });

  const handleCreate = async () => {
    if (!newCase.title.trim()) return;
    await createCase({ ...newCase, severity: newCase.severity as ICase['severity'] });
    setShowCreate(false);
    setNewCase({ title: '', description: '', severity: 'medium', caseType: 'investigation' });
  };

  const handleClose = async (record: ICase) => {
    await updateCase({ id: record.id, data: { status: 'closed' } });
    setSelectedCase(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-1">Manage investigation cases</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={18} />
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases..."
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
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="contained">Contained</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Cases table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Case</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Severity</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Assignee</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Created</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading cases...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No cases found</td></tr>
            ) : (
              cases.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{record.title}</div>
                    <div className="text-gray-500 text-xs">{record.caseNumber || record.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(record.severity)}`}>
                      {record.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.assignedTo || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-gray-500">{formatRelativeTime(record.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedCase(record)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View case"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => deleteCase(record.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete case"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Total {pagination.total} cases</span>
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

      {/* Case detail modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="text-blue-600" size={24} />
              {selectedCase.title}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Description</h3>
                <p className="text-gray-900">{selectedCase.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Severity</h3>
                  <p className="text-gray-900 capitalize">{selectedCase.severity}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Status</h3>
                  <p className="text-gray-900 capitalize">{selectedCase.status}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Assignee</h3>
                  <p className="text-gray-900">{selectedCase.assignedTo || 'Unassigned'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Created</h3>
                  <p className="text-gray-900">{new Date(selectedCase.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedCase(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
              {selectedCase.status !== 'closed' && (
                <button
                  onClick={() => handleClose(selectedCase)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Close Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create case modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">New Case</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Severity</label>
                  <select
                    value={newCase.severity}
                    onChange={(e) => setNewCase({ ...newCase, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Case Type</label>
                  <select
                    value={newCase.caseType}
                    onChange={(e) => setNewCase({ ...newCase, caseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="investigation">Investigation</option>
                    <option value="data_exfiltration">Data Exfiltration</option>
                    <option value="breach">Breach</option>
                    <option value="malware">Malware</option>
                  </select>
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
                onClick={handleCreate}
                disabled={!newCase.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                Create Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
