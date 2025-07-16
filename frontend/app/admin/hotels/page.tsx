'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/auth';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Hotel } from '@/lib/hotel';

export default function AdminHotelsPage() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_info: {
      phone: '',
      email: '',
      website: ''
    },
    location: {
      country: '',
      city: ''
    },
    gallery: [''],
    amenities: {
      gym: false,
      spa: false,
      wifi: false,
      parking: false,
      pool_count: 0
    },
    working_hours: '',
    max_reservations_per_day: 0,
    tax_number: '',
    rating: 0,
    review_count: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user has admin permissions
  const hasAdminAccess = user?.role === 'hotel_admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (hasAdminAccess) {
      loadHotels();
    }
  }, [hasAdminAccess]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/admin`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setHotels(data);
      } else {
        setError('Failed to load hotels');
      }
    } catch (error) {
      console.error('Failed to load hotels:', error);
      setError('Failed to load hotels');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Hotel created successfully!');
        setShowCreateForm(false);
        setFormData({ 
          name: '', 
          contact_info: {
            phone: '',
            email: '',
            website: ''
          },
          location: {
            country: '',
            city: ''
          },
          gallery: [''],
          amenities: {
            gym: false,
            spa: false,
            wifi: false,
            parking: false,
            pool_count: 0
          },
          working_hours: '',
          max_reservations_per_day: 0,
          tax_number: '',
          rating: 0,
          review_count: 0
        });
        loadHotels();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create hotel');
      }
    } catch (error) {
      setError('An error occurred while creating the hotel');
    }
  };

  const deleteHotel = async (hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/${hotelId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setSuccess('Hotel deleted successfully!');
        loadHotels();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete hotel');
      }
    } catch (error) {
      setError('An error occurred while deleting the hotel');
    }
  };

  if (!hasAdminAccess) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-red-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You need Hotel Admin or Super Admin privileges to access this page.</p>
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
                    <h1 className="text-2xl font-bold text-gray-900">Hotel Management</h1>
                    <p className="text-gray-600">Create, update, and manage hotels</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create Hotel
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
                      <h2 className="text-2xl font-bold text-gray-900">Create New Hotel</h2>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                          <input
                            type="text"
                            value={formData.location.country}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              location: { ...formData.location, country: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={formData.location.city}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              location: { ...formData.location, city: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={formData.contact_info.phone}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              contact_info: { ...formData.contact_info, phone: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={formData.contact_info.email}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              contact_info: { ...formData.contact_info, email: e.target.value }
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                        <input
                          type="url"
                          value={formData.contact_info.website}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            contact_info: { ...formData.contact_info, website: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                          <input
                            type="text"
                            value={formData.working_hours}
                            onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-900"
                            placeholder="e.g., 9:00 AM - 10:00 PM"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Reservations/Day</label>
                          <input
                            type="number"
                            value={formData.max_reservations_per_day}
                            onChange={(e) => setFormData({ ...formData, max_reservations_per_day: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tax Number</label>
                        <input
                          type="text"
                          value={formData.tax_number}
                          onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
                          <input
                            type="number"
                            value={formData.rating}
                            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            max="5"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Review Count</label>
                          <input
                            type="number"
                            value={formData.review_count}
                            onChange={(e) => setFormData({ ...formData, review_count: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Image URL</label>
                        <input
                          type="url"
                          value={formData.gallery[0]}
                          onChange={(e) => setFormData({ ...formData, gallery: [e.target.value] })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                        <div className="grid grid-cols-2 gap-4 p-4 border border-gray-300 rounded-lg">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.amenities.gym}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                amenities: { ...formData.amenities, gym: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            Gym
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.amenities.spa}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                amenities: { ...formData.amenities, spa: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            Spa
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.amenities.wifi}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                amenities: { ...formData.amenities, wifi: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            WiFi
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.amenities.parking}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                amenities: { ...formData.amenities, parking: e.target.checked }
                              })}
                              className="mr-2"
                            />
                            Parking
                          </label>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pool Count</label>
                            <input
                              type="number"
                              value={formData.amenities.pool_count}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                amenities: { ...formData.amenities, pool_count: parseInt(e.target.value) }
                              })}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              min="0"
                            />
                          </div>
                        </div>
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
                          Create Hotel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Hotels List */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Hotels ({hotels.length})</h2>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading hotels...</p>
                </div>
              ) : hotels.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hotels yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first hotel.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                          <p className="text-gray-600">{hotel.location.city}, {hotel.location.country}</p>
                          <div className="flex items-center gap-4 mt-2">
                            {hotel.rating && (
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium">{hotel.rating.toFixed(1)}</span>
                                <span className="text-sm text-gray-500">({hotel.review_count || 0} reviews)</span>
                              </div>
                            )}
                            <span className="text-sm text-gray-500">Tax: {hotel.tax_number}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Max reservations: {hotel.max_reservations_per_day}/day</p>
                        </div>
                        <div className="ml-4 flex space-x-2">
                          {user?.role === 'super_admin' && (
                            <button
                              onClick={() => deleteHotel(hotel.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
