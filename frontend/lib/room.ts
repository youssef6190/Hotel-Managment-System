// API utilities for room operations
const API_BASE_URL = 'http://localhost:9000'; // Adjust the base URL as needed

export interface Room {
  id: string;
  room_number: number;
  hotel_id?: string;
  type_name: 'Single' | 'Double' | 'Suite';
  description: string;
  max_occupancy: number;
  price_per_night: number;
}

export class RoomAPI {
  private static getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Public endpoints (no authentication required)
  static async getAllRooms(): Promise<Room[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rooms = await response.json();
      return rooms;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  }

  static async getRoomById(roomId: string): Promise<Room> {
    try {
      if (!roomId || roomId.trim() === '') {
        throw new Error('Room ID is required');
      }
      
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const room = await response.json();
      return room;
    } catch (error) {
      console.error('Error fetching room:', error);
      throw error;
    }
  }

  static async getRoomsByHotel(hotelId: string): Promise<Room[]> {
    try {
      if (!hotelId || hotelId.trim() === '') {
        throw new Error('Hotel ID is required');
      }
      
      const response = await fetch(`${API_BASE_URL}/rooms/hotel/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Hotel not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rooms = await response.json();
      return rooms;
    } catch (error) {
      console.error('Error fetching rooms for hotel:', error);
      throw error;
    }
  }

  static async getRoomsByType(roomType: 'Single' | 'Double' | 'Suite'): Promise<Room[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/type/${roomType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rooms = await response.json();
      return rooms;
    } catch (error) {
      console.error('Error fetching rooms by type:', error);
      throw error;
    }
  }

  static async getRoomsByHotelAndType(
    hotelId: string, 
    roomType?: 'Single' | 'Double' | 'Suite'
  ): Promise<Room[]> {
    try {
      if (!hotelId || hotelId.trim() === '') {
        throw new Error('Hotel ID is required');
      }
      
      const params = new URLSearchParams({ hotel_id: hotelId });
      if (roomType) {
        params.append('room_type', roomType);
      }

      const response = await fetch(`${API_BASE_URL}/rooms/search/by-hotel-and-type?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rooms = await response.json();
      return rooms;
    } catch (error) {
      console.error('Error fetching rooms by hotel and type:', error);
      throw error;
    }
  }

  // Admin endpoints (authentication required)
  static async createRoom(roomData: Omit<Room, 'id'>): Promise<{ message: string; id: string; created_by: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions to create rooms.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  static async updateRoom(roomId: string, roomData: Partial<Omit<Room, 'id'>>): Promise<{ message: string; updated_by: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions to update rooms.');
        }
        if (response.status === 404) {
          throw new Error('Room not found.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }

  static async deleteRoom(roomId: string): Promise<{ message: string; deleted_by: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions to delete rooms.');
        }
        if (response.status === 404) {
          throw new Error('Room not found.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
}
