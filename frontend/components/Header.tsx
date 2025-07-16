'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-indigo-600">
                <Image
                  src="/website_icon.jpg"
                  alt="Travio Logo"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span>Stay Serene Retreats</span>
              </Link>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-indigo-600">
              <Image
                src="/website_icon.jpg"
                alt="Travio Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span>Travio</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            )}
            <Link href="/hotels" className="text-gray-600 hover:text-gray-900">
              Hotels
            </Link>
            {/* Show reservations link for all users except super_admin */}
            {(!isAuthenticated || user?.role !== 'super_admin') && (
              <Link href="/reservations" className="text-gray-600 hover:text-gray-900">
                Reservations
              </Link>
            )}
            {/* Show payments link for authenticated users */}
            {isAuthenticated && user?.role !== 'viewer' && (
              <Link href="/payments" className="text-gray-600 hover:text-gray-900">
                Payments
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.full_name || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
