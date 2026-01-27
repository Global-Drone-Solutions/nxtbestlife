import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const demoEmail = process.env.EXPO_PUBLIC_DEMO_EMAIL || '';
  const demoPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD || '';

  return {
    url,
    anonKey,
    demoEmail,
    demoPassword,
    isConfigured: !!(url && anonKey),
    hasDemoCredentials: !!(demoEmail && demoPassword),
  };
};

export const initSupabase = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    console.log('Supabase not configured: missing URL or anon key');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
};

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
};

export const resetSupabaseInstance = () => {
  supabaseInstance = null;
};
