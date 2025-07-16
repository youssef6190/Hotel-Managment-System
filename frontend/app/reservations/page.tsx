'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/auth';
import Header from '@/components/Header';

interface Hotel {
  id: string;
  name: string;
  location: {
    country: string;
    city: string;
  };
  price_per_night: number;
  images: string[];
  description: string;
}

interface Reservation {
  id: string;
  hotel_id: string;
  user_id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  status: string;
  number_of_guests: number;
  price: number;
  created_at?: string;
}

export default function ReservationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: '',
    start_date: '',
    end_date: '',
    number_of_guests: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load data for authenticated guests - moved before early returns
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'viewer') {
      loadHotels();
      loadReservations();
    }
  }, [isAuthenticated, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login prompt for non-authenticated users or viewers
  if (!isAuthenticated || user?.role === 'viewer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-20 w-20 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-5 0H9" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Reservations Access Required
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            To access the reservations page and make hotel bookings, you need to be logged in as a guest. 
            Please login or create an account to start booking your perfect stay.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/login"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 block text-center"
            >
              Login to Your Account
            </Link>
            
            <Link 
              href="/register"
              className="w-full border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 block text-center"
            >
              Create New Account
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Already have an account but still seeing this message?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Try logging in again
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const loadHotels = async () => {
    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      // For hotel admins, load only their assigned hotels
      const endpoint = user?.role === 'hotel_admin' 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/admin`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/`;
      
      const response = await fetch(endpoint, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setHotels(data);
      }
    } catch (error) {
      console.error('Failed to load hotels:', error);
    }
  };

  const loadReservations = async () => {
    try {
      setReservationsLoading(true);
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      let endpoint = '';
      
      // Different endpoints based on user role
      if (user?.role === 'hotel_admin') {
        // Hotel admins see reservations for their assigned hotels only
        const hotelsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/admin`, {
          headers
        });
        
        if (hotelsResponse.ok) {
          const adminHotels = await hotelsResponse.json();
          
          // Get reservations for the admin's assigned hotels
          const allReservations = [];
          for (const hotel of adminHotels) {
            const reservationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/hotel/${hotel.id}`, {
              headers
            });
            
            if (reservationsResponse.ok) {
              const hotelReservations = await reservationsResponse.json();
              allReservations.push(...hotelReservations);
            }
          }
          
          setReservations(allReservations);
        }
      } else if (user?.role === 'super_admin') {
        // Super admin sees all reservations
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/`;
        const response = await fetch(endpoint, { headers });
        
        if (response.ok) {
          const data = await response.json();
          setReservations(data);
        }
      } else {
        // Guests see only their own reservations
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/my-reservations`;
        const response = await fetch(endpoint, { headers });
        
        if (response.ok) {
          const data = await response.json();
          setReservations(data);
        }
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // First, get available rooms for the hotel
      const headers = await authAPI.getAuthHeadersWithRefresh();
      const roomsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/rooms/?hotel_id=${formData.hotel_id}`, {
        headers
      });

      if (!roomsResponse.ok) {
        setError('Failed to get available rooms');
        return;
      }

      const rooms = await roomsResponse.json();
      if (rooms.length === 0) {
        setError('No rooms available for this hotel');
        return;
      }

      // Use the first available room
      const selectedRoom = rooms[0];
      
      // Calculate total price
      const nights = calculateNights();
      const hotel = getSelectedHotel();
      const totalPrice = hotel ? hotel.price_per_night * nights : 0;

      const reservationData = {
        ...formData,
        room_id: selectedRoom.id,
        price: totalPrice,
        status: 'pending'
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        setSuccess('Reservation created successfully!');
        setShowNewReservationForm(false);
        setFormData({ hotel_id: '', start_date: '', end_date: '', number_of_guests: 1 });
        loadReservations();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create reservation');
      }
    } catch (error) {
      setError('An error occurred while creating the reservation');
    }
  };

  const calculateNights = () => {
    if (formData.start_date && formData.end_date) {
      const checkIn = new Date(formData.start_date);
      const checkOut = new Date(formData.end_date);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const getSelectedHotel = () => {
    return hotels.find(hotel => hotel.id === formData.hotel_id);
  };

  const calculateTotal = () => {
    const hotel = getSelectedHotel();
    const nights = calculateNights();
    return hotel ? hotel.price_per_night * nights : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'hotel_admin' ? 'Hotel Reservations' : 
                 user?.role === 'super_admin' ? 'All Reservations' : 
                 'My Reservations'}
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.role === 'hotel_admin' ? 'Manage reservations for your hotels' : 
                 user?.role === 'super_admin' ? 'Manage all system reservations' : 
                 'Manage your hotel bookings'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user?.id}</span>
              </p>
            </div>
            {/* Only show "New Reservation" button for guests */}
            {user?.role === 'guest' && (
              <button
                onClick={() => setShowNewReservationForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                New Reservation
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* New Reservation Form Modal - Only for guests */}
        {showNewReservationForm && user?.role === 'guest' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">New Reservation</h2>
                  <button
                    onClick={() => setShowNewReservationForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Hotel Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Hotel
                    </label>
                    <select
                      value={formData.hotel_id}
                      onChange={(e) => setFormData({ ...formData, hotel_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      required
                    >
                      <option value="" className="text-gray-500">Choose a hotel...</option>
                      {hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name} - {hotel.location.city}, {hotel.location.country} (${hotel.price_per_night}/night)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      value={formData.number_of_guests}
                      onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-600"
                      min="1"
                      max="10"
                      placeholder="Enter number of guests"
                      required
                    />
                  </div>

                  {/* Price Summary */}
                  {formData.hotel_id && formData.start_date && formData.end_date && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Hotel:</span>
                          <span>{getSelectedHotel()?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nights:</span>
                          <span>{calculateNights()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per night:</span>
                          <span>${getSelectedHotel()?.price_per_night}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Guests:</span>
                          <span>{formData.number_of_guests}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                          <span>Total:</span>
                          <span>${calculateTotal()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowNewReservationForm(false)}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                    >
                      Create Reservation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Reservations List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Reservations</h2>
            
            {reservationsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading reservations...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first reservation.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowNewReservationForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Create Reservation
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {user?.role === 'hotel_admin' || user?.role === 'super_admin' 
                            ? `Reservation #${reservation.id.slice(-8)}` 
                            : `Hotel ID: ${reservation.hotel_id}`}
                        </h3>
                        
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          {/* Show different information based on role */}
                          {(user?.role === 'hotel_admin' || user?.role === 'super_admin') && (
                            <>
                              <div>
                                <span className="font-medium">Customer ID:</span> {reservation.user_id}
                              </div>
                              <div>
                                <span className="font-medium">Hotel ID:</span> {reservation.hotel_id}
                              </div>
                              <div>
                                <span className="font-medium">Room ID:</span> {reservation.room_id}
                              </div>
                            </>
                          )}
                          
                          <div>
                            <span className="font-medium">Check-in:</span> {new Date(reservation.start_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Check-out:</span> {new Date(reservation.end_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Guests:</span> {reservation.number_of_guests}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> ${reservation.price}
                          </div>
                          
                          {reservation.created_at && (
                            <div>
                              <span className="font-medium">Booked:</span> {new Date(reservation.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          reservation.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : reservation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reservation.status}
                        </span>
                        
                        {/* Admin actions - only show for hotel admins and super admins */}
                        {(user?.role === 'hotel_admin' || user?.role === 'super_admin') && (
                          <div className="flex space-x-2">
                            {reservation.status === 'pending' && (
                              <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors">
                                Confirm
                              </button>
                            )}
                            <button className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors">
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
