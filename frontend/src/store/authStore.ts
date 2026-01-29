import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, getSupabaseConfig, resetSupabaseInstance } from '../lib/supabaseClient';

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
    console.log('[Auth] Signing out...');
    try {
      // First sign out from Supabase Auth
      const supabase = getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
        console.log('[Auth] Supabase signOut completed');
      }
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('[Auth] Cleared AsyncStorage');
      
      // Reset Supabase instance to prevent stale auth state
      resetSupabaseInstance();
      console.log('[Auth] Reset Supabase instance');
    } catch (err) {
      console.log('[Auth] Error signing out:', err);
    }
    
    // Clear user state
    set({ user: null, error: null, debugLog: null });
    console.log('[Auth] User state cleared');
  },

  checkSession: async () => {
    console.log('[Auth] Checking session...');
    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.log('[Auth] No Supabase client, clearing any cached user');
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null });
        return;
      }

      // IMPORTANT: Trust Supabase session first, not AsyncStorage
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('[Auth] Error getting session:', error.message);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null });
        return;
      }

      if (!session || !session.user) {
        // No valid Supabase session - clear everything
        console.log('[Auth] No valid Supabase session, clearing cached user');
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null });
        return;
      }

      // Valid Supabase session exists - use it
      console.log('[Auth] Valid session found for:', session.user.email);
      const appUser: AppUser = {
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at,
      };
      
      // Update AsyncStorage with current session
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser));
      set({ user: appUser });
      
    } catch (err) {
      console.log('[Auth] Error checking session:', err);
      // On error, clear cached user to be safe
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      set({ user: null });
    }
  },
}));
