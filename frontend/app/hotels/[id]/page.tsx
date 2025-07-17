'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import { Hotel, HotelAPI } from '@/lib/hotel';
import { useAuth } from '@/contexts/AuthContext';

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = params.id as string;
  const { user, isGuest } = useAuth();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [minRoomPrice, setMinRoomPrice] = useState<number | null>(null);

  useEffect(() => {
    if (hotelId) {
      fetchHotel();
    }
  }, [hotelId]);

  const fetchHotel = async () => {
    try {
      console.log('Fetching hotel with ID:', hotelId);
      const data = await HotelAPI.getHotelById(hotelId);
      console.log('Hotel data received:', data);
      setHotel(data);
      
      // Fetch minimum room price to show starting price
      await fetchMinRoomPrice(hotelId);
    } catch (err) {
      console.error('Error fetching hotel:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load hotel';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMinRoomPrice = async (hotelId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/rooms/hotel/${hotelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const rooms = await response.json();
        if (rooms && rooms.length > 0) {
          const prices = rooms.map((room: any) => room.price_per_night).filter((price: any) => price != null);
          if (prices.length > 0) {
            setMinRoomPrice(Math.min(...prices));
          }
        }
      }
    } catch (err) {
      console.log('Could not fetch room prices:', err);
    }
  };

  const nextImage = () => {
    const availableImages = getAvailableImages();
    if (availableImages.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === availableImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    const availableImages = getAvailableImages();
    if (availableImages.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? availableImages.length - 1 : prev - 1
      );
    }
  };

  // Get available images for the hotel
  const getAvailableImages = (): string[] => {
    if (hotel?.gallery && hotel.gallery.length > 0) {
      // Filter out any invalid, empty, or broken image URLs
      return hotel.gallery.filter(img => 
        img && 
        img.trim() !== '' && 
        !img.includes('placeholder') && 
        !brokenImages.has(img)
      );
    }
    // Fallback to available hotel images, filtering out any that might be placeholders or broken
    const fallbackImages = [
      '/hotel_image.jpg',
      '/hotel_image_1.jpg', 
      '/hotel_image_2.jpg',
      '/hotel_image_3.jpg',
      '/hotel_image_4.jpg'
    ];
    return fallbackImages.filter(img => 
      img && 
      img.trim() !== '' && 
      !brokenImages.has(img)
    );
  };

  const handleImageError = (imageSrc: string) => {
    setBrokenImages(prev => new Set(prev).add(imageSrc));
    // If current image is broken, move to next available image
    const availableImages = getAvailableImages();
    if (availableImages.length > 0 && currentImageIndex >= availableImages.length) {
      setCurrentImageIndex(0);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const shareHotel = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hotel?.name,
          text: `Check out ${hotel?.name} in ${hotel?.location.city}, ${hotel?.location.country}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const openFullscreen = () => {
    setIsFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isFullscreenOpen) {
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Hotel Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'The hotel you are looking for does not exist or may have been removed.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/hotels"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Hotels
              </Link>
              <Link
                href="/"
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/hotels" className="ml-4 text-gray-400 hover:text-gray-500 transition-colors">
                  Hotels
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-gray-500 font-medium">{hotel.name}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Hotel Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
              <div className="flex items-center text-gray-600 mb-2">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{hotel.location.city}, {hotel.location.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="flex text-orange-400">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className={`h-5 w-5 ${
                        i < Math.floor(hotel.rating || 0) ? 'fill-current' : 'fill-none stroke-current'
                      }`} 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  ({hotel.rating?.toFixed(1) || 'N/A'}) · {hotel.review_count || 0} reviews
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className={`h-6 w-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={shareHotel}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative w-full rounded-lg overflow-hidden bg-gray-200 cursor-pointer group" style={{ aspectRatio: '16/9', minHeight: '400px', maxHeight: '600px' }} onClick={openFullscreen}>
            {(() => {
              const availableImages = getAvailableImages();
              if (availableImages.length === 0) {
                return (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center text-gray-500">
                      <svg className="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No images available</p>
                    </div>
                  </div>
                );
              }
              
              const currentImage = availableImages[currentImageIndex] || availableImages[0];
              
              return (
                <Image
                  src={currentImage}
                  alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  onError={() => handleImageError(currentImage)}
                />
              );
            })()}
            
            {/* Fullscreen icon overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>View Fullscreen</span>
            </div>
            
            {(() => {
              const availableImages = getAvailableImages();
              return availableImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
                  >
                    <svg className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
                  >
                    <svg className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {availableImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {availableImages.length}
                  </div>
                </>
              );
            })()}
          </div>
          
          {/* Thumbnail strip for multiple images */}
          {(() => {
            const availableImages = getAvailableImages();
            return availableImages.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {availableImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                      index === currentImageIndex ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${hotel.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 80px, 96px"
                      onError={() => handleImageError(image)}
                    />
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amenities */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hotel Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(hotel.amenities).map(([key, value]) => {
                  if (key === 'pool_count') {
                    const poolCount = value as number;
                    return poolCount > 0 ? (
                      <div key={key} className="flex items-center space-x-3 text-gray-700 p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">{poolCount}</span>
                        </div>
                        <span className="text-sm font-medium">Pool{poolCount > 1 ? 's' : ''}</span>
                      </div>
                    ) : null;
                  }
                  
                  if (value === true) {
                    const amenityLabels: Record<string, string> = {
                      wifi: 'Free WiFi',
                      gym: 'Fitness Center',
                      spa: 'Spa & Wellness',
                      parking: 'Free Parking'
                    };
                    
                    const amenityIcons: Record<string, string> = {
                      wifi: '📶',
                      gym: '🏋️',
                      spa: '🧘',
                      parking: '🚗'
                    };
                    
                    return (
                      <div key={key} className="flex items-center space-x-3 text-gray-700 p-3 bg-green-50 rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">{amenityIcons[key] || '✓'}</span>
                        </div>
                        <span className="text-sm font-medium">{amenityLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      </div>
                    );
                  }
                  return null;
                })}
                
                {/* Show message if no amenities are available */}
                {Object.entries(hotel.amenities).every(([key, value]) => 
                  key === 'pool_count' ? value === 0 : value === false
                ) && (
                  <div className="col-span-full text-center text-gray-500 py-4">
                    <p>No amenities information available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
              <div className="flex items-center space-x-3 text-gray-700">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg font-medium">{hotel.working_hours}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href={`tel:${hotel.contact_info.phone}`} className="hover:text-orange-600 transition-colors font-medium">
                    {hotel.contact_info.phone}
                  </a>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <a href={`mailto:${hotel.contact_info.email}`} className="hover:text-orange-600 transition-colors font-medium">
                    {hotel.contact_info.email}
                  </a>
                </div>
                {hotel.contact_info.website && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                      </svg>
                    </div>
                    <a 
                      href={hotel.contact_info.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-orange-600 transition-colors font-medium"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Your Stay</h3>
              
              {/* Pricing Display */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-orange-600">
                    {minRoomPrice 
                      ? `From $${minRoomPrice}` 
                      : 'Contact for Price'
                    }
                  </span>
                  {minRoomPrice && (
                    <span className="text-gray-600 ml-1">/night</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {minRoomPrice 
                    ? 'Starting price - varies by room type' 
                    : 'Price varies by room type and availability'
                  }
                </p>
              </div>
              
              {/* Hotel Info */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Max guests per day:</span>
                  <span className="font-medium text-gray-900">{hotel.max_reservations_per_day}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tax Number:</span>
                  <span className="font-medium text-gray-900">{hotel.tax_number}</span>
                </div>
              </div>

              {/* All users are automatically upgraded to GUEST on login */}
              
              {/* CTA Buttons */}
              <div className="space-y-3">
                {/* Book Now button - enabled only for GUEST, HOTEL_ADMIN and SUPER_ADMIN */}
                {user && (user.role === 'guest' || user.role === 'hotel_admin' || user.role === 'super_admin') ? (
                  <Link
                    href={`/hotels/${hotel.id}/rooms`}
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Now
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed flex items-center justify-center"
                    onClick={() => alert('Please log in to book a room')}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Now
                  </button>
                )}
                <Link
                  href={`/hotels/${hotel.id}/rooms`}
                  className="w-full border border-orange-600 text-orange-600 py-3 px-4 rounded-lg font-medium hover:bg-orange-50 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  View Rooms
                </Link>
              </div>

              {/* Quick Contact */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Need Help?</h4>
                <div className="space-y-2">
                  <a
                    href={`tel:${hotel.contact_info.phone}`}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Call Hotel</span>
                  </a>
                  <a
                    href={`mailto:${hotel.contact_info.email}`}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Send Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image container */}
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {(() => {
                const availableImages = getAvailableImages();
                if (availableImages.length === 0) {
                  return (
                    <div className="text-center text-white">
                      <svg className="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>No images available</p>
                    </div>
                  );
                }
                
                const currentImage = availableImages[currentImageIndex] || availableImages[0];
                
                return (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentImage}
                      alt={`${hotel?.name} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                      priority
                      sizes="100vw"
                      onError={() => handleImageError(currentImage)}
                    />
                  </div>
                );
              })()}

              {/* Navigation buttons */}
              {(() => {
                const availableImages = getAvailableImages();
                return availableImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-3 transition-all duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                );
              })()}

              {/* Image counter */}
              {(() => {
                const availableImages = getAvailableImages();
                return (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {availableImages.length}
                  </div>
                );
              })()}

              {/* Image dots */}
              {(() => {
                const availableImages = getAvailableImages();
                return availableImages.length > 1 && (
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {availableImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                        }`}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
