import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, getSupabaseConfig } from '../lib/supabaseClient';

// User type that works with Supabase Auth
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
  signUp: (email: string, password: string) => Promise<boolean>;
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

  // Login using Supabase Auth
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null, debugLog: null });
    
    const supabase = getSupabase();
    if (!supabase) {
      set({ isLoading: false, error: 'Supabase not configured' });
      return false;
    }

    const logLines: string[] = [];
    logLines.push(`[Auth] Login with Supabase Auth`);
    logLines.push(`  email: ${email}`);

    try {
      console.log('[Auth] Attempting Supabase Auth login with email:', email);
      
      // Use Supabase Auth signInWithPassword
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logLines.push(`[Auth] ERROR:`);
        logLines.push(`  code: ${error.message}`);
        
        console.log('[Auth] Login ERROR:', error);
        
        let errorMsg = 'Invalid email or password';
        if (error.message.includes('Invalid login credentials')) {
          errorMsg = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Please confirm your email address';
        } else {
          errorMsg = error.message;
        }
        
        set({ isLoading: false, error: errorMsg, debugLog: logLines.join('\n') });
        return false;
      }

      if (!data.user) {
        logLines.push(`[Auth] No user returned`);
        set({ isLoading: false, error: 'Login failed', debugLog: logLines.join('\n') });
        return false;
      }

      logLines.push(`[Auth] SUCCESS`);
      logLines.push(`  user_id: ${data.user.id}`);
      logLines.push(`  email: ${data.user.email}`);
      console.log('[Auth] Login SUCCESS, user:', data.user.email);

      const appUser: AppUser = {
        id: data.user.id,
        email: data.user.email || '',
        created_at: data.user.created_at,
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

  // Sign up using Supabase Auth
  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null, debugLog: null });
    
    const supabase = getSupabase();
    if (!supabase) {
      set({ isLoading: false, error: 'Supabase not configured' });
      return false;
    }

    const logLines: string[] = [];
    logLines.push(`[Auth] Sign up with Supabase Auth`);
    logLines.push(`  email: ${email}`);

    try {
      console.log('[Auth] Attempting Supabase Auth signup with email:', email);
      
      // Use Supabase Auth signUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Skip email confirmation for development
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        logLines.push(`[Auth] ERROR:`);
        logLines.push(`  message: ${error.message}`);
        
        console.log('[Auth] SignUp ERROR:', error);
        
        let errorMsg = 'Sign up failed';
        if (error.message.includes('already registered')) {
          errorMsg = 'This email is already registered. Please login instead.';
        } else if (error.message.includes('Password')) {
          errorMsg = error.message;
        } else {
          errorMsg = error.message;
        }
        
        set({ isLoading: false, error: errorMsg, debugLog: logLines.join('\n') });
        return false;
      }

      if (!data.user) {
        logLines.push(`[Auth] No user returned`);
        set({ isLoading: false, error: 'Sign up failed', debugLog: logLines.join('\n') });
        return false;
      }

      // Check if email confirmation is required
      if (data.user.identities && data.user.identities.length === 0) {
        logLines.push(`[Auth] Email already exists`);
        set({ isLoading: false, error: 'This email is already registered. Please login instead.', debugLog: logLines.join('\n') });
        return false;
      }

      logLines.push(`[Auth] SUCCESS`);
      logLines.push(`  user_id: ${data.user.id}`);
      logLines.push(`  email: ${data.user.email}`);
      console.log('[Auth] SignUp SUCCESS, user:', data.user.email);

      const appUser: AppUser = {
        id: data.user.id,
        email: data.user.email || '',
        created_at: data.user.created_at,
      };

      // Save user to AsyncStorage for session persistence
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      
      set({ user: appUser, isLoading: false, debugLog: logLines.join('\n') });
      return true;

    } catch (err: any) {
      logLines.push(`[Auth] EXCEPTION: ${err.message}`);
      console.log('[Auth] SignUp EXCEPTION:', err);
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
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.log('Error signing out:', err);
    }
    set({ user: null });
  },

  checkSession: async () => {
    try {
      // First check AsyncStorage for persisted session
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser) as AppUser;
        console.log('[Auth] Restored session for user:', user.email);
        set({ user });
        return;
      }

      // Then check Supabase session
      const supabase = getSupabase();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          };
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
          set({ user: appUser });
        }
      }
    } catch (err) {
      console.log('Error checking session:', err);
    }
  },
}));
