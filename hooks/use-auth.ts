'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { InactivityChecker } from '@/lib/inactivity-checker';
import { SecurityService } from '@/lib/security-service';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const router = useRouter();
  const securityService = SecurityService.getInstance();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkTwoFactorStatus(session.user.id);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          await checkTwoFactorStatus(session.user.id);
        } else {
          setTwoFactorEnabled(false);
        }
        
        // Handle user activity tracking
        if (event === 'SIGNED_IN' && session?.user) {
          // Update last_active timestamp
          await supabase
            .from('profiles')
            .update({ last_active: new Date().toISOString() })
            .eq('id', session.user.id);

          // Respond to any pending inactivity checks
          const inactivityChecker = InactivityChecker.getInstance();
          await inactivityChecker.respondToInactivityCheck(session.user.id);

          // Log the sign-in activity
          await supabase
            .from('activity_logs')
            .insert({
              user_id: session.user.id,
              action: 'user_signed_in',
              details: {
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent
              }
            });

          // Log login attempt
          const ipAddress = await securityService.getClientIP();
          await securityService.logLoginAttempt(
            session.user.email || '',
            true,
            ipAddress || undefined,
            navigator.userAgent
          );

          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Check 2FA status from database
  const checkTwoFactorStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
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

  // Track user activity while they're using the app
  useEffect(() => {
    if (!user) return;

    const updateActivity = async () => {
      await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id);
    };

    // Update activity every 5 minutes while user is active
    const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

    // Update activity on user interactions
    const handleUserActivity = () => {
      updateActivity();
    };

    // Listen for user interactions
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    return () => {
      clearInterval(activityInterval);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
    };
  }, [user]);

  const signIn = async (email: string, password: string, twoFactorToken?: string) => {
    const ipAddress = await securityService.getClientIP();
    
    try {
      // First, try to sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Log failed login attempt
        await securityService.logLoginAttempt(
          email,
          false,
          ipAddress || undefined,
          navigator.userAgent,
          error.message
        );
        throw error;
      }

      // Check if user has 2FA enabled
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('two_factor_enabled, two_factor_secret')
          .eq('id', data.user.id)
          .single();

        if (!profileError && profile?.two_factor_enabled) {
          // If 2FA is enabled but no token provided, throw error
          if (!twoFactorToken) {
            // Sign out the user since they need 2FA
            await supabase.auth.signOut();
            throw new Error('Two-factor authentication required');
          }

          // Verify 2FA token
          const isValidToken = await securityService.verifyCurrentTwoFactor(data.user.id, twoFactorToken);
          
          if (!isValidToken) {
            // Sign out the user since 2FA failed
            await supabase.auth.signOut();
            await securityService.logLoginAttempt(
              email,
              false,
              ipAddress || undefined,
              navigator.userAgent,
              'Invalid 2FA token'
            );
            throw new Error('Invalid two-factor authentication code');
          }

          // Log successful 2FA verification
          await securityService.logSecurityEvent(
            data.user.id,
            '2fa_login_success',
            'info',
            { ip_address: ipAddress },
            ipAddress || undefined,
            navigator.userAgent
          );
        }
      }

      // Navigation will be handled by the auth state change listener
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    // Navigation will be handled by the auth state change listener
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) throw error;
    // Note: The redirect will happen automatically, so we don't need to manually redirect here
  };

  const signOut = async () => {
    if (user) {
      // Log the sign-out activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'user_signed_out',
          details: {
            timestamp: new Date().toISOString()
          }
        });
    }

    const { error } = await supabase.auth.signOut();
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