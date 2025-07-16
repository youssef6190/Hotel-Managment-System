// API utilities for hotel operations
const API_BASE_URL = 'http://localhost:8000'; // Adjust the base URL as needed

export interface Hotel {
  id: string;  // MongoDB's auto-generated _id (serialized as string) - now required
  name: string;
  contact_info: {
    phone: string;
    email: string;
    website?: string;
  };
  location: {
    country: string;
    city: string;
  };
  gallery?: string[];
  amenities: {
    gym: boolean;
    spa: boolean;
    wifi: boolean;
    parking: boolean;
    pool_count: number;
  };
  working_hours: string;
  max_reservations_per_day: number;
  tax_number: string;
  admin_id?: string; // ID of the hotel admin who manages this hotel
  rating?: number; // Hotel rating from 1.0 to 5.0
  review_count?: number; // Number of reviews for this hotel
}

export class HotelAPI {
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Public endpoints (no authentication required)
  static async getAllHotels(): Promise<Hotel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hotels = await response.json();
      return hotels;
    } catch (error) {
      console.error('Error fetching hotels:', error);
      throw error;
    }
  }

  // Get hotels for admin panel - role-based filtering
  static async getHotelsForAdmin(): Promise<Hotel[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/admin`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions for admin hotel access.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hotels = await response.json();
      return hotels;
    } catch (error) {
      console.error('Error fetching admin hotels:', error);
      throw error;
    }
  }

  static async getHotelById(hotelId: string): Promise<Hotel> {
    try {
      console.log('Fetching hotel with ID:', hotelId); // Debug log
      
      // Validate hotel ID format (should be MongoDB ObjectId format)
      if (!hotelId || hotelId.trim() === '') {
        throw new Error('Hotel ID is required');
      }
      
      // Check if it looks like a MongoDB ObjectId (24 hex characters)
      const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdPattern.test(hotelId)) {
        console.warn('Hotel ID does not match MongoDB ObjectId format:', hotelId);
      }

      const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText); // Debug log
        
        if (response.status === 404) {
          throw new Error(`Hotel with ID "${hotelId}" not found`);
        } else if (response.status === 400) {
          throw new Error(`Invalid hotel ID format: "${hotelId}". Please check the ID and try again.`);
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      }

      const hotel = await response.json();
      console.log('Hotel data received:', hotel); // Debug log
      return hotel;
    } catch (error) {
      console.error('Error fetching hotel:', error);
      throw error;
    }
  }

  // Protected endpoints (authentication required)
  static async createHotel(hotelData: Omit<Hotel, 'id'>): Promise<{ message: string; id: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hotelData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating hotel:', error);
      throw error;
    }
  }

  static async updateHotel(hotelId: string, hotelData: Partial<Hotel>): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(hotelData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating hotel:', error);
      throw error;
    }
  }

  static async deleteHotel(hotelId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      throw error;
    }
  }

  // Search hotels by destination (name, country, or city)
  static async searchHotels(params: {
    name?: string;
    country?: string;
    city?: string;
    destination?: string; // Combined search for destination field
  }): Promise<Hotel[]> {
    try {
      const searchParams = new URLSearchParams();
      
      // Use the improved destination search
      if (params.destination && params.destination.trim()) {
        searchParams.append('destination', params.destination.trim());
      }
      
      // Individual field searches (these take priority over destination)
      if (params.name && params.name.trim()) {
        searchParams.append('name', params.name.trim());
      }
      if (params.country && params.country.trim()) {
        searchParams.append('country', params.country.trim());
      }
      if (params.city && params.city.trim()) {
        searchParams.append('city', params.city.trim());
      }

      console.log('Search URL:', `${API_BASE_URL}/hotels/search/?${searchParams.toString()}`);

      const response = await fetch(`${API_BASE_URL}/hotels/search/?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hotels = await response.json();
      console.log('API Response:', hotels);
      return hotels;
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  }
}
