'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabaseClient, useSessionContext, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  twoFactorEnabled: boolean;
  signIn: (email: string, password: string, twoFactorToken?: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshTwoFactorStatus: () => Promise<void>;
}

export function useAuth() {
  const supabaseClient = useSupabaseClient();
  const session = useSessionContext();
  const userFromSession = useUser();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!session?.isLoading) {
      setLoading(false);
      setUser(userFromSession);
    }
  }, [session?.isLoading, userFromSession]);

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          await checkTwoFactorStatus(session.user.id);
        } else {
          setTwoFactorEnabled(false);
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Update last_active timestamp
          await supabaseClient
            .from('profiles')
            .update({ last_active: new Date().toISOString() })
            .eq('id', session.user.id);

          // Log the sign-in activity
          await supabaseClient
            .from('activity_logs')
            .insert({
              user_id: session.user.id,
              action: 'user_signed_in',
              details: {
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent
              }
            });

          // Only redirect to dashboard if we're currently on the auth page
          if (window.location.pathname === '/auth' || window.location.pathname === '/') {
            router.push('/dashboard');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabaseClient]);

  const checkTwoFactorStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('two_factor_enabled')
        .eq('id', userId)
        .single();

      if (!error && profile) {
        setTwoFactorEnabled(profile.two_factor_enabled || false);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const refreshTwoFactorStatus = async () => {
    if (user) {
      await checkTwoFactorStatus(user.id);
    }
  };

  const signIn = async (email: string, password: string, twoFactorToken?: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      // Check if user has 2FA enabled
      if (data.user) {
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('two_factor_enabled, two_factor_secret')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profile?.two_factor_enabled) {
          if (!twoFactorToken) {
            await supabaseClient.auth.signOut();
            throw new Error('Two-factor authentication required');
          }
          // In a real implementation, verify the 2FA token here
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    try {
      // Get the current URL to determine the correct redirect URL
      const currentUrl = window.location.origin;
      
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentUrl}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (user) {
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'user_signed_out',
          details: {
            timestamp: new Date().toISOString()
          }
        });
    }

    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    setTwoFactorEnabled(false);
    router.push('/');
  };

  return {
    user,
    loading,
    twoFactorEnabled,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshTwoFactorStatus,
  };
}