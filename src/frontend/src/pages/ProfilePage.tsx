/**
 * Profile Page
 *
 * Current user profile and effective permissions, derived from
 * GET /users/me/profile.
 */

import React, { useEffect, useState } from 'react';
import { userService } from '@services/userService';
import type { IUserProfile } from '@app-types';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService
      .getCurrentUser()
      .then((response) => setProfile(response.data ?? null))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Your account and effective permissions</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {isLoading ? (
          <p className="text-gray-400 text-center py-8">Loading profile...</p>
        ) : error ? (
          <p className="text-red-600 text-center py-8">{error}</p>
        ) : profile ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(profile.username || profile.email || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.username}</h2>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Role</h3>
                <p className="text-gray-900 capitalize">{profile.role}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Account ID</h3>
                <p className="text-gray-900">{profile.id}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Effective Permissions</h3>
              {profile.permissions && profile.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-700"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No explicit permissions granted.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfilePage;
