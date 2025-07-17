'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { Hotel, HotelAPI } from '@/lib/hotel';
import { Room, RoomAPI } from '@/lib/room';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Users, 
  Bed, 
  Star, 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Dumbbell, 
  Coffee,
  MapPin,
  Calendar,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface RoomFilters {
  type: string;
  minPrice: number | null;
  maxPrice: number | null;
  maxOccupancy: number | null;
}

export default function HotelRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.id as string;
  const { user } = useAuth();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'room_number' | 'type'>('room_number');
  const [filters, setFilters] = useState<RoomFilters>({
    type: '',
    minPrice: null,
    maxPrice: null,
    maxOccupancy: null
  });

  useEffect(() => {
    if (hotelId) {
      fetchHotelAndRooms();
    }
  }, [hotelId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [rooms, filters, sortBy]);

  const fetchHotelAndRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch hotel details and rooms in parallel
      const [hotelData, roomsData] = await Promise.all([
        HotelAPI.getHotelById(hotelId),
        RoomAPI.getRoomsByHotel(hotelId)
      ]);

      setHotel(hotelData);
      setRooms(roomsData);
    } catch (err) {
      console.error('Error fetching hotel and rooms:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load hotel rooms';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...rooms];

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(room => room.type_name === filters.type);
    }

    if (filters.minPrice !== null) {
      filtered = filtered.filter(room => room.price_per_night >= filters.minPrice!);
    }

    if (filters.maxPrice !== null) {
      filtered = filtered.filter(room => room.price_per_night <= filters.maxPrice!);
    }

    if (filters.maxOccupancy !== null) {
      filtered = filtered.filter(room => room.max_occupancy >= filters.maxOccupancy!);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price_per_night - b.price_per_night);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price_per_night - a.price_per_night);
        break;
      case 'room_number':
        filtered.sort((a, b) => a.room_number - b.room_number);
        break;
      case 'type':
        filtered.sort((a, b) => a.type_name.localeCompare(b.type_name));
        break;
    }

    setFilteredRooms(filtered);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minPrice: null,
      maxPrice: null,
      maxOccupancy: null
    });
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'Single':
        return <Bed className="w-5 h-5" />;
      case 'Double':
        return <Bed className="w-5 h-5" />;
      case 'Suite':
        return <Star className="w-5 h-5" />;
      default:
        return <Bed className="w-5 h-5" />;
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'Single':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Double':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Suite':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">{error}</div>
            <Link 
              href="/hotels" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hotels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with hotel info */}
        <div className="mb-8">
          <Link 
            href={`/hotels/${hotelId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotel Details
          </Link>
          
          {hotel && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{hotel.location.city}, {hotel.location.country}</span>
                  </div>
                  {hotel.rating && (
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(hotel.rating!)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {hotel.rating.toFixed(1)} ({hotel.review_count || 0} reviews)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Hotel amenities */}
                <div className="flex items-center gap-4 text-gray-600">
                  {hotel.amenities.wifi && <Wifi className="w-5 h-5" />}
                  {hotel.amenities.parking && <Car className="w-5 h-5" />}
                  {hotel.amenities.pool_count > 0 && <Waves className="w-5 h-5" />}
                  {hotel.amenities.gym && <Dumbbell className="w-5 h-5" />}
                  {hotel.amenities.spa && <Coffee className="w-5 h-5" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and sorting */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-blue-700"
              >
                <Filter className="w-4 h-4 mr-2 text-blue-950" />
                Filters
              </button>
              
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-900 text-gray-900"
                >
                  <option value="room_number">Room Number</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="type">Room Type</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 ">
                    Room Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">All Types</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
                    placeholder="$0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-900 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                    placeholder="$1000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-900 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Guests
                  </label>
                  <input
                    type="number"
                    value={filters.maxOccupancy || ''}
                    onChange={(e) => setFilters({ ...filters, maxOccupancy: e.target.value ? Number(e.target.value) : null })}
                    placeholder="1"
                    min="1"
                    max="10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-900 text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rooms grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Room image placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {getRoomTypeIcon(room.type_name)}
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoomTypeColor(room.type_name)}`}>
                      {room.type_name}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-sm font-medium text-gray-800">
                      Room {room.room_number}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {room.type_name} Room
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="text-sm">{room.max_occupancy} guests</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-blue-600">
                      ${room.price_per_night}
                      <span className="text-sm font-normal text-gray-600">/night</span>
                    </div>
                    
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        // Redirect to booking or room details
                        router.push(`/reservations?hotel_id=${hotelId}&room_id=${room.id}`);
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-4">
              {rooms.length === 0 
                ? "This hotel doesn't have any rooms yet." 
                : "No rooms match your current filters."}
            </p>
            {rooms.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
