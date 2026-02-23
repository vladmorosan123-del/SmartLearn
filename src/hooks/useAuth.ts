import { useState, useEffect, useCallback } from 'react';
import {
  apiLogin,
  apiGetProfile,
  apiRefreshSession,
  apiSignOut,
  setSession,
  clearSession,
  getSessionToken,
} from '@/lib/api';
import { hashPassword } from '@/lib/hashPassword';

export type AppRole = 'student' | 'profesor' | 'admin' | null;

interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
}

interface SimpleUser {
  id: string;
  email: string;
}

interface AuthState {
  user: SimpleUser | null;
  profile: Profile | null;
  role: AppRole;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    isLoading: true,
  });

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = getSessionToken();
      if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Try to get profile with existing token
      const { data, error } = await apiGetProfile();
      if (error || !data) {
        // Token might be expired, try refresh
        const refreshResult = await apiRefreshSession();
        if (refreshResult.error || !refreshResult.data) {
          clearSession();
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Refresh succeeded
        setSession(refreshResult.data.access_token, refreshResult.data.refresh_token);
        setAuthState({
          user: refreshResult.data.user,
          profile: refreshResult.data.profile,
          role: refreshResult.data.role as AppRole,
          isLoading: false,
        });
        return;
      }

      // We have profile data but need to reconstruct user from stored session
      const stored = localStorage.getItem('lm_session');
      let user: SimpleUser | null = null;
      if (stored) {
        try {
          // Decode JWT to get user id
          const payload = JSON.parse(atob(token.split('.')[1]));
          user = { id: payload.sub, email: payload.email || '' };
        } catch {
          // fallback
        }
      }

      setAuthState({
        user: user || { id: data.profile?.user_id || '', email: '' },
        profile: data.profile,
        role: data.role as AppRole,
        isLoading: false,
      });
    };

    restoreSession();
  }, []);

  const signInWithUsername = useCallback(async (username: string, password: string) => {
    const hashed = await hashPassword(password);
    const { data, error } = await apiLogin(username.trim(), hashed);

    if (error || !data) {
      return { error: { message: error || 'Eroare de autentificare' } };
    }

    // Store session
    setSession(data.access_token, data.refresh_token);

    setAuthState({
      user: data.user,
      profile: data.profile,
      role: data.role as AppRole,
      isLoading: false,
    });

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    // Clear local state immediately
    setAuthState({
      user: null,
      profile: null,
      role: null,
      isLoading: false,
    });

    clearSession();

    // Also clear any sessionStorage keys
    const keysToRemove = Object.keys(sessionStorage).filter(
      key => key.startsWith('sb-') || key.startsWith('supabase.')
    );
    keysToRemove.forEach(key => sessionStorage.removeItem(key));

    try {
      await apiSignOut();
    } catch (e) {
      console.error('Sign out API error:', e);
    }

    return { error: null };
  }, []);

  return {
    ...authState,
    session: getSessionToken() ? { access_token: getSessionToken() } : null,
    signInWithUsername,
    signOut,
    isAuthenticated: !!getSessionToken() && !!authState.user,
  };
};
