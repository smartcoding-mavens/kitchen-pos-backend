import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const signIn = async (email: string, password: string) => {
  // Check if this is a demo credential attempt
  const demoCredentials = [
    { email: 'admin@teetours.com', password: 'admin123' },
    { email: 'owner@restaurant.com', password: 'owner123' }
  ];
  
  const isDemoCredential = demoCredentials.some(
    cred => cred.email === email && cred.password === password
  );
  
  // First try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  // If login fails with invalid credentials and it's a demo credential, try to create the user
  if (error && error.message.includes('Invalid login credentials') && isDemoCredential) {
    console.log('Demo user not found, attempting to create:', email);
    
    // Try to create the demo user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (signUpError) {
      console.error('Failed to create demo user:', signUpError);
      return { data: null, error };
    }
    
    // If user was created successfully, try to sign in again
    if (signUpData.user) {
      console.log('Demo user created successfully, signing in:', email);
      return await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }
  }
  
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return profile;
};

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
};