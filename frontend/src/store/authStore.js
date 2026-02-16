import { create } from 'zustand';
import { authAPI } from '../api/auth.api';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  profile: JSON.parse(localStorage.getItem('profile')) || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  signup: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.signup(data);
      toast.success('Account created successfully! Please login.');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(credentials);
      
      // Store everything in localStorage
      localStorage.setItem('token', response.session.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('profile', JSON.stringify(response.profile));
      
      set({
        user: response.user,
        profile: response.profile,
        isAuthenticated: true,
      });
      
      toast.success('Login successful!');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
      
      // Clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      
      set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false 
      });
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuth: async () => {
    try {
      const response = await authAPI.checkAuth();
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('profile', JSON.stringify(response.profile));
      
      set({
        user: response.user,
        profile: response.profile,
        isAuthenticated: true,
      });
      
      return response;
    } catch (error) {
      // Clear everything if check fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profile');
      
      set({ 
        user: null, 
        profile: null, 
        isAuthenticated: false 
      });
      
      throw error;
    }
  },

  updateProfile: async (profilePic) => {
    try {
      const updatedProfile = await authAPI.updateProfile(profilePic);
      
      // Update localStorage
      localStorage.setItem('profile', JSON.stringify(updatedProfile));
      
      set({ profile: updatedProfile });
      toast.success('Profile updated successfully');
      
      return updatedProfile;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  },

  // Force update state from localStorage (used after OAuth callback)
  syncFromLocalStorage: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const profile = localStorage.getItem('profile');

    if (token && user && profile) {
      set({
        user: JSON.parse(user),
        profile: JSON.parse(profile),
        isAuthenticated: true,
      });
    }
  },
}));