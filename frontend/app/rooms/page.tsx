'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { Hotel, HotelAPI } from '@/lib/hotel';
import { Room, RoomAPI } from '@/lib/room';
import { useAuth } from '@/contexts/AuthContext';
import { 
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
  Search,
  Building
} from 'lucide-react';

interface RoomWithHotel extends Room {
  hotel?: Hotel;
}

interface RoomFilters {
  hotelId: string;
  type: string;
  minPrice: number | null;
  maxPrice: number | null;
  maxOccupancy: number | null;
  city: string;
}

export default function RoomsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [rooms, setRooms] = useState<RoomWithHotel[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'room_number' | 'type' | 'hotel'>('price_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RoomFilters>({
    hotelId: '',
    type: '',
    minPrice: null,
    maxPrice: null,
    maxOccupancy: null,
    city: ''
  });

  useEffect(() => {
    fetchRoomsAndHotels();
  }, []);

  useEffect(() => {
    // Check URL parameters for initial filters
    const hotel_id = searchParams.get('hotel_id');
    const type = searchParams.get('type');
    if (hotel_id || type) {
      setFilters(prev => ({
        ...prev,
        hotelId: hotel_id || '',
        type: type || ''
      }));
      setShowFilters(true);
    }
  }, [searchParams]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [rooms, filters, sortBy, searchQuery]);

  const fetchRoomsAndHotels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch rooms and hotels in parallel
      const [roomsData, hotelsData] = await Promise.all([
        RoomAPI.getAllRooms(),
        HotelAPI.getAllHotels()
      ]);

      // Create a hotel lookup map
      const hotelMap = new Map(hotelsData.map(hotel => [hotel.id, hotel]));

      // Combine rooms with hotel data
      const roomsWithHotels = roomsData.map(room => ({
        ...room,
        hotel: room.hotel_id ? hotelMap.get(room.hotel_id) : undefined
      }));

      setRooms(roomsWithHotels);
      setHotels(hotelsData);
    } catch (err) {
      console.error('Error fetching rooms and hotels:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rooms';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...rooms];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.description.toLowerCase().includes(query) ||
        room.type_name.toLowerCase().includes(query) ||
        room.hotel?.name.toLowerCase().includes(query) ||
        room.hotel?.location.city.toLowerCase().includes(query) ||
        room.hotel?.location.country.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.hotelId) {
      filtered = filtered.filter(room => room.hotel_id === filters.hotelId);
    }

    if (filters.type) {
      filtered = filtered.filter(room => room.type_name === filters.type);
    }

    if (filters.city) {
      filtered = filtered.filter(room => 
        room.hotel?.location.city.toLowerCase().includes(filters.city.toLowerCase())
      );
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
      case 'hotel':
        filtered.sort((a, b) => (a.hotel?.name || '').localeCompare(b.hotel?.name || ''));
        break;
    }

    setFilteredRooms(filtered);
  };

  const clearFilters = () => {
    setFilters({
      hotelId: '',
      type: '',
      minPrice: null,
      maxPrice: null,
      maxOccupancy: null,
      city: ''
    });
    setSearchQuery('');
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

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(
    hotels.map(hotel => hotel.location.city).filter(Boolean)
  )).sort();

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
              <Building className="w-4 h-4 mr-2" />
              View Hotels
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Rooms</h1>
          <p className="text-gray-600">
            Discover and book the perfect room from our collection of hotels worldwide.
          </p>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by room description, type, hotel name, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
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
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="hotel">Hotel Name</option>
                  <option value="type">Room Type</option>
                  <option value="room_number">Room Number</option>
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel
                  </label>
                  <select
                    value={filters.hotelId}
                    onChange={(e) => setFilters({ ...filters, hotelId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Hotels</option>
                    {hotels.map((hotel) => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
                    placeholder="$0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  {/* Hotel info */}
                  {room.hotel && (
                    <div className="mb-3">
                      <Link 
                        href={`/hotels/${room.hotel.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        {room.hotel.name}
                      </Link>
                      <div className="flex items-center text-gray-500 text-xs mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{room.hotel.location.city}, {room.hotel.location.country}</span>
                      </div>
                    </div>
                  )}

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
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/hotels/${room.hotel_id}/rooms`}
                        className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                      >
                        View Hotel
                      </Link>
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        onClick={() => {
                          router.push(`/reservations?hotel_id=${room.hotel_id}&room_id=${room.id}`);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
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
                ? "No rooms are available at the moment." 
                : "No rooms match your current search and filters."}
            </p>
            {(searchQuery || Object.values(filters).some(v => v)) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Search and Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
