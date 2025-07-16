'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { Hotel, HotelAPI } from '@/lib/hotel';
import { Star, Wifi, Car, Utensils, Waves, Dumbbell, Coffee, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Filters {
  starRating: number[];
  amenities: string[];
}

export default function HotelsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    starRating: [],
    amenities: []
  });

  useEffect(() => {
    // Check if there are search parameters
    const destination = searchParams.get('destination');
    if (destination) {
      setSearchQuery(destination);
      setIsSearchResult(true);
      searchHotels(destination);
    } else {
      fetchHotels();
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [hotels, filters]);

  const searchHotels = async (destination: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Searching for destination:', destination);
      const data = await HotelAPI.searchHotels({ destination });
      console.log('Search results:', data);
      setHotels(data);
      if (data.length === 0) {
        console.log('No hotels found, setting error message');
        setError(`No hotels found for "${destination}". Try a different location.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      const data = await HotelAPI.getAllHotels();
      console.log('Fetched hotels with ratings:', data.map(h => ({ 
        name: h.name, 
        rating: h.rating, 
        review_count: h.review_count 
      })));
      setHotels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = hotels;

    // Price range filter - Since price is per room, we need to filter hotels that have rooms in the price range
    // For now, we'll skip price filtering until we integrate room data
    // TODO: Integrate with room data to filter by price_per_night

    // Star rating filter using actual hotel rating data
    if (filters.starRating.length > 0) {
      filtered = filtered.filter(hotel => {
        // Only filter hotels that have actual ratings from backend
        if (hotel.rating) {
          const hotelRating = Math.floor(hotel.rating);
          return filters.starRating.includes(hotelRating);
        }
        // Skip hotels without real ratings - no dummy data
        return false;
      });
    }

    // Amenity filtering using actual hotel amenities data
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(hotel => {
        return filters.amenities.some(amenity => {
          switch (amenity.toLowerCase()) {
            case 'free wifi':
              return hotel.amenities?.wifi;
            case 'free parking':
              return hotel.amenities?.parking;
            case 'fitness center':
              return hotel.amenities?.gym;
            case 'swimming pool':
              return hotel.amenities?.pool_count > 0;
            case 'restaurant':
              // Note: Restaurant amenity not available in backend data - temporarily mapped to spa
              return hotel.amenities?.spa;
            case 'breakfast included':
              // Note: Breakfast amenity not available in backend data - temporarily mapped to wifi
              return hotel.amenities?.wifi;
            default:
              return false;
          }
        });
      });
    }

    setFilteredHotels(filtered);
    
    // Log active filters for debugging
    console.log('Active filters:', {
      starRating: filters.starRating,
      amenities: filters.amenities,
      resultCount: filtered.length,
      totalHotels: hotels.length
    });
  };

  const handleStarRatingChange = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      starRating: prev.starRating.includes(rating)
        ? prev.starRating.filter(r => r !== rating)
        : [...prev.starRating, rating]
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      starRating: [],
      amenities: []
    });
  };

  // Remove dummy data generation - only use real backend data

  // Get count of hotels for each star rating - only use real backend data
  const getHotelCountByRating = (rating: number) => {
    return hotels.filter(hotel => {
      // Only count hotels with actual ratings from backend
      if (hotel.rating) {
        const hotelRating = Math.floor(hotel.rating);
        return hotelRating === rating;
      }
      // Skip hotels without real ratings
      return false;
    }).length;
  };

  const getStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
        fill={i < rating ? 'currentColor' : 'none'}
      />
    ));
  };

  // Enhanced star rating function for more precise display
  const getAccurateStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return Array.from({ length: 5 }, (_, i) => {
      if (i < fullStars) {
        return (
          <Star
            key={i}
            className="w-4 h-4 text-yellow-400 fill-yellow-400"
            fill="currentColor"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <Star
            key={i}
            className="w-4 h-4 text-yellow-400"
            fill="url(#halfStar)"
          />
        );
      } else {
        return (
          <Star
            key={i}
            className="w-4 h-4 text-gray-300"
            fill="none"
          />
        );
      }
    });
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'free wifi':
        return <Wifi className="w-4 h-4 text-gray-600" />;
      case 'parking':
      case 'free parking':
        return <Car className="w-4 h-4 text-gray-600" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-gray-600" />;
      case 'swimming pool':
      case 'pool':
        return <Waves className="w-4 h-4 text-gray-600" />;
      case 'fitness center':
      case 'gym':
        return <Dumbbell className="w-4 h-4 text-gray-600" />;
      case 'breakfast included':
        return <Coffee className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* All users are automatically upgraded to GUEST on login */}
        
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All
              </button>
            </div>
            
            {/* Active Filters Count */}
            {(filters.starRating.length > 0 || filters.amenities.length > 0) && (
              <div className="mb-6 p-3.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-sm text-blue-700 font-medium">
                      {filters.starRating.length + filters.amenities.length} filter(s) active
                    </span>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            
            {/* Star Rating */}
            <div className="mb-8 pb-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-5 h-5 mr-2 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                Star Rating
              </h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating} className={`flex items-center cursor-pointer group p-2.5 rounded-lg transition-all duration-200 ${
                    filters.starRating.includes(rating) 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                        checked={filters.starRating.includes(rating)}
                        onChange={() => handleStarRatingChange(rating)}
                      />
                      {filters.starRating.includes(rating) && (
                        <div className="absolute inset-0 bg-blue-600 rounded animate-pulse opacity-20"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="flex">
                        {getStarRating(rating)}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        filters.starRating.includes(rating) ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>{rating} Star{rating > 1 ? 's' : ''}</span>
                      <span className="ml-auto text-xs text-gray-500">({getHotelCountByRating(rating)})</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-5 h-5 mr-2 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                Amenities
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Free WiFi', icon: 'wifi', popular: true },
                  { name: 'Free Parking', icon: 'parking', popular: true },
                  { name: 'Restaurant', icon: 'restaurant', popular: false },
                  { name: 'Swimming Pool', icon: 'pool', popular: true },
                  { name: 'Fitness Center', icon: 'gym', popular: false },
                  { name: 'Breakfast Included', icon: 'breakfast', popular: false }
                ].map((amenity) => (
                  <label key={amenity.name} className={`flex items-center cursor-pointer group p-2.5 rounded-lg transition-all duration-200 ${
                    filters.amenities.includes(amenity.name) 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                        checked={filters.amenities.includes(amenity.name)}
                        onChange={() => handleAmenityChange(amenity.name)}
                      />
                      {filters.amenities.includes(amenity.name) && (
                        <div className="absolute inset-0 bg-blue-600 rounded animate-pulse opacity-20"></div>
                      )}
                    </div>
                    <div className="flex items-center flex-1">
                      <div className={`p-1.5 rounded-md ${
                        filters.amenities.includes(amenity.name) 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100 group-hover:bg-blue-50'
                      } transition-colors duration-200`}>
                        {getAmenityIcon(amenity.name)}
                      </div>
                      <span className={`ml-3 text-sm font-medium flex-1 ${
                        filters.amenities.includes(amenity.name) ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>{amenity.name}</span>
                      {amenity.popular && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Popular</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">
                  {isSearchResult ? `Hotels in ${searchQuery}` : 'Stay Serene Retreats'}
                </h1>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {isSearchResult ? 'Search results' : 'Showing results'}
                  </div>
                </div>
              </div>
              {isSearchResult && (
                <div className="mt-2">
                  <p className="text-gray-600">
                    Search results for "<span className="font-semibold">{searchQuery}</span>"
                  </p>
                  <button
                    onClick={() => {
                      setIsSearchResult(false);
                      setSearchQuery('');
                      setError(null); // Clear any error messages
                      fetchHotels();
                      window.history.pushState({}, '', '/hotels');
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    Clear search and show all hotels
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600">
                    <span className="font-semibold text-blue-600">{filteredHotels.length}</span> {filteredHotels.length === 1 ? 'property' : 'properties'} found
                    {(filters.starRating.length > 0 || filters.amenities.length > 0) && (
                      <span className="ml-2 text-sm">
                        with current filters
                      </span>
                    )}
                  </p>
                </div>
                {(filters.starRating.length > 0 || filters.amenities.length > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium hover:underline transition-colors duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
            
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-4">
                {error}
              </div>
            )}
          
            {!isLoading && !error && (
              <div className="space-y-6">
                {filteredHotels.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      {isSearchResult ? `No hotels found for "${searchQuery}"` : 'No hotels found'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {isSearchResult 
                        ? 'Try searching for a different location or check your spelling.' 
                        : 'Try adjusting your filters to see more results.'}
                    </p>
                    {isSearchResult ? (
                      <button
                        onClick={() => {
                          setIsSearchResult(false);
                          setSearchQuery('');
                          setError(null);
                          fetchHotels();
                          window.history.pushState({}, '', '/hotels');
                        }}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Show all hotels
                      </button>
                    ) : (
                      <button
                        onClick={clearAllFilters}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Reset all filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredHotels.map((hotel, index) => {
                    // Get hotel image - use first from gallery or fallback to available images
                    const getHotelImage = () => {
                      if (hotel.gallery && hotel.gallery.length > 0) {
                        return hotel.gallery[0];
                      }
                      // Use available hotel images in rotation
                      const availableImages = [
                        '/hotel_image.jpg',
                        '/hotel_image_1.jpg', 
                        '/home_page_image.jpg'
                      ];
                      return availableImages[index % availableImages.length];
                    };

                    return (
                      <div key={hotel.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                        <div className="flex">
                          {/* Hotel Image */}
                          <div className="relative w-80 h-64 flex-shrink-0">
                            <Image
                              src={getHotelImage()}
                              alt={`${hotel.name} - Hotel Image`}
                              fill
                              className="object-cover"
                              sizes="320px"
                            />
                          </div>
                          
                          {/* Hotel Details */}
                          <div className="flex-1 p-6">
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  {hotel.name}
                                </h3>
                                
                                <div className="flex items-center text-gray-600 mb-2">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  <span className="text-sm">{hotel.location.city}, {hotel.location.country}</span>
                                </div>

                                {/* Rating Display - Only show if available from backend */}
                                {hotel.rating && hotel.review_count && (
                                  <div className="flex items-center mb-2">
                                    <div className="flex items-center">
                                      {getAccurateStarRating(hotel.rating)}
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 font-medium">
                                      {hotel.rating.toFixed(1)} ({hotel.review_count} reviews)
                                    </span>
                                  </div>
                                )}

                                {/* Amenities */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                  {hotel.amenities.wifi && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Wifi className="w-4 h-4 mr-1" />
                                      <span>Free WiFi</span>
                                    </div>
                                  )}
                                  {hotel.amenities.parking && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Car className="w-4 h-4 mr-1" />
                                      <span>Free Parking</span>
                                    </div>
                                  )}
                                  {hotel.amenities.gym && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Utensils className="w-4 h-4 mr-1" />
                                      <span>Restaurant</span>
                                    </div>
                                  )}
                                  {hotel.amenities.pool_count > 0 && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Waves className="w-4 h-4 mr-1" />
                                      <span>Swimming Pool</span>
                                    </div>
                                  )}
                                  <span className="text-sm text-blue-600 cursor-pointer">+1 more</span>
                                </div>
                              </div>

                              {/* Price and CTA */}
                              <div className="flex flex-col items-end justify-between ml-6">
                                <div className="text-right">
                                  <div className="text-lg font-medium text-gray-900">
                                    Contact for Pricing
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {hotel.contact_info.phone}
                                  </div>
                                </div>
                                
                                <Link 
                                  href={`/hotels/${hotel.id}`}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                  View Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
