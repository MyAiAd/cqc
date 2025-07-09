import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Practice {
  id: string;
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
}

interface UserProfile {
  id: string;
  practice_id: string | null;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'manager' | 'super_admin';
  practice?: Practice;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  practice: Practice | null;
  loading: boolean;
  configError: string | null;
  signIn: (email: string) => Promise<{ error?: unknown }>;
  signOut: () => Promise<void>;
  getCurrentPracticeId: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Check if Supabase is properly configured
  const checkSupabaseConfig = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || 
        supabaseUrl === 'your_supabase_project_url_here' || 
        supabaseKey === 'your_supabase_anon_key_here') {
      return 'Supabase configuration missing. Please create a .env file with your Supabase credentials.';
    }
    return null;
  };

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<boolean> => {
    // Prevent multiple simultaneous fetches
    if (fetchingProfile) {
      console.log('Profile fetch already in progress, skipping...');
      return false;
    }

    setFetchingProfile(true);
    
    try {
      console.log('=== FETCHING USER PROFILE ===');
      console.log('User ID:', userId);
      console.log('Retry count:', retryCount);
      
      // Get current auth user for debugging
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Current auth user:', authUser);
      console.log('Auth user email:', authUser?.email);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });

      console.log('Making Supabase query...');
      const profilePromise = supabase
        .from('users')
        .select(`*`)
        .eq('id', userId)
        .single();

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]);

      console.log('Supabase response:', { profile, error });

      if (error) {
        console.error('=== ERROR FETCHING USER PROFILE ===');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        // If user doesn't exist in our users table, sign out
        if (error.code === 'PGRST116') {
          console.log('User profile not found, signing out');
          await supabase.auth.signOut();
          return false;
        }
        
        // If it's an RLS error and this is a new user, retry once after a delay
        if ((error.code === 'PGRST301' || error.message?.includes('row-level security')) && retryCount === 0) {
          console.log('RLS preventing access - user might be new, will retry once');
          setFetchingProfile(false);
          
          // Wait for trigger to create user record, then retry once
          setTimeout(() => {
            fetchUserProfile(userId, 1);
          }, 3000);
          return false;
        }
        
        // For other errors or after retry, fail gracefully
        console.error('Failed to fetch user profile after retry:', error);
        
        // If this is a token refresh and we already have a profile, don't clear it
        // This prevents losing super admin status due to temporary RLS issues
        if (userProfile && retryCount > 0) {
          console.log('Keeping existing profile due to fetch error during refresh');
          return true; // Return true to indicate we're keeping the existing profile
        }
        
        return false;
      }

      console.log('=== PROFILE FETCHED SUCCESSFULLY ===');
      console.log('Profile data:', profile);

      // If the user is not a super_admin, fetch their practice as well
      if (profile && profile.role !== 'super_admin' && profile.practice_id) {
        console.log('Fetching practice for non-super-admin user...');
        const { data: practice, error: practiceError } = await supabase
          .from('practices')
          .select('*')
          .eq('id', profile.practice_id)
          .single();

        if (practiceError) {
          console.error('Error fetching practice:', practiceError);
        } else {
          console.log('Practice fetched:', practice);
          profile.practice = practice;
        }
      } else if (profile && profile.role === 'super_admin') {
        console.log('Setting Global Practice for super admin');
        // Set a virtual "Global Practice" for super admin users
        profile.practice = {
          id: 'global',
          name: 'Global Practice',
          email_domain: 'global',
          subscription_tier: 'premium' as const
        };
      } else {
        console.log('Skipping practice fetch - no practice_id');
      }

      if (profile) {
        console.log('=== SETTING USER PROFILE ===');
        console.log('Final profile:', profile);
        setUserProfile(profile);
        // Super admins might not have a practice, so handle this gracefully
        setPractice(profile.practice || null);
        console.log('Profile set successfully');
        return true;
      }
      
      console.log('No profile data returned');
      return false;
    } catch (error) {
      console.error('=== EXCEPTION IN FETCHUSERPROFILE ===');
      console.error('Exception:', error);
      return false;
    } finally {
      console.log('=== FETCHUSERPROFILE COMPLETE ===');
      setFetchingProfile(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // Check Supabase configuration first
      const configError = checkSupabaseConfig();
      if (configError) {
        if (mounted) {
          setConfigError(configError);
          setLoading(false);
        }
        return;
      }
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
        setLoading(false);
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        
        console.log('🔥 AUTH STATE CHANGE - Event:', event, 'User:', session?.user?.email);
        console.log('🔥 AUTH STATE CHANGE - Current Profile:', userProfile?.email, userProfile?.role);
        console.log('🔥 AUTH STATE CHANGE - Timestamp:', new Date().toISOString());
        
        // Only set loading for significant auth changes, not token refresh
        if (event !== 'TOKEN_REFRESHED') {
          setLoading(true); // Start loading when auth state changes
        }
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Handling SIGNED_IN event');
          await fetchUserProfile(session.user.id);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Handling TOKEN_REFRESHED event');
          // For token refresh, don't refetch profile or reload anything
          // Just update the user object and keep everything else as-is
          console.log('Token refreshed, keeping existing profile to prevent unnecessary reloads');
          console.log('Keeping existing profile:', userProfile?.email, userProfile?.role);
          // Don't call fetchUserProfile or do any other work - just update the user
        } else if (event === 'SIGNED_OUT') {
          console.log('Handling SIGNED_OUT event');
          setUserProfile(null);
          setPractice(null);
        }
        
        // Only set loading to false for significant auth changes, not token refresh
        if (event !== 'TOKEN_REFRESHED') {
          setLoading(false); // Finish loading after updates
        }
        console.log('=== AUTH STATE CHANGE COMPLETE ===');
      });

      return () => {
        mounted = false;
        subscription?.unsubscribe();
      };
    };

    const unsubscribePromise = initialize();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  const signIn = async (email: string) => {
    try {
      // Normalize email to lowercase for consistent handling
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log('signIn called with email:', email);
      console.log('Normalized email:', normalizedEmail);
      console.log('Supabase client URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Window origin:', window.location.origin);
      
      // Check if Supabase client is properly initialized
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return { error: new Error('Supabase client not initialized') };
      }

      console.log('Calling supabase.auth.signInWithOtp...');
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: window.location.origin || 'http://localhost:5174'
        }
      });

      if (error) {
        console.error('Error in signInWithOtp:', error);
        return { error };
      }

      console.log('Magic link sent successfully');
      return { error: null };
    } catch (error) {
      console.error('Exception in signIn:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    } finally {
      // Always clear local state
      setUser(null);
      setUserProfile(null);
      setPractice(null);
    }
  };

  const getCurrentPracticeId = () => {
    return userProfile?.practice_id || null;
  };

  const value = {
    user,
    userProfile,
    practice,
    loading,
    configError,
    signIn,
    signOut,
    getCurrentPracticeId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 