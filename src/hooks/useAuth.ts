import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'student' | 'profesor' | null;

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer profile/role fetching to prevent deadlocks
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            role: null,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch role using security definer function
      const { data: role } = await supabase.rpc('get_user_role', { _user_id: userId });

      setAuthState(prev => ({
        ...prev,
        profile: profile as Profile | null,
        role: role as AppRole,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithUsername = async (username: string, password: string) => {
    // First, find the user by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return { error: { message: 'Utilizator inexistent' } };
    }

    // Get user email from auth (we need to use a workaround since we can't directly query auth.users)
    // Instead, we'll use a convention: email = username@lm.local
    const email = `${username}@lm.local`;
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string, role: AppRole = 'student') => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error || !data.user) {
      return { error, user: null };
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: data.user.id,
      username,
      full_name: fullName || null,
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { error: profileError, user: null };
    }

    // Assign role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: data.user.id,
      role: role,
    });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return { error: roleError, user: null };
    }

    return { error: null, user: data.user };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    isAuthenticated: !!authState.session,
  };
};
