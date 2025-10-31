'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/auth';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  age: number;
  mobile_number: string;
  job_type?: string;
  gender: string;
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
  { value: 'guest', label: 'Guest', color: 'bg-green-100 text-green-800' },
  { value: 'hotel_admin', label: 'Hotel Admin', color: 'bg-blue-100 text-blue-800' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-800' }
];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'guest',
    age: 0,
    mobile_number: '',
    gender: '',
    job_type: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Only super admins can access this page
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded users:', data); // Debug log
        setUsers(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || `Failed to load users (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      if (error instanceof Error) {
        setError(error.message.includes('fetch') ? 
          'Cannot connect to server. Please check if the backend is running.' : 
          `Failed to load users: ${error.message}`);
      } else {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('User created successfully!');
        setShowCreateForm(false);
        setFormData({ email: '', full_name: '', password: '', role: 'guest', age: 0, mobile_number: '', gender: '', job_type: '' });
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create user');
      }
    } catch (error) {
      setError('An error occurred while creating the user');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers
      });

      if (response.ok) {
        setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update user status');
      }
    } catch (error) {
      setError('An error occurred while updating user status');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/${userId}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setSuccess('User role updated successfully!');
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update user role');
      }
    } catch (error) {
      setError('An error occurred while updating user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/users/${userId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setSuccess('User deleted successfully!');
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete user');
      }
    } catch (error) {
      setError('An error occurred while deleting the user');
    }
  };

  const getRoleColor = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(option => option.value === role);
    return roleOption?.color || 'bg-gray-100 text-gray-800';
  };

  if (!isSuperAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need Super Admin privileges to access this page.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="bg-white shadow-sm rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">Manage system users and their roles</p>
                    <p className="text-sm text-gray-500 mt-1">User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user?.id}</span></p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Create Form Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                        <input
                          type="text"
                          value={formData.mobile_number}
                          onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Type (Optional)</label>
                        <input
                          type="text"
                          value={formData.job_type}
                          onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Users List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Users ({users.length})</h2>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first user.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400 font-mono">ID: {user.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)} border-0 focus:ring-2 focus:ring-blue-500`}
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              } transition-colors duration-200`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
