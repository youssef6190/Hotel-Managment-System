/**
 * Utility functions for managing authentication tokens
 */

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  TOKEN_TYPE: 'token_type',
  EXPIRES_AT: 'expires_at'
};

export const tokenUtils = {
  /**
   * Set the authentication token in local storage
   */
  setTokens(accessToken: string, tokenType: string = 'bearer', expiresInMinutes: number = 300): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.TOKEN_TYPE, tokenType);
    
    // Calculate and set expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    localStorage.setItem(TOKEN_KEYS.EXPIRES_AT, expiresAt.toISOString());
  },
  
  /**
   * Clear all authentication tokens from local storage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.TOKEN_TYPE);
    localStorage.removeItem(TOKEN_KEYS.EXPIRES_AT);
  },
  
  /**
   * Get the access token from local storage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },
  
  /**
   * Get the token type from local storage
   */
  getTokenType(): string {
    if (typeof window === 'undefined') return 'bearer';
    return localStorage.getItem(TOKEN_KEYS.TOKEN_TYPE) || 'bearer';
  },
  
  /**
   * Check if the token is expired
   */
  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiresAt = localStorage.getItem(TOKEN_KEYS.EXPIRES_AT);
    if (!expiresAt) return false; // No expiration set, assume valid
    
    const now = new Date();
    const expiration = new Date(expiresAt);
    return now >= expiration;
  },
  
  /**
   * Check if the token should be refreshed (less than 5 minutes left)
   */
  shouldRefreshToken(): boolean {
    if (typeof window === 'undefined') return false;
    
    const expiresAt = localStorage.getItem(TOKEN_KEYS.EXPIRES_AT);
    if (!expiresAt) return false;
    
    const now = new Date();
    const expiration = new Date(expiresAt);
    
    // If token expires in less than 5 minutes, refresh it
    const fiveMinutesBeforeExpiration = new Date(expiration.getTime() - 5 * 60 * 1000);
    return now >= fiveMinutesBeforeExpiration;
  },
  
  /**
   * Check if the user is authenticated (has a non-expired token)
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = this.getAccessToken();
    if (!token) return false;
    
    return !this.isTokenExpired();
  }
};

export default tokenUtils;
