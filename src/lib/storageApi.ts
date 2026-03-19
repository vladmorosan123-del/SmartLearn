/**
 * Storage API Abstraction Layer
 * 
 * Routes all file operations through either:
 * - A custom server (when VITE_SERVER_URL is set)
 * - Supabase Storage (fallback, current default)
 * 
 * When you have your own server, set VITE_SERVER_URL in .env
 * and the app will automatically route all file operations there.
 */

import { supabase } from '@/integrations/supabase/client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL as string | undefined;

/** Whether a custom server is configured */
export const isCustomServerEnabled = (): boolean => {
  return !!SERVER_URL && SERVER_URL.trim().length > 0 && SERVER_URL !== 'undefined';
};

/**
 * Get the authorization header for custom server requests.
 * Sends the current Supabase JWT so the server can verify identity.
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

// ─── UPLOAD ────────────────────────────────────────────────

export interface UploadResult {
  /** Public or accessible URL of the uploaded file */
  url: string;
  /** Storage path (bucket-relative) */
  path: string;
}

/**
 * Upload a file to storage.
 * @param bucket   - Storage bucket name (e.g. "materials")
 * @param filePath - Path inside the bucket (e.g. "lectii/romana/123_file.pdf")
 * @param file     - The File object
 * @param contentType - MIME type
 */
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File,
  contentType: string,
): Promise<UploadResult> => {
  if (isCustomServerEnabled()) {
    // ── Custom server upload ──
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', filePath);

    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${SERVER_URL}/api/storage/upload`, {
      method: 'POST',
      headers: { ...authHeaders },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Upload failed: ${res.status} – ${body}`);
    }

    const data = await res.json();
    return { url: data.url, path: data.path ?? filePath };
  }

  // ── Supabase Storage (default) ──
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { contentType, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
};

// ─── GET ACCESSIBLE URL (signed or direct) ─────────────────

/**
 * Get a viewable/downloadable URL for a stored file.
 * For the custom server this calls an endpoint that returns a temporary link.
 * For Supabase Storage this generates a signed URL.
 *
 * @param fileUrl   - The stored file URL (as saved in DB)
 * @param expiresIn - Seconds until expiry (default 1 hour)
 */
export const getAccessibleFileUrl = async (
  fileUrl: string,
  expiresIn = 3600,
): Promise<string> => {
  if (isCustomServerEnabled()) {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(
      `${SERVER_URL}/api/storage/signed-url?` +
        new URLSearchParams({ url: fileUrl, expires: String(expiresIn) }),
      { headers: authHeaders },
    );

    if (!res.ok) return fileUrl; // fallback
    const data = await res.json();
    return data.signedUrl ?? fileUrl;
  }

  // ── Supabase signed URL (default) ──
  const { extractStoragePath } = await import('@/lib/storage');
  const path = extractStoragePath(fileUrl);
  if (!path) return fileUrl;

  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) return fileUrl;
  return data.signedUrl;
};

// ─── DELETE ────────────────────────────────────────────────

/**
 * Delete a file from storage.
 * @param bucket  - Storage bucket name
 * @param filePath - Path inside the bucket
 */
export const deleteFile = async (
  bucket: string,
  filePath: string,
): Promise<void> => {
  if (isCustomServerEnabled()) {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${SERVER_URL}/api/storage/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ bucket, path: filePath }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Delete failed: ${res.status} – ${body}`);
    }
    return;
  }

  // ── Supabase Storage (default) ──
  await supabase.storage.from(bucket).remove([filePath]);
};
