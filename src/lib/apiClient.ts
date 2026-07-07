/**
 * API Client Abstraction Layer
 *
 * This module provides a unified interface that mirrors the Supabase SDK.
 * When VITE_SERVER_URL is set, calls may go to your Express server.
 * If that server is unavailable, calls automatically fall back to Supabase.
 *
 * IMPORTANT: This file does NOT replace src/integrations/supabase/client.ts
 * (which is auto-generated). Instead, components should gradually migrate
 * to use this apiClient for new features or during refactoring.
 */

import { supabase as cloudClient } from '@/integrations/supabase/client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string | undefined;

const hasConfiguredCustomServer = (): boolean => {
  return !!SERVER_URL && SERVER_URL.trim().length > 0 && SERVER_URL !== 'undefined';
};

let customServerEnabled = hasConfiguredCustomServer();

/** Whether the custom server is currently active */
export const isCustomServer = (): boolean => {
  return customServerEnabled && hasConfiguredCustomServer();
};

export const disableCustomServer = (reason?: unknown) => {
  if (!customServerEnabled) return;
  customServerEnabled = false;
  console.warn('Custom server unavailable, falling back to Supabase.', reason);
};

const isNetworkFailure = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const message = 'message' in error ? String((error as any).message ?? '') : '';
  const name = 'name' in error ? String((error as any).name ?? '') : '';
  return (
    name === 'TypeError' ||
    /Failed to fetch|Load failed|NetworkError|fetch/i.test(message)
  );
};

const shouldFallbackToCloud = (error: any): boolean => {
  return Boolean(error?.isNetworkFailure);
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
  try {
    const res = await fetch(`${SERVER_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...options.headers },
    });

    const data = await res.json();
    if (!res.ok) {
      return { data: null, error: { message: data.error || 'Server error', status: res.status } };
    }

    return { data, error: null };
  } catch (error) {
    if (isNetworkFailure(error)) {
      disableCustomServer(error);
      return {
        data: null,
        error: {
          message: 'Custom server unavailable',
          status: 0,
          isNetworkFailure: true,
        },
      };
    }

    throw error;
  }
};

// ─── Query Builder (mirrors Supabase's chained API) ────────

type QueryFilter = {
  op: 'eq' | 'neq' | 'in';
  column: string;
  value: any;
};

class ServerQueryBuilder {
  private table: string;
  private _select = '*';
  private _filters: QueryFilter[] = [];
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
    this._filters.push({ op: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push({ op: 'neq', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this._filters.push({ op: 'in', column, value: values });
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

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (error) {
      reject?.(error);
    }
  }

  private buildCloudQuery() {
    let query: any = cloudClient
      .from(this.table as any)
      .select(this._select as any, {
        count: this._count ?? undefined,
        head: this._head,
      });

    for (const filter of this._filters) {
      if (filter.op === 'eq') query = query.eq(filter.column, filter.value);
      if (filter.op === 'neq') query = query.neq(filter.column, filter.value);
      if (filter.op === 'in') query = query.in(filter.column, filter.value);
    }

    if (this._order) {
      query = query.order(this._order, { ascending: this._ascending });
    }

    if (this._limit) {
      query = query.limit(this._limit);
    }

    if (this._single) {
      query = query.maybeSingle();
    }

    return query;
  }

  private async executeWithCloud() {
    const { data, error, count } = await this.buildCloudQuery();

    if (error) return { data: null, error, count: null };

    if (this._head && this._count === 'exact') {
      return { data: null, error: null, count: count ?? 0 };
    }

    if (this._single) {
      return { data: data ?? null, error: null };
    }

    return {
      data: Array.isArray(data) ? data : data ? [data] : [],
      error: null,
      count: count ?? (Array.isArray(data) ? data.length : data ? 1 : 0),
    };
  }

  private async _execute() {
    if (isCustomServer()) {
      const params = new URLSearchParams({ select: this._select });

      for (const filter of this._filters) {
        const value = filter.op === 'in' && Array.isArray(filter.value)
          ? filter.value.join(',')
          : String(filter.value);
        params.set(`${filter.op}.${filter.column}`, value);
      }

      if (this._order) {
        params.set('order', this._order);
        params.set('ascending', String(this._ascending));
      }
      if (this._limit) params.set('limit', String(this._limit));

      const { data, error } = await serverFetch(`/api/db/${this.table}?${params}`);

      if (!error) {
        const rows = data?.data || [];

        if (this._head && this._count === 'exact') {
          return { data: null, error: null, count: data?.count || rows.length };
        }

        if (this._single) {
          return { data: rows[0] || null, error: null };
        }

        return { data: rows, error: null, count: rows.length };
      }

      if (!shouldFallbackToCloud(error)) {
        return { data: null, error, count: null };
      }
    }

    return this.executeWithCloud();
  }
}

// ─── Insert/Update/Delete Builders ─────────────────────────

class ServerInsertBuilder {
  private table: string;
  private records: any[];
  private _returnSelect = false;
  private _single = false;

  constructor(table: string, records: any[]) {
    this.table = table;
    this.records = records;
  }

  select() {
    this._returnSelect = true;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (error) {
      reject?.(error);
    }
  }

  private async _execute() {
    if (isCustomServer()) {
      const body = this.records.length === 1 ? this.records[0] : this.records;
      const { data, error } = await serverFetch(`/api/db/${this.table}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!error) {
        const payload = data?.data || null;
        const normalized = this._single && Array.isArray(payload) ? (payload[0] ?? null) : payload;
        return { data: normalized, error: null };
      }

      if (!shouldFallbackToCloud(error)) {
        return { data: null, error };
      }
    }

    let query: any = cloudClient.from(this.table as any).insert(this.records as any);
    if (this._returnSelect) query = query.select();
    const { data, error } = await query;

    if (error) return { data: null, error };

    const normalized = this._single
      ? (Array.isArray(data) ? (data[0] ?? null) : (data ?? null))
      : (data ?? null);

    return { data: normalized, error: null };
  }
}

class ServerUpdateBuilder {
  private table: string;
  private updates: any;
  private _filters: Record<string, any> = {};
  private _returnSelect = false;
  private _single = false;

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
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._single = true;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (error) {
      reject?.(error);
    }
  }

  private async _execute() {
    if (isCustomServer()) {
      const { data, error } = await serverFetch(`/api/db/${this.table}`, {
        method: 'PUT',
        body: JSON.stringify({ ...this.updates, _filters: this._filters }),
      });

      if (!error) {
        const rows = data?.data || [];
        const normalized = this._single
          ? (Array.isArray(rows) ? (rows[0] ?? null) : (rows ?? null))
          : rows;
        return { data: normalized, error: null };
      }

      if (!shouldFallbackToCloud(error)) {
        return { data: null, error };
      }
    }

    let query: any = cloudClient.from(this.table as any).update(this.updates as any);
    for (const [column, value] of Object.entries(this._filters)) {
      query = query.eq(column, value);
    }
    if (this._returnSelect) query = query.select();
    if (this._single) query = query.maybeSingle();

    const { data, error } = await query;
    if (error) return { data: null, error };
    return { data: data ?? null, error: null };
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

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (error) {
      reject?.(error);
    }
  }

  private async _execute() {
    if (isCustomServer()) {
      const { data, error } = await serverFetch(`/api/db/${this.table}`, {
        method: 'DELETE',
        body: JSON.stringify(this._filters),
      });

      if (!error) {
        return { data, error: null };
      }

      if (!shouldFallbackToCloud(error)) {
        return { data: null, error };
      }
    }

    let query: any = cloudClient.from(this.table as any).delete();
    for (const [column, value] of Object.entries(this._filters)) {
      query = query.eq(column, value);
    }

    const { data, error } = await query;
    return { data: data ?? null, error };
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

    serverAuth._listeners.forEach(l => l('SIGNED_IN', session));

    return { data: { session, user: data.user }, error: null };
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    const { data, error } = await serverFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, options }),
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

const hybridAuth = {
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return isCustomServer()
      ? serverAuth.onAuthStateChange(callback)
      : cloudClient.auth.onAuthStateChange(callback);
  },

  async getSession() {
    if (isCustomServer()) {
      const result = await serverAuth.getSession();
      if (!shouldFallbackToCloud(result.error)) return result;
    }
    return cloudClient.auth.getSession();
  },

  async getUser() {
    if (isCustomServer()) {
      const result = await serverAuth.getUser();
      if (!shouldFallbackToCloud(result.error)) return result;
    }
    return cloudClient.auth.getUser();
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    if (isCustomServer()) {
      const result = await serverAuth.signInWithPassword(credentials);
      if (!shouldFallbackToCloud(result.error)) return result;
    }
    return cloudClient.auth.signInWithPassword(credentials);
  },

  async signUp(credentials: { email: string; password: string; options?: any }) {
    if (isCustomServer()) {
      const result = await serverAuth.signUp(credentials);
      if (!shouldFallbackToCloud(result.error)) return result;
    }
    return cloudClient.auth.signUp(credentials);
  },

  async signOut(opts?: any) {
    if (isCustomServer()) {
      await serverAuth.signOut(opts);
    }
    return cloudClient.auth.signOut(opts);
  },

  async updateUser(payload: { password: string }) {
    if (isCustomServer()) {
      const result = await serverAuth.updateUser(payload);
      if (!shouldFallbackToCloud(result.error)) return result;
    }
    return cloudClient.auth.updateUser(payload);
  },

  async setSession(session: { access_token: string; refresh_token: string }) {
    if (isCustomServer()) {
      return serverAuth.setSession(session);
    }
    return cloudClient.auth.setSession(session);
  },
};

// ─── RPC Interface ─────────────────────────────────────────

const hybridRpc = async (functionName: string, params: any) => {
  if (isCustomServer()) {
    const { data, error } = await serverFetch(`/api/rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!error) return { data: data?.data ?? data, error: null };
    if (!shouldFallbackToCloud(error)) return { data: null, error };
  }

  return cloudClient.rpc(functionName as any, params);
};

// ─── Functions Interface ───────────────────────────────────

const hybridFunctions = {
  async invoke(functionName: string, options?: { body?: any }) {
    if (isCustomServer()) {
      const { data, error } = await serverFetch(`/api/functions/${functionName}`, {
        method: 'POST',
        body: JSON.stringify(options?.body || {}),
      });

      if (!error) return { data, error: null };
      if (!shouldFallbackToCloud(error)) return { data: null, error };
    }

    return cloudClient.functions.invoke(functionName, options);
  },
};

// ─── Storage Interface ─────────────────────────────────────

const hybridStorage = {
  from(bucket: string) {
    return {
      async upload(filePath: string, file: File, options?: { contentType?: string; upsert?: boolean }) {
        if (isCustomServer()) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('bucket', bucket);
          formData.append('path', filePath);

          try {
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
          } catch (error) {
            if (!isNetworkFailure(error)) throw error;
            disableCustomServer(error);
          }
        }

        return cloudClient.storage.from(bucket).upload(filePath, file, options);
      },

      getPublicUrl(filePath: string) {
        if (isCustomServer()) {
          return {
            data: { publicUrl: `${SERVER_URL}/files/${bucket}/${filePath}` },
          };
        }

        return cloudClient.storage.from(bucket).getPublicUrl(filePath);
      },

      async createSignedUrl(filePath: string, expiresIn: number) {
        if (isCustomServer()) {
          const { data, error } = await serverFetch(
            `/api/storage/signed-url?url=${encodeURIComponent(filePath)}&expires=${expiresIn}`
          );

          if (!error) return { data: { signedUrl: data.signedUrl }, error: null };
          if (!shouldFallbackToCloud(error)) return { data: null, error };
        }

        return cloudClient.storage.from(bucket).createSignedUrl(filePath, expiresIn);
      },

      async remove(filePaths: string[]) {
        if (isCustomServer()) {
          for (const filePath of filePaths) {
            const { error } = await serverFetch('/api/storage/delete', {
              method: 'DELETE',
              body: JSON.stringify({ bucket, path: filePath }),
            });

            if (error && !shouldFallbackToCloud(error)) {
              return { data: null, error };
            }
          }

          if (isCustomServer()) {
            return { data: null, error: null };
          }
        }

        return cloudClient.storage.from(bucket).remove(filePaths);
      },
    };
  },
};

// ─── Unified Client ────────────────────────────────────────

interface ApiClient {
  auth: typeof hybridAuth;
  from: (table: string) => ServerTable | ReturnType<typeof cloudClient.from>;
  rpc: (fn: string, params?: any) => any;
  functions: typeof hybridFunctions;
  storage: typeof hybridStorage;
}

/**
 * The unified API client.
 * Automatically tries the custom server first (if configured)
 * and falls back to Supabase when that server is unreachable.
 */
export const apiClient: ApiClient = {
  auth: hybridAuth,
  from: (table: string) => (isCustomServer() ? new ServerTable(table) : (cloudClient.from(table as any) as any)),
  rpc: hybridRpc,
  functions: hybridFunctions,
  storage: hybridStorage,
};

/**
 * Helper to check which backend is active.
 */
export const getBackendInfo = () => ({
  type: isCustomServer() ? 'custom-server' as const : 'supabase' as const,
  url: isCustomServer() ? SERVER_URL : import.meta.env.VITE_SUPABASE_URL,
});
