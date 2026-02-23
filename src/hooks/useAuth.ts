import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { hashPassword } from '@/lib/hashPassword';

export type AppRole = 'student' | 'profesor' | 'admin' | null;

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

  // Restore session from localStorage on mount (since persistSession is false)
  useEffect(() => {
    const stored = localStorage.getItem('lm_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
      } catch {
        localStorage.removeItem('lm_session');
      }
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Persist session for refresh survival
        if (session) {
          localStorage.setItem('lm_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }));
        } else {
          localStorage.removeItem('lm_session');
        }

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

      // Check if user is blocked
      if (profile && (profile as any).is_blocked) {
        // Sign out blocked users
        await supabase.auth.signOut();
        setAuthState(prev => ({
          ...prev,
          user: null,
          session: null,
          profile: null,
          role: null,
          isLoading: false,
        }));
        return;
      }

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
    const hashed = await hashPassword(password);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: hashed,
    });
    return { error };
  };

  const signInWithUsername = async (username: string, password: string) => {
    const email = `${username}@lm.local`;
    const hashed = await hashPassword(password);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: hashed,
    });

    if (error) {
      // Translate the error message
      if (error.message === 'Invalid login credentials') {
        return { error: { message: 'Nume de utilizator sau parolă incorectă' } };
      }
      return { error };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string, role: AppRole = 'student') => {
    const redirectUrl = `${window.location.origin}/`;
    const hashed = await hashPassword(password);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: hashed,
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
    // Force clear local state immediately regardless of API result
    setAuthState({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: false,
    });

    // Clear persisted session and auth tokens
    localStorage.removeItem('lm_session');
    const keysToRemove = Object.keys(sessionStorage).filter(
      key => key.startsWith('sb-') || key.startsWith('supabase.')
    );
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    try {
      // Use global scope to invalidate the session on the server too
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      // Even if API fails, local state and storage are already cleared
      console.error('Sign out API error:', e);
    }
    return { error: null };
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
