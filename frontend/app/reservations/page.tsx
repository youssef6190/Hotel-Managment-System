'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/auth';
import { RoomAPI, Room } from '@/lib/room';
import Header from '@/components/Header';

interface Hotel {
  id: string;
  name: string;
  location: {
    country: string;
    city: string;
  };
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
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [formData, setFormData] = useState({
    hotel_id: '',
    room_id: '',
    start_date: '',
    end_date: '',
    number_of_guests: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingReservation, setUpdatingReservation] = useState<string | null>(null);

  // State to hold hotel and room details for each reservation
  const [hotelDetails, setHotelDetails] = useState<{[key: string]: Hotel}>({});
  const [roomDetails, setRoomDetails] = useState<{[key: string]: Room}>({});
  
  // Load data for authenticated users (except viewers)
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'viewer') {
      loadHotels();
      loadReservations().then(loadedReservations => {
        if (loadedReservations && (user?.role === 'guest' || user?.role === 'hotel_admin' || user?.role === 'super_admin')) {
          loadReservationDetails(loadedReservations);
        }
      });
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
            To access the reservations page and make hotel bookings, you need to be logged in with appropriate permissions. 
            Please login or create an account to start managing reservations.
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
      // For hotel admins, load only their assigned hotels (requires auth)
      if (user?.role === 'hotel_admin') {
        const headers = await authAPI.getAuthHeadersWithRefresh();
        
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/admin`;
        
        const response = await fetch(endpoint, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          setHotels(data);
        } else {
          setError('Failed to load hotels. Please try again.');
        }
      } else {
        // For regular users (guests), use public endpoint without auth
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/`;
        
        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHotels(data);
        } else {
          setError('Failed to load hotels. Please try again.');
        }
      }
    } catch (error) {
      setError('Failed to load hotels. Please check your connection.');
    }
  };

  const loadReservations = async () => {
    try {
      setReservationsLoading(true);
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      let endpoint = '';
      let loadedReservations = [];
      
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
          
          loadedReservations = allReservations;
          setReservations(allReservations);
        }
      } else if (user?.role === 'super_admin') {
        // Super admin sees all reservations
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/`;
        const response = await fetch(endpoint, { headers });
        
        if (response.ok) {
          const data = await response.json();
          loadedReservations = data;
          setReservations(data);
        }
      } else {
        // Guests see only their own reservations
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/my-reservations`;
        const response = await fetch(endpoint, { headers });
        
        if (response.ok) {
          const data = await response.json();
          loadedReservations = data;
          setReservations(data);
        }
      }
      
      return loadedReservations;
    } catch (error) {
      console.error('Failed to load reservations:', error);
      return [];
    } finally {
      setReservationsLoading(false);
    }
  };

  const loadRoomsForHotel = async (hotelId: string) => {
    if (!hotelId) {
      setAvailableRooms([]);
      return;
    }

    try {
      setRoomsLoading(true);
      const rooms = await RoomAPI.getRoomsByHotel(hotelId);
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setAvailableRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  // Function to fetch hotel and room details for each reservation
  const loadReservationDetails = async (reservationList: Reservation[]) => {
    // Set up hotel detail fetching
    const hotelPromises = reservationList.map(async (reservation) => {
      if (!reservation.hotel_id) return null;
      
      try {
        const hotel = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/hotels/${reservation.hotel_id}`)
          .then(res => res.ok ? res.json() : null);
        
        return { id: reservation.hotel_id, data: hotel };
      } catch (error) {
        console.error(`Error fetching hotel ${reservation.hotel_id}:`, error);
        return null;
      }
    });
    
    // Set up room detail fetching
    const roomPromises = reservationList.map(async (reservation) => {
      if (!reservation.room_id) return null;
      
      try {
        const room = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/rooms/${reservation.room_id}`)
          .then(res => res.ok ? res.json() : null);
        
        return { id: reservation.room_id, data: room };
      } catch (error) {
        console.error(`Error fetching room ${reservation.room_id}:`, error);
        return null;
      }
    });
    
    // Wait for all promises to resolve
    const hotelResults = await Promise.all(hotelPromises);
    const roomResults = await Promise.all(roomPromises);
    
    // Convert to lookup objects
    const hotelMap: {[key: string]: Hotel} = {};
    const roomMap: {[key: string]: Room} = {};
    
    hotelResults.forEach(result => {
      if (result && result.data) {
        hotelMap[result.id] = result.data;
      }
    });
    
    roomResults.forEach(result => {
      if (result && result.data) {
        roomMap[result.id] = result.data;
      }
    });
    
    setHotelDetails(hotelMap);
    setRoomDetails(roomMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate that a room is selected
    if (!formData.room_id) {
      setError('Please select a room');
      return;
    }

    // Validate that required fields are not empty
    if (!formData.hotel_id || !formData.room_id) {
      setError('Please select both a hotel and a room');
      return;
    }

    // Validate guest capacity
    const selectedRoom = availableRooms.find(room => room.id === formData.room_id);
    if (selectedRoom && formData.number_of_guests > selectedRoom.max_occupancy) {
      setError(`This room can accommodate maximum ${selectedRoom.max_occupancy} guests. Please select a different room or reduce the number of guests.`);
      return;
    }

    // Validate that required fields are not empty
    if (!formData.hotel_id || !formData.room_id) {
      setError('Please select both a hotel and a room');
      return;
    }

    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      // Calculate total price using the room's price per night
      const nights = calculateNights();
      const totalPrice = selectedRoom && selectedRoom.price_per_night ? selectedRoom.price_per_night * nights : 0;

      // Create reservation data with valid values only
      const reservationData = {
        hotel_id: formData.hotel_id,
        room_id: formData.room_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        number_of_guests: formData.number_of_guests,
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
        setFormData({ hotel_id: '', room_id: '', start_date: '', end_date: '', number_of_guests: 1 });
        setAvailableRooms([]);
        loadReservations();
      } else {
        const errorData = await response.json();
        console.error('Reservation creation failed:', errorData);
        setError(errorData.detail || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      setError('An error occurred while creating the reservation');
    }
  };

  const calculateNights = () => {
    if (formData.start_date && formData.end_date) {
      // Create dates without time to avoid timezone issues
      const checkIn = new Date(formData.start_date + 'T00:00:00');
      const checkOut = new Date(formData.end_date + 'T00:00:00');
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const getSelectedHotel = () => {
    return hotels.find(hotel => hotel.id === formData.hotel_id);
  };

  const calculateTotal = () => {
    // Find the selected room using both string and object comparison
    const selectedRoom = availableRooms.find(room => 
      room.id === formData.room_id || 
      room.id?.toString() === formData.room_id?.toString()
    );
    
    const nights = calculateNights();
    
    if (!selectedRoom || nights <= 0) {
      return 0;
    }
    
    // Convert price to number, handling both string and number formats
    const pricePerNight = parseFloat(selectedRoom.price_per_night?.toString() || '0');
    
    if (!pricePerNight || isNaN(pricePerNight)) {
      return 0;
    }
    
    return pricePerNight * nights;
  };

  const getSelectedRoom = () => {
    return availableRooms.find(room => room.id === formData.room_id);
  };

  const updateReservationStatus = async (reservationId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      setUpdatingReservation(reservationId);
      setError('');
      setSuccess('');
      
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reservations/${reservationId}/status?status=${newStatus}`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setSuccess(`Reservation ${newStatus} successfully!`);
        // Reload reservations to reflect the updated status
        loadReservations();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Failed to ${newStatus === 'confirmed' ? 'confirm' : 'cancel'} reservation`);
      }
    } catch (error) {
      console.error(`Error updating reservation status:`, error);
      setError(`An error occurred while updating the reservation status`);
    } finally {
      setUpdatingReservation(null);
    }
  };

  // Automatic payment creation for guests
  const [creatingPayment, setCreatingPayment] = useState<string | null>(null);
  
  const createAutomaticPayment = async (reservation: Reservation) => {
    try {
      setCreatingPayment(reservation.id);
      setError('');
      setSuccess('');

      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      const paymentData = {
        reservation_id: reservation.id,
        amount: reservation.price,
        payment_method: 'credit_card',
        payment_status: 'pending', // Guests always create pending payments
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/payments/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        setSuccess(`Payment of $${reservation.price.toFixed(2)} created successfully for your reservation!`);
        // Optionally reload reservations to update UI
        // loadReservations();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create payment');
      }
    } catch (error) {
      setError('Network error occurred while creating payment');
      console.error('Error creating automatic payment:', error);
    } finally {
      setCreatingPayment(null);
    }
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
            {/* Show "New Reservation" button for guests, hotel admins, and super admins */}
            {(user?.role === 'guest' || user?.role === 'hotel_admin' || user?.role === 'super_admin') && (
              <button
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setShowNewReservationForm(true);
                }}
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

        {/* New Reservation Form Modal - For guests, hotel admins, and super admins */}
        {showNewReservationForm && (user?.role === 'guest' || user?.role === 'hotel_admin'||user?.role === 'super_admin') && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {success}
                    </div>
                  )}

                  {/* Hotel Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Hotel {hotels.length === 0 && '(Loading...)'}
                    </label>
                    <select
                      value={formData.hotel_id}
                      onChange={(e) => {
                        const hotelId = e.target.value;
                        setFormData({ ...formData, hotel_id: hotelId, room_id: '' });
                        loadRoomsForHotel(hotelId);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      required
                    >
                      <option value="" className="text-gray-500">Choose a hotel...</option>
                      {hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name} - {hotel.location.city}, {hotel.location.country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Room
                    </label>
                    {!formData.hotel_id ? (
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500">
                        Please select a hotel first
                      </div>
                    ) : roomsLoading ? (
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading available rooms...
                      </div>
                    ) : availableRooms.length === 0 ? (
                      <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-red-50 text-red-600">
                        No rooms available for this hotel
                      </div>
                    ) : (
                      <select
                        value={formData.room_id}
                        onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        required
                      >
                        <option value="" className="text-gray-500">Choose a room...</option>
                        {availableRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            Room {room.room_number} - {room.type_name} (${room.price_per_night}/night, Max {room.max_occupancy} guests)
                          </option>
                        ))}
                      </select>
                    )}
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
                      {getSelectedRoom() && (
                        <span className="text-xs text-gray-500 ml-1">
                          (Max: {getSelectedRoom()?.max_occupancy})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={formData.number_of_guests}
                      onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-600"
                      min="1"
                      max={getSelectedRoom()?.max_occupancy || 10}
                      placeholder="Enter number of guests"
                      required
                    />
                    {getSelectedRoom() && formData.number_of_guests > (getSelectedRoom()?.max_occupancy || 0) && (
                      <p className="text-sm text-red-600 mt-1">
                        This room can accommodate maximum {getSelectedRoom()?.max_occupancy} guests
                      </p>
                    )}
                  </div>

                  {/* Price Summary */}
                  {formData.hotel_id && formData.room_id && formData.start_date && formData.end_date && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Hotel:</span>
                          <span>{getSelectedHotel()?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <span>
                            {getSelectedRoom() && (
                              `Room ${getSelectedRoom()?.room_number} (${getSelectedRoom()?.type_name})`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nights:</span>
                          <span>{calculateNights()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per night:</span>
                          <span>${getSelectedRoom()?.price_per_night?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Guests:</span>
                          <span>{formData.number_of_guests}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                          <span>Total:</span>
                          <span>${calculateTotal().toFixed(2)}</span>
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
                            : hotelDetails[reservation.hotel_id]
                              ? `${hotelDetails[reservation.hotel_id].name}`
                              : `Reservation #${reservation.id.slice(-8)}`}
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
                          
                          {/* Show hotel and room details for guests */}
                          {user?.role === 'guest' && (
                            <>
                              {hotelDetails[reservation.hotel_id] && (
                                <div>
                                  <span className="font-medium">Location:</span> {hotelDetails[reservation.hotel_id].location.city}, {hotelDetails[reservation.hotel_id].location.country}
                                </div>
                              )}
                              {roomDetails[reservation.room_id] && (
                                <div>
                                  <span className="font-medium">Room Type:</span> {roomDetails[reservation.room_id].type_name || 'Standard Room'}
                                </div>
                              )}
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
                            <span className="font-medium">Total:</span> ${reservation.price.toFixed(2)}
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
                        
                        {/* Guest actions - only show for guests */}
                        {user?.role === 'guest' && (
                          <div className="mt-2">
                            {reservation.status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setError(''); // Clear any previous errors
                                  setSuccess(''); // Clear any previous success messages
                                  createAutomaticPayment(reservation);
                                }}
                                disabled={creatingPayment === reservation.id}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {creatingPayment === reservation.id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                  </>
                                ) : (
                                  'Make Payment'
                                )}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Admin actions - only show for hotel admins and super admins */}
                        {(user?.role === 'hotel_admin' || user?.role === 'super_admin') && (
                          <div className="flex space-x-2">
                            {reservation.status === 'pending' && (
                              <button 
                                onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                                disabled={updatingReservation === reservation.id}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {updatingReservation === reservation.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                    Confirming...
                                  </>
                                ) : (
                                  'Confirm'
                                )}
                              </button>
                            )}
                            {reservation.status !== 'cancelled' && (
                              <button 
                                onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                                disabled={updatingReservation === reservation.id}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {updatingReservation === reservation.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                    Cancelling...
                                  </>
                                ) : (
                                  'Cancel'
                                )}
                              </button>
                            )}
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
