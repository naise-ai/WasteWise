// ============================================================
// WasteWise — Auth API Service
// ============================================================
import { apiRequest } from './api';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    canteen_name: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const user: User = {
      id: String(res.user.id),
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
      canteenName: res.user.canteen_name,
    };

    localStorage.setItem('ww-token', res.access_token);
    localStorage.setItem('ww-user', JSON.stringify(user));

    return { token: res.access_token, user };
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('ww-token');
    if (!token) return null;

    try {
      const res = await apiRequest<any>('/api/auth/me');
      return {
        id: String(res.id),
        name: res.name,
        email: res.email,
        role: res.role,
        canteenName: res.canteen_name,
      };
    } catch {
      localStorage.removeItem('ww-token');
      return null;
    }
  },

  logout() {
    localStorage.removeItem('ww-token');
    localStorage.removeItem('ww-user');
  },
};
