'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { HotelAPI, Hotel } from '@/lib/hotel';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [searchData, setSearchData] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: '2'
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.destination.trim()) {
      alert('Please enter a destination to search');
      return;
    }

    // Create URL search parameters
    const params = new URLSearchParams();
    params.set('destination', searchData.destination.trim());
    if (searchData.checkIn) params.set('checkIn', searchData.checkIn);
    if (searchData.checkOut) params.set('checkOut', searchData.checkOut);
    if (searchData.guests) params.set('guests', searchData.guests);

    // Redirect to hotels page with search parameters
    router.push(`/hotels?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section with Background */}
        <div 
          className="relative h-screen bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/home_page_image.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Fallback gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 -z-10"></div>
          
          {/* Hero Content */}
          <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-4">
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-orange-500 text-white">
                🌟 World's Leading Travel Platform
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
              Find Your Perfect
              <br />
              <span className="text-blue-400">Hotel Experience</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl">
              Discover amazing hotels worldwide with the best prices, verified reviews,
              and instant booking confirmation.
            </p>
            
            {/* Search Form */}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row">
                {/* Location */}
                <div className="flex-1 border-r border-gray-200 p-4 md:p-6">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    LOCATION
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      name="destination"
                      value={searchData.destination}
                      onChange={handleSearchChange}
                      placeholder="Dubai, UAE"
                      className="w-full text-lg font-semibold text-gray-900 border-none outline-none focus:ring-0 p-0 placeholder-gray-800"
                    />
                    <svg className="w-6 h-6 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Check In */}
                <div className="flex-1 border-r border-gray-200 p-4 md:p-6">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    CHECK IN
                  </label>
                  <input
                    type="date"
                    name="checkIn"
                    value={searchData.checkIn}
                    onChange={handleSearchChange}
                    placeholder="mm/dd/yyyy"
                    className="w-full text-lg font-semibold text-gray-900 border-none outline-none focus:ring-0 p-0"
                  />
                </div>
                
                {/* Check Out */}
                <div className="flex-1 border-r border-gray-200 p-4 md:p-6">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    CHECK OUT
                  </label>
                  <input
                    type="date"
                    name="checkOut"
                    value={searchData.checkOut}
                    onChange={handleSearchChange}
                    placeholder="mm/dd/yyyy"
                    className="w-full text-lg font-semibold text-gray-900 border-none outline-none focus:ring-0 p-0"
                  />
                </div>
                
                {/* Guests */}
                <div className="flex-1 p-4 md:p-6">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    PERSON
                  </label>
                  <select
                    name="guests"
                    value={searchData.guests}
                    onChange={handleSearchChange}
                    className="w-full text-lg font-semibold text-gray-900 border-none outline-none focus:ring-0 p-0 bg-transparent"
                  >
                    <option value="1">1 Adult</option>
                    <option value="2">2 Adults</option>
                    <option value="3">3 Adults</option>
                    <option value="4">4 Adults</option>
                    <option value="5">5+ Adults</option>
                  </select>
                </div>
                
        {/* Search Button */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500">
          <button
            type="submit"
            onClick={handleSearch}
            className="w-full h-full px-8 py-6 text-white font-bold text-lg tracking-wide hover:from-orange-600 hover:to-red-600 transition duration-300 transform hover:scale-105"
          >
            SEARCH
          </button>
        </div>
              </form>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why choose Travio?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We make hotel booking simple, secure, and rewarding
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Booking</h3>
                <p className="text-gray-600">
                  Simple and secure booking process with instant confirmation.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Prices</h3>
                <p className="text-gray-600">
                  Competitive rates and exclusive deals for our members.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Assured</h3>
                <p className="text-gray-600">
                  Handpicked accommodations that meet our high standards.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-gray-600">
                  Round-the-clock customer support for any assistance you need.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Section - Show for authenticated users */}
        {isAuthenticated && (
          <div className="py-16 bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Access your account features and manage your travel plans
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Dashboard */}
                <Link href="/dashboard" className="block">
                  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Dashboard</h3>
                    <p className="text-gray-600">
                      View your account overview and manage your profile
                    </p>
                  </div>
                </Link>

                {/* Reservations - Show for all authenticated users */}
                <Link href="/reservations" className="block">
                  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">My Reservations</h3>
                    <p className="text-gray-600">
                      Manage your bookings and view reservation history
                    </p>
                  </div>
                </Link>

                {/* Browse Hotels */}
                <Link href="/hotels" className="block">
                  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Browse Hotels</h3>
                    <p className="text-gray-600">
                      Discover and search through our collection of hotels
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stay Updated with Travio
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get exclusive deals, travel tips, and hotel recommendations delivered to your inbox.
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none placeholder-gray-700"
              />
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Image
                    src="/website_icon.jpg"
                    alt="Travio Logo"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <h3 className="text-2xl font-bold text-blue-400">Travio</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Your trusted partner for unforgettable travel experiences worldwide.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition duration-300">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.223.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">About Us</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Careers</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Press</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Blog</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><Link href="/reservations" className="text-gray-300 hover:text-white transition duration-300">My Reservations</Link></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Help Center</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Contact Us</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Safety</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Terms of Service</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Destinations</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Paris</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">New York</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">Tokyo</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition duration-300">London</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400">
                © 2025 Travio. All rights reserved. | Privacy Policy | Terms of Service
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
