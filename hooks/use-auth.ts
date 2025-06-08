'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { InactivityChecker } from '@/lib/inactivity-checker';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
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

          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    // Navigation will be handled by the auth state change listener
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
    router.push('/');
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}