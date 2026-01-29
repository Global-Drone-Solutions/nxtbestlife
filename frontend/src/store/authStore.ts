import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, getSupabaseConfig } from '../lib/supabaseClient';

// Custom user type for our app_users table
export interface AppUser {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
  debugLog: string | null;
  setUser: (user: AppUser | null) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  demoLogin: () => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@fittrack_auth_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  debugLog: null,

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),

  // Custom login using app_users table
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null, debugLog: null });
    
    const supabase = getSupabase();
    if (!supabase) {
      set({ isLoading: false, error: 'Supabase not configured' });
      return false;
    }

    const logLines: string[] = [];
    logLines.push(`[Auth] Custom login with app_users table`);
    logLines.push(`  email: ${email}`);

    try {
      console.log('[Auth] Attempting custom login with email:', email);
      
      // Query the app_users table for matching credentials
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, created_at, updated_at')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

      if (error) {
        logLines.push(`[Auth] ERROR:`);
        logLines.push(`  code: ${error.code}`);
        logLines.push(`  message: ${error.message}`);
        
        console.log('[Auth] Login ERROR:', error);
        
        let errorMsg = 'Invalid email or password';
        if (error.code === 'PGRST116') {
          errorMsg = 'Invalid email or password';
        } else {
          errorMsg = error.message;
        }
        
        set({ isLoading: false, error: errorMsg, debugLog: logLines.join('\n') });
        return false;
      }

      if (!data) {
        logLines.push(`[Auth] No user found`);
        set({ isLoading: false, error: 'Invalid email or password', debugLog: logLines.join('\n') });
        return false;
      }

      logLines.push(`[Auth] SUCCESS`);
      logLines.push(`  user_id: ${data.id}`);
      logLines.push(`  email: ${data.email}`);
      console.log('[Auth] Login SUCCESS, user:', data.email);

      const appUser: AppUser = {
        id: data.id,
        email: data.email,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // Save user to AsyncStorage for session persistence
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      
      set({ user: appUser, isLoading: false, debugLog: logLines.join('\n') });
      return true;

    } catch (err: any) {
      logLines.push(`[Auth] EXCEPTION: ${err.message}`);
      console.log('[Auth] Login EXCEPTION:', err);
      set({ isLoading: false, error: `Unexpected error: ${err.message}`, debugLog: logLines.join('\n') });
      return false;
    }
  },

  // Demo login using environment variables
  demoLogin: async () => {
    const config = getSupabaseConfig();
    if (!config.hasDemoCredentials) {
      set({ error: 'Demo credentials not configured. Please set EXPO_PUBLIC_DEMO_EMAIL and EXPO_PUBLIC_DEMO_PASSWORD.' });
      return false;
    }
    
    return get().login(config.demoEmail, config.demoPassword);
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.log('Error removing auth storage:', err);
    }
    set({ user: null });
  },

  checkSession: async () => {
    try {
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser) as AppUser;
        console.log('[Auth] Restored session for user:', user.email);
        set({ user });
      }
    } catch (err) {
      console.log('Error checking session:', err);
    }
  },
}));
