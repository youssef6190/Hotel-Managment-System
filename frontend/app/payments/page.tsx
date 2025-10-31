'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/auth';
import Header from '@/components/Header';

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

interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  payment_method: string;
  payment_status: 'confirmed' | 'cancelled' | 'pending';
  transaction_date: string;
  user_id?: string;
}

export default function PaymentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    reservation_id: '',
    amount: 0,
    payment_method: 'credit_card',
    payment_status: 'pending' as 'confirmed' | 'cancelled' | 'pending'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);

  // Load data for authenticated users - moved before early returns
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'viewer') {
      loadReservations();
      loadPayments();
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
            <svg className="mx-auto h-20 w-20 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Access Required
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            To access the payments page and manage your payment transactions, you need to be logged in as a guest. 
            Please login or create an account to view and manage your payments.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/login"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 block text-center"
            >
              Login to Your Account
            </Link>
            
            <Link 
              href="/register"
              className="w-full border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200 block text-center"
            >
              Create New Account
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Already have an account but still seeing this message?{' '}
              <Link href="/login" className="text-green-600 hover:underline">
                Try logging in again
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const loadReservations = async () => {
    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      let endpoint = '';
      
      // Different endpoints based on user role
      if (user?.role === 'hotel_admin') {
        // Hotel admins see reservations for their assigned hotels only
        const hotelsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/hotels/admin`, {
          headers
        });
        
        if (hotelsResponse.ok) {
          const adminHotels = await hotelsResponse.json();
          
          if (adminHotels.length > 0) {
            const hotelIds = adminHotels.map((hotel: any) => hotel.id);
            endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/reservations/hotels/${hotelIds.join(',')}`;
          }
        }
      } else if (user?.role === 'super_admin') {
        // Super admins see all reservations
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/reservations/`;
      } else {
        // Regular guests see only their own reservations
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/reservations/user/${user?.id}`;
      }
      
      if (endpoint) {
        const response = await fetch(endpoint, { headers });
        
        if (response.ok) {
          const data = await response.json();
          setReservations(data);
        }
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      let endpoint = '';
      
      // Different endpoints based on user role
      if (user?.role === 'super_admin') {
        // Super admins see all payments
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/`;
      } else if (user?.role === 'hotel_admin') {
        // Hotel admins see payments for their managed hotels
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/my-hotel-payments`;
      } else {
        // Regular guests see only their own payments
        endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/my-payments`;
      }
      
      const response = await fetch(endpoint, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to load payments. Status:', response.status, 'Error:', errorData);
        setError(`Failed to load payments: ${errorData?.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      setError('Network error while loading payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      const paymentData = {
        ...formData,
        // For guests, always set status to 'pending', for admins use selected status
        payment_status: user?.role === 'guest' ? 'pending' : formData.payment_status,
        transaction_date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        setSuccess('Payment created successfully!');
        setFormData({
          reservation_id: '',
          amount: 0,
          payment_method: 'credit_card',
          payment_status: 'pending'
        });
        setShowNewPaymentForm(false);
        loadPayments(); // Reload the payments list
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create payment');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error creating payment:', error);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/${paymentId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setSuccess('Payment deleted successfully!');
        loadPayments(); // Reload the payments list
      } else {
        setError('Failed to delete payment');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Error deleting payment:', error);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      setUpdatingPayment(paymentId);
      setError('');
      setSuccess('');
      
      const headers = await authAPI.getAuthHeadersWithRefresh();
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/payments/${paymentId}`,
        {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ payment_status: newStatus })
        }
      );

      if (response.ok) {
        setSuccess(`Payment ${newStatus} successfully!`);
        // Reload payments to reflect the updated status
        loadPayments();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Failed to ${newStatus === 'confirmed' ? 'confirm' : 'cancel'} payment`);
      }
    } catch (error) {
      console.error(`Error updating payment status:`, error);
      setError(`An error occurred while updating the payment status`);
    } finally {
      setUpdatingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-gray-600 mt-1">
                  {user?.role === 'guest' 
                    ? 'View and manage your payment transactions'
                    : 'Manage all payment transactions in the system'
                  }
                </p>
              </div>
              
              {(user?.role === 'guest' || user?.role === 'hotel_admin' || user?.role === 'super_admin') && (
                <button
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    // Reset form data and ensure proper initial state based on user role
                    setFormData({
                      reservation_id: '',
                      amount: 0,
                      payment_method: 'credit_card',
                      payment_status: user?.role === 'guest' ? 'pending' : 'pending'
                    });
                    setShowNewPaymentForm(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + New Payment
                </button>
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* New Payment Form */}
          {showNewPaymentForm && (
            <div className="border-b border-gray-200 bg-gray-50 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Payment</h3>
              
              <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'guest' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reservation
                  </label>
                  <select
                    value={formData.reservation_id}
                    onChange={(e) => {
                      const selectedReservationId = e.target.value;
                      const selectedReservation = reservations.find(r => r.id === selectedReservationId);
                      setFormData({
                        ...formData, 
                        reservation_id: selectedReservationId,
                        amount: selectedReservation ? selectedReservation.price : 0
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    required
                  >
                    <option value="" className="text-gray-500">Select Reservation</option>
                    {reservations.map((reservation) => (
                      <option key={reservation.id} value={reservation.id}>
                        Reservation #{reservation.id.slice(-8)} - {formatCurrency(reservation.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($) - Auto-calculated
                  </label>
                  <input
                    type="text"
                    value={formData.amount > 0 ? formatCurrency(formData.amount) : 'Select a reservation first'}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                    required
                  />
                  {formData.amount === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Amount will be set based on selected reservation</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    required
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                {/* Status field - Only visible for hotel_admin and super_admin */}
                {(user?.role === 'hotel_admin' || user?.role === 'super_admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.payment_status}
                      onChange={(e) => setFormData({...formData, payment_status: e.target.value as 'confirmed' | 'cancelled' | 'pending'})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                {/* For guests, show a read-only status indicator */}
                {user?.role === 'guest' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      value="Pending"
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Guest payments are automatically set to pending</p>
                  </div>
                )}

                <div className={`md:col-span-2 ${user?.role === 'guest' ? 'lg:col-span-3' : 'lg:col-span-4'} flex gap-3`}>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Create Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPaymentForm(false)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payments List */}
          <div className="p-6">
            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === 'guest' 
                    ? 'You haven\'t made any payments yet.'
                    : 'No payments have been recorded in the system yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reservation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Date
                      </th>
                      {(user?.role === 'super_admin' || user?.role === 'hotel_admin') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{payment.id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{payment.reservation_id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.payment_status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.transaction_date).toLocaleDateString()}
                        </td>
                        {(user?.role === 'super_admin' || user?.role === 'hotel_admin') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {/* Confirm button - only show for pending payments */}
                              {payment.payment_status === 'pending' && (
                                <button
                                  onClick={() => updatePaymentStatus(payment.id, 'confirmed')}
                                  disabled={updatingPayment === payment.id}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                  {updatingPayment === payment.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                      Confirming...
                                    </>
                                  ) : (
                                    'Confirm'
                                  )}
                                </button>
                              )}
                              
                              {/* Cancel button - only show for non-cancelled payments */}
                              {payment.payment_status !== 'cancelled' && (
                                <button
                                  onClick={() => updatePaymentStatus(payment.id, 'cancelled')}
                                  disabled={updatingPayment === payment.id}
                                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                  {updatingPayment === payment.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                      Cancelling...
                                    </>
                                  ) : (
                                    'Cancel'
                                  )}
                                </button>
                              )}
                              
                              {/* Delete button */}
                              <button
                                onClick={() => handleDelete(payment.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
