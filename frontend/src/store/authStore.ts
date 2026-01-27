import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, getSupabaseConfig } from '../lib/supabaseClient';
import { seedDemoData } from '../lib/seedDemo';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setError: (error: string | null) => void;
  demoLogin: () => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user || null }),
  setError: (error) => set({ error }),

  demoLogin: async () => {
    set({ isLoading: true, error: null });
    
    const supabase = getSupabase();
    if (!supabase) {
      set({ isLoading: false, error: 'Supabase not configured' });
      return false;
    }

    const config = getSupabaseConfig();
    if (!config.hasDemoCredentials) {
      set({ isLoading: false, error: 'Demo credentials not configured. Please set EXPO_PUBLIC_DEMO_EMAIL and EXPO_PUBLIC_DEMO_PASSWORD.' });
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: config.demoEmail,
        password: config.demoPassword,
      });

      if (error) {
        set({ isLoading: false, error: `Login failed: ${error.message}. Please check your demo credentials.` });
        return false;
      }

      if (data.user) {
        // Seed demo data
        await seedDemoData(data.user.id);
        set({ user: data.user, session: data.session, isLoading: false });
        return true;
      }

      set({ isLoading: false, error: 'No user returned from login' });
      return false;
    } catch (err: any) {
      set({ isLoading: false, error: `Unexpected error: ${err.message}` });
      return false;
    }
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, session: null });
  },

  checkSession: async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ session, user: session.user });
      }
    } catch (err) {
      console.log('Error checking session:', err);
    }
  },
}));
