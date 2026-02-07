import { supabase } from '@/integrations/supabase/client';

/**
 * Extract the storage path from a full Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/materials/cat/subj/file.pdf"
 *   -> "cat/subj/file.pdf"
 */
export const extractStoragePath = (fileUrl: string): string | null => {
  if (!fileUrl) return null;
  const marker = '/materials/';
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(fileUrl.substring(idx + marker.length));
};

/**
 * Generate a signed URL for a file in the materials bucket.
 * Falls back to the original URL if signing fails.
 * @param fileUrl - The stored file URL (public pattern or path)
 * @param expiresIn - Seconds until expiry (default 1 hour)
 */
export const getSignedFileUrl = async (
  fileUrl: string,
  expiresIn = 3600
): Promise<string> => {
  const path = extractStoragePath(fileUrl);
  if (!path) return fileUrl;

  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.warn('Failed to generate signed URL, falling back:', error?.message);
    return fileUrl;
  }

  return data.signedUrl;
};
