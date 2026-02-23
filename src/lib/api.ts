/**
 * Centralized API layer for communicating with Edge Functions.
 * All backend calls go through this module — no direct Supabase usage in frontend.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Session token management
let sessionToken: string | null = null;
let refreshToken: string | null = null;

export function setSession(access_token: string, refresh_token: string) {
  sessionToken = access_token;
  refreshToken = refresh_token;
  localStorage.setItem('lm_session', JSON.stringify({ access_token, refresh_token }));
}

export function clearSession() {
  sessionToken = null;
  refreshToken = null;
  localStorage.removeItem('lm_session');
}

export function getSessionToken(): string | null {
  if (sessionToken) return sessionToken;
  const stored = localStorage.getItem('lm_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      sessionToken = parsed.access_token;
      refreshToken = parsed.refresh_token;
      return sessionToken;
    } catch {
      return null;
    }
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  const stored = localStorage.getItem('lm_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      refreshToken = parsed.refresh_token;
      return refreshToken;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Call an Edge Function with automatic Bearer token injection.
 */
async function callEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: { noAuth?: boolean }
): Promise<{ data: T | null; error: string | null }> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };

  if (!options?.noAuth) {
    const token = getSessionToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || `HTTP ${response.status}` };
    }

    if (data.error) {
      return { data: null, error: data.error };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

// ──────────────────────── Auth API ────────────────────────

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
  profile: {
    id: string;
    user_id: string;
    username: string;
    full_name: string | null;
  } | null;
  role: 'student' | 'profesor' | 'admin' | null;
}

export async function apiLogin(username: string, hashedPassword: string): Promise<{ data: AuthSession | null; error: string | null }> {
  return callEdgeFunction('auth-api', {
    action: 'login',
    username,
    password: hashedPassword,
  }, { noAuth: true });
}

export async function apiGetProfile(): Promise<{ data: { profile: any; role: string } | null; error: string | null }> {
  return callEdgeFunction('auth-api', { action: 'get-profile' });
}

export async function apiRefreshSession(): Promise<{ data: AuthSession | null; error: string | null }> {
  const rt = getRefreshToken();
  if (!rt) return { data: null, error: 'No refresh token' };
  return callEdgeFunction('auth-api', {
    action: 'refresh',
    refresh_token: rt,
  }, { noAuth: true });
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<{ data: any; error: string | null }> {
  return callEdgeFunction('auth-api', {
    action: 'change-password',
    currentPassword,
    newPassword,
  });
}

export async function apiSignOut(): Promise<{ data: any; error: string | null }> {
  const result = await callEdgeFunction('auth-api', { action: 'sign-out' });
  clearSession();
  return result;
}

// ──────────────────────── Admin API (existing edge function) ────────────────────────

export async function apiAdminAction(body: Record<string, any>) {
  return callEdgeFunction('admin-management', body);
}

export async function apiCreateUser(body: Record<string, any>) {
  return callEdgeFunction('create-user', body);
}

export async function apiVerifyQuizAnswers(body: Record<string, any>) {
  return callEdgeFunction('verify-quiz-answers', body);
}

export { callEdgeFunction };
