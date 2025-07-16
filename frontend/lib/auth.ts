import tokenUtils from './tokenUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export interface LoginCredentials {
  email: string;
  password: string;
  // upgrade_to_guest option removed as it's now automatic
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

class AuthAPI {
  private async ensureValidToken(): Promise<void> {
    if (tokenUtils.shouldRefreshToken()) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Token refresh failed in ensureValidToken:', error);
      }
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = tokenUtils.getAccessToken();
    const tokenType = tokenUtils.getTokenType();
    
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `${tokenType} ${token}` })
    };
  }
  
  async getAuthHeadersWithRefresh(): Promise<HeadersInit> {
    await this.ensureValidToken();
    return this.getAuthHeaders();
  }

  async login(credentials: LoginCredentials): Promise<AuthToken & {role_upgraded?: boolean, new_role?: string, message?: string}> {
    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const authData = await response.json();
    
    // Store token using tokenUtils
    tokenUtils.setTokens(authData.access_token, authData.token_type || 'bearer', 30);

    return authData;
  }

  async getCurrentUser(retryCount = 1): Promise<User> {
    try {
      // Ensure token is valid before making the request
      const headers = await this.getAuthHeadersWithRefresh();
      
      console.log('Fetching current user from:', `${API_BASE_URL}/users/me`);
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        console.error('getCurrentUser failed with status:', response.status);
        // If unauthorized and we have retries left, refresh token and try again
        if (response.status === 401 && retryCount > 0) {
          console.log('Unauthorized when getting user, refreshing token and retrying...');
          try {
            await this.refreshToken();
            return this.getCurrentUser(retryCount - 1);
          } catch (refreshError) {
            console.error('Token refresh failed during retry:', refreshError);
            throw new Error('Authentication failed. Please log in again.');
          }
        }
        
        let errorMessage = 'Failed to get user data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      console.log('Successfully retrieved user data:', userData);
      return userData;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      
      throw error;
    }
  }

  async refreshToken(): Promise<AuthToken> {
    try {
      // Get current token for refresh request
      const token = tokenUtils.getAccessToken();
      if (!token) {
        throw new Error('No token available for refresh');
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear tokens if the server explicitly rejects our refresh attempt
          tokenUtils.clearTokens();
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to refresh token');
      }

      const tokenData = await response.json();
      
      // Update stored tokens and expiration using tokenUtils
      tokenUtils.setTokens(tokenData.access_token, tokenData.token_type || 'bearer', 30);
      
      return tokenData;
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw error;
    }
  }

  logout(): void {
    tokenUtils.clearTokens();
  }

  isAuthenticated(): boolean {
    return tokenUtils.isAuthenticated();
  }
  
  // Method to check token expiration and refresh if needed
  shouldRefreshToken(): boolean {
    return tokenUtils.shouldRefreshToken();
  }

  getToken(): string | null {
    return tokenUtils.getAccessToken();
  }

  async upgradeToGuest(): Promise<{message: string, new_role: string, access_token: string}> {
    const response = await fetch(`${API_BASE_URL}/auth/upgrade-to-guest`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upgrade role');
    }

    const result = await response.json();
    
    // Update token using tokenUtils if a new one was provided
    if (result.access_token) {
      // Keep the same token type and expiration, just update the token
      const tokenType = tokenUtils.getTokenType() || 'bearer';
      tokenUtils.setTokens(result.access_token, tokenType, 30);
    }

    return result;
  }
}

export const authAPI = new AuthAPI();
