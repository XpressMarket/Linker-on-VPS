// frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh and expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only try to refresh once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        
        // Try to refresh the token
        if (refreshToken) {
          try {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                },
              }
            );
            
            const { access_token, refresh_token } = response.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh token is also invalid - clear everything
            console.log('Token refresh failed, clearing auth data');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            
            // Only redirect if not already on auth pages
            const currentPath = window.location.pathname;
            if (!['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(currentPath)) {
              // Redirect to login with return URL
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
            }
            
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token exists - clear access token
          console.log('No refresh token found, clearing access token');
          localStorage.removeItem('access_token');
          
          // Only redirect if not already on auth pages
          const currentPath = window.location.pathname;
          if (!['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(currentPath)) {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);
