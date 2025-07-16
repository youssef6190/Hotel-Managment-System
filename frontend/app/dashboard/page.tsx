'use client';

import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define what each role can do
interface PermissionSet {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
}

interface RoleInfo {
  name: string;
  description: string;
  color: string;
  permissions: {
    hotel: PermissionSet;
    room: PermissionSet;
    reservation: PermissionSet;
    payment: PermissionSet;
    availability: PermissionSet;
    user?: PermissionSet;
  };
}

const ROLE_PERMISSIONS: Record<string, RoleInfo> = {
  viewer: {
    name: 'Viewer',
    description: 'Can browse and view content',
    color: 'bg-gray-100 text-gray-800',
    permissions: {
      hotel: { read: true },
      room: { read: true },
      reservation: { read: true },
      payment: { read: true },
      availability: { read: true }
    }
  },
  guest: {
    name: 'Guest',
    description: 'Can make reservations and payments',
    color: 'bg-blue-100 text-blue-800',
    permissions: {
      hotel: { read: true },
      room: { read: true },
      reservation: { create: true, read: true },
      payment: { create: true, read: true },
      availability: { read: true }
    }
  },
  hotel_admin: {
    name: 'Hotel Admin',
    description: 'Can manage hotels, rooms, and reservations',
    color: 'bg-green-100 text-green-800',
    permissions: {
      hotel: { create: true, read: true, update: true },
      room: { create: true, read: true, update: true, delete: true },
      reservation: { create: true, read: true, update: true, delete: true },
      payment: { create: true, read: true, update: true },
      availability: { create: true, read: true, update: true, delete: true },
      user: { read: true }
    }
  },
  super_admin: {
    name: 'Super Admin',
    description: 'Full system access and control',
    color: 'bg-red-100 text-red-800',
    permissions: {
      hotel: { create: true, read: true, update: true, delete: true },
      room: { create: true, read: true, update: true, delete: true },
      reservation: { create: true, read: true, update: true, delete: true },
      payment: { create: true, read: true, update: true, delete: true },
      availability: { create: true, read: true, update: true, delete: true },
      user: { create: true, read: true, update: true, delete: true }
    }
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    hotels: 0,
    rooms: 0,
    reservations: 0,
    users: 0
  });

  const userRole = user?.role as keyof typeof ROLE_PERMISSIONS;
  const roleInfo = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.viewer;

  const getCRUDActions = (entity: string, permissions: any) => {
    const actions = [];
    if (permissions.create) actions.push('Create');
    if (permissions.read) actions.push('Read');
    if (permissions.update) actions.push('Update');
    if (permissions.delete) actions.push('Delete');
    return actions;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Create': return 'bg-green-100 text-green-800';
      case 'Read': return 'bg-blue-100 text-blue-800';
      case 'Update': return 'bg-yellow-100 text-yellow-800';
      case 'Delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Welcome Section */}
            <div className="bg-white overflow-hidden shadow-sm rounded-lg mb-8">
              <div className="px-6 py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Welcome back, {user?.full_name || user?.email}!
                    </h1>
                    <p className="mt-2 text-gray-600">
                      Here's what you can do with your {roleInfo.name} account
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
                      {roleInfo.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Information Card */}
            <div className="bg-white shadow-sm rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              </div>
              <div className="px-6 py-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                      {user?.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.full_name || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.name}
                      </span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Role Description</dt>
                  <dd className="mt-1 text-sm text-gray-700">{roleInfo.description}</dd>
                </div>
              </div>
            </div>

            {/* Permissions Overview */}
            <div className="bg-white shadow-sm rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Permissions</h2>
                <p className="text-sm text-gray-600">Operations you can perform on different resources</p>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {Object.entries(roleInfo.permissions).map(([entity, permissions]) => (
                    <div key={entity} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 capitalize mb-3">
                        {entity === 'availability' ? 'Room Availability' : `${entity}s`}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getCRUDActions(entity, permissions).map((action) => (
                          <span
                            key={action}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(action)}`}
                          >
                            {action}
                          </span>
                        ))}
                        {getCRUDActions(entity, permissions).length === 0 && (
                          <span className="text-xs text-gray-500 italic">No permissions</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Based on Role */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                <p className="text-sm text-gray-600">Common tasks for your role</p>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  
                  {/* Browse Hotels - Available to all roles */}
                  <Link href="/hotels" className="group relative rounded-lg border border-gray-300 bg-white px-6 py-4 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-4 0h4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Browse Hotels</h3>
                        <p className="text-sm text-gray-500">View available accommodations</p>
                      </div>
                    </div>
                  </Link>

                  {/* Reservations - Available to guests and above */}
                  {roleInfo.permissions.reservation?.read && (
                    <Link href="/reservations" className="group relative rounded-lg border border-gray-300 bg-white px-6 py-4 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                            {roleInfo.permissions.reservation?.create ? 'Manage Reservations' : 'View Reservations'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {roleInfo.permissions.reservation?.create ? 'Create and manage bookings' : 'View your booking history'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Hotel Management - Admin only */}
                  {roleInfo.permissions.hotel?.create && (
                    <Link href="/admin/hotels" className="group relative rounded-lg border border-gray-300 bg-white px-6 py-4 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Hotel Management</h3>
                          <p className="text-sm text-gray-500">Create and manage hotels</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Room Management - Admin only */}
                  {roleInfo.permissions.room?.create && (
                    <Link href="/admin/rooms" className="group relative rounded-lg border border-gray-300 bg-white px-6 py-4 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Room Management</h3>
                        <p className="text-sm text-gray-500">Manage hotel rooms and availability</p>
                      </div>
                    </div>
                  </Link>
                  )}

                  {/* User Management - Super Admin only */}
                  {roleInfo.permissions.user?.read && (
                    <Link href="/admin/users" className="group relative rounded-lg border border-gray-300 bg-white px-6 py-4 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">User Management</h3>
                          <p className="text-sm text-gray-500">Manage system users and roles</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Profile Settings - Available to all */}
                  <Link href="/profile" className="group relative rounded-lg border border-gray-300 bg-white px-6 py-4 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Profile Settings</h3>
                        <p className="text-sm text-gray-500">Update your account information</p>
                      </div>
                    </div>
                  </Link>

                </div>
              </div>
            </div>

            {/* Role Upgrade Hint for Viewers */}
            {userRole === 'viewer' && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Want to make reservations?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Your account will automatically be upgraded to Guest status when you log in again, 
                        allowing you to make hotel reservations and payments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
