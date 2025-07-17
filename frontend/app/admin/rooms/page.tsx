'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/auth';
import { Room, RoomAPI } from '@/lib/room';
import { Hotel, HotelAPI } from '@/lib/hotel';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: '',
    room_number: '',
    type_name: 'Single' as 'Single' | 'Double' | 'Suite',
    price_per_night: 0,
    max_occupancy: 1,
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user has admin permissions
  const hasAdminAccess = user?.role === 'hotel_admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (hasAdminAccess) {
      loadRooms();
      loadHotels();
    }
  }, [hasAdminAccess]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await RoomAPI.getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const loadHotels = async () => {
    try {
      const data = await HotelAPI.getAllHotels();
      setHotels(data);
    } catch (error) {
      console.error('Failed to load hotels:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Convert form data to match backend schema
      const submitData = {
        hotel_id: formData.hotel_id,
        room_number: parseInt(formData.room_number) || 0,
        type_name: formData.type_name,
        price_per_night: formData.price_per_night,
        max_occupancy: formData.max_occupancy,
        description: formData.description
      };
      
      const result = await RoomAPI.createRoom(submitData);
      setSuccess('Room created successfully!');
      setShowCreateForm(false);
      setFormData({ hotel_id: '', room_number: '', type_name: 'Single' as 'Single' | 'Double' | 'Suite', price_per_night: 0, max_occupancy: 1, description: '' });
      loadRooms();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the room';
      setError(errorMessage);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await RoomAPI.deleteRoom(roomId);
      setSuccess('Room deleted successfully!');
      loadRooms();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the room';
      setError(errorMessage);
    }
  };

  const getHotelName = (hotelId?: string) => {
    if (!hotelId) return 'Unknown Hotel';
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : 'Unknown Hotel';
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
                    <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
                    <p className="text-gray-600">Manage hotel rooms and availability</p>
                    <p className="text-sm text-gray-500 mt-1">User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user?.id}</span></p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create Room
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
                      <h2 className="text-2xl font-bold text-gray-900">Create New Room</h2>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hotel</label>
                        <select
                          value={formData.hotel_id}
                          onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a hotel...</option>
                          {hotels.map((hotel) => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name} - {hotel.location.city}, {hotel.location.country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                        <input
                          type="number"
                          value={formData.room_number}
                          onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                        <select
                          value={formData.type_name}
                          onChange={(e) => setFormData({ ...formData, type_name: e.target.value as 'Single' | 'Double' | 'Suite' })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="Single">Single</option>
                          <option value="Double">Double</option>
                          <option value="Suite">Suite</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price per Night ($)</label>
                        <input
                          type="number"
                          value={formData.price_per_night}
                          onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Occupancy</label>
                        <input
                          type="number"
                          value={formData.max_occupancy}
                          onChange={(e) => setFormData({ ...formData, max_occupancy: parseInt(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                          max="10"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={4}
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
                          Create Room
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Rooms List */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Rooms ({rooms.length})</h2>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first room.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <div key={room.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <h3 className="text-lg font-semibold text-gray-900">Room {room.room_number}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {room.type_name}
                            </span>
                          </div>
                          <p className="text-gray-600">{getHotelName(room.hotel_id)}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>${room.price_per_night}/night</span>
                            <span>Max Occupancy: {room.max_occupancy}</span>
                          </div>
                          {room.description && (
                            <p className="text-sm text-gray-700 mt-2">{room.description}</p>
                          )}
                        </div>
                        <div className="ml-4 flex space-x-2">
                          {(user?.role === 'super_admin' || user?.role === 'hotel_admin') && (
                            <button
                              onClick={() => deleteRoom(room.id)}
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
