'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  upgradeToGuest: () => Promise<{message: string, new_role: string, access_token: string}>;
  isGuest: boolean; // Helper to check if user is a GUEST
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const isAuthenticated = !!user;

  // Initialize authentication on first load
  useEffect(() => {
    if (!initialized) {
      checkAuthStatus();
      setInitialized(true);
    }
  }, [initialized]);

  // Set up periodic token refresh
  useEffect(() => {
    if (!initialized) return;
    
    // Set up periodic token refresh (every minute)
    const refreshInterval = setInterval(() => {
      if (authAPI.isAuthenticated() && authAPI.shouldRefreshToken()) {
        authAPI.refreshToken()
          .then(() => {
            console.log('Token refreshed successfully');
            // If user is set but token was refreshed, we should verify user data
            if (user) {
              authAPI.getCurrentUser()
                .then(updatedUser => {
                  // Only update if there's a change to avoid unnecessary renders
                  if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
                    setUser(updatedUser);
                  }
                })
                .catch(error => {
                  console.error('Failed to get user after token refresh:', error);
                  // If we can't get user data, token might be invalid
                  authAPI.logout();
                  setUser(null);
                });
            }
          })
          .catch(error => {
            console.error('Error refreshing token:', error);
            // On refresh error, check if we're still authenticated
            if (!authAPI.isAuthenticated()) {
              setUser(null);
            }
          });
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [user, initialized]);

  const checkAuthStatus = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        // Try to get current user data
        try {
          // If token needs to be refreshed, refresh it before getting user data
          if (authAPI.shouldRefreshToken()) {
            try {
              await authAPI.refreshToken();
              console.log('Token refreshed successfully during initialization');
            } catch (refreshError) {
              console.error('Token refresh failed during initialization:', refreshError);
              // Only logout if we're sure token is invalid
              if (!authAPI.isAuthenticated()) {
                authAPI.logout();
                setUser(null);
                setIsLoading(false);
                return;
              }
            }
          }
          
          // Get current user with authenticated request (with retry mechanism)
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (userError) {
          console.error('Failed to get user data despite having a token:', userError);
          // If we can't get the user data even though we have a token,
          // it might be because the token is rejected by the server
          authAPI.logout();
          setUser(null);
        }
      } else {
        // No valid token
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed with error:', error);
      // Token might be invalid, clear it
      authAPI.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const tokenData = await authAPI.login({ email, password });
      
      // Get user data
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (authAPI.isAuthenticated()) {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      logout();
    }
  };
  
  const upgradeToGuest = async () => {
    try {
      const result = await authAPI.upgradeToGuest();
      // Refresh user data to get the updated role
      await refreshUser();
      return result;
    } catch (error) {
      console.error('Failed to upgrade role:', error);
      throw error;
    }
  };
  
  // Determine if the user has the GUEST role
  const isGuest = user?.role === 'guest';

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    upgradeToGuest,
    isGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
