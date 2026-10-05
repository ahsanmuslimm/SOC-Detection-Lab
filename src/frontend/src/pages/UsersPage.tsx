/**
 * Users Page
 *
 * User account and role management console.
 */

import React, { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useUsers, useRoles } from '@hooks/useDomainData';
import { formatRelativeTime, getStatusColor } from '@utils/formatters';
import type { IUser, UserRole } from '@app-types';

const PAGE_SIZE = 10;

const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState<{ firstName: string; lastName: string; email: string; role: UserRole }>({ firstName: '', lastName: '', email: '', role: 'analyst' });

  const { users, pagination, isLoading, createUser, updateUser, deleteUser } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    filters: search ? { search } : {},
  });

  const { data: roles } = useRoles();

  const handleCreate = async () => {
    if (!newUser.firstName.trim() || !newUser.email.trim()) return;
    await createUser(newUser);
    setShowCreate(false);
    setNewUser({ firstName: '', lastName: '', email: '', role: 'analyst' });
  };

  const handleRoleChange = async (user: IUser, role: string) => {
    // role id strings from RBAC map directly onto the UserRole field
    await updateUser({ id: user.id, data: { role: role as UserRole } });
  };

  const handleStatusToggle = async (user: IUser) => {
    await updateUser({ id: user.id, data: { status: user.status === 'active' ? 'inactive' : 'active' } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus size={18} />
          Invite User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">User</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Role</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-600">Joined</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.fullName || user.username}</div>
                    <div className="text-gray-500 text-xs">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={String(user.role || '').toLowerCase()}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="px-2 py-1 border border-gray-200 rounded text-xs"
                    >
                      {(roles || []).map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleStatusToggle(user)} title="Toggle status">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                        {user.status}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatRelativeTime(user.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete user"
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
            <span>Total {pagination.total} users</span>
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

      {/* Invite modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite User</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {(roles || []).map((role) => (
                    <option key={role.id} value={role.id}>{role.name} — {role.description}</option>
                  ))}
                </select>
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
                disabled={!newUser.firstName.trim() || !newUser.email.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
