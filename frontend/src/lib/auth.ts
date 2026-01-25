
// frontend/src/lib/auth.ts
import { api } from './api';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  is_email_verified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  captcha_token: string;
}

export const authService = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },


  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    const { access_token, refresh_token } = response.data;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    return response.data;
  },

  async logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, new_password: string) {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password,
    });
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};
