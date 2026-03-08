/**
 * API Client Abstraction Layer
 * 
 * This module provides a unified interface that mirrors the Supabase SDK.
 * When VITE_SERVER_URL is set, all calls go to your Express server.
 * When not set, calls go through the standard Supabase client.
 * 
 * IMPORTANT: This file does NOT replace src/integrations/supabase/client.ts
 * (which is auto-generated). Instead, components should gradually migrate
 * to use this apiClient for new features or during refactoring.
 * 
 * Usage:
 *   import { apiClient } from '@/lib/apiClient';
 *   
 *   // Auth
 *   const { data, error } = await apiClient.auth.signInWithPassword({ email, password });
 *   
 *   // Database
 *   const { data, error } = await apiClient.from('materials').select('*').eq('category', 'lectie');
 *   
 *   // RPC
 *   const { data } = await apiClient.rpc('get_user_role', { _user_id: '...' });
 *   
 *   // Edge Functions
 *   const { data } = await apiClient.functions.invoke('admin-management', { body: { action: '...' } });
 *   
 *   // Storage
 *   const { data } = await apiClient.storage.from('materials').upload(path, file);
 */

import { supabase } from '@/integrations/supabase/client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string | undefined;

/** Whether the custom server is being used */
export const isCustomServer = (): boolean => {
  return !!SERVER_URL && SERVER_URL.trim().length > 0;
};

// ─── Token Management ──────────────────────────────────────

let _accessToken: string | null = null;

const setToken = (token: string | null) => {
  _accessToken = token;
  if (token) {
    sessionStorage.setItem('lm_server_token', token);
  } else {
    sessionStorage.removeItem('lm_server_token');
  }
};

const getToken = (): string | null => {
  if (_accessToken) return _accessToken;
  return sessionStorage.getItem('lm_server_token');
};

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const serverFetch = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    return { data: null, error: { message: data.error || 'Server error', status: res.status } };
  }
  return { data, error: null };
};

// ─── Query Builder (mirrors Supabase's chained API) ────────

class ServerQueryBuilder {
  private table: string;
  private _select = '*';
  private _filters: Record<string, string> = {};
  private _order: string | null = null;
  private _ascending = false;
  private _limit: number | null = null;
  private _single = false;
  private _head = false;
  private _count: 'exact' | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this._select = columns;
    if (opts?.count) this._count = opts.count;
    if (opts?.head) this._head = opts.head;
    return this;
  }

  eq(column: string, value: any) {
    this._filters[`eq.${column}`] = String(value);
    return this;
  }

  neq(column: string, value: any) {
    this._filters[`neq.${column}`] = String(value);
    return this;
  }

  in(column: string, values: any[]) {
    this._filters[`in.${column}`] = values.join(',');
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order = column;
    this._ascending = opts?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._single = true;
    return this;
  }

  async then(resolve: (value: any) => void) {
    const result = await this._execute();
    resolve(result);
  }

  private async _execute() {
    const params = new URLSearchParams({
      select: this._select,
      ...this._filters,
    });
    if (this._order) {
      params.set('order', this._order);
      params.set('ascending', String(this._ascending));
    }
    if (this._limit) params.set('limit', String(this._limit));

    const { data, error } = await serverFetch(`/api/db/${this.table}?${params}`);

    if (error) return { data: null, error, count: null };

    const rows = data?.data || [];

    if (this._head && this._count === 'exact') {
      return { data: null, error: null, count: data?.count || rows.length };
    }

    if (this._single) {
      return { data: rows[0] || null, error: null };
    }

    return { data: rows, error: null, count: rows.length };
  }
}

// ─── Insert/Update/Delete Builders ─────────────────────────

class ServerInsertBuilder {
  private table: string;
  private records: any[];
  private _returnSelect = false;

  constructor(table: string, records: any[]) {
    this.table = table;
    this.records = records;
  }

  select() {
    this._returnSelect = true;
    return this;
  }

  single() {
    return this;
  }

  async then(resolve: (value: any) => void) {
    const body = this.records.length === 1 ? this.records[0] : this.records;
    const { data, error } = await serverFetch(`/api/db/${this.table}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    resolve({ data: data?.data || null, error });
  }
}

class ServerUpdateBuilder {
  private table: string;
  private updates: any;
  private _filters: Record<string, any> = {};
  private _returnSelect = false;

  constructor(table: string, updates: any) {
    this.table = table;
    this.updates = updates;
  }

  eq(column: string, value: any) {
    this._filters[column] = value;
    return this;
  }

  select() {
    this._returnSelect = true;
    return this;
  }

  single() {
    return this;
  }

  maybeSingle() {
    return this;
  }

  async then(resolve: (value: any) => void) {
    const { data, error } = await serverFetch(`/api/db/${this.table}`, {
      method: 'PUT',
      body: JSON.stringify({ ...this.updates, _filters: this._filters }),
    });
    const rows = data?.data || [];
    resolve({ data: rows.length === 1 ? rows[0] : rows, error });
  }
}

class ServerDeleteBuilder {
  private table: string;
  private _filters: Record<string, any> = {};

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: any) {
    this._filters[column] = value;
    return this;
  }

  async then(resolve: (value: any) => void) {
    const { data, error } = await serverFetch(`/api/db/${this.table}`, {
      method: 'DELETE',
      body: JSON.stringify(this._filters),
    });
    resolve({ data, error });
  }
}

// ─── Server Table Interface ────────────────────────────────

class ServerTable {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', opts?: { count?: 'exact'; head?: boolean }) {
    const qb = new ServerQueryBuilder(this.table);
    return qb.select(columns, opts);
  }

  insert(records: any | any[]) {
    const arr = Array.isArray(records) ? records : [records];
    return new ServerInsertBuilder(this.table, arr);
  }

  update(updates: any) {
    return new ServerUpdateBuilder(this.table, updates);
  }

  delete() {
    return new ServerDeleteBuilder(this.table);
  }
}

// ─── Auth Interface ────────────────────────────────────────

const serverAuth = {
  _listeners: [] as Array<(event: string, session: any) => void>,

  onAuthStateChange(callback: (event: string, session: any) => void) {
    serverAuth._listeners.push(callback);
    // Check for existing token
    const token = getToken();
    if (token) {
      setTimeout(() => callback('SIGNED_IN', { access_token: token, user: null }), 0);
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            serverAuth._listeners = serverAuth._listeners.filter(l => l !== callback);
          },
        },
      },
    };
  },

  async getSession() {
    const token = getToken();
    if (!token) return { data: { session: null }, error: null };
    
    const { data, error } = await serverFetch('/api/auth/me');
    if (error) return { data: { session: null }, error };
    
    return {
      data: {
        session: {
          access_token: token,
          refresh_token: token,
          user: data.user,
        },
      },
      error: null,
    };
  },

  async getUser() {
    const token = getToken();
    if (!token) return { data: { user: null }, error: null };
    
    const { data, error } = await serverFetch('/api/auth/me');
    if (error) return { data: { user: null }, error };
    
    return { data: { user: data.user }, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const { data, error } = await serverFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (error) return { data: null, error };

    setToken(data.access_token);
    const session = {
      access_token: data.access_token,
      refresh_token: data.access_token,
      user: data.user,
    };

    // Notify listeners
    serverAuth._listeners.forEach(l => l('SIGNED_IN', session));

    return { data: { session, user: data.user }, error: null };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    const { data, error } = await serverFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (error) return { data: { user: null }, error };

    setToken(data.access_token);
    return { data: { user: data.user }, error: null };
  },

  async signOut(_opts?: any) {
    setToken(null);
    serverAuth._listeners.forEach(l => l('SIGNED_OUT', null));
    return { error: null };
  },

  async updateUser({ password }: { password: string }) {
    const { data, error } = await serverFetch('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ newPassword: password }),
    });
    return { data, error };
  },

  async setSession({ access_token, refresh_token }: { access_token: string; refresh_token: string }) {
    setToken(access_token);
    return { data: { session: { access_token, refresh_token, user: null } }, error: null };
  },
};

// ─── RPC Interface ─────────────────────────────────────────

const serverRpc = async (functionName: string, params: any) => {
  const { data, error } = await serverFetch(`/api/rpc/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (error) return { data: null, error };
  return { data: data?.data ?? data, error: null };
};

// ─── Functions Interface ───────────────────────────────────

const serverFunctions = {
  async invoke(functionName: string, options?: { body?: any }) {
    const { data, error } = await serverFetch(`/api/functions/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(options?.body || {}),
    });
    return { data, error };
  },
};

// ─── Storage Interface ─────────────────────────────────────

const serverStorage = {
  from(bucket: string) {
    return {
      async upload(filePath: string, file: File, options?: { contentType?: string; upsert?: boolean }) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('path', filePath);

        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${SERVER_URL}/api/storage/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) return { data: null, error: { message: data.error } };
        return { data: { path: data.path || filePath }, error: null };
      },

      getPublicUrl(filePath: string) {
        return {
          data: { publicUrl: `${SERVER_URL}/files/${bucket}/${filePath}` },
        };
      },

      async createSignedUrl(filePath: string, expiresIn: number) {
        const { data, error } = await serverFetch(
          `/api/storage/signed-url?url=${encodeURIComponent(filePath)}&expires=${expiresIn}`
        );
        if (error) return { data: null, error };
        return { data: { signedUrl: data.signedUrl }, error: null };
      },

      async remove(filePaths: string[]) {
        for (const filePath of filePaths) {
          await serverFetch('/api/storage/delete', {
            method: 'DELETE',
            body: JSON.stringify({ bucket, path: filePath }),
          });
        }
        return { data: null, error: null };
      },
    };
  },
};

// ─── Unified Client ────────────────────────────────────────

interface ApiClient {
  auth: typeof serverAuth;
  from: (table: string) => ServerTable | ReturnType<typeof supabase.from>;
  rpc: (fn: string, params?: any) => any;
  functions: typeof serverFunctions;
  storage: typeof serverStorage;
}

const createServerClient = (): ApiClient => ({
  auth: serverAuth,
  from: (table: string) => new ServerTable(table),
  rpc: serverRpc,
  functions: serverFunctions,
  storage: serverStorage,
});

const createSupabaseClient = (): ApiClient => ({
  auth: supabase.auth as any,
  from: (table: string) => supabase.from(table as any) as any,
  rpc: (fn: string, params?: any) => supabase.rpc(fn as any, params) as any,
  functions: supabase.functions as any,
  storage: supabase.storage as any,
});

/**
 * The unified API client.
 * Automatically routes to your Express server (if VITE_SERVER_URL is set)
 * or falls back to Supabase.
 */
export const apiClient: ApiClient = isCustomServer()
  ? createServerClient()
  : createSupabaseClient();

/**
 * Helper to check which backend is active.
 */
export const getBackendInfo = () => ({
  type: isCustomServer() ? 'custom-server' as const : 'supabase' as const,
  url: isCustomServer() ? SERVER_URL : import.meta.env.VITE_SUPABASE_URL,
});
