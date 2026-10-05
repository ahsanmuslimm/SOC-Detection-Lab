/**
 * Reports Page
 *
 * Report generation and management workspace.
 */

import React, { useState } from 'react';
import { FileText, Plus, Trash2, Download } from 'lucide-react';
import { useReports } from '@hooks/useDomainData';
import { formatRelativeTime, getStatusColor } from '@utils/formatters';
import type { IReport } from '@app-types';

const PAGE_SIZE = 10;

const ReportsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [showGenerate, setShowGenerate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newReport, setNewReport] = useState({ title: '', reportType: 'daily_summary', description: '' });

  const { reports, pagination, isLoading, generateReport, deleteReport } = useReports({ page, pageSize: PAGE_SIZE });

  const handleGenerate = async () => {
    if (!newReport.title.trim()) return;
    setIsGenerating(true);
    try {
      await generateReport(newReport);
      setShowGenerate(false);
      setNewReport({ title: '', reportType: 'daily_summary', description: '' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (report: IReport) => {
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view security reports</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={18} />
          Generate Report
        </button>
      </div>

      {/* Reports table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Report</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Type</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Created</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading reports...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No reports generated yet</td></tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{report.title}</div>
                        <div className="text-gray-500 text-xs">{report.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{report.reportType}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatRelativeTime(report.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Download report"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete report"
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

        {pagination && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Total {pagination.total} reports</span>
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

      {/* Generate modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Report Type</label>
                <select
                  value={newReport.reportType}
                  onChange={(e) => setNewReport({ ...newReport, reportType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="daily_summary">Daily Summary</option>
                  <option value="weekly_summary">Weekly Summary</option>
                  <option value="monthly_summary">Monthly Summary</option>
                  <option value="incident_analysis">Incident Analysis</option>
                  <option value="coverage">Detection Coverage</option>
                  <option value="executive">Executive Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowGenerate(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!newReport.title.trim() || isGenerating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
